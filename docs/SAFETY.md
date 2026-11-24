# Safety and privacy plan

**Decided 2026-11-22: friends + music, for any adult 18+.** Dating was removed on 2026-11-24 at the owner's request.
It is still adults-only, with private messages between strangers who connect, so there is no version for minors.
Some will try to join anyway, so the protective defaults stay.

The 18+ check runs on the server at sign-up, but it **believes the date people type**. It is not verification.

This document separates what exists from what is missing.

## Built

| Protection | Where | Its limit |
| --- | --- | --- |
| The server removes hidden fields before sending a profile | `lib/social/policy.ts`, `lib/server/people.ts` | Anything shown can be screenshotted |
| People who haven't connected see no photo, bio or links | `lib/profile/visibility.ts` | They do see username, music, answers and choices |
| No real name, birthday, school, phone or location field | `lib/profile/types.ts` | People can still type these into free text |
| Phone numbers, emails, @handles and common links are rejected in profiles | `lib/safety/contact-info.ts` | Misses disguised details. Doesn't scan chat |
| The browser blocks location, camera and microphone for this app | `next.config.ts` | None known |
| Photos are redrawn, and stripped again on the server | `lib/profile/resize-photo.ts`, `lib/server/photo.ts` | Nobody reviews what a photo shows |
| Only adults with a confirmed email, a finished profile and no suspension meet | `lib/server/members.ts` | Age is self-declared |
| No dating. Older dating choices read as friends and are never shown | `lib/profile/parse.ts`, `lib/profile/visibility.ts` | Old copies of the database still hold them until backups expire |
| People meet only over a shared intention | `lib/social/policy.ts` | No gender or preference filter |
| Hidden from Discover until switched on | `lib/social/types.ts` | None known |
| Search looks only at what the searcher may see | `lib/server/people.ts` | None known |
| Hiding artists also hides them inside songs | `lib/profile/visibility.ts` | A song title can still hint at the artist |
| Requests carry no text, 10 a day, declines are silent | `lib/server/people.ts` | A new account resets the limit |
| Usernames are unique, including look-alike spellings | `lib/server/accounts.ts` | Close misspellings still work |
| Blocking works both ways, immediately | `lib/server/people.ts` | The person can make another account |
| People can report someone they blocked, or who wrote to them in a closed chat | `lib/server/people.ts` | Not someone who hid or blocked them without ever writing |
| Reports reach a moderator command, urgent first | `scripts/moderate.ts` | **Only useful if a person runs it** |
| Suspension hides the person and keeps the evidence | `lib/server/moderation.ts` | They can sign up with another email |
| A suspended person can open only their own download | `lib/server/session.ts` | Appeals and deletion need a real contact |
| Closing a report with evidence needs the word `erase` | `scripts/moderate.ts` | No retention period yet |
| The agreed wording, time and any withdrawal are saved | `lib/server/consent.ts` | Older accounts have only a time |
| Chat needs a connection, no block and consent from both | `lib/server/chat.ts` | Not end-to-end encrypted |
| A reporter may attach the last 30 messages | `lib/server/chat.ts` | Nothing is attached unless they choose it |
| Clearing a chat clears only your side | `lib/server/chat.ts` | Erased when both have cleared it |
| Chat is plain text: no photos, files or tappable links | `lib/chat/clean.ts` | Text can still carry harm or a scam |
| Email code before an account exists | `lib/server/verification.ts` | Older accounts confirm in Settings |
| Passwords scrambled, guessing limited, private reset | `lib/server/` | No two-step log-in. Reset is as safe as the inbox |
| Other websites, unknown hosts and stale tabs are refused | `lib/server/http.ts`, `lib/server/session.ts` | Needs an independent security review |
| Pages may load only from this app | `next.config.ts` | Inline scripts are still allowed, as Next.js needs them |

Emergency numbers were removed from the app on 2026-11-22 at the owner's request.

## Still missing before the public joins

1. **A real age check.** A typed date of birth proves nothing. Private companies generally may not collect
   biometric data in Mongolia, so no face scans. Ask the lawyer which document or operator check is lawful.
2. **A moderator.** A named person, response-time targets, and a path to police and child protection.
   There is no record of which moderator did what, and no appeal screen.
3. **Photo review.** A photo reaches connections without anyone checking it. The moderator can only suspend the account.
4. **Limits per network address**, from the proxy in front of the app.
5. **Encryption at rest**, from the server's disk.
6. **Legal review** of hosting, consent, retention and child protection. See [DATA.md](DATA.md).
7. **An independent security review**, and tests on real phones.

An adult must never be able to discover, view or message a minor. This is the most important rule in the product.

**Suspected child at risk:**

1. Tell the police (102) or child helpline (108) immediately. Child Protection Law article 16.2 makes this a duty.
2. Suspend the account. That keeps the report and its evidence.
3. Run `npm run backup`. Don't close the report, and don't investigate by contacting anyone yourself.
4. Never copy, forward or screenshot sexual images of a child. Tell the police.

**Waiting for the lawyer:** messages not attached to a report are erased when either account is deleted.
Whether they may be held as evidence, and for how long, is undecided.

## Decisions the founder needs to make

- How is age confirmed?
- Where is the server?
- Who moderates, in Mongolian, and during which hours?
- If dating ever comes back, which gender and preference data, and with what consent?

## Never build

- Precise or live location, or "people near you"
- Open messaging between strangers
- Appearance-based swiping or rating
- Any way for someone under 18 to use dating
- Gender or orientation shown publicly, or inferred from music
- Face scans or other biometric checks
- Public follower lists that expose who someone knows or dates
