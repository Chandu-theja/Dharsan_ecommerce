/**
 * POST /api/auth/forgot-password
 *
 * Body: { email: string }
 * Response: always 200 (intentionally vague — don't leak which emails are registered).
 *
 * Side effects:
 *  - If a User exists with this email AND has a password (i.e. not a Google-only account):
 *    creates a single-use 30-min token in the VerificationToken table and emails the user.
 *  - Existing tokens for the same email are invalidated.
 *  - Rate-limited per email: ignores requests within 60s of the previous one.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const TOKEN_TTL_MIN = 30;
const RESEND_COOLDOWN_MS = 60 * 1000;

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: NextRequest) {
  // Always return the same shape regardless of outcome to avoid email enumeration.
  const okResponse = NextResponse.json({ success: true });

  try {
    const body = await req.json().catch(() => null);
    const parsed = body ? schema.safeParse(body) : { success: false as const };
    if (!parsed.success) return okResponse;
    const { email } = parsed.data;

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });

    // Silent no-op for: unknown email, or Google-only account (no password)
    if (!user || !user.password) return okResponse;

    // Cooldown: refuse if a token was issued in the last 60s
    const recent = await db.verificationToken.findFirst({
      where: { identifier: email, expires: { gt: new Date(Date.now() - (TOKEN_TTL_MIN * 60 - 60) * 1000) } },
      orderBy: { expires: 'desc' },
    });
    if (recent) {
      const issuedAt = recent.expires.getTime() - TOKEN_TTL_MIN * 60 * 1000;
      if (Date.now() - issuedAt < RESEND_COOLDOWN_MS) return okResponse;
    }

    // Invalidate previous tokens for this email
    await db.verificationToken.deleteMany({ where: { identifier: email } });

    // Generate a 256-bit token; store SHA-256 hash, send the raw token in the URL.
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);

    await db.verificationToken.create({
      data: { identifier: email, token: tokenHash, expires },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({
      to: email,
      customerName: user.name || '',
      resetUrl,
      expiresInMinutes: TOKEN_TTL_MIN,
    });

    return okResponse;
  } catch (err) {
    // Never expose internals to the user, but log for ops.
    console.error('forgot-password error:', err);
    return okResponse;
  }
}
