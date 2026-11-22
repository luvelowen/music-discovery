# Music, dates & friends (working title)

Dating, friends and music for adults (18+) in Ulaanbaatar.
*Find the person you’d give your left earbud to.*

Sign up, log in, profile, Discover, connections, chat and settings work, in Mongolian and English. Accounts are saved
in `data/app.db` on the computer running the app. The other people in Discover are still fictional.

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
  chats/               Text chat with connected people
  api/account/         Where every change is saved
  api/chat/            Where messages are read and saved
  auth-actions.ts      Sign up, codes, log in, reset, log out, delete
  setup/[step]/        Genres, artists, songs, links, about
  profile/ discover/ people/[id]/ connections/ settings/
  globals.css          Colors and base styles
components/          Reusable visual pieces, one folder for each area
lib/                 Rules and data, with no visual design
  server/              Database, passwords, sessions, email. Runs only on the server
  account/             What can change, and how the screen saves it
  chat/                Message limits, tidying, and live updates
  i18n/                All English and Mongolian wording
  music/ profile/ safety/ social/   The rules
  demo/                Fictional people. Delete when real matching arrives
data/                The database. Private, never committed
tests/               Automatic checks of the rules
docs/                Safety plan, data plan and roadmap
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
| Wording for milestone 2 screens | `lib/i18n/community.en.ts` and `community.mn.ts` |
| The sample people | `lib/demo/people.ts` |
| Sign-up and log-in wording | `lib/i18n/account.en.ts` and `account.mn.ts` |

If a translation is missing, `npm run typecheck` says so.

## Decisions, in plain language

- **Accounts are saved with Node's built-in SQLite**, so there was nothing to install and no company to sign up with.
  If we move to Supabase or a Mongolian server, `lib/server/` is the part that changes first.
- **The server repeats every rule.** The screen sends "what changed", never "here is my whole account".
- **The language is saved in a cookie.** The server can read cookies, so pages open in the right language
  without flickering. Mongolian is the default.
- **The typeface is the system font on Apple devices, and Inter elsewhere.** Both must show Ө ө Ү ү. Many "Cyrillic" fonts do not.
- **Categories are text only**, and there is one licensed photo. See `DESIGN.md`.
- **Dating is mutual-visibility only.** Someone’s dating choice is shown only to people who also chose dating.
- **Music services are links only.** A new service is registered in `lib/music/providers.ts`.
- **TypeScript is pinned to 6.0.3.** Version 7 removed the programming interface Next.js relies on,
  so don't upgrade it until Next.js supports 7.
- **No Supabase yet.** Where it can legally run is undecided. See `docs/DATA.md`.
- **The preview is limited to this computer.** `dev` and `start` include `--hostname localhost`.
  Without it, Next.js accepts connections from the network. Some hosting services need it removed from `start`;
  never remove it from `dev`.
