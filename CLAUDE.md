# Standing instructions for this project

@DESIGN.md

- The 13 rules in DESIGN.md apply to every visual change. The owner asked for them to always be kept in mind.
- The concept is dating + friends + music for any adult, 18+. No student requirement and no minors.
- The look follows Apple Music's structure, on black, with four colors: black, white, a light and a deep purple. Categories are text only: the first 20 music genres from Spotify's Browse page. No emergency numbers. Don't reintroduce bright colors or extra pictures.
- `data/` holds real accounts. Never commit, print, delete or test against it. Use `APP_DB_PATH` with a throwaway file for tests.
- Never ask for, read or type the owner's password, app password or `.env.local`.
- Messages are sensitive data. Never read, print or log them. Chat needs consent, a connection and no block, checked on the server.
- Schema changes only add tables. Back up `data/app.db` first and test the upgrade on a throwaway old-format file.
- The owner is a beginner. Explain decisions simply and explain terminal commands before running them.
- Ask before destructive operations, new packages, downloads, commits or uploads. The GitHub repository is public.
- Never silently remove existing functionality.
- On this computer use `npm.cmd` in PowerShell.
- Read docs/SAFETY.md and docs/DATA.md before touching profiles, people, accounts or storage.
