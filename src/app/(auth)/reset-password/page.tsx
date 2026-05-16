'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

// Same strength calc as register page — keep behaviour consistent.
function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Za-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const email = (params.get('email') || '').toLowerCase();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = useMemo(() => passwordStrength(password), [password]);
  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const strengthColor = ['bg-red-400', 'bg-red-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'][score];

  const linkInvalid = !token || token.length < 32 || !email;

  const rules = [
    { ok: password.length >= 8,            label: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(password),       label: 'Includes a letter' },
    { ok: /\d/.test(password),             label: 'Includes a number' },
    { ok: /[^A-Za-z0-9]/.test(password),   label: 'Includes a symbol' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (score < 4) { setError('Please choose a stronger password.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not reset password.');
        toast.error(data.error || 'Reset failed');
        return;
      }
      setDone(true);
      toast.success('Password updated. Please sign in.');
      setTimeout(() => router.push('/login'), 1800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          <Image src="/images/logo.png" alt="Dharsan Dresses" width={160} height={160} className="rounded-full mb-8 shadow-2xl" />
          <h1 className="font-display text-5xl font-light text-white mb-4">
            Choose a new <span className="text-gold-gradient italic font-medium">password</span>
          </h1>
          <p className="font-body text-base text-navy-200 max-w-md">
            Pick something memorable but unique. Use a mix of letters, numbers, and a symbol.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Image src="/images/logo.png" alt="Dharsan Dresses" width={70} height={70} className="rounded-full mx-auto mb-3" />
            <h2 className="font-display text-2xl font-semibold text-navy-900">Dharsan Dresses</h2>
          </div>

          {linkInvalid ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 border border-red-200 mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Invalid reset link</h2>
              <p className="font-body text-sm text-gray-600 mb-6">
                This password reset link is missing required information. Request a new one.
              </p>
              <Link href="/forgot-password" className="btn-primary inline-block">
                Request new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border border-green-200 mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Password updated</h2>
              <p className="font-body text-sm text-gray-600">Redirecting to sign in…</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">New password</h2>
              <p className="font-body text-sm text-gray-600 mb-8">
                Resetting password for <strong>{email}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters, with a number and symbol"
                      className="input-field pr-10"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  <div className="mt-2 flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`flex-1 h-1 rounded ${i < score ? strengthColor : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  {password.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">Strength: <span className="font-semibold">{strengthLabel}</span></p>
                  )}

                  {/* Rule checklist */}
                  {password.length > 0 && (
                    <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      {rules.map((r) => (
                        <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-700' : 'text-gray-400'}`}>
                          <CheckCircle2 size={12} />
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="block font-body text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1.5">
                    Confirm password
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter the same password"
                    className="input-field"
                    autoComplete="new-password"
                  />
                  {confirm.length > 0 && confirm !== password && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Passwords don't match
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || score < 4 || password !== confirm}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Reset password
                </button>
              </form>
            </>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-1 font-body text-sm text-gray-600 hover:text-gold-600">
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="animate-spin text-gold-500" size={32} /></div>}>
      <ResetForm />
    </Suspense>
  );
}
