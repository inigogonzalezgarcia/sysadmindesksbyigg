// Transactional email through Brevo (https://api.brevo.com/v3/smtp/email), used only for password reset links.
// Configuration comes only from environment variables: BREVO_API_KEY (secret), MAIL_FROM (sender address, verified in Brevo)
// and MAIL_FROM_NAME (optional). Neither the key nor the token is ever logged.

export const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export function mailReady(env) {
  return Boolean(env && env.BREVO_API_KEY && env.MAIL_FROM);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const TEXT = {
  es: {
    subject: "Restablece tu contraseña de SysAdmin Desks",
    hello: (n) => `Hola, ${n}:`,
    intro: "Alguien (seguramente tú) ha pedido restablecer la contraseña de tu cuenta de SysAdmin Desks.",
    action: "Elige una contraseña nueva con este enlace:",
    button: "Elegir una contraseña nueva",
    expiry: "El enlace caduca en 30 minutos y solo funciona una vez. Al cambiar la contraseña se cierran todas tus sesiones.",
    ignore: "Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.",
  },
  en: {
    subject: "Reset your SysAdmin Desks password",
    hello: (n) => `Hi ${n},`,
    intro: "Someone (probably you) asked to reset the password of your SysAdmin Desks account.",
    action: "Choose a new password with this link:",
    button: "Choose a new password",
    expiry: "The link expires in 30 minutes and works only once. Changing the password signs you out everywhere.",
    ignore: "If you did not ask for this, ignore this email: your password stays the same.",
  },
};

// the message in the language the person had picked in the app
export function resetEmail({ lang, name, link }) {
  const T = TEXT[lang === "es" ? "es" : "en"];
  const who = name || (lang === "es" ? "técnico" : "there");
  const textContent = [T.hello(who), "", T.intro, "", T.action, link, "", T.expiry, T.ignore, "", "SysAdmin Desks"].join("\n");
  const htmlContent = `<!doctype html><html lang="${lang === "es" ? "es" : "en"}"><body style="margin:0;padding:24px;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#18211d">` +
    `<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #dde3e0;border-radius:12px;padding:24px">` +
    `<p style="margin:0 0 14px;font-weight:bold;color:#0f6b4f">&gt;_ SysAdmin Desks</p>` +
    `<p>${esc(T.hello(who))}</p><p>${esc(T.intro)}</p><p>${esc(T.action)}</p>` +
    `<p style="margin:20px 0"><a href="${esc(link)}" style="background:#0f6b4f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:9px;display:inline-block;font-weight:bold">${esc(T.button)}</a></p>` +
    `<p style="font-size:13px;color:#5d6b64;word-break:break-all">${esc(link)}</p>` +
    `<p style="font-size:14px">${esc(T.expiry)}</p><p style="font-size:14px">${esc(T.ignore)}</p>` +
    `</div></body></html>`;
  return { subject: T.subject, htmlContent, textContent };
}

// POST to Brevo; returns true when Brevo accepted the message (201)
export async function sendMail(env, { to, toName, subject, htmlContent, textContent }) {
  const body = {
    sender: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || "SysAdmin Desks" },
    to: [toName ? { email: to, name: toName } : { email: to }],
    subject,
    htmlContent,
    textContent,
  };
  try {
    const r = await fetch(BREVO_URL, {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) console.error(`Brevo answered ${r.status} for a password reset email`);
    return r.ok;
  } catch (e) {
    console.error("Brevo could not be reached for a password reset email");
    return false;
  }
}
