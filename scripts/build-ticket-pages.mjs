// npm run pages: the SEO parts of the public pages, built from public/assets/scenarios.js and scripts/ticket-pages-data.mjs.
//  - public/tickets/<desk id>.html, one public page per desk, and public/tickets/index.html (the list);
//  - the <!-- seo --> block in the <head> of index, about, help, faq, terms and privacy (title, description, canonical,
//    Open Graph, Twitter card and JSON-LD: WebApplication on the home page, FAQPage on /faq built from the visible Spanish FAQ);
//  - the desk lists between <!-- tickets:es --> / <!-- tickets:en --> markers in index.html and about.html.
// node scripts/build-ticket-pages.mjs          writes the files
// node scripts/build-ticket-pages.mjs --check  exits 1 if any file is not up to date (tests/seo.test.mjs does the same)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { TICKET_SEO } from "./ticket-pages-data.mjs";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public");
export const SITE = "https://sysadmindesksbyigg.pages.dev";
export const SCENARIOS = require("../public/assets/scenarios.js");
const CSP = "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self'; img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; base-uri 'none'; form-action 'none'";
const GUIDES = "https://inigogonzalezgarcia.github.io/guias.html";
const REPORT = "https://inigogonzalezgarcia.github.io/about.html?tema=sysadmindesks#contacto";
const SLA = { P1: 20, P2: 30, P3: 45 };

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const tx = (v, lang) => (v && typeof v === "object" ? v[lang] : v);
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// the static pages: Spanish title and description (the default visible language), English title for doc.js
export const STATIC = {
  "index.html": { path: "/", title: "SysAdmin Desks · simulador gratuito de soporte IT", titleEn: "SysAdmin Desks · free IT support simulator",
    desc: "Practica soporte IT gratis en el navegador: 18 tickets de Active Directory, Microsoft 365, redes, Linux y SQL Server, con consola simulada y nota de trabajo." },
  "help.html": { path: "/help", title: "Ayuda · cómo practicar soporte IT en SysAdmin Desks", titleEn: "Help · how to practise IT support on SysAdmin Desks",
    desc: "Cómo funciona SysAdmin Desks: empezar, resolver un ticket de principio a fin, el SLA, la puntuación, la consola, el directorio y qué hacer si algo falla." },
  "terms.html": { path: "/terms", title: "Términos de uso · SysAdmin Desks by IGG", titleEn: "Terms of use · SysAdmin Desks by IGG",
    desc: "Términos de uso de SysAdmin Desks by IGG, un simulador educativo y gratuito de soporte IT: qué ofrece, qué no y cómo usarlo." },
  "privacy.html": { path: "/privacy", title: "Política de privacidad · SysAdmin Desks by IGG", titleEn: "Privacy policy · SysAdmin Desks by IGG",
    desc: "Política de privacidad de SysAdmin Desks by IGG: qué datos se guardan, para qué, durante cuánto tiempo y cuáles son tus derechos." },
  "about.html": { path: "/about", title: "Qué es SysAdmin Desks · simulador de soporte IT gratis", titleEn: "What SysAdmin Desks is · free IT support simulator",
    desc: "Simulador gratuito de mesa de soporte IT en el navegador: qué es, para quién, cómo se corrige cada ticket y lo que no es. Sin instalar nada." },
  "faq.html": { path: "/faq", title: "Preguntas frecuentes · SysAdmin Desks, simulador de soporte IT", titleEn: "FAQ · SysAdmin Desks, the IT support simulator",
    desc: "¿Es gratis? ¿Qué tickets hay? ¿Se guarda el progreso? Respuestas sobre SysAdmin Desks, el simulador de soporte IT para practicar help desk." },
};
const TICKETS_INDEX = { path: "/tickets/", title: "Tickets para practicar soporte IT · SysAdmin Desks", titleEn: "Tickets to practise IT support · SysAdmin Desks",
  desc: "Los 18 tickets de SysAdmin Desks para practicar soporte IT gratis: Active Directory, DNS, Microsoft 365, Exchange Online, Intune, Linux, Citrix y SQL Server." };

export const ticketPath = (sc) => "/tickets/" + sc.id;
export function ticketMeta(sc) {
  const seo = TICKET_SEO[sc.id];
  if (!seo) throw new Error("scripts/ticket-pages-data.mjs has no entry for " + sc.id);
  return { path: ticketPath(sc), title: tx(sc.title, "es") + " · práctica de soporte IT", titleEn: tx(sc.title, "en") + " · IT support practice", desc: seo.es.desc, seo };
}

