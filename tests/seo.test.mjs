// v0.6.2 SEO: the generated pages are up to date (npm run pages), every public page has its canonical, Open Graph and Twitter
// tags, the JSON-LD is valid and the FAQ one matches the visible FAQ, the home page has a static intro, the ticket pages exist
// for every desk and do not give the solution away, and the sitemap lists the clean URLs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build, SCENARIOS, STATIC, SITE, ticketMeta, faqItems, words, FAMILIES, familyOf } from "../scripts/build-ticket-pages.mjs";
import { TICKET_SEO } from "../scripts/ticket-pages-data.mjs";

const PUB = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const read = (f) => readFileSync(join(PUB, f), "utf8");
const attr = (h, re) => (h.match(re) || [])[1];
const jsonLd = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const PAGES = Object.entries(STATIC).map(([f, m]) => [f, m.path])
  .concat([["tickets/index.html", "/tickets/"]], FAMILIES.map((f) => [`tickets/${f.slug}.html`, "/tickets/" + f.slug]),
    SCENARIOS.map((sc) => [`tickets/${sc.id}.html`, "/tickets/" + sc.id]));

test("the generated pages and head blocks are up to date (npm run pages)", () => {
  for (const [rel, content] of Object.entries(build())) assert.equal(read(rel), content, rel + " is stale: run npm run pages");
});

test("every public page: Spanish title and description, canonical, Open Graph and Twitter card", () => {
  for (const [f, p] of PAGES) {
    const h = read(f);
    const title = attr(h, /<title>([^<]+)<\/title>/), desc = attr(h, /<meta name="description" content="([^"]+)">/);
    assert.ok(title && desc && desc.length <= 160, f + " title and description");
    assert.ok(h.includes('<html lang="es" data-title-en="'), f + " lang es with an English title for doc.js/app.js");
    assert.equal(attr(h, /<link rel="canonical" href="([^"]+)">/), SITE + p, f + " canonical");
    assert.equal(attr(h, /<meta property="og:url" content="([^"]+)">/), SITE + p, f + " og:url");
    for (const k of ["og:type", "og:title", "og:description", "og:image", "og:locale", "og:locale:alternate"]) assert.ok(h.includes(`<meta property="${k}" content="`), f + " " + k);
    assert.ok(h.includes('<meta property="og:locale" content="es_ES">') && h.includes('<meta property="og:locale:alternate" content="en_GB">'), f + " locales");
    assert.ok(h.includes('<meta name="twitter:card" content="summary_large_image">'), f + " twitter card");
    assert.equal(h.match(/<title>/g).length, 1, f + " one title");
  }
  const png = readFileSync(join(PUB, "assets", "og.png"));
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630], "og.png is 1200x630");
  assert.equal(STATIC["help.html"].title, "Ayuda · cómo practicar soporte IT en SysAdmin Desks");
});

test("JSON-LD: WebApplication on the home page, FAQPage with exactly the visible Spanish FAQ", () => {
  const [app] = jsonLd(read("index.html"));
  assert.equal(app["@type"], "WebApplication");
  assert.equal(app.applicationCategory, "EducationalApplication");
  assert.deepEqual(app.inLanguage, ["es", "en"]);
  assert.equal(app.offers.price, "0");
  assert.equal(app.offers.priceCurrency, "EUR");
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.author.name, "Iñigo González García");
  const faq = read("faq.html");
  const [ld] = jsonLd(faq);
  const visible = faqItems(faq);
  const shown = (faq.split('<article class="en"')[0].match(/<details class="faq">/g) || []).length;
  assert.ok(visible.length >= 19 && visible.length === shown, "every Spanish question");
  assert.equal(ld["@type"], "FAQPage");
  assert.deepEqual(ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), visible.map((x) => [x.q, x.a]));
  assert.equal(ld.mainEntity[0].name, "¿Es gratis?");
  for (const f of ["terms.html", "privacy.html"]) assert.equal(jsonLd(read(f)).length, 0, f + " no JSON-LD");
});

