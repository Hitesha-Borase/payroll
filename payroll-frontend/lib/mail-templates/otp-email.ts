/**
 * Kiaan Technology Pvt Ltd - Payroll Management System
 * OTP Password Reset Email HTML Template
 */

export interface OTPEmailParams {
  name?: string;
  otp: string;
  validMinutes?: number;
}

export function generateOTPEmailHTML({ name, otp, validMinutes = 10 }: OTPEmailParams): string {
  // Format OTP with spaces between characters e.g. "4 8 2 9 1 0"
  const formattedOTP = otp.split('').join(' ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Password Reset OTP - Kiaan Payroll System</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1E293B;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0F172A; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
                Kiaan Technology
              </h1>
              <p style="margin: 4px 0 0 0; color: #F97316; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                Payroll Management System
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #0F172A; font-size: 18px; font-weight: 600;">
                Hello ${name || 'there'},
              </h2>
              
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                We received a request to reset your password. Use the verification code below to complete the reset process. This OTP is valid for <strong>${validMinutes} minutes</strong>.
              </p>

              <!-- OTP Display Box -->
              <div style="background-color: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <span style="font-size: 36px; font-weight: 800; color: #F97316; letter-spacing: 10px; font-family: monospace; display: inline-block;">
                  ${formattedOTP}
                </span>
              </div>

              <!-- Security Alert Box -->
              <div style="background-color: #FFF7ED; border-left: 4px solid #F97316; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; color: #9A3412; font-size: 13px; line-height: 1.5;">
                  <strong>Security Alert:</strong> If you did not request a password reset, please ignore this email or contact support immediately. Never share your OTP with anyone.
                </p>
              </div>

              <p style="margin: 0; color: #64748B; font-size: 14px;">
                Regards,<br>
                <strong style="color: #0F172A;">Kiaan Technology Support Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                © 2026 Kiaan Technology Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
