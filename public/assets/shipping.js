/* SysAdmin Desks by IGG - shipments and RMA (v0.7b): the asset register, the shipments tool (`ship ...`), the state machine with
   a simulated clock and tracking events, the inventory state of each device, and what a shipment does to a ticket's SLA.
   Pure logic, no DOM: the app, the engine (desks with `ship`) and the Node tests use the same code. Fictional company, people,
   addresses, serial numbers and carrier (TransIbérica Express); the vendors' names are used only as manufacturers in the fiction.

   A store: { prefix, ticket, clock (simulated ms), seq, list: [shipment], marks: {serial: {status, at}} }
   A shipment: { id, ticket, type, serial, vendor, fault, evidence: [], contract, carrier, tracking, from, to, data, escrow, items: [],
                 state, rma, incident, events: [{ at, state, key, p }] }
   States: draft -> requested -> pickup -> transit -> delivered -> closed, and incident (lost or damaged) from pickup or transit. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDShip = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const T0 = Date.UTC(2026, 9, 26, 9, 40);   // the shift starts at 26/10/2026 09:40 (shown as wall-clock time)
  const MIN = 60000;
  const t = (v, lang) => (v == null ? "" : typeof v === "string" ? v : v[lang] || v.en || "");
  const pad = (s, n) => { s = String(s); return s.length >= n ? s : s + " ".repeat(n - s.length); };
  const two = (n) => String(n).padStart(2, "0");
  function stamp(ms) { const d = new Date(ms); return `${two(d.getUTCDate())}/${two(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`; }

  const TYPES = {
    rma: { en: "Vendor RMA", es: "RMA a fabricante" },
    "to-user": { en: "Ship to user", es: "Envío a usuario" },
    return: { en: "Device return", es: "Devolución de equipo" },
    loan: { en: "Loan", es: "Préstamo" },
  };
  const FLOW = ["draft", "requested", "pickup", "transit", "delivered", "closed"];
  const STATES = FLOW.concat(["incident"]);
  const STATE = {
    draft: { en: "Draft", es: "Borrador" },
    requested: { en: "Requested", es: "Solicitado" },
    pickup: { en: "Pickup scheduled", es: "Recogida programada" },
    transit: { en: "In transit", es: "En tránsito" },
    delivered: { en: "Delivered / received", es: "Entregado / Recibido" },
    closed: { en: "Closed", es: "Cerrado" },
    incident: { en: "Incident (lost or damaged)", es: "Incidencia (perdido o dañado)" },
  };
  // for an RMA, "requested" is a request to the vendor, with the RMA number
  const REQUESTED_RMA = { en: "Requested from the vendor", es: "Solicitado al fabricante" };

  /* ---------- the asset register: endpoints, the loan pool and spare parts (the inventory's "Endpoints" view) */
  const ASSETS = [
    { id: "LAPTOP-0102", kind: "laptop", model: "Dell Latitude 7440", serial: "5HZ8QK3", user: "cmartin", join: "hybrid", status: "in-use",
      warranty: { en: "Dell ProSupport Plus, Collect & Return, Keep Your Hard Drive, until 14/03/2028", es: "Dell ProSupport Plus, Collect & Return, Keep Your Hard Drive, hasta el 14/03/2028" } },
    { id: "LAPTOP-0217", kind: "laptop", model: "Dell Latitude 7440", serial: "8KQ2TX3", user: "jruiz", join: "hybrid", status: "in-use",
      warranty: { en: "Dell ProSupport, Collect & Return, Keep Your Hard Drive, until 02/02/2028", es: "Dell ProSupport, Collect & Return, Keep Your Hard Drive, hasta el 02/02/2028" } },
    { id: "LAPTOP-0230", kind: "laptop", model: "Dell Latitude 7440", serial: "3FJ7WR3", user: "lnavarro", join: "hybrid", status: "in-use",
      warranty: { en: "Dell ProSupport, Collect & Return, Keep Your Hard Drive, until 19/06/2027", es: "Dell ProSupport, Collect & Return, Keep Your Hard Drive, hasta el 19/06/2027" } },
    { id: "LAPTOP-0251", kind: "laptop", model: "Dell Latitude 5440", serial: "2BW4MN3", user: "eromero", join: "hybrid", status: "in-use",
      warranty: { en: "Dell Basic, Collect & Return, until 30/09/2027", es: "Dell Basic, Collect & Return, hasta el 30/09/2027" } },
    { id: "LAPTOP-0264", kind: "laptop", model: "Dell Latitude 5440", serial: "9CT1PL3", user: "psanchez", join: "hybrid", status: "in-use",
      warranty: { en: "Dell Basic, Collect & Return, until 30/09/2027", es: "Dell Basic, Collect & Return, hasta el 30/09/2027" } },
    { id: "LAPTOP-0388", kind: "laptop", model: "Dell Latitude 7450", serial: "7RD3ZS4", user: "aortiz", join: "entra", status: "in-use",
      warranty: { en: "Dell ProSupport, Collect & Return, Keep Your Hard Drive, until 11/05/2029", es: "Dell ProSupport, Collect & Return, Keep Your Hard Drive, hasta el 11/05/2029" } },
    { id: "LOAN-LT-01", kind: "laptop", model: "Dell Latitude 5440", serial: "4LN0AN3", user: null, join: "entra", status: "stock", loan: true,
      warranty: { en: "Loan pool (IT store room), Autopilot ready", es: "Equipo de préstamo (almacén de IT), listo con Autopilot" } },
    { id: "LOAN-LT-02", kind: "laptop", model: "Dell Latitude 5440", serial: "4LN0AN4", user: null, join: "entra", status: "stock", loan: true,
      warranty: { en: "Loan pool (IT store room), Autopilot ready", es: "Equipo de préstamo (almacén de IT), listo con Autopilot" } },
    { id: "MOB-0230", kind: "phone", model: "Apple iPhone 14", serial: "F2LXK9PQ1N", user: "lnavarro", status: "in-use",
      warranty: { en: "Corporate phone, managed in Intune", es: "Móvil corporativo, gestionado en Intune" } },
    { id: "SW-ACC-2F PS-1B", kind: "part", model: "Cisco PWR-C5-600WAC (power supply B of SW-ACC-2F)", serial: "DTN2338A1QJ", user: null, status: "in-use",
      warranty: { en: "Cisco Smart Net Total Care 8x5xNBD, contract 2049117 (covers SW-ACC-2F, serial JAE25141K2F)", es: "Cisco Smart Net Total Care 8x5xNBD, contrato 2049117 (cubre SW-ACC-2F, número de serie JAE25141K2F)" } },
  ];
  function asset(key) {
    const k = String(key || "").toLowerCase();
    return ASSETS.find((a) => a.serial.toLowerCase() === k || a.id.toLowerCase() === k) || null;
  }
  const KIND = { laptop: { en: "Laptop", es: "Portátil" }, phone: { en: "Mobile phone", es: "Móvil" }, part: { en: "Spare part", es: "Pieza" } };

  /* ---------- the form's lists (all fictional addresses; 28000 is not a real postcode) */
  const ADDRESSES = {
    "hq-it": { name: { en: "Contoso · IT store room", es: "Contoso · Almacén de IT" }, line: "Calle del Ejemplo 21, 1ª planta, 28000 Madrid" },
    "comms-2f": { name: { en: "Contoso · 2nd floor comms cabinet", es: "Contoso · Armario de comunicaciones 2ª planta" }, line: "Calle del Ejemplo 21, 2ª planta, 28000 Madrid" },
    "home-jruiz": { name: { en: "Javier Ruiz (home)", es: "Javier Ruiz (domicilio)" }, line: "Calle Inventada 7, 2º B, 28000 Madrid" },
    "home-lnavarro": { name: { en: "Lucía Navarro (home)", es: "Lucía Navarro (domicilio)" }, line: "Avenida Ficticia 48, 4º A, 28000 Madrid" },
    "dell-depot": { name: { en: "Laptop vendor repair depot", es: "Centro de reparación del fabricante de portátiles" }, line: "(address on the vendor's RMA label)" },
    "cisco-depot": { name: { en: "Network vendor parts depot", es: "Almacén de piezas del fabricante de red" }, line: "(address on the vendor's RMA label)" },
  };
  const CARRIERS = {
    tix: { name: "TransIbérica Express", prefix: "TIX", speed: 1 },
    vendor: { name: { en: "Vendor's logistics partner", es: "Logística del fabricante" }, prefix: "VLP", speed: 1 },
    internal: { name: { en: "Internal hand delivery", es: "Entrega en mano (interna)" }, prefix: "INT", speed: 0.1 },
  };
  const VENDORS = {
    dell: { name: "Dell", rma: "SR " },
    cisco: { name: "Cisco", rma: "RMA " },
    generic: { name: { en: "Laptop manufacturer", es: "Fabricante de portátiles" }, rma: "RMA " },
  };
  const DATA = {
    kyhd: { en: "Failed drive kept by Contoso (Keep Your Hard Drive): the vendor does not keep it", es: "El disco averiado se queda en Contoso (Keep Your Hard Drive): el fabricante no se lo queda" },
    wiped: { en: "Drive wiped before shipping", es: "Disco borrado antes del envío" },
    encrypted: { en: "Drive ships encrypted (BitLocker on)", es: "El disco viaja cifrado (BitLocker activado)" },
    none: { en: "No user data on the item", es: "Sin datos de usuario" },
  };
  const ITEMS = {
    laptop: { en: "Laptop", es: "Portátil" }, charger: { en: "Charger", es: "Cargador" },
    badge: { en: "Access badge", es: "Tarjeta de acceso" }, phone: { en: "Mobile phone", es: "Móvil" },
  };

  /* ---------- tracking events: what the carrier (or the vendor) reports, and how long each step takes in simulated minutes */
  const EV = {
    created: { en: "Draft created", es: "Borrador creado" },
    rmaOk: { en: "Vendor approved the RMA {rma}", es: "El fabricante aprueba la RMA {rma}" },
    booked: { en: "Booked with {carrier}, tracking {tracking}", es: "Reservado con {carrier}, seguimiento {tracking}" },
    pickupBooked: { en: "Pickup booked at {from}, today 14:00-18:00", es: "Recogida reservada en {from}, hoy de 14:00 a 18:00" },
    dispatched: { en: "Replacement allocated and dispatched from {from}", es: "Repuesto asignado y enviado desde {from}" },
    collected: { en: "Collected at {from}", es: "Recogido en {from}" },
    hub: { en: "Arrived at the sorting hub (Coslada)", es: "Llegada al centro de clasificación (Coslada)" },
    outFor: { en: "Out for delivery", es: "En reparto" },
    delivered: { en: "Delivered at {to}, signed by the recipient", es: "Entregado en {to}, firmado por el destinatario" },
    handed: { en: "Handed over in person at {to}", es: "Entregado en mano en {to}" },
    closed: { en: "Shipment closed", es: "Envío cerrado" },
    lost: { en: "Incident: the parcel is missing at the hub; claim opened with {carrier}", es: "Incidencia: el paquete no aparece en el centro; reclamación abierta con {carrier}" },
    damaged: { en: "Incident: the parcel arrived damaged at the hub; claim opened with {carrier}", es: "Incidencia: el paquete ha llegado dañado al centro; reclamación abierta con {carrier}" },
    found: { en: "Claim solved: the parcel goes on to {to}", es: "Reclamación resuelta: el paquete sigue hacia {to}" },
  };
  // [next state, minutes it takes, events] for each step; the internal carrier is ten times faster
  const STEPS = {
    requested: { mins: 5, ev: (s) => (s.type === "rma" ? ["rmaOk", "booked"] : ["booked"]) },
    pickup: { mins: 120, ev: (s) => (s.from === "cisco-depot" || s.from === "dell-depot" ? ["dispatched"] : ["pickupBooked"]) },
    transit: { mins: 300, ev: (s) => (s.from === "cisco-depot" || s.from === "dell-depot" ? ["hub"] : ["collected", "hub"]) },
    delivered: { mins: 1020, ev: (s) => (s.carrier === "internal" ? ["handed"] : ["outFor", "delivered"]) },
    closed: { mins: 0, ev: () => ["closed"] },
  };

  function createStore(opts) {
    const o = opts || {};
    const prefix = o.prefix || (o.ticket ? "SHP-" + String(o.ticket).replace(/^\D+/, "") : "SHP-P");
    return { prefix, ticket: o.ticket || null, clock: Number(o.clock) || T0, seq: 0, list: [], marks: {} };
  }
  // a store saved by the app (sd.ships) or anything else: always a usable store
  function normalise(store, opts) {
    const s = createStore(opts);
    if (!store || typeof store !== "object" || !Array.isArray(store.list)) return s;
    s.clock = Number(store.clock) || s.clock;
    s.seq = Number(store.seq) || 0;
    s.list = store.list.filter((x) => x && typeof x.id === "string" && STATES.includes(x.state)).slice(-50);
    s.marks = store.marks && typeof store.marks === "object" ? store.marks : {};
    return s;
  }
  function find(store, id) { const k = String(id || "").toLowerCase(); return store.list.find((x) => x.id.toLowerCase() === k) || null; }
  function tracking(sh, store) {
    const c = CARRIERS[sh.carrier];
    if (!c) return "";
    const seed = (store.prefix + sh.id).split("").reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 1000000007, 7);
    return c.prefix + String(100000000 + (seed % 900000000));
  }
  function rmaNumber(sh, store) {
    const v = VENDORS[sh.vendor] || VENDORS.generic;
    const seed = (sh.id + sh.serial).split("").reduce((a, ch) => (a * 17 + ch.charCodeAt(0)) % 99999989, 3);
    return v.rma + String(800000000 + (seed % 99999999));
  }

  const LIST_KEYS = ["evidence", "items"];
  const FIELDS = ["serial", "vendor", "fault", "evidence", "contract", "carrier", "from", "to", "data", "escrow", "items"];
  function clean(v) { return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200); }
  function setFields(sh, input) {
    FIELDS.forEach((k) => {
      if (!(k in input) || input[k] === undefined) return;
      if (k === "escrow") sh.escrow = input.escrow === true || /^(true|yes|1|si|sí)$/i.test(String(input.escrow));
      else if (LIST_KEYS.includes(k)) sh[k] = (Array.isArray(input[k]) ? input[k] : String(input[k]).split(",")).map(clean).filter(Boolean).slice(0, 10);
      else sh[k] = clean(input[k]);
    });
    if (sh.serial) { const a = asset(sh.serial); if (a) sh.serial = a.serial; }
    if (sh.items) sh.items = sh.items.map((x) => x.toLowerCase());
    if (sh.data) sh.data = sh.data.toLowerCase();
  }

  /* What is missing before a shipment can be requested (errors) and what should be checked (warnings). Field ids, not text. */
  function validate(sh) {
    const errors = [];
    const warnings = [];
    const a = asset(sh.serial);
    if (!a) errors.push("serial");
    if (!CARRIERS[sh.carrier]) errors.push("carrier");
    if (!ADDRESSES[sh.from]) errors.push("from");
    if (!ADDRESSES[sh.to]) errors.push("to");
    if (ADDRESSES[sh.from] && sh.from === sh.to) errors.push("to");
    if (sh.type === "rma") {
      if (!VENDORS[sh.vendor]) errors.push("vendor");
      if (!sh.fault) errors.push("fault");
      if (!(sh.evidence || []).length) errors.push("evidence");
    }
    if (sh.type === "return" && a && a.kind !== "part" && !(sh.items || []).length) errors.push("items");
    if (a && a.kind === "laptop" && (sh.type === "rma" || sh.type === "return") && !DATA[sh.data]) errors.push("data");
    // a laptop that goes to a third party: its BitLocker recovery key must be in Entra ID first (a warning: it does not block)
    if (a && a.kind === "laptop" && sh.type === "rma" && !sh.escrow) warnings.push("escrow");
    if (a && a.kind === "part" && sh.type === "rma" && !sh.contract) warnings.push("contract");
    return { ok: errors.length === 0, errors, warnings };
  }

  function event(store, sh, key, state) {
    sh.events.push({ at: store.clock, state, key, p: { rma: sh.rma || "", tracking: sh.tracking || "" } });
  }
  // the human text of an event, in the user's language
  function eventText(sh, ev, lang) {
    const name = (k) => (ADDRESSES[k] ? t(ADDRESSES[k].name, lang) : k || "");
    const c = CARRIERS[sh.carrier];
    return t(EV[ev.key] || { en: ev.key }, lang).replace(/\{(\w+)\}/g, (_, k) => k === "from" ? name(sh.from) : k === "to" ? name(sh.to)
      : k === "carrier" ? (c ? t(c.name, lang) : "") : (ev.p || {})[k] || "");
  }

  /* ---------- the state machine. Each function returns {ok, ship, ms (simulated time it took), error} */
  function create(store, type, input) {
    if (!TYPES[type]) return { ok: false, error: "type" };
    if (store.list.length >= 50) return { ok: false, error: "full" };
    store.seq += 1;
    const sh = { id: `${store.prefix}-${store.seq}`, ticket: store.ticket, type, serial: "", vendor: "", fault: "", evidence: [], contract: "", carrier: "", tracking: "",
      from: "", to: "", data: "", escrow: false, items: [], state: "draft", rma: "", incident: null, events: [] };
    setFields(sh, input || {});
    store.list.push(sh);
    event(store, sh, "created", "draft");
    return { ok: true, ship: sh, ms: 0, check: validate(sh) };
  }
  function update(store, id, input) {
    const sh = find(store, id);
    if (!sh) return { ok: false, error: "unknown" };
    // details can be added to the case until the parcel is delivered (the vendor takes more evidence); never the asset or the type
    if (["delivered", "closed", "incident"].includes(sh.state)) return { ok: false, error: "locked", ship: sh };
    if (sh.state !== "draft") { input = Object.assign({}, input); delete input.serial; }
    setFields(sh, input || {});
    return { ok: true, ship: sh, ms: 0, check: validate(sh) };
  }
  function move(store, sh, to) {
    const step = STEPS[to];
    const speed = to === "closed" ? 0 : (CARRIERS[sh.carrier] || CARRIERS.tix).speed;
    const ms = Math.round(step.mins * speed) * MIN;
    store.clock += ms;
    sh.state = to;
    if (to === "requested") {
      if (sh.type === "rma") sh.rma = rmaNumber(sh, store);
      sh.tracking = tracking(sh, store);
    }
    step.ev(sh).forEach((k) => event(store, sh, k, to));
    return { ok: true, ship: sh, ms };
  }
  function submit(store, id) {
    const sh = find(store, id);
    if (!sh) return { ok: false, error: "unknown" };
    if (sh.state !== "draft") return { ok: false, error: "state", ship: sh };
    const check = validate(sh);
    if (!check.ok) return { ok: false, error: "invalid", ship: sh, check };
    return Object.assign(move(store, sh, "requested"), { check });
  }
  // the next step of the flow: requested -> pickup -> transit -> delivered; from an incident, the claim is solved and it goes on
  function advance(store, id) {
    const sh = find(store, id);
    if (!sh) return { ok: false, error: "unknown" };
    if (sh.state === "incident") {
      const ms = 1440 * MIN;
      store.clock += ms;
      sh.state = "transit";
      sh.incident = null;
      event(store, sh, "found", "transit");
      return { ok: true, ship: sh, ms };
    }
    const i = FLOW.indexOf(sh.state);
    if (sh.state === "draft") return { ok: false, error: "draft", ship: sh };
    if (i < 0 || i >= FLOW.indexOf("delivered")) return { ok: false, error: "state", ship: sh };
    return move(store, sh, FLOW[i + 1]);
  }
  function incident(store, id, kind) {
    const sh = find(store, id);
    if (!sh) return { ok: false, error: "unknown" };
    if (!["lost", "damaged"].includes(kind)) return { ok: false, error: "kind", ship: sh };
    if (!["pickup", "transit"].includes(sh.state)) return { ok: false, error: "state", ship: sh };
    const ms = 240 * MIN;
    store.clock += ms;
    sh.state = "incident";
    sh.incident = kind;
    event(store, sh, kind, "incident");
    return { ok: true, ship: sh, ms };
  }
  function close(store, id) {
    const sh = find(store, id);
    if (!sh) return { ok: false, error: "unknown" };
    if (sh.state !== "delivered") return { ok: false, error: "state", ship: sh };
    return move(store, sh, "closed");
  }
  // the steps that can be taken now: ["submit"] | ["advance", "incident"] | ["close"] ...
  function next(sh) {
    if (sh.state === "draft") return ["submit"];
    if (sh.state === "requested") return ["advance"];
    if (sh.state === "pickup" || sh.state === "transit") return ["advance", "incident"];
    if (sh.state === "incident") return ["advance"];
    if (sh.state === "delivered") return ["close"];
    return [];
  }
  function stateLabel(sh, lang, state) {
    const st = state || sh.state;
    return t(st === "requested" && sh.type === "rma" ? REQUESTED_RMA : STATE[st], lang);
  }

  /* ---------- the inventory state of a device, from the shipments of every store and the marks made in the register */
  const DEVICE = {
    "in-use": { en: "In use", es: "En uso" }, stock: { en: "In stock (IT store room)", es: "En almacén (IT)" },
    rma: { en: "In RMA", es: "En RMA" }, loan: { en: "On loan", es: "En préstamo" }, replaced: { en: "Replaced", es: "Sustituido" },
    returning: { en: "Return in progress", es: "Devolución en curso" }, received: { en: "Received, waiting for the wipe", es: "Recibido, pendiente de borrado" },
  };
  const MARKS = ["stock", "replaced", "in-use"];
  function deviceState(stores, serial) {
    const a = asset(serial);
    if (!a) return null;
    const all = [].concat(stores || []).filter(Boolean);
    const mark = all.map((s) => s.marks && s.marks[a.serial]).filter(Boolean).sort((x, y) => y.at - x.at)[0];
    if (mark) return mark.status;
    let st = a.status;
    all.forEach((s) => s.list.filter((x) => x.serial === a.serial && x.state !== "draft").forEach((x) => {
      if (x.type === "rma") st = x.state === "closed" ? st : "rma";
      else if (x.type === "loan") st = x.state === "closed" ? "stock" : "loan";
      else if (x.type === "return") st = ["delivered", "closed"].includes(x.state) ? "received" : "returning";
      else if (x.type === "to-user" && ["delivered", "closed"].includes(x.state)) st = "in-use";
    }));
    return st;
  }
  function mark(store, serial, status) {
    const a = asset(serial);
    if (!a) return { ok: false, error: "serial" };
    if (!MARKS.includes(status)) return { ok: false, error: "status" };
    store.marks[a.serial] = { status, at: store.clock };
    return { ok: true, asset: a, ms: 0 };
  }

  /* ---------- the checks a desk reads (scenario ship.flags, see docs/shipping.md) */
  function check(store, spec) {
    if (spec.kind === "asset") return deviceState([store], spec.serial) === spec.status;
    return store.list.some((x) => {
      if (spec.type && x.type !== spec.type) return false;
      if (spec.serial && x.serial !== spec.serial) return false;
      if (spec.state && ![].concat(spec.state).includes(x.state)) return false;
      if (spec.escrow != null && x.escrow !== spec.escrow) return false;
      if (spec.data && x.data !== spec.data) return false;
      if (spec.vendor && x.vendor !== spec.vendor) return false;
      if (spec.contract && !x.contract) return false;
      if (spec.to && x.to !== spec.to) return false;
      if (spec.evidence && !x.evidence.some((e) => e.toLowerCase().includes(String(spec.evidence).toLowerCase()))) return false;
      if (spec.items && !spec.items.every((i) => x.items.includes(i))) return false;
      return true;
    });
  }

  /* ---------- the SLA: a step that takes simulated hours counts against the ticket's SLA, unless the ticket is pending (paused).
     rec is a workflow record (workflow.js); returns a new record with the time (extraMs) and an Activity entry. */
  function charge(rec, info, now) {
    if (!rec || typeof rec !== "object") return rec;
    const ms = Math.max(0, Number(info.ms) || 0);
    const paused = rec.status === "pending-user" || rec.status === "pending-vendor";
    const out = Object.assign({}, rec, { timeline: (Array.isArray(rec.timeline) ? rec.timeline : []).slice(-99) });
    const charged = !paused && ms > 0;
    if (charged) out.extraMs = (Number(rec.extraMs) || 0) + ms;
    out.timeline.push({ at: now, ship: info.id, state: info.state, ms, charged, paused });
    return out;
  }

  /* ---------- the shipments tool: `ship ...` in a ticket's console, on the Shipments page and behind every button there */
  function tokenize(s) {
    const out = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m;
    while ((m = re.exec(s))) out.push(m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]);
    return out;
  }
  function parseOpts(toks) {
    const o = {};
    const pos = [];
    for (let i = 0; i < toks.length; i++) {
      const k = toks[i];
      if (/^--[a-z]/i.test(k)) {
        const key = k.slice(2).toLowerCase();
        if (key === "escrow") { o.escrow = true; continue; }
        if (key === "no-escrow") { o.escrow = false; continue; }
        o[key] = i + 1 < toks.length && !/^--[a-z]/i.test(toks[i + 1]) ? toks[++i] : "";
      } else pos.push(k);
    }
    return { o, pos };
  }
  const HELP = [
    "Contoso shipments tool (simulated). Usage:",
    "  ship list                         shipments of this ticket (or of the practice area)",
    "  ship show <id>                    details, RMA number and tracking events",
    "  ship assets <user>                what the asset register says a user has",
    "  ship new <rma|to-user|return|loan> --serial <serial or name> [options]",
    "       --vendor dell|cisco|generic  --fault \"...\"  --evidence \"code, log\"  --contract <id>",
    "       --carrier tix|vendor|internal  --from <address>  --to <address>",
    "       --data kyhd|wiped|encrypted|none  --escrow  --items laptop,charger,badge,phone",
    "  ship set <id> [options]           change a shipment until it is delivered (not its asset)",
    "  ship submit <id>                  request it (RMA number from the vendor, booking with the carrier)",
    "  ship advance <id>                 the next step happens (time passes: pickup, transit, delivery)",
    "  ship incident <id> lost|damaged   report a lost or damaged parcel",
    "  ship close <id>                   close a delivered shipment",
    "  ship mark <serial> stock|replaced|in-use   update the asset register",
    "Addresses: " + Object.keys(ADDRESSES).join(", ") + ".",
  ];
  const ERR = {
    unknown: (id) => `ship: no shipment ${id} here (ship list shows them).`,
    state: (sh) => `ship: ${sh.id} is ${sh.state}: that step is not possible now.`,
    draft: (sh) => `ship: ${sh.id} is a draft: submit it first.`,
    locked: (sh) => `ship: ${sh.id} is already ${sh.state}: it can only be changed until it is delivered.`,
    type: () => "ship: the type must be rma, to-user, return or loan.",
    kind: () => "ship: the incident must be lost or damaged.",
    full: () => "ship: too many shipments here (50).",
    serial: () => "ship: that serial or name is not in the asset register.",
    status: () => "ship: the status must be stock, replaced or in-use.",
  };
  const FIELD = {
    serial: { en: "asset (serial)", es: "equipo (número de serie)" }, carrier: { en: "carrier", es: "transportista" }, from: { en: "pickup address", es: "dirección de recogida" },
    to: { en: "delivery address (different from the pickup)", es: "dirección de entrega (distinta de la de recogida)" }, vendor: { en: "vendor", es: "fabricante" },
    fault: { en: "fault description", es: "descripción de la avería" }, evidence: { en: "evidence (diagnostic code, log)", es: "evidencias (código de diagnóstico, log)" },
    data: { en: "data handling of the drive", es: "tratamiento de los datos del disco" }, items: { en: "checklist of items", es: "lista de lo que se devuelve" },
  };
  const WARN = {
    escrow: { en: "Warning: a laptop is leaving Contoso and its BitLocker recovery key has not been checked in Entra ID (--escrow). Without the key, a new motherboard or the kept drive cannot be unlocked.",
              es: "Aviso: sale un portátil de Contoso y no se ha comprobado su clave de recuperación de BitLocker en Entra ID (--escrow). Sin la clave, no se podrá desbloquear tras cambiar la placa ni leer el disco que se queda." },
    contract: { en: "Warning: no support contract on the RMA (--contract): the vendor may reject or charge it.", es: "Aviso: la RMA no lleva contrato de soporte (--contract): el fabricante puede rechazarla o cobrarla." },
  };
  function fieldNames(list, lang) { return list.map((k) => t(FIELD[k] || { en: k }, lang)).join(", "); }
  function showLines(store, sh, lang) {
    const a = asset(sh.serial);
    const addr = (k) => (ADDRESSES[k] ? `${t(ADDRESSES[k].name, "en")}, ${ADDRESSES[k].line}` : "");
    const c = CARRIERS[sh.carrier];
    const rows = [["Shipment", sh.id], ["Ticket", sh.ticket || "(practice)"], ["Type", TYPES[sh.type].en], ["State", stateLabel(sh, "en") + (sh.incident ? ` (${sh.incident})` : "")],
      ["Asset", a ? `${a.id} (${a.model}, serial ${a.serial})` : sh.serial || ""]];
    if (sh.type === "rma") rows.push(["Vendor", sh.vendor ? t((VENDORS[sh.vendor] || {}).name, "en") || sh.vendor : ""], ["RMA number", sh.rma || "(after submit)"],
      ["Fault", sh.fault], ["Evidence", sh.evidence.join("; ")], ["Contract", sh.contract]);
    if (a && a.kind === "laptop") rows.push(["Data handling", sh.data ? t(DATA[sh.data], "en") || sh.data : ""], ["BitLocker key", sh.escrow ? "Escrowed in Entra ID (checked)" : "NOT CHECKED"]);
    if (sh.type === "return") rows.push(["Items", sh.items.join(", ")]);
    rows.push(["Carrier", c ? `${t(c.name, "en")}${sh.tracking ? " · " + sh.tracking : ""}` : ""], ["From", addr(sh.from)], ["To", addr(sh.to)]);
    const n = Math.max(...rows.map((r) => r[0].length));
    return ["", ...rows.map(([k, v]) => pad(k, n) + " : " + (v || "")), "", "Tracking:", ...sh.events.map((e) => `  ${stamp(e.at)}  ${pad(STATE[e.state].en, 21)} ${eventText(sh, e, "en")}`), ""];
  }
  function listLines(store) {
    if (!store.list.length) return ["", "(no shipments yet: ship new ...)", ""];
    const rows = store.list.map((x) => [x.id, TYPES[x.type].en, x.serial, x.state, x.tracking || "-"]);
    const cols = ["Id", "Type", "Serial", "State", "Tracking"];
    const w = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => String(r[i]).length)));
    return ["", cols.map((c, i) => pad(c, w[i])).join("  "), cols.map((c, i) => pad("-".repeat(c.length), w[i])).join("  "), ...rows.map((r) => r.map((x, i) => pad(x, w[i])).join("  ")), ""];
  }
  function assetLines(stores, user) {
    const mine = ASSETS.filter((a) => a.user && a.user.toLowerCase() === String(user).toLowerCase());
    if (!mine.length) return ["", `(no assets assigned to ${user} in the register)`, ""];
    return ["", `Assets assigned to ${user}:`, ...mine.map((a) => `  ${pad(a.id, 16)} ${pad(t(KIND[a.kind], "en"), 13)} ${pad(a.model, 20)} serial ${pad(a.serial, 11)} ${t(DEVICE[deviceState(stores, a.serial)], "en")}`),
      "  + accessories on the leaver checklist: charger, access badge", ""];
  }

  /* Runs one `ship ...` line on a store. Returns {lines: [{text, kind}], tags: [], ms, unknown, ship}. opts.lang for the narration;
     opts.stores: every store, for the asset states (default: this one). */
  function exec(store, line, opts) {
    const o = opts || {};
    const lang = o.lang === "es" ? "es" : "en";
    const res = { lines: [], tags: [], ms: 0, unknown: false, ship: null };
    const out = (arr, kind) => arr.forEach((x) => res.lines.push({ text: x, kind: kind || "out" }));
    const say = (v) => res.lines.push({ text: t(v, lang), kind: "say" });
    const err = (x) => res.lines.push({ text: x, kind: "err" });
    const toks = tokenize(String(line || "").trim());
    if (!toks.length || toks[0].toLowerCase() !== "ship") { res.unknown = true; err("ship: not a shipments command."); return res; }
    const verb = (toks[1] || "help").toLowerCase();
    const { o: opt, pos } = parseOpts(toks.slice(2));
    const fail = (r) => { err((ERR[r.error] || ((x) => "ship: " + x))(r.ship || pos[0] || "")); res.tags.push("ship error " + r.error); return res; };
    const done = (r, verbTag) => {
      res.ms = r.ms || 0;
      res.ship = { id: r.ship.id, state: r.ship.state, type: r.ship.type };
      res.tags.push(`ship ${verbTag} ${r.ship.type} ${r.ship.state}`);
      if (verbTag !== "state") res.tags.push(`ship state ${r.ship.type} ${r.ship.state}`);
      return res;
    };
    switch (verb) {
      case "help": case "?": out(HELP); return res;
      case "list": out(listLines(store)); res.tags.push("ship list"); return res;
      case "show": {
        const sh = find(store, pos[0]);
        if (!sh) return fail({ error: "unknown" });
        out(showLines(store, sh, lang));
        res.tags.push(`ship show ${sh.type} ${sh.state}`);
        return res;
      }
      case "assets": {
        if (!pos[0]) { err("ship: ship assets <user>"); return res; }
        out(assetLines(o.stores || [store], pos[0]));
        res.tags.push("ship assets " + pos[0].toLowerCase());
        return res;
      }
      case "new": {
        const type = (pos[0] || "").toLowerCase();
        const r = create(store, type, opt);
        if (!r.ok) return fail(r);
        out(["", `${r.ship.id} created as a draft (${TYPES[type].en}, ${r.ship.serial || "no asset"}).`, ""]);
        if (!r.check.ok) say({ en: "Still missing before submit: " + fieldNames(r.check.errors, "en") + ".", es: "Falta antes de solicitarlo: " + fieldNames(r.check.errors, "es") + "." });
        res.tags.push(`ship new ${type} ${r.ship.serial}`);
        res.ship = { id: r.ship.id, state: "draft", type };
        return res;
      }
      case "set": {
        const r = update(store, pos[0], opt);
        if (!r.ok) return fail(r);
        out(["", `${r.ship.id} updated.`, ""]);
        if (!r.check.ok) say({ en: "Still missing: " + fieldNames(r.check.errors, "en") + ".", es: "Falta: " + fieldNames(r.check.errors, "es") + "." });
        res.tags.push(`ship set ${r.ship.type} ${r.ship.escrow ? "escrow" : "noescrow"}`);
        res.ship = { id: r.ship.id, state: r.ship.state, type: r.ship.type };
        return res;
      }
      case "submit": {
        const r = submit(store, pos[0]);
        if (!r.ok && r.error === "invalid") {
          err(`ship: ${r.ship.id} cannot be requested yet. Missing: ${fieldNames(r.check.errors, "en")}.`);
          res.tags.push(`ship invalid ${r.ship.type}`);
          return res;
        }
        if (!r.ok) return fail(r);
        out(["", r.ship.type === "rma" ? `${r.ship.id}: RMA requested and approved: ${r.ship.rma}. Carrier booked: ${r.ship.tracking}.` : `${r.ship.id}: booked, tracking ${r.ship.tracking}.`, ""]);
        r.check.warnings.forEach((w) => res.lines.push({ text: t(WARN[w], lang), kind: "err" }));
        res.tags.push(`ship submit ${r.ship.type} ${r.ship.escrow ? "escrow" : "noescrow"}`);
        return done(r, "state");
      }
      case "advance": {
        const r = advance(store, pos[0]);
        if (!r.ok) return fail(r);
        const sh = r.ship;
        out(["", `${sh.id}: ${STATE[sh.state].en}.`, ...sh.events.filter((e) => e.at > store.clock - r.ms - 1 && e.state === sh.state).slice(-2).map((e) => `  ${stamp(e.at)}  ${eventText(sh, e, "en")}`), ""]);
        if (sh.state === "pickup" && sh.type === "rma" && asset(sh.serial) && asset(sh.serial).kind === "laptop" && !sh.escrow) res.lines.push({ text: t(WARN.escrow, lang), kind: "err" });
        return done(r, "state");
      }
      case "incident": {
        const r = incident(store, pos[0], (pos[1] || "").toLowerCase());
        if (!r.ok) return fail(r);
        out(["", `${r.ship.id}: ${eventText(r.ship, r.ship.events[r.ship.events.length - 1], "en")}.`, ""]);
        res.tags.push(`ship incident ${r.ship.type} ${r.ship.incident}`);
        return done(r, "state");
      }
      case "close": {
        const r = close(store, pos[0]);
        if (!r.ok) return fail(r);
        out(["", `${r.ship.id}: closed.`, ""]);
        return done(r, "state");
      }
      case "mark": {
        const r = mark(store, pos[0], (pos[1] || "").toLowerCase());
        if (!r.ok) return fail(r);
        out(["", `Asset register: ${r.asset.id} (${r.asset.serial}) is now ${t(DEVICE[pos[1].toLowerCase()], "en").toLowerCase()}.`, ""]);
        res.tags.push(`ship mark ${r.asset.serial} ${pos[1].toLowerCase()}`);
        return res;
      }
      default:
        res.unknown = true;
        err(`ship: unknown action '${verb}'. Type ship help.`);
        return res;
    }
  }

  // the line a form or a button runs (quoted values), so the console and the page always do the same
  function command(verb, a, b) {
    const q = (v) => (/[\s"']/.test(String(v)) || v === "" ? `"${String(v).replace(/"/g, "'")}"` : String(v));
    if (verb === "new" || verb === "set") {
      const parts = ["ship", verb, a];
      Object.entries(b || {}).forEach(([k, v]) => {
        if (k === "escrow") { if (v) parts.push("--escrow"); else if (verb === "set") parts.push("--no-escrow"); return; }
        if (v == null || v === "" || (Array.isArray(v) && !v.length)) return;
        parts.push("--" + k, q(Array.isArray(v) ? v.join(",") : v));
      });
      return parts.join(" ");
    }
    if (verb === "incident") return `ship incident ${a} ${b}`;
    if (verb === "mark") return `ship mark ${a} ${b}`;
    return `ship ${verb} ${a}`;
  }

  return { T0, TYPES, STATES, FLOW, STATE, ASSETS, ADDRESSES, CARRIERS, VENDORS, DATA, ITEMS, DEVICE, KIND, EV, t, stamp,
    asset, createStore, normalise, find, validate, create, update, submit, advance, incident, close, next, stateLabel, eventText,
    deviceState, mark, check, charge, exec, command, tokenize };
});
