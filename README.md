# Music, dates & friends (working title)

Dating, friends and music for adults (18+) in Ulaanbaatar.
*Find the person you’d give your left earbud to.*

Milestones 1 and 2 are built, in Mongolian and English: onboarding, profile, Discover, connections,
settings and safety. It is a local prototype. Other people are fictional and nothing is sent anywhere.

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

## Where things are

```
app/                 Pages. Each folder is a web address.
  page.tsx             /                Welcome
  setup/[step]/        /setup/genres, artists, tracks, links, about
  profile/             /profile         Preview
  discover/            /discover        Communities and people
  people/[id]/         /people/...      Someone's profile, block, report
  connections/         /connections     Requests and connections
  settings/            /settings        Privacy, safety, deletion
  globals.css          Colors, corners and base styles
components/          Reusable visual pieces
  artwork/             The sleeves and the personal cover
  layout/              Header and language switcher
  ui/                  Buttons, fields, lists
  welcome/ setup/ profile/
  gate/                The 18+ check
  discover/ people/ connections/ settings/
lib/                 Rules and data, with no visual design
  i18n/                All English and Mongolian wording
  music/               Genres, artist suggestions, music-service links
  profile/             Profile shape, validation, saving, who sees what
  safety/              Contact-detail detection
  social/              Eligibility, permissions (policy.ts), actions (actions.ts)
  storage/             Saving in the browser
  demo/                Fictional people. Delete when real accounts arrive
tests/               Automatic checks of those rules
docs/                Safety plan, data plan and roadmap
public/              Photos, and screenshots of the app
DESIGN.md            The design rules. Read before any visual change
CLAUDE.md            Standing instructions for Claude
```

## Common edits

| I want to change | Open |
| --- | --- |
| English wording | `lib/i18n/en.ts` |
| Mongolian wording | `lib/i18n/mn.ts` |
| The product name | `appName` in both wording files |
| The temporary logo | `components/layout/site-header.tsx` and `app/icon.svg` |
| Colors or corner rounding | The `@theme` block in `app/globals.css` |
| Suggested artists | `lib/music/artists.ts` |
| A genre | `lib/music/genres.ts`, a drawing in `components/artwork/sleeve.tsx`, and both wording files |
| Limits, such as five genres | `lib/profile/types.ts`, then the numbers mentioned in both wording files |
| Who can see which field | `lib/profile/visibility.ts` |
| Who can find or contact whom | `lib/social/policy.ts`, then run `npm test` |
| Wording for milestone 2 screens | `lib/i18n/community.en.ts` and `community.mn.ts` |
| The sample people | `lib/demo/people.ts` |
| Emergency numbers | `components/settings/settings-screen.tsx`, and the 108 and 102 mentions in both community wording files |

If a translation or genre drawing is missing, `npm run typecheck` says so.

## Decisions, in plain language

- **The profile is saved in the browser.** It survives a refresh, and nobody else online can see it.
  Anyone using the same browser can, which is why there is a delete button.
  Supabase will start in `lib/profile/store.ts`, but screens will also need sign-in,
  saving and network-error states, and the server must repeat every check.
- **The language is saved in a cookie.** The server can read cookies, so pages open in the right language
  without flickering. Mongolian is the default.
- **The typefaces are Fira Sans Extra Condensed and Golos Text.** Both contain Ө ө Ү ү. Many "Cyrillic" fonts do not.
- **Genre artwork is drawn in code, and photos are licensed.** Credits are in `DESIGN.md`.
- **Dating is mutual-visibility only.** Someone’s dating choice is shown only to people who also chose dating.
- **Music services are links only.** A new service is registered in `lib/music/providers.ts`.
- **TypeScript is pinned to 6.0.3.** Version 7 removed the programming interface Next.js relies on,
  so don't upgrade it until Next.js supports 7.
- **No Supabase package yet.** It arrives with the milestone that uses it.
- **The preview is limited to this computer.** `dev` and `start` include `--hostname localhost`.
  Without it, Next.js accepts connections from the network. Some hosting services need it removed from `start`;
  never remove it from `dev`.
