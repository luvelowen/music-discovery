# Safety and privacy plan

**Decided 2026-11-22: the first pilot is university students aged 18 and over.**
Younger students may follow later, as a fully separate group. The product stays a friendship community
and keeps its minor-safe defaults, because some minors will try to join anyway.

The app now has an 18+ and student check, but it is a **demonstration, not enforcement**:
it believes what people type, and deleting the browser's data resets it.

This document separates what exists from what is only planned.

## Built so far, enforced only in the browser

| Protection | Where | Its limit |
| --- | --- | --- |
| Strangers see only username, genres, artists and songs | `lib/profile/visibility.ts` | A preview only. The database must enforce it later |
| No real name, birthday, school, phone, email or location field | `lib/profile/types.ts` | People can still type these into free text |
| Phone numbers, emails, @handles and common links are rejected | `lib/safety/contact-info.ts` | Misses disguised details such as "ig: bold ub". Needs server checks and moderators |
| The browser blocks location, camera and microphone for this app | `next.config.ts` | None known |
| Photos are redrawn, removing hidden GPS data | `lib/profile/resize-photo.ts` | The server must repeat this for uploads |
| Spotify tracking codes are removed | `lib/music/spotify.ts` | The linked Spotify profile may itself show a real name |
| Adults only in Discover, requests and profiles | `lib/social/policy.ts` | Self-declared. The server must decide |
| Date of birth is never saved, only the result | `components/gate/eligibility-screen.tsx` | Accounts may need to keep more. Ask the lawyer |
| Hidden from Discover until switched on | `lib/social/types.ts` | None known |
| Hiding artists also hides them inside songs | `lib/profile/visibility.ts` | A song title can still hint at the artist |
| Requests carry no text, 10 a day, no repeat after a decline | `lib/social/policy.ts` | The limit resets with browser data |
| Blocking ends connections and works in both directions | `lib/social/actions.ts` | The other direction needs real accounts |
| Reports with reasons, ready for a moderator queue | `lib/social/actions.ts` | **Saved locally. Nobody receives them** |
| Emergency numbers 102, 103, 108 | Settings | Checked 2026-11-22. A move to 112 is under way, so recheck |
| No third-party requests while using the app | Fonts are bundled at build time | Opening a Spotify link leaves the app |

## Required before any real user joins

1. **Eligibility needs two separate checks: age and student status.** Some first-year university students
   are 17, so a university email alone does not prove 18+. Ask for date of birth neutrally (don't reveal
   the cutoff on that screen), confirm student status, keep the minimum data and never display it.
2. **No minors in the pilot, and separation if they join later.** Suspected minors can be reported and are
   suspended pending review. An adult must never be able to discover, view or send a request to a minor.
   This is the most important rule in the product. Self-declared age is easy to fake, so consider
   verification through schools or universities.
3. **No messages before a request is accepted.** Requests carry no free text. Rate-limit them.
4. **Block and report on every profile.** A block works in both directions, immediately and silently.
5. **Moderation.** A report queue, named people who review it, response-time targets, an audit log,
   and an escalation path to police and child-protection services.
6. **Photo moderation** before any photo is shown to another person.
7. **Database rules.** Supabase Row Level Security on every table, implementing all of the above.
   Checks that exist only in the browser can be bypassed. Filter on the server: never send the browser
   a profile, or a hidden field, and rely on the screen not to draw it. The fictional people are handled
   that way today only because there is nothing private in them.
8. **Account deletion** that removes stored files as well as database rows.
9. **Legal review** by a Mongolian lawyer: personal data protection law, child protection law,
   parental consent, and where the data may be hosted.

## Decisions the founder needs to make

- Which university hosts the pilot?
- How are age and student status confirmed?
- Before any under-18 launch: what is the minimum age, and how is parental consent collected?
- Who moderates, in Mongolian, and during which hours?

## Never build

- Precise or live location, or "people near you"
- Open messaging between strangers
- Appearance-based swiping or rating, or romantic matching
- Public follower lists that expose who a minor knows