test("JSON-LD: /about is an AboutPage with the trail home → about, /help has the trail home → help", () => {
  const [about] = jsonLd(read("about.html"));
  const [page, bc] = about["@graph"];
  assert.equal(page["@type"], "AboutPage");
  assert.equal(page.url, "https://sysadmindesksbyigg.pages.dev/about");
  assert.equal(page.isPartOf["@type"], "WebSite");
  assert.equal(bc["@type"], "BreadcrumbList");
  assert.deepEqual(bc.itemListElement.map((x) => [x.position, x.item]), [[1, "https://sysadmindesksbyigg.pages.dev/"], [2, "https://sysadmindesksbyigg.pages.dev/about"]]);
  const [help] = jsonLd(read("help.html"));
  assert.equal(help["@type"], "BreadcrumbList");
  assert.equal(help.itemListElement[1].item, "https://sysadmindesksbyigg.pages.dev/help");
});

test("JSON-LD: the tickets list is a CollectionPage of every desk, and each ticket page has the trail home → tickets → ticket", () => {
  const [graph] = jsonLd(read("tickets/index.html"));
  const [col, trail] = graph["@graph"];
  assert.equal(col["@type"], "CollectionPage");
  assert.equal(trail["@type"], "BreadcrumbList");
  assert.deepEqual(trail.itemListElement.map((x) => [x.position, x.item]), [[1, "https://sysadmindesksbyigg.pages.dev/"], [2, "https://sysadmindesksbyigg.pages.dev/tickets/"]]);
  assert.equal(col.mainEntity["@type"], "ItemList");
  assert.equal(col.mainEntity.numberOfItems, SCENARIOS.length);
  assert.deepEqual(col.mainEntity.itemListElement.map((x) => x.url), SCENARIOS.map((sc) => "https://sysadmindesksbyigg.pages.dev/tickets/" + sc.id));
  for (const sc of SCENARIOS) {
    const [bc] = jsonLd(read(`tickets/${sc.id}.html`));
    assert.equal(bc["@type"], "BreadcrumbList", sc.id);
    assert.deepEqual(bc.itemListElement.map((x) => x.position), [1, 2, 3, 4]);
    assert.equal(bc.itemListElement[2].item, "https://sysadmindesksbyigg.pages.dev/tickets/" + familyOf(sc.id).slug);
    assert.equal(bc.itemListElement[3].item, "https://sysadmindesksbyigg.pages.dev/tickets/" + sc.id);
    assert.equal(bc.itemListElement[3].name, sc.title.es);
  }
});

test("the counts in words follow the number of desks", () => {
  const n = SCENARIOS.length;
  const es = words(n, "es"), en = words(n, "en");
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  assert.ok(read("index.html").includes(`${cap(es)} tickets de primera y segunda línea.`));
  assert.ok(read("index.html").includes(`${cap(en)} first and second line tickets.`));
  assert.ok(read("tickets/index.html").includes(`${cap(es)} tickets de una mesa de soporte`));
  assert.ok(read("tickets/index.html").includes(`${cap(en)} first and second line help desk tickets`));
  assert.ok(read("about.html").includes(`Ahora mismo hay ${es} tickets`) && read("about.html").includes(`There are ${en} tickets right now`));
  assert.equal(words(21, "es"), "veintiún"); assert.equal(words(24, "es"), "veinticuatro"); assert.equal(words(31, "es"), "treinta y un");
  assert.equal(words(24, "en"), "twenty-four"); assert.equal(words(30, "en"), "thirty");
  assert.equal(words(100, "es"), "cien"); assert.equal(words(101, "es"), "ciento un"); assert.equal(words(134, "es"), "ciento treinta y cuatro");
  assert.equal(words(101, "en"), "one hundred and one"); assert.equal(words(120, "en"), "one hundred and twenty");
});

test("the home page has a static, bilingual intro with real desks and links, and no inline code", () => {
  const h = read("index.html");
  const intro = h.slice(h.indexOf('<main id="app"'), h.indexOf("</main>"));
  assert.ok(intro.includes("<h1>SysAdmin Desks: simulador gratuito de soporte IT</h1>"), "Spanish H1");
  assert.ok(intro.includes('<article class="en" lang="en" id="en">') && intro.includes("<h2>Qué tickets puedes practicar</h2>"));
  for (const sc of SCENARIOS) assert.ok(intro.includes(`<a href="/tickets/${sc.id}">`), "intro links " + sc.id);
  for (const href of ["/about", "/help", "/faq", "/tickets/", "https://inigogonzalezgarcia.github.io/guias.html"]) assert.ok(intro.includes(`href="${href}"`), "intro links " + href);
  const code = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(code) && !/\sstyle=|<style/.test(code) && !/\son[a-z]+=/.test(code), "no inline code");
  assert.ok(read("about.html").includes('<h2 id="tickets">Tickets para practicar</h2>'), "about lists the tickets");
});

