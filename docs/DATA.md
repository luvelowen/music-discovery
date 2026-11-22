# Where users' data goes

Researched 2026-11-22. **This is not legal advice. A Mongolian lawyer must confirm it before real users join.**

## Today: one file on the computer running the app

**`data/app.db`**, an SQLite database in the project folder. It is created by the first sign-up and is never committed to Git.
Signed-in people see their own record at **Settings → See my saved data** (`/account/data`).

| Data | Table | How it is kept |
| --- | --- | --- |
| Email | `users` | As written, in lower case |
| Password | `users` | Only a salted scrypt value. The password can't be read back |
| Age check and consent | `users` | "Adult", and when they agreed |
| Profile, photo, friends/dating choice | `users.profile` | JSON text |
| Privacy, connections, blocks, reports, followed categories | `users.social` | JSON text |
| Log-ins | `sessions` | A fingerprint of the cookie, for 30 days |
| Failed log-ins | `login_attempts` | A fingerprint of the email. Expired rows are cleared at the next log-in attempt |
| Email confirmed | `email_checks` | When it was confirmed |
| Waiting codes | `email_codes` | Email, a fingerprint of the code and, during sign-up, the scrambled password. Cleared after about a day |
| Emails sent | `email_sends` | A fingerprint of the email, to limit sending |
| Links, including Instagram | `users.profile` | Shown only to connections |
| Chat consent | `chat_consents` | When they agreed. Separate from sign-up consent |
| Messages | `messages` | **Readable text**, with sender, receiver and time. Not end-to-end encrypted |
| Chat read markers | `chat_reads` | The newest message each person has read |
| Language | none | A cookie |
| Date of birth | none | Used once and never saved |
| Location, gender, sexual orientation | none | Never asked |

Deleting an account removes its rows and overwrites the freed space.

**Chat**

- Messages are private correspondence, which article 4.1.12 calls sensitive. Chat stays off until separate consent.
- Turning chat off withdraws consent and erases that person's messages. Deleting an account does the same.
- Removing or blocking someone closes the chat but keeps the saved messages until one of those deletions.
- Before real people chat: encrypt at rest with a key kept away from the database, decide how long messages and
  reported evidence are kept, and have the lawyer confirm where they may be stored.

**Email**

- Without SMTP settings, emails are text files in `data/outbox`, with the code readable inside. They are cleared
  after a day at the next send, and when that account is deleted.
- With SMTP settings (`.env.local`, see `.env.example`), the email service receives the address and the code, and
  nothing about dating, music or the profile. **With Gmail that is a transfer abroad**, so sign-up asks for consent.

**What this does not protect against**

- The file is not encrypted. Anyone who can open files on this computer can read everything except passwords.
- `data/backups` holds only copies made by hand before upgrades. They are not updated, and deleting an account
  does not remove it from them.
- There is no automatic backup. Deleting `data/`, or running `git clean -x`, loses every account.
- A copy of the file, such as a USB backup, is a copy of everyone's data.
- If the app goes online the host sees IP addresses, and the file needs a server with a permanent disk.

The Next.js developer tool reports anonymous usage about the developer's machine, never users' data.
Switch it off with `npx.cmd next telemetry disable`.

## Before other people use it: what the law says

Law on Personal Data Protection (2021), from the unofficial English translation:

| Article | Rule | What it means for us |
| --- | --- | --- |
| 4.1.12, 9.1 | Correspondence, sexual and gender orientation, and sexual relations are sensitive personal secrets | Chat and dating preferences are the most protected data we could hold |
| 7, 8 | Consent must state purpose, controller, data list, duration, publication, sharing and withdrawal | A separate, clear consent screen |
| 10 | Biometric collection is limited to listed cases | No face-scan age checks |
| 14.1 | Transfer abroad is prohibited without a legal or treaty basis, or the person's consent | A database abroad needs at least consent |
| 20, 22 | Security procedures, a breach plan, notice to affected people, yearly record to the Human Rights Commission | Someone must own this before launch |
| 23 | An assessment when sensitive data is processed regularly | Do it before collecting preferences |

A ministry procedure (order A/90, 2023-09-11) is reported by
[DLA Piper](https://www.dlapiperdataprotection.com/index.html?c=MN&t=security) to require the processing server to be
**located in Mongolia and accessible only from Mongolia**. Its exact scope for private companies is unclear:
the procedure itself could not be read.

## The choices

| Option | Good | Bad |
| --- | --- | --- |
| **Supabase, self-hosted in a Mongolian data center (provisional recommendation)** | Data stays in Mongolia, same technology | Someone must maintain, secure and back up the server |
| Supabase cloud in Seoul or Tokyo | Easiest. Managed for us | Data leaves Mongolia, and may break the server rule even with consent |
| Split: ordinary data abroad, sensitive data in Mongolia | Less to maintain locally | Complicated, and dating intent may itself be sensitive |

[Supabase has no Mongolia region](https://supabase.com/docs/guides/platform/regions).

## Questions for the lawyer

1. Does order A/90 bind a private app, and for all data or only sensitive data?
2. Is choosing "dating", without gender or preference, already sensitive data?
3. Is consent enough for hosting in Seoul?
4. Which age check is lawful without biometrics?
5. How long may reports and deleted-account records be kept?

## Sources

- [The law, official Mongolian text](https://legalinfo.mn/mn/detail?lawId=16390288615991)
- [Unofficial English translation (PDF)](https://cyrilla.org/api/files/1728476367950dd4g86zulst.pdf)
- [The ministry procedure](https://legalinfo.mn/mn/detail?lawId=16760452348261)
