# Keeping keys and passwords safe

The repository on GitHub is **public**. Anything committed can be read by anyone, forever, even after it is deleted.

## Where secrets live

| Secret | Where it goes | Never in |
| --- | --- | --- |
| Gmail app password (`SMTP_PASS`) and any future API key | `.env.local` on the computer running the app | `.env.example`, code, screenshots, chat |
| People's accounts and messages | `data/app.db` | GitHub, backups you share |
| Papers for the lawyer | `private/` | GitHub |

- `.env.local`, `data/`, `private/`, `*.db`, `*.pem`, `*.key` and credential files are in `.gitignore`.
- Variables are read only on the server (`lib/server/`). The browser never receives them.
- A variable whose name starts with `NEXT_PUBLIC_` is copied into every visitor's browser.
  The build stops if a secret-sounding name (PASS, SECRET, KEY, TOKEN, SMTP) starts with it.

## Checks

- `npm.cmd run check-secrets` scans every file in the repository for key shapes and forbidden files.
  It prints the file and line, never the secret.
- `npm.cmd run hooks` (once per computer) turns on `.githooks/pre-commit`, which runs the same scan
  on every commit and stops it if something looks secret.

## If a secret was ever pushed

Deleting the file is not enough. **Change the secret first** (create a new Gmail app password and delete the old one
at https://myaccount.google.com/apppasswords), then put the new one in `.env.local`.

## What the app already does

- Passwords are scrambled with a slow hash. Log-in is limited to 5 tries per 15 minutes per email.
- Session cookies can't be read by scripts, are sent only to this site, and only over https once `APP_HOSTS` is set.
- Every write checks that it came from this site's own page and the signed-in account.
- Security headers in `next.config.ts`: pages load only from this app, no framing, no camera, microphone or location,
  and other sites can't embed its files.
