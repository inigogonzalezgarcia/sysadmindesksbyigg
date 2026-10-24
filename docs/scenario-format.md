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

## Scoring

100 points, minus 10 per hint, minus 2 per unknown command after the first three, minus 10 per note element missing and minus 10 for a note under 15 words. 90+ is three stars, 70+ two, 40+ one.

## Writing a good desk

- Base it on a real, common ticket, with one cause that the console can reveal and one tempting wrong fix (unlocking without finding the cause, restarting the spooler without clearing the file, raising a quota the licence does not allow).
- Make the user prove the fix (the `verify` stage) before the ticket can be closed.
- Keep the company, people and outputs fictional; no real tenant, domain or person.
- Add tests: the reference solution, and at least one wrong path that must not resolve the ticket.
