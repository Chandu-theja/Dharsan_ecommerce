'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error('Invalid email or password');
      } else {
        toast.success('Welcome back!');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, #C8991E 35px, #C8991E 36px)` }} />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          <Image src="/images/logo.png" alt="Dharsan Dresses" width={180} height={180} className="rounded-full mb-8 shadow-2xl" />
          <h1 className="font-display text-5xl font-light text-white mb-4">
            Welcome to <span className="text-gold-gradient italic font-medium">Dharsan</span>
          </h1>
          <p className="font-body text-base text-navy-200 max-w-md">
            Tirupati's most trusted name in premium clothing & expert stitching.
          </p>
          <div className="mt-12 flex items-center gap-3">
            <div className="w-16 h-px bg-gold-500/60" />
            <p className="font-body text-xs text-gold-400 tracking-[0.3em] uppercase">Best Clothes • Best Stitch</p>
            <div className="w-16 h-px bg-gold-500/60" />
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Image src="/images/logo.png" alt="Dharsan Dresses" width={80} height={80} className="rounded-full mx-auto mb-3" />
            <h2 className="font-display text-2xl font-semibold text-navy-900">Dharsan Dresses</h2>
          </div>

          <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Sign In</h2>
          <p className="font-body text-sm text-gray-600 mb-8">
            Sign in to continue shopping & track your orders
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-body text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block font-body text-xs font-semibold text-navy-900 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="font-body text-xs text-gold-600 hover:text-gold-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-sm text-gray-600">
              New here?{' '}
              <Link href="/register" className="text-gold-600 hover:text-gold-700 font-semibold">
                Create an account
              </Link>
            </p>
          </div>

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
