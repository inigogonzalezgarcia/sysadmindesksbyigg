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

// numbers in words for the counts (1-999), so the text follows the number of desks
const ES_U = ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiún","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
const ES_T = { 3: "treinta", 4: "cuarenta", 5: "cincuenta", 6: "sesenta", 7: "setenta", 8: "ochenta", 9: "noventa" };
const EN_U = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const EN_T = { 2: "twenty", 3: "thirty", 4: "forty", 5: "fifty", 6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety" };
const ES_H = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
export function words(n, lang) {
  if (n >= 100) {
    const h = Math.floor(n / 100), r = n % 100;
    if (lang === "es") return n === 100 ? "cien" : ES_H[h] + (r ? " " + (r === 1 ? "un" : words(r, lang)) : "");
    return EN_U[h] + " hundred" + (r ? " and " + words(r, lang) : "");
  }
  if (lang === "es") return n < 30 ? ES_U[n] : ES_T[Math.floor(n / 10)] + (n % 10 ? " y " + (n % 10 === 1 ? "un" : ES_U[n % 10]) : "");
  return n < 20 ? EN_U[n] : EN_T[Math.floor(n / 10)] + (n % 10 ? "-" + EN_U[n % 10] : "");
}
const Cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const N = () => SCENARIOS.length;
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// the static pages: Spanish title and description (the default visible language), English title for doc.js
export const STATIC = {
  "index.html": { path: "/", title: "SysAdmin Desks · simulador gratuito de soporte IT", titleEn: "SysAdmin Desks · free IT support simulator",
    desc: `Practica soporte IT gratis en el navegador: ${N()} tickets de Active Directory, Microsoft 365, redes, RMA, Linux y SQL Server, con consola y nota de trabajo.` },
  "help.html": { path: "/help", title: "Ayuda · cómo practicar soporte IT en SysAdmin Desks", titleEn: "Help · how to practise IT support on SysAdmin Desks",
    desc: "Cómo funciona SysAdmin Desks: empezar, resolver un ticket de principio a fin, el SLA, la puntuación, la consola, el directorio y qué hacer si algo falla." },
  "terms.html": { path: "/terms", title: "Términos de uso · SysAdmin Desks by IGG", titleEn: "Terms of use · SysAdmin Desks by IGG",
    desc: "Términos de uso de SysAdmin Desks by IGG, un simulador educativo y gratuito de soporte IT: qué ofrece, qué no y cómo usarlo." },
  "privacy.html": { path: "/privacy", title: "Política de privacidad · SysAdmin Desks by IGG", titleEn: "Privacy policy · SysAdmin Desks by IGG",
    desc: "Política de privacidad de SysAdmin Desks by IGG: qué datos se guardan, para qué, durante cuánto tiempo y cuáles son tus derechos." },
  "about.html": { path: "/about", title: "Qué es SysAdmin Desks · simulador de soporte IT gratis", titleEn: "What SysAdmin Desks is · free IT support simulator",
    desc: "Simulador gratuito de mesa de soporte IT en el navegador: qué es, para quién, cómo se corrige cada ticket y lo que no es. Sin instalar nada." },
  "faq.html": { path: "/faq", title: "Preguntas frecuentes · SysAdmin Desks, simulador soporte IT", titleEn: "FAQ · SysAdmin Desks, the IT support simulator",
    desc: "¿Es gratis? ¿Qué tickets hay? ¿Se guarda el progreso? Respuestas sobre SysAdmin Desks, el simulador de soporte IT para practicar help desk." },
};
const TICKETS_INDEX = { path: "/tickets/", title: "Tickets para practicar soporte IT · SysAdmin Desks", titleEn: "Tickets to practise IT support · SysAdmin Desks",
  desc: `Los ${N()} tickets de SysAdmin Desks para practicar soporte IT gratis: Active Directory, Microsoft 365, Exchange, Intune, Linux, SQL Server, redes y RMA.` };

export const ticketPath = (sc) => "/tickets/" + sc.id;
// <title> of a ticket page: the SEO title of the desk if it has one (the words people search), else the ticket title;
// the long suffix while the whole title fits in TITLE_MAX characters (what Google shows), the short one beyond.
export const TITLE_MAX = 60;
const SUFFIX = { es: [" · práctica de soporte IT", " · práctica IT"], en: [" · IT support practice", " · IT practice"] };
export function seoTitle(sc, seo, lang) {
  const base = seo[lang].title || tx(sc.title, lang);
  return base + (base.length + SUFFIX[lang][0].length <= TITLE_MAX ? SUFFIX[lang][0] : SUFFIX[lang][1]);
}
export function ticketMeta(sc) {
  const seo = TICKET_SEO[sc.id];
  if (!seo) throw new Error("scripts/ticket-pages-data.mjs has no entry for " + sc.id);
  return { path: ticketPath(sc), title: seoTitle(sc, seo, "es"), titleEn: seoTitle(sc, seo, "en"), desc: seo.es.desc, seo };
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
// home → page trail for the static pages and the ticket index
function crumbs2(name, path) {
  return { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "SysAdmin Desks", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name, item: SITE + path }] };
}
const SITE_REF = { "@type": "WebSite", name: "SysAdmin Desks by IGG", url: SITE + "/" };
function aboutPage() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "AboutPage", name: "Qué es SysAdmin Desks", url: SITE + "/about", inLanguage: ["es", "en"], description: STATIC["about.html"].desc, isPartOf: SITE_REF },
    crumbs2("Qué es", "/about")] };
}
function helpCrumbs() { return { "@context": "https://schema.org", ...crumbs2("Ayuda", "/help") }; }
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
  const extra = file === "index.html" ? [jsonld(webApp())] : file === "faq.html" ? [jsonld(faqPage(html))]
    : file === "about.html" ? [jsonld(aboutPage())] : file === "help.html" ? [jsonld(helpCrumbs())] : [];
  if (file === "index.html") html = html
    .replace(/<p>[^<]*? tickets de primera y segunda línea\./, `<p>${Cap(words(N(), "es"))} tickets de primera y segunda línea.`)
    .replace(/<p>[^<]*? first and second line tickets\./, `<p>${Cap(words(N(), "en"))} first and second line tickets.`);
  if (file === "about.html") html = html
    .replace(/Ahora mismo hay [^<]*? tickets de primera y segunda línea/, `Ahora mismo hay ${words(N(), "es")} tickets de primera y segunda línea`)
    .replace(/There are [^<]*? tickets right now/, `There are ${words(N(), "en")} tickets right now`);
  let out = html.replace(/<html lang="[a-z]+"[^>]*>/, `<html lang="es" data-title-en="${esc(m.titleEn)}">`);
  out = replaceBlock(out, "<!-- seo -->", "<!-- /seo -->", seoHead(m, extra).replace(/\n<!-- \/seo -->$/, ""), file);
  for (const lang of ["es", "en"]) {
    if (out.includes(`<!-- tickets:${lang} -->`)) out = replaceBlock(out, `<!-- tickets:${lang} -->`, `<!-- /tickets:${lang} -->`, deskList(lang), file);
  }
  return out;
}

