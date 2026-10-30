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

## Knowledge base

- `qualifies(level, note)`: an article is saved when the ticket is not `unresolved` and `note.missing` is empty.
- `structure(sc, text)` splits the note into sentences (and before an inline `Cause:` / `Causa:` label) and puts each one under `cause`, `fix`, `verify`, `followup` or `other`, scoring the keywords of the desk's note elements (their `kb` field) and a few general words. Sentences are kept as written.
- `saveArticle(kb, rec)` versions: v1.0, then v1.1, v1.2… for each newer note; the same note again changes nothing.
- `buildArticle(sc, entry, lang, codeLabel)`, `toMarkdown(article)` and `fileName(article)` (`kb-INC-20418-v1.1.md`).

## Mail messages (`MAIL`)

```js
{ id: "ceo-phish", kind: "phishing",            // "request" | "phishing" | "impersonation" | "notice" | "legit"
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

## Badges (`BADGES`)

Each badge has `id`, `icon`, `name {en, es}`, `rule {en, es}` and `test(facts)`, where `facts(...)` gathers the tickets closed, the desks with a best result, the number of articles, the mail answers and the best streak. `award(prev, facts, day)` adds the new ones with the day.

v0.6.1 adds the badge `communicator` (*Clear communicator*: three different tickets with `userNote` 5) and `commsStats(activity)` → `{useful, notes, average}` for the *Communication* tile on the progress page.
