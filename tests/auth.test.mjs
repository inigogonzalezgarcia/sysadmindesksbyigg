// Accounts: the Pages Functions run against an in-memory SQLite that behaves like D1 (node:sqlite, Node 22+).
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import * as A from "../functions/_lib/auth.js";
import { onRequestPost as register } from "../functions/api/auth/register.js";
import { onRequestPost as login } from "../functions/api/auth/login.js";
import { onRequestPost as logout } from "../functions/api/auth/logout.js";
import { onRequestGet as me, onRequestDelete as deleteMe } from "../functions/api/me.js";
import { onRequestPut as saveProgress } from "../functions/api/progress.js";
import { onRequestGet as googleStart } from "../functions/api/auth/google.js";
import { onRequestGet as googleBack } from "../functions/api/auth/google/callback.js";

const ORIGIN = "https://desks.example";

function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a),
    run: async () => { sql.prepare(q).run(...args); return { success: true }; },
    first: async () => sql.prepare(q).get(...args) ?? null,
    all: async () => ({ results: sql.prepare(q).all(...args) }),
  });
  return { prepare: (q) => stmt(q), batch: async (list) => { for (const s of list) await s.run(); return []; }, sql };
}

function req(path, { method = "GET", body, cookie, origin = ORIGIN, ip = "203.0.113.7" } = {}) {
  const headers = { "cf-connecting-ip": ip };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";
  return new Request(ORIGIN + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
const session = (res) => (res.headers.get("set-cookie") || "").split(";")[0];
const good = { name: "Alex Moreno", email: "Alex@Example.com ", password: "Soporte2026", avatar: "a3", consent: true };

test("password rules, hashing and helpers", async () => {
  assert.deepEqual(A.passwordRules("abc"), { length: false, capital: false, number: false });
  assert.equal(A.validPassword("Soporte2026"), true);
  assert.equal(A.validPassword("soporte2026"), false);
  const { hash, salt } = await A.hashPassword("Soporte2026");
  assert.match(hash, /^pbkdf2\$100000\$/);
  assert.equal(await A.verifyPassword("Soporte2026", hash, salt), true);
  assert.equal(await A.verifyPassword("Soporte2027", hash, salt), false);
  assert.equal(A.cleanName("  Ana <b>  López\u0007 "), "Ana b López");
  assert.equal(A.validEmail(A.normEmail(" Ana@Contoso.COM ")), true);
  assert.equal(A.validEmail("ana@contoso"), false);
  assert.deepEqual(A.parseCookies("a=1; sd_session=x%20y"), { a: "1", sd_session: "x y" });
  assert.match(A.cookie("sd_session", "t", { maxAge: 10 }), /HttpOnly; Secure; SameSite=Lax; Max-Age=10/);
});

test("register, me, logout and login", async () => {
  const env = { DB: fakeD1() };
  let res = await register({ request: req("/api/auth/register", { method: "POST", body: good }), env });
  assert.equal(res.status, 201);
  const c1 = session(res);
  assert.match(c1, /^sd_session=/);
  const row = env.DB.sql.prepare("SELECT email, avatar, pass_hash FROM users").get();
  assert.equal(row.email, "alex@example.com");
  assert.equal(row.avatar, "a3");
  assert.ok(!row.pass_hash.includes("Soporte2026"));
  assert.equal(env.DB.sql.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 1);
  assert.ok(!env.DB.sql.prepare("SELECT token_hash FROM sessions").get().token_hash.includes(c1.split("=")[1]));   // only the hash is stored

  res = await me({ request: req("/api/me", { cookie: c1 }), env });
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).user, { name: "Alex Moreno", email: "alex@example.com", avatar: "a3", google: false, password: true });

  res = await register({ request: req("/api/auth/register", { method: "POST", body: good }), env });
  assert.equal(res.status, 409);

  res = await logout({ request: req("/api/auth/logout", { method: "POST", cookie: c1 }), env });
  assert.equal(res.status, 200);
  assert.equal((await (await me({ request: req("/api/me", { cookie: c1 }), env })).json()).user, null);

  res = await login({ request: req("/api/auth/login", { method: "POST", body: { email: "alex@example.com", password: "Soporte2026" } }), env });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).user.name, "Alex Moreno");
});