/* ---------- the generated pages (same header, footer and style as about.html) */
function shell(m, mainHtml, current, extra) {
  const nav = [["/tickets/", "Tickets", "Tickets", "tickets"], ["/about", "Qué es", "About"], ["/help", "Ayuda", "Help"], ["/faq", "Preguntas frecuentes", "FAQ"]];
  return `<!doctype html>
<html lang="es" data-title-en="${esc(m.titleEn)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
${seoHead(m, extra)}
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
    relH: "Tickets relacionados", prio: (p) => `Prioridad ${p} · SLA ${SLA[p]} min`, mins: (n) => `Unos ${n} minutos`, all: "Ver todos los tickets",
    fiction: "Empresa (Contoso), personas y datos ficticios. Es práctica, no un sistema real.",
    idxH1: "Tickets para practicar soporte IT", idxLead: () => `${Cap(words(N(), "es"))} tickets de una mesa de soporte de primera y segunda línea, de una empresa ficticia. Cada uno se resuelve en el navegador, gratis, con una consola simulada, y se cierra con una nota de trabajo puntuada.`,
    idxL1: "Nivel 1 · primera línea", idxL2: "Nivel 2 · segunda línea", idxMore: (a, b, c) => `¿Cómo funciona? Lo tienes en ${a}, la ${b} y las ${c}.`, about: "qué es SysAdmin Desks", help: "ayuda", faq: "preguntas frecuentes", start: "Empieza gratis" },
  en: { crumbs: "Tickets to practise", cta: "Practise it free", ticket: "The ticket", from: "Opened by", skills: "What you practise",
    how: "You solve it in a simulated console (PowerShell, cmd or bash) with the directory, the inventory and the ticket page. It is checked against the state of the system, not a template: hiding the symptom is not enough. When you close it you write the work note (cause, change, check and follow-up) and get your score.",
    guideH: "Related guide", guide: (a) => `Want to brush up first? Read the ${a} on inigogonzalezgarcia.github.io, which explains what you practise on this ticket.`, guideA: "step-by-step guide",
    relH: "Related tickets", prio: (p) => `Priority ${p} · SLA ${SLA[p]} min`, mins: (n) => `About ${n} minutes`, all: "See all the tickets",
    fiction: "Fictional company (Contoso), people and data. It is practice, not a real system.",
    idxH1: "Tickets to practise IT support", idxLead: () => `${Cap(words(N(), "en"))} first and second line help desk tickets from a fictional company. Each one is solved in the browser, free, with a simulated console, and closed with a scored work note.`,
    idxL1: "Level 1 · first line", idxL2: "Level 2 · second line", idxMore: (a, b, c) => `How does it work? See ${a}, the ${b} and the ${c}.`, about: "what SysAdmin Desks is", help: "help", faq: "FAQ", start: "Start free" },
};

// three tickets to practise next on each ticket page (same technology or the same kind of problem)
export const RELATED = {
  "ad-lockout": ["aadc-sync", "ca-blocked", "linux-sssd"],
  "dns-intranet": ["net-err-disabled", "net-wrong-vlan", "vpn-anyconnect"],
  "disk-full": ["print-queue", "laptop-rma", "rhel-var-full"],
  "print-queue": ["net-wrong-vlan", "disk-full", "ad-lockout"],
  "mailbox-full": ["shared-mailbox", "m365-licence", "intune-bitlocker"],
  "intune-bitlocker": ["ca-blocked", "m365-licence", "laptop-rma"],
  "vpn-anyconnect": ["dns-intranet", "net-fortigate-branch", "ca-blocked"],
  "m365-licence": ["aadc-sync", "shared-mailbox", "mailbox-full"],
  "shared-mailbox": ["mailbox-full", "m365-licence", "aadc-sync"],
  "aadc-sync": ["ad-lockout", "m365-licence", "sso-saml"],
  "veeam-job": ["sql-log-full", "rhel-var-full", "disk-full"],
  "mecm-app": ["intune-bitlocker", "citrix-session", "disk-full"],
  "rhel-var-full": ["linux-sssd", "disk-full", "sql-log-full"],
  "citrix-session": ["mecm-app", "sso-saml", "vpn-anyconnect"],
  "ca-blocked": ["sso-saml", "intune-bitlocker", "vpn-anyconnect"],
  "sso-saml": ["ca-blocked", "aadc-sync", "citrix-session"],
  "linux-sssd": ["ad-lockout", "rhel-var-full", "aadc-sync"],
  "sql-log-full": ["veeam-job", "rhel-var-full", "disk-full"],
  "net-err-disabled": ["net-wrong-vlan", "net-psu-rma", "dns-intranet"],
  "net-wrong-vlan": ["net-err-disabled", "print-queue", "net-fortigate-branch"],
  "net-fortigate-branch": ["vpn-anyconnect", "net-wrong-vlan", "dns-intranet"],
  "laptop-rma": ["leaver-return", "net-psu-rma", "intune-bitlocker"],
  "net-psu-rma": ["laptop-rma", "net-err-disabled", "net-fortigate-branch"],
  "leaver-return": ["laptop-rma", "m365-licence", "ad-lockout"],
  "new-laptops-intake": ["leaver-return", "laptop-rma", "starter-desk-ready"],
  "starter-desk-ready": ["ad-lockout", "m365-licence", "aadc-sync"],
  "teams-no-audio": ["room-no-display", "m365-licence", "dns-intranet"],
  "room-no-display": ["teams-no-audio", "print-queue", "net-err-disabled"],
  "win-temp-profile": ["disk-full", "gpo-drive-missing", "teams-no-audio"],
  "gpo-drive-missing": ["starter-desk-ready", "ntfs-access-denied", "win-temp-profile"],
  "epm-elevation": ["intune-bitlocker", "mecm-app", "win-temp-profile"],
  "ad-deleted-user": ["ad-lockout", "starter-desk-ready", "aadc-sync"],
  "dhcp-scope-full": ["dns-intranet", "net-wrong-vlan", "new-laptops-intake"],
  "ntfs-access-denied": ["gpo-drive-missing", "shared-mailbox", "ad-deleted-user"],
  "ups-no-alert": ["net-psu-rma", "veeam-job", "sql-log-full"],
  "android-work-profile": ["iphone-no-policies", "mdm-lost-phone", "intune-bitlocker"],
  "iphone-no-policies": ["android-work-profile", "mdm-lost-phone", "m365-licence"],
  "retail-new-starter": ["starter-desk-ready", "gpo-drive-missing", "store-label-printer"],
  "anyconnect-hotel": ["vpn-anyconnect", "dns-intranet", "teams-no-audio"],
  "store-label-printer": ["print-queue", "retail-new-starter", "new-laptops-intake"],
  "poly-room-no-camera": ["room-no-display", "teams-no-audio", "anyconnect-hotel"],
  "mdm-lost-phone": ["iphone-no-policies", "android-work-profile", "ca-blocked"],
  "confluence-runbook-stale": ["gpo-drive-missing", "ntfs-access-denied", "veeam-job"],
  "jamf-policy-not-running": ["intune-bitlocker", "mecm-app", "iphone-no-policies"],
  "pdq-deploy-fails": ["mecm-app", "gpo-drive-missing", "net-wrong-vlan"],
  "sharepoint-shared-everyone": ["shared-mailbox", "ntfs-access-denied", "ca-blocked"],
  "pos-kitchen-printer": ["store-label-printer", "tplink-dhcp-clash", "cashdro-close-mismatch"],
  "cashdro-close-mismatch": ["pos-kitchen-printer", "retail-new-starter", "store-4g-failover"],
  "as400-user-disabled": ["ad-lockout", "starter-desk-ready", "sap-printer-sap"],
  "sap-printer-sap": ["print-queue", "store-label-printer", "as400-user-disabled"],
  "crestron-room-teams": ["room-no-display", "poly-room-no-camera", "teams-no-audio"],
  "store-4g-failover": ["net-fortigate-branch", "tplink-dhcp-clash", "anyconnect-hotel"],
  "win-update-rollback": ["disk-full", "win-temp-profile", "intune-bitlocker"],
  "tplink-dhcp-clash": ["dhcp-scope-full", "pos-kitchen-printer", "store-4g-failover"],
  "squid-blocked-site": ["rhel-var-full", "dns-intranet", "linux-sssd"],
  "usb-blocked-camera": ["gpo-drive-missing", "epm-elevation", "intune-bitlocker"],
  "bash-disk-check": ["rhel-var-full", "squid-blocked-site", "disk-full"],
  "git-script-overwritten": ["confluence-runbook-stale", "ad-deleted-user", "starter-desk-ready"],
  "ps-inventory-csv": ["pdq-deploy-fails", "new-laptops-intake", "mecm-app"],
  "ubuntu-ssh-locked": ["linux-sssd", "rhel-var-full", "net-fortigate-branch"],
  "winserver-role-eventlog": ["print-queue", "sap-printer-sap", "win-update-rollback"],
  "graph-report-mfa": ["ca-blocked", "m365-licence", "sso-saml"],
  "solarwinds-alert-storm": ["ups-no-alert", "net-err-disabled", "store-4g-failover"],
  "pms-room-charge": ["pos-kitchen-printer", "cashdro-close-mismatch", "tplink-dhcp-clash"],
  "iptv-no-channels": ["net-wrong-vlan", "tplink-dhcp-clash", "room-no-display"],
  "tape-backup-unreadable": ["veeam-job", "sql-log-full", "veeam-restore-test"],
  "veeam-restore-test": ["veeam-job", "tape-backup-unreadable", "ntfs-access-denied"],
  "ca-trading-block": ["ca-blocked", "pim-role-expired", "graph-report-mfa"],
  "pim-role-expired": ["shared-mailbox", "ca-trading-block", "graph-report-mfa"],
  "device42-rack-mismatch": ["ups-no-alert", "server-psu-rma", "new-laptops-intake"],
  "intune-ring-stuck": ["win-update-rollback", "intune-bitlocker", "epm-elevation"],
  "idrac-no-alerts": ["ups-no-alert", "server-psu-rma", "solarwinds-alert-storm"],
  "ups-runtime-low": ["ups-no-alert", "pms-room-charge", "iptv-no-channels"],
  "zabbix-pos-down": ["pos-kitchen-printer", "solarwinds-alert-storm", "tplink-dhcp-clash"],
  "omada-guest-wifi": ["tplink-dhcp-clash", "pms-room-charge", "iptv-no-channels"],
  "ps-ad-weekly-report": ["ps-inventory-csv", "ad-deleted-user", "graph-report-mfa"],
  "server-psu-rma": ["idrac-no-alerts", "net-psu-rma", "laptop-rma"],
  "apache-default-page": ["ubuntu-ssh-locked", "bash-disk-check", "squid-blocked-site"],
  "zabbix-agent-unreachable": ["zabbix-pos-down", "solarwinds-alert-storm", "nagios-flapping"],
  "hotspot-vouchers": ["omada-guest-wifi", "wap-guest-portal", "pms-room-charge"],
  "gpo-msi-not-installed": ["mecm-app", "pdq-deploy-fails", "ntfs-access-denied"],
  "aruba-voice-vlan": ["net-wrong-vlan", "iptv-no-channels", "wap-guest-portal"],
  "wap-guest-portal": ["omada-guest-wifi", "hotspot-vouchers", "net-wrong-vlan"],
  "cacti-graph-flat": ["solarwinds-alert-storm", "zabbix-agent-unreachable", "store-4g-failover"],
  "nagios-flapping": ["solarwinds-alert-storm", "zabbix-pos-down", "store-4g-failover"],
  "rdp-nla-denied": ["gpo-drive-missing", "ca-blocked", "winserver-role-eventlog"],
  "firewall-gpo-app": ["pdq-deploy-fails", "usb-blocked-camera", "rdp-nla-denied"],
  "chrome-extension-gpo": ["usb-blocked-camera", "squid-blocked-site", "gpo-msi-not-installed"],
  "ubuntu-nfs-mount": ["ubuntu-ssh-locked", "bash-disk-check", "apache-default-page"],
  "horizon-pool-error": ["citrix-session", "citrix-clinical-app", "intune-ring-stuck"],
  "docker-container-restarting": ["apache-default-page", "ubuntu-nfs-mount", "elk-no-logs"],
  "elk-no-logs": ["linux-sssd", "zabbix-agent-unreachable", "docker-container-restarting"],
  "hyperv-checkpoint-disk": ["vcenter-snapshot-aged", "veeam-restore-test", "disk-full"],
  "ndes-wifi-cert": ["intune-bitlocker", "android-work-profile", "epm-elevation"],
  "landscape-patch-window": ["intune-ring-stuck", "ubuntu-nfs-mount", "win-update-rollback"],
  "vcenter-snapshot-aged": ["hyperv-checkpoint-disk", "veeam-restore-test", "idrac-no-alerts"],
  "nutanix-disk-failed": ["server-psu-rma", "idrac-no-alerts", "pms-room-charge"],
  "purview-label-cant-open": ["sharepoint-shared-everyone", "ca-blocked", "shared-mailbox"],
  "o365-wrong-licence": ["m365-licence", "retail-new-starter", "graph-report-mfa"],
  "citrix-clinical-app": ["citrix-session", "horizon-pool-error", "gpo-msi-not-installed"],
  "rhel-slow-io": ["rhel-var-full", "bash-disk-check", "sql-log-full"],
  "winserver-patch-cluster": ["winserver-role-eventlog", "landscape-patch-window", "intune-ring-stuck"],
  "wan-site-slow": ["net-fortigate-branch", "cacti-graph-flat", "trading-switch-loop"],
  "sql-restore-pit": ["sql-log-full", "veeam-restore-test", "ad-deleted-user"],
  "vmware-host-maint": ["vcenter-snapshot-aged", "nutanix-disk-failed", "hyperv-checkpoint-disk"],
  "trading-switch-loop": ["net-err-disabled", "ca-trading-block", "wan-site-slow"],
  "tanium-stale-endpoint": ["intune-ring-stuck", "pdq-deploy-fails", "squid-blocked-site"],
  "python-report-fails": ["ps-ad-weekly-report", "bash-disk-check", "git-script-overwritten"],
  "gpo-ntlm-pilot": ["rdp-nla-denied", "firewall-gpo-app", "store-label-printer"],
  "defender-asr-block": ["epm-elevation", "usb-blocked-camera", "gpo-msi-not-installed"],
  "nginx-502": ["apache-default-page", "docker-container-restarting", "iis-503"],
  "iis-503": ["dns-intranet", "nginx-502", "rdp-nla-denied"],
  "wordpress-plugin-down": ["docker-container-restarting", "apache-default-page", "nginx-502"],
  "gmsa-service-fails": ["iis-503", "ad-lockout", "winserver-role-eventlog"],
  "iis-first-request-slow": ["iis-503", "nginx-502", "rhel-slow-io"],
  "db-restore-test": ["veeam-restore-test", "sql-restore-pit", "mysql-slow-queries"],
  "mysql-slow-queries": ["rhel-slow-io", "sql-log-full", "db-restore-test"],
  "ps-remoting-double-hop": ["rdp-nla-denied", "gpo-ntlm-pilot", "ps-inventory-csv"],
  "zabbix-switch-snmp": ["cacti-graph-flat", "zabbix-agent-unreachable", "zabbix-service-down"],
  "zabbix-service-down": ["zabbix-agent-unreachable", "nagios-flapping", "zabbix-switch-snmp"],
  "zabbix-ups-ipmi": ["ups-no-alert", "idrac-no-alerts", "zabbix-switch-snmp"],
  "cisco-aaa-lockout": ["net-err-disabled", "trading-switch-loop", "cisco-portchannel-member"],
  "cisco-portchannel-member": ["net-wrong-vlan", "aruba-voice-vlan", "cisco-aaa-lockout"],
  "mikrotik-wireguard": ["net-fortigate-branch", "store-4g-failover", "hotspot-vouchers"],
  "pfsense-nat-rule": ["mikrotik-wireguard", "net-fortigate-branch", "firewall-gpo-app"],
  "opnsense-ips-block": ["squid-blocked-site", "defender-asr-block", "pfsense-nat-rule"],
  "radius-peap-fail": ["ndes-wifi-cert", "cisco-aaa-lockout", "wap-guest-portal"],
  "asterisk-trunk-down": ["mikrotik-wireguard", "teams-no-audio", "store-4g-failover"],
  "audit-4740-missing": ["ad-lockout", "gpo-ntlm-pilot", "winserver-role-eventlog"],
  "ad-time-skew": ["dc-no-replication", "hyperv-checkpoint-disk", "ad-lockout"],
  "ps-unsigned-script": ["git-script-overwritten", "gmsa-service-fails", "ps-ad-weekly-report"],
  "powercli-report": ["ps-inventory-csv", "vcenter-snapshot-aged", "graph-report-mfa"],
  "esxi-not-responding": ["vmware-host-maint", "vcenter-snapshot-aged", "veeam-job"],
  "dc-no-replication": ["ad-time-skew", "dns-intranet", "ad-deleted-user"],
  "zabbix-alert-storm": ["zabbix-service-down", "solarwinds-alert-storm", "nagios-flapping"],
  "sentinel-impossible-travel": ["ca-blocked", "ca-trading-block", "graph-report-mfa"],
  "azmon-agent-silent": ["zabbix-agent-unreachable", "elk-no-logs", "zabbix-service-down"],
  "cyberark-cpm-fails": ["gmsa-service-fails", "ad-deleted-user", "pim-role-expired"],
  "openshift-route-503": ["nginx-502", "docker-container-restarting", "iis-503"],
  "voice-line-bank": ["asterisk-trunk-down", "trading-switch-loop", "store-4g-failover"],
  "rabbitmq-queue-growing": ["citrix-clinical-app", "docker-container-restarting", "zabbix-service-down"],
  "es-read-only": ["elk-no-logs", "rhel-var-full", "bash-disk-check"],
  "puppet-cert-agent": ["landscape-patch-window", "jamf-policy-not-running", "ndes-wifi-cert"],
  "postgres-bloat": ["mysql-slow-queries", "sql-log-full", "rhel-slow-io"],
  "zos-batch-abend": ["as400-user-disabled", "sql-log-full", "ps-unsigned-script"],
  "keycloak-ldap-login": ["sso-saml", "linux-sssd", "radius-peap-fail"],
  "pfsense-carp-failover": ["pfsense-nat-rule", "opnsense-ips-block", "net-fortigate-branch"],
  "redfish-firmware": ["idrac-no-alerts", "server-psu-rma", "esxi-not-responding"],
  "powerchute-shutdown": ["ups-no-alert", "ups-runtime-low", "vmware-host-maint"],
  "nginx-balancer-sticky": ["nginx-502", "iis-503", "openshift-route-503"],
  "grafana-site-panel": ["zabbix-alert-storm", "zabbix-switch-snmp", "cacti-graph-flat"],
  "fleet-agent-offline": ["elk-no-logs", "tanium-stale-endpoint", "es-read-only"],
  "splunk-source-missing": ["elk-no-logs", "sentinel-impossible-travel", "azmon-agent-silent"],
  "azure-bill-spike": ["azmon-agent-silent", "o365-wrong-licence", "vcenter-snapshot-aged"],
  "aws-no-share": ["net-fortigate-branch", "mikrotik-wireguard", "ps-remoting-double-hop"],
  "graph-429-report": ["graph-report-mfa", "python-report-fails", "ps-ad-weekly-report"],
  "cloudpc-no-connect": ["horizon-pool-error", "citrix-session", "dns-intranet"],
};
const BY_ID = Object.fromEntries(SCENARIOS.map((sc) => [sc.id, sc]));
function relatedList(sc, lang) {
  const ids = RELATED[sc.id];
  if (!ids || !ids.length) throw new Error("RELATED has no entry for " + sc.id);
  for (const id of ids) if (!BY_ID[id] || id === sc.id) throw new Error(`RELATED[${sc.id}]: bad ticket ${id}`);
  return '<ul class="tk-list tk-related">\n' + ids.map((id) => `  <li><a href="${ticketPath(BY_ID[id])}">${esc(tx(BY_ID[id].title, lang))}</a></li>`).join("\n") + "\n</ul>";
}

// the personal site serves English at /guias/ and Spanish at /es/guias/
const guideFor = (url, lang) => lang === "es" ? url.replace("github.io/guias/", "github.io/es/guias/") : url;

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
<p>${t.guide(`<a href="${esc(guideFor(sc.guide, lang))}" target="_blank" rel="noopener noreferrer">${t.guideA}</a>`)}</p>
` : ""}
<h2>${t.relH}</h2>
${relatedList(sc, lang)}
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
<p class="lead-p">${esc(t.idxLead())}</p>
${levels.map((l) => `<h2 id="${lang === "es" ? "nivel" : "level"}-${l}">${l === 1 ? t.idxL1 : t.idxL2}</h2>\n${group(l)}`).join("\n")}
<p class="tk-cta"><a class="btn tk-btn" href="/?lang=${lang}#/register">${t.start}</a></p>
<p>${t.idxMore(`<a href="/about">${t.about}</a>`, `<a href="/help">${t.help}</a>`, `<a href="/faq">${t.faq}</a>`)}</p>
</article>`;
}

// structured data: the trail home → tickets → ticket, and the list of tickets
function breadcrumbs(sc) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "SysAdmin Desks", item: SITE + "/" },
    { "@type": "ListItem", position: 2, name: T.es.crumbs, item: SITE + "/tickets/" },
    { "@type": "ListItem", position: 3, name: tx(sc.title, "es"), item: SITE + ticketPath(sc) }] };
}
function collection() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", name: T.es.idxH1, url: SITE + "/tickets/", inLanguage: ["es", "en"], isPartOf: SITE_REF,
      mainEntity: { "@type": "ItemList", numberOfItems: N(), itemListElement: SCENARIOS.map((sc, i) => ({ "@type": "ListItem", position: i + 1, url: SITE + ticketPath(sc), name: tx(sc.title, "es") })) } },
    crumbs2(T.es.crumbs, "/tickets/")] };
}

/* ---------- everything, as {relative path in public/: content} */
export function build() {
  const out = {};
  for (const file of Object.keys(STATIC)) out[file] = staticPage(file, readFileSync(join(PUB, file), "utf8"));
  out["tickets/index.html"] = shell(TICKETS_INDEX, indexArticle("es") + "\n\n" + indexArticle("en"), "tickets", [jsonld(collection())]);
  for (const sc of SCENARIOS) out[`tickets/${sc.id}.html`] = shell(ticketMeta(sc), ticketArticle(sc, "es") + "\n\n" + ticketArticle(sc, "en"), undefined, [jsonld(breadcrumbs(sc))]);
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
