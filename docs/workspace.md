# The workspace (v0.9): work kept across a reload, the mailbox, preferences and free tickets

Four DOM-free modules, `require`-able in Node and exposed on `window` in the app. Everything they produce is kept **only in this browser** (`localStorage`); nothing reaches the D1 server, and deleting the account removes it.

## Work kept across a reload ([persist.js](../public/assets/persist.js), `window.SDPersist`)

| Key | What |
|---|---|
| `sd.live` | `{deskId: envelope}`: each ticket in progress (`ticketToJSON(lv)`): its session (`sessionToJSON`: `desk`, `fp`, `state`, `history`, `used`, `hints`, `unknown`, `resolved`, `resolvedAt`, `gui`, `failedCloses`, `net`, `term {stack, home}`, `ships`), the console lines (last 400), the command history (last 100), the view (`console` or `desk`), the open windows of the desk and the draft of the closure |
| `sd.room` | envelope with the network room outside tickets: `{net, sel, cli: {dev, stack, log, hist} | null}` (a CLI that runs on a ticket is not kept) |
| `sd.labbox` | `{labId: envelope}`: each lab's sandbox (`labToJSON`: world, or network and SSH sessions, or rule session; `seen`; console and history) |

- **Envelope**: `{ v: FORMAT, u: owner, at, data }`. `owner(email)` is an FNV-1a hash of the lower-cased email (a label, not security): `unpack(env, {owner})` returns `null` for another format or another owner, so a second account in the same browser starts clean.
- **Versioning**: `fingerprint(sc)` hashes a desk's id, ticket, state keys, number of rules and events, devices and shipment flags. A session saved for another fingerprint is dropped (the ticket starts fresh, as before v0.9) instead of being half-applied. A network must have exactly this version's devices and every host.
- **Lifecycle in the app**: written after every command, card action, desk action, shipment button, view change and (debounced) draft edit, and on `pagehide`; `prune(map, openIds)` keeps only tickets that still have a workflow record. Closing a ticket, *Restart* and replaying remove its entry; signing out clears `sd.live`; *My account → Preferences → Clear saved work* removes the three keys.
- Tests (`tests/persist.test.js`): every desk resolves at its last step after half the solution, a JSON round trip and the rest; tempting fixes, hints and failed closes survive; foreign or outdated snapshots are refused; the room keeps a change, *Unsaved changes* and an open CLI in config mode; the three kinds of lab come back.

## The mailbox ([mail.js](../public/assets/mail.js), `window.SDMail`, `sd.mailbox`)

State `{ v, at: {mailId: "archive" | "spam"}, star: [mailId], sent: [item], seq }` (a message not in `at` is in the Inbox). A sent item: `{ id: "s-<n>", kind: "reply" | "new", re, to, toName, subject, body, at, template, flags }`.

- Folders `inbox`, `starred` (starred and not in Spam), `sent`, `archive`, `spam`; `list(st, folder)` sorts by day and time, newest first; `counts(st, read)` gives each folder's size and the unread messages in the Inbox (the sidebar badge).
- `move`, `toggleStar`, `notSpam`; `report(st, msg)` moves to Spam and returns the exercise answer `report` with its grade (growth.js), which the app records like any other answer (activity, streak, badges).
- `templates(msg, lang, {ticket, prio, me})`: with a ticket, *ack* (ready to send), *info* and *done* (with `[gaps]`), and always *thanks*. `reply(st, msg, {text, template, now}, lang)` checks length (10+) and gaps, sends to the Reply-To and flags `phish-reply` for `phishing` and `impersonation`, plus `lint(text)`: `password` and `secret` (a one-time code).
- `contacts(people, lang)`: the team mailboxes (`TEAMS`) and the directory's people without service or admin accounts; `compose(st, {to, subject, body}, contacts)` with errors `to`, `subject`, `empty`, `gaps`.

## Preferences ([prefs.js](../public/assets/prefs.js), `window.SDPrefs`, `sd.prefs`, `sd.remind`)

`{ v, reminder: {on, time: "HH:MM", notify}, sounds, tz, motion }`, always normalised (`notify` only with the reminder on; an unknown zone becomes `""`, the browser's).

- Time zones with `Intl` only: `dayIn(ms, tz)`, `timeIn(ms, tz, seconds)`, `minuteOfDay`, `offsetLabel` ("UTC+01:00"), `zones()` (a short common list first, then `Intl.supportedValuesOf("timeZone")`). The app uses the chosen zone for the SLA due time, the Activity timelines, the desk clock and the days written to `sd.activity` (so the streak and the weekly goal follow it).
- `reminderDue(prefs, now, {lastShown}, practisedToday)`: on, the time has passed today in the zone, not yet shown or dismissed today, and nothing practised today. `reminderShown` marks the day. The browser notification (`notify`) asks for permission only when it is turned on, fires once a day while the page is open, and there is no push server.
- `SOUNDS` / `sound(prefs, kind)`: `resolved`, `badge`, `task`, `complete` as short `[{f, d, at}]` blips (≤ 0.2 s each), played by the app with WebAudio only when `sounds` is on (off by default).

## Free tickets ([freetix.js](../public/assets/freetix.js), `window.SDFree`, `sd.free`)

Store `{ v, seq, list }`; a ticket `{ id: "FREE-0001", subject, requester (directory sam), priority P1-P3 (SLA 20/30/45 min), category, description, created, rec (workflow.js record), notes: [{at, text}], closed: {at, code, note, minutes, slaOk} | null, free: true }`.

- `create(store, input, people, now)` validates (`subject` 5+, `requester`, `priority`, `category`, `description` 10+); `assign`, `move(store, id, to, {now, reason})` (workflow.js rules: a pending state needs a 15+ character reason and pauses the SLA), `addNote` (assigned only), `close(store, id, {code, note}, now)` (in progress only, `CODES`, a 10+ character resolution), `remove`.
- Never graded: no points, no stars, nothing in `sd.progress`, `sd.activity` or the badges. The queue shows them with a *free ticket* mark in Open and Closed.
