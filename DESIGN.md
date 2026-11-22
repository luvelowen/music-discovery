# Design file

**Read this before changing anything people can see.** Update it when the design changes.

## Direction (changed by the owner on 2026-11-22)

Dating, friends and music for adults in Ulaanbaatar, after dark.
**It should feel like Apple Music, on black, with purple as the second color.** Easy on the eyes, clean, never AI-looking.
Borrow Apple Music's structure: sidebar, tab bar, big bold titles, grouped lists.
Never its logo, name, red, artwork or icons.
The owner rejected bright red and pink, category pictures, and pages full of photos. Don't bring them back.

## The 13 standing rules

| # | Rule | What it means here |
| --- | --- | --- |
| 1 | Kill the purple gradient | The owner chose purple, so it is **flat** and soft. Still no gradients |
| 2 | Choose real fonts | Apple’s system font on Apple devices, Inter elsewhere |
| 3 | Delete the template chrome | No eyebrows, pills, icon circles, decorative blocks or filler |
| 4 | Break the three-card row | No rows of cards. Lists, and grouped rounded lists in settings |
| 5 | Swap emojis for icons | A few plain Lucide icons, only where they help |
| 6 | Use real photos and screens | One real photo of Ulaanbaatar. People’s own photos after they connect. No more |
| 7 | Write a specific headline | The earbud line |
| 8 | Cut the scroll fade-ins | Nothing animates on scroll |
| 9 | Remove fake testimonials | No quotes, ratings, counts or logos until real |
| 10 | Remove builder leftovers | No starter copy, developer badge or unused files |
| 11 | Show it sites you like | Apple Music (music.apple.com), measured 2026-11-22: 260px sidebar, 34px/700 titles |
| 12 | Keep a design file | This file |
| 13 | Make it screenshot its world | Screenshot every changed screen before reporting |

## Color

Tokens live in `app/globals.css`. Never type a hex value into a screen.

| Token | Hex | Job |
| --- | --- | --- |
| night | `#0c0c0e` | Page |
| sidebar | `#151518` | Sidebar and tab bar |
| surface | `#19191c` | Grouped lists and inputs |
| raised | `#242428` | Secondary buttons, selected sidebar item |
| line | `#2d2d32` | Dividers |
| edge | `#77767e` | Input borders |
| chalk | `#dddce1` | Text. Never pure white |
| muted | `#a09fa7` | Secondary text |
| accent | `#aa96dc` | Soft purple: main button, links, icons, selected things |
| danger | `#de958c` | Errors and deleting |

## Type and layout

- System font on Apple devices, Inter elsewhere. Page titles use the `title` class: 30–34px, weight 700, sentence case.
- Only the welcome headline is bigger. Inputs are never under 16px.
- A new font must contain Ө ө Ү ү. "Supports Cyrillic" is not proof.
- Desktop: a 16rem sidebar inside the app. Phones: a tab bar. Welcome, sign-in and setup have neither.
- Chat fills the window: list beside the thread on wide screens, one pane on phones. My messages are flat purple with black text.
- A 60rem content column. Forms are one column. Corners: controls 10px, groups 14px, dialogs 16px.
- **Music categories are words only. No pictures, tiles or covers.**

## Photo

`public/photos/ub-night.jpg`, by @naranbayar_1, Unsplash photo-1613739519297-e7947a931ba4,
[Unsplash license](https://unsplash.com/license). Shown dimmed on the welcome page only.

## Before calling a change done

Screenshot it at 360px and 1280px, in Mongolian and English. Check the 13 rules, contrast, tap size and overflow.
