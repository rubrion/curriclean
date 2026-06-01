import { Resend } from "resend";

interface SendVerifyEmailParams {
  apiKey: string;
  to: string;
  token: string;
  frontendUrl: string;
}

interface SendResetEmailParams {
  apiKey: string;
  to: string;
  token: string;
  frontendUrl: string;
}

export async function sendVerifyEmail({
  apiKey,
  to,
  token,
  frontendUrl,
}: SendVerifyEmailParams): Promise<void> {
  const resend = new Resend(apiKey);
  const link = `${frontendUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "SpecFit <noreply@specfit.app>",
    to,
    subject: "Verify your SpecFit email",
    html: `
      <p>Welcome to SpecFit!</p>
      <p>Please verify your email address by clicking the link below. This link expires in 1 hour.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `,
  });
}

export async function sendResetEmail({
  apiKey,
  to,
  token,
  frontendUrl,
}: SendResetEmailParams): Promise<void> {
  const resend = new Resend(apiKey);
  const link = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "SpecFit <noreply@specfit.app>",
    to,
    subject: "Reset your SpecFit password",
    html: `
      <p>We received a request to reset your SpecFit password.</p>
      <p>Click the link below to choose a new password. This link expires in 1 hour.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });
}
