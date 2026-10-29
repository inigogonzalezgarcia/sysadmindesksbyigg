// Password reset by email (v0.6): the Pages Functions against an in-memory SQLite that behaves like D1, with fetch to Brevo mocked.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import * as A from "../functions/_lib/auth.js";
import { BREVO_URL } from "../functions/_lib/mail.js";
import { onRequestPost as register } from "../functions/api/auth/register.js";
import { onRequestPost as login } from "../functions/api/auth/login.js";
import { onRequestPost as forgot } from "../functions/api/auth/forgot.js";
import { onRequestPost as reset } from "../functions/api/auth/reset.js";
import { onRequestGet as me } from "../functions/api/me.js";

const ORIGIN = "https://desks.example";
const MAIL = { BREVO_API_KEY: "test-key-not-real", MAIL_FROM: "no-reply@desks.example", MAIL_FROM_NAME: "Desks Test" };

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
function req(path, { method = "POST", body, cookie, origin = ORIGIN, ip = "203.0.113.7" } = {}) {
  const headers = { "cf-connecting-ip": ip };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";
  return new Request(ORIGIN + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
const session = (res) => (res.headers.get("set-cookie") || "").split(";")[0];
const good = { name: "Alex Moreno", email: "alex@example.com", password: "Soporte2026", avatar: "a3", consent: true };

// every call to fetch is recorded; Brevo answers 201
async function withMail(fn) {
  const sent = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    sent.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ messageId: "<m1@brevo>" }), { status: 201 });
  };
  try { await fn(sent); } finally { globalThis.fetch = real; }
}
const ask = (env, email, extra = {}) => forgot({ request: req("/api/auth/forgot", { body: { email, lang: "es" }, ...extra }), env });
const tokenOf = (mail) => decodeURIComponent(mail.body.textContent.match(/#\/reset\?token=([A-Za-z0-9_-]+)/)[1]);

test("without BREVO_API_KEY or MAIL_FROM the reset answers 503 reset_unavailable, and other origins are refused", async () => {
  const env = { DB: fakeD1() };
  await withMail(async (sent) => {
    let res = await ask(env, "alex@example.com");
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, "reset_unavailable");
    res = await ask({ ...env, BREVO_API_KEY: "k" }, "alex@example.com");
    assert.equal(res.status, 503);
    res = await ask({ ...env, MAIL_FROM: "a@b.example" }, "alex@example.com");
    assert.equal(res.status, 503);
    res = await ask({ ...env, ...MAIL }, "alex@example.com", { origin: "https://evil.example" });
    assert.equal(res.status, 403);
    assert.equal(sent.length, 0);
  });
});

test("unknown email and Google-only account: the same generic answer and no email", async () => {
  const env = { DB: fakeD1(), ...MAIL };
  await register({ request: req("/api/auth/register", { body: good }), env });
  env.DB.sql.prepare("INSERT INTO users (id, email, name, avatar, google_sub, created_at, consent_at) VALUES ('g1', 'gina@example.com', 'Gina', 'a1', 'sub-1', 1, 1)").run();
  await withMail(async (sent) => {
    const known = await (await ask(env, "alex@example.com")).json();
    const unknown = await ask(env, "nobody@example.com", { ip: "198.51.100.1" });
    const google = await ask(env, "gina@example.com", { ip: "198.51.100.2" });
    const invalid = await ask(env, "not-an-email", { ip: "198.51.100.3" });
    for (const r of [unknown, google, invalid]) {
      assert.equal(r.status, 200);
      assert.deepEqual(await r.json(), known);
    }
    assert.equal(sent.length, 1, "only the password account gets an email");
    assert.equal(sent[0].body.to[0].email, "alex@example.com");
    assert.equal(env.DB.sql.prepare("SELECT COUNT(*) AS n FROM resets").get().n, 1);
  });
});

test("the token is stored only as its hash, and the Brevo payload is right", async () => {
  const env = { DB: fakeD1(), ...MAIL };
  await register({ request: req("/api/auth/register", { body: good }), env });
  await withMail(async (sent) => {
    const res = await ask(env, " Alex@Example.com ");
    assert.equal(res.status, 200);
    const m = sent[0];
    assert.equal(m.url, BREVO_URL);
    assert.equal(m.url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(m.headers["api-key"], "test-key-not-real");
    assert.equal(m.headers["content-type"], "application/json");
    assert.deepEqual(m.body.sender, { email: "no-reply@desks.example", name: "Desks Test" });
    assert.deepEqual(m.body.to, [{ email: "alex@example.com", name: "Alex Moreno" }]);
    assert.match(m.body.subject, /Restablece tu contraseña/);
    const token = tokenOf(m);
    assert.equal(Buffer.from(token, "base64url").length, 32, "32 random bytes, base64url");
    assert.ok(m.body.textContent.includes(`${ORIGIN}/?lang=es#/reset?token=${token}`));
    assert.ok(m.body.htmlContent.includes(token) && /30 minutos/.test(m.body.textContent) && /ignora este mensaje/.test(m.body.textContent));
    const row = env.DB.sql.prepare("SELECT * FROM resets").get();
    assert.equal(row.token_hash, await A.sha256hex(token));
    assert.ok(!JSON.stringify(env.DB.sql.prepare("SELECT * FROM resets").all()).includes(token), "the token itself is not stored");
    assert.ok(Math.abs(row.expires_at - Date.now() - 30 * 60000) < 5000, "expires in 30 minutes");
    assert.equal(row.used, 0);

    // MAIL_FROM_NAME is optional; an English request gets the English email
    await forgot({ request: req("/api/auth/forgot", { body: { email: "alex@example.com", lang: "en" } }), env: { ...env, MAIL_FROM_NAME: undefined } });
    assert.equal(sent[1].body.sender.name, "SysAdmin Desks");
    assert.match(sent[1].body.subject, /Reset your SysAdmin Desks password/);
    assert.ok(sent[1].body.textContent.includes("/?lang=en#/reset?token="));
    // the new link invalidates the earlier one
    assert.deepEqual(env.DB.sql.prepare("SELECT used FROM resets ORDER BY created_at, rowid").all().map((r) => r.used), [1, 0]);
  });
});

test("rate limit: 3 per email per hour, a limit per IP, and still the same generic answer", async () => {
  const env = { DB: fakeD1(), ...MAIL };
  await register({ request: req("/api/auth/register", { body: good }), env });
  await withMail(async (sent) => {
    for (let i = 0; i < 5; i++) {
      const res = await ask(env, "alex@example.com", { ip: "198.51.100." + i });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).ok, true);
    }
    assert.equal(sent.length, A.RESET_PER_EMAIL);
    // per IP: many different addresses from one IP
    for (let i = 0; i < A.RESET_PER_IP + 3; i++) await ask(env, `user${i}@example.com`, { ip: "192.0.2.50" });
    const n = env.DB.sql.prepare("SELECT COUNT(*) AS n FROM reset_requests WHERE k = 'i:192.0.2.50'").get().n;
    assert.equal(n, A.RESET_PER_IP);
    // records older than 24 hours are cleaned up on the next request
    env.DB.sql.prepare("UPDATE reset_requests SET ts = ?").run(Date.now() - A.RESET_KEEP_MS - 1000);
    env.DB.sql.prepare("UPDATE resets SET created_at = ?").run(Date.now() - A.RESET_KEEP_MS - 1000);
    await ask(env, "someone@example.com", { ip: "192.0.2.99" });
    assert.equal(env.DB.sql.prepare("SELECT COUNT(*) AS n FROM resets").get().n, 0);
    assert.equal(env.DB.sql.prepare("SELECT COUNT(*) AS n FROM reset_requests").get().n, 2);
  });
});

