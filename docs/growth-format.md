# Progress and knowledge data (`growth.js`)

`public/assets/growth.js` (exposed as `window.SDGrowth`, and `require`-able in Node) holds the logic and the data of v0.4. It has no DOM: the app (`app.js`) stores everything in `localStorage` and the tests in `tests/growth.test.js` use the same code.

## What the browser keeps

| Key | What |
|---|---|
| `sd.kb` | `{deskId: {deskId, ticketId, version, day, code, points, lang, note, history: [{version, day, points}]}}`: one article per desk; the note is the user's text |
| `sd.activity` | `[{type: "ticket" \| "mail", id, day, ...}]`: a ticket closed fixed (with `level`, `points`, `hints`, `slaOk`, `codeOk`, `code`, `noteComplete`, and since v0.6.1 `userNote` (0-5 or null), `useful`, `bad`, `asked`, `bonus`) or a mail exercise answered (`result`). Days are local `YYYY-MM-DD` |
| `sd.mail` | `{mailId: {answer, result, day, tries}}`: the latest answer to each message |
| `sd.mailRead` | ids of the messages opened (for the unread count) |
| `sd.badges` | `{badgeId: day}`: badges stay earned once awarded |
| `sd.goal` | the weekly goal, 1 to 7 (default 3) |
| `sd.ships` | practice shipments (v0.7b, see shipping.md) |
| `sd.labs` | the lab tasks done (v0.8, see labs.md) |
| `sd.tourDone`, `sd.whatsNew` | the guided tour was taken or skipped; the version whose "what's new" card was seen (v0.8; "0.9" now) |
| `sd.mailbox` | the mailbox (v0.9, mail.js): folders, stars and the messages sent, see workspace.md |
| `sd.free`, `sd.prefs`, `sd.remind`, `sd.side` | free tickets, preferences, the day the reminder was last shown, the folded sidebar (v0.9, see workspace.md) |
| `sd.live`, `sd.room`, `sd.labbox` | the work kept across a reload (v0.9, persist.js, see workspace.md) |
| `sd.level` | the id of the level last shown (v0.9b), so a level-up is celebrated once |
| `sd.weekly` | `{v: 1, weeks: {"2026-W44": {goals: [3 goal ids], done: {goalId: day}}}}`: the weekly goals and when each reward was credited (v0.9b) |
| `sd.shifts` | the labs' full shifts (v0.9b, see labs.md), in a persist.js envelope with the owner |

Since v0.9b `sd.activity` also holds `{type: "lab", id: "<lab>:<task>", lab, day}` for each lab task done and `{type: "attempt", id, day, failed}` for each attempt to close a ticket that was not fixed. Neither makes a day for the streak nor counts for the 1-7 weekly target (`activeDays` and `week` only count `ticket` and `mail`). A ticket close also records `failed` (the failed closes before it).

