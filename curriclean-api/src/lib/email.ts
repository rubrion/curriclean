// Transactional email through Cloudflare Email Service (the `EMAIL` send_email
// binding). The sender domain (curriclean.com) is onboarded for Email Sending,
// so no API key is involved. Every message has an HTML and a plain-text part,
// in English or Brazilian Portuguese.
import { Env } from "../types";

export type EmailLang = "en" | "pt";

/** Portuguese if the request's Accept-Language prefers it, else English. */
export function emailLang(acceptLanguage: string | undefined | null): EmailLang {
  for (const part of (acceptLanguage ?? "").split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("pt")) return "pt";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

type Copy = { subject: string; intro: string; action: string; button: string; ignore: string };

const COPY: Record<"verify" | "reset", Record<EmailLang, Copy>> = {
  verify: {
    en: {
      subject: "Confirm your CurriClean email",
      intro: "Welcome to CurriClean! Confirm your email address to activate your account.",
      action: "This link expires in 1 hour.",
      button: "Confirm email",
      ignore: "If you didn't create an account, you can ignore this email.",
    },
    pt: {
      subject: "Confirme seu e-mail no CurriClean",
      intro: "Boas-vindas ao CurriClean! Confirme seu e-mail para ativar sua conta.",
      action: "Este link expira em 1 hora.",
      button: "Confirmar e-mail",
      ignore: "Se você não criou uma conta, pode ignorar este e-mail.",
    },
  },
  reset: {
    en: {
      subject: "Reset your CurriClean password",
      intro: "We received a request to reset your CurriClean password.",
      action: "Choose a new password with the button below. This link expires in 1 hour.",
      button: "Choose a new password",
      ignore: "If you didn't ask for this, you can ignore this email — your password stays the same.",
    },
    pt: {
      subject: "Redefina sua senha do CurriClean",
      intro: "Recebemos um pedido para redefinir sua senha do CurriClean.",
      action: "Escolha uma nova senha no botão abaixo. Este link expira em 1 hora.",
      button: "Escolher nova senha",
      ignore: "Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.",
    },
  },
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function render(copy: Copy, link: string, lang: EmailLang) {
  const href = escape(link);
  const html = `<!doctype html>
<html lang="${lang === "pt" ? "pt-BR" : "en"}">
<body style="margin:0;background:#fbf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2a2420">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7ddd1;border-radius:12px;padding:32px">
        <tr><td style="font-size:20px;font-weight:600;padding-bottom:20px">Curri<span style="color:#c42524">Clean</span></td></tr>
        <tr><td style="font-size:15px;line-height:1.6;padding-bottom:8px">${escape(copy.intro)}</td></tr>
        <tr><td style="font-size:15px;line-height:1.6;padding-bottom:24px">${escape(copy.action)}</td></tr>
        <tr><td style="padding-bottom:24px">
          <a href="${href}" style="display:inline-block;background:#c42524;color:#fff8f3;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:9px">${escape(copy.button)}</a>
        </td></tr>
        <tr><td style="font-size:12px;line-height:1.6;color:#7a6e64;word-break:break-all;padding-bottom:16px"><a href="${href}" style="color:#7a6e64">${href}</a></td></tr>
        <tr><td style="font-size:13px;line-height:1.6;color:#7a6e64">${escape(copy.ignore)}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${copy.intro}\n\n${copy.action}\n\n${copy.button}: ${link}\n\n${copy.ignore}\n`;
  return { html, text };
}

async function send(env: Env, kind: "verify" | "reset", to: string, token: string, lang: EmailLang) {
  const path = kind === "verify" ? "verify" : "reset";
  const link = `${env.FRONTEND_URL}/${path}?token=${encodeURIComponent(token)}`;
  const copy = COPY[kind][lang];
  const { html, text } = render(copy, link, lang);
  try {
    await env.EMAIL.send({
      from: { email: env.EMAIL_FROM, name: "CurriClean" },
      to,
      subject: copy.subject,
      html,
      text,
    });
  } catch (err) {
    throw new EmailError(`Failed to send ${kind} email: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export const sendVerifyEmail = (env: Env, to: string, token: string, lang: EmailLang) =>
  send(env, "verify", to, token, lang);

export const sendResetEmail = (env: Env, to: string, token: string, lang: EmailLang) =>
  send(env, "reset", to, token, lang);

export class EmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailError";
  }
}