test("a public page per desk: title, description, CTA, guide, and nothing that gives the ticket away", () => {
  assert.deepEqual(Object.keys(TICKET_SEO).sort(), SCENARIOS.map((s) => s.id).sort(), "SEO copy for every desk and no other");
  const index = read("tickets/index.html");
  for (const sc of SCENARIOS) {
    const h = read(`tickets/${sc.id}.html`);
    const m = ticketMeta(sc);
    for (const [lang, t, long, short] of [["es", m.title, " · práctica de soporte IT", " · práctica IT"], ["en", m.titleEn, " · IT support practice", " · IT practice"]]) {
      const base = TICKET_SEO[sc.id][lang].title || sc.title[lang];
      assert.equal(t, base + (base.length + long.length <= 60 ? long : short), `${sc.id} ${lang} title suffix`);
    }
    for (const lang of ["es", "en"]) {
      const d = TICKET_SEO[sc.id][lang].desc;
      assert.ok(d.length <= 155, `${sc.id} ${lang} description ${d.length} > 155`);
      assert.ok(lang === "es" ? /^Practica cómo .+ y documentarlo en el ticket\.$/.test(d) : /^Practise how to .+ document it( in the ticket)?\.$/.test(d), `${sc.id} ${lang} description pattern`);
      assert.ok(TICKET_SEO[sc.id][lang].skills.length >= 3, sc.id + " skills");
      assert.ok(h.includes(`href="/?lang=${lang}#/desk/${sc.id}"`), `${sc.id} ${lang} CTA`);
    }
    assert.ok(h.includes("Practícalo gratis") && h.includes("Practise it free"));
    const plain = h.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    assert.ok(plain.includes(sc.ticket.body.es) && plain.includes(sc.ticket.body.en), sc.id + " the ticket as the requester tells it");
    assert.ok(h.includes(`href="${sc.guide}"`), sc.id + " guide");
    assert.ok(index.includes(`href="/tickets/${sc.id}"`), "index links " + sc.id);
    // no spoilers: the reference solution, the hints, the note elements and the sample note never appear
    const low = plain.toLowerCase();
    // (single words such as end, exit or enable are CLI mode changes and plain English: they give nothing away)
    for (const cmd of sc.solution) if (!/^[a-z]+$/i.test(cmd)) assert.ok(!low.includes(cmd.toLowerCase()), `${sc.id} shows the command ${cmd}`);
    for (const x of sc.hints) for (const l of ["es", "en"]) assert.ok(!plain.includes(x[l]), `${sc.id} shows a hint`);
    for (const n of sc.note) for (const l of ["es", "en"]) assert.ok(!plain.includes(n.label[l]), `${sc.id} shows a note element`);
    for (const l of ["es", "en"]) assert.ok(!plain.includes(sc.sampleNote[l].slice(0, 60)), `${sc.id} shows the sample note`);
  }
});

