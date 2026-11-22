# Design file

**Read this before changing anything people can see.** Update it when the design changes.

## The world

Dating, friends and music for adults in Ulaanbaatar. It is the red room at a gig: dark, loud, warm,
with the city cold outside. The one idea to remember: **the person you'd give one earbud to.**

## The 13 standing rules

| # | Rule | What it means here |
| --- | --- | --- |
| 1 | Kill the purple gradient | No gradients, no purple. Flat heat only |
| 2 | Choose real fonts | Fira Sans Extra Condensed for headlines, Golos Text for reading |
| 3 | Delete the template chrome | No eyebrow labels, badge pills, feature icons in circles or filler stats |
| 4 | Break the three-card row | Unequal blocks, full-bleed photos, rows. Never three equal cards |
| 5 | Swap emojis for icons | Lucide icons, only where they help. No emoji in the interface |
| 6 | Use real photos and screens | Licensed photographs and screenshots of this app. No fake mock-ups |
| 7 | Write a specific headline | It could belong only to this product. No "connect through music" |
| 8 | Cut the scroll fade-ins | Nothing animates on scroll. Motion only answers a tap |
| 9 | Remove fake testimonials | No quotes, ratings, user counts or logos until they are real |
| 10 | Remove builder leftovers | No starter copy, default icons or developer badge |
| 11 | Show it sites you like | Work from the references below. Borrow principles, never layouts |
| 12 | Keep a design file | This file |
| 13 | Make it screenshot its world | Look at real gigs and the real city, then screenshot every changed screen |

## References, screenshotted 2026-11-22

| Site | What we learn | What we don't take |
| --- | --- | --- |
| boilerroom.tv | Photography carries the mood. Type is simple and huge | Yellow, all-black navigation wall |
| dice.fm | Condensed gig-poster headlines, few words | Mascot, all caps |
| feeld.co | One hot accent on darkness, a real app screen | Purple, blurred text animation |

Add the founder's own favorite sites here when they share them.

## Color

Tokens live in `app/globals.css`. Never type a hex value into a screen.

| Token | Hex | Job |
| --- | --- | --- |
| night | `#000000` | Page |
| chalk | `#fff2ee` | Text |
| flame | `#ff2a1f` | The main action, active states, dating. **Always black text on it** |
| blush | `#ff8fb8` | Friends, secondary blocks. Black text on it |
| lamp | `#ffd23f` | Record labels, warnings, destructive actions. Black text on it |
| cherry | `#23070a` | Raised surface |
| seam | `#4a1418` | Dividers |
| edge | `#a8686b` | Control borders |
| muted | `#d9a9a6` | Secondary text |

## Type

- **Display:** Fira Sans Extra Condensed 800, line height 0.95, sentence case. Use the `poster` class.
- **Reading and controls:** Golos Text 400–700. Inputs are never under 16px.
- A new font must contain Ө ө Ү ү. "Supports Cyrillic" is not proof.

## Shape and layout

- Photos and color blocks are square and run edge to edge. Sleeves 2px, controls 6px, dialogs 12px.
- No shadows. Separate things with color, size or a line.
- Text never sits on a busy part of a photo without a solid block or a dark area behind it.
- The signature is the personal record sleeve, made from someone's genres.

## Photos

Never use a recognizable stranger's face: on a dating app it looks like a real member.
Files are in `public/photos`, used under the [Unsplash license](https://unsplash.com/license).

| File | Photographer | Source id |
| --- | --- | --- |
| red-crowd.jpg | @sterre_reeuwijk | photo-1682447404920-4be1294c2854 |
| red-hands.jpg | @noiseporn | photo-1493308903033-e622ac815e5d |
| turntable.jpg | @onegrandtrip | photo-1719935114341-3984490e0e4c |
| ub-night.jpg | @naranbayar_1 | photo-1613739519297-e7947a931ba4 |

`public/screens` holds real screenshots of this app with fictional people. Retake them when those screens change.

## Before calling a change done

Screenshot it at 360px and 1280px, in Mongolian and English. Check all 13 rules, contrast, tap size and overflow.
