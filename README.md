# Music & friends (working title)

Friends and music for adults (18+) in Ulaanbaatar. Dating was removed on 2026-11-24.
*Find the person you’d give your left earbud to.*

Real accounts find each other, ask to connect, chat, block and report, in Mongolian and English.
Everything is saved in `data/app.db` on the computer running the app.

**It is not online and not yet safe to open to the public.** Read [the launch checklist](docs/LAUNCH.md) first.

## Running it

You need [Node.js](https://nodejs.org) 22.18 or newer. Open a terminal in this folder.

In Windows PowerShell, type `npm.cmd` wherever this page says `npm`.

| Command | What it does | When to use it |
| --- | --- | --- |
| `npm install` | Downloads the packages listed in `package.json` into `node_modules` | Once, or after the package list changes |
| `npm run dev` | Starts a private preview at http://localhost:3000 that updates as files change | While working. Stop it with Ctrl+C |
| `npm run typecheck` | Finds code mistakes without running the app | After changes |
| `npm test` | Checks the safety, privacy, link and translation rules | After changes |
| `npm run build` | Creates the optimized version for real users | Before publishing |
| `npm start` | Runs the version made by `npm run build` | To try the real version |
| `npm run moderate` | Lists open reports | Every day once people use it |
| `npm run backup` | Saves a copy of the database in `data/backups` | Every day, and before updates |

## Trying it as two people

1. Open http://localhost:3000 in two different browsers, or one normal and one private window.
2. Sign up in each with a different email. Until email is set up, codes are the newest files in `data/outbox`.
3. Give both the same genre. In both, press **Show me in Discover**.
4. Connect from one, accept in the other, then turn on chat in both.

An account made before email codes existed must press **Confirm email** before it can meet people.

## Handling reports

| Command | What it does |
| --- | --- |
| `npm run moderate` | Open reports, most urgent first. Each starts with a short id |
| `npm run moderate -- show <report>` | One report, with any messages the reporter chose to attach |
| `npm run moderate -- suspend <report>` | Suspends the reported person and logs them out. The report and its messages stay |
| `npm run moderate -- close <report>` | Closes a report. Refuses if messages are attached |
| `npm run moderate -- close <report> erase` | Closes it and erases the attached messages. Only when nobody needs them |
| `npm run moderate -- suspended` | Who is suspended |
| `npm run moderate -- restore <user id>` | Lifts a suspension |

Type the id without the `<` and `>`. Closing can't be undone. Attached messages are private: don't screenshot or forward them.

**If a child may be at risk, suspending is not enough.** The law requires telling the authorities immediately:
the police (102) or the child helpline (108). Don't close that report, because it holds the evidence.

A suspended person can still log in, but only to download their own data. To appeal, withdraw or delete they write to `APP_CONTACT`.

## Sending real emails

Until this is set up, every email is a text file in `data/outbox`.

1. In your Google account, turn on 2-Step Verification.
2. Create an app password at https://myaccount.google.com/apppasswords
3. In PowerShell, in this folder: `Copy-Item .env.example .env.local`
4. Open `.env.local`, type your Gmail address after `SMTP_USER=` and the app password after `SMTP_PASS=`, and save.

Type the password only into `.env.local`. Never into `.env.example`, the code or a chat.

## Where things are

```
app/                 Pages. Each folder is a web address.
  signup/ login/       Email and password
  forgot/ code/        Password reset and emailed codes
  account/data/        My data: what the database holds
  profile/edit/        The profile editor
  chats/               Text chat with connected people
  privacy/ rules/      The privacy notice and community rules
  api/                 Where the screens read and save: account, people, chat, photo, export
  suspended/           All a suspended person can open
  auth-actions.ts      Sign up, codes, log in, reset, log out, delete
  setup/[step]/        Genres, artists, songs, links, about
  profile/ discover/ people/[id]/ connections/ settings/
  globals.css          Colors and base styles
components/          Reusable visual pieces, one folder for each area
lib/                 Rules and data, with no visual design
  server/              Database, passwords, people, chat, moderation, email. Runs only on the server
  account/             What can change, and how the screen saves it
  people/              What screens know about other people
  consent/             The wording people agree to
  chat/                Message limits, tidying, and live updates
  i18n/                All English and Mongolian wording
  music/ profile/ safety/ social/   The rules
scripts/             The moderator and backup commands
data/                The database. Private, never committed
tests/               Automatic checks of the rules
docs/                Launch checklist, safety plan, data plan and roadmap
public/              One photo
DESIGN.md            The design rules. Read before any visual change
CLAUDE.md            Standing instructions for Claude
```

## Common edits

| I want to change | Open |
| --- | --- |
| English wording | `lib/i18n/en.ts` |
| Mongolian wording | `lib/i18n/mn.ts` |
| The product name | `appName` in both wording files |
| The browser-tab icon | `app/icon.svg` |
| Colors | The `@theme` block in `app/globals.css` |
| Suggested artists | `lib/music/artists.ts` |
| A genre | `lib/music/genres.ts`, and both wording files |
| Limits, such as five genres | `lib/profile/types.ts`, then the numbers mentioned in both wording files |
| Who can see which field | `lib/profile/visibility.ts` |
| Who can find or contact whom | `lib/social/policy.ts`, then run `npm test` |
| Discover, Connections and Settings wording | `lib/i18n/community.en.ts` and `community.mn.ts` |
| Profile wording, questions and choices | `lib/i18n/profile.en.ts` and `profile.mn.ts` |
| Privacy notice and rules | `lib/i18n/legal.en.ts` and `legal.mn.ts` |
| Sign-up and log-in wording | `lib/i18n/account.en.ts` and `account.mn.ts` |

If a translation is missing, `npm run typecheck` says so.

## Decisions, in plain language

- **Accounts are saved with Node's built-in SQLite**, so there was nothing to install and no company to sign up with.
  If we move to Supabase or a Mongolian server, `lib/server/` is the part that changes first.
- **The server repeats every rule.** The screen sends "what changed", never "here is my whole account".
- **The language is saved in a cookie.** The server can read cookies, so pages open in the right language
  without flickering. Mongolian is the default.
- **The typefaces are Manrope (text) and Montserrat (titles).** Both must show Ө ө Ү ү. Many "Cyrillic" fonts do not.
- **Categories are text only**, and there is one licensed photo. See `DESIGN.md`.
- **No dating.** Everyone is here for music and friends. A "dating" choice saved before 2026-11-24 reads as friends
  (`lib/profile/parse.ts`) and disappears at the next save.
- **Music services are links only.** A new service is registered in `lib/music/providers.ts`.
- **TypeScript is pinned to 6.0.3.** Version 7 removed the programming interface Next.js relies on,
  so don't upgrade it until Next.js supports 7.
- **No Supabase yet.** Where it can legally run is undecided. See `docs/DATA.md`.
- **The preview is limited to this computer.** `dev` and `start` include `--hostname localhost`.
  Without it, Next.js accepts connections from the network. Some hosting services need it removed from `start`;
  never remove it from `dev`.
