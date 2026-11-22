# Before strangers can use it

The app works between real accounts. Putting it on the internet is a separate job, and **it has not been done or tested**.
Don't share a public address until every box below is ticked.

## 1. People and law

- [ ] A Mongolian lawyer has answered the questions in [DATA.md](DATA.md) and read `/privacy` and `/rules`.
- [ ] A real age check is chosen. Today the app believes the date of birth people type. Never face scans.
- [ ] A named adult reads reports every day, in Mongolian, and knows when to go to the police or child protection.
- [ ] Someone owns the breach plan: who is told, and how fast.
- [ ] A native speaker has read every Mongolian screen.

## 2. Server

- [ ] A server in Mongolia, unless the lawyer says otherwise, with a permanent disk and Node.js 22.18 or newer.
- [ ] Only **one** copy of the app running. The database is one file.
- [ ] The disk is encrypted, and few people can open it. Messages are readable in that file.
- [ ] An HTTPS proxy on the same server sends visitors to `localhost:3000`. It must:
  - keep the original `Host` header;
  - set `X-Forwarded-Proto: https` itself, or log-in cookies won't be marked secure;
  - limit requests per network address, most strictly on `/signup`, `/login`, `/forgot` and `/code`.
    The app limits per email and per account, but not per network address.
- [ ] Something restarts the app if it stops.

## 3. Settings

Copy `.env.example` to `.env.local` on the server and fill in every line there.

| Setting | What to put |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | A sender meant for apps. A personal Gmail is only for testing |
| `APP_OPERATOR` | The person or company responsible for the data |
| `APP_CONTACT` | Where people write about privacy, safety and suspensions |
| `APP_DATA_LOCATION` | Where the server is. Shown to users |
| `APP_HOSTS` | The public address, without `https://` |

With `APP_HOSTS` set, sign-up stays closed until the operator, contact and location are filled in.
Codes are never written to files on a public address, so email has to work.
The app sends at most 40 emails an hour in total. Raise `everyoneHourly` in `lib/server/verification.ts` before a big launch.

Never set `APP_DB_PATH` on the real server. It is for tests.

## 4. Every day

- [ ] `npm run moderate`. Danger and possible minors are listed first.
- [ ] `npm run backup`, then move the copy somewhere private and encrypted in Mongolia.
- [ ] Delete old backups on a schedule. A deleted account stays inside old copies.
- [ ] Practise restoring a backup once, on another computer.

## 5. Closed pilot first

- [ ] Start with about 20 invited adults who know it is a test.
- [ ] Try real low-cost Android phones, an iPhone with Safari, and a screen reader. None have been tested.
- [ ] Get a security review from someone who didn't build it.

## Updating the server

In this order: `npm run backup`, stop the app, get the new code, `npm ci`, `npm run build`, `npm start`.
To undo, go back to the earlier code and build it again. New versions only add tables, so it can still read the database.
