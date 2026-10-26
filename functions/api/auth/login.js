import { clientIp, createSession, db, fail, hashPassword, json, locked, normEmail, publicUser, readJson, recordFail, sameOrigin,
  verifyPassword } from "../../_lib/auth.js";
import { progressOf } from "../me.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const body = await readJson(request);
  if (!body) return fail("bad_request");
  const email = normEmail(body.email);
  const password = String(body.password || "");
  const DB = await db(env);
  const keys = ["e:" + email, "i:" + clientIp(request)];
  if (await locked(DB, keys)) return fail("locked", 429);
  const user = await DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  let ok = false;
  if (user && user.pass_hash) ok = await verifyPassword(password, user.pass_hash, user.pass_salt);
  else await hashPassword(password || "x");            // same work whether or not the account exists
  if (!ok) {
    await recordFail(DB, keys);
    return fail(user && !user.pass_hash ? "google_only" : "credentials", 401);
  }
  const set = await createSession(DB, user.id);
  return json({ user: publicUser(user), progress: await progressOf(DB, user.id) }, 200, { "set-cookie": set });
}
