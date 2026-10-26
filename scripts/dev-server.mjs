// Local preview with accounts: serves public/ and runs the Pages Functions in functions/api against an in-memory SQLite
// that behaves like D1 (Node 22+, node:sqlite). Data is lost when it stops. Usage: npm run dev, then http://localhost:8788
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { DatabaseSync } from "node:sqlite";

const ROOT = new URL("../", import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8788);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

function fakeD1() {
  const sql = new DatabaseSync(":memory:");
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a),
    run: async () => { sql.prepare(q).run(...args); return { success: true }; },
    first: async () => sql.prepare(q).get(...args) ?? null,
    all: async () => ({ results: sql.prepare(q).all(...args) }),
  });
  return { prepare: (q) => stmt(q), batch: async (list) => { for (const s of list) await s.run(); return []; } };
}
const env = { DB: fakeD1(), GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET };

const ROUTES = {
  "/api/auth/register": "functions/api/auth/register.js",
  "/api/auth/login": "functions/api/auth/login.js",
  "/api/auth/logout": "functions/api/auth/logout.js",
  "/api/auth/google": "functions/api/auth/google.js",
  "/api/auth/google/callback": "functions/api/auth/google/callback.js",
  "/api/me": "functions/api/me.js",
  "/api/progress": "functions/api/progress.js",
};
const middleware = (await import(join(ROOT, "functions/api/_middleware.js"))).onRequest;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      const file = ROUTES[url.pathname];
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const headers = new Headers(Object.entries(req.headers).map(([k, v]) => [k, String(v)]));
      const request = new Request(url, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
      let response;
      if (!file) response = new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
      else {
        const mod = await import(join(ROOT, file));
        const handler = mod["onRequest" + req.method[0] + req.method.slice(1).toLowerCase()];
        response = handler ? await middleware({ next: () => handler({ request, env }) }) : new Response(null, { status: 405 });
      }
      const out = {};
      response.headers.forEach((v, k) => { out[k] = k === "set-cookie" ? response.headers.getSetCookie().map((c) => c.replace("; Secure", "")) : v; });
      res.writeHead(response.status, out);
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (path.endsWith("/")) path += "index.html";
    const body = await readFile(join(ROOT, "public", path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch (e) {
    res.writeHead(e.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain" });
    res.end(e.code === "ENOENT" ? "Not found" : String(e));
  }
}).listen(PORT, () => console.log(`SysAdmin Desks with accounts on http://localhost:${PORT} (in-memory database)`));
