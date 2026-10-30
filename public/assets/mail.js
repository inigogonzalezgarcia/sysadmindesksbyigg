/* SysAdmin Desks by IGG - the mailbox around the mail exercises (v0.9): folders (Inbox, Starred, Sent, Archive, Spam), moving,
   starring, archiving, reporting as spam or phishing, replying (scripted templates or free text) and writing to a fictional internal
   contact. The messages and their exercises are in growth.js (MAIL); this keeps what the user did with them.
   Pure logic, no DOM: the app keeps the state in this browser (sd.mailbox) and the Node tests use the same code.

   State: { v, at: {mailId: "inbox" | "archive" | "spam"}, star: [mailId], sent: [item], seq }
   A sent item: { id: "s-<n>", kind: "reply" | "new", re: mailId | null, to, toName, subject, body, at, template, flags: ["phish-reply" | "password" | "secret"] } */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./growth.js"));
  else root.SDMail = factory(root.SDGrowth);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";

  const FORMAT = 1;
  const FOLDERS = ["inbox", "starred", "sent", "archive", "spam"];
  const PLACES = ["inbox", "archive", "spam"];   // where a message can be; "starred" and "sent" are views
  const NAMES = {
    inbox: { en: "Inbox", es: "Bandeja de entrada" }, starred: { en: "Starred", es: "Destacados" }, sent: { en: "Sent", es: "Enviados" },
    archive: { en: "Archive", es: "Archivo" }, spam: { en: "Spam", es: "Spam" },
  };
  const LIMITS = { sent: 60, subject: 140, body: 3000, bodyMin: 10, subjectMin: 3 };
  const t = (v, lang) => (v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || "");
  const clean = (s, n) => String(s == null ? "" : s).replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, n);

  function empty() { return { v: FORMAT, at: {}, star: [], sent: [], seq: 0 }; }
  // a state saved by the app (or anything else): always a usable state, with only known messages
  function normalise(st, MAIL) {
    const mail = MAIL || G.MAIL;
    const ids = new Set(mail.map((m) => m.id));
    const s = empty();
    if (!st || typeof st !== "object") return s;
    if (st.at && typeof st.at === "object") Object.keys(st.at).forEach((id) => { if (ids.has(id) && PLACES.includes(st.at[id]) && st.at[id] !== "inbox") s.at[id] = st.at[id]; });
    if (Array.isArray(st.star)) s.star = Array.from(new Set(st.star.filter((id) => ids.has(id))));
    if (Array.isArray(st.sent)) s.sent = st.sent.filter((x) => x && typeof x.id === "string" && typeof x.body === "string").slice(-LIMITS.sent);
    s.seq = Math.max(Number(st.seq) || 0, s.sent.length);
    return s;
  }
  function folderOf(st, id) { return (st && st.at && st.at[id]) || "inbox"; }
  function starred(st, id) { return Boolean(st && st.star && st.star.includes(id)); }
  const when = (m) => m.day + " " + m.time;
  // the messages in a folder, newest first; "sent" returns sent items, newest first
  function list(st, folder, MAIL) {
    const mail = MAIL || G.MAIL;
    if (folder === "sent") return st.sent.slice().sort((a, b) => b.at - a.at);
    const pick = folder === "starred" ? (m) => starred(st, m.id) && folderOf(st, m.id) !== "spam" : (m) => folderOf(st, m.id) === folder;
    return mail.filter(pick).slice().sort((a, b) => (when(a) < when(b) ? 1 : when(a) > when(b) ? -1 : 0));
  }
  // {folder: n}: messages in each folder, and unread ones in the inbox (read: [ids opened])
  function counts(st, read, MAIL) {
    const r = new Set(read || []);
    const out = {};
    FOLDERS.forEach((f) => { out[f] = list(st, f, MAIL).length; });
    out.unread = list(st, "inbox", MAIL).filter((m) => !r.has(m.id)).length;
    return out;
  }

  /* ---------- moving and starring: each returns a new state */
  function move(st, id, folder) {
    if (!PLACES.includes(folder)) return st;
    const s = Object.assign({}, st, { at: Object.assign({}, st.at) });
    if (folder === "inbox") delete s.at[id]; else s.at[id] = folder;
    return s;
  }
  function toggleStar(st, id) {
    const has = starred(st, id);
    return Object.assign({}, st, { star: has ? st.star.filter((x) => x !== id) : st.star.concat(id) });
  }
  /* Report as spam or phishing: the message goes to Spam and the exercise is answered with its "report" option (the right answer
     for phishing, partly right for a genuine message). Returns {state, answer, result}. */
  function report(st, msg) {
    const g = G.grade(msg, "report");
    return { state: move(st, msg.id, "spam"), answer: g ? "report" : null, result: g ? g.result : null };
  }
  // out of Spam: back to the inbox (the exercise answer stays as it was; it can be retried on the message)
  function notSpam(st, id) { return move(st, id, "inbox"); }

  /* ---------- writing */
  const RISKY = ["phishing", "impersonation"];
  // what a text should not carry: a password or a secret (a password reset by email is never done)
  function lint(text) {
    const s = String(text || "");
    const flags = [];
    if (/(contrase(ñ|n)a|password|passwd|pwd)\s*(temporal|nueva|new|temporary)?\s*(es|is|:|=)\s*\S{4,}/i.test(s)) flags.push("password");
    if (/\b(c[oó]digo (de )?(verificaci[oó]n|mfa|de un solo uso)|verification code|one-time code|otp)\b\s*(es|is|:)?\s*\d{4,}/i.test(s)) flags.push("secret");
    return flags;
  }
  function firstName(msg, lang) { return t(msg.from.name, lang).replace(/\s*\(.*\)$/, "").split(/\s+/)[0]; }
  /* Scripted replies. ctx: {ticket: "INC-20452" | null, prio, me}. A request linked to a ticket gets acknowledgement, a question and a
     closing; any message gets a short thank-you. [gaps] must be replaced before sending. */
  function templates(msg, lang, ctx) {
    const c = ctx || {};
    const n = firstName(msg, lang);
    const me = c.me || (lang === "es" ? "Soporte IT" : "IT support");
    const out = [];
    if (c.ticket) {
      out.push({ id: "ack", label: { en: "Acknowledge with the ticket", es: "Acuse con el ticket" },
        text: { en: `Hi ${n},\n\nI have logged your request as ${c.ticket}${c.prio ? " (" + c.prio + ")" : ""} and I am on it. I will write to you as soon as I have news.\n\n${me}`,
          es: `Hola, ${n}:\n\nHe registrado tu petición como ${c.ticket}${c.prio ? " (" + c.prio + ")" : ""} y ya estoy con ella. Te escribo en cuanto tenga novedades.\n\n${me}` } });
      out.push({ id: "info", label: { en: "Ask for one detail", es: "Pedir un dato" },
        text: { en: `Hi ${n},\n\nTo move on with ${c.ticket} I need one detail: [what you need]. You do not need to send any password.\n\nThanks,\n${me}`,
          es: `Hola, ${n}:\n\nPara avanzar con ${c.ticket} necesito un dato: [qué necesitas]. No hace falta que me envíes ninguna contraseña.\n\nGracias,\n${me}` } });
      out.push({ id: "done", label: { en: "Confirm it is solved", es: "Confirmar que está resuelto" },
        text: { en: `Hi ${n},\n\n${c.ticket} is solved: [what was wrong, in plain words]. If it happens again, just reply to this email.\n\n${me}`,
          es: `Hola, ${n}:\n\n${c.ticket} está resuelto: [qué pasaba, en palabras sencillas]. Si vuelve a pasar, contesta a este correo.\n\n${me}` } });
    }
    out.push({ id: "thanks", label: { en: "Thank you", es: "Gracias" },
      text: { en: `Hi ${n},\n\nThanks for letting us know. [one line on what happens next]\n\n${me}`, es: `Hola, ${n}:\n\nGracias por avisar. [una línea con lo que pasa ahora]\n\n${me}` } });
    return out.map((x) => ({ id: x.id, label: t(x.label, lang), text: t(x.text, lang) }));
  }
  function hasGap(text) { return /\[[^\]\n]{1,80}\]/.test(String(text || "")); }
  function nextId(st) { return "s-" + (st.seq + 1); }

  /* Reply to a message. A reply goes to the Reply-To address, as a mail client does: on phishing that is the attacker. Returns
     {ok, error, state, item}; errors: "empty" (under 10 characters), "gaps" ([…] left in the text). flags on the item: "phish-reply"
     (replying to phishing or impersonation is bad practice), "password" / "secret" (credentials in the text). */
  function reply(st, msg, input, lang) {
    const i = input || {};
    const body = clean(i.text, LIMITS.body);
    if (body.length < LIMITS.bodyMin) return { ok: false, error: "empty" };
    if (hasGap(body)) return { ok: false, error: "gaps" };
    const flags = lint(body);
    if (RISKY.includes(msg.kind)) flags.unshift("phish-reply");
    const item = { id: nextId(st), kind: "reply", re: msg.id, to: msg.headers.replyTo || msg.from.address, toName: t(msg.from.name, lang || "en"),
      subject: (/^(re|rv):/i.test(t(msg.subject, lang)) ? "" : (lang === "es" ? "RE: " : "Re: ")) + t(msg.subject, lang), body,
      at: Number.isFinite(i.now) ? i.now : Date.now(), template: typeof i.template === "string" ? i.template : null, flags };
    return { ok: true, state: Object.assign({}, st, { sent: st.sent.concat(item).slice(-LIMITS.sent), seq: st.seq + 1 }), item };
  }

  /* ---------- writing to an internal contact (fictional): the team mailboxes and the people in the directory */
  const TEAMS = [
    { id: "redes", address: "redes@contoso.com", name: { en: "Network and Communications", es: "Redes y Comunicaciones" } },
    { id: "it-operations", address: "it-operations@contoso.com", name: { en: "IT Operations", es: "Operaciones IT" } },
    { id: "cambios", address: "cambios@contoso.com", name: { en: "Change Management", es: "Gestión del Cambio" } },
    { id: "seguridad", address: "seguridad@contoso.com", name: { en: "Information Security", es: "Seguridad de la Información" } },
    { id: "compras", address: "compras@contoso.com", name: { en: "Purchasing", es: "Compras" } },
  ];
  // people: [{sam, name, dept}] from the directory (service and admin accounts are left out)
  function contacts(people, lang) {
    const ppl = (people || []).filter((p) => p && p.sam && !/^(svc-|it\.admin$)/.test(p.sam))
      .map((p) => ({ id: p.sam, address: p.sam + "@contoso.com", name: p.name, sub: p.dept || "" }));
    return TEAMS.map((x) => ({ id: x.id, address: x.address, name: t(x.name, lang), sub: lang === "es" ? "Buzón de equipo" : "Team mailbox" })).concat(ppl);
  }
  // errors: "to" (not a contact), "subject" (under 3 characters), "empty" (under 10), "gaps"
  function compose(st, input, list) {
    const i = input || {};
    const c = (list || []).find((x) => x.id === i.to || x.address === i.to);
    const errors = [];
    const subject = clean(i.subject, LIMITS.subject).replace(/\n/g, " ");
    const body = clean(i.body, LIMITS.body);
    if (!c) errors.push("to");
    if (subject.length < LIMITS.subjectMin) errors.push("subject");
    if (body.length < LIMITS.bodyMin) errors.push("empty");
    else if (hasGap(body)) errors.push("gaps");
    if (errors.length) return { ok: false, errors };
    const item = { id: nextId(st), kind: "new", re: null, to: c.address, toName: c.name, subject, body, at: Number.isFinite(i.now) ? i.now : Date.now(), template: null, flags: lint(body) };
    return { ok: true, errors: [], state: Object.assign({}, st, { sent: st.sent.concat(item).slice(-LIMITS.sent), seq: st.seq + 1 }), item };
  }
  function sentItem(st, id) { return (st.sent || []).find((x) => x.id === id) || null; }
  // replies already sent to a message
  function repliesTo(st, mailId) { return (st.sent || []).filter((x) => x.re === mailId); }

  return { FORMAT, FOLDERS, PLACES, NAMES, LIMITS, empty, normalise, folderOf, starred, list, counts, move, toggleStar, report, notSpam,
    lint, templates, hasGap, reply, TEAMS, contacts, compose, sentItem, repliesTo };
});
