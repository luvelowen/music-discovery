# Mixtape (v0.3): the no-server version

Make a music card, send it to friends as a link, see what you have in common.
Same concept and same "Encore" design as the main app, but **nothing is stored on any server**.

## How it works

| What | Where it lives |
| --- | --- |
| Your card (nickname, genres, artists, songs, anthem) | This browser's storage, on your own phone or computer |
| Your friends list | The same browser storage |
| A card you send | Inside the link, after `#`. Browsers never send that part to the website |
| Accounts, emails, passwords, messages, photos, birthdays | **Don't exist** |

The website is only files (HTML, CSS, JavaScript, fonts, one photo). It has no database and no code that runs on the server,
so it can't receive, keep or leak anyone's card.

## Why this avoids most of the legal work

Mongolia's personal data law is about people or companies that **collect, keep or use** personal data.
This site doesn't collect or keep any: no sign-up, no database, no cookies, no analytics, nothing sent to outside services.
That removes the consent forms, breach register, data officer and cross-border transfer questions that the main app needs.

What is still true, plainly:

- **This is not legal advice.** If you ever add accounts, a database, chat, photos, ads or analytics, the duties come back.
- **The host's access log** may record visitors' internet addresses, like every website. Ask the host to keep logs short or switch them off.
- **Your name or company** should appear somewhere as the person running the site, and you must answer if someone writes to you.
- **People can still put anything in a nickname or song title** and send it to their own friends. You don't host it, but have a contact anyway.

## Host it in Mongolia

Any Mongolian web hosting with HTTPS works, because these are plain files. The cheapest "shared hosting" or "cPanel" plan is enough.

1. Buy hosting and a domain from a company with servers in Mongolia. Ask them: *"Are your servers in Mongolia? Is free HTTPS (SSL) included?"*
2. Run `npm.cmd run site:build` once, so `site/data.js` matches the main app's music lists.
3. Upload **everything inside the `site/` folder** (including the hidden `.htaccess` file) to the host's `public_html` folder,
   with the host's File Manager or an FTP program.
4. Turn on HTTPS (SSL) in the host's control panel. Sharing and copying links only work over https.
5. Open your address on a phone, make a card, and send yourself the link.

`.htaccess` sets the security rules on Apache hosts (most cPanel hosts): https only, no framing, nothing loads from other sites.
If your host uses nginx instead, send them the headers listed in `.htaccess` and ask them to add them.

## Try it on this computer

```powershell
npm.cmd run site
```

Then open http://localhost:8080. Stop it with Ctrl+C.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The page shell. Its content security policy blocks anything from other sites |
| `app.js` | Pages, the card maker, sharing and the friends list |
| `card.js` | The card format, the strict checks on links, and comparing two cards. Tested in `tests/site.test.ts` |
| `i18n.js` | Mongolian and English wording for this site. **A native speaker should read the Mongolian** |
| `data.js` | Genres and artists, made from the main app by `scripts/build-site.ts`. Don't edit by hand |
| `style.css`, `fonts.css`, `fonts/` | The Encore look. Manrope and Montserrat, SIL Open Font License, served from this site |
| `photos/ub-night.jpg` | The one photo, by @naranbayar_1 on Unsplash (Unsplash license) |
| `.htaccess` | Security headers and https for Apache hosting |
