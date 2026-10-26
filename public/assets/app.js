/* SysAdmin Desks by IGG - user interface. Every text is set with textContent (no HTML strings). */
(function () {
  "use strict";
  const E = window.SDEngine;
  const SCENARIOS = window.SDScenarios;
  const t = E.t;

  const UI = {
    en: {
      heroTitle: "Practise real IT support tickets in a simulated console",
      heroText: "Each desk is a ticket from a fictional company. Investigate with the commands you would use at work, fix the cause, check it and write the work note.",
      how: [["1 · Read", "the ticket and what you have"], ["2 · Investigate", "in the console, like on a real machine"], ["3 · Fix and check", "the cause, not only the symptom"], ["4 · Write the note", "the next engineer will thank you"]],
      progress: (d, n, s) => `${d} of ${n} desks solved · ${s} stars`,
      start: "Start", again: "Play again", level: "Level", min: "min", back: "← All desks",
      ticket: "Ticket", context: "What you have", stages: "Progress", hint: "Hint", restart: "Restart",
      guide: "Read the guide", termHelp: "Type help for the basics. ↑/↓ repeat commands.",
      noteTitle: "Work note", noteText: "Write the note you would leave in the ticket: cause, what you changed, how you checked it and any follow-up.",
      submit: "Close the ticket", result: "Ticket closed", points: "points",
      found: "Your note covers", missing: "Your note is missing", sample: "An example note", solution: "One way to solve it",
      next: "Next desk", home: "All desks", noteEmpty: "Write a few lines first.",
      hintsUsed: (h) => `Hints used: ${h}`, guides: "Guides",
      foot: "Fictional company and people. Your progress is stored only in this browser.",
      welcome: "Connected to {host} as {user}. Type help if you need it.",
      langBtn: "ES", langLabel: "Español", notFound: "That desk does not exist.",
      startTag: "Help desk · morning shift", startTitle: "Clock in and start your support shift",
      startText: "SysAdmin Desks puts you at the help desk of a fictional company. Real tickets, a console that answers like a real machine, and a work note that is scored when you close the ticket.",
      startPoints: ["6 tickets: Active Directory, DNS, Windows, printers, Exchange Online and Intune", "Hints when you are stuck, and the tempting fix that does not solve it", "Each desk links to its step-by-step guide", "Your progress is saved in your account and follows you to any device"],
      deskHost: "CONTOSO-HD-07", deskDomain: "contoso.local", cardTitle: "Contoso help desk · technician sign-in",
      tabLogin: "Sign in", tabRegister: "Create account", fName: "Technician name", fAvatar: "Avatar", fEmail: "Email", fPassword: "Password",
      phName: "Alex Moreno", phEmail: "you@example.com", show: "Show password", hide: "Hide password",
      rules: { length: "8 characters or more", capital: "One capital letter", number: "One number" },
      consentA: "I have read the ", consentLink: "privacy policy", consentB: ".",
      btnLogin: "Clock in", btnRegister: "Create my account", or: "or", google: "Continue with Google",
      googleNote: "If you continue with Google you accept the privacy policy.",
      forgot: "Forgot your password?", forgotText: "Use Continue with Google if your account uses that email, or write to me from the contact form on my website and I will help you get back in.",
      contact: "Contact form",
      errors: { credentials: "Wrong email or password.", exists: "There is already an account with that email: sign in instead.",
        name: "Write a name of 2 to 40 characters.", email: "Check the email address.", password: "The password needs 8 characters or more, a capital letter and a number.",
        consent: "Accept the privacy policy to create the account.", locked: "Too many attempts. Wait 15 minutes and try again.",
        google_only: "This account signs in with Google: use Continue with Google.", unavailable: "Accounts are not available right now. Try again in a few minutes.",
        server: "Something went wrong. Try again in a minute.", google_off: "Sign-in with Google is not ready yet. Use your email and password.",
        google_error: "Sign-in with Google did not finish. Try again.", network: "No connection to the server.", origin: "Reload the page and try again.", bad_request: "Reload the page and try again.", need_login: "Sign in or create a free account to open this desk." },
      signIn: "Sign in", account: "My account", signOut: "Sign out", hello: (n) => `Hi, ${n}. Pick a ticket to start your shift.`,
      accTitle: "My account", accSynced: "Your progress is saved in your account.", accGoogle: "Signs in with Google", accPassword: "Signs in with email and password",
      accDelete: "Delete my account", accDeleteText: "This deletes your account, your sessions and your saved progress. It cannot be undone.",
      accConfirm: "Yes, delete everything", accCancel: "Cancel", accDeleted: "Your account has been deleted.",
      footUser: "Fictional company and people. Your progress is saved in your account.", privacy: "Privacy",
      footAnon: "Fictional company and people.", backHome: "← Back to the home page",
      land: {
        tag: "IT support simulator · free", title: "SysAdmin Desks",
        lead: "Practise the job of a support technician in your browser. Take a ticket from a fictional company, investigate in a console that answers like a real machine, fix the cause, prove it works and write the work note. Free, with your own account and nothing to install.",
        cta: "Start free", how: "How it works", guides: "Guides",
        newTicket: "New ticket", heroTicket: "Internet works, the intranet does not",
        sections: [
          { k: "01 · Read the ticket", h: "Real tickets,\none support desk.",
            p: "Six tickets you will meet in your first months on a help desk: a user locked out every morning, a mailbox that bounces customer emails, a printer queue that will not empty, a laptop that loses Outlook and Teams. Each one comes with the user, the priority and what you have to work with.",
            chips: ["Active Directory", "Network / DNS", "Windows", "Printers", "Exchange Online", "Intune"] },
          { k: "02 · Investigate", h: "A console that answers\nlike a real machine.",
            p: "Type the commands you would use at work, in PowerShell or cmd: Get-ADUser, Get-WinEvent, ipconfig, nslookup, Get-Printer, Get-Mailbox and more. The output changes with what you do. Hints when you are stuck, and one tempting fix that looks right but does not solve the ticket.",
            chips: ["PowerShell and cmd", "Hints", "The tempting fix"] },
          { k: "03 · Fix and prove it", h: "Fix the cause,\nnot only the symptom.",
            p: "Each desk has a checklist: find the cause, fix it and check it stays fixed. The ticket only closes when you have proved it, like on a real shift, where unlocking an account again does not help if the old password is still saved somewhere.",
            chips: ["Investigate", "Fix", "Verify"] },
          { k: "04 · Write the note", h: "The note the next\ntechnician will thank you for.",
            p: "Close the ticket with a work note: cause, change, check and follow-up. It is scored, you see what was missing and an example note, and every desk links to its step-by-step guide. Your progress is saved in your account and follows you to any device.",
            chips: ["Scored work notes", "Step-by-step guides", "Progress in your account"] },
        ],
        endK: "05 · Start your shift", endH: "Ready for your first shift?", endP: "Create a free account and take your first ticket. Sign in with email or with Google.",
        footBlurb: "Hands-on IT support practice with realistic tickets, a simulated console and scored work notes.",
        colDesks: "Desks", colGuides: "Guides", colProject: "Project",
        guideLinks: [["All guides", "guias.html"], ["Level 1: first steps", "guias/nivel-1.html"], ["Level 2: solid foundations", "guias/nivel-2.html"], ["Level 3: advanced", "guias/nivel-3.html"]],
        projectLinks: [["About me", "about.html"], ["Blog", "blog/"], ["Contact", "about.html#contacto"]],
        legal: "Educational simulation with a fictional company and people. Not real IT access.",
        t1: ["The account that locks every morning", "P2"], t2: ["The reception printer queue will not empty", "P2"], t3: ["Customer emails bounce", "P1"],
        noteTitle: "Work note", noteText: "Cause: scheduled task with an old password on FS-SCAN01…", score: "100 points", resolved: "Resolved", stagesDemo: ["Find the source of the lockouts", "Remove the cause and unlock", "Check it stays unlocked"],
      },
    },
    es: {
      heroTitle: "Practica tickets reales de soporte IT en una consola simulada",
      heroText: "Cada puesto es un ticket de una empresa ficticia. Investiga con los comandos que usarías en el trabajo, arregla la causa, compruébalo y escribe la nota de trabajo.",
      how: [["1 · Lee", "el ticket y lo que tienes"], ["2 · Investiga", "en la consola, como en un equipo real"], ["3 · Arregla y comprueba", "la causa, no solo el síntoma"], ["4 · Escribe la nota", "el siguiente técnico te lo agradecerá"]],
      progress: (d, n, s) => `${d} de ${n} puestos resueltos · ${s} estrellas`,
      start: "Empezar", again: "Repetir", level: "Nivel", min: "min", back: "← Todos los puestos",
      ticket: "Ticket", context: "Lo que tienes", stages: "Progreso", hint: "Pista", restart: "Reiniciar",
      guide: "Leer la guía", termHelp: "Escribe help para lo básico. ↑/↓ repiten comandos.",
      noteTitle: "Nota de trabajo", noteText: "Escribe la nota que dejarías en el ticket: causa, qué cambiaste, cómo lo comprobaste y el seguimiento.",
      submit: "Cerrar el ticket", result: "Ticket cerrado", points: "puntos",
      found: "Tu nota incluye", missing: "A tu nota le falta", sample: "Una nota de ejemplo", solution: "Una forma de resolverlo",
      next: "Siguiente puesto", home: "Todos los puestos", noteEmpty: "Escribe unas líneas primero.",
      hintsUsed: (h) => `Pistas usadas: ${h}`, guides: "Guías",
      foot: "Empresa y personas ficticias. Tu progreso se guarda solo en este navegador.",
      welcome: "Conectado a {host} como {user}. Escribe help si lo necesitas.",
      langBtn: "EN", langLabel: "English", notFound: "Ese puesto no existe.",
      startTag: "Mesa de soporte · turno de mañana", startTitle: "Ficha y empieza tu turno de soporte",
      startText: "SysAdmin Desks te sienta en la mesa de soporte de una empresa ficticia. Tickets reales, una consola que responde como un equipo de verdad y una nota de trabajo que se puntúa al cerrar el ticket.",
      startPoints: ["6 tickets: Active Directory, DNS, Windows, impresoras, Exchange Online e Intune", "Pistas cuando te atascas, y el arreglo tentador que no lo resuelve", "Cada puesto enlaza con su guía paso a paso", "Tu progreso se guarda en tu cuenta y te sigue a cualquier equipo"],
      deskHost: "CONTOSO-HD-07", deskDomain: "contoso.local", cardTitle: "Mesa de soporte de Contoso · acceso de técnicos",
      tabLogin: "Entrar", tabRegister: "Crear cuenta", fName: "Nombre de técnico", fAvatar: "Avatar", fEmail: "Email", fPassword: "Contraseña",
      phName: "Alex Moreno", phEmail: "tu@ejemplo.com", show: "Mostrar contraseña", hide: "Ocultar contraseña",
      rules: { length: "8 caracteres o más", capital: "Una mayúscula", number: "Un número" },
      consentA: "He leído la ", consentLink: "política de privacidad", consentB: ".",
      btnLogin: "Fichar entrada", btnRegister: "Crear mi cuenta", or: "o", google: "Continuar con Google",
      googleNote: "Si continúas con Google aceptas la política de privacidad.",
      forgot: "¿Has olvidado la contraseña?", forgotText: "Usa Continuar con Google si tu cuenta usa ese email, o escríbeme desde el formulario de contacto de mi web y te ayudo a recuperar el acceso.",
      contact: "Formulario de contacto",
      errors: { credentials: "Email o contraseña incorrectos.", exists: "Ya hay una cuenta con ese email: entra con ella.",
        name: "Escribe un nombre de 2 a 40 caracteres.", email: "Revisa el email.", password: "La contraseña necesita 8 caracteres o más, una mayúscula y un número.",
        consent: "Acepta la política de privacidad para crear la cuenta.", locked: "Demasiados intentos. Espera 15 minutos y vuelve a probar.",
        google_only: "Esta cuenta entra con Google: usa Continuar con Google.", unavailable: "Las cuentas no están disponibles ahora mismo. Prueba de nuevo en unos minutos.",
        server: "Algo ha fallado. Prueba de nuevo en un minuto.", google_off: "El acceso con Google aún no está listo. Usa tu email y contraseña.",
        google_error: "El acceso con Google no terminó. Prueba otra vez.", network: "Sin conexión con el servidor.", origin: "Recarga la página y prueba otra vez.", bad_request: "Recarga la página y prueba otra vez.", need_login: "Entra o crea una cuenta gratis para abrir este puesto." },
      signIn: "Entrar", account: "Mi cuenta", signOut: "Salir", hello: (n) => `Hola, ${n}. Elige un ticket para empezar el turno.`,
      accTitle: "Mi cuenta", accSynced: "Tu progreso se guarda en tu cuenta.", accGoogle: "Entra con Google", accPassword: "Entra con email y contraseña",
      accDelete: "Borrar mi cuenta", accDeleteText: "Se borran tu cuenta, tus sesiones y tu progreso guardado. No se puede deshacer.",
      accConfirm: "Sí, borrar todo", accCancel: "Cancelar", accDeleted: "Tu cuenta se ha borrado.",
      footUser: "Empresa y personas ficticias. Tu progreso se guarda en tu cuenta.", privacy: "Privacidad",
      footAnon: "Empresa y personas ficticias.", backHome: "← Volver a la portada",
      land: {
        tag: "Simulador de soporte IT · gratis", title: "SysAdmin Desks",
        lead: "Practica el trabajo de un técnico de soporte en el navegador. Coge un ticket de una empresa ficticia, investiga en una consola que responde como un equipo de verdad, arregla la causa, demuestra que funciona y escribe la nota de trabajo. Gratis, con tu propia cuenta y sin instalar nada.",
        cta: "Empieza gratis", how: "Cómo funciona", guides: "Guías",
        newTicket: "Nuevo ticket", heroTicket: "Internet funciona, la intranet no",
        sections: [
          { k: "01 · Lee el ticket", h: "Tickets reales,\nuna mesa de soporte.",
            p: "Seis tickets que te vas a encontrar en tus primeros meses en soporte: un usuario que se bloquea cada mañana, un buzón que rebota los correos de clientes, una cola de impresión que no se vacía, un portátil que se queda sin Outlook ni Teams. Cada uno llega con el usuario, la prioridad y lo que tienes para trabajar.",
            chips: ["Active Directory", "Red / DNS", "Windows", "Impresoras", "Exchange Online", "Intune"] },
          { k: "02 · Investiga", h: "Una consola que responde\ncomo un equipo de verdad.",
            p: "Escribe los comandos que usarías en el trabajo, en PowerShell o cmd: Get-ADUser, Get-WinEvent, ipconfig, nslookup, Get-Printer, Get-Mailbox y más. La salida cambia según lo que haces. Pistas cuando te atascas, y un arreglo tentador que parece bueno pero no resuelve el ticket.",
            chips: ["PowerShell y cmd", "Pistas", "El arreglo tentador"] },
          { k: "03 · Arregla y compruébalo", h: "Arregla la causa,\nno solo el síntoma.",
            p: "Cada puesto tiene su checklist: encontrar la causa, arreglarla y comprobar que sigue arreglado. El ticket solo se cierra cuando lo has demostrado, como en un turno real, donde desbloquear otra vez la cuenta no sirve si la contraseña antigua sigue guardada en algún sitio.",
            chips: ["Investigar", "Arreglar", "Verificar"] },
          { k: "04 · Escribe la nota", h: "La nota que el siguiente\ntécnico te agradecerá.",
            p: "Cierra el ticket con una nota de trabajo: causa, cambio, comprobación y seguimiento. Se puntúa, ves lo que faltaba y una nota de ejemplo, y cada puesto enlaza con su guía paso a paso. Tu progreso se guarda en tu cuenta y te sigue a cualquier equipo.",
            chips: ["Notas puntuadas", "Guías paso a paso", "Progreso en tu cuenta"] },
        ],
        endK: "05 · Empieza tu turno", endH: "¿Listo para tu primer turno?", endP: "Crea una cuenta gratis y coge tu primer ticket. Entra con email o con Google.",
        footBlurb: "Práctica real de soporte IT con tickets realistas, una consola simulada y notas de trabajo puntuadas.",
        colDesks: "Puestos", colGuides: "Guías", colProject: "Proyecto",
        guideLinks: [["Todas las guías", "guias.html"], ["Nivel 1: primeros pasos", "guias/nivel-1.html"], ["Nivel 2: base sólida", "guias/nivel-2.html"], ["Nivel 3: avanzado", "guias/nivel-3.html"]],
        projectLinks: [["Sobre mí", "about.html"], ["Blog", "blog/"], ["Contacto", "about.html#contacto"]],
        legal: "Simulación educativa con empresa y personas ficticias. No es acceso real a sistemas.",
        t1: ["La cuenta que se bloquea cada mañana", "P2"], t2: ["La cola de la impresora no se vacía", "P2"], t3: ["Rebotan los correos de clientes", "P1"],
        noteTitle: "Nota de trabajo", noteText: "Causa: tarea programada con una contraseña antigua en FS-SCAN01…", score: "100 puntos", resolved: "Resuelto", stagesDemo: ["Encontrar el origen de los bloqueos", "Quitar la causa y desbloquear", "Comprobar que sigue desbloqueada"],
      },
    },
  };

  /* ---------- storage (per-viewer convenience only; the page works without it) */
  function load(key, fallback) {
    try { const v = localStorage.getItem("sd." + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("sd." + key, JSON.stringify(value)); } catch (e) { /* private mode: ignore */ }
  }

  let lang = load("lang", (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en");
  // links from the guides on the website say which language to open in: ?lang=es or ?lang=en
  const asked = new URLSearchParams(location.search).get("lang");
  if (asked === "es" || asked === "en") { lang = asked; save("lang", lang); }
  let progress = load("progress", {});
  let current = null;   // {sc, sess, ...} while on a desk
  let user = null;      // signed-in technician {name, email, avatar, google, password}
  let afterLogin = null;  // the page someone asked for before signing in (a desk linked from a guide)
  const AVATARS = ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8"];
  const SITE = "https://inigogonzalezgarcia.github.io/";

  /* ---------- accounts (Pages Functions under /api; the page still works if they are not there) */
  async function api(path, method, body) {
    try {
      const r = await fetch(path, { method: method || "GET", credentials: "same-origin",
        headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
      let data = {};
      try { data = await r.json(); } catch (e) { data = { error: r.status === 404 ? "unavailable" : "server" }; }
      return { ok: r.ok, status: r.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: "network" } };
    }
  }
  // the best of the browser's and the account's results; anything better in the browser is sent to the account
  async function adopt(data) {
    user = data.user;
    const server = data.progress || {};
    const better = {};
    Object.entries(progress).forEach(([id, p]) => { if (!server[id] || p.points > server[id].points) better[id] = { points: p.points, stars: p.stars }; });
    progress = Object.assign({}, server);
    if (Object.keys(better).length) {
      const r = await api("/api/progress", "PUT", { results: better });
      if (r.ok) progress = r.data.progress;
    }
    save("progress", progress);
  }
  function avatarImg(id, cls) {
    return el("img", { class: cls || "avatar", src: "assets/avatars/" + (AVATARS.includes(id) ? id : "a1") + ".svg", alt: "", width: "36", height: "36" });
  }

  function L() { return UI[lang]; }

  /* ---------- tiny DOM helper */
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    kids.flat(Infinity).forEach((k) => { if (k != null && k !== false) n.append(typeof k === "string" ? document.createTextNode(k) : k); });
    return n;
  }
  function stars(n) {
    return el("span", { class: "stars", "aria-label": n + "/3" }, "★".repeat(n), el("span", { class: "off" }, "★".repeat(3 - n)));
  }

  /* ---------- chrome */
  function chrome() {
    document.documentElement.lang = lang;
    const b = document.getElementById("lang");
    b.textContent = L().langBtn;
    b.setAttribute("aria-label", L().langLabel);
    document.getElementById("nav-guides").textContent = L().guides;
    document.getElementById("foot-text").textContent = user ? L().footUser : L().footAnon;
    document.getElementById("foot-privacy").textContent = L().privacy;
    const who = document.getElementById("who");
    who.replaceChildren(user
      ? el("a", { class: "who", href: "#/account", title: L().account }, avatarImg(user.avatar, "avatar sm"), el("span", { text: user.name }))
      : el("a", { class: "who signin", href: "#/start", text: L().signIn }));
  }

  /* ---------- home */
  function home() {
    current = null;
    const app = document.getElementById("app");
    app.replaceChildren();
    document.title = "SysAdmin Desks by IGG · " + (lang === "es" ? "práctica de soporte IT" : "IT support practice");
    const solved = SCENARIOS.filter((s) => progress[s.id]).length;
    const totalStars = SCENARIOS.reduce((a, s) => a + ((progress[s.id] || {}).stars || 0), 0);
    app.append(
      el("section", { class: "hero" }, el("h1", { text: L().heroTitle }), el("p", { text: L().heroText }),
        user ? el("p", { class: "hello" }, avatarImg(user.avatar, "avatar sm"), el("span", { text: L().hello(user.name) })) : null),
      el("ul", { class: "how" }, L().how.map(([a, b]) => el("li", {}, el("b", { text: a }), b))),
      el("p", { class: "progress-line", text: L().progress(solved, SCENARIOS.length, totalStars) }),
      el("div", { class: "grid" }, SCENARIOS.map((sc) => {
        const p = progress[sc.id];
        return el("article", { class: "card" },
          el("div", { class: "meta" }, el("span", { class: "chip topic", text: t(sc.topic, lang) }),
            el("span", { class: "chip", text: `${L().level} ${sc.level}` }), el("span", { class: "chip", text: `~${sc.minutes} ${L().min}` })),
          el("h2", { text: t(sc.title, lang) }),
          el("p", { class: "from", text: `${sc.ticket.id} · ${sc.ticket.from}` }),
          el("div", { class: "foot-row" }, p ? stars(p.stars) : el("span", { class: "chip", text: sc.ticket.priority }),
            el("a", { class: "btn", href: "#/desk/" + sc.id, text: p ? L().again : L().start })));
      })));
    app.focus();
  }

  /* ---------- desk */
  function desk(id) {
    const sc = SCENARIOS.find((s) => s.id === id);
    const app = document.getElementById("app");
    app.replaceChildren();
    if (!sc) { app.append(el("p", { text: L().notFound }), el("a", { class: "btn", href: "#/", text: L().home })); return; }
    const sess = E.createSession(sc, lang);
    current = { sc, sess, hist: [], pos: 0 };
    document.title = t(sc.title, lang) + " · SysAdmin Desks";

    const out = el("div", { class: "out", "aria-live": "polite" });
    const input = el("input", { type: "text", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": "Console" });
    const form = el("form", { onsubmit: (ev) => { ev.preventDefault(); exec(input.value); input.value = ""; } },
      el("span", { class: "ps", text: E.prompt(sess) }), input);
    const term = el("div", { class: "term", onclick: () => { if (!window.getSelection().toString()) input.focus(); } }, out, form);
    const stagesList = el("ul", { class: "stages" });
    const hintBtn = el("button", { type: "button", class: "btn ghost", text: L().hint, onclick: () => { exec("hint"); input.focus(); } });
    const noteBox = el("div");

    function print(text, kind) { out.append(el("div", { class: "line " + (kind || "out"), text: text })); }
    function renderStages() {
      stagesList.replaceChildren(...E.stages(sess).map((s) =>
        el("li", { class: s.done ? "done" : "" }, el("span", { class: "box", "aria-hidden": "true", text: s.done ? "✓" : "" }), el("span", { text: t(s.label, lang) }))));
    }
    function ticketLines() {
      print(`[${sc.ticket.id}] ${sc.ticket.priority} · ${sc.ticket.from}`, "dim");
      print(t(sc.ticket.subject, lang), "say");
      print(t(sc.ticket.body, lang), "dim");
    }
    function exec(cmd) {
      if (!cmd.trim()) return;
      current.hist.push(cmd); current.pos = current.hist.length;
      print(E.prompt(sess) + cmd, "cmd");
      const r = E.run(sess, cmd);
      if (r.clear) out.replaceChildren();
      if (r.ticket) ticketLines();
      r.lines.forEach((l) => print(l.text, l.kind));
      renderStages();
      if (r.resolvedNow) showNote();
      term.scrollTop = term.scrollHeight;
    }
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowUp" && current.pos > 0) { current.pos -= 1; input.value = current.hist[current.pos]; ev.preventDefault(); }
      else if (ev.key === "ArrowDown") { current.pos = Math.min(current.hist.length, current.pos + 1); input.value = current.hist[current.pos] || ""; ev.preventDefault(); }
    });

    function showNote() {
      const ta = el("textarea", { "aria-label": L().noteTitle, maxlength: "2000" });
      const msg = el("p", { class: "msg" });
      noteBox.replaceChildren(el("section", { class: "panel note" }, el("h2", { text: L().noteTitle }), el("p", { text: L().noteText }), ta, msg,
        el("div", { class: "row" }, el("button", { type: "button", class: "btn", text: L().submit, onclick: () => {
          if (ta.value.trim().length < 10) { msg.textContent = L().noteEmpty; ta.focus(); return; }
          showResult(ta.value);
        } }))));
      ta.focus();
    }

    function showResult(text) {
      const note = E.checkNote(sc, text, lang);
      const sc2 = E.score(sess, note);
      const prev = progress[sc.id];
      if (!prev || sc2.points >= prev.points) { progress[sc.id] = { points: sc2.points, stars: sc2.stars, date: new Date().toISOString().slice(0, 10) }; save("progress", progress); }
      if (user) api("/api/progress", "PUT", { results: { [sc.id]: { points: sc2.points, stars: sc2.stars } } });
      const idx = SCENARIOS.indexOf(sc);
      const nextSc = SCENARIOS[(idx + 1) % SCENARIOS.length];
      noteBox.replaceChildren(el("section", { class: "panel result" },
        el("h2", { text: L().result }),
        el("div", { class: "big-stars" }, "★".repeat(sc2.stars), el("span", { class: "off", text: "★".repeat(3 - sc2.stars) })),
        el("h3", { text: `${sc2.points} ${L().points}` }),
        el("p", { text: L().hintsUsed(sess.hints) }),
        note.found.length ? el("div", {}, el("b", { text: L().found }), el("ul", { class: "found" }, note.found.map((x) => el("li", { text: x })))) : null,
        note.missing.length ? el("div", {}, el("b", { text: L().missing }), el("ul", { class: "missing" }, note.missing.map((x) => el("li", { text: x })))) : null,
        el("details", {}, el("summary", { text: L().sample }), el("blockquote", { text: t(sc.sampleNote, lang) })),
        el("details", {}, el("summary", { text: L().solution }), el("div", { class: "solution", text: sc.solution.join("\n") })),
        el("div", { class: "row" }, el("a", { class: "btn", href: "#/desk/" + nextSc.id, text: L().next }),
          el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }),
          el("a", { class: "btn ghost", href: "#/", text: L().home }))));
      noteBox.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    app.append(
      el("div", { class: "desk-bar" }, el("a", { href: "#/", text: L().back }), el("h1", { text: t(sc.title, lang) })),
      el("div", { class: "desk" },
        el("aside", {},
          el("section", { class: "panel" }, el("h2", { text: L().ticket }),
            el("div", { class: "ticket-head" }, el("span", { text: `${sc.ticket.id} · ${sc.ticket.from}` }), el("span", { class: "prio " + sc.ticket.priority, text: sc.ticket.priority })),
            el("p", { class: "ticket-subject", text: t(sc.ticket.subject, lang) }), el("p", { class: "ticket-body", text: t(sc.ticket.body, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().context }), el("p", { class: "intro", text: t(sc.intro, lang) })),
          el("section", { class: "panel" }, el("h2", { text: L().stages }), stagesList),
          el("section", { class: "panel tools" }, hintBtn,
            el("button", { type: "button", class: "btn ghost", text: L().restart, onclick: () => desk(id) }),
            el("a", { class: "btn ghost", href: sc.guide, target: "_blank", rel: "noopener noreferrer", text: L().guide }))),
        el("div", {}, term, el("p", { class: "term-help", text: L().termHelp }), noteBox)));

    print(L().welcome.replace("{host}", sc.machine.host).replace("{user}", sc.machine.domain + "\\" + sc.machine.user), "dim");
    print("", "out");
    renderStages();
    input.focus();
  }


  /* ---------- landing page (signed out) */
  function laptop(screen, extra) {
    return el("div", { class: "laptop" + (extra ? " " + extra : ""), "aria-hidden": "true" },
      el("div", { class: "lt-lid" }, el("div", { class: "lt-cam" }), el("div", { class: "lt-screen" }, screen)),
      el("div", { class: "lt-base" }, el("div", { class: "lt-notch" })));
  }
  function ticketCard(title, prio, cls, label) {
    return el("div", { class: "float-card " + (cls || "") },
      el("span", { class: "fc-icon", text: "▤" }),
      el("div", {}, label ? el("p", { class: "fc-label", text: label }) : null, el("p", { class: "fc-title", text: title }),
        el("p", { class: "fc-meta" }, el("span", { class: "prio " + prio, text: prio }), el("span", { class: "fc-bar" }), el("span", { class: "fc-bar short" }))));
  }
  function termScreen(lines) {
    return el("div", { class: "mini-term" }, lines.map(([k, t]) => el("div", { class: "mt-line " + k, text: t })), el("div", { class: "mt-line cur", text: "PS C:\\> " }));
  }
  function landing() {
    current = null;
    const app = document.getElementById("app");
    app.replaceChildren();
    const T = L().land;
    document.title = "SysAdmin Desks by IGG · " + (lang === "es" ? "simulador de soporte IT" : "IT support simulator");
    const howBtn = el("button", { type: "button", class: "land-link", text: T.how, onclick: () => {
      const target = document.getElementById("land-s1");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    } });
    const heroArt = el("div", { class: "art" },
      laptop(termScreen([["dim", "Connected to PC-SALES-14 as CONTOSO\\jruiz"], ["cmd", "PS C:\\> ipconfig /all"], ["out", "DNS Servers . . . : 8.8.8.8"],
        ["cmd", "PS C:\\> nslookup intranet.contoso.local"], ["err", "*** can't find intranet.contoso.local: Non-existent domain"]])),
      ticketCard(T.heroTicket, "P3", "fc-hero", T.newTicket));
    const sectionArt = [
      el("div", { class: "art" }, laptop(el("div", { class: "mini-desk" }, el("div", { class: "md-bar" }), el("div", { class: "md-row" }), el("div", { class: "md-row" }), el("div", { class: "md-row short" }))),
        ticketCard(T.t3[0], T.t3[1], "fc-a"), ticketCard(T.t1[0], T.t1[1], "fc-b"), ticketCard(T.t2[0], T.t2[1], "fc-c")),
      el("div", { class: "art" }, laptop(termScreen([["cmd", "PS C:\\> Get-ADUser mgarcia -Properties LockedOut"], ["out", "LockedOut : True"],
        ["cmd", "PS C:\\> Get-WinEvent -FilterHashtable @{LogName='Security';Id=4740}"], ["ev", "Caller Computer Name: FS-SCAN01"],
        ["cmd", "PS C:\\> Get-ScheduledTask -CimSession FS-SCAN01"], ["out", "ScanToFinance   Ready   CONTOSO\\mgarcia"]]))),
      el("div", { class: "art" }, laptop(el("div", { class: "mini-desk" }, el("div", { class: "md-bar" }), el("div", { class: "md-row" }), el("div", { class: "md-row short" }))),
        el("div", { class: "float-card fc-check" }, el("p", { class: "fc-label", text: L().stages }),
          el("ul", {}, T.stagesDemo.map((x) => el("li", {}, el("span", { class: "tick", text: "✓" }), el("span", { text: x }))))),
        el("div", { class: "float-pill", text: "● " + T.resolved })),
      el("div", { class: "art" }, laptop(el("div", { class: "mini-desk" }, el("div", { class: "md-bar" }), el("div", { class: "md-row" }), el("div", { class: "md-row" }))),
        el("div", { class: "float-card fc-note" }, el("p", { class: "fc-label", text: T.noteTitle }), el("p", { class: "fc-note-text", text: T.noteText }),
          el("p", { class: "fc-score" }, el("span", { class: "stars", text: "★★★" }), el("span", { text: T.score })))),
    ];
    const sections = T.sections.map((sec, i) => el("section", { class: "land-sec" + (i % 2 ? " flip" : ""), id: "land-s" + (i + 1) },
      el("div", { class: "land-copy" },
        el("p", { class: "land-kicker", text: sec.k }),
        el("h2", {}, sec.h.split("\n").map((line, j) => [j ? el("br") : null, line])),
        el("p", { class: "land-p", text: sec.p }),
        el("ul", { class: "land-chips" }, sec.chips.map((c) => el("li", { text: c })))),
      sectionArt[i]));
    const site = (path) => SITE + path;
    const ext = (href, text) => el("a", { href, target: "_blank", rel: "noopener noreferrer", text });
    app.append(el("div", { class: "landing" },
      el("section", { class: "land-hero" },
        el("div", { class: "land-copy" },
          el("p", { class: "land-tag" }, el("span", { class: "dot", "aria-hidden": "true" }), T.tag),
          el("h1", { class: "land-title", text: T.title }),
          el("p", { class: "land-lead", text: T.lead }),
          el("div", { class: "land-ctas" }, el("a", { class: "btn land-cta", href: "#/register", text: T.cta }), howBtn,
            ext(site("guias.html"), T.guides))),
        heroArt),
      sections,
      el("section", { class: "land-end" },
        laptop(el("div", { class: "end-screen" }, el("p", { class: "land-kicker", text: T.endK }), el("h2", { text: T.endH }), el("p", { text: T.endP }),
          el("a", { class: "btn land-cta", href: "#/register", text: T.cta })), "big")),
      el("footer", { class: "land-foot" },
        el("div", { class: "lf-cols" },
          el("div", { class: "lf-brand" }, el("p", { class: "brand" }, el("span", { class: "mark", text: ">_" }), el("span", { text: "SysAdmin Desks" })),
            el("p", { text: T.footBlurb })),
          el("div", {}, el("p", { class: "lf-h", text: T.colDesks }), el("ul", {}, SCENARIOS.map((sc) => el("li", {}, el("a", { href: "#/desk/" + sc.id, text: t(sc.title, lang) }))))),
          el("div", {}, el("p", { class: "lf-h", text: T.colGuides }), el("ul", {}, T.guideLinks.map(([x, h]) => el("li", {}, ext(site(h), x))))),
          el("div", {}, el("p", { class: "lf-h", text: T.colProject }), el("ul", {}, T.projectLinks.map(([x, h]) => el("li", {}, ext(site(h), x))),
            el("li", {}, ext("https://www.linkedin.com/in/igonzalez93", "LinkedIn")), el("li", {}, el("a", { href: "privacy.html", text: L().privacy }))))),
        el("div", { class: "lf-bottom" }, el("span", { text: "© 2026 Iñigo González · SysAdmin Desks by IGG" }), el("span", { text: T.legal })))));
  }

  /* ---------- start page: sign in or create an account */
  function start(mode, notice) {
    current = null;
    const app = document.getElementById("app");
    app.replaceChildren();
    document.title = "SysAdmin Desks by IGG · " + (lang === "es" ? "acceso" : "sign in");
    let tab = mode || "login";
    let avatar = AVATARS[0];
    const msg = el("p", { class: "form-msg", role: "alert" });
    if (notice) msg.textContent = L().errors[notice] || "";
    if (notice === "need_login") msg.classList.add("info");
    const body = el("div", { class: "signin-body" });

    function field(label, input, extra) {
      return el("label", { class: "field" }, el("span", { class: "field-label", text: label }), input, extra || null);
    }
    function passwordField(withRules) {
      const input = el("input", { type: "password", name: "password", required: true, maxlength: "128",
        autocomplete: withRules ? "new-password" : "current-password" });
      const eye = el("button", { type: "button", class: "eye", "aria-label": L().show, text: "👁" });
      eye.addEventListener("click", () => {
        const hidden = input.type === "password";
        input.type = hidden ? "text" : "password";
        eye.setAttribute("aria-label", hidden ? L().hide : L().show);
      });
      const wrap = el("span", { class: "pw" }, input, eye);
      if (!withRules) return { input, node: field(L().fPassword, wrap) };
      const items = Object.keys(L().rules).map((k) => el("li", { "data-rule": k, text: L().rules[k] }));
      const list = el("ul", { class: "rules" }, items);
      input.addEventListener("input", () => {
        const v = input.value;
        const ok = { length: v.length >= 8, capital: /[A-ZÁÉÍÓÚÑ]/.test(v), number: /[0-9]/.test(v) };
        items.forEach((li) => li.classList.toggle("ok", ok[li.getAttribute("data-rule")]));
      });
      return { input, node: field(L().fPassword, wrap, list) };
    }
    function busy(btn, on) { btn.disabled = on; btn.classList.toggle("busy", on); }
    async function done(r) {
      if (!r.ok) { msg.textContent = L().errors[r.data.error] || L().errors.server; return; }
      await adopt(r.data);
      const next = afterLogin || "#/";
      afterLogin = null;
      try { sessionStorage.removeItem("sd.next"); } catch (e) { /* ignore */ }
      if (location.hash === next) route(); else location.hash = next;
    }

    function render() {
      const tabs = el("div", { class: "tabs", role: "tablist" },
        ["login", "register"].map((k) => el("button", { type: "button", role: "tab", class: "tab" + (tab === k ? " on" : ""),
          "aria-selected": tab === k ? "true" : "false", text: k === "login" ? L().tabLogin : L().tabRegister,
          onclick: () => { tab = k; msg.textContent = ""; render(); } })));
      const email = el("input", { type: "email", name: "email", required: true, maxlength: "254", autocomplete: "email", placeholder: L().phEmail });
      let form;
      if (tab === "login") {
        const pw = passwordField(false);
        const forgotText = el("p", { class: "forgot-text", hidden: true }, L().forgotText + " ",
          el("a", { href: SITE + "about.html#contacto", target: "_blank", rel: "noopener noreferrer", text: L().contact }));
        const submit = el("button", { type: "submit", class: "btn wide", text: L().btnLogin });
        form = el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
          ev.preventDefault();
          busy(submit, true);
          const r = await api("/api/auth/login", "POST", { email: email.value, password: pw.input.value });
          busy(submit, false);
          await done(r);
        } },
          field(L().fEmail, email), pw.node,
          el("button", { type: "button", class: "link-btn", text: L().forgot, onclick: () => { forgotText.hidden = !forgotText.hidden; } }), forgotText,
          submit);
      } else {
        const name = el("input", { type: "text", name: "name", required: true, minlength: "2", maxlength: "40", autocomplete: "nickname", placeholder: L().phName });
        const pics = el("div", { class: "avatars", role: "radiogroup", "aria-label": L().fAvatar }, AVATARS.map((a) =>
          el("button", { type: "button", role: "radio", class: "pick" + (a === avatar ? " on" : ""), "aria-checked": a === avatar ? "true" : "false",
            "aria-label": L().fAvatar + " " + a.slice(1), onclick: (ev) => {
              avatar = a;
              pics.querySelectorAll(".pick").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-checked", "false"); });
              ev.currentTarget.classList.add("on"); ev.currentTarget.setAttribute("aria-checked", "true");
            } }, avatarImg(a))));
        const pw = passwordField(true);
        const consent = el("input", { type: "checkbox", name: "consent" });
        const submit = el("button", { type: "submit", class: "btn wide", text: L().btnRegister });
        form = el("form", { class: "signin-form", novalidate: true, onsubmit: async (ev) => {
          ev.preventDefault();
          busy(submit, true);
          const r = await api("/api/auth/register", "POST", { name: name.value, email: email.value, password: pw.input.value, avatar, consent: consent.checked });
          busy(submit, false);
          await done(r);
        } },
          field(L().fName, name), el("div", { class: "field" }, el("span", { class: "field-label", text: L().fAvatar }), pics),
          field(L().fEmail, email), pw.node,
          el("label", { class: "check" }, consent, el("span", {}, L().consentA,
            el("a", { href: "privacy.html", target: "_blank", rel: "noopener noreferrer", text: L().consentLink }), L().consentB)),
          submit);
      }
      body.replaceChildren(tabs, msg, form,
        el("div", { class: "or" }, el("span", { text: L().or })),
        el("a", { class: "btn google", href: "/api/auth/google", onclick: () => {
          try { if (afterLogin) sessionStorage.setItem("sd.next", afterLogin); } catch (e) { /* ignore */ }
        } }, el("span", { class: "g", "aria-hidden": "true", text: "G" }), el("span", { text: L().google })),
        el("p", { class: "fine", text: L().googleNote }));
    }
    render();

    app.append(el("section", { class: "start" },
      el("div", { class: "start-pitch" },
        el("p", { class: "start-tag" }, el("span", { class: "dot", "aria-hidden": "true" }), L().startTag),
        el("h1", { text: L().startTitle }),
        el("p", { class: "start-text", text: L().startText }),
        el("ul", { class: "start-points" }, L().startPoints.map((x) => el("li", { text: x }))),
        el("p", { class: "guest" }, el("a", { href: "#/", class: "btn ghost", text: L().backHome }))),
      el("div", { class: "signin" },
        el("div", { class: "signin-bar" }, el("span", { text: "🖥 " + L().deskHost }), el("span", { text: L().deskDomain })),
        el("div", { class: "signin-card" },
          el("div", { class: "signin-head" }, el("span", { class: "lock", "aria-hidden": "true", text: "🔒" }), el("span", { text: L().cardTitle })),
          body))));
  }

  /* ---------- account */
  function account() {
    current = null;
    const app = document.getElementById("app");
    app.replaceChildren();
    if (!user) { start("login"); return; }
    document.title = L().accTitle + " · SysAdmin Desks";
    const solved = Object.keys(progress).length;
    const totalStars = Object.values(progress).reduce((a, p) => a + (p.stars || 0), 0);
    const zone = el("div", { class: "danger" });
    const msg = el("p", { class: "form-msg", role: "alert" });
    function ask() {
      zone.replaceChildren(el("p", { text: L().accDeleteText }), el("div", { class: "row" },
        el("button", { type: "button", class: "btn danger-btn", text: L().accConfirm, onclick: async () => {
          const r = await api("/api/me", "DELETE");
          if (!r.ok) { msg.textContent = L().errors[r.data.error] || L().errors.server; return; }
          user = null; progress = {}; save("progress", progress);
          chrome();
          app.replaceChildren(el("section", { class: "panel account" }, el("p", { text: L().accDeleted }), el("a", { class: "btn", href: "#/start", text: L().signIn })));
        } }),
        el("button", { type: "button", class: "btn ghost", text: L().accCancel, onclick: idle })));
    }
    function idle() { zone.replaceChildren(el("button", { type: "button", class: "btn ghost", text: L().accDelete, onclick: ask })); }
    idle();
    app.append(el("section", { class: "panel account" },
      el("div", { class: "acc-head" }, avatarImg(user.avatar, "avatar lg"), el("div", {}, el("h1", { text: user.name }), el("p", { class: "from", text: user.email }))),
      el("p", { text: L().progress(solved, SCENARIOS.length, totalStars) }),
      el("p", { class: "fine", text: (user.google ? L().accGoogle : L().accPassword) + " · " + L().accSynced }),
      el("div", { class: "row" }, el("a", { class: "btn", href: "#/", text: L().home }),
        el("button", { type: "button", class: "btn ghost", text: L().signOut, onclick: async () => {
          await api("/api/auth/logout", "POST");
          user = null; progress = {}; save("progress", progress);
          location.hash = "#/start"; route();
        } })),
      msg, zone));
  }

  /* ---------- routing */
  function route(notice) {
    chrome();
    const h = location.hash;
    const m = h.match(/^#\/desk\/([a-z0-9-]+)$/);
    document.body.classList.toggle("landing-on", !user && (h === "" || h === "#/"));
    if (m && user) desk(m[1]);
    else if (m) { afterLogin = h; start("login", notice || "need_login"); }
    else if (h === "#/start") start("login", notice);
    else if (h === "#/register") start("register", notice);
    else if (h === "#/account") account();
    else if (user) home();
    else landing();
    window.scrollTo(0, 0);
  }
  document.getElementById("lang").addEventListener("click", () => {
    lang = lang === "es" ? "en" : "es";
    save("lang", lang);
    route();
  });
  window.addEventListener("hashchange", () => route());

  // who is signed in, then the first view; ?auth=... comes back from the Google sign-in
  (async function boot() {
    const params = new URLSearchParams(location.search);
    const notice = params.get("auth");
    if (notice) history.replaceState(null, "", location.pathname + (asked ? "?lang=" + asked : "") + location.hash);
    const r = await api("/api/me");
    if (r.ok && r.data.user) {
      await adopt(r.data);
      let next = null;
      try { next = sessionStorage.getItem("sd.next"); sessionStorage.removeItem("sd.next"); } catch (e) { /* ignore */ }
      if (next && /^#\/desk\/[a-z0-9-]+$/.test(next) && location.hash !== next) { history.replaceState(null, "", location.pathname + next); }
    }
    route(notice && notice !== "ok" ? notice : undefined);
  })();
})();
