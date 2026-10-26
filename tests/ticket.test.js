// The ticket page (v0.2): requester and asset cards, actions, SLA, resolution codes and the three-level result.
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../public/assets/engine.js");
const SCENARIOS = require("../public/assets/scenarios.js");

const byId = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
const CODE_IDS = new Set(E.CODES.map((c) => c.id));

function play(sc, cmds, lang = "en") {
  const sess = E.createSession(sc, lang);
  cmds.forEach((c) => E.run(sess, c));
  return sess;
}

test("every desk has a requester, an asset card, valid actions and a valid resolution code", () => {
  for (const sc of SCENARIOS) {
    const keys = new Set(Object.keys(sc.state));
    assert.ok(sc.requester && sc.requester.name && sc.requester.user && sc.requester.device, sc.id + " requester");
    assert.ok(sc.asset && sc.asset.title.en && sc.asset.title.es && sc.asset.fields.length >= 3, sc.id + " asset");
    for (const f of sc.asset.fields) {
      for (const st of f.states || []) for (const k of Object.keys(st.when || {})) assert.ok(keys.has(k), `${sc.id}: card key ${k} not in state`);
      if (f.states) assert.ok(!f.states[f.states.length - 1].when, sc.id + ": the last state of a field is the default (no when)");
    }
    for (const a of sc.actions || []) {
      assert.ok(a.label.en && a.label.es && a.cmd, `${sc.id}/${a.id} action`);
      for (const k of Object.keys(a.when || {})) assert.ok(keys.has(k), `${sc.id}/${a.id}: key ${k} not in state`);
    }
    assert.ok(sc.codes.length && sc.codes.every((c) => CODE_IDS.has(c)), sc.id + " codes");
    for (const lang of ["en", "es"]) {
      const c = E.cards(E.createSession(sc, lang));
      assert.ok(c.requester.name && c.requester.team && c.requester.location, `${sc.id} (${lang}) requester card`);
      assert.ok(c.asset.title && c.asset.fields.every((f) => f.label && f.value), `${sc.id} (${lang}) asset card`);
    }
  }
  assert.deepEqual(E.SLA, { P1: 20, P2: 30, P3: 45 });
  assert.equal(E.sla(byId["mailbox-full"]), 20);
});

test("the asset card follows the scenario: something is wrong at the start and nothing is wrong once solved", () => {
  for (const sc of SCENARIOS) {
    const start = E.cards(E.createSession(sc, "en")).asset.fields;
    assert.ok(start.some((f) => f.tone === "bad"), sc.id + " shows a problem at the start");
    const end = E.cards(play(sc, sc.solution)).asset.fields;
    assert.ok(!end.some((f) => f.tone === "bad"), `${sc.id} still shows a problem: ${JSON.stringify(end)}`);
    assert.notDeepEqual(start, end, sc.id + " card changes");
  }
});

test("each action is understood by the console whenever the page offers it", () => {
  for (const sc of SCENARIOS) {
    for (let i = 0; i <= sc.solution.length; i++) {
      const probe = play(sc, sc.solution.slice(0, i));
      for (const a of E.cards(probe).actions.filter((x) => x.enabled)) {
        const sess = play(sc, sc.solution.slice(0, i));
        const res = E.act(sess, a.id);
        assert.equal(sess.unknown, 0, `${sc.id}/${a.id} after step ${i} is not recognised`);
        assert.equal(sess.gui, 1);
        assert.equal(res.command, sc.actions.find((x) => x.id === a.id).cmd);
      }
    }
  }
});

test("the unlock button falls into the same trap as the command: the account locks again", () => {
  const sc = byId["ad-lockout"];
  const sess = E.createSession(sc, "es");
  E.act(sess, "unlock");
  assert.equal(E.cards(sess).asset.fields[0].value, "Desbloqueada");
  assert.equal(E.act(sess, "unlock"), null, "hidden while unlocked");
  E.run(sess, "Get-ADUser mgarcia -Properties LockedOut");
  assert.equal(E.cards(sess).asset.fields[0].value, "Bloqueada");
  assert.ok(E.cards(sess).actions[0].enabled);
});

test("three-level result: unresolved, resolved with observations and resolved", () => {
  const sc = byId["print-queue"];
  // closing before the fix: unresolved, with what is missing; it costs 10 points later
  const sess = play(sc, sc.solution.slice(0, 1));
  const early = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "cause-removed", minutes: 3 });
  assert.equal(early.level, "unresolved");
  assert.equal(early.points, 0);
  assert.ok(early.reasons.length === 2 && early.reasons.every((r) => /^Not done: /.test(r)), early.reasons.join(" | "));
  sc.solution.slice(1).forEach((c) => E.run(sess, c));
  const later = E.verdict(sess, E.checkNote(sc, sc.sampleNote.en, "en"), { code: "cause-removed", minutes: 12 });
  assert.equal(later.level, "observations");
  assert.equal(later.points, 90);
  assert.match(later.reasons.join(" "), /Closed once before it was fixed/);

  // fixed, but a weak note, the wrong code and outside the SLA
  const s2 = play(sc, sc.solution, "es");
  const v2 = E.verdict(s2, E.checkNote(sc, "Arreglado.", "es"), { code: "workaround", minutes: 41 });
  assert.equal(v2.level, "observations");
  assert.equal(v2.codeOk, false);
  assert.equal(v2.slaOk, false);
  assert.match(v2.reasons.join(" | "), /Código de resolución: mejor «Causa raíz eliminada»/);
  assert.match(v2.reasons.join(" | "), /fuera del SLA \(41 de 30 min\)/);
  assert.equal(v2.points, 30);   // 100 - 40 (four note elements) - 10 (short) - 10 (code) - 10 (SLA)

  // the reference solution, the sample note, the right code and in time: resolved, 100 points
  for (const d of SCENARIOS) {
    for (const lang of ["en", "es"]) {
      const s = play(d, d.solution, lang);
      const v = E.verdict(s, E.checkNote(d, d.sampleNote[lang], lang), { code: d.codes[0], minutes: E.sla(d) });
      assert.deepEqual([v.level, v.points, v.stars, v.reasons], ["resolved", 100, 3, []], d.id + " " + lang);
    }
  }
});
