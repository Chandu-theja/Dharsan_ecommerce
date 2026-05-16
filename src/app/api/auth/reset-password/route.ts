/**
 * POST /api/auth/reset-password
 *
 * Body: { email: string, token: string, password: string }
 *  - `token` is the raw token from the URL. Server hashes it and matches against
 *    the VerificationToken table (stored as SHA-256).
 *  - Password rules match the registration endpoint.
 *  - On success: updates User.password, deletes the token, invalidates all
 *    existing sessions for this user (forces re-login).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol');

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(32).max(128),
  password: passwordRule,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      return NextResponse.json(
        { error: issue.message, field: issue.path[0] as string },
        { status: 400 }
      );
    }

    const { email, token, password } = parsed.data;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const row = await db.verificationToken.findFirst({
      where: { identifier: email, token: tokenHash },
    });

    if (!row) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has already been used.' },
        { status: 400 }
      );
    }
    if (row.expires < new Date()) {
      // Clean up expired token
      await db.verificationToken.deleteMany({ where: { identifier: email, token: tokenHash } });
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      // Token exists but user was deleted — treat as invalid
      await db.verificationToken.deleteMany({ where: { identifier: email } });
      return NextResponse.json({ error: 'Account not found.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // Atomic: update password, invalidate this token, invalidate all sessions
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { password: hashed } }),
      db.verificationToken.deleteMany({ where: { identifier: email } }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Could not reset password. Please try again.' }, { status: 500 });
  }
}
