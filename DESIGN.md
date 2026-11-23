# Design file

**Read this before changing anything people can see.** Update it when the design changes.

## Direction (changed by the owner on 2026-11-22, colors narrowed on 2026-11-23)

Dating, friends and music for adults in Ulaanbaatar, after dark.
**It should feel like Apple Music, on black, in exactly four colors: black, white, a light purple and a deep purple.** Easy on the eyes, clean, never AI-looking.
Borrow Apple Music's structure: sidebar, tab bar, big bold titles, grouped lists.
Never its logo, name, red, artwork or icons.
The owner rejected bright red and pink, category pictures, and pages full of photos. Don't bring them back.

## The 13 standing rules

| # | Rule | What it means here |
| --- | --- | --- |
| 1 | Kill the purple gradient | The owner chose two purples, both **flat**. Still no gradients |
| 2 | Choose real fonts | Apple’s system font on Apple devices, Inter elsewhere |
| 3 | Delete the template chrome | No eyebrows, pills, icon circles, decorative blocks or filler |
| 4 | Break the three-card row | No rows of cards. Lists, and grouped rounded lists in settings |
| 5 | Swap emojis for icons | A few plain Lucide icons, only where they help |
| 6 | Use real photos and screens | One real photo of Ulaanbaatar, on welcome and beside the sign-in forms. People’s own photos after they connect. No more |
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
| accent | `#b9a6f5` light purple | Links, icons, selected tabs and filters, the alert icon on errors |
| deep | `#5b3bc4` deep purple | Main button, my chat messages, picked choices. White text on it |
| sidebar | deep 9% into black | Sidebar and tab bar (frosted) |
| surface | deep 17% into black | Grouped lists and inputs |
| raised | deep 34% into black | Secondary buttons, selected sidebar item |
| line | white 17% into black | Dividers |
| edge | white 50% into black | Input borders |
| muted | white 66% into black | Secondary text |
| deep-lit | white 18% into deep | Main button on hover |
| danger | = white | There is no red. Every error message gets a light purple alert icon from `globals.css` |

## Type and layout

- System font on Apple devices, Inter elsewhere. Page titles use the `title` class: 30–34px, weight 700, sentence case.
- Only the welcome headline is bigger. Inputs are never under 16px.
- A new font must contain Ө ө Ү ү. "Supports Cyrillic" is not proof.
- Desktop: a 16rem frosted sidebar inside the app, with the ring mark beside the name. Phones: a floating, frosted, rounded tab bar. Welcome, sign-in and setup have neither.
- Sign-in, sign-up, forgotten password and code screens share `components/auth/auth-frame.tsx`: the night photo with the earbud line on the left (wide screens only, stays put while the form scrolls), the ring mark, title and form on the right. The other way in is a full-width secondary button under a divider.
- Chat fills the window: list beside the thread on wide screens, one pane on phones. My messages are flat deep purple with white text.
- A profile reads like an artist's page: photo and name, the anthem, numbered lists, then words and facts.
- Selected filters and tabs are raised with light purple text. Filled deep purple is for the main button and picked choices in forms.
- Block and Report are quiet, at the end of a profile. A category with nobody in it shows no number.
- Saving shows itself while editing, and on Profile and Settings only when it fails.
- A 60rem content column. Forms are one column. Corners: controls 10px, groups 14px, dialogs 16px.
- **Music categories are words only. No pictures, tiles or covers.**

## Photo

`public/photos/ub-night.jpg`, by @naranbayar_1, Unsplash photo-1613739519297-e7947a931ba4,
[Unsplash license](https://unsplash.com/license). Shown dimmed on the welcome page and beside the sign-in forms on wide screens.

## Before calling a change done

Screenshot it at 360px and 1280px, in Mongolian and English. Check the 13 rules, contrast, tap size and overflow.
