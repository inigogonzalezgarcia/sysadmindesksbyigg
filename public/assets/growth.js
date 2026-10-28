/* SysAdmin Desks by IGG - progress and knowledge (v0.4): the personal knowledge base built from your own work notes, the daily
   streak, the weekly goal, the badges and the internal mail exercises. Fictional company (Contoso) and people.
   Pure logic and data, no DOM: the app keeps everything in the browser (localStorage) and the Node tests use the same code. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDGrowth = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function t(value, lang) {
    if (value == null) return "";
    if (typeof value === "string" || Array.isArray(value)) return value;
    return value[lang] || value.en || "";
  }
  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* ---------- days and weeks (local days as "YYYY-MM-DD") */
  const pad = (n) => String(n).padStart(2, "0");
  // the local calendar day of a Date (not UTC: a ticket closed at 00:30 in Madrid counts for that day)
  function dayOf(date) {
    const d = date || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function parts(day) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day || ""));
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  }
  // whole days since 1970-01-01 for a day string; days are compared as calendar dates, so summer time never matters
  function dayNum(day) {
    const p = parts(day);
    return p ? Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000) : NaN;
  }
  // ISO 8601 week, "2026-W44": weeks start on Monday and week 1 holds the year's first Thursday
  function isoWeek(day) {
    const p = parts(day);
    if (!p) return "";
    const d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    const wd = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - wd);
    const year = d.getUTCFullYear();
    const week = Math.ceil(((d - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
    return year + "-W" + pad(week);
  }

  /* ---------- activity: [{type: "ticket" | "mail", id, day, ...}] recorded when a ticket is closed fixed or a mail exercise is answered */
  function activeDays(activity) {
    return Array.from(new Set((activity || []).map((a) => a.day).filter((d) => parts(d)))).sort();
  }
  // current streak (ending today, or yesterday if there is nothing yet today) and the best run ever
  function streak(activity, today) {
    const nums = activeDays(activity).map(dayNum);
    let best = 0;
    let run = 0;
    nums.forEach((n, i) => { run = i && n === nums[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });
    const set = new Set(nums);
    const now = dayNum(today);
    let from = set.has(now) ? now : set.has(now - 1) ? now - 1 : null;
    let current = 0;
    while (from !== null && set.has(from)) { current += 1; from -= 1; }
    return { current, best, today: set.has(now) };
  }
  // the weekly goal: different tickets closed and mail exercises answered this ISO week
  const GOAL = { min: 1, max: 7, def: 3 };
  function goalValue(n) {
    const v = Math.round(Number(n));
    return Number.isFinite(v) ? Math.min(GOAL.max, Math.max(GOAL.min, v)) : GOAL.def;
  }
  function week(activity, today, goal) {
    const key = isoWeek(today);
    const done = new Set((activity || []).filter((a) => isoWeek(a.day) === key).map((a) => a.type + ":" + a.id)).size;
    const target = goalValue(goal);
    return { week: key, done, target, met: done >= target };
  }

  /* ---------- knowledge base: an article per desk, from the user's own approved note */
  const ROLES = ["cause", "fix", "verify", "followup"];
  const LABELS = {
    en: { kb: "Knowledge base", ticket: "Ticket", version: "Version", date: "Date", topic: "Topic", code: "Resolution code", symptom: "Symptom",
      environment: "Environment", requester: "Requester", user: "User", device: "Device", location: "Location", affected: "Affected",
      cause: "Cause", fix: "Fix", verify: "Verification", followup: "Follow-up", other: "Other notes", none: "Not in the note.",
      guide: "Related guide", history: "Earlier versions", foot: "SysAdmin Desks by IGG · fictional company (Contoso). Written from your own work note." },
    es: { kb: "Base de conocimiento", ticket: "Ticket", version: "Versión", date: "Fecha", topic: "Tema", code: "Código de resolución", symptom: "Síntoma",
      environment: "Entorno", requester: "Solicitante", user: "Usuario", device: "Equipo", location: "Ubicación", affected: "Afectado",
      cause: "Causa", fix: "Solución", verify: "Verificación", followup: "Seguimiento", other: "Otras notas", none: "No consta en la nota.",
      guide: "Guía relacionada", history: "Versiones anteriores", foot: "SysAdmin Desks by IGG · empresa ficticia (Contoso). Redactado a partir de tu propia nota de trabajo." },
  };
  // "Cause: ..." / "Causa: ..." at the start of a part of the note says where it goes (the placeholder of the note suggests it)
  const PREFIX = {
    cause: /^(root cause|cause|causa raiz|causa|motivo)\s*[:\-–]\s*/i,
    fix: /^(change|changes|fix|what i changed|cambios?|solucion|arreglo|accion)\s*[:\-–]\s*/i,
    verify: /^(check|checked|verification|test|comprobacion|verificacion|prueba)\s*[:\-–]\s*/i,
    followup: /^(follow-up|follow up|followup|next steps|seguimiento|proximos pasos)\s*[:\-–]\s*/i,
  };
  // words that place a sentence when it matches none of the desk's note elements
  const GENERIC = {
    cause: ["because", "caused", "came from", "root cause", "porque", "debido", "venia", "venian", "provoc"],
    fix: ["changed", "removed", "enabled", "disabled", "cleared", "restart", "cambi", "borr", "activ", "deshabilit", "reinici"],
    verify: ["checked", "verified", "confirmed", "tested", "comprob", "verifiq", "confirm", "probe"],
    followup: ["asked", "advised", "next time", "in future", "follow", "recommend", "pedi", "aconsej", "recomend", "proxima vez", "a partir de ahora", "en futuras"],
  };
  const LABEL_SPLIT = /\s+(?=(?:root cause|cause|change|fix|check|verification|follow-up|follow up|next steps|causa|cambio|cambios|soluci[oó]n|comprobaci[oó]n|verificaci[oó]n|seguimiento)\s*:)/i;
  // the note in parts: lines, then sentences, then before an inline "Label:"; the user's text is never reworded
  function splitNote(text) {
    return String(text || "").split(/\r?\n+/).flatMap((line) => line.split(/(?<=[.!?])\s+(?=\S)/)).flatMap((s) => s.split(LABEL_SPLIT))
      .map((s) => s.trim()).filter(Boolean);
  }
  // the parts of the note under cause, fix, verification and follow-up, matched against the desk's note elements ({label, any, kb})
  function structure(sc, text) {
    const out = { cause: [], fix: [], verify: [], followup: [], other: [] };
    const second = [];
    splitNote(text).forEach((part) => {
      const f = fold(part);
      const pre = ROLES.find((r) => PREFIX[r].test(f));
      if (pre) { out[pre].push(part.slice(PREFIX[pre].exec(f)[0].length).trim() || part); return; }
      // each section scores the keywords of the desk's note elements and a few general words; the highest wins (ties: note order)
      const hits = {};
      const score = {};
      ROLES.forEach((r) => {
        hits[r] = (sc.note || []).filter((n) => n.kb === r).reduce((a, n) => a + n.any.filter((w) => f.indexOf(fold(w)) !== -1).length, 0);
        score[r] = hits[r] + 1.5 * GENERIC[r].filter((w) => f.indexOf(w) !== -1).length;
      });
      const role = ROLES.reduce((best, r) => (score[r] > (best ? score[best] : 0) ? r : best), null);
      if (!role) { out.other.push(part); return; }
      out[role].push(part);
      ROLES.forEach((r) => { if (r !== role && hits[r]) second.push([r, part]); });
    });
    // a sentence that covers two elements ("disabled the task and checked it stays unlocked") also fills a section left empty
    const empty = new Set(ROLES.filter((r) => !out[r].length));
    second.forEach(([r, part]) => { if (empty.has(r) && !out[r].includes(part)) out[r].push(part); });
    return out;
  }
  // only a ticket closed fixed with a note that covers every element becomes an article
  function qualifies(level, note) {
    return level !== "unresolved" && Boolean(note) && note.missing.length === 0;
  }
  function versionOf(n) { return "1." + n; }
  /* kb: {deskId: entry}; rec: {deskId, ticketId, note, code, points, lang, day}. A new approved note (better or just newer) is a new
     version: v1.0, v1.1... The same note again changes nothing. Returns {kb, entry, changed}. */
  function saveArticle(kb, rec) {
    const all = Object.assign({}, kb || {});
    const prev = all[rec.deskId];
    const note = String(rec.note || "").trim();
    if (prev && prev.note.trim() === note && prev.code === rec.code) return { kb: all, entry: prev, changed: false };
    const history = prev ? prev.history.concat([{ version: prev.version, day: prev.day, points: prev.points }]) : [];
    const entry = { deskId: rec.deskId, ticketId: rec.ticketId, version: versionOf(history.length), day: rec.day, code: rec.code,
      points: rec.points, lang: rec.lang, note, history: history.slice(-20) };
    all[rec.deskId] = entry;
    return { kb: all, entry, changed: true };
  }
  /* The article to show or download, in the interface language. The ticket's facts come from the desk; the cause, fix, verification
     and follow-up are the user's own sentences. codeLabel(id, lang) comes from the engine. */
  function buildArticle(sc, entry, lang, codeLabel) {
    const L = LABELS[lang] || LABELS.en;
    const r = sc.requester || {};
    const parts = structure(sc, entry.note);
    const sections = ROLES.map((role) => ({ role, label: L[role], text: parts[role] }));
    if (parts.other.length) sections.push({ role: "other", label: L.other, text: parts.other });
    return {
      deskId: sc.id, ticketId: entry.ticketId || sc.ticket.id, version: entry.version, day: entry.day, points: entry.points,
      title: t(sc.title, lang), topic: t(sc.topic, lang), code: codeLabel ? codeLabel(entry.code, lang) : entry.code,
      symptom: { subject: t(sc.ticket.subject, lang), body: t(sc.ticket.body, lang) },
      environment: [
        { label: L.requester, value: t(r.name, lang) + (r.team ? " (" + t(r.team, lang) + ")" : "") },
        { label: L.user, value: r.user || "" }, { label: L.device, value: r.device || "" },
        { label: L.location, value: t(r.location, lang) }, { label: L.affected, value: t((sc.asset || {}).title, lang) },
      ].filter((x) => x.value),
      sections, guide: sc.guide, history: entry.history || [], labels: L,
    };
  }
  function fileName(article) { return "kb-" + article.ticketId + "-v" + article.version + ".md"; }
  function toMarkdown(a) {
    const L = a.labels;
    const out = ["# " + a.title, "",
      `- ${L.ticket}: ${a.ticketId}`, `- ${L.version}: v${a.version}`, `- ${L.date}: ${a.day}`, `- ${L.topic}: ${a.topic}`, `- ${L.code}: ${a.code}`, "",
      "## " + L.symptom, "", "**" + a.symptom.subject + "**", "", a.symptom.body, "",
      "## " + L.environment, ""].concat(a.environment.map((x) => `- ${x.label}: ${x.value}`), [""]);
    a.sections.forEach((s) => { out.push("## " + s.label, ""); out.push(s.text.length ? s.text.join("\n\n") : "_" + L.none + "_"); out.push(""); });
    out.push("## " + L.guide, "", `<${a.guide}>`, "");
    if (a.history.length) out.push("## " + L.history, "", ...a.history.map((h) => `- v${h.version} · ${h.day}`), "");
    out.push("---", "", L.foot, "");
    return out.join("\n");
  }
  // the list view: search words in the title, the ticket, the topic and the note; topic "" means all
  function searchKb(articles, query, topic) {
    const q = fold(query).trim().split(/\s+/).filter(Boolean);
    return articles.filter((a) => (!topic || a.topic === topic) &&
      q.every((w) => fold([a.title, a.ticketId, a.topic, a.symptom.subject].concat(a.sections.flatMap((s) => s.text)).join(" ")).indexOf(w) !== -1));
  }

  /* ---------- internal mail: six messages, each one an exercise (see docs/growth-format.md) */
  const ME = "soporte@contoso.com";
  const PASS = { spf: "pass", dkim: "pass", dmarc: "pass" };
  const MAIL = [
    {
      id: "vpn-request", kind: "legit", day: "2026-10-26", time: "09:31", directory: "psanchez", link: { href: "#/directory", label: { en: "Open the directory", es: "Abrir el directorio" } },
      from: { name: "Pablo Sánchez", address: "psanchez@contoso.com" }, to: ME, cc: "Carlos Martín <cmartin@contoso.com>",
      subject: { en: "URGENT: I need the VPN for tomorrow", es: "URGENTE: necesito la VPN para mañana" },
      body: {
        en: ["Hi,", "Tomorrow I start working from home two days a week and I still cannot connect to the VPN. Carlos (in copy) has already approved it.",
          "I filled in the request on the intranet: [[0]]", "Can you give me access today? I have a customer demo tomorrow at 9:00.", "Thanks,\nPablo Sánchez · Sales representative"],
        es: ["Hola:", "Mañana empiezo a teletrabajar dos días por semana y todavía no puedo conectarme por VPN. Carlos (en copia) ya lo ha aprobado.",
          "He rellenado la solicitud en la intranet: [[0]]", "¿Me podéis dar acceso hoy? Mañana a las 9:00 tengo una demo con un cliente.", "Gracias,\nPablo Sánchez · Comercial"],
      },
      links: [{ text: "https://intranet.contoso.local/it/requests/vpn", href: "https://intranet.contoso.local/it/requests/vpn" }],
      headers: Object.assign({ replyTo: "psanchez@contoso.com", returnPath: "psanchez@contoso.com",
        received: "from LAPTOP-0264.contoso.local (10.20.14.88) by mail.contoso.com; Mon, 26 Oct 2026 09:31:12 +0100" }, PASS),
      options: [
        { id: "report", result: "partial", label: { en: "Report it as phishing: it is urgent and has a link", es: "Reportarlo como phishing: es urgente y trae un enlace" },
          why: { en: "Reporting when in doubt is never wrong, but here every check passes. The request is real and Pablo would lose his VPN for the demo.",
            es: "Reportar ante la duda nunca está mal, pero aquí todas las comprobaciones pasan. La petición es real y Pablo se quedaría sin VPN para la demo." } },
        { id: "do", result: "partial", label: { en: "Add him to GG-VPN-Users straight away, without logging anything", es: "Añadirlo a GG-VPN-Users ahora mismo, sin registrar nada" },
          why: { en: "The access is right, but without a ticket there is no record of the approval or of who made the change.",
            es: "El acceso es correcto, pero sin ticket no queda constancia de la aprobación ni de quién hizo el cambio." } },
        { id: "verify", result: "correct", label: { en: "Check the headers and the directory, log the request with Carlos's approval and add him to GG-VPN-Users",
          es: "Comprobar cabeceras y directorio, registrar la petición con la aprobación de Carlos y añadirlo a GG-VPN-Users" },
          why: { en: "Right: internal sender, checks passed, his manager approves in copy and the link goes to the real intranet form. Urgent does not mean phishing.",
            es: "Correcto: remitente interno, comprobaciones superadas, su responsable lo aprueba en copia y el enlace va al formulario real de la intranet. Urgente no significa phishing." } },
        { id: "ignore", result: "wrong", label: { en: "Ignore it: access is only requested by phone", es: "Ignorarlo: los accesos solo se piden por teléfono" },
          why: { en: "Contoso has an intranet form for this and the manager approves in copy. Ignoring it leaves a colleague without access for a real reason.",
            es: "Contoso tiene un formulario en la intranet para esto y el responsable lo aprueba en copia. Ignorarlo deja a un compañero sin acceso por un motivo real." } },
      ],
      clues: {
        en: ["Internal domain (contoso.com); SPF, DKIM and DMARC pass and the Reply-To is the same address.", "Pablo is in the directory (Sales representative, Sales) and his director, Carlos Martín, is in copy approving it.",
          "The link really goes to intranet.contoso.local, the internal form.", "The urgency has a concrete reason and it asks for no password."],
        es: ["Dominio interno (contoso.com); SPF, DKIM y DMARC pasan y el Reply-To es la misma dirección.", "Pablo está en el directorio (Comercial, Ventas) y su director, Carlos Martín, está en copia aprobándolo.",
          "El enlace va de verdad a intranet.contoso.local, el formulario interno.", "La urgencia tiene un motivo concreto y no pide ninguna contraseña."],
      },
      procedure: { en: "When the checks pass and the approval comes from the manager, log it and do it: in the directory, add Pablo Sánchez to GG-VPN-Users.",
        es: "Si las comprobaciones pasan y la aprobación es del responsable, regístralo y hazlo: en el directorio, añade a Pablo Sánchez a GG-VPN-Users." },
    },
    {
      id: "printer-request", kind: "request", ticket: "print-queue", day: "2026-10-26", time: "09:12", directory: "recepcion",
      from: { name: { en: "Reception", es: "Recepción" }, address: "recepcion@contoso.com" }, to: ME,
      subject: { en: "The reception printer is not printing", es: "La impresora de recepción no imprime" },
      body: {
        en: ["Hello,", "Nothing has come out of the reception printer since 9:00. There are 14 documents in the queue and they cannot be cancelled: the first one says 'Deleting' and stays there. We have already turned it off and on.",
          "We need to print the visitor badges for 11:00. Can you have a look?", "Thanks,\nReception · Head office"],
        es: ["Hola:", "Desde las 9:00 no sale nada por la impresora de recepción. Hay 14 documentos en la cola y no se pueden cancelar: el primero pone «Eliminando» y se queda ahí. Ya la hemos apagado y encendido.",
          "Tenemos que imprimir las acreditaciones de las visitas de las 11:00. ¿Podéis mirarlo?", "Gracias,\nRecepción · Oficina central"],
      },
      links: [],
      headers: Object.assign({ replyTo: "recepcion@contoso.com", returnPath: "recepcion@contoso.com",
        received: "from PC-REC-001.contoso.local (10.20.14.31) by mail.contoso.com; Mon, 26 Oct 2026 09:12:04 +0100" }, PASS),
      options: [
        { id: "do", result: "partial", label: { en: "Fix it straight away without logging anything", es: "Arreglarlo directamente sin registrar nada" },
          why: { en: "You may fix it, but with no ticket there is no record, no SLA and the next technician will not know what was done.",
            es: "Puede que lo arregles, pero sin ticket no queda constancia, no cuenta el SLA y el siguiente técnico no sabrá qué se hizo." } },
        { id: "ticket", result: "correct", label: { en: "Create a ticket from this message", es: "Crear un ticket desde este mensaje" },
          why: { en: "Right: a genuine request by email is logged as a ticket, with its priority, before you work on it.",
            es: "Correcto: una petición legítima por correo se registra como ticket, con su prioridad, antes de trabajarla." } },
        { id: "phone", result: "wrong", label: { en: "Reply telling them to call the service desk instead", es: "Contestar que llamen a la extensión de soporte" },
          why: { en: "The email already has everything you need. Making them repeat it only delays a real request with a deadline at 11:00.",
            es: "El correo ya trae todo lo necesario. Hacer que lo repitan solo retrasa una petición real con plazo a las 11:00." } },
        { id: "report", result: "partial", label: { en: "Report it as phishing", es: "Reportarlo como phishing" },
          why: { en: "It is internal, passes SPF, DKIM and DMARC, has no links and matches the directory: there is nothing to report.",
            es: "Es interno, pasa SPF, DKIM y DMARC, no trae enlaces y coincide con el directorio: no hay nada que reportar." } },
      ],
      clues: {
        en: ["Internal sender: the shared Reception mailbox, which is in the directory.", "SPF, DKIM and DMARC pass.", "No links or attachments, and what it asks for fits the sender."],
        es: ["Remitente interno: el buzón compartido de Recepción, que está en el directorio.", "SPF, DKIM y DMARC pasan.", "Sin enlaces ni adjuntos, y lo que pide encaja con quien lo envía."],
      },
      procedure: { en: "Log it as a ticket (INC-20452, P2) and work it from the queue: the SLA starts when you assign it to yourself.",
        es: "Regístralo como ticket (INC-20452, P2) y trabájalo desde la cola: el SLA empieza cuando te lo asignas." },
    },
    {
      id: "ceo-phish", kind: "phishing", day: "2026-10-26", time: "09:05", directory: null,
      from: { name: { en: "Isabel Ferrer (CEO)", es: "Isabel Ferrer (CEO)" }, address: "isabel.ferrer@contoso-it-support.com" }, to: ME,
      subject: { en: "URGENT: access review before 10:00", es: "URGENTE: revisión de accesos antes de las 10:00" },
      body: {
        en: ["I need you to do this now. I am going into a board meeting and cannot take calls.", "Audit is asking us to confirm the administrator accounts today. Sign in with your admin account on the portal and approve the list before 10:00: [[0]]",
          "Do not mention it to anyone on the team until it is closed. I am counting on you.", "Isabel Ferrer\nChief Executive"],
        es: ["Necesito que hagas esto ahora. Entro en una reunión del consejo y no puedo atender llamadas.", "Auditoría nos pide confirmar hoy las cuentas de administrador. Entra con tu cuenta de administrador en el portal y valida la lista antes de las 10:00: [[0]]",
          "No lo comentes con nadie del equipo hasta que esté cerrado. Cuento contigo.", "Isabel Ferrer\nConsejera delegada"],
      },
      links: [{ text: "https://portal.contoso.com/access-review", href: "https://contoso-it-support.com/o365/login.php?ref=it-admin" }],
      headers: { replyTo: "isabel.ferrer.ceo@freemail.example", returnPath: "bounce-77@mailer.contoso-it-support.com",
        received: "from mailer.contoso-it-support.com (203.0.113.45) by mail.contoso.com; Mon, 26 Oct 2026 09:05:51 +0100", spf: "fail", dkim: "none", dmarc: "fail" },
      options: [
        { id: "click", result: "wrong", label: { en: "Open the link and approve with your admin account", es: "Abrir el enlace y validar con tu cuenta de administrador" },
          why: { en: "That is exactly what the attacker wants: the password of a privileged account. The link does not go to portal.contoso.com.",
            es: "Es justo lo que busca el atacante: la contraseña de una cuenta con privilegios. El enlace no lleva a portal.contoso.com." } },
        { id: "ask", result: "wrong", label: { en: "Reply asking for more details", es: "Contestar pidiendo más detalles" },
          why: { en: "The reply would go to a free-mail address (the Reply-To is different) and tells the attacker the mailbox is read.",
            es: "La respuesta iría a una dirección gratuita (el Reply-To es otro) y le confirma al atacante que el buzón se lee." } },
        { id: "verify", result: "partial", label: { en: "Call the executive office on a number you know to confirm it", es: "Llamar a la oficina de dirección a un número conocido para confirmarlo" },
          why: { en: "Good: you verify through a known channel. But the clues are clear and it must also be reported, so security can block it for everyone.",
            es: "Bien: verificas por un canal conocido. Pero las señales son claras y además hay que reportarlo, para que seguridad lo bloquee para todos." } },
        { id: "report", result: "correct", label: { en: "Report it as phishing to security without opening the link", es: "Reportarlo como phishing a seguridad sin abrir el enlace" },
          why: { en: "Right: a look-alike external domain, a different Reply-To, SPF and DMARC fail, urgency and secrecy, and a link that does not go where it says.",
            es: "Correcto: dominio externo parecido al de la empresa, Reply-To distinto, SPF y DMARC fallan, urgencia y secreto, y un enlace que no va a donde dice." } },
      ],
      clues: {
        en: ["contoso-it-support.com is not a Contoso domain: no account in the directory uses that address.", "Reply-To goes to freemail.example, not to the sender.",
          "SPF fail, no DKIM signature and DMARC fail.", "The link text says portal.contoso.com but it opens contoso-it-support.com.", "Pressure: urgent, no calls, keep it secret."],
        es: ["contoso-it-support.com no es un dominio de Contoso: ninguna cuenta del directorio usa esa dirección.", "El Reply-To va a freemail.example, no al remitente.",
          "SPF fail, sin firma DKIM y DMARC fail.", "El texto del enlace dice portal.contoso.com pero abre contoso-it-support.com.", "Presión: urgente, sin llamadas y en secreto."],
      },
      procedure: { en: "Do not open the link or reply. Report it to security (the phishing button in the mail client), and if in doubt confirm with the person through a channel you already know, never with the details in the email.",
        es: "No abras el enlace ni respondas. Repórtalo a seguridad (el botón de phishing del correo) y, si dudas, confirma con la persona por un canal que ya conozcas, nunca con los datos del propio correo." },
    },
    {
      id: "mailbox-request", kind: "request", ticket: "mailbox-full", day: "2026-10-26", time: "08:47", directory: "cmartin",
      from: { name: "Carlos Martín", address: "cmartin@contoso.com" }, to: ME,
      subject: { en: "Customer emails to me are bouncing", es: "Me rebotan los correos de clientes" },
      body: {
        en: ["Good morning,", "Since yesterday afternoon two customers have told me their emails to me bounce, and nothing external has reached me today.",
          "I have a tender closing on Friday and cannot afford to lose emails. Can you help?", "Carlos Martín · Sales director"],
        es: ["Buenos días:", "Desde ayer por la tarde dos clientes me dicen que los correos que me envían les rebotan, y hoy no me ha llegado nada de fuera.",
          "El viernes cierro una licitación y no me puedo permitir perder correos. ¿Me echáis una mano?", "Carlos Martín · Director comercial"],
      },
      links: [],
      headers: Object.assign({ replyTo: "cmartin@contoso.com", returnPath: "cmartin@contoso.com",
        received: "from LAPTOP-0102.contoso.local (10.20.14.42) by mail.contoso.com; Mon, 26 Oct 2026 08:47:30 +0100" }, PASS),
      options: [
        { id: "ticket", result: "correct", label: { en: "Create a ticket from this message", es: "Crear un ticket desde este mensaje" },
          why: { en: "Right: it is a genuine request with business impact; log it as a ticket (P1) and work it from the queue.",
            es: "Correcto: es una petición legítima con impacto en el negocio; regístrala como ticket (P1) y trabájala desde la cola." } },
        { id: "delete", result: "partial", label: { en: "Tell him to delete old emails to make room", es: "Decirle que borre correos antiguos para hacer sitio" },
          why: { en: "It might help for a day, but you do not know the cause yet and nothing is logged. Ticket first, then investigate.",
            es: "Puede aliviarlo un día, pero aún no sabes la causa y no queda nada registrado. Primero el ticket, después investigar." } },
        { id: "wait", result: "wrong", label: { en: "Reply that it is probably the customers' problem", es: "Contestar que seguramente es problema de los clientes" },
          why: { en: "Two customers and no external mail at all point to his mailbox. Dismissing it costs him customer emails before a tender.",
            es: "Dos clientes y ningún correo externo apuntan a su buzón. Descartarlo le hace perder correos de clientes antes de una licitación." } },
        { id: "report", result: "partial", label: { en: "Report it as phishing", es: "Reportarlo como phishing" },
          why: { en: "It comes from his real address, passes SPF, DKIM and DMARC and asks for nothing unusual: there is nothing to report.",
            es: "Llega de su dirección real, pasa SPF, DKIM y DMARC y no pide nada raro: no hay nada que reportar." } },
      ],
      clues: {
        en: ["His real address (cmartin@contoso.com), which matches the directory.", "SPF, DKIM and DMARC pass, and the Reply-To is the same.", "No links, no credentials requested: a normal support request."],
        es: ["Su dirección real (cmartin@contoso.com), que coincide con el directorio.", "SPF, DKIM y DMARC pasan, y el Reply-To es el mismo.", "Sin enlaces y sin pedir credenciales: una petición de soporte normal."],
      },
      procedure: { en: "Log it as a ticket (INC-20460, P1: a director losing customer email) and work it from the queue.",
        es: "Regístralo como ticket (INC-20460, P1: un director que pierde correo de clientes) y trabájalo desde la cola." },
    },
    {
      id: "mfa-reset", kind: "impersonation", day: "2026-10-26", time: "08:21", directory: null, claims: "cmartin",
      from: { name: "Carlos Martín", address: "carlos.martin.travel@freemail.example" }, to: ME,
      subject: { en: "My phone was stolen at the airport", es: "Me han robado el móvil en el aeropuerto" },
      body: {
        en: ["Hi, this is Carlos Martín, Sales director. I am at the airport on my way to a trade fair and my phone has been stolen, so I cannot use the MFA app.",
          "Please remove MFA from my account and set a new password. Send it to this address, it is the only one I can check right now. I board in 40 minutes.", "Thanks, Carlos"],
        es: ["Hola, soy Carlos Martín, director comercial. Estoy en el aeropuerto camino de una feria y me han robado el móvil, así que no puedo usar la aplicación de MFA.",
          "Por favor, quitad el MFA de mi cuenta y ponedme una contraseña nueva. Mandádmela a esta dirección, que es la única que puedo mirar ahora. Embarco en 40 minutos.", "Gracias, Carlos"],
      },
      links: [],
      headers: Object.assign({ replyTo: "carlos.martin.travel@freemail.example", returnPath: "carlos.martin.travel@freemail.example",
        received: "from smtp.freemail.example (198.51.100.23) by mail.contoso.com; Mon, 26 Oct 2026 08:21:09 +0100" }, PASS),
      options: [
        { id: "do", result: "wrong", label: { en: "Reset MFA and the password and send it by email", es: "Restablecer el MFA y la contraseña y enviarla por correo" },
          why: { en: "Anyone can write from a free-mail address with a director's name. This would hand over his account, and a password is never sent by email.",
            es: "Cualquiera puede escribir desde una dirección gratuita con el nombre de un director. Así entregarías su cuenta, y una contraseña nunca se envía por correo." } },
        { id: "ask", result: "partial", label: { en: "Reply asking for his employee number to confirm it", es: "Responder pidiendo su número de empleado para confirmarlo" },
          why: { en: "Better than doing it, but an attacker may know that number and the conversation stays on an address you do not control. Verify outside email.",
            es: "Mejor que hacerlo sin más, pero un atacante puede saber ese número y la conversación sigue en una dirección que no controlas. Verifica fuera del correo." } },
        { id: "verify", result: "correct", label: { en: "Do not act by email: call him on the number in the directory (or his manager), follow the identity check and tell security",
          es: "No actuar por correo: llamarle al número del directorio (o a su responsable), seguir la verificación de identidad y avisar a seguridad" },
          why: { en: "Right: credential and MFA requests are verified through a known channel, and a temporary password is given by phone, never by email.",
            es: "Correcto: las peticiones de credenciales o MFA se verifican por un canal conocido, y la contraseña temporal se da por teléfono, nunca por correo." } },
        { id: "report", result: "partial", label: { en: "Report it as phishing and do nothing else", es: "Reportarlo como phishing y no hacer nada más" },
          why: { en: "Reporting it is good, but if it really is Carlos he is still locked out: verify through a known channel and follow the MFA procedure.",
            es: "Reportarlo está bien, pero si de verdad es Carlos sigue sin acceso: verifica por un canal conocido y sigue el procedimiento de MFA." } },
      ],
      clues: {
        en: ["A personal address (freemail.example), not contoso.com: the directory has cmartin@contoso.com for Carlos Martín.", "SPF, DKIM and DMARC pass, but they only prove it came from freemail.example, not that it is Carlos.",
          "It asks to remove MFA and to send a password by email: two things that are never done.", "Time pressure (boarding in 40 minutes) so you do not check."],
        es: ["Una dirección personal (freemail.example), no contoso.com: el directorio tiene cmartin@contoso.com para Carlos Martín.", "SPF, DKIM y DMARC pasan, pero solo demuestran que viene de freemail.example, no que sea Carlos.",
          "Pide quitar el MFA y enviar una contraseña por correo: dos cosas que nunca se hacen.", "Prisa (embarca en 40 minutos) para que no lo compruebes."],
      },
      procedure: { en: "Verify the person outside email (the phone number in the directory, or their manager), follow the identity procedure for MFA resets, give any temporary password by phone and let security know about the attempt.",
        es: "Verifica a la persona fuera del correo (el teléfono del directorio o su responsable), sigue el procedimiento de identidad para restablecer el MFA, da la contraseña temporal por teléfono y avisa a seguridad del intento." },
    },
    {
      id: "maintenance", kind: "notice", day: "2026-10-26", time: "07:50", directory: null,
      dirNote: { en: "Shared mailbox of the IT Operations team (contoso.com).", es: "Buzón compartido del equipo de Operaciones IT (contoso.com)." },
      from: { name: { en: "IT Operations", es: "Operaciones IT" }, address: "it-operations@contoso.com" }, to: "all-staff@contoso.com",
      subject: { en: "Planned maintenance: FS01, Saturday 31 October, 22:00 to 02:00", es: "Mantenimiento programado: FS01, sábado 31 de octubre, de 22:00 a 02:00" },
      body: {
        en: ["Hello everyone,", "On Saturday 31 October, from 22:00 to 02:00, we will install the October security updates on FS01. During that time the S: drive and the department shares will not be available.",
          "You do not need to do anything. If something does not work on Monday, open a ticket as usual.", "IT Operations"],
        es: ["Hola a todos:", "El sábado 31 de octubre, de 22:00 a 02:00, instalaremos las actualizaciones de seguridad de octubre en FS01. Durante ese tiempo la unidad S: y las carpetas de departamento no estarán disponibles.",
          "No tenéis que hacer nada. Si el lunes algo no funciona, abrid un ticket como siempre.", "Operaciones IT"],
      },
      links: [],
      headers: Object.assign({ replyTo: "it-operations@contoso.com", returnPath: "it-operations@contoso.com",
        received: "from ADM-WS01.contoso.local (10.20.1.50) by mail.contoso.com; Mon, 26 Oct 2026 07:50:02 +0100" }, PASS),
      options: [
        { id: "none", result: "correct", label: { en: "Nothing: it is a notice. Read it and keep it in mind if tickets come in", es: "Nada: es un aviso. Leerlo y tenerlo en cuenta si llegan tickets" },
          why: { en: "Right: an internal, authenticated notice that asks for nothing. Knowing the window helps if S: drive tickets arrive on Monday.",
            es: "Correcto: un aviso interno y autenticado que no pide nada. Saber la ventana ayuda si el lunes llegan tickets de la unidad S:." } },
        { id: "report", result: "partial", label: { en: "Report it as phishing", es: "Reportarlo como phishing" },
          why: { en: "Reporting when in doubt is never frowned upon, but everything adds up here: internal domain, all checks pass, no links or requests, and FS01 is in the inventory.",
            es: "Reportar ante la duda nunca está mal visto, pero aquí todo cuadra: dominio interno, todas las comprobaciones pasan, sin enlaces ni peticiones, y FS01 está en el inventario." } },
        { id: "forward", result: "partial", label: { en: "Forward it to your whole team just in case", es: "Reenviarlo a todo tu equipo por si acaso" },
          why: { en: "It already went to all staff; forwarding it only adds noise to everyone's inbox.", es: "Ya ha llegado a toda la plantilla; reenviarlo solo añade ruido en todos los buzones." } },
        { id: "reply", result: "wrong", label: { en: "Reply asking them to move it to another day", es: "Responder pidiendo que lo cambien de día" },
          why: { en: "It is planned and announced maintenance outside working hours; objections go through change management, not a reply to the notice.",
            es: "Es un mantenimiento planificado, avisado y fuera de horario; las objeciones van por el proceso de cambios, no respondiendo al aviso." } },
      ],
      clues: {
        en: ["Internal domain; SPF, DKIM and DMARC pass.", "It asks for nothing and has no links or attachments.", "FS01 exists in the inventory: it is the file server behind the S: drive."],
        es: ["Dominio interno; SPF, DKIM y DMARC pasan.", "No pide nada ni trae enlaces o adjuntos.", "FS01 existe en el inventario: es el servidor de ficheros de la unidad S:."],
      },
      procedure: { en: "A genuine notice needs no action. Note the window: if S: drive tickets arrive on Monday, you know where to start.",
        es: "Un aviso legítimo no necesita acción. Apunta la ventana: si el lunes llegan tickets de la unidad S:, ya sabes por dónde empezar." },
    },
  ];
  function mail(id) { return MAIL.find((m) => m.id === id) || null; }
  // a paragraph with links: "Text [[0]]" -> [{text}, {link: 0}]
  function paragraph(text) {
    return String(text).split(/(\[\[\d+\]\])/).filter((s) => s !== "").map((s) => {
      const m = /^\[\[(\d+)\]\]$/.exec(s);
      return m ? { link: Number(m[1]) } : { text: s };
    });
  }
  function domainOf(address) { return String(address || "").split("@")[1] || ""; }
  function grade(msg, optionId) {
    const o = (msg.options || []).find((x) => x.id === optionId);
    return o ? { result: o.result, option: o } : null;
  }
  // answers: {mailId: {answer, result, day, tries}}
  function mailScore(answers) {
    const a = answers || {};
    const out = { total: MAIL.length, answered: 0, correct: 0, partial: 0, wrong: 0 };
    MAIL.forEach((m) => { const r = a[m.id]; if (!r || !r.result) return; out.answered += 1; out[r.result] += 1; });
    return out;
  }

  /* ---------- badges: computed from what the app keeps (activity, best results, knowledge base, mail answers) */
  /* facts: {closes: [ticket activity], solved: [desk ids with a best result], desks: [all desk ids], kb: number of articles,
             mail: {mailId: {result}}, best: best streak} */
  const BADGES = [
    { id: "first-ticket", icon: "▤", name: { en: "First ticket", es: "Primer ticket" }, rule: { en: "Close your first ticket fixed.", es: "Cierra tu primer ticket arreglado." },
      test: (f) => f.solved.length >= 1 },
    { id: "spotless-note", icon: "✎", name: { en: "Spotless note", es: "Nota impecable" }, rule: { en: "Close a ticket with a complete note and no hints.", es: "Cierra un ticket con una nota completa y sin pistas." },
      test: (f) => f.closes.some((c) => c.noteComplete && c.hints === 0) },
    { id: "own-steam", icon: "◆", name: { en: "On your own", es: "Por tu cuenta" }, rule: { en: "Close three different tickets without hints.", es: "Cierra tres tickets distintos sin pistas." },
      test: (f) => new Set(f.closes.filter((c) => c.hints === 0).map((c) => c.id)).size >= 3 },
    { id: "on-time", icon: "◷", name: { en: "Beat the clock", es: "Dentro del SLA" }, rule: { en: "Close five different tickets within the SLA.", es: "Cierra cinco tickets distintos dentro del SLA." },
      test: (f) => new Set(f.closes.filter((c) => c.slaOk).map((c) => c.id)).size >= 5 },
    { id: "full-shift", icon: "★", name: { en: "Full shift", es: "Turno completo" }, rule: { en: "Close every ticket in the queue at least once.", es: "Cierra todos los tickets de la cola al menos una vez." },
      test: (f) => f.desks.length > 0 && f.desks.every((id) => f.solved.includes(id)) },
    { id: "streak-3", icon: "3", name: { en: "Three in a row", es: "Tres días seguidos" }, rule: { en: "Practise three days in a row.", es: "Practica tres días seguidos." },
      test: (f) => f.best >= 3 },
    { id: "streak-7", icon: "7", name: { en: "Seven-day streak", es: "Semana seguida" }, rule: { en: "Practise seven days in a row.", es: "Practica siete días seguidos." },
      test: (f) => f.best >= 7 },
    { id: "sharp-eye", icon: "⚑", name: { en: "Sharp eye", es: "Ojo de halcón" }, rule: { en: "Report the phishing email to security.", es: "Reporta a seguridad el correo de phishing." },
      test: (f) => MAIL.filter((m) => m.kind === "phishing").every((m) => f.mail[m.id] && f.mail[m.id].result === "correct") },
    { id: "first-article", icon: "▧", name: { en: "First article", es: "Primer artículo" }, rule: { en: "Save your first knowledge base article.", es: "Guarda tu primer artículo en la base de conocimiento." },
      test: (f) => f.kb >= 1 },
    { id: "librarian", icon: "▥", name: { en: "Librarian", es: "Biblioteca propia" }, rule: { en: "Have five articles in your knowledge base.", es: "Ten cinco artículos en tu base de conocimiento." },
      test: (f) => f.kb >= 5 },
  ];
  function facts(o) {
    const activity = o.activity || [];
    return {
      closes: activity.filter((a) => a.type === "ticket"),
      solved: Array.from(new Set(Object.keys(o.progress || {}).concat(activity.filter((a) => a.type === "ticket").map((a) => a.id)))),
      desks: o.desks || [], kb: Object.keys(o.kb || {}).length, mail: o.mail || {}, best: streak(activity, o.today || dayOf()).best,
    };
  }
  /* Badges once earned stay earned: prev is {badgeId: day}. Returns {awards, fresh: [ids earned now]}. */
  function award(prev, f, today) {
    const awards = Object.assign({}, prev || {});
    const fresh = [];
    BADGES.forEach((b) => { if (!awards[b.id] && b.test(f)) { awards[b.id] = today; fresh.push(b.id); } });
    return { awards, fresh };
  }
  function badges(awards, lang) {
    const a = awards || {};
    return BADGES.map((b) => ({ id: b.id, icon: b.icon, name: t(b.name, lang), rule: t(b.rule, lang), earned: Boolean(a[b.id]), day: a[b.id] || null }));
  }

  return { t, fold, dayOf, dayNum, isoWeek, activeDays, streak, GOAL, goalValue, week, ROLES, LABELS, splitNote, structure, qualifies, saveArticle,
    buildArticle, fileName, toMarkdown, searchKb, MAIL, mail, paragraph, domainOf, grade, mailScore, BADGES, facts, award, badges };
});
