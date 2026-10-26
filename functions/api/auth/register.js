import { AVATARS, cleanName, createSession, db, fail, hashPassword, json, newId, normEmail, publicUser, readJson, sameOrigin,
  validEmail, validName, validPassword } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return fail("origin", 403);
  const body = await readJson(request);
  if (!body) return fail("bad_request");
  const name = cleanName(body.name);
  const email = normEmail(body.email);
  const avatar = AVATARS.includes(body.avatar) ? body.avatar : AVATARS[0];
  if (!validName(name)) return fail("name");
  if (!validEmail(email)) return fail("email");
  if (!validPassword(body.password)) return fail("password");
  if (body.consent !== true) return fail("consent");
  const DB = await db(env);
  const exists = await DB.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first();
  if (exists) return fail("exists", 409);
  const { hash, salt } = await hashPassword(String(body.password));
  const id = newId();
  const now = Date.now();
  await DB.prepare("INSERT INTO users (id, email, name, avatar, pass_hash, pass_salt, created_at, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(id, email, name, avatar, hash, salt, now, now).run();
  const set = await createSession(DB, id);
  return json({ user: publicUser({ name, email, avatar, pass_hash: hash }), progress: {} }, 201, { "set-cookie": set });
}