test("validation, consent and other origins are refused", async () => {
  const env = { DB: fakeD1() };
  const cases = [[{ ...good, name: "A" }, "name"], [{ ...good, email: "nope" }, "email"], [{ ...good, password: "short1A" }, "password"],
    [{ ...good, consent: false }, "consent"]];
  for (const [body, code] of cases) {
    const res = await register({ request: req("/api/auth/register", { method: "POST", body }), env });
    assert.equal((await res.json()).error, code);
  }
  let res = await register({ request: req("/api/auth/register", { method: "POST", body: good, origin: "https://evil.example" }), env });
  assert.equal(res.status, 403);
  res = await register({ request: req("/api/auth/register", { method: "POST", body: good, origin: null }), env });
  assert.equal(res.status, 403);
});

test("wrong passwords are counted and the account locks for a while", async () => {
  const env = { DB: fakeD1() };
  await register({ request: req("/api/auth/register", { method: "POST", body: good }), env });
  const bad = () => login({ request: req("/api/auth/login", { method: "POST", body: { email: "alex@example.com", password: "Wrong2026" } }), env });
  for (let i = 0; i < 8; i++) assert.equal((await bad()).status, 401);
  assert.equal((await bad()).status, 429);
  const unknown = await login({ request: req("/api/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "X" }, ip: "198.51.100.9" }), env });
  assert.equal((await unknown.json()).error, "credentials");
});

test("progress keeps the best result per desk, and deleting the account removes everything", async () => {
  const env = { DB: fakeD1() };
  const c = session(await register({ request: req("/api/auth/register", { method: "POST", body: good }), env }));
  const put = (results) => saveProgress({ request: req("/api/progress", { method: "PUT", body: { results }, cookie: c }), env });
  let res = await put({ "ad-lockout": { points: 80, stars: 2 }, "bad id!": { points: 100, stars: 3 }, "disk-full": { points: 400, stars: 3 } });
  assert.deepEqual(Object.keys((await res.json()).progress), ["ad-lockout"]);
  await put({ "ad-lockout": { points: 60, stars: 1 } });
  res = await put({ "ad-lockout": { points: 100, stars: 3 } });
  assert.equal((await res.json()).progress["ad-lockout"].points, 100);
  assert.equal((await saveProgress({ request: req("/api/progress", { method: "PUT", body: { results: {} } }), env })).status, 401);

  res = await deleteMe({ request: req("/api/me", { method: "DELETE", cookie: c }), env });
  assert.equal(res.status, 200);
  for (const t of ["users", "sessions", "progress"]) assert.equal(env.DB.sql.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n, 0);
});

test("Google sign-in: off without credentials, state checked, account created or linked", async () => {
  const env = { DB: fakeD1() };
  let res = await googleStart({ request: req("/api/auth/google"), env });
  assert.match(res.headers.get("location"), /\?auth=google_off/);

  Object.assign(env, { GOOGLE_CLIENT_ID: "client-id", GOOGLE_CLIENT_SECRET: "test-secret" });
  res = await googleStart({ request: req("/api/auth/google"), env });
  const loc = new URL(res.headers.get("location"));
  assert.equal(loc.hostname, "accounts.google.com");
  assert.equal(loc.searchParams.get("redirect_uri"), ORIGIN + "/api/auth/google/callback");
  const state = loc.searchParams.get("state");
  const oauthCookie = session(res);

  res = await googleBack({ request: req(`/api/auth/google/callback?code=c&state=other`, { cookie: oauthCookie }), env });
  assert.match(res.headers.get("location"), /google_error/);

  // existing password account with the same verified email gets linked
  await register({ request: req("/api/auth/register", { method: "POST", body: good }), env });
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (u) => String(u).includes("token")
    ? new Response(JSON.stringify({ access_token: "at" }))
    : new Response(JSON.stringify({ sub: "g-123", email: "alex@example.com", email_verified: true, name: "Alex" }));
  try {
    res = await googleBack({ request: req(`/api/auth/google/callback?code=c&state=${state}`, { cookie: oauthCookie }), env });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(res.headers.get("location"), ORIGIN + "/#/");
  assert.match(res.headers.get("set-cookie"), /sd_session=/);
  assert.equal(env.DB.sql.prepare("SELECT google_sub FROM users").get().google_sub, "g-123");
  assert.equal(env.DB.sql.prepare("SELECT COUNT(*) AS n FROM users").get().n, 1);
});
