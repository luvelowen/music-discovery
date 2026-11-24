# Where users' data goes

Researched 2026-11-22. **This is not legal advice. A Mongolian lawyer must confirm it before strangers join.**

## Today: one file on the computer running the app

**`data/app.db`**, an SQLite database in the project folder. It is never committed to Git.
Signed-in people see and download their own record at **Settings → See my saved data**.

| Data | Table | How it is kept, and until when |
| --- | --- | --- |
| Email, age result, sign-up consent | `users` | Until the account is deleted |
| Password | `users` | Only a salted scrypt value. It can't be read back |
| Profile: photo, music, links, answers, choices | `users.profile` | JSON text, until changed or deleted |
| Privacy and followed categories | `users.social` | JSON text. Older accounts may also hold unused sample connections |
| Requests and connections | `requests` | Who, whom, the state and when |
| Request limit | `request_log` | Who sent a request and when, for a day |
| Blocks | `blocks` | Who blocked whom, with the name at the time |
| Reports | `reports` | **Kept after an account is deleted.** Attached messages are erased when closed |
| Suspensions | `suspensions` | Who, why and when |
| Log-ins | `sessions` | A fingerprint of the cookie, for 30 days |
| Failed log-ins | `login_attempts` | A fingerprint of the email, cleared at a later attempt |
| Email confirmed | `email_checks` | When it was confirmed |
| Waiting codes | `email_codes` | A fingerprint of the code and, at sign-up, the email and scrambled password. About a day |
| Emails sent | `email_sends` | A fingerprint of the email, to limit sending |
| Chat consent | `chat_consents` | Whether it is on now. Separate from sign-up consent |
| Proof of consent | `consent_events`, `consent_texts` | Time, language, the exact words and withdrawals, until account deletion. The words themselves hold no personal data and stay |
| Consent during sign-up | `code_consents` | Until the code is used or cleared |
| Messages | `messages` | **Readable text**, until both people clear them, the sender turns chat off or either account is deleted |
| Read and clear markers | `chat_reads`, `chat_clears` | The newest message read or cleared |
| Language | none | A cookie |
| Date of birth | none | Used once and never saved |
| Location, gender, sexual orientation | none | Never asked |

**Expired records** (log-ins, codes, counts for limits) are removed at the app's first use after starting and then
every hour it runs, by `lib/server/cleanup.ts`.

**Chat and the law**

- Messages are private correspondence, which article 4.1.12 calls sensitive. Chat stays off until separate consent.
- Turning chat off withdraws consent and erases that person's messages, except copies already attached to a report.
- Removing or blocking someone closes the chat but keeps the saved messages until one of the deletions above.

**Email**

- Without SMTP settings, emails are text files in `data/outbox`, with readable codes. They are cleared after a day
  at the next send, and when that account is deleted. A public address never does this.
- With SMTP settings, the email service receives the address and the code, and nothing about music or
  the profile. **With Gmail that is a transfer abroad**, so sign-up asks for consent.

**What this does not protect against**

- The file is not encrypted. Anyone who can open files on this computer can read everything except passwords.
- `npm run backup` makes a copy only when someone runs it. Copies hold everyone's data, including accounts deleted later.
- Deleting `data/`, or running `git clean -x`, loses every account.
- If the app goes online the host sees IP addresses, and needs a permanent disk.

The Next.js developer tool reports anonymous usage about the developer's machine, never users' data.
Switch it off with `npx.cmd next telemetry disable`.

## Before other people use it: what the law says

Law on Personal Data Protection (2021), from the unofficial English translation:

| Article | Rule | What it means for us |
| --- | --- | --- |
| 4.1.12, 9.1 | Correspondence, sexual and gender orientation, and sexual relations are sensitive personal secrets | Chat is the most protected data we hold. Dating preferences are no longer collected (removed 2026-11-24) |
| 7, 8 | Consent must state purpose, controller, data list, duration, publication, sharing and withdrawal | A separate, clear consent screen |
| 10 | Biometric collection is limited to listed cases | No face-scan age checks |
| 14.1 | Transfer abroad is prohibited without a legal or treaty basis, or the person's consent | A database abroad needs at least consent |
| 20, 22 | Security procedures, a breach plan, notice to affected people, yearly record to the Human Rights Commission | Someone must own this before launch |
| 23 | An assessment when sensitive data is processed regularly | Do it before collecting preferences |

**Order A/90 (2023-09-11), read in Mongolian on 2026-11-22:** a server processing sensitive data must be
**in Mongolia (3.2.1) and accessible only from Mongolia (3.2.2)**. It also asks for a security officer, a risk
assessment every two years, a yearly audit and a log of changes. How far it binds a small private app is for the lawyer.

Also found in the official texts:

- Data law 8.4 and 18.2.2 may require identifying a person before their consent counts. An email code may not be enough.
- Data law 23 may require an assessment sent to the Human Rights Commission before processing starts.
- Child Protection Law 16.2 requires reporting a child at risk immediately.

## The choices

| Option | Good | Bad |
| --- | --- | --- |
| **Supabase, self-hosted in a Mongolian data center (provisional recommendation)** | Data stays in Mongolia, same technology | Someone must maintain, secure and back up the server |
| Supabase cloud in Seoul or Tokyo | Easiest. Managed for us | Data leaves Mongolia, and may break the server rule even with consent |
| Split: ordinary data abroad, sensitive data in Mongolia | Less to maintain locally | Complicated, and chat is sensitive wherever it is |

[Supabase has no Mongolia region](https://supabase.com/docs/guides/platform/regions).

## Questions for the lawyer

1. Does order A/90 bind a private app, and for all data or only sensitive data?
2. ~~Is choosing "dating" already sensitive data?~~ Dating was removed on 2026-11-24. Older choices are dropped when read.
   Ask only: may old backups that still contain them be kept until they expire?
3. Is consent enough for hosting in Seoul?
4. Which age check is lawful without biometrics?
5. How long may reports and deleted-account records be kept?
6. Is an email code enough identification for consent?
7. May evidence be held when its sender withdraws or deletes their account?
8. Must existing users agree again when consent wording changes?

## Sources

- [The law, official Mongolian text](https://legalinfo.mn/mn/detail?lawId=16390288615991)
- [Unofficial English translation (PDF)](https://cyrilla.org/api/files/1728476367950dd4g86zulst.pdf)
- [The ministry procedure](https://legalinfo.mn/mn/detail?lawId=16760452348261)