test("reset: new password works, the old one does not, sessions are closed, the lockout is cleared, the link works once", async () => {
  const env = { DB: fakeD1(), ...MAIL };
  const c1 = session(await register({ request: req("/api/auth/register", { body: good }), env }));
  const c2 = session(await login({ request: req("/api/auth/login", { body: { email: good.email, password: good.password } }), env }));
  for (let i = 0; i < 8; i++) await login({ request: req("/api/auth/login", { body: { email: good.email, password: "Wrong2026" }, ip: "198.51.100." + i }), env });
  assert.equal((await login({ request: req("/api/auth/login", { body: { email: good.email, password: good.password }, ip: "192.0.2.1" }), env })).status, 429);
  await withMail(async (sent) => {
    await ask(env, good.email);
    const token = tokenOf(sent[0]);
    let res = await reset({ request: req("/api/auth/reset", { body: { token, password: "weak" } }), env });
    assert.equal((await res.json()).error, "password");
    res = await reset({ request: req("/api/auth/reset", { body: { token, password: "Nueva2026x" }, origin: "https://evil.example" }), env });
    assert.equal(res.status, 403);
    res = await reset({ request: req("/api/auth/reset", { body: { token, password: "Nueva2026x" } }), env });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("set-cookie"), /sd_session=; .*Max-Age=0/);
    assert.equal(env.DB.sql.prepare("SELECT COUNT(*) AS n FROM sessions").get().n, 0, "every session is deleted");
    for (const c of [c1, c2]) assert.equal((await (await me({ request: req("/api/me", { method: "GET", cookie: c }), env })).json()).user, null);
    const row = env.DB.sql.prepare("SELECT pass_hash, pass_salt FROM users").get();
    assert.match(row.pass_hash, /^pbkdf2\$100000\$/);
    assert.ok(await A.verifyPassword("Nueva2026x", row.pass_hash, row.pass_salt));

    const ip = "192.0.2.2";
    assert.equal((await login({ request: req("/api/auth/login", { body: { email: good.email, password: good.password }, ip }), env })).status, 401, "old password");
    res = await login({ request: req("/api/auth/login", { body: { email: good.email, password: "Nueva2026x" }, ip }), env });
    assert.equal(res.status, 200, "new password, and the lockout of the account is gone");

    // the same link again: used
    res = await reset({ request: req("/api/auth/reset", { body: { token, password: "Otra2026xx" } }), env });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "reset_invalid");
  });
});

test("expired, unknown or malformed links are refused with the same generic error", async () => {
  const env = { DB: fakeD1(), ...MAIL };
  await register({ request: req("/api/auth/register", { body: good }), env });
  await withMail(async (sent) => {
    await ask(env, good.email);
    const token = tokenOf(sent[0]);
    env.DB.sql.prepare("UPDATE resets SET expires_at = ?").run(Date.now() - 1000);
    for (const t of [token, A.randomToken(32), "short", "../../etc", ""]) {
      const res = await reset({ request: req("/api/auth/reset", { body: { token: t, password: "Nueva2026x" } }), env });
      assert.equal(res.status, 400);
      assert.equal((await res.json()).error, "reset_invalid", t);
    }
    const row = env.DB.sql.prepare("SELECT pass_hash, pass_salt FROM users").get();
    assert.ok(await A.verifyPassword(good.password, row.pass_hash, row.pass_salt), "password unchanged");
  });
});
