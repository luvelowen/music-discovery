# Safety and privacy plan

**Decided 2026-11-22: dating + friends + music, for any adult 18+.** This replaces the student-only pilot.
Because it includes dating, there is no version of this app for minors. Some will try to join anyway,
so the protective defaults stay.

The 18+ check runs on the server at sign-up, but it **believes the date people type**. It is not verification.

This document separates what exists from what is only planned.

## Built so far

| Protection | Where | Its limit |
| --- | --- | --- |
| Strangers see only username, genres, artists and songs | `lib/profile/visibility.ts` | Fictional people are still filtered in the browser. Real profiles must be filtered on the server |
| No real name, birthday, school, phone, email or location field | `lib/profile/types.ts` | People can still type these into free text |
| Phone numbers, emails, @handles and common links are rejected | `lib/safety/contact-info.ts` | Misses disguised details. Needs moderators |
| The browser blocks location, camera and microphone for this app | `next.config.ts` | None known |
| Photos are redrawn, removing hidden GPS data | `lib/profile/resize-photo.ts` | The server must repeat this for uploads |
| Spotify tracking codes are removed | `lib/music/spotify.ts` | The linked Spotify profile may itself show a real name |
| Adults only in Discover, requests and profiles | `lib/social/policy.ts` | The server decides, from a self-declared date |
| Date of birth is never saved, only the result | `lib/server/accounts.ts` | Records may need to keep more. Ask the lawyer |
| Dating is shown only to people who also chose it | `lib/profile/visibility.ts` | Someone can switch dating on just to look |
| People meet only over a shared intention | `lib/social/policy.ts` | The server repeats it when saving |
| Hidden from Discover until switched on | `lib/social/types.ts` | None known |
| Hiding artists also hides them inside songs | `lib/profile/visibility.ts` | A song title can still hint at the artist |
| Requests carry no text, 10 a day, no repeat after a decline | `lib/social/policy.ts` | A new account resets the limit |
| Blocking ends connections and works in both directions | `lib/social/actions.ts` | The other direction needs real accounts |
| Reports with reasons, ready for a moderator queue | `lib/social/actions.ts` | **Saved to the account. Nobody receives them** |
| Passwords scrambled, guessing limited | `lib/server/` | No two-step log-in |
| Email code before an account exists | `lib/server/verification.ts` | Older accounts confirm in Settings |
| Password reset that doesn't reveal accounts | `lib/server/verification.ts` | As safe as the person's inbox |
| Instagram shown only to connections | `lib/profile/visibility.ts` | It can reveal a real name and face |
| Chat only between connected people, never after a block | `lib/server/chat.ts` | Connections are fictional for now |
| Chat is plain text: no photos, files or tappable links | `lib/chat/clean.ts` | Text can still carry harm or a scam |
| Chat is rate-limited and needs its own consent | `lib/server/chat.ts` | Not end-to-end encrypted. No message scanning |
| Saving refuses other websites and stale tabs | `app/api/account/route.ts` | Needs a security review before going online |
| No third-party requests while using the app | Fonts are bundled at build time | Opening a Spotify link leaves the app |

Emergency numbers were removed from the app on 2026-11-22 at the owner's request.

## Required before any real user joins

0. **A privacy notice, limits per network address on sign-up and log-in, and a proper email sender.**
   A personal Gmail is fine for testing, not for real users.
1. **A real age check.** A typed date of birth proves nothing. Private companies generally may not collect
   biometric data in Mongolia, so no face scans. Ask the lawyer which document or operator check is lawful.
2. **No minors, anywhere.** Suspected minors can be reported and are suspended pending review.
   An adult must never be able to discover, view or send a request to a minor.
   This is the most important rule in the product.
3. **No messages before a request is accepted.** Built for fictional connections. Recheck it with real pairs of accounts. Requests carry no free text. Rate-limit them.
3a. **Reports from chat need evidence.** Let the reporter attach messages, keep a protected copy even if the chat
   is deleted, and let each side delete only their own view once both sides are real people.
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
   and where the data may be hosted. See `DATA.md`.

## Decisions the founder needs to make

- How is age confirmed?
- Where is the server? See `DATA.md`.
- Are gender and dating preference collected, and with what consent?
- Who moderates, in Mongolian, and during which hours?

## Never build

- Precise or live location, or "people near you"
- Open messaging between strangers
- Appearance-based swiping or rating
- Any way for someone under 18 to use dating
- Gender or orientation shown publicly, or inferred from music
- Face scans or other biometric checks
- Public follower lists that expose who someone knows or dates
