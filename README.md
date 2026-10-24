# SysAdmin Desks by IGG

Practise real IT support tickets in a simulated console. Each desk is a ticket from a fictional company: read it, investigate with the commands you would use at work, fix the cause (not only the symptom), prove it works and write the work note. A score and an example note tell you how you did.

Free, no sign-up, English and Spanish. Progress is kept only in the browser. Every desk links to the matching guide on [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/guias.html).

## Desks (v0.1)

| # | Desk | Topic | Level |
|---|---|---|---|
| 1 | The account that locks every morning | Active Directory: lockout events, a scheduled task with an old password | 1 |
| 2 | Internet works, the intranet does not | Network / DNS: public DNS set by hand, DHCP, DNS cache | 1 |
| 3 | Disk full: Excel cannot save | Windows: temp folder, Windows Update cache, leaving the service running | 1 |
| 4 | The reception printer queue that will not empty | Printers: corrupt job, spooler, spool folder | 1 |
| 5 | Customer emails bounce: the sales director's mailbox | Exchange Online: quota, archive, Managed Folder Assistant | 2 |
| 6 | "Your device does not meet requirements" | Intune / BitLocker: compliance, recovery key in Entra ID, MDM sync | 2 |

Each desk has an investigate / fix / verify checklist, hints that cost points, one tempting wrong fix that does not solve the ticket, and a work note checked for cause, change, verification and follow-up.

## How it is built

- Static site in `public/`: `index.html`, `assets/app.js` (interface), `assets/engine.js` (scenario engine, no DOM), `assets/scenarios.js` (the desks as data) and `assets/style.css`.
- No framework, no build step, no external requests. A strict Content Security Policy (no inline scripts or styles) in the page and in `public/_headers`, and no HTML strings: every text is set with `textContent`.
- The engine and the scenarios are shared with the Node tests: `npm test` checks that every desk is complete in both languages, that the reference solution resolves it exactly at its last step, that the example note scores 100, and that the wrong paths do not resolve it.
- [docs/scenario-format.md](docs/scenario-format.md) explains how to write a new desk.

## Run it locally

```bash
npm test                 # 10 tests, Node 18+
npm run serve            # http://localhost:8080
```

## Deploy (Cloudflare Pages)

1. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → this repository.
2. Build settings: framework preset **None**, build command empty, build output directory **`public`**.
3. Deploy. `public/_headers` adds the security headers (CSP, frame-ancestors, nosniff, referrer and permissions policies).

Phase 1 has no back end. Ideas for later: optional accounts with Cloudflare D1, a ticket requester that answers questions (Workers AI), team mode and more desks per guide topic.

## Status

Private while in development. Fictional company (Contoso) and people; no real systems or data.
