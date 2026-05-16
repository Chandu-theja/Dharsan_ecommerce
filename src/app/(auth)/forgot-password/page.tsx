'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, MessageCircle, Phone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error('Please enter a valid email');
      return;
    }
    // Phase 2: POST /api/auth/forgot-password with the email.
    // The endpoint will generate a reset token and email it via SMTP (Nodemailer + Gmail).
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-navy-gradient relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          <Image src="/images/logo.png" alt="Dharsan Dresses" width={160} height={160} className="rounded-full mb-8 shadow-2xl" />
          <h1 className="font-display text-5xl font-light text-white mb-4">
            Forgot your <span className="text-gold-gradient italic font-medium">password?</span>
          </h1>
          <p className="font-body text-base text-navy-200 max-w-md">
            No worries — happens to the best of us. We'll help you get back into your account.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Image src="/images/logo.png" alt="Dharsan Dresses" width={70} height={70} className="rounded-full mx-auto mb-3" />
            <h2 className="font-display text-2xl font-semibold text-navy-900">Dharsan Dresses</h2>
          </div>

          {!submitted ? (
            <>
              <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Reset Password</h2>
              <p className="font-body text-sm text-gray-600 mb-8">
                Enter the email associated with your account and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                  <Mail size={16} />
                  Send Reset Link
                </button>
              </form>

              <div className="mt-8 p-4 bg-cream-100 border border-cream-200 rounded">
                <p className="font-body text-xs text-navy-900 font-semibold uppercase tracking-wider mb-2">
                  Faster: contact us directly
                </p>
                <p className="font-body text-xs text-gray-600 mb-3">
                  Email delivery may take a few minutes. For an instant reset, reach our support team:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://wa.me/91XXXXXXXXXX?text=Hi%2C%20I%20need%20to%20reset%20my%20password%20for%20my%20Dharsan%20Dresses%20account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded font-body text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle size={14} />
                    WhatsApp Us
                  </a>
                  <a
                    href="tel:+91XXXXXXXXXX"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-navy-900 text-navy-900 rounded font-body text-sm font-medium hover:bg-navy-900 hover:text-gold-400 transition-colors"
                  >
                    <Phone size={14} />
                    Call Store
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border border-green-200 mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-navy-900 mb-2">Check your email</h2>
              <p className="font-body text-sm text-gray-600 mb-2">
                If an account exists for <strong>{email.trim().toLowerCase()}</strong>, we've sent a password reset link.
              </p>
              <p className="font-body text-xs text-gray-500 mb-6">
                The link expires in 30 minutes. Don't forget to check your spam folder.
              </p>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-left">
                <p className="font-body text-xs text-yellow-900">
                  <strong>Note:</strong> Email delivery is being set up. For now, please contact the store directly to reset your password — our team will help you in under 5 minutes.
                </p>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://wa.me/91XXXXXXXXXX?text=Hi%2C%20I%20need%20to%20reset%20my%20password"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded font-body text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={14} />
                  WhatsApp Support
                </a>
                <a
                  href="tel:+91XXXXXXXXXX"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-navy-900 text-navy-900 rounded font-body text-sm font-medium hover:bg-navy-900 hover:text-gold-400 transition-colors"
                >
                  <Phone size={14} />
                  Call Store
                </a>
              </div>
            </div>
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
