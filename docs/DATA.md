# Where users' data goes

Researched 2026-11-22. **This is not legal advice. A Mongolian lawyer must confirm it before real users join.**

## Today: nowhere

There is no server database, account, analytics or tracking.

| Data | Where it is |
| --- | --- |
| Profile, photo, genres, artists, songs, links, friends/dating choice | The user's browser |
| Connections, blocks, reports, privacy settings, age-check result | The user's browser |
| Language | A cookie. The web server reads it to choose the language |
| Date of birth | Used once and never saved |
| Location, gender, sexual orientation | Never asked |
| This code | Public on GitHub, once uploaded. It contains no user data |

If the app is put online, the host will also see IP addresses and request logs.
The Next.js developer tool reports anonymous usage about the developer's machine, never users' profiles.
Switch it off with `npx.cmd next telemetry disable`.

## With real accounts: what the law says

Law on Personal Data Protection (2021), from the unofficial English translation:

| Article | Rule | What it means for us |
| --- | --- | --- |
| 4.1.12, 9.1 | Correspondence, sexual and gender orientation, and sexual relations are sensitive personal secrets | Chat and dating preferences are the most protected data we could hold |
| 7, 8 | Consent must state purpose, controller, data list, duration, publication, sharing and withdrawal | A separate, clear consent screen |
| 10 | Biometric collection is limited to listed cases | No face-scan age checks |
| 14.1 | Transfer abroad is prohibited without a legal or treaty basis, or the person's consent | A database abroad needs at least consent |
| 20, 22 | Security procedures, a breach plan, notice to affected people, yearly record to the Human Rights Commission | Someone must own this before launch |
| 23 | An assessment when sensitive data is processed regularly | Do it before collecting preferences |

A ministry procedure (order A/90, 2023-09-11) is reported by
[DLA Piper](https://www.dlapiperdataprotection.com/index.html?c=MN&t=security) to require the processing server to be
**located in Mongolia and accessible only from Mongolia**. Its exact scope for private companies is unclear:
the procedure itself could not be read.

## The choices

| Option | Good | Bad |
| --- | --- | --- |
| **Supabase, self-hosted in a Mongolian data center (provisional recommendation)** | Data stays in Mongolia, same technology | Someone must maintain, secure and back up the server |
| Supabase cloud in Seoul or Tokyo | Easiest. Managed for us | Data leaves Mongolia, and may break the server rule even with consent |
| Split: ordinary data abroad, sensitive data in Mongolia | Less to maintain locally | Complicated, and dating intent may itself be sensitive |

[Supabase has no Mongolia region](https://supabase.com/docs/guides/platform/regions).

## Questions for the lawyer

1. Does order A/90 bind a private app, and for all data or only sensitive data?
2. Is choosing "dating", without gender or preference, already sensitive data?
3. Is consent enough for hosting in Seoul?
4. Which age check is lawful without biometrics?
5. How long may reports and deleted-account records be kept?

## Sources

- [The law, official Mongolian text](https://legalinfo.mn/mn/detail?lawId=16390288615991)
- [Unofficial English translation (PDF)](https://cyrilla.org/api/files/1728476367950dd4g86zulst.pdf)
- [The ministry procedure](https://legalinfo.mn/mn/detail?lawId=16760452348261)
