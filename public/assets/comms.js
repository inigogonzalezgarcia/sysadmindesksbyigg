/* SysAdmin Desks by IGG - communication (v0.6a): talking to the requester and the note the requester reads.
   Pure logic, no DOM: the app keeps the conversation in the ticket's workflow record (sd.work[deskId].contact) and the Node tests
   use the same code. The questions of each desk are data: the `contact` field of the scenario (see docs/scenario-format.md).

   A conversation: rec.contact = { asked: [{ id, at, result }] }, where result is "ok" or "failed" for the confirmation question.
   Each question costs COST_MS of SLA time (rec.extraMs, added by workflow.js to the SLA used) and goes into rec.timeline as
   { at, from: "progress", to: "progress", contact: <question id> }. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDComms = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const COST_MS = 60000;            // one simulated minute per question
  const KINDS = ["useful", "neutral", "bad"];
  const NOTE_MIN = 120;             // characters of a user note
  const NOTE_MAX = 900;

  function t(value, lang) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || "";
  }
  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function when(cond, state) {
    if (!cond) return true;
    return Object.keys(cond).every((k) => state[k] === cond[k]);
  }

  /* ---------- who you talk to and what you can ask */

  // the person on the other end: the desk's contact.who, or its requester
  function who(sc, lang) {
    const c = sc.contact || {};
    const w = c.who || sc.requester || {};
    const name = t(w.name, lang);
    return { name, first: name.split(" ")[0], team: t(w.team, lang), initials: name.split(" ").map((x) => x[0] || "").join("").slice(0, 2) };
  }
  function questionsOf(sc) { return ((sc.contact || {}).questions) || []; }
  function find(sc, id) { return questionsOf(sc).find((q) => q.id === id) || null; }
  function askedList(rec) { return rec && rec.contact && Array.isArray(rec.contact.asked) ? rec.contact.asked : []; }

  // the fix is in: the desk's contact.fixed flags, or else its "fix" stage
  function isFixed(sc, sess) {
    const c = sc.contact || {};
    const cond = c.fixed || ((sc.stages || []).find((s) => s.id === "fix") || {}).when || sc.goal;
    return when(cond, sess.state);
  }
  // the tempting fix was tried (one of its command rules ran) and the state still matches contact.temptingWhen
  function isTempted(sc, sess) {
    const c = sc.contact || {};
    const used = sess.used || new Set();
    return (c.tempting || []).some((id) => used.has(id)) && when(c.temptingWhen, sess.state);
  }
  // the confirmation question ("does it work now?") only makes sense once something has been changed
  function confirmState(sc, sess) {
    if (isFixed(sc, sess)) return "ok";
    if (isTempted(sc, sess)) return "failed";
    return null;
  }

  // can the technician contact the requester now? Only with the ticket assigned and in progress
  function canContact(rec) {
    if (!rec || !rec.status || rec.status === "new") return { ok: false, reason: "unassigned" };
    if (rec.status === "pending-user" || rec.status === "pending-vendor") return { ok: false, reason: "pending" };
    if (rec.status !== "progress") return { ok: false, reason: "closed" };
    return { ok: true, reason: null };
  }

  /* The questions to show: [{id, text, kind, asked, available}]. A question is asked once; the confirmation question appears once
     the fix (or the tempting fix) is in, and can be asked again when the last answer was "it fails" and it would now say "it works". */
  function questions(sc, sess, rec, lang) {
    const asked = askedList(rec);
    const conf = confirmState(sc, sess);
    return questionsOf(sc).map((q) => {
      const prev = asked.filter((a) => a.id === q.id);
      let available;
      if (q.requires === "fixed") {
        const last = prev[prev.length - 1];
        available = conf !== null && (!last || (last.result === "failed" && conf === "ok"));
      } else available = prev.length === 0;
      return { id: q.id, text: t(q.text, lang), kind: q.kind, confirm: q.requires === "fixed", asked: prev.length > 0, available };
    });
  }

  /* Asks one question. Returns { ok: true, rec, entry } with a new record (the old one is not changed): one more minute of SLA,
     the question in the timeline and in rec.contact; or { ok: false, error } with "unassigned", "pending", "closed", "unknown" or "asked". */
  function ask(rec, sess, id, opts) {
    const o = opts || {};
    const now = Number.isFinite(o.now) ? o.now : Date.now();
    const can = canContact(rec);
    if (!can.ok) return { ok: false, error: can.reason };
    const sc = sess.sc;
    const q = find(sc, id);
    if (!q) return { ok: false, error: "unknown" };
    const avail = questions(sc, sess, rec, "en").find((x) => x.id === id);
    if (!avail || !avail.available) return { ok: false, error: "asked" };
    const item = { id, at: now };
    if (q.requires === "fixed") item.result = confirmState(sc, sess);
    const next = Object.assign({}, rec, {
      extraMs: Math.max(0, Number(rec.extraMs) || 0) + COST_MS,
      contact: { asked: askedList(rec).concat([item]).slice(-50) },
      timeline: (rec.timeline || []).concat([{ at: now, from: "progress", to: "progress", contact: id }]).slice(-100),
    });
    return { ok: true, rec: next, entry: exchange(sc, item, o.lang || "en") };
  }

  // one question and its answer, in the language asked for: {id, q, a, kind, clue, why, password, result}
  function exchange(sc, item, lang) {
    const q = find(sc, item.id);
    if (!q) return null;
    const a = item.result === "failed" ? t(q.failed, lang) : t(q.answer, lang);
    return { id: q.id, at: item.at, q: t(q.text, lang), a, kind: q.kind, confirm: q.requires === "fixed", result: item.result || null,
      clue: q.clue ? t(q.clue, lang) : "", why: q.why ? t(q.why, lang) : "", password: Boolean(q.password) };
  }
  function conversation(rec, sc, lang) {
    return askedList(rec).map((a) => exchange(sc, a, lang)).filter(Boolean);
  }
  // "What you know": the clues revealed by the useful questions asked so far, in order
  function clues(rec, sc, lang) {
    return conversation(rec, sc, lang).filter((x) => x.clue).map((x) => x.clue);
  }
  function questionText(sc, id, lang) { const q = find(sc, id); return q ? t(q.text, lang) : id; }

  // what the conversation adds up to, for the result and the progress page
  function summary(rec, sc) {
    const conv = conversation(rec, sc, "en");
    const last = conv.filter((x) => x.confirm).pop();
    return {
      asked: conv.length,
      useful: conv.filter((x) => x.kind === "useful" && !x.confirm).length,
      neutral: conv.filter((x) => x.kind === "neutral").length,
      bad: conv.filter((x) => x.kind === "bad").length,
      password: conv.some((x) => x.password),
      confirmed: last ? last.result : null,
      minutes: conv.length * COST_MS / 60000,
    };
  }

  /* ---------- the note for the user: five simple rules, each one true or false */

  // words a user does not need to know; fine when explained right after: "the spooler (the service that sends jobs to the printer)"
  const JARGON = ["spooler", "gpo", "spn", "kerberos", "dns", "dhcp", "registry", "regedit", "powershell", "cmdlet", "ntp", "chrony", "chronyd", "sssd",
    "tpm", "mdm", "smtp", "ndr", "saml", "sso", "thumbprint", "ou", "cn=users", "active directory", "entra id", "azure ad", "conditional access",
    "acceso condicional", "pim", "countviolation", "sku", "fullaccess", "full access", "sendas", "send as", "automapping", "mecm", "sccm",
    "detection method", "metodo de deteccion", "product code", "codigo de producto", "msi", "logrotate", "nginx", "gunicorn", "systemd", "journalctl",
    "upstream", "vda", "delivery controller", "broker", "transaction log", "log_backup", "recovery model", "synthetic full", "repository", "repositorio",
    "managed folder assistant", "retention policy", "wuauserv", "softwaredistribution", "delta sync", "keytab", "realm", "gfs", "flushdns", "ipconfig",
    "vlan", "bpdu", "bpduguard", "bpdu guard", "err-disabled", "spanning tree", "any-any"];
  const EXPLAINED = /^\s*(\(|,?\s*(es decir|o sea|that is|i\.e\.|which is|meaning|que es|el servicio|the service|la pieza|the part)\b|:\s|\s[-–—]\s)/;
  function jargonIn(text) {
    const f = fold(text);
    const found = [];
    JARGON.forEach((w) => {
      const re = new RegExp("(^|[^a-z0-9_])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=$|[^a-z0-9_])", "g");
      let m;
      while ((m = re.exec(f))) {
        const end = m.index + m[0].length;
        if (!EXPLAINED.test(f.slice(end, end + 30)) && !found.includes(w)) found.push(w);
      }
    });
    return found;
  }

  // details for IT only: server names, admin and service accounts, passwords and keys, private IPs, GUIDs and thumbprints, UNC paths
  function internalIn(text, opts) {
    const o = opts || {};
    const own = fold(o.device || "");
    const s = String(text || "");
    const out = [];
    const add = (x) => { if (x && !out.includes(x)) out.push(x); };
    (s.match(/\b[A-Za-z]{2,}(?:-[A-Za-z0-9]+)*-[A-Za-z]*\d+[A-Za-z0-9]*\b/g) || []).forEach((x) => {
      if (/^(inc|req)-/i.test(x) || fold(x) === own) return;
      add(x);
    });
    (s.match(/\b(dc|fs|vbr|sync|repo|sql|srv)\d{2}\b/gi) || []).forEach(add);
    (s.match(/\bit\.admin\b|\bsvc-[a-z0-9-]+|\badministra(tor|dor)\b|\b(as|como) root\b|\broot@\S+/gi) || []).forEach(add);
    (s.match(/\b(contrase(ñ|n)a|password|clave)( temporal| nueva| new| temporary)?\s*[:=]\s*\S+/gi) || []).forEach(add);
    (s.match(/\b\d{6}(-\d{6}){3,}\b/g) || []).forEach(add);
    (s.match(/\b(10|192\.168|172\.(1[6-9]|2\d|3[01]))(\.\d{1,3}){2,3}\b/g) || []).forEach(add);
    (s.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\b[0-9a-f]{32,40}\b/gi) || []).forEach(add);
    (s.match(/\\\\[A-Za-z0-9.-]+\\\S*/g) || []).forEach(add);
    return out;
  }
  // template gaps left to fill: [what happened], [qué ha pasado]...
  function placeholdersIn(text) {
    return (String(text || "").match(/\[[^\]\n]{1,60}\]/g) || []).filter((x, i, a) => a.indexOf(x) === i);
  }

  const CAUSE = {
    es: ["porque", "la causa", "el problema", "se debia", "debido a", "ha pasado", "pasaba", "ocurria", "lo que fallaba", "lo que pasaba", "se habia", "estaba mal", "venia de", "fallaba"],
    en: ["because", "the cause", "the problem", "the issue", "caused by", "was due", "happened", "turned out", "was wrong", "came from", "was failing"],
  };
  const NEXT = {
    es: ["no tienes que hacer nada", "no hace falta", "no necesitas", "tienes que", "te pido", "por favor", "la proxima vez", "si vuelve a pasar",
      "si vuelve a ocurrir", "avisanos", "avisame", "responde a", "llamanos", "llamame", "reinicia", "cierra sesion", "vuelve a entrar", "vuelve a iniciar"],
    en: ["don't need to", "do not need to", "nothing else to do", "no action", "no need to", "please", "you need to", "you will need to", "next time",
      "if it happens again", "let us know", "let me know", "reply to", "call us", "call me", "restart", "sign in again", "sign out"],
  };
  const hasAny = (f, list) => list.some((w) => f.indexOf(fold(w)) !== -1);
  const nameIn = (f, first) => Boolean(first) && new RegExp("(^|[^a-z])" + fold(first) + "($|[^a-z])").test(f);

  /* Marks the note for the user. ctx: { name (the requester's first name), device (theirs: not internal), lang }.
     Returns { score, max: 5, empty, rules: [{ id, ok, detail }] } where detail lists what was found wrong. */
  const RULES = ["name", "plain", "next", "private", "ready"];
  function checkUserNote(text, ctx) {
    const c = ctx || {};
    const raw = String(text || "").trim();
    const f = fold(raw);
    const jargon = jargonIn(raw);
    const internal = internalIn(raw, { device: c.device });
    const holes = placeholdersIn(raw);
    const len = raw.length;
    const cause = hasAny(f, CAUSE.es) || hasAny(f, CAUSE.en);
    const rules = [
      { id: "name", ok: nameIn(f, c.name), detail: [] },
      { id: "plain", ok: cause && jargon.length === 0, detail: (cause ? [] : ["cause"]).concat(jargon) },
      { id: "next", ok: hasAny(f, NEXT.es) || hasAny(f, NEXT.en), detail: [] },
      { id: "private", ok: internal.length === 0, detail: internal },
      { id: "ready", ok: holes.length === 0 && len >= NOTE_MIN && len <= NOTE_MAX, detail: holes.concat(len < NOTE_MIN ? ["short"] : len > NOTE_MAX ? ["long"] : []) },
    ];
    if (!raw) rules.forEach((r) => { r.ok = false; });
    return { score: rules.filter((r) => r.ok).length, max: RULES.length, empty: !raw, length: len, rules };
  }

  const LABELS = {
    es: {
      name: "Te diriges al usuario por su nombre", plain: "Explicas qué pasaba con palabras sencillas", next: "Dices qué tiene que hacer (o que no tiene que hacer nada)",
      private: "Sin datos internos (servidores, cuentas de administración, contraseñas)", ready: "Lista para enviar: sin huecos de plantilla y de 120 a 900 caracteres",
      cause: "no dices qué pasaba («el problema era…», «porque…»)", jargon: (w) => `jerga sin explicar: «${w}»`, internal: (w) => `dato interno: «${w}»`,
      hole: (w) => `hueco sin rellenar: ${w}`, short: (n) => `muy corta (${n} caracteres, mínimo ${NOTE_MIN})`, long: (n) => `muy larga (${n} caracteres, máximo ${NOTE_MAX})`,
    },
    en: {
      name: "You address the user by name", plain: "You say what was wrong in plain words", next: "You say what they have to do (or that nothing is needed)",
      private: "No internal details (servers, admin accounts, passwords)", ready: "Ready to send: no template gaps, 120 to 900 characters",
      cause: "you don't say what was wrong (\"the problem was…\", \"because…\")", jargon: (w) => `unexplained jargon: "${w}"`, internal: (w) => `internal detail: "${w}"`,
      hole: (w) => `gap not filled in: ${w}`, short: (n) => `too short (${n} characters, minimum ${NOTE_MIN})`, long: (n) => `too long (${n} characters, maximum ${NOTE_MAX})`,
    },
  };
  // the rules in words, each with what went wrong: [{id, ok, label, problems: [text]}]
  function describe(check, lang) {
    const L = LABELS[lang === "es" ? "es" : "en"];
    return check.rules.map((r) => {
      const problems = r.detail.map((d) => {
        if (r.id === "plain") return d === "cause" ? L.cause : L.jargon(d);
        if (r.id === "private") return L.internal(d);
        if (r.id === "ready") return d === "short" ? L.short(check.length) : d === "long" ? L.long(check.length) : L.hole(d);
        return d;
      });
      return { id: r.id, ok: r.ok, label: L[r.id], problems };
    });
  }

  /* ---------- the closing templates (the user edits them: every [gap] must be replaced) */
  const TEMPLATES = [
    { id: "resolved", label: { es: "Resuelto, con explicación", en: "Resolved, with an explanation" },
      text: {
        es: "Hola {name}:\n\nYa está resuelto. El problema era que [qué pasaba, en palabras sencillas].\n\nLo que he hecho: [qué has cambiado].\n\nNo tienes que hacer nada más. Si vuelve a pasar, responde a este mensaje y lo miramos.\n\nUn saludo,\n{me}",
        en: "Hi {name},\n\nThis is now fixed. The problem was that [what was wrong, in plain words].\n\nWhat I did: [what you changed].\n\nYou don't need to do anything else. If it happens again, reply to this message and we'll look at it.\n\nBest regards,\n{me}" } },
    { id: "action", label: { es: "Resuelto, falta un paso tuyo", en: "Resolved, one step for you" },
      text: {
        es: "Hola {name}:\n\nHe encontrado el problema: [qué pasaba]. Ya lo he corregido, pero falta un paso por tu parte: por favor, [lo que tiene que hacer].\n\nDespués debería funcionar. Si no, responde a este mensaje y lo vemos juntos.\n\nUn saludo,\n{me}",
        en: "Hi {name},\n\nI found the problem: [what was wrong]. I've corrected it, but there is one step left for you: please [what they need to do].\n\nAfter that it should work. If it doesn't, reply to this message and we'll look at it together.\n\nBest regards,\n{me}" } },
    { id: "workaround", label: { es: "Solución temporal y seguimiento", en: "Workaround and follow-up" },
      text: {
        es: "Hola {name}:\n\nDe momento ya puedes trabajar: [qué has hecho para que funcione]. El problema de fondo es que [qué pasaba], y lo seguimos con [quién] para que no vuelva a pasar.\n\nNo tienes que hacer nada. Te escribo cuando esté cerrado del todo.\n\nUn saludo,\n{me}",
        en: "Hi {name},\n\nYou can work again for now: [what you did to get it working]. The underlying problem is that [what was wrong], and we are following it up with [who] so it doesn't happen again.\n\nYou don't need to do anything. I'll write again when it is fully closed.\n\nBest regards,\n{me}" } },
    { id: "noRepro", label: { es: "No se ha podido reproducir", en: "Could not reproduce" },
      text: {
        es: "Hola {name}:\n\nHe revisado [qué has revisado] y ahora mismo todo funciona: no he podido reproducir el problema.\n\nSi vuelve a pasar, por favor anota la hora y el mensaje exacto y responde a este mensaje; así lo vemos en el momento.\n\nUn saludo,\n{me}",
        en: "Hi {name},\n\nI checked [what you checked] and everything works right now: I could not reproduce the problem.\n\nIf it happens again, please write down the time and the exact message and reply to this message, so we can look at it while it happens.\n\nBest regards,\n{me}" } },
  ];
  // a template with the requester's first name and the technician's name filled in; the [gaps] stay for the user
  function template(id, lang, names) {
    const tp = TEMPLATES.find((x) => x.id === id);
    if (!tp) return "";
    const n = names || {};
    return t(tp.text, lang).replace("{name}", n.name || (lang === "es" ? "[nombre]" : "[name]")).replace("{me}", n.me || (lang === "es" ? "[tu nombre]" : "[your name]"));
  }

  /* ---------- the communication result: a separate mark that never changes the verdict or the ticket score.
     Bonus (shown apart from the score, 0-10): user note 5/5 +5, 4/5 +3, 3/5 +1; at least one useful question and no bad one +3;
     the requester confirmed it works +2. Remarks: no user note, the password asked for, other bad questions. */
  function evaluate(sum, check) {
    const s = sum || { asked: 0, useful: 0, bad: 0, password: false, confirmed: null };
    const credits = [];
    const remarks = [];
    let bonus = 0;
    if (check && !check.empty) {
      const b = check.score === 5 ? 5 : check.score === 4 ? 3 : check.score === 3 ? 1 : 0;
      if (b) credits.push({ id: "note", points: b });
      bonus += b;
    } else remarks.push({ id: "no-note" });
    if (s.useful >= 1 && s.bad === 0) { credits.push({ id: "questions", points: 3, n: s.useful }); bonus += 3; }
    if (s.confirmed === "ok") { credits.push({ id: "confirmed", points: 2 }); bonus += 2; }
    if (s.password) remarks.push({ id: "password" });
    const otherBad = s.bad - (s.password ? 1 : 0);
    if (otherBad > 0) remarks.push({ id: "bad", n: otherBad });
    return { bonus, credits, remarks, userNote: check && !check.empty ? check.score : null };
  }

  return { COST_MS, KINDS, NOTE_MIN, NOTE_MAX, RULES, JARGON, TEMPLATES, LABELS, t, fold, who, questionsOf, find, isFixed, isTempted, confirmState,
    canContact, questions, ask, exchange, conversation, clues, questionText, summary, jargonIn, internalIn, placeholdersIn, checkUserNote, describe,
    template, evaluate };
});
