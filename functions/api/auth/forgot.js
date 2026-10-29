import { cleanResets, clientIp, createResetToken, db, fail, json, normEmail, readJson, recordResetRequest, resetLimited, sameOrigin,
  validEmail } from "../../_lib/auth.js";
import { mailReady, resetEmail, sendMail } from "../../_lib/mail.js";

// The same answer whether or not there is an account with that email (no user enumeration).
const GENERIC = { ok: true, message: "If there is an account with that email, we have sent a link to reset the password." };

// "Forgot your password?": {email, lang} -> a reset link by email, valid for 30 minutes.
// Needs BREVO_API_KEY and MAIL_FROM; without them the answer is 503 {error: "reset_unavailable"}.
export async function onRequestPost({ request, env, waitUntil }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const body = await readJson(request);
  if (!body) return fail("bad_request");
  if (!mailReady(env)) return fail("reset_unavailable", 503);
  const email = normEmail(body.email);
  const lang = body.lang === "es" ? "es" : "en";
  if (!validEmail(email)) return json(GENERIC);
  const DB = await db(env);
  await cleanResets(DB);
  const ip = clientIp(request);
  if (await resetLimited(DB, email, ip)) return json(GENERIC);
  await recordResetRequest(DB, email, ip);
  const user = await DB.prepare("SELECT id, name, email, pass_hash FROM users WHERE email = ?").bind(email).first();
  if (!user || !user.pass_hash) return json(GENERIC);     // unknown, or signs in only with Google: nothing to reset
  const token = await createResetToken(DB, user.id);
  const link = `${new URL(request.url).origin}/?lang=${lang}#/reset?token=${token}`;
  const job = sendMail(env, { to: user.email, toName: user.name, ...resetEmail({ lang, name: user.name, link }) });
  if (typeof waitUntil === "function") waitUntil(job);       // the answer does not wait for Brevo (same timing either way)
  else await job;
  return json(GENERIC);
}
