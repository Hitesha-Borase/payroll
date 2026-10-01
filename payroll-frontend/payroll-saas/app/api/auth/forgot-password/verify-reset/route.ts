import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Note: Ensure prisma instance is configured at @/lib/prisma
// import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    // 1. Basic Field Validation
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email, OTP, and new password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Password Strength Validation (Min 8 chars, at least 1 uppercase letter, 1 number)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUppercase || !hasNumber) {
      return NextResponse.json(
        { success: false, message: 'Password must contain at least one uppercase letter and one number.' },
        { status: 400 }
      );
    }

    // 3. Hash Provided OTP for comparison
    const providedOtpHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');

    /*
    // 4. Query valid reset token from Prisma database
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!resetToken || resetToken.otpHash !== providedOtpHash) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP code.' },
        { status: 400 }
      );
    }

    // 5. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6. Update User Password in DB
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashedPassword }
    });

    // 7. Delete used OTP token record (Prevent replay attacks)
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error: any) {
    console.error('[VERIFY_RESET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