Since v0.9 the days (`day`) are calendar days in the time zone chosen in Preferences (the browser's by default), from `prefs.js`'s `dayIn(ms, tz)`; `dayOf()` is still the browser's local day.

## Knowledge base

- `qualifies(level, note)`: an article is saved when the ticket is not `unresolved` and `note.missing` is empty.
- `structure(sc, text)` splits the note into sentences (and before an inline `Cause:` / `Causa:` label) and puts each one under `cause`, `fix`, `verify`, `followup` or `other`, scoring the keywords of the desk's note elements (their `kb` field) and a few general words. Sentences are kept as written.
- `saveArticle(kb, rec)` versions: v1.0, then v1.1, v1.2… for each newer note; the same note again changes nothing.
- `buildArticle(sc, entry, lang, codeLabel)`, `toMarkdown(article)` and `fileName(article)` (`kb-INC-20418-v1.1.md`).

## Mail messages (`MAIL`)

```js
{ id: "ceo-phish", kind: "phishing",            // "request" | "phishing" | "impersonation" | "notice" | "legit" | "external" (v0.9)
  ticket: "print-queue",                       // requests only: the desk "Create ticket from this message" opens
  day: "2026-10-26", time: "09:05",
  directory: "psanchez",                       // the sender's account in the directory (world.js), or null
  claims: "cmartin",                           // optional: who the sender pretends to be
  dirNote: { en, es },                         // optional: text for a sender that is not a user (a team mailbox)
  link: { href: "#/directory", label: { en, es } },   // optional: where to go after the right answer
  from: { name: "…" | { en, es }, address }, to, cc,
  subject: { en, es }, body: { en: ["paragraph", "with a link [[0]]"], es: [...] },
  links: [{ text: "what the link says", href: "where it really goes" }],
  headers: { replyTo, returnPath, received, spf, dkim, dmarc },   // "pass" | "fail" | "none" | "softfail"
  options: [{ id, result: "correct" | "partial" | "wrong", label: { en, es }, why: { en, es } }],   // 3-4, one correct
  clues: { en: [...], es: [...] }, procedure: { en, es } }
```

- Keep every address and domain fictional: `contoso.com`, a look-alike such as `contoso-it-support.com`, and the reserved `.example` domain; IPs from `10.x` and the documentation ranges `203.0.113.x` and `198.51.100.x`. The tests check it.
- Keep a balance: at least one urgent message that is genuine, so the exercise does not teach that everything is phishing.
- `external` (v0.9): a genuine message from outside (a vendor, the carrier): its own `.example` domain, every check passes, the links go where they say, a `dirNote` explains why the sender is known, and reporting it is never the right answer. Its look-alike counterpart is `phishing`.
- Every message has a `report` option: *Report as spam / phishing* in the mailbox (mail.js) answers the exercise with it.
- v0.9 adds `net-change` (CHG-4471 completed, desk 21), `vendor-rma` (an approved service request for LAPTOP-0251), `courier-pickup` (a TransIbérica Express pickup, `TIX` + nine digits), `cab-reminder` and `courier-phish` (a fake customs fee from `transiberica-aduanas.example`). The badge *Sharp eye* needs every `phishing` message answered right.

## Badges (`BADGES`)

Each badge has `id`, `icon`, `name {en, es}`, `rule {en, es}` and `test(facts)`, where `facts(...)` gathers the tickets closed, the desks with a best result, the number of articles, the mail answers and the best streak. `award(prev, facts, day)` adds the new ones with the day.

v0.6.1 adds the badge `communicator` (*Clear communicator*: three different tickets with `userNote` 5) and `commsStats(activity)` → `{useful, notes, average}` for the *Communication* tile on the progress page.

## Levels, weekly goals, counters and more badges (v0.9b, [levels.js](../public/assets/levels.js), `window.SDLevels`)

- `points({desks, progress, activity, labs, weekly, shifts})` → `{tickets, labs, comms, goals, shifts, total}`: the best result of each desk of this version (`sd.progress`), 10 per lab task (`LAB_TASK_POINTS`), the best `bonus` (0-10) among each desk's closes, `goalPoints(weekly)` and `shiftPoints(shifts)` (75 per lab with a finished shift). Free tickets are never in any of these.
- `LEVELS`: `intern` 0, `l1` 200, `l1s` 600, `l2` 1200, `sys` 1900, `infra` 2700 (`name` and `short`, ES/EN). `level(total, lang)` → `{index, id, name, short, min, total, next, into, span, toNext, pct}`. `levelUp(seen, total)` → `{up, from, to, seen}`: nothing is celebrated without a seen level (the first time) or when points go down.
- `closeCounts(activity)` → `{clean (level "resolved"), remarks (level "observations"), false (attempts), total}`.
- `POOL`: twelve goals `{id, points, target, label, count(week)}` where `week` = this ISO week's `closes`, `mail` and `labs` activity and the desk `levels`. `goalsFor(weekKey)`: three distinct goals from an FNV-1a hash of the key and an LCG (the same for everyone that week). `weekAt(ms, tz)`: the ISO week in the time zone of Preferences. `goalProgress(weekKey, activity, {weekly, lang, levels})`, `claim(store, weekKey, activity, {day, levels})` → `{store, fresh, points}` (idempotent: a goal is credited once, and a stored week keeps its goals), `normaliseWeekly`, `fullWeeks`, `history(store, currentWeek)`.
- Badges: `EXTRA` adds `master-<area>` (every desk of the area with 90 or more), `notes-5` and `kb-10` (documentation), `week-1`, `week-4`, `week-12` (weeks with every goal done) and `shift-<lab>`; `ALL` = `BADGES` + `EXTRA`, each with a `group` (`core`, `area`, `docs`, `goals`, `shift`). `facts(o)` extends growth.js's facts with `points`, `notesComplete`, `fullWeeks` and `shifts`; `award` and `badges` work like growth.js's over `ALL`. The badge `full-shift` (every ticket closed) keeps its id and is now named *Queue cleared / Cola despejada*.
