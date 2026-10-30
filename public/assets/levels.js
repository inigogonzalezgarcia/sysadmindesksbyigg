/* SysAdmin Desks by IGG - levels, weekly goals, area badges and the labs' full shift (v0.9b). Pure logic, no DOM: the app (app.js)
   keeps the stores in the browser (sd.level, sd.weekly, sd.shifts) and the Node tests (tests/levels.test.js) use the same code.
   - Points and levels: the best result of every ticket, 10 per lab task, the best communication bonus of every ticket, the rewards of
     the weekly goals and of the full shifts. Free tickets are never in any of these, so they never count.
   - Weekly goals: three goals out of a pool, chosen from the ISO week (the same three for everyone that week), each with a reward
     credited once.
   - Badges by area (mastery), documentation, goal cycles and full shifts, on top of growth.js's badges.
   - The full shift: at the end of each lab, four real tickets of its area (or the nearest ones) in a row against a shift timer. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./growth.js"), require("./profile.js"), require("./labs.js"), require("./prefs.js"));
  else root.SDLevels = factory(root.SDGrowth, root.SDProfile, root.SDLabs, root.SDPrefs);
})(typeof self !== "undefined" ? self : this, function (G, PF, Lb, Pf) {
  "use strict";

  const t = G.t;
  const FORMAT = 1;
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  const closesOf = (activity) => (Array.isArray(activity) ? activity : []).filter((a) => a && a.type === "ticket");

  /* ---------- points */
  const LAB_TASK_POINTS = 10;
  /* input: { desks: [desk ids of this version], progress: {deskId: {points}}, activity, labs (sd.labs), weekly (sd.weekly), shifts (sd.shifts) }
     tickets: the best result of each desk (sd.progress, replays only count if they beat it); labs: 10 per task done; comms: the best
     communication bonus (0-10) of each desk; goals: the weekly goals' rewards; shifts: one reward per lab whose full shift was finished. */
  function points(input) {
    const i = input || {};
    const known = new Set(i.desks || Object.keys(PF.DESK_AREA));
    const progress = isObj(i.progress) ? i.progress : {};
    const tickets = Object.keys(progress).filter((d) => known.has(d)).reduce((n, d) => n + Math.max(0, Math.min(100, Number(progress[d].points) || 0)), 0);
    const labs = Lb.summary(i.labs).tasks * LAB_TASK_POINTS;
    const bestBonus = {};
    closesOf(i.activity).forEach((c) => { if (known.has(c.id)) bestBonus[c.id] = Math.max(bestBonus[c.id] || 0, Math.max(0, Math.min(10, Number(c.bonus) || 0))); });
    const comms = Object.values(bestBonus).reduce((a, b) => a + b, 0);
    const goals = goalPoints(i.weekly);
    const shifts = shiftPoints(i.shifts);
    return { tickets, labs, comms, goals, shifts, total: tickets + labs + comms + goals + shifts };
  }

  /* ---------- levels: from the total points (min is the first point of the level) */
  const LEVELS = [
    { id: "intern", min: 0, short: { en: "Intern", es: "Becario/a" }, name: { en: "Support intern", es: "Becario/a de soporte" } },
    { id: "l1", min: 200, short: { en: "L1", es: "N1" }, name: { en: "L1 technician", es: "Técnico/a N1" } },
    { id: "l1s", min: 600, short: { en: "L1 sr", es: "N1 sr" }, name: { en: "Senior L1 technician", es: "Técnico/a N1 sénior" } },
    { id: "l2", min: 1200, short: { en: "L2", es: "N2" }, name: { en: "L2 technician", es: "Técnico/a N2" } },
    { id: "sys", min: 1900, short: { en: "Sysadmin", es: "Sysadmin" }, name: { en: "Systems administrator", es: "Administrador/a de sistemas" } },
    { id: "infra", min: 2700, short: { en: "Infra", es: "Infra" }, name: { en: "Infrastructure engineer", es: "Ingeniero/a de infraestructura" } },
  ];
  // {index, id, name, short, min, total, next: {id, name, min} | null, into (points into this level), span (points to the next), toNext, pct}
  function level(total, lang) {
    const n = Math.max(0, Math.floor(Number(total) || 0));
    let index = 0;
    LEVELS.forEach((l, k) => { if (n >= l.min) index = k; });
    const cur = LEVELS[index];
    const nx = LEVELS[index + 1] || null;
    const span = nx ? nx.min - cur.min : 0;
    const into = n - cur.min;
    return { index, id: cur.id, name: t(cur.name, lang), short: t(cur.short, lang), min: cur.min, total: n,
      next: nx ? { id: nx.id, name: t(nx.name, lang), min: nx.min } : null, into, span, toNext: nx ? nx.min - n : 0, pct: nx ? Math.floor((100 * into) / span) : 100 };
  }
  // seen: the level id last shown (sd.level). Returns {up, from, to, seen}: up only when the level is higher than the one seen;
  // without a seen level (first time) nothing is celebrated, the current one is just remembered.
  function levelUp(seen, total) {
    const now = level(total);
    const known = LEVELS.findIndex((l) => l.id === seen);
    if (known < 0) return { up: false, from: null, to: now.id, seen: now.id };
    return { up: now.index > known, from: seen, to: now.id, seen: now.index > known ? now.id : seen };
  }

  /* ---------- the close counters: clean (Resolved the first time, no remarks), with remarks (Resolved with remarks), false closures
     (attempts to close a ticket that was not fixed: activity {type: "attempt"}) */
  function closeCounts(activity) {
    const a = Array.isArray(activity) ? activity : [];
    const c = closesOf(a);
    return { clean: c.filter((x) => x.level === "resolved").length, remarks: c.filter((x) => x.level === "observations").length,
      false: a.filter((x) => x && x.type === "attempt").length, total: c.length };
  }

  /* ---------- weekly goals */
  const area = (id) => PF.DESK_AREA[id] || null;
  const distinct = (xs) => new Set(xs.map((x) => x.id)).size;
  /* each goal: {id, points (reward), target, label {en, es}, count(week)} where week = {closes, mail, labs, levels}: this ISO week's
     ticket closes, mail answers and lab tasks (activity {type: "lab"}). */
  const POOL = [
    { id: "net-2", points: 40, target: 2, label: { en: "Resolve 2 network tickets", es: "Resuelve 2 tickets de red" },
      count: (w) => distinct(w.closes.filter((c) => area(c.id) === "network")) },
    { id: "note-5", points: 30, target: 1, label: { en: "Close 1 ticket with a 5/5 note to the user", es: "Cierra 1 ticket con la nota al usuario en 5/5" },
      count: (w) => w.closes.filter((c) => c.userNote === 5).length },
    { id: "lab-3", points: 30, target: 3, label: { en: "Complete 3 lab tasks", es: "Completa 3 tareas de laboratorio" },
      count: (w) => w.labs.length },
    { id: "no-hints", points: 30, target: 1, label: { en: "Resolve 1 ticket without hints", es: "Resuelve 1 ticket sin pistas" },
      count: (w) => w.closes.filter((c) => c.hints === 0).length },
    { id: "phish", points: 25, target: 1, label: { en: "Report a phishing email", es: "Reporta un correo de phishing" },
      count: (w) => w.mail.filter((m) => m.result === "correct" && (G.mail(m.id) || {}).kind === "phishing").length },
    { id: "rma", points: 40, target: 1, label: { en: "Close an RMA from start to finish", es: "Cierra un RMA de principio a fin" },
      count: (w) => w.closes.filter((c) => c.id === "laptop-rma" || c.id === "net-psu-rma").length },
    { id: "sla-3", points: 35, target: 3, label: { en: "Close 3 different tickets within the SLA", es: "Cierra 3 tickets distintos dentro del SLA" },
      count: (w) => distinct(w.closes.filter((c) => c.slaOk)) },
    { id: "clean", points: 30, target: 1, label: { en: "Close 1 ticket clean: resolved the first time, no observations", es: "Cierra 1 ticket limpio: resuelto a la primera y sin observaciones" },
      count: (w) => w.closes.filter((c) => c.level === "resolved").length },
    { id: "level-2", points: 30, target: 1, label: { en: "Resolve 1 second-line (level 2) ticket", es: "Resuelve 1 ticket de segunda línea (nivel 2)" },
      count: (w) => w.closes.filter((c) => (w.levels[c.id] || 1) >= 2).length },
    { id: "mail-3", points: 25, target: 3, label: { en: "Answer 3 different mail exercises right", es: "Responde bien 3 ejercicios de correo distintos" },
      count: (w) => distinct(w.mail.filter((m) => m.result === "correct")) },
    { id: "server", points: 35, target: 1, label: { en: "Resolve 1 Linux, backup or SQL Server ticket", es: "Resuelve 1 ticket de Linux, copias o SQL Server" },
      count: (w) => w.closes.filter((c) => area(c.id) === "linux" || area(c.id) === "data").length },
    { id: "m365", points: 30, target: 1, label: { en: "Resolve 1 Microsoft 365 ticket", es: "Resuelve 1 ticket de Microsoft 365" },
      count: (w) => w.closes.filter((c) => area(c.id) === "m365").length },
  ];
  const goal = (id) => POOL.find((g) => g.id === id) || null;
  const WEEKLY = 3;
  // FNV-1a of the week key, then a small LCG: the same week always draws the same three goals, in the same order
  function seedOf(s) {
    let h = 0x811c9dc5;
    for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function goalsFor(weekKey) {
    let x = seedOf(String(weekKey || ""));
    const ids = POOL.map((g) => g.id);
    const out = [];
    while (out.length < WEEKLY) {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      const pick = ids.splice(x % ids.length, 1)[0];
      out.push(pick);
    }
    return out;
  }
  // the ISO week of an instant in a time zone (the zone in Preferences): a Sunday 23:30 UTC is already Monday in Madrid
  function weekAt(ms, tz) { return G.isoWeek(Pf.dayIn(ms, tz)); }
  function weekData(activity, weekKey, levels) {
    const a = (Array.isArray(activity) ? activity : []).filter((x) => x && G.isoWeek(x.day) === weekKey);
    return { closes: a.filter((x) => x.type === "ticket"), mail: a.filter((x) => x.type === "mail"), labs: a.filter((x) => x.type === "lab"), levels: levels || {} };
  }
  /* the goals of a week with their progress: [{id, label, target, have, done, points, claimed (day) | null}] */
  function goalProgress(weekKey, activity, opts) {
    const o = opts || {};
    const st = normaliseWeekly(o.weekly);
    const rec = st.weeks[weekKey];
    const ids = rec ? rec.goals : goalsFor(weekKey);
    const w = weekData(activity, weekKey, o.levels);
    return ids.map((id) => {
      const g = goal(id);
      const have = Math.min(g.target, g.count(w));
      return { id, label: t(g.label, o.lang), target: g.target, have, done: have >= g.target, points: g.points, claimed: rec && rec.done[id] ? rec.done[id] : null };
    });
  }
  // sd.weekly: {v, weeks: {"2026-W44": {goals: [3 ids], done: {goalId: day}}}}; unknown goals and malformed weeks are dropped
  function normaliseWeekly(store) {
    const out = { v: FORMAT, weeks: {} };
    if (!isObj(store) || !isObj(store.weeks)) return out;
    Object.entries(store.weeks).forEach(([k, w]) => {
      if (!/^\d{4}-W\d{2}$/.test(k) || !isObj(w) || !Array.isArray(w.goals)) return;
      const goals = Array.from(new Set(w.goals.filter((id) => goal(id)))).slice(0, WEEKLY);
      if (!goals.length) return;
      const done = {};
      if (isObj(w.done)) goals.forEach((id) => { if (typeof w.done[id] === "string") done[id] = w.done[id]; });
      out.weeks[k] = { goals, done };
    });
    return out;
  }
  /* credits the goals of the week that are met and not yet credited. Idempotent: calling it again changes nothing.
     Returns {store, fresh: [goal ids credited now], points (of the fresh ones)}. */
  function claim(store, weekKey, activity, opts) {
    const o = opts || {};
    const st = normaliseWeekly(store);
    if (!st.weeks[weekKey]) st.weeks[weekKey] = { goals: goalsFor(weekKey), done: {} };
    const rec = st.weeks[weekKey];
    const w = weekData(activity, weekKey, o.levels);
    const fresh = rec.goals.filter((id) => !rec.done[id] && goal(id).count(w) >= goal(id).target);
    fresh.forEach((id) => { rec.done[id] = o.day || weekKey; });
    return { store: st, fresh, points: fresh.reduce((n, id) => n + goal(id).points, 0) };
  }
  function goalPoints(store) {
    const st = normaliseWeekly(store);
    return Object.values(st.weeks).reduce((n, w) => n + Object.keys(w.done).reduce((m, id) => m + goal(id).points, 0), 0);
  }
  // weeks with every goal done
  function fullWeeks(store) {
    const st = normaliseWeekly(store);
    return Object.values(st.weeks).filter((w) => w.goals.length === WEEKLY && w.goals.every((id) => w.done[id])).length;
  }
  // past weeks, newest first: [{week, done, total, points, full}]
  function history(store, currentWeek) {
    const st = normaliseWeekly(store);
    return Object.keys(st.weeks).filter((k) => k !== currentWeek).sort().reverse().map((k) => {
      const w = st.weeks[k];
      const done = w.goals.filter((id) => w.done[id]);
      return { week: k, goals: w.goals, done: done.length, total: w.goals.length, points: done.reduce((n, id) => n + goal(id).points, 0), full: done.length === w.goals.length };
    });
  }

  /* ---------- the full shift (Turno completo) at the end of each lab */
  const SHIFT = { size: 4, points: 75 };
  // the areas a lab's shift draws from, nearest first
  const NEAR = { ad: ["ad", "m365", "endpoint", "windows"], network: ["network", "hardware", "windows"], windows: ["windows", "endpoint", "vdi", "ad"],
    m365: ["m365", "ad", "endpoint"], linux: ["linux", "data", "network"] };
  /* the shift's tickets, always the same for the same input: the lab's areas in NEAR order, inside each area the desks by level (then
     the order given), skipping the desks that are not available (not in this version, or in progress in the queue).
     opts: {desks: [ids in the queue's order], levels: {id: level}, unavailable: [ids]}. Returns up to SHIFT.size ids. */
  function pickShift(labId, opts) {
    const o = opts || {};
    const order = (o.desks || Object.keys(PF.DESK_AREA)).filter((d) => PF.DESK_AREA[d]);
    const skip = new Set(o.unavailable || []);
    const lv = o.levels || {};
    const out = [];
    (NEAR[labId] || []).forEach((ar) => {
      order.filter((d) => PF.DESK_AREA[d] === ar && !skip.has(d)).map((d, k) => ({ d, k, l: lv[d] || 1 }))
        .sort((a, b) => a.l - b.l || a.k - b.k).forEach((x) => { if (out.length < SHIFT.size && !out.includes(x.d)) out.push(x.d); });
    });
    return out;
  }
  /* sd.shifts: {v, active: {lab, desks, started (ms), results: [{id, level, points, hints, at}]} | null,
                 done: {labId: {day, ms, results}} (the first finished shift of each lab), log: [{lab, started, finished, results}] (last 20)} */
  function normaliseShifts(store, knownDesks) {
    const out = { v: FORMAT, active: null, done: {}, log: [] };
    if (!isObj(store) || store.v !== FORMAT) return out;
    const known = knownDesks ? new Set(knownDesks) : null;
    const okDesk = (d) => typeof d === "string" && PF.DESK_AREA[d] && (!known || known.has(d));
    const res = (list) => (Array.isArray(list) ? list : []).filter((r) => isObj(r) && okDesk(r.id)).map((r) => ({ id: r.id, level: r.level === "observations" ? "observations" : "resolved",
      points: Math.max(0, Math.min(100, Number(r.points) || 0)), hints: Math.max(0, Number(r.hints) || 0), at: Number(r.at) || 0 }));
    const a = store.active;
    if (isObj(a) && Lb.lab(a.lab) && Array.isArray(a.desks) && a.desks.length && a.desks.every(okDesk) && Number.isFinite(a.started)) {
      const results = res(a.results).filter((r, k) => a.desks[k] === r.id);
      if (results.length < a.desks.length) out.active = { lab: a.lab, desks: a.desks.slice(0, SHIFT.size), started: a.started, results };
    }
    if (isObj(store.done)) Object.entries(store.done).forEach(([lab, d]) => {
      if (Lb.lab(lab) && isObj(d) && typeof d.day === "string") out.done[lab] = { day: d.day, ms: Math.max(0, Number(d.ms) || 0), results: res(d.results) };
    });
    if (Array.isArray(store.log)) out.log = store.log.filter((x) => isObj(x) && Lb.lab(x.lab) && Number.isFinite(x.started) && Number.isFinite(x.finished))
      .slice(-20).map((x) => ({ lab: x.lab, started: x.started, finished: x.finished, results: res(x.results) }));
    return out;
  }
  // a lab's shift can start when the lab's tasks are all done and no other shift is running
  function canStart(store, labs, labId) {
    const st = normaliseShifts(store);
    if (!Lb.lab(labId)) return { ok: false, error: "lab" };
    if (!Lb.progressOf(labs, labId).complete) return { ok: false, error: "locked" };
    if (st.active) return { ok: false, error: st.active.lab === labId ? "running" : "busy", lab: st.active.lab };
    return { ok: true };
  }
  function start(store, labId, desks, now, labs) {
    const st = normaliseShifts(store);
    const can = canStart(st, labs, labId);
    if (!can.ok) return Object.assign({ store: st }, can);
    if (!Array.isArray(desks) || desks.length < SHIFT.size) return { store: st, ok: false, error: "desks" };
    st.active = { lab: labId, desks: desks.slice(0, SHIFT.size), started: now, results: [] };
    return { store: st, ok: true };
  }
  function current(store) {
    const a = normaliseShifts(store).active;
    return a ? a.desks[a.results.length] || null : null;
  }
  /* a ticket closed fixed: it counts for the shift only if it is the shift's next ticket and it was closed after the shift started.
     close: {id, level, points, hints, at (ms)}, day: the calendar day. Returns {store, counted, finished, firstTime, entry}. */
  function record(store, close, day) {
    const st = normaliseShifts(store);
    const a = st.active;
    const out = { store: st, counted: false, finished: false, firstTime: false, entry: null };
    if (!a || !close || close.level === "unresolved" || close.id !== a.desks[a.results.length] || !(Number(close.at) >= a.started)) return out;
    a.results.push({ id: close.id, level: close.level === "observations" ? "observations" : "resolved", points: Math.max(0, Math.min(100, Number(close.points) || 0)),
      hints: Math.max(0, Number(close.hints) || 0), at: Number(close.at) });
    out.counted = true;
    if (a.results.length === a.desks.length) {
      const entry = { lab: a.lab, started: a.started, finished: Number(close.at), results: a.results };
      st.log = st.log.concat([entry]).slice(-20);
      if (!st.done[a.lab]) { st.done[a.lab] = { day: day || "", ms: entry.finished - entry.started, results: a.results }; out.firstTime = true; }
      st.active = null;
      out.finished = true;
      out.entry = entry;
    }
    return out;
  }
  function abandon(store) { const st = normaliseShifts(store); st.active = null; return st; }
  function elapsed(active, now) { return active ? Math.max(0, now - active.started) : 0; }
  // the summary of a finished shift (or of the part done): {tickets, minutes, avg, clean, remarks, hints}
  function summary(entry, now) {
    const r = (entry && entry.results) || [];
    const end = entry && entry.finished ? entry.finished : now;
    return { tickets: r.length, minutes: entry ? Math.max(0, Math.round((end - entry.started) / 60000)) : 0,
      avg: r.length ? Math.round(r.reduce((n, x) => n + x.points, 0) / r.length) : null,
      clean: r.filter((x) => x.level === "resolved").length, remarks: r.filter((x) => x.level === "observations").length, hints: r.reduce((n, x) => n + x.hints, 0) };
  }
  function shiftPoints(store) { return Object.keys(normaliseShifts(store).done).length * SHIFT.points; }

  /* ---------- more badges (v0.9b), awarded with growth.js's ones. facts: G.facts(...) plus {points: {deskId: best}, notesComplete
     (desks closed with a complete note), fullWeeks, shifts: [lab ids with a finished shift]} */
  const MASTERY = {
    ad: { icon: "◫", en: "Master keyring", es: "Llavero maestro" }, windows: { icon: "▭", en: "Spotless desktop", es: "Puesto impecable" },
    m365: { icon: "✉", en: "Tenant in order", es: "Inquilino en orden" }, endpoint: { icon: "⛨", en: "Managed fleet", es: "Flota gestionada" },
    linux: { icon: "$", en: "Calm root", es: "Root sin sustos" }, vdi: { icon: "▣", en: "Smooth session", es: "Sesión fluida" },
    data: { icon: "⛁", en: "Safe data", es: "Datos a salvo" }, network: { icon: "⌗", en: "Loop-free network", es: "Red sin bucles" },
    hardware: { icon: "⇪", en: "Workshop up to date", es: "Taller al día" },
  };
  const MASTERY_MIN = 90;
  const deskOfArea = (f, ar) => (f.desks || []).filter((d) => PF.DESK_AREA[d] === ar);
  const SHIFT_NAMES = { ad: { en: "Directory shift", es: "Turno de directorio" }, network: { en: "Network shift", es: "Turno de red" },
    windows: { en: "Windows shift", es: "Turno de Windows" }, m365: { en: "Microsoft 365 shift", es: "Turno de Microsoft 365" }, linux: { en: "Linux shift", es: "Turno de Linux" } };
  const AREA_NAME = (ar) => ({ ad: { en: "Active Directory", es: "Active Directory" }, windows: { en: "Windows", es: "Windows" }, m365: { en: "Microsoft 365", es: "Microsoft 365" },
    endpoint: { en: "Intune and BitLocker", es: "Intune y BitLocker" }, linux: { en: "Linux", es: "Linux" }, vdi: { en: "Citrix and VDI", es: "Citrix y VDI" },
    data: { en: "backup and SQL Server", es: "copias y SQL Server" }, network: { en: "network", es: "red" }, hardware: { en: "hardware and RMA", es: "hardware y RMA" } })[ar];
  const EXTRA = [].concat(
    Object.entries(MASTERY).map(([ar, m]) => ({ id: "master-" + ar, group: "area", area: ar, icon: m.icon, name: { en: m.en, es: m.es },
      rule: { en: `Resolve every ${AREA_NAME(ar).en} ticket with ${MASTERY_MIN} or more.`, es: `Resuelve todos los tickets de ${AREA_NAME(ar).es} con ${MASTERY_MIN} o más.` },
      test: (f) => { const ds = deskOfArea(f, ar); return ds.length > 0 && ds.every((d) => (f.points[d] || 0) >= MASTERY_MIN); } })),
    [
      { id: "notes-5", group: "docs", icon: "✎", name: { en: "By-the-book notes", es: "Notas de manual" },
        rule: { en: "Close five different tickets with a complete work note.", es: "Cierra cinco tickets distintos con la nota de trabajo completa." }, test: (f) => f.notesComplete >= 5 },
      { id: "kb-10", group: "docs", icon: "▥", name: { en: "Encyclopaedia", es: "Enciclopedia" },
        rule: { en: "Have ten articles in your knowledge base.", es: "Ten diez artículos en tu base de conocimiento." }, test: (f) => f.kb >= 10 },
      { id: "week-1", group: "goals", icon: "◔", name: { en: "Rounded week", es: "Semana redonda" },
        rule: { en: "Complete all three weekly goals in a week.", es: "Completa los tres objetivos de una semana." }, test: (f) => f.fullWeeks >= 1 },
      { id: "week-4", group: "goals", icon: "◑", name: { en: "A month on target", es: "Un mes en el objetivo" },
        rule: { en: "Complete every weekly goal in 4 weeks.", es: "Completa todos los objetivos semanales en 4 semanas." }, test: (f) => f.fullWeeks >= 4 },
      { id: "week-12", group: "goals", icon: "●", name: { en: "A quarter on target", es: "Un trimestre en el objetivo" },
        rule: { en: "Complete every weekly goal in 12 weeks.", es: "Completa todos los objetivos semanales en 12 semanas." }, test: (f) => f.fullWeeks >= 12 },
    ],
    Object.entries(SHIFT_NAMES).map(([lab, n]) => ({ id: "shift-" + lab, group: "shift", lab, icon: "⏱", name: n,
      rule: { en: "Finish the full shift at the end of the lab: four tickets in a row.", es: "Termina el turno completo al final del laboratorio: cuatro tickets seguidos." },
      test: (f) => f.shifts.includes(lab) })));
  const ALL = G.BADGES.concat(EXTRA);
  function facts(o) {
    const f = G.facts(o);
    const progress = isObj(o.progress) ? o.progress : {};
    f.points = Object.fromEntries(Object.entries(progress).map(([d, p]) => [d, Number(p && p.points) || 0]));
    f.notesComplete = new Set(f.closes.filter((c) => c.noteComplete).map((c) => c.id)).size;
    f.fullWeeks = fullWeeks(o.weekly);
    f.shifts = Object.keys(normaliseShifts(o.shifts).done);
    return f;
  }
  function award(prev, f, today) {
    const awards = Object.assign({}, prev || {});
    const fresh = [];
    ALL.forEach((b) => { if (!awards[b.id] && b.test(f)) { awards[b.id] = today; fresh.push(b.id); } });
    return { awards, fresh };
  }
  function badges(awards, lang) {
    const a = awards || {};
    return ALL.map((b) => ({ id: b.id, group: b.group || "core", icon: b.icon, name: t(b.name, lang), rule: t(b.rule, lang), earned: Boolean(a[b.id]), day: a[b.id] || null }));
  }

  return { FORMAT, LAB_TASK_POINTS, points, LEVELS, level, levelUp, closeCounts, POOL, goal, WEEKLY, goalsFor, weekAt, goalProgress, normaliseWeekly, claim,
    goalPoints, fullWeeks, history, SHIFT, NEAR, pickShift, normaliseShifts, canStart, start, current, record, abandon, elapsed, summary, shiftPoints,
    MASTERY, MASTERY_MIN, EXTRA, ALL, facts, award, badges };
});
