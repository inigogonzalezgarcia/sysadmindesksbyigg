# Scenario format

Scenarios live in `public/assets/scenarios.js`. Each one is plain data that the engine (`public/assets/engine.js`) plays. Adding a desk means adding one object and its tests; the interface does not change.

## Fields

| Field | What |
|---|---|
| `id` | Short slug, used in the URL (`#/desk/<id>`) and as the progress key |
| `level`, `minutes`, `topic` | Level 1 (first-line support) or 2 (second line), estimated time, topic label `{en, es}` |
| `title` | `{en, es}` |
| `guide` | Link to the related guide on the website (`https://inigogonzalezgarcia.github.io/guias/<slug>.html`) |
| `machine` | `host`, `user`, `domain`, `shell` (`powershell` or `bash`, used for the "not recognised" message) and `prompt` |
| `ticket` | `id`, `from`, `priority` (P1-P3), `subject` and `body` `{en, es}` |
| `intro` | What the engineer has (access, servers, constraints) `{en, es}` |
| `state` | The initial flags, e.g. `{ locked: true, taskDisabled: false }` |
| `commands` | Rules, tried in order; the first that matches wins (see below) |
| `events` | Rules that fire at the start of the next command when their `when` matches (e.g. "the account locks again") |
| `goal` | Flags that must all be true for the ticket to be resolved |
| `stages` | Investigate / fix / verify checklist: each stage is done when its `when` flags match |
| `resolved` | Message shown when the goal is met `{en, es}` |
| `hints` | Ordered hints `{en, es}`; each one used costs 10 points |
| `note` | Elements a good work note must contain: `label {en, es}` and `any` (keywords in English or Spanish, accents ignored) |
| `solution` | A reference path; the tests play it and expect the ticket to be resolved exactly at the last command |
| `sampleNote` | An example work note `{en, es}`; the tests expect it to cover every note element |
| `requester` | The person on the ticket: `name`, `team`, `location` (text or `{en, es}`), `user` and `device` |
| `asset` | The card for what the ticket is about: `title {en, es}` and `fields` (see below) |
| `actions` | Buttons on the ticket page: `id`, `label {en, es}`, `cmd` (the console command it runs) and an optional `when` |
| `codes` | The resolution codes that fit this ticket (ids from `CODES` in the engine); the first one is suggested when another is chosen |

## Command rules

```js
{ id: "unlock", match: /^unlock-adaccount\b.*\bmgarcia\b/, when: { taskDisabled: true }, unless: { ... },
  set: { locked: false }, out: ["console line", "..."], say: { en: "...", es: "..." }, error: false }
```

- `match`: regular expression, case-insensitive, tested against the command with spaces collapsed. Write it to accept the common variants (PowerShell and cmd, with or without parameters names).
- `when` / `unless`: flags that must (or must not all) match.
- `out`: console output, the same in both languages (consoles are in English). `{user}`, `{host}` and `{domain}` are replaced.
- `say`: narration in the user's language, shown in a different colour. Use it to explain what the output means, never to give the next command away.
- `error: true` shows the output as an error.

Built-in commands: `help`, `hint`, `clear` / `cls`, `ticket`. Anything that matches no rule shows the shell's "not recognised" message and counts as an unknown command (2 points each after the first three).

## Asset card and actions

```js
asset: { title: { en: "User account · mgarcia", es: "Cuenta de usuario · mgarcia" }, fields: [
  { label: { en: "Account", es: "Cuenta" }, states: [
    { when: { locked: true }, value: { en: "Locked", es: "Bloqueada" }, tone: "bad" },
    { value: { en: "Unlocked", es: "Desbloqueada" }, tone: "ok" }] },
  { label: { en: "Password last set", es: "Último cambio de contraseña" }, value: "19/10/2026 08:12" },
] },
actions: [{ id: "unlock", label: { en: "Unlock account", es: "Desbloquear cuenta" }, cmd: "Unlock-ADAccount mgarcia", when: { locked: true } }],
```

- A field is a fixed `value`, or `states`: the first whose `when` matches the session is shown, and the last one (without `when`) is the default. `tone` is `ok`, `warn`, `bad` or `muted`.
- The tests expect at least one `bad` field at the start and none once the reference solution has run, so the card shows the fix.
- An action runs its `cmd` through the engine, so the button and the command always give the same result (including the traps: unlocking from the card before removing the cause locks the account again). The tests check every action is understood whenever it is offered.

## Closing a ticket

- **SLA:** it starts when the user assigns the ticket: 20 minutes for P1, 30 for P2 and 45 for P3.
- **Resolution codes:** root cause removed, configuration corrected, space or quota freed, device brought into compliance, workaround, user guidance, no fault found.
- **Result** (`verdict` in the engine), in three levels:
  - *Not resolved* when the goal is not met: it lists the stages not done, the ticket stays open and each early close costs 10 points later.
  - *Resolved with observations* when it is fixed but the note misses something, the code does not fit, the SLA was missed or it was closed early before.
  - *Resolved* when none of that happened.

## Scoring

100 points, minus 10 per hint, minus 2 per unknown command after the first three, minus 10 per note element missing and minus 10 for a note under 15 words. On the ticket page, also minus 10 for a resolution code that does not fit, minus 10 outside the SLA and minus 10 per time it was closed before it was fixed. 90+ is three stars, 70+ two, 40+ one.

## Writing a good desk

- Base it on a real, common ticket, with one cause that the console can reveal and one tempting wrong fix (unlocking without finding the cause, restarting the spooler without clearing the file, raising a quota the licence does not allow).
- Make the user prove the fix (the `verify` stage) before the ticket can be closed.
- Keep the company, people and outputs fictional; no real tenant, domain or person.
- Add tests: the reference solution, and at least one wrong path that must not resolve the ticket.
