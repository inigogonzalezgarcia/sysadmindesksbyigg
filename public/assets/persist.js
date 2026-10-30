/* SysAdmin Desks by IGG - keeping work across a page reload (v0.9): a ticket's console in progress (its session: state, commands,
   devices, shipments), the network room outside tickets and the labs' sandboxes. Pure logic, no DOM: the app writes what these
   functions return to localStorage and the Node tests use the same code.

   Everything is kept in an envelope { v, u, at, data }: v is the format (FORMAT), u the owner (a short hash of the signed-in
   account, so another account in the same browser starts clean), at when it was written. unpack() returns null for anything that
   does not fit (another format, another owner, broken data), and the app then starts that piece fresh, as before v0.9. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./engine.js"), require("./netcli.js"), require("./shipping.js"), require("./world.js"), require("./labs.js"));
  } else root.SDPersist = factory(root.SDEngine, root.SDNet, root.SDShip, root.SDWorld, root.SDLabs);
})(typeof self !== "undefined" ? self : this, function (E, NN, SH, Wd, Lb) {
  "use strict";

  const FORMAT = 1;
  const LIMITS = { log: 400, hist: 100, history: 2000 };
  const clone = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));
  const isObj = (x) => Boolean(x) && typeof x === "object" && !Array.isArray(x);

  // FNV-1a, 32 bits, as 8 hex characters: a label to tell owners and desk versions apart (not a secret, not security)
  function hash(text) {
    let h = 0x811c9dc5;
    const s = String(text == null ? "" : text);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  function owner(email) { return email ? hash(String(email).trim().toLowerCase()) : ""; }

  function pack(data, o) {
    const opts = o || {};
    return { v: FORMAT, u: opts.owner || "", at: Number.isFinite(opts.now) ? opts.now : Date.now(), data };
  }
  function unpack(env, o) {
    const opts = o || {};
    if (!isObj(env) || env.v !== FORMAT || !("data" in env)) return null;
    if ((env.u || "") !== (opts.owner || "")) return null;
    return env.data;
  }

  /* ---------- a ticket's session (engine.js). The desk's fingerprint changes when its starting state, its rules or its devices
     change in a new version of the app: a session saved against another version is dropped instead of half-applied. */
  function fingerprint(sc) {
    return hash([sc.id, sc.ticket && sc.ticket.id, Object.keys(sc.state || {}).sort().join(","), (sc.commands || []).length, (sc.events || []).length,
      sc.net ? (sc.net.devices || []).join(",") : "", sc.ship ? Object.keys(sc.ship.flags || {}).join(",") : ""].join("|"));
  }
  function sessionToJSON(sess) {
    return {
      desk: sess.sc.id, fp: fingerprint(sess.sc),
      state: clone(sess.state), history: sess.history.slice(-LIMITS.history), used: Array.from(sess.used),
      hints: sess.hints, unknown: sess.unknown, resolved: sess.resolved, resolvedAt: sess.resolvedAt, gui: sess.gui, failedCloses: sess.failedCloses,
      net: sess.net ? clone(sess.net) : null,
      term: sess.term ? { stack: clone(sess.term.stack), home: sess.term.home } : null,
      ships: sess.ships ? clone(sess.ships) : null,
    };
  }
  // a working session again, or null when the snapshot is not for this desk (or this version of it)
  function sessionFromJSON(sc, snap, lang) {
    if (!isObj(snap) || snap.desk !== sc.id || snap.fp !== fingerprint(sc) || !isObj(snap.state) || !Array.isArray(snap.history)) return null;
    const sess = E.createSession(sc, lang);
    if (Boolean(sc.net) !== Boolean(snap.net && snap.term) || Boolean(sc.ship) !== Boolean(snap.ships)) return null;
    // the starting state of this version, then what was saved on top (a key the desk no longer has is dropped)
    Object.keys(sess.state).forEach((k) => { if (k in snap.state) sess.state[k] = snap.state[k]; });
    sess.history = snap.history.map(String);
    sess.used = new Set(Array.isArray(snap.used) ? snap.used.map(String) : []);
    ["hints", "unknown", "gui", "failedCloses"].forEach((k) => { sess[k] = Math.max(0, Number(snap[k]) || 0); });
    sess.resolved = snap.resolved === true;
    sess.resolvedAt = Number.isFinite(snap.resolvedAt) ? snap.resolvedAt : null;
    if (sc.net) {
      const net = netFromJSON(snap.net);
      if (!net) return null;
      sess.net = net;
      sess.term = NN.terminal(net);
      sess.term.stack = stackFrom(net, snap.term.stack);
      if (snap.term.home) sess.term.home = snap.term.home;
    }
    if (sc.ship) sess.ships = SH.normalise(snap.ships, { ticket: sc.ticket.id });
    return sess;
  }
  // the SSH sessions open on a terminal, only for devices that exist
  function stackFrom(net, stack) {
    return (Array.isArray(stack) ? stack : []).filter((s) => isObj(s) && net.devices[s.dev]).map((s) => clone(s)).slice(-4);
  }

  /* ---------- the network (netcli.js): plain data, so a copy is the network. It must have exactly the devices and hosts of
     this version, or it is dropped. */
  function netToJSON(net) { return clone(net); }
  function netFromJSON(snap) {
    if (!isObj(snap) || !isObj(snap.devices) || !isObj(snap.hosts) || !Number.isFinite(snap.clock)) return null;
    const fresh = NN.createNet([]);
    const same = (a, b) => Object.keys(a).sort().join(",") === Object.keys(b).sort().join(",");
    if (!same(fresh.devices, snap.devices)) return null;
    if (!Object.keys(fresh.hosts).every((k) => k in snap.hosts)) return null;
    if (!Object.values(snap.devices).every((d) => isObj(d) && Array.isArray(d.ifaces || []) && Array.isArray(d.logs || []))) return null;
    const net = clone(snap);
    // a device's log is kept to its last 300 lines, as the devices do
    Object.values(net.devices).forEach((d) => { if (Array.isArray(d.logs) && d.logs.length > 300) d.logs = d.logs.slice(-300); });
    return net;
  }

  /* ---------- the lines of a console: [{text, kind}] (the last LIMITS.log) and its command history (the last LIMITS.hist) */
  const KINDS = ["out", "cmd", "dim", "say", "err", "ok", "event", "warn"];
  function linesOf(log) {
    return (Array.isArray(log) ? log : []).filter((l) => isObj(l) && typeof l.text === "string")
      .map((l) => ({ text: l.text.slice(0, 4000), kind: KINDS.includes(l.kind) ? l.kind : "out" })).slice(-LIMITS.log);
  }
  function histOf(hist) { return (Array.isArray(hist) ? hist : []).filter((x) => typeof x === "string").map((x) => x.slice(0, 500)).slice(-LIMITS.hist); }

  /* ---------- a ticket in progress in the app: { sess, log, hist, view, app, wins, draft }. Closed tickets are never kept. */
  function ticketToJSON(lv) {
    return {
      sess: sessionToJSON(lv.sess), log: linesOf(lv.log), hist: histOf(lv.hist), view: lv.view === "desk" ? "desk" : "console",
      app: typeof lv.app === "string" ? lv.app : null, wins: Array.isArray(lv.wins) ? lv.wins.filter((x) => typeof x === "string").slice(0, 12) : [],
      draft: isObj(lv.draft) ? { note: String(lv.draft.note || "").slice(0, 2000), code: String(lv.draft.code || ""), userNote: String(lv.draft.userNote || "").slice(0, 1500) } : null,
    };
  }
  function ticketFromJSON(sc, snap, lang) {
    if (!isObj(snap)) return null;
    const sess = sessionFromJSON(sc, snap.sess, lang);
    if (!sess) return null;
    const hist = histOf(snap.hist);
    return { sess, log: linesOf(snap.log), hist, pos: hist.length, closed: false, result: null, view: snap.view === "desk" ? "desk" : "console",
      app: typeof snap.app === "string" ? snap.app : null, wins: Array.isArray(snap.wins) ? snap.wins.filter((x) => typeof x === "string") : [],
      draft: isObj(snap.draft) ? snap.draft : null };
  }
  // the map kept by the app (sd.live): {deskId: envelope}. Which entries stay: only tickets whose workflow record is open.
  function prune(map, openIds) {
    const out = {};
    const keep = new Set(openIds || []);
    Object.keys(isObj(map) ? map : {}).forEach((id) => { if (keep.has(id)) out[id] = map[id]; });
    return out;
  }

  /* ---------- the network room outside tickets: the network, the device selected and the room's CLI (if one is open) */
  function roomToJSON(room) {
    const cli = room.cli && !room.cli.src ? { dev: room.cli.dev, stack: clone(room.cli.term.stack), log: linesOf(room.cli.log), hist: histOf(room.cli.hist) } : null;
    return { net: netToJSON(room.net), sel: room.sel || null, cli };
  }
  function roomFromJSON(snap) {
    if (!isObj(snap)) return null;
    const net = netFromJSON(snap.net);
    if (!net) return null;
    let cli = null;
    if (isObj(snap.cli) && net.devices[snap.cli.dev]) {
      const term = NN.terminal(net);
      term.stack = stackFrom(net, snap.cli.stack);
      if (term.stack.length) { const hist = histOf(snap.cli.hist); cli = { dev: snap.cli.dev, term, src: null, log: linesOf(snap.cli.log), hist, pos: hist.length }; }
    }
    return { net, sel: typeof snap.sel === "string" && net.devices[snap.sel] ? snap.sel : null, cli };
  }

  /* ---------- a lab's sandbox (labs.js): its world, network or rule session, what was looked up, and the console */
  function labToJSON(lv) {
    const s = lv.s;
    const box = { id: s.id, kind: s.kind, seen: Array.isArray(s.seen) ? s.seen.slice(-200) : [] };
    if (s.kind === "ad") box.world = clone(s.world);
    else if (s.kind === "net") { box.net = netToJSON(s.net); box.stack = clone(s.term.stack); }
    else box.sess = sessionToJSON(s.sess);
    return { s: box, log: linesOf(lv.log), hist: histOf(lv.hist) };
  }
  function labFromJSON(id, snap, lang) {
    const def = Lb.lab(id);
    if (!def || !isObj(snap) || !isObj(snap.s) || snap.s.id !== id || snap.s.kind !== def.kind) return null;
    const s = Lb.create(id, lang);
    s.seen = Array.isArray(snap.s.seen) ? snap.s.seen.filter((x) => typeof x === "string") : [];
    if (def.kind === "ad") {
      const w = snap.s.world;
      if (!isObj(w) || !Array.isArray(w.users)) return null;
      const fresh = Wd.createWorld();
      // the users of this version, with what was saved for each of them
      s.world = { users: fresh.users.map((u) => { const x = w.users.find((v) => isObj(v) && v.sam === u.sam); return x ? Object.assign({}, u, x, { groups: Array.isArray(x.groups) ? x.groups.slice() : u.groups }) : u; }),
        overlay: {} };
    } else if (def.kind === "net") {
      const net = netFromJSON(snap.s.net);
      if (!net) return null;
      s.net = net; s.term = NN.terminal(net); s.term.stack = stackFrom(net, snap.s.stack);
    } else {
      const sess = sessionFromJSON(def.sc, snap.s.sess, lang);
      if (!sess) return null;
      s.sess = sess;
    }
    const hist = histOf(snap.hist);
    return { s, log: linesOf(snap.log), hist, pos: hist.length };
  }

  // the size of what would be written, in characters (localStorage holds about 5 million per site)
  function size(x) { try { return JSON.stringify(x).length; } catch (e) { return Infinity; } }

  return { FORMAT, LIMITS, hash, owner, pack, unpack, fingerprint, sessionToJSON, sessionFromJSON, netToJSON, netFromJSON,
    ticketToJSON, ticketFromJSON, prune, roomToJSON, roomFromJSON, labToJSON, labFromJSON, size };
});
