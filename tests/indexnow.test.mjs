// IndexNow: one key file that contains its own name, and every changed public page maps to its clean URL in the sitemap.
import test from "node:test";
import assert from "node:assert/strict";
import { key, sitemap, urlFor, urls, body, SITE, HOST } from "../scripts/indexnow.mjs";

test("the IndexNow key file and the request body", () => {
  const k = key();
  assert.match(k, /^[0-9a-f]{32}$/);
  const b = body([SITE + "/"]);
  assert.equal(b.host, HOST);
  assert.equal(b.keyLocation, `${SITE}/${k}.txt`);
  assert.deepEqual(b.urlList, [SITE + "/"]);
});

test("changed files become the clean URLs of the sitemap, and nothing else", () => {
  assert.equal(urlFor("public/index.html"), SITE + "/");
  assert.equal(urlFor("public/tickets/index.html"), SITE + "/tickets/");
  assert.equal(urlFor("public/tickets/ad-lockout.html"), SITE + "/tickets/ad-lockout");
  assert.equal(urlFor("public/faq.html"), SITE + "/faq");
  assert.equal(urlFor("public/tickets/linux-devops.html"), SITE + "/tickets/linux-devops");
  assert.equal(urlFor("public/assets/app.js"), null);
  assert.equal(urlFor("public/google6be08dda6e92647a.html"), null);
  assert.deepEqual(urls(["public/faq.html", "public/faq.html", "public/assets/style.css"]), [SITE + "/faq"]);
  assert.equal(urls(["--all"]).length, sitemap().length);
  assert.ok(urls(["--since", "2026-11-13"]).length <= sitemap().length);
});
