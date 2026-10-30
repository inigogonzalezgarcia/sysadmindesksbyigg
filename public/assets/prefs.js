/* SysAdmin Desks by IGG - preferences (v0.9, My account → Preferences): the daily practice reminder, celebration sounds, the time
   zone and reduced motion. Pure logic, no DOM: the app keeps the preferences in this browser (sd.prefs) and the Node tests use the
   same code. Nothing here is sent anywhere: the reminder is a banner in the page (and, only if the user turns it on and allows
   it, a browser notification while the page is open); there is no push server. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SDPrefs = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const FORMAT = 1;
  const DEFAULTS = { v: FORMAT, reminder: { on: false, time: "18:00", notify: false }, sounds: false, tz: "", motion: false };
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- time zones (IANA names, e.g. "Europe/Madrid"). "" means the browser's own zone. */
  function validZone(tz) {
    if (typeof tz !== "string" || !tz || tz.length > 64) return false;
    try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return true; } catch (e) { return false; }
  }
  function browserZone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; }
  }
  // the zone to use: the chosen one if valid, otherwise the browser's
  function zoneOf(prefs) { const z = prefs && prefs.tz; return validZone(z) ? z : browserZone(); }
  // a short list for browsers without Intl.supportedValuesOf, and the first entries of the picker
  const COMMON = ["Europe/Madrid", "Atlantic/Canary", "Europe/Lisbon", "Europe/London", "Europe/Paris", "Europe/Berlin", "America/Mexico_City",
    "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "UTC"];
  function zones() {
    let all = [];
    try { if (typeof Intl.supportedValuesOf === "function") all = Intl.supportedValuesOf("timeZone"); } catch (e) { all = []; }
    const list = COMMON.filter(validZone).concat(all.filter((z) => COMMON.indexOf(z) === -1));
    return Array.from(new Set(list));
  }
  // the wall-clock parts of an instant in a zone: {y, m, d, h, min, s}
  function partsIn(ms, tz) {
    const zone = validZone(tz) ? tz : "UTC";
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    const o = {};
    f.formatToParts(new Date(ms)).forEach((p) => { if (p.type !== "literal") o[p.type] = Number(p.value); });
    return { y: o.year, m: o.month, d: o.day, h: o.hour === 24 ? 0 : o.hour, min: o.minute, s: o.second };
  }
  // the calendar day of an instant in a zone, "YYYY-MM-DD": the streak and the weekly goal count these days
  function dayIn(ms, tz) { const p = partsIn(ms, tz); return p.y + "-" + pad(p.m) + "-" + pad(p.d); }
  // "HH:MM" (or "HH:MM:SS") in a zone, 24-hour clock
  function timeIn(ms, tz, seconds) { const p = partsIn(ms, tz); return pad(p.h) + ":" + pad(p.min) + (seconds ? ":" + pad(p.s) : ""); }
  // minutes since midnight in a zone
  function minuteOfDay(ms, tz) { const p = partsIn(ms, tz); return p.h * 60 + p.min; }
  // the zone's offset from UTC at that instant, as "UTC+01:00"
  function offsetLabel(ms, tz) {
    const p = partsIn(ms, tz);
    const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
    const mins = Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
    const sign = mins < 0 ? "-" : "+";
    const a = Math.abs(mins);
    return "UTC" + sign + pad(Math.floor(a / 60)) + ":" + pad(a % 60);
  }

  /* ---------- the preferences: always a full, valid object */
  function validTime(x) { return typeof x === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(x); }
  function normalise(p) {
    const o = p && typeof p === "object" ? p : {};
    const r = o.reminder && typeof o.reminder === "object" ? o.reminder : {};
    return {
      v: FORMAT,
      reminder: { on: r.on === true, time: validTime(r.time) ? r.time : DEFAULTS.reminder.time, notify: r.on === true && r.notify === true },
      sounds: o.sounds === true,
      tz: validZone(o.tz) ? o.tz : "",
      motion: o.motion === true,
    };
  }
  // a change from the form: {reminder: {...}} or {sounds}, merged and normalised
  function update(p, change) {
    const cur = normalise(p);
    const c = change || {};
    const next = Object.assign({}, cur, c, { reminder: Object.assign({}, cur.reminder, c.reminder || {}) });
    return normalise(next);
  }

  /* ---------- the daily reminder. It is due when it is on, the chosen time has passed today (in the chosen zone), it has not been
     shown or dismissed today, and nothing has been practised today yet. state: {lastShown: "YYYY-MM-DD" | null}. */
  function reminderDue(prefs, now, state, practisedToday) {
    const p = normalise(prefs);
    if (!p.reminder.on || practisedToday) return false;
    const tz = zoneOf(p);
    const today = dayIn(now, tz);
    if (state && state.lastShown === today) return false;
    const [h, m] = p.reminder.time.split(":").map(Number);
    return minuteOfDay(now, tz) >= h * 60 + m;
  }
  // after showing it (or after the user closes it): not again until tomorrow
  function reminderShown(prefs, now) { return { lastShown: dayIn(now, zoneOf(normalise(prefs))) }; }

  /* ---------- celebration sounds: short blips as [{f: Hz, d: seconds, at: seconds from now}], played by the app with WebAudio */
  const SOUNDS = {
    resolved: [{ f: 660, d: 0.09, at: 0 }, { f: 880, d: 0.12, at: 0.1 }],
    badge: [{ f: 523, d: 0.08, at: 0 }, { f: 659, d: 0.08, at: 0.09 }, { f: 784, d: 0.14, at: 0.18 }],
    task: [{ f: 740, d: 0.08, at: 0 }],
    complete: [{ f: 587, d: 0.08, at: 0 }, { f: 740, d: 0.08, at: 0.09 }, { f: 988, d: 0.16, at: 0.18 }],
    // v0.9b: a new level (levels.js)
    level: [{ f: 523, d: 0.08, at: 0 }, { f: 659, d: 0.08, at: 0.09 }, { f: 784, d: 0.08, at: 0.18 }, { f: 1047, d: 0.2, at: 0.27 }],
  };
  function sound(prefs, kind) { return normalise(prefs).sounds && SOUNDS[kind] ? SOUNDS[kind] : []; }

  return { FORMAT, DEFAULTS, validZone, browserZone, zoneOf, zones, COMMON, partsIn, dayIn, timeIn, minuteOfDay, offsetLabel, validTime,
    normalise, update, reminderDue, reminderShown, SOUNDS, sound };
});