test("sitemap: clean URLs, a valid lastmod per URL and every ticket page", () => {
  const x = read("sitemap.xml");
  const locs = [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const [, p] of PAGES) assert.ok(locs.includes(SITE + p), "sitemap has " + p);
  assert.equal(locs.length, PAGES.length);
  assert.ok(!x.includes(".html"), "no .html in the sitemap");
  const mods = [...x.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(mods.length, locs.length, "a lastmod per URL");
  assert.ok(mods.every((d) => !Number.isNaN(Date.parse(d)) && d <= new Date().toISOString().slice(0, 10)), "lastmod is a real date, not in the future");
});

test("every ticket page links three related tickets that exist, in both languages", () => {
  for (const sc of SCENARIOS) {
    const html = read(`tickets/${sc.id}.html`);
    for (const h of ["<h2>Tickets relacionados</h2>", "<h2>Related tickets</h2>"]) assert.ok(html.includes(h), sc.id + " " + h);
    const links = [...html.matchAll(/<ul class="tk-list tk-related">([\s\S]*?)<\/ul>/g)].map((m) => [...m[1].matchAll(/href="\/tickets\/([a-z0-9-]+)"/g)].map((x) => x[1]));
    assert.equal(links.length, 2, sc.id);
    for (const ids of links) {
      assert.equal(ids.length, 3, sc.id);
      for (const id of ids) {
        assert.notEqual(id, sc.id, sc.id + " links itself");
        assert.ok(SCENARIOS.some((s) => s.id === id), sc.id + " → " + id);
      }
    }
  }
});

test("a page per family: every desk in exactly one, a CollectionPage of its desks, linked from the list and from each ticket", () => {
  const slugs = FAMILIES.map((f) => f.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of slugs) assert.ok(!SCENARIOS.some((sc) => sc.id === s), s + " clashes with a desk id");
  const index = read("tickets/index.html");
  let total = 0;
  for (const f of FAMILIES) {
    const h = read(`tickets/${f.slug}.html`);
    const desks = SCENARIOS.filter((sc) => familyOf(sc.id) === f);
    assert.ok(desks.length >= 5, f.slug + " has enough tickets");
    total += desks.length;
    for (const lang of ["es", "en"]) assert.ok(f[lang].desc(999).length <= 155, `${f.slug} ${lang} description`);
    const [graph] = jsonLd(h);
    const [col, trail] = graph["@graph"];
    assert.equal(col["@type"], "CollectionPage");
    assert.deepEqual(col.mainEntity.itemListElement.map((x) => x.url).sort(), desks.map((sc) => SITE + "/tickets/" + sc.id).sort());
    assert.deepEqual(trail.itemListElement.map((x) => x.item), [SITE + "/", SITE + "/tickets/", SITE + "/tickets/" + f.slug]);
    for (const sc of desks) {
      assert.ok(h.includes(`href="/tickets/${sc.id}"`), f.slug + " lists " + sc.id);
      assert.ok(read(`tickets/${sc.id}.html`).includes(`<a href="/tickets/${f.slug}">`), sc.id + " links its family");
    }
    assert.ok(index.includes(`href="/tickets/${f.slug}"`), "index links " + f.slug);
  }
  assert.equal(total, SCENARIOS.length);
});

test("the FAQ gives the current number of tickets and links the list", () => {
  const h = read("faq.html");
  assert.ok(h.includes(`<p>${SCENARIOS.length} por ahora, ordenados por niveles de carrera`) && h.includes(`<p>${SCENARIOS.length} so far, ordered by career level`));
  assert.ok(h.includes('<a href="/tickets/">lista de tickets</a>') && h.includes('<a href="/tickets/">tickets list</a>'));
});

test("decision cases (v0.17): their pages say so and give no option, verdict, review or remark away", () => {
  const cases = SCENARIOS.filter((sc) => sc.machine.shell === "case");
  assert.equal(cases.length, 24);
  const index = read("tickets/index.html");
  for (const sc of cases) {
    const h = read(`tickets/${sc.id}.html`);
    const plain = h.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    assert.ok(plain.includes("Caso de decisión · ") && plain.includes("Decision case · "), sc.id + " says it is a decision case");
    assert.ok(plain.includes("Es un caso de decisión: en vez de una consola") && plain.includes("It is a decision case: instead of a system console"), sc.id + " explains the format");
    assert.ok(!plain.includes("Lo resuelves en una consola simulada"), sc.id + " does not promise a console");
    assert.ok(index.includes(`href="/tickets/${sc.id}">${sc.title.es}</a> <span class="tk-tag">Caso de decisión · `), sc.id + " in the list as a decision case");
    // the requester may mention the tempting option in the ticket ("Dell has sent a quote for a bigger host"); the rest of the page may not
    const low = plain.toLowerCase().split(sc.ticket.body.es.toLowerCase()).join("").split(sc.ticket.body.en.toLowerCase()).join("");
    for (const o of sc.case.options) {
      for (const l of ["es", "en"]) {
        for (const x of [o.name[l], o.short[l]].concat(o.review[l], o.detail[l], o.plan[l], o.remark ? [o.remark[l]] : [], o.reviewSay ? [o.reviewSay[l]] : [])) {
          assert.ok(!low.includes(x.trim().toLowerCase()), `${sc.id} shows option ${o.id}: ${x}`);
        }
      }
      assert.ok(!low.includes("decide " + o.id.toLowerCase() + " ") && !low.includes("decide " + o.id.toLowerCase() + "<"), `${sc.id} names a decision`);
    }
    for (const l of ["es", "en"]) for (const d of sc.case.docs) for (const x of d.text[l]) if (x.length > 25) assert.ok(!plain.includes(x), `${sc.id} shows the case file: ${x}`);
  }
});

test("v0.18: the families are a row of buttons on the list and on every family page, and the decision cases have their own", () => {
  const nav = (h) => h.match(/<nav class="tk-fams" aria-label="[^"]+">[\s\S]*?<\/nav>/g) || [];
  const index = read("tickets/index.html");
  assert.equal(nav(index).length, 2, "one row per language on /tickets/");
  assert.ok(index.indexOf('class="tk-fams"') < index.indexOf('class="tk-list"'), "the buttons come before the lists");
  assert.ok(!nav(index).join("").includes("aria-current"), "no family is current on the list");
  for (const f of FAMILIES) {
    const h = read(`tickets/${f.slug}.html`);
    const rows = nav(h);
    assert.equal(rows.length, 2, f.slug + " has the row in both languages");
    for (const row of rows) {
      assert.equal((row.match(/aria-current="page"/g) || []).length, 1, f.slug + ": exactly one current family");
      assert.ok(row.includes(`<a class="tk-fam" href="/tickets/${f.slug}" aria-current="page">`), f.slug + " is the current one");
      FAMILIES.forEach((g) => assert.ok(row.includes(`href="/tickets/${g.slug}"`), `${f.slug} links ${g.slug}`));
      assert.ok(!/style=/.test(row), "no inline styles (the CSP forbids them)");
    }
  }
  const cases = SCENARIOS.filter((sc) => sc.machine.shell === "case");
  assert.ok(cases.length >= 5);
  for (const sc of cases.filter((x) => x.career === 7)) assert.equal(familyOf(sc.id).slug, "architecture", sc.id);
  assert.deepEqual(SCENARIOS.filter((sc) => familyOf(sc.id).slug === "architecture").map((sc) => sc.id).sort(), cases.filter((sc) => sc.career === 7).map((sc) => sc.id).sort());
  const css = readFileSync(new URL("../public/assets/style.css", import.meta.url), "utf8");
  assert.ok(css.includes(".tk-fam[aria-current=\"page\"]") && css.includes(".tk-fams ul"), "the buttons are styled in style.css");
  assert.ok(read("sitemap.xml").includes("<loc>https://sysadmindesksbyigg.pages.dev/tickets/architecture</loc>"));
  // v0.19: the IT manager's cases (career level 8) have their own family, management
  for (const sc of cases.filter((x) => x.career === 8)) assert.equal(familyOf(sc.id).slug, "management", sc.id);
  assert.deepEqual(SCENARIOS.filter((sc) => familyOf(sc.id).slug === "management").map((sc) => sc.id).sort(), cases.filter((sc) => sc.career === 8).map((sc) => sc.id).sort());
  const mg = read("tickets/management.html");
  assert.ok(mg.includes("<h1>Casos de gestión de IT y servicio</h1>") && mg.includes("IT and service management"));
  assert.ok(mg.includes('<span class="tk-tag">Responsable de IT · Caso de decisión · ') && mg.includes('<span class="tk-tag">IT manager · Decision case · '));
  assert.ok(read("sitemap.xml").includes("<loc>https://sysadmindesksbyigg.pages.dev/tickets/management</loc>"));
  // v0.20: the IT director's cases (career level 9) have their own family, leadership, ready for the CIO's (level 10)
  for (const sc of cases.filter((x) => x.career >= 9)) assert.equal(familyOf(sc.id).slug, "leadership", sc.id);
  assert.deepEqual(SCENARIOS.filter((sc) => familyOf(sc.id).slug === "leadership").map((sc) => sc.id).sort(), cases.filter((sc) => sc.career >= 9).map((sc) => sc.id).sort());
  const ld = read("tickets/leadership.html");
  assert.ok(ld.includes("<h1>Casos de dirección de IT y CIO</h1>") && ld.includes("IT leadership and CIO"));
  assert.ok(ld.includes('<span class="tk-tag">Dirección de IT · Caso de decisión · ') && ld.includes('<span class="tk-tag">IT director · Decision case · '));
  assert.ok(read("sitemap.xml").includes("<loc>https://sysadmindesksbyigg.pages.dev/tickets/leadership</loc>"));
});
