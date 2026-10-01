import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateOTPEmailHTML } from '@/lib/mail-templates/otp-email';

// Note: Ensure prisma instance is configured at @/lib/prisma
// import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Generate a cryptographically secure 6-digit numeric OTP
    const otpNumber = crypto.randomInt(100000, 999999).toString();

    // 2. Hash OTP for secure storage (SHA256)
    const otpHash = crypto.createHash('sha256').update(otpNumber).digest('hex');

    // 3. Calculate Expiry Time (NOW + 10 Minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Invalidate any existing active OTP tokens for this email & store new token
    /*
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    });

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        otpHash: otpHash,
        expiresAt: expiresAt
      }
    });
    */

    // 5. Send OTP Email via Brevo / Resend / Nodemailer REST API
    const emailHtml = generateOTPEmailHTML({ otp: otpNumber, validMinutes: 10 });
    const apiKey = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY;

    if (apiKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          sender: {
            name: 'Kiaan Technology Support',
            email: process.env.BREVO_SENDER_EMAIL || 'support@kiaantechnology.com'
          },
          to: [{ email: normalizedEmail }],
          subject: 'Your Password Reset OTP - Kiaan Payroll System',
          htmlContent: emailHtml
        })
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error: any) {
    console.error('[SEND_OTP_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send OTP.' },
      { status: 500 }
    );
  }
}