// the <head> block shared by every public page
function seoHead(m, extra) {
  const url = SITE + m.path;
  return [
    "<!-- seo: generated by scripts/build-ticket-pages.mjs (npm run pages); edit it there -->",
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.desc)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="SysAdmin Desks by IGG">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/assets/og.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="SysAdmin Desks: simulador gratuito de soporte IT · free IT support simulator">`,
    `<meta property="og:locale" content="es_ES">`,
    `<meta property="og:locale:alternate" content="en_GB">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].concat(extra || []).concat(["<!-- /seo -->"]).join("\n");
}

const strip = (h) => h.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
// the visible Spanish FAQ, question and answer as plain text
export function faqItems(html) {
  const es = html.slice(html.indexOf('<article class="es"'), html.indexOf('<article class="en"'));
  return [...es.matchAll(/<details class="faq"><summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map((m) => ({ q: strip(m[1]), a: strip(m[2]) }));
}

function webApp() {
  return { "@context": "https://schema.org", "@type": "WebApplication", name: "SysAdmin Desks by IGG", url: SITE + "/",
    applicationCategory: "EducationalApplication", operatingSystem: "Web browser", inLanguage: ["es", "en"], isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    author: { "@type": "Person", name: "Iñigo González García", url: "https://inigogonzalezgarcia.github.io/" },
    image: SITE + "/assets/og.png",
    description: STATIC["index.html"].desc };
}
function faqPage(html) {
  return { "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "es",
    mainEntity: faqItems(html).map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
}

const LEVEL = { es: (n) => `Nivel ${n} · ${n === 1 ? "primera" : "segunda"} línea`, en: (n) => `Level ${n} · ${n === 1 ? "first" : "second"} line` };
function deskList(lang) {
  return '<ul class="tk-list">\n' + SCENARIOS.map((sc) =>
    `  <li><a href="${ticketPath(sc)}">${esc(tx(sc.title, lang))}</a> <span class="tk-tag">${esc(LEVEL[lang](sc.level))} · ${esc(tx(sc.topic, lang))}</span></li>`).join("\n") + "\n</ul>";
}

function replaceBlock(html, start, end, body, file) {
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error(`${file}: markers ${start} ... ${end} not found`);
  return html.slice(0, a + start.length) + "\n" + body + "\n" + html.slice(b);
}
function staticPage(file, html) {
  const m = STATIC[file];
  const extra = file === "index.html" ? [jsonld(webApp())] : file === "faq.html" ? [jsonld(faqPage(html))] : [];
  let out = html.replace(/<html lang="[a-z]+"[^>]*>/, `<html lang="es" data-title-en="${esc(m.titleEn)}">`);
  out = replaceBlock(out, "<!-- seo -->", "<!-- /seo -->", seoHead(m, extra).replace(/\n<!-- \/seo -->$/, ""), file);
  for (const lang of ["es", "en"]) {
    if (out.includes(`<!-- tickets:${lang} -->`)) out = replaceBlock(out, `<!-- tickets:${lang} -->`, `<!-- /tickets:${lang} -->`, deskList(lang), file);
  }
  return out;
}

/* ---------- the generated pages (same header, footer and style as about.html) */
function shell(m, mainHtml, current) {
  const nav = [["/tickets/", "Tickets", "Tickets", "tickets"], ["/about", "Qué es", "About"], ["/help", "Ayuda", "Help"], ["/faq", "Preguntas frecuentes", "FAQ"]];
  return `<!doctype html>
<html lang="es" data-title-en="${esc(m.titleEn)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
${seoHead(m)}
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/style.css">
<script src="/assets/doc.js" defer></script>
<script src="/assets/consent.js" defer></script>
</head>
<body class="doc">
<header class="top">
  <a class="brand" href="/"><span class="mark" aria-hidden="true">&gt;_</span><span>SysAdmin Desks</span><small>by IGG</small></a>
  <nav class="top-nav doc-nav">
${nav.map(([h, es, en, key]) => `    <a href="${h}"${key && key === current ? ' aria-current="page"' : ""}><span class="es">${es}</span><span class="en">${en}</span></a>`).join("\n")}
    <button type="button" id="doc-lang" class="lang" hidden>EN</button>
  </nav>
</header>
<main class="legal">
${mainHtml}
</main>
<footer class="foot">
  <p><a href="/tickets/"><span class="es">Tickets</span><span class="en">Tickets</span></a> · <a href="/about"><span class="es">Qué es</span><span class="en">About</span></a> · <a href="/help"><span class="es">Ayuda</span><span class="en">Help</span></a> · <a href="/faq"><span class="es">Preguntas frecuentes</span><span class="en">FAQ</span></a> · <a href="/terms"><span class="es">Términos de uso</span><span class="en">Terms of use</span></a> · <a href="/privacy"><span class="es">Privacidad</span><span class="en">Privacy</span></a></p>
  <p><a href="${REPORT}" target="_blank" rel="noopener noreferrer"><span class="es">Informar de un error</span><span class="en">Report a problem</span></a> · <a href="/"><span class="es">Volver al simulador</span><span class="en">Back to the simulator</span></a> · <button type="button" class="linkbtn" data-cookie-settings><span class="es">Preferencias de cookies</span><span class="en">Cookie settings</span></button> · <a href="https://inigogonzalezgarcia.github.io/" target="_blank" rel="noopener noreferrer">inigogonzalezgarcia.github.io</a></p>
</footer>
</body>
</html>
`;
}

const T = {
  es: { crumbs: "Tickets para practicar", cta: "Practícalo gratis", ticket: "El ticket", from: "Lo abre", skills: "Qué practicas",
    how: "Lo resuelves en una consola simulada (PowerShell, cmd o bash) con el directorio, el inventario y la ficha del ticket. Se corrige por el estado del sistema, no por una plantilla: tapar el síntoma no basta. Al cerrar escribes la nota de trabajo (causa, cambio, comprobación y seguimiento) y recibes la puntuación.",
    guideH: "Guía relacionada", guide: (a) => `¿Quieres repasar el tema antes? Lee la ${a} en inigogonzalezgarcia.github.io, que explica lo que practicas en este ticket.`, guideA: "guía paso a paso",
    prio: (p) => `Prioridad ${p} · SLA ${SLA[p]} min`, mins: (n) => `Unos ${n} minutos`, all: "Ver todos los tickets",
    fiction: "Empresa (Contoso), personas y datos ficticios. Es práctica, no un sistema real.",
    idxH1: "Tickets para practicar soporte IT", idxLead: "Dieciocho tickets de una mesa de soporte de primera y segunda línea, de una empresa ficticia. Cada uno se resuelve en el navegador, gratis, con una consola simulada, y se cierra con una nota de trabajo puntuada.",
    idxL1: "Nivel 1 · primera línea", idxL2: "Nivel 2 · segunda línea", idxMore: (a, b, c) => `¿Cómo funciona? Lo tienes en ${a}, la ${b} y las ${c}.`, about: "qué es SysAdmin Desks", help: "ayuda", faq: "preguntas frecuentes", start: "Empieza gratis" },
  en: { crumbs: "Tickets to practise", cta: "Practise it free", ticket: "The ticket", from: "Opened by", skills: "What you practise",
    how: "You solve it in a simulated console (PowerShell, cmd or bash) with the directory, the inventory and the ticket page. It is checked against the state of the system, not a template: hiding the symptom is not enough. When you close it you write the work note (cause, change, check and follow-up) and get your score.",
    guideH: "Related guide", guide: (a) => `Want to brush up first? Read the ${a} on inigogonzalezgarcia.github.io, which explains what you practise on this ticket.`, guideA: "step-by-step guide",
    prio: (p) => `Priority ${p} · SLA ${SLA[p]} min`, mins: (n) => `About ${n} minutes`, all: "See all the tickets",
    fiction: "Fictional company (Contoso), people and data. It is practice, not a real system.",
    idxH1: "Tickets to practise IT support", idxLead: "Eighteen first and second line help desk tickets from a fictional company. Each one is solved in the browser, free, with a simulated console, and closed with a scored work note.",
    idxL1: "Level 1 · first line", idxL2: "Level 2 · second line", idxMore: (a, b, c) => `How does it work? See ${a}, the ${b} and the ${c}.`, about: "what SysAdmin Desks is", help: "help", faq: "FAQ", start: "Start free" },
};

function ticketArticle(sc, lang) {
  const t = T[lang], seo = TICKET_SEO[sc.id][lang];
  const r = sc.requester || {};
  const from = r.name ? `${tx(r.name, lang)}${r.team ? " (" + tx(r.team, lang) + ")" : ""}` : sc.ticket.from;
  const cta = `/?lang=${lang}#/desk/${sc.id}`;
  const art = lang === "es" ? '<article class="es" lang="es">' : '<article class="en" lang="en" id="en">';
  return `${art}
<p class="tk-crumbs"><a href="/tickets/">${t.crumbs}</a> › ${esc(tx(sc.topic, lang))}</p>
<h1>${esc(tx(sc.title, lang))}</h1>
<p class="lead-p">${esc(seo.desc)}</p>
<ul class="tk-meta">
  <li>${esc(LEVEL[lang](sc.level))}</li>
  <li>${esc(tx(sc.topic, lang))}</li>
  <li>${esc(t.prio(sc.ticket.priority))}</li>
  <li>${esc(t.mins(sc.minutes))}</li>
</ul>
<p class="tk-cta"><a class="btn tk-btn" href="${cta}">${t.cta}</a></p>

<h2>${t.ticket}</h2>
<figure class="tk-ticket">
  <p class="tk-subject"><span class="tk-id">${esc(sc.ticket.id)}</span> ${esc(tx(sc.ticket.subject, lang))}</p>
  <blockquote><p>${esc(tx(sc.ticket.body, lang))}</p></blockquote>
  <figcaption>${t.from}: ${esc(from)}</figcaption>
</figure>

<h2>${t.skills}</h2>
<ul>
${seo.skills.map((s) => `  <li>${esc(s)}</li>`).join("\n")}
</ul>
<p>${esc(t.how)}</p>
${sc.guide ? `
<h2>${t.guideH}</h2>
<p>${t.guide(`<a href="${esc(sc.guide)}" target="_blank" rel="noopener noreferrer">${t.guideA}</a>`)}</p>
` : ""}
<p class="tk-cta"><a class="btn tk-btn" href="${cta}">${t.cta}</a> <a href="/tickets/">${t.all}</a></p>
<p class="fine">${esc(t.fiction)}</p>
</article>`;
}

function indexArticle(lang) {
  const t = T[lang];
  const art = lang === "es" ? '<article class="es" lang="es">' : '<article class="en" lang="en" id="en">';
  const group = (lvl) => '<ul class="tk-list">\n' + SCENARIOS.filter((sc) => sc.level === lvl).map((sc) =>
    `  <li><a href="${ticketPath(sc)}">${esc(tx(sc.title, lang))}</a> <span class="tk-tag">${esc(tx(sc.topic, lang))} · ${esc(sc.ticket.priority)}</span></li>`).join("\n") + "\n</ul>";
  const levels = [...new Set(SCENARIOS.map((sc) => sc.level))].sort();
  return `${art}
<h1>${t.idxH1}</h1>
<p class="lead-p">${esc(t.idxLead)}</p>
${levels.map((l) => `<h2 id="${lang === "es" ? "nivel" : "level"}-${l}">${l === 1 ? t.idxL1 : t.idxL2}</h2>\n${group(l)}`).join("\n")}
<p class="tk-cta"><a class="btn tk-btn" href="/?lang=${lang}#/register">${t.start}</a></p>
<p>${t.idxMore(`<a href="/about">${t.about}</a>`, `<a href="/help">${t.help}</a>`, `<a href="/faq">${t.faq}</a>`)}</p>
</article>`;
}

/* ---------- everything, as {relative path in public/: content} */
export function build() {
  const out = {};
  for (const file of Object.keys(STATIC)) out[file] = staticPage(file, readFileSync(join(PUB, file), "utf8"));
  out["tickets/index.html"] = shell(TICKETS_INDEX, indexArticle("es") + "\n\n" + indexArticle("en"), "tickets");
  for (const sc of SCENARIOS) out[`tickets/${sc.id}.html`] = shell(ticketMeta(sc), ticketArticle(sc, "es") + "\n\n" + ticketArticle(sc, "en"));
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  const stale = [];
  for (const [rel, content] of Object.entries(build())) {
    const file = join(PUB, rel);
    let now = null;
    try { now = readFileSync(file, "utf8"); } catch (e) { /* new */ }
    if (now === content) continue;
    stale.push(rel);
    if (!check) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); }
  }
  if (check && stale.length) { console.error("Not up to date (run npm run pages): " + stale.join(", ")); process.exit(1); }
  console.log(check ? "Pages up to date." : stale.length ? "Written: " + stale.join(", ") : "Nothing to change.");
}
