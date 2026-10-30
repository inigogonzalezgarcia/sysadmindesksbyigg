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
| 7 | Working from home: the VPN will not connect | Cisco Secure Client (AnyConnect): system clock and certificate validation | 1 |
| 8 | New starter without Outlook or Teams | Microsoft 365: group-based licensing, no seats left, a leaver's direct licence | 1 |
| 9 | The invoices mailbox does not appear in Outlook | Exchange Online: FullAccess vs SendAs, automapping | 1 |
| 10 | Created in AD this morning, missing in Microsoft 365 | Azure AD Connect: OU filtering, delta sync | 2 |
| 11 | Three nights without a backup of the file server | Veeam: repository full of a deleted job's backups | 2 |
| 12 | Installed, but Software Center says 'Failed' | MECM: detection method of an outdated product code | 2 |
| 13 | 502 Bad Gateway: the timesheets app is down | Red Hat: /var full, logrotate, deleted files still held open | 2 |
| 14 | The CRM in Citrix stays on 'Starting...' | Citrix: unregistered VDA and a stuck disconnected session | 2 |
| 15 | Abroad and locked out of Microsoft 365 | Entra ID Conditional Access: blocked country, time-bound exception with PIM | 2 |
| 16 | Nobody can sign in to Expenses with SSO | Entra ID SAML: expired signing certificate, the new one never activated | 2 |
| 17 | The payroll SFTP server rejects AD accounts | Linux joined to AD (SSSD): clock skew and Kerberos | 2 |
| 18 | The ERP cannot save: transaction log full | SQL Server: error 9002, failing log backup job | 2 |

Each desk has an investigate / fix / verify checklist, hints that cost points, one tempting wrong fix that does not solve the ticket, and a work note checked for cause, change, verification and follow-up.

## The help desk

- **Ticket queue:** the desks are tickets in a table with ID, requester, priority, SLA, status and assignee; Open and Closed tabs.
- **Ticket page:** press *Assign to me* and the SLA starts (20 min for P1, 30 for P2, 45 for P3) and the console unlocks. Cards for the requester and for the account, device, queue or mailbox update as you work ("Locked" turns into "Unlocked", the free space grows), and a few actions can be run from the card with the same effect as the command.
- **Workflow states (v0.6):** *New*, *In progress*, *Pending user*, *Pending vendor* and *Closed*, each with its own badge in the queue and on the ticket page.
  - *Set pending* asks for the state and a short reason (15+ characters). While pending, the SLA is paused (the counter freezes and shows "Paused" with the time on hold), the console and the actions are read-only, and the ticket cannot be resolved; *Resume* carries on from where the SLA stopped.
  - *Unassign* sends the ticket back to New; the SLA keeps running, as on a real desk, and the console stays as it was.
  - Every change goes into the ticket's **Activity** timeline (time, from → to, reason). It lives in the browser with the ticket (`localStorage`, `sd.work[<desk>]`) and starts again when the ticket is replayed.
  - Scoring: the SLA minutes exclude the paused time, so a pause is never penalised; the result shows the total time on hold. The state machine and the SLA arithmetic are in [assets/workflow.js](public/assets/workflow.js) (no DOM), tested in `tests/workflow.test.js`.
