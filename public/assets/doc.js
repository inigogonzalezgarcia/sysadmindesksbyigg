/* SysAdmin Desks by IGG - static pages (about, help, FAQ, terms, privacy, tickets/).
   Each page carries both languages; show the one picked in the simulator (sd.lang, or ?lang=) and add the switch. */
(function () {
  "use strict";
  function load() { try { return JSON.parse(localStorage.getItem("sd.lang")); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem("sd.lang", JSON.stringify(v)); } catch (e) { /* private mode */ } }
  var asked = null;
  try { asked = new URLSearchParams(location.search).get("lang"); } catch (e) { /* old browser */ }
  var lang = asked === "es" || asked === "en" ? asked : location.hash === "#en" ? "en" : load();
  if (lang !== "es" && lang !== "en") lang = (navigator.language || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en";
  var btn = document.getElementById("doc-lang");
  // the <title> in the HTML is the Spanish one (the default visible language); English uses data-title-en, or the H1
  var titleEs = document.title, titleEn = document.documentElement.getAttribute("data-title-en");
  function apply() {
    document.body.classList.remove("doc-es", "doc-en");
    document.body.classList.add("doc-" + lang);
    document.documentElement.lang = lang;
    btn.textContent = lang === "es" ? "EN" : "ES";
    btn.setAttribute("aria-label", lang === "es" ? "English" : "Español");
    var h1 = document.querySelector("article." + lang + " h1");
    if (lang === "es") document.title = titleEs;
    else document.title = titleEn || (h1 ? h1.textContent + " · SysAdmin Desks by IGG" : titleEs);
    // a link to a section (/privacy#cookies) lands on that section in the language shown
    var h = location.hash.slice(1);
    if (h && h !== "en") {
      var role = /^(carrera|career)-(\d+)$/.exec(h);
      var base = h.replace(/-en$/, ""), want = role ? (lang === "en" ? "career-" : "carrera-") + role[2] : lang === "en" ? base + "-en" : base;
      var t = document.getElementById(want);
      if (t && want !== h) { history.replaceState(null, "", "#" + want); t.scrollIntoView(); }
    }
  }
  // the top menu (/tickets/ pages): one drop-down open at a time; a click outside or Escape closes it; ☰ shows it on a phone
  var menu = document.getElementById("nav-menu"), tg = document.getElementById("nav-toggle");
  if (menu && tg) {
    tg.hidden = false;
    var closeAll = function (except) { Array.prototype.forEach.call(menu.querySelectorAll("details[open]"), function (d) { if (d !== except) d.open = false; }); };
    var show = function (on) { menu.classList.toggle("open", on); tg.setAttribute("aria-expanded", String(on)); if (!on) closeAll(); };
    tg.addEventListener("click", function () { show(!menu.classList.contains("open")); });
    menu.addEventListener("toggle", function (ev) { if (ev.target.open) closeAll(ev.target); }, true);
    document.addEventListener("click", function (ev) { if (!ev.target.closest(".top-nav") || ev.target.closest("#nav-menu a")) show(false); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") show(false); });
  }
  // the roles on /tickets/: #carrera-N in Spanish is #career-N in English
  window.addEventListener("hashchange", function () { apply(); });
  btn.hidden = false;
  btn.addEventListener("click", function () { lang = lang === "es" ? "en" : "es"; save(lang); apply(); });
  apply();
})();
