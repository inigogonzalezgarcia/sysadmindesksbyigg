/* SysAdmin Desks by IGG - cookie consent and Google Analytics 4.
   GA4 is loaded only after the visitor accepts analytics. With GA_ID empty, nothing optional runs and no banner is shown.
   The choice lives in localStorage (sd.consent) and is asked again after 6 months. No innerHTML: the banner is built with DOM nodes. */
(function () {
  "use strict";
  var GA_ID = "G-6K78979739"; // Google Analytics 4 measurement ID (G-XXXXXXXXXX) of the sysadmindesksbyigg.pages.dev web stream
  var KEY = "sd.consent";
  var MAX_AGE = 1000 * 60 * 60 * 24 * 180;
  var root = document.documentElement;
  var lang = function () { return root.lang === "es" ? "es" : "en"; };
  var T = {
    es: {
      kicker: "SysAdmin Desks · Cookies", title: "¿Me dejas medir las visitas?",
      text: "Uso Google Analytics para saber cuánta gente usa el simulador y qué tickets abre, solo si lo aceptas. La cookie de tu sesión es necesaria y no requiere permiso. Puedes cambiar de opinión cuando quieras.",
      policy: "Política de privacidad y cookies",
      reject: "Rechazar", config: "Configurar", accept: "Aceptar analítica", save: "Guardar",
      necTitle: "Necesarias", necText: "La sesión iniciada (sd_session), tu idioma, tu progreso en el navegador y esta elección.",
      anTitle: "Analítica (Google Analytics)", anText: "Visitas, páginas y tickets abiertos, país y de dónde llegas, de forma agregada. Cookies _ga y _ga_*, hasta 2 años. Nunca tu email, tus notas ni tus comandos.",
      always: "Siempre activas"
    },
    en: {
      kicker: "SysAdmin Desks · Cookies", title: "Can I count the visits?",
      text: "I use Google Analytics to know how many people use the simulator and which tickets they open, only if you accept. Your session cookie is necessary and needs no permission. You can change your mind at any time.",
      policy: "Privacy and cookie policy",
      reject: "Reject", config: "Settings", accept: "Accept analytics", save: "Save",
      necTitle: "Necessary", necText: "Your signed-in session (sd_session), your language, your progress in the browser and this choice.",
      anTitle: "Analytics (Google Analytics)", anText: "Visits, pages and tickets opened, country and where you came from, in aggregate. Cookies _ga and _ga_*, up to 2 years. Never your email, notes or commands.",
      always: "Always on"
    }
  };

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || "null");
      if (c && typeof c.analytics === "boolean" && typeof c.ts === "number" && Date.now() - c.ts < MAX_AGE) return c;
    } catch (e) { /* storage blocked */ }
    return null;
  }
  function write(analytics) {
    var c = { analytics: !!analytics, ts: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* private mode */ }
    return c;
  }

  /* ---------- Google Analytics, consent mode on, nothing granted by default */
  var loaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  function page() {
    // the app routes with #/...: send the route as the page, without anything personal in it
    gtag("event", "page_view", { page_location: location.origin + location.pathname + location.hash, page_title: document.title });
  }
  function loadGA() {
    if (!GA_ID || loaded) return;
    loaded = true;
    gtag("consent", "update", { analytics_storage: "granted" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    page();
    window.addEventListener("hashchange", function () { setTimeout(page, 0); });
  }
  function clearGA() {
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n.indexOf("_ga") === 0) {
        ["", location.hostname, "." + location.hostname].forEach(function (d) {
          document.cookie = n + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
        });
      }
    });
  }
  function apply(c) {
    if (c && c.analytics) loadGA();
    else { clearGA(); if (loaded) location.reload(); }
  }

  /* ---------- banner */
  var box = null;
  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    for (var i = 3; i < arguments.length; i++) {
      var k = arguments[i];
      n.appendChild(typeof k === "string" ? document.createTextNode(k) : k);
    }
    return n;
  }
  function render(settings) {
    var t = T[lang()], c = read();
    if (!box) {
      box = el("div", "cc", { role: "dialog", "aria-live": "polite" });
      document.body.appendChild(box);
    }
    box.setAttribute("aria-label", t.title);
    var kids = [el("p", "cc-k", null, t.kicker), el("h2", "cc-t", null, t.title), el("p", "cc-x", null, t.text),
      el("a", "cc-p", { href: "privacy.html#cookies" }, t.policy)];
    if (settings) {
      var cb = el("input", null, { type: "checkbox", id: "cc-an" });
      cb.checked = !!(c && c.analytics);
      kids.push(el("div", "cc-s", null,
        el("div", "cc-row", null, el("div", null, null, el("strong", null, null, t.necTitle), el("p", null, null, t.necText)), el("span", "cc-on", null, t.always)),
        el("div", "cc-row", null, el("div", null, null, el("label", null, { for: "cc-an" }, el("strong", null, null, t.anTitle)), el("p", null, null, t.anText)),
          el("span", "cc-sw", null, cb, el("span", null, { "aria-hidden": "true" })))));
      kids.push(el("div", "cc-b", null, el("button", "btn", { type: "button", "data-cc": "save" }, t.save)));
    } else {
      kids.push(el("div", "cc-b", null, el("button", "btn ghost", { type: "button", "data-cc": "reject" }, t.reject),
        el("button", "btn ghost", { type: "button", "data-cc": "config" }, t.config),
        el("button", "btn", { type: "button", "data-cc": "accept" }, t.accept)));
    }
    box.replaceChildren.apply(box, kids);
    box.hidden = false;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".cc [data-cc]");
    if (b) {
      var a = b.getAttribute("data-cc");
      if (a === "config") { render(true); return; }
      var c = write(a === "accept" ? true : a === "save" ? box.querySelector("#cc-an").checked : false);
      box.hidden = true;
      apply(c);
      return;
    }
    var o = e.target.closest && e.target.closest("[data-cookie-settings]");
    if (o) { e.preventDefault(); if (GA_ID) render(true); }
  });
  new MutationObserver(function () { if (box && !box.hidden) render(!!box.querySelector(".cc-s")); })
    .observe(root, { attributes: true, attributeFilter: ["lang"] });

  // the "Cookie settings" links only show when there is something to choose
  if (GA_ID) root.classList.add("cc-on-site");
  if (!GA_ID) return;
  var saved = read();
  if (saved) apply(saved);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { render(false); });
  else render(false);
})();