- **Contact the requester (v0.6.1):** on a ticket in progress, *Contact the requester* opens a conversation with them (the requester card's name and initials; a named receptionist or night operator on the two desks whose requester is a desk or a report). You pick from 5-7 scripted questions per desk, in Spanish and English (no free text, no AI):
  - *useful* ones reveal a clue the console does not give, which goes into **What you know** on the ticket page; *neutral* ones are true but do not help; *bad* ones (leading, blaming, jargon, or asking for the password, which is a bad option on every desk) get a realistic answer and are flagged with the reason;
  - each question costs **1 minute of SLA** (added to the SLA used, so the counter jumps) and goes into the Activity timeline as "Contact: <question>"; a ticket that is New or pending cannot contact (the button says why);
  - **Ask to confirm** appears only after a fix: the requester says it works, or, after the tempting fix, that it fails again. It is never required: the console still solves every ticket on its own, and the conversation never changes the console;
  - the conversation lives in the ticket's record in the browser (`sd.work[<desk>].contact`, with the extra minutes in `extraMs`) and starts again when the ticket is replayed. Logic in [assets/comms.js](public/assets/comms.js) (no DOM), tested in `tests/comms.test.js`.
- **Note to the user (v0.6.1):** the resolve panel has a second field, what the requester will read, with four templates (resolved with an explanation, resolved with one step for the user, workaround and follow-up, could not reproduce) whose `[gaps]` must be replaced. It is marked x/5 with five plain rules: the requester's name; what was wrong in plain words (a cause phrase, and no jargon such as spooler, GPO, SPN, Kerberos, DNS, registry or PowerShell unless explained right after, in brackets or with "that is"); what they have to do next or that nothing is needed; no internal details (server names, admin and service accounts, passwords and keys, private IPs, GUIDs, UNC paths); and ready to send (no gaps, 120-900 characters). A live checklist shows the rules while you type.
  - **Scoring:** the verdict and the 0-100 ticket score do not change. The result shows *Work note x/y* and *Note to the user x/5* side by side and a separate **communication bonus** (0-10, not added to the score): note 5/5 +5, 4/5 +3, 3/5 +1; at least one useful question and no bad one +3; the requester confirmed it works +2. Remarks: no note for the user, asking for a password, other bad questions. The user note is not saved in the knowledge base.
  - **Progress** shows a *Communication* tile (useful questions asked, average user-note mark) and the badge *Clear communicator* (three different tickets with a 5/5 note for the user), kept in the browser like the rest of the growth data.
- **Closing:** choose a resolution code and write the work note. The result has three levels: *Resolved*, *Resolved with observations* (note, code, SLA or an earlier early close) or *Not resolved* (what is still to do; the ticket stays open).
- **Progress page** with your best result per ticket, and a 7-step **welcome tour** you can skip or take again from the sidebar.

## The tools

- **Directory:** Contoso's Active Directory, simulated, with the same people and computers as the tickets. Browse the OUs, search, open a user, group or computer; unlock, reset a password (with "must change at next sign-in"), enable or disable, add to or remove from groups. Every button runs a PowerShell command and shows it in the console below, where the same commands can be typed (`Get-ADUser`, `Search-ADAccount -LockedOut`, `Add-ADGroupMember`...). Four practice requests (a locked-out user, VPN access, a password reset, a leaver) tick themselves when done either way. An account that belongs to an open ticket shows that ticket's state, and its commands go to the ticket.
- **Go to the desk:** for the tickets on a user's machine (DNS, disk, BitLocker), a simulated desktop with apps such as Network settings, a browser, Storage, Services, BitLocker, Company Portal and the Event Viewer. Each button runs the same command as the console, so the traps are the same.
- **Inventory:** servers and printers with role, IP, location, owner and status, linked to the tickets (the reception printer shows "Error" while its ticket is open).

## Accounts

- **Home page:** a landing page for signed-out visitors (what a desk looks like, the four steps of a ticket, and a call to start), then the sign-in page: create an account with a technician name, one of eight avatars, email and password (8+ characters, a capital letter and a number, checked as you type), or continue with Google. A desk linked from a guide opens right after signing in.
- **Backend:** Cloudflare Pages Functions in `functions/api` with a D1 database bound as `DB`. The tables are created on first use.
  - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`;
  - `POST /api/auth/forgot` (`{email, lang}`: emails a reset link; always the same answer) and `POST /api/auth/reset` (`{token, password}`), see *Password reset* below;
  - `GET /api/me` (who is signed in, and their progress), `DELETE /api/me` (delete the account and everything in it);
  - `PUT /api/progress` (keeps the best result per desk);
  - `GET /api/auth/google` and its callback.
- **Security:**
  - passwords stored only as salted PBKDF2-SHA256 hashes (100,000 iterations);
  - sessions are a random token in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie, and only its SHA-256 is stored;
  - state-changing requests must come from the site's own origin;
  - failed sign-ins are limited per email and per IP (8 in 15 minutes);
  - Google sign-in uses a `state` cookie and only accepts verified emails;
  - password reset links are single-use, expire after 30 minutes and are stored only as a SHA-256 hash; resetting closes every session of the account;
  - a strict CSP with no inline code; the only third-party script allowed is Google Analytics, and only after consent (see *Cookies*).
- **Progress:** when you sign in, anything better in the browser is added to the account.
- **Privacy and terms:** [public/privacy.html](public/privacy.html) explains what is stored, why, for how long (including the minimum age of 14 and international transfers), and [public/terms.html](public/terms.html) sets the terms of use; the sign-up form links to both, and the account page deletes everything.

## Password reset (v0.6)

*Forgot your password?* on the sign-in tab asks for the email and calls `POST /api/auth/forgot`.

- The answer is always the same generic 200 ("if there is an account with that email, we have sent a link"), for unknown emails too, so it does not tell who has an account. The origin check applies.
- If the account exists and has a password, a token of 32 random bytes (base64url) is created and only its SHA-256 is stored, with the user, an expiry of 30 minutes and a used flag; earlier unused links of that user stop working. Accounts that only sign in with Google have no password: nothing is sent.
- Limits: 3 requests per email per hour and 10 per IP per hour (`CF-Connecting-IP`); over the limit the answer is still the generic 200.
- The email goes through Brevo's transactional API (`POST https://api.brevo.com/v3/smtp/email`, header `api-key`), in the language picked in the app, with the link `https://<site>/?lang=es#/reset?token=…` (the token is in the fragment, so it never reaches server logs; the app drops it from the address bar at once).
- `POST /api/auth/reset` checks the token (hash, expiry, single use), stores the new password like sign-up (PBKDF2), marks the link used, deletes **all** the user's sessions and clears the account's failed sign-ins. Any problem with the link is a generic 400 `reset_invalid`.
- D1 tables, created on first use like the others: `resets (token_hash, user_id, expires_at, used, created_at)` and `reset_requests (k, ts)`. Both are cleaned up opportunistically after 24 hours (on every reset request).

**Configuration** (Cloudflare → Workers & Pages → the project → Settings → Variables and secrets, for Production and, if you use it, Preview; then redeploy):

| Name | Type | What |
|---|---|---|
| `BREVO_API_KEY` | Secret | A Brevo API key (Brevo → SMTP & API → API keys) |
| `MAIL_FROM` | Variable | The sender address, a sender or domain verified in Brevo |
| `MAIL_FROM_NAME` | Variable, optional | The sender name; default `SysAdmin Desks` |

Until `BREVO_API_KEY` and `MAIL_FROM` exist, `/api/auth/forgot` answers 503 `{error: "reset_unavailable"}` and the app says reset by email is not available yet. Keys and tokens are never written to the logs.

## Cookies

- **Necessary:** the session cookie `sd_session` (and a temporary one during Google sign-in). No permission needed.
- **Analytics, opt-in:** [assets/consent.js](public/assets/consent.js) shows a notice (Reject / Settings / Accept analytics) and loads Google Analytics 4 only after the visitor accepts, with consent mode denied by default, Google signals and ad personalisation off, and one page view per route (`#/...`). Rejecting loads nothing from Google and removes any `_ga` cookie. The choice is kept in `localStorage` (`sd.consent`) for 6 months, and *Cookie settings* in every footer and in *My account* reopens it.
- `GA_ID` at the top of `consent.js` holds the measurement ID; while it is empty there is no notice and no analytics.

## Progress and knowledge (v0.4)

Everything here is kept only in the browser (`localStorage`, keys `sd.kb`, `sd.activity`, `sd.mail`, `sd.mailRead`, `sd.badges`, `sd.goal`); the account backend is unchanged.

- **Knowledge base** (`#/kb`, `#/kb/<desk>`): closing a ticket fixed with a note that covers every element saves an article for that desk: title, symptom and environment from the ticket, and the cause, fix, verification and follow-up taken from your own sentences (sorted by the note elements, never reworded), with the resolution code, date, ticket, version and the related guide. A newer approved note is a new version (v1.0, v1.1…). Search and filter by topic, **Download Markdown** (`kb-<ticket>-v<version>.md`) and **Print or save as PDF** (a print stylesheet that shows only the article).
- **Progress page:** a day streak (current and best, local days), a weekly goal (different tickets and mail exercises in the ISO week, target 1-7, default 3) and eleven **badges** with their rule and the day they were earned, plus the mail score.
- **Mail** (`#/mail`, `#/mail/<id>`, unread count in the sidebar): six messages with *Show headers* (From, Reply-To, Return-Path, Received, SPF/DKIM/DMARC, real link targets, directory check). Two user requests become tickets (*Create ticket from this message*), one executive phishing from a look-alike domain, one service desk impersonation asking for an MFA and password reset by email, one maintenance notice and one urgent internal request that passes every check. Each answer is graded correct, partly correct or wrong, with the clues and the right procedure, and can be retried.
- The logic and the mail data are in [assets/growth.js](public/assets/growth.js) (no DOM), tested in `tests/growth.test.js`; [docs/growth-format.md](docs/growth-format.md) describes the data.

## Help pages

Static pages next to the app, in both languages (`assets/doc.js` shows the one picked in the simulator and adds the switch), with the same strict CSP:

- [about.html](public/about.html) (`/about`): what SysAdmin Desks is, who it is for, how a ticket is checked, and what it is not (not work experience, not a real system, not affiliated with any vendor or certification body);
- [help.html](public/help.html): getting started, a ticket from start to finish, contacting the requester and the note to the user, how scoring works, each tool, and what to do if something goes wrong;
- [faq.html](public/faq.html): nineteen short questions and answers;
- [terms.html](public/terms.html) and [privacy.html](public/privacy.html).

Every page, the app footer, the sidebar and *My account* link to them and to **Report a problem**, which opens the contact form on my website with the subject filled in. `tests/pages.test.js` checks both languages, the CSP, that there is no inline code or email address, and that every local link exists.

## SEO (v0.6.2)

- **Static intro on the home page:** `index.html` ships real text inside `<main id="app">` (H1, how it works, the 18 tickets, links to the help pages and the guides), in Spanish and English. Search engines and visitors without JavaScript read it; `app.js` shows only the visitor's language and replaces it with the landing or the app on its first render.
- **A public page per ticket:** `public/tickets/<desk id>.html` (served as `/tickets/<desk id>`) with the problem, the ticket as the requester tells it, level, topic and SLA, what you practise (never the cause or the fix), the related guide and a *Practise it free* button to `/?lang=xx#/desk/<id>`; `/tickets/` lists them all. The about page and the home intro link to them.
- **Clean URLs:** `/about`, `/help`, `/faq`, `/terms`, `/privacy` and `/tickets/...` everywhere (Cloudflare Pages serves `about.html` for `/about`; `npm run dev` does the same). `sitemap.xml` lists them.
- **Head:** every public page has its Spanish title and description (the default visible language; `doc.js` and `app.js` switch the title for English), a canonical URL, Open Graph (`assets/og.png`, 1200×630, drawn by `scripts/make-og.py`) and a Twitter card. JSON-LD: `WebApplication` on the home page and `FAQPage` on `/faq`, built from the visible Spanish questions. JSON-LD is the only inline `<script>` allowed: it is data and never runs, so the CSP does not block it.
- **`npm run pages`** (`scripts/build-ticket-pages.mjs`) builds the ticket pages, the `<!-- seo -->` head blocks and the ticket lists from `assets/scenarios.js` and `scripts/ticket-pages-data.mjs` (the description and skills of each desk). Run it after changing a desk or the FAQ; `tests/seo.test.mjs` fails if a generated file is out of date, if a page lacks its tags or if a ticket page shows a solution command, a hint or the example note.

## How it is built

- Static site in `public/`: `index.html`, `assets/app.js` (interface), `assets/engine.js` (scenario engine, no DOM), `assets/workflow.js` (ticket states and SLA with pauses, no DOM), `assets/scenarios.js` (the desks as data), `assets/world.js` (the directory, its PowerShell and the inventory, no DOM), `assets/growth.js` (knowledge base, streak, goal, badges and mail, no DOM), `assets/comms.js` (the conversation with the requester and the note for the user, no DOM) and `assets/style.css`.
- No framework, no build step, no external requests. A strict Content Security Policy (no inline scripts or styles) in the page and in `public/_headers`, and no HTML strings: every text is set with `textContent`.
- The engine and the scenarios are shared with the Node tests: `npm test` checks that every desk is complete in both languages, that the reference solution resolves it exactly at its last step, that the example note scores 100, and that the wrong paths do not resolve it.
- [docs/scenario-format.md](docs/scenario-format.md) explains how to write a new desk.

## Run it locally

```bash
npm test                 # 91 tests: the desks, the ticket page and its workflow, contacting the requester and the note for the user, the directory and desktops, progress and knowledge, the pages and their SEO, and the accounts and password reset against an in-memory database (Node 22+)
npm run dev              # http://localhost:8788 with accounts, in-memory database; reset answers 503 unless BREVO_API_KEY and MAIL_FROM are set
npm run dev:reset        # the same, but reset emails are not sent: the link is printed in this console (DEV_RESET_LOG=1, only in scripts/dev-server.mjs)
npm run pages            # rebuild the ticket pages, the SEO head blocks and the ticket lists (after changing a desk or the FAQ)
npm run serve            # http://localhost:8080, static only (no accounts, and no clean URLs: open /about.html)
```

## Deploy (Cloudflare Pages)

The live site is deployed by Cloudflare Pages on every push to `main`. To deploy your own copy:

1. In Cloudflare: Workers & Pages → Create → Pages → Connect to Git → this repository.
2. Build settings: framework preset **None**, build command empty, build output directory **`public`**.
3. Deploy. `public/_headers` adds the security headers (CSP, frame-ancestors, nosniff, referrer and permissions policies). `functions/` is deployed with the site.
4. Accounts: create a D1 database (Workers & Pages → D1) and bind it to the Pages project as `DB` (Settings → Bindings → D1 database), then redeploy.
5. Password reset by email (optional): add `BREVO_API_KEY` (secret), `MAIL_FROM` and optionally `MAIL_FROM_NAME`, see *Password reset*.
6. Google (optional): create an OAuth client of type "Web application" in Google Cloud with the redirect URI `https://<your-site>/api/auth/google/callback`. In the Pages project, add `GOOGLE_CLIENT_ID` as a variable and `GOOGLE_CLIENT_SECRET` as a secret (Settings → Variables and Secrets). Without them, the Google button says it is not ready.

Ideas for later: more desks per guide topic.

## Status

Version 0.6.1: contacting the requester (scripted questions, clues, a minute of SLA each, confirmation after the fix) and a marked note for the user with closing templates; 0.6.0 added workflow states with the SLA paused while pending and an activity timeline per ticket, and password reset by email (Brevo), on top of 18 desks (first and second line), landing page, accounts, ticket queue with SLA, ticket page with a three-level result, the tools (directory, desktop and inventory), a personal knowledge base, streak, weekly goal, badges and mail exercises, and the about, help, FAQ, terms and privacy pages. Each desk links to its guide, and the guides on the website link back with a "Practise it" button. Fictional company (Contoso) and people; no real systems or data.

## Contact

Ideas for a desk, or want one adapted to your team's tickets?

- Website (contact form): [inigogonzalezgarcia.github.io](https://inigogonzalezgarcia.github.io/about.html#contacto)
- LinkedIn: [linkedin.com/in/igonzalez93](https://www.linkedin.com/in/igonzalez93)
