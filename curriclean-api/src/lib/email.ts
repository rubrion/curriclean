import { Resend } from "resend";

interface SendVerifyEmailParams {
  apiKey: string;
  from: string;
  to: string;
  token: string;
  frontendUrl: string;
}

interface SendResetEmailParams {
  apiKey: string;
  from: string;
  to: string;
  token: string;
  frontendUrl: string;
}

export async function sendVerifyEmail({
  apiKey,
  from,
  to,
  token,
  frontendUrl,
}: SendVerifyEmailParams): Promise<void> {
  const resend = new Resend(apiKey);
  const link = `${frontendUrl}/verify?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Verify your CurriClean email",
    html: `
      <p>Welcome to CurriClean!</p>
      <p>Please verify your email address by clicking the link below. This link expires in 1 hour.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new EmailError(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendResetEmail({
  apiKey,
  from,
  to,
  token,
  frontendUrl,
}: SendResetEmailParams): Promise<void> {
  const resend = new Resend(apiKey);
  const link = `${frontendUrl}/reset?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Reset your CurriClean password",
    html: `
      <p>We received a request to reset your CurriClean password.</p>
      <p>Click the link below to choose a new password. This link expires in 1 hour.</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new EmailError(`Failed to send reset email: ${error.message}`);
  }
}

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailError";
  }
}
