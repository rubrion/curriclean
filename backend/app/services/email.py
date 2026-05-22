from __future__ import annotations

import logfire
import resend

from app.config import get_settings


def _client_ready() -> bool:
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        return False
    resend.api_key = settings.RESEND_API_KEY
    return True


def _send(to: str, subject: str, html: str) -> None:
    settings = get_settings()
    if not _client_ready():
        logfire.warn("email.skipped_no_api_key", to=to, subject=subject)
        return
    try:
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception as exc:
        logfire.error("email.send_failed", to=to, subject=subject, error=str(exc))
        raise


def send_verify_email(to: str, verify_url: str) -> None:
    html = f"""
    <div style="font-family: -apple-system, system-ui, sans-serif; line-height: 1.5;">
      <h2>Confirm your SpecFit account</h2>
      <p>Click the link below to verify your email address. The link expires in 1 hour.</p>
      <p><a href="{verify_url}" style="display:inline-block;padding:10px 16px;background:#09090b;color:#ffffff;text-decoration:none;">Verify email</a></p>
      <p>Or paste this URL into your browser:</p>
      <p><code>{verify_url}</code></p>
      <p>If you did not create an account, you can ignore this email.</p>
    </div>
    """
    _send(to, "Confirm your SpecFit account", html)


def send_password_reset_email(to: str, reset_url: str) -> None:
    html = f"""
    <div style="font-family: -apple-system, system-ui, sans-serif; line-height: 1.5;">
      <h2>Reset your SpecFit password</h2>
      <p>Click the link below to set a new password. The link expires in 1 hour.</p>
      <p><a href="{reset_url}" style="display:inline-block;padding:10px 16px;background:#09090b;color:#ffffff;text-decoration:none;">Reset password</a></p>
      <p>Or paste this URL into your browser:</p>
      <p><code>{reset_url}</code></p>
      <p>If you did not request a password reset, you can ignore this email.</p>
    </div>
    """
    _send(to, "Reset your SpecFit password", html)
