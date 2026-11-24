# Design file

**Read this before changing anything people can see.** Update it when the design changes.

## Direction (changed by the owner on 2026-11-22, colors narrowed on 2026-11-23, "Encore" v0.2 on 2026-11-24)

Music and friends for adults in Ulaanbaatar, after dark. (Dating was removed on 2026-11-24.)
**v0.2 "Encore": the owner asked for new colors, a new font and a design inspired by Deezer, Apple Music, Spotify, Tinder and Equals.**
Still black, white and two purples, now brighter: Spotify's neutral grey surfaces and pill buttons, Deezer's electric violet,
Apple Music's structure (sidebar, tab bar, big bold titles, grouped lists), Tinder's one-question-per-screen sign-up and Equals' calm, plain wording.
Never any of their logos, names, colors beyond ours, artwork or icons.
The owner rejected bright red and pink, category pictures, and pages full of photos. Don't bring them back.

## The 13 standing rules

| # | Rule | What it means here |
| --- | --- | --- |
| 1 | Kill the purple gradient | The owner chose two purples, both **flat**. Still no gradients |
| 2 | Choose real fonts | Manrope for text, Montserrat Bold for titles, on every device. Both checked for Ө ө Ү ү |
| 3 | Delete the template chrome | No eyebrows, pills, icon circles, decorative blocks or filler |
| 4 | Break the three-card row | No rows of cards. Lists, and grouped rounded lists in settings |
| 5 | Swap emojis for icons | A few plain Lucide icons, only where they help |
| 6 | Use real photos and screens | One real photo of Ulaanbaatar, on the welcome page only. People’s own photos after they connect. No more |
| 7 | Write a specific headline | The earbud line |
| 8 | Cut the scroll fade-ins | Nothing animates on scroll |
| 9 | Remove fake testimonials | No quotes, ratings, counts or logos until real |
| 10 | Remove builder leftovers | No starter copy, developer badge or unused files |
| 11 | Show it sites you like | Apple Music (music.apple.com), measured 2026-11-22: 260px sidebar, 34px/700 titles |
| 12 | Keep a design file | This file |
| 13 | Make it screenshot its world | Screenshot every changed screen before reporting |

## Color

Tokens live in `app/globals.css`. Never type a hex value into a screen.
**Four colors only.** Every other token is a mix of these four (`color-mix`), never a new color.

| Token | Value | Job |
| --- | --- | --- |
| night | `#000000` black | Page |
| chalk | `#ffffff` white | Text, errors |
| accent | `#cbb8ff` light lilac | Links, icons, selected filter chips (black text on it), the alert icon on errors |
| deep | `#7c3aed` electric violet | Main button, my chat messages, picked choices, unread badges. White text on it (5.7:1) |
| sidebar | white 5% into black | Sidebar and tab bar (frosted) |
| surface | white 9% into black | Grouped lists, inputs, unselected chips |
| raised | white 16% into black | Hover on surfaces |
| glow | deep 26% into black | Selected sidebar item and the lit pill behind the selected phone tab |
| line | white 15% into black | Dividers |
| edge | white 45% into black | Input and secondary-button borders |
| muted | white 68% into black | Secondary text |
| deep-lit | white 16% into deep | Main button on hover |
| danger | = white | There is no red. Every error message gets a light purple alert icon from `globals.css` |

## Type and layout

- Manrope for text, Montserrat Bold for titles (`title` class: 28–34px, sentence case) and the `display` class for big headlines.
- Only the welcome headline is bigger. Inputs are never under 16px.
- A new font must contain Ө ө Ү ү. "Supports Cyrillic" is not proof: Unbounded was tried on 2026-11-24 and lacks Ө and Ү.
  Check in the browser by measuring the letter against two different fallbacks.
- Buttons and filter chips are pills. Inputs are 52px tall with 12px corners. A light press-down on tap is the only motion.
- Desktop: a 16rem frosted sidebar inside the app, with the ring mark beside the name. Phones: a floating, frosted, rounded tab bar. Welcome, sign-in and setup have neither.
- Sign-in, sign-up, forgotten password and code screens share `components/auth/auth-frame.tsx`: one centred column on black with the ring mark, title and form. No photo (owner's request, 2026-11-24). The other way in is a one-line text link under the form.
- Sign-up asks one thing per screen with a 3-part progress bar: account, birthday, agreement. Without JavaScript all three show at once.
  On phones the main button waits at the bottom of the screen.
- The birthday is three big boxes (year, month, day) that move on as you type. Underneath it shows the date written out,
  never an age or a pass/fail: the 18+ check happens only on the server, so trying years until one passes doesn't work.
- Phones: the floating tab bar is a pill; the selected tab's icon sits in a small lit pill.
- Chat fills the window: list beside the thread on wide screens, one pane on phones. My messages are flat deep purple with white text.
- A profile reads like an artist's page: photo and name, the anthem, numbered lists, then words and facts.
- Selected filter chips and tabs are filled light lilac with black text. Filled electric violet is for the main button and picked choices in forms.
- Block and Report are quiet, at the end of a profile. A category with nobody in it shows no number.
- Saving shows itself while editing, and on Profile and Settings only when it fails.
- A 60rem content column. Forms are one column. Corners: controls 10px, groups 14px, dialogs 16px.
- **Music categories are words only. No pictures, tiles or covers.**

## Mixtape site (v0.3, `site/`)

The no-server version uses the same look, written as plain CSS in `site/style.css` with the same tokens and values.

- Change a color or size in `app/globals.css`, then make the same change in `site/style.css`.
- Making a card is one question per screen with a 4-part progress bar: genres, artists, songs, nickname. The main button waits at the bottom on phones.
- A card reads like an artist's page: initial, name, anthem, then genres and numbered lists.
- A friend's card shows "In common" right under their name: a count, then the shared genres, artists and songs, and "New to you". Never a score or percentage.
- Phones get the floating pill tab bar (My card, Friends) once a card exists. Desktop gets the same two links in the header.
- Fonts and the photo are served from the site itself. Nothing loads from anywhere else.
- Friends shows a "Group blend" button and a "From your friends" list (artist, who loves them, a + to add). Blend picks friends as violet chips.
- The story image (1080×1920) uses the same four colors, the ring mark, Montserrat for the name and a violet pill with the address.

## Photo

`public/photos/ub-night.jpg`, by @naranbayar_1, Unsplash photo-1613739519297-e7947a931ba4,
[Unsplash license](https://unsplash.com/license). Shown dimmed on the welcome page only, in the main app and the Mixtape site.

## Before calling a change done

Screenshot it at 360px and 1280px, in Mongolian and English. Check the 13 rules, contrast, tap size and overflow.
