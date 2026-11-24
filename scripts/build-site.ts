/**
 * Copies the music lists from the main app into the Mixtape site, so both use the same genres and artists.
 *   npm.cmd run site:build
 * Writes site/data.js. Run it again after changing lib/music/ or the genre names.
 */
import { writeFileSync } from 'node:fs';
import { ARTISTS } from '../lib/music/artists.ts';
import { GENRE_IDS } from '../lib/music/genres.ts';
import { en } from '../lib/i18n/en.ts';
import { mn } from '../lib/i18n/mn.ts';

// Only plain words: wording that is a function (counts, names) is written in site/i18n.js instead.
const words = (source: Record<string, unknown>) => Object.fromEntries(Object.entries(source).filter(([, value]) => typeof value === 'string'));
const steps = (t: typeof en) => ({
  setup: words(t.setup), genresStep: words(t.genresStep), artistsStep: words(t.artistsStep), tracksStep: words(t.tracksStep),
});

const data = {
  words: { en: steps(en), mn: steps(mn as typeof en) },
  genres: GENRE_IDS,
  genreNames: {
    en: Object.fromEntries(GENRE_IDS.map((id) => [id, en.genres[id]])),
    mn: Object.fromEntries(GENRE_IDS.map((id) => [id, mn.genres[id]])),
  },
  artists: ARTISTS.map(({ id, name, mn: local, genres }) => ({ id, name, ...(local ? { mn: local } : {}), genres })),
  appName: { en: en.appName, mn: mn.appName },
  welcome: {
    en: { title: en.welcome.title, photo: en.welcome.photo, credit: en.welcome.credit },
    mn: { title: mn.welcome.title, photo: mn.welcome.photo, credit: mn.welcome.credit },
  },
};

writeFileSync(
  'site/data.js',
  `// Made by scripts/build-site.ts from lib/music and lib/i18n. Don't edit by hand.\nexport const DATA = ${JSON.stringify(data, null, 1)};\n`,
);
console.log(`site/data.js: ${data.genres.length} genres, ${data.artists.length} artists.`);
