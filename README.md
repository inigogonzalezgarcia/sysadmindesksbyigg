# SysAdmin Desks by IGG

Practise real IT support tickets in a simulated console. Each desk is a ticket from a fictional company: read it, investigate with the commands you would use at work, fix the cause (not only the symptom), prove it works and write the work note. A score and an example note tell you how you did.

**Live: [sysadmindesksbyigg.pages.dev](https://sysadmindesksbyigg.pages.dev)**

Free, in English and Spanish. The home page explains how it works; you clock in with a free account (email and password, or Google) and your progress follows you to any device. Every desk links to the matching guide on [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/guias.html), and the guides link back to their desk.

## Desks

| # | Desk | Topic | Level |
|---|---|---|---|
| 1 | The account that locks every morning | Active Directory: lockout events, a scheduled task with an old password | 1 |
| 2 | Internet works, the intranet does not | Network / DNS: public DNS set by hand, DHCP, DNS cache | 1 |
| 3 | Disk full: Excel cannot save | Windows: temp folder, Windows Update cache, leaving the service running | 1 |
| 4 | The reception printer queue that will not empty | Printers: corrupt job, spooler, spool folder | 1 |
| 5 | Customer emails bounce: the sales director's mailbox | Exchange Online: quota, archive, Managed Folder Assistant | 2 |
| 6 | "Your device does not meet requirements" | Intune / BitLocker: compliance, recovery key in Entra ID, MDM sync | 2 |

Each desk has an investigate / fix / verify checklist, hints that cost points, one tempting wrong fix that does not solve the ticket, and a work note checked for cause, change, verification and follow-up.

## Accounts

- **Home page:** a landing page for signed-out visitors (what a desk looks like, the four steps of a ticket, and a call to start), then the sign-in page: create an account with a technician name, one of eight avatars, email and password (8+ characters, a capital letter and a number, checked as you type), or continue with Google. A desk linked from a guide opens right after signing in.
- **Backend:** Cloudflare Pages Functions in `functions/api` with a D1 database bound as `DB`. The tables are created on first use.
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`;
  - `GET /api/me` (who is signed in, and their progress), `DELETE /api/me` (delete the account and everything in it);
  - `PUT /api/progress` (keeps the best result per desk);
  - `GET /api/auth/google` and its callback.
- **Security:**
  - passwords stored only as salted PBKDF2-SHA256 hashes (100,000 iterations);
  - sessions are a random token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, and only its SHA-256 is stored;
  - state-changing requests must come from the site's own origin;
  - failed sign-ins are limited per email and per IP (8 in 15 minutes);
  - Google sign-in uses a `state` cookie and only accepts verified emails;
  - the same strict CSP as before, with no third-party scripts.
- **Progress:** when you sign in, anything better in the browser is added to the account.
- **Privacy:** [public/privacy.html](public/privacy.html) explains what is stored and why; the account page deletes everything.

## How it is built

- Static site in `public/`: `index.html`, `assets/app.js` (interface), `assets/engine.js` (scenario engine, no DOM), `assets/scenarios.js` (the desks as data) and `assets/style.css`.
- No framework, no build step, no external requests. A strict Content Security Policy (no inline scripts or styles) in the page and in `public/_headers`, and no HTML strings: every text is set with `textContent`.
- The engine and the scenarios are shared with the Node tests: `npm test` checks that every desk is complete in both languages, that the reference solution resolves it exactly at its last step, that the example note scores 100, and that the wrong paths do not resolve it.
- [docs/scenario-format.md](docs/scenario-format.md) explains how to write a new desk.

## Run it locally

```bash
npm test                 # 16 tests: the desks, and the accounts against an in-memory database (Node 22+)
npm run dev              # http://localhost:8788 with accounts, in-memory database
npm run serve            # http://localhost:8080, static only (no accounts)
```

## Deploy (Cloudflare Pages)

The live site is deployed by Cloudflare Pages on every push to `main`. To deploy your own copy:

1. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → this repository.
2. Build settings: framework preset **None**, build command empty, build output directory **`public`**.
3. Deploy. `public/_headers` adds the security headers (CSP, frame-ancestors, nosniff, referrer and permissions policies). `functions/` is deployed with the site.
4. Accounts: create a D1 database (Workers & Pages → D1) and bind it to the Pages project as `DB` (Settings → Bindings → D1 database), then redeploy.
5. Google (optional): create an OAuth client of type "Web application" in Google Cloud with the redirect URI `https://<your-site>/api/auth/google/callback`. In the Pages project, add `GOOGLE_CLIENT_ID` as a variable and `GOOGLE_CLIENT_SECRET` as a secret (Settings → Variables and Secrets). Without them, the Google button says it is not ready.

Ideas for later: password reset by email, a ticket queue with SLA and a ticket page, a simulated directory, a personal knowledge base from your work notes, and more desks per guide topic.

## Status

Version 0.2, in development: landing page and accounts. More desks are coming. Fictional company (Contoso) and people; no real systems or data.

## Contact

Ideas for a desk, or want one adapted to your team's tickets?

- Website (contact form): [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/about.html#contacto)
- LinkedIn: [linkedin.com/in/igonzalez93](https://www.linkedin.com/in/igonzalez93)
