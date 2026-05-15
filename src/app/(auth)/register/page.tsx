'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }
      toast.success('Account created! Signing you in...');
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          <Image src="/images/logo.png" alt="Dharsan Dresses" width={180} height={180} className="rounded-full mb-8 shadow-2xl" />
          <h1 className="font-display text-5xl font-light text-white mb-4">
            Join the <span className="text-gold-gradient italic font-medium">Family</span>
          </h1>
          <p className="font-body text-base text-navy-200 max-w-md">
            Create your account to enjoy faster checkout, order tracking, and exclusive offers.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-50">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Create Account</h2>
          <p className="font-body text-sm text-gray-600 mb-8">Welcome! It only takes a minute.</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text" required minLength={2}
              placeholder="Full Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
            <input
              type="email" required
              placeholder="Email Address *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
            />
            <input
              type="tel" required pattern="[6-9][0-9]{9}"
              placeholder="Phone (10 digits) *"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
            />
            <input
              type="password" required minLength={8}
              placeholder="Password (min 8 characters) *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
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
        </div>
      </div>
    </div>
  );
}
