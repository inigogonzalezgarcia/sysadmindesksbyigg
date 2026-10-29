import { clearFails, cookie, db, fail, hashPassword, json, readJson, sameOrigin, SESSION_COOKIE, sha256hex, TOKEN, validPassword } from "../../_lib/auth.js";

// The link from the email: {token, password}. The token must exist (by its hash), be unused and not expired.
// The new password is stored like at sign-up, the link is used up, every session of the user is closed
// and the failed sign-ins of the account are forgotten.
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const body = await readJson(request);
  if (!body) return fail("bad_request");
  const token = String(body.token || "");
  if (!TOKEN.test(token)) return fail("reset_invalid");
  if (!validPassword(body.password)) return fail("password");
  const DB = await db(env);
  const now = Date.now();
  const hash = await sha256hex(token);
  const row = await DB.prepare(
    "SELECT r.user_id, u.email FROM resets r JOIN users u ON u.id = r.user_id WHERE r.token_hash = ? AND r.used = 0 AND r.expires_at > ?"
  ).bind(hash, now).first();
  if (!row) return fail("reset_invalid");
  const { hash: passHash, salt } = await hashPassword(String(body.password));
  await DB.batch([
    DB.prepare("UPDATE resets SET used = 1 WHERE user_id = ?").bind(row.user_id),
    DB.prepare("UPDATE users SET pass_hash = ?, pass_salt = ? WHERE id = ?").bind(passHash, salt, row.user_id),
    DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.user_id),
  ]);
  await clearFails(DB, row.email);
  return json({ ok: true }, 200, { "set-cookie": cookie(SESSION_COOKIE, "", { maxAge: 0 }) });
}
