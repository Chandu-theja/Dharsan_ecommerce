'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Loader2, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

function evaluatePassword(pw: string) {
  return {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

function strengthScore(pw: string) {
  const c = evaluatePassword(pw);
  const passed = [c.length, c.letter, c.number, c.symbol].filter(Boolean).length;
  if (pw.length === 0) return 0;
  if (pw.length < 8) return 1;
  return passed; // 1..4
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const pwChecks = useMemo(() => evaluatePassword(form.password), [form.password]);
  const pwStrength = useMemo(() => strengthScore(form.password), [form.password]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateClient = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit Indian mobile number';
    const c = evaluatePassword(form.password);
    if (!c.length || !c.letter || !c.number || !c.symbol) {
      errs.password = 'Password must be 8+ chars with a letter, number and symbol';
    }
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match';
    if (!form.acceptedTerms) errs.acceptedTerms = 'Please accept the terms to continue';
    return errs;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientErrs = validateClient();
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      let data: { error?: string; field?: string; success?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse error
      }

      if (!res.ok) {
        if (data.field && (data.field === 'name' || data.field === 'email' || data.field === 'phone' || data.field === 'password')) {
          setErrors({ [data.field]: data.error });
        } else {
          toast.error(data.error || `Registration failed (status ${res.status})`);
        }
        return;
      }

      toast.success('Account created! Signing you in…');
      const signInRes = await signIn('credentials', {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.error('Account created, but auto sign-in failed. Please sign in manually.');
        router.push('/login');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 35px, #C8991E 35px, #C8991E 36px)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          <Image
            src="/images/logo.png"
            alt="Dharsan Dresses"
            width={180}
            height={180}
            className="rounded-full mb-8 shadow-2xl"
          />
          <h1 className="font-display text-5xl font-light text-white mb-4">
            Join the <span className="text-gold-gradient italic font-medium">Family</span>
          </h1>
          <p className="font-body text-base text-navy-200 max-w-md">
            Create your account to enjoy faster checkout, order tracking, and exclusive offers.
          </p>
          <div className="mt-12 flex items-center gap-3">
            <div className="w-16 h-px bg-gold-500/60" />
            <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase">
              Best Clothes • Best Stitch
            </p>
            <div className="w-16 h-px bg-gold-500/60" />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/images/logo.png"
              alt="Dharsan Dresses"
              width={80}
              height={80}
              className="rounded-full mx-auto mb-3"
            />
            <h2 className="font-display text-2xl font-semibold text-navy-900">Dharsan Dresses</h2>
          </div>

          <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Create Account</h2>
          <p className="font-body text-sm text-gray-600 mb-8">
            Welcome! It only takes a minute to get started.
          </p>

          <form onSubmit={handleRegister} noValidate className="space-y-4">
            <Field
              label="Full Name"
              error={errors.name}
              input={
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Anjali Reddy"
                  className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                />
              }
            />

            <Field
              label="Email Address"
              error={errors.email}
              input={
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`input-field ${errors.email ? 'border-red-400' : ''}`}
                />
              }
            />

            <Field
              label="Mobile Number"
              error={errors.phone}
              input={
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-gray-500 pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className={`input-field pl-12 ${errors.phone ? 'border-red-400' : ''}`}
                  />
                </div>
              }
            />

            <Field
              label="Password"
              error={errors.password}
              input={
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              }
              extra={
                form.password.length > 0 && (
                  <PasswordHelper checks={pwChecks} strength={pwStrength} />
                )
              }
            />

            <Field
              label="Confirm Password"
              error={errors.confirmPassword}
              input={
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              }
            />

            <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(e) => update('acceptedTerms', e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-navy-300 text-gold-600 focus:ring-gold-500"
              />
              <span className="font-body text-xs text-gray-600 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-gold-700 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gold-700 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptedTerms && (
              <p className="font-body text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.acceptedTerms}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Account
            </button>
          </form>

          <p className="text-center mt-6 font-body text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-600 hover:text-gold-700 font-semibold">
              Sign in
            </Link>
          </p>

          <div className="mt-8 text-center">
            <Link href="/" className="font-body text-xs text-gray-500 hover:text-gold-600">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  input,
  error,
  extra,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {input}
      {error && (
        <p className="mt-1.5 font-body text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      {extra}
    </div>
  );
}

function PasswordHelper({
  checks,
  strength,
}: {
  checks: { length: boolean; letter: boolean; number: boolean; symbol: boolean };
  strength: number;
}) {
  const labels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-600'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full ${i <= strength ? colors[strength] : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <span className="font-body text-[10px] uppercase tracking-wider text-gray-500 w-12 text-right">
          {labels[strength]}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 font-body text-[11px]">
        <Rule ok={checks.length} text="8+ characters" />
        <Rule ok={checks.letter} text="A letter" />
        <Rule ok={checks.number} text="A number" />
        <Rule ok={checks.symbol} text="A symbol" />
      </ul>
    </div>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-green-700' : 'text-gray-500'}`}>
      {ok ? <Check size={11} /> : <X size={11} className="text-gray-400" />}
      {text}
    </li>
  );
}
