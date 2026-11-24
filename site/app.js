/**
 * Mixtape: make a music card, send it as a link, see what you share.
 * No server, no accounts. The card and friends list live in this browser's storage only.
 * Every piece of text reaches the page through textContent, never as HTML.
 */
import { blend, compare, decode, emptyCard, encode, fromFriends, LIMITS, pack, sanitize, sharedCount, clean, toArtist } from './card.js';
import { DATA } from './data.js';
import { STRINGS } from './i18n.js';
import { storyImage } from './story.js';

// ---------- Storage: wrapped, because private windows can refuse it ----------
const KEYS = { card: 'mixtape.card', friends: 'mixtape.friends', lang: 'mixtape.lang', pending: 'mixtape.pending' };
const read = (key, fallback, area = 'local') => {
  try {
    const raw = (area === 'local' ? localStorage : sessionStorage).getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value, area = 'local') => {
  try {
    const store = area === 'local' ? localStorage : sessionStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing to do: the page still works for this visit.
  }
};

// Stored data is checked like a link: someone could have edited it.
const loadCard = () => sanitize(read(KEYS.card, null), DATA);
const loadFriends = () => (Array.isArray(read(KEYS.friends, [])) ? read(KEYS.friends, []) : []).map((raw) => sanitize(raw, DATA)).filter(Boolean).slice(0, 200);

const state = {
  lang: read(KEYS.lang, 'mn') === 'en' ? 'en' : 'mn',
  card: loadCard(),
  friends: loadFriends(),
  draft: null,
  first: true,
  pick: null,
  install: null,
};

const saveCard = () => write(KEYS.card, pack(state.card, DATA));

// Chrome and Android offer "install"; keep the offer for the button on My card.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  state.install = event;
  if (currentPage() === 'me') route({ keepFocus: true });
});
const onIPhone = () => /iP(hone|ad|od)/.test(navigator.userAgent) && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches;

const t = () => STRINGS[state.lang];
const w = () => DATA.words[state.lang];
const genreName = (id) => DATA.genreNames[state.lang][id] ?? id;
const artistLabel = (artist) => (state.lang === 'mn' && DATA.artists.find((known) => known.id === artist.id)?.mn) || artist.name;
const same = (a, b) => JSON.stringify(pack(a, DATA)) === JSON.stringify(pack(b, DATA));

// ---------- Building elements safely ----------
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : String(kid));
  }
  return el;
}

// A few Lucide icons (ISC licence), drawn inline.
const ICONS = {
  back: ['M15 18l-6-6 6-6'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  star: ['M11.5 2.3a.5.5 0 0 1 1 0l2.3 4.7a2 2 0 0 0 1.5 1.1l5.2.8a.5.5 0 0 1 .3.9l-3.8 3.6a2 2 0 0 0-.6 1.8l.9 5.2a.5.5 0 0 1-.8.6l-4.6-2.5a2 2 0 0 0-1.9 0l-4.6 2.5a.5.5 0 0 1-.8-.6l.9-5.2a2 2 0 0 0-.6-1.8L1.2 9.8a.5.5 0 0 1 .3-.9l5.2-.8a2 2 0 0 0 1.5-1.1z'],
  music: ['M9 18V5l12-2v13', 'M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', 'M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  check: ['M20 6 9 17l-5-5'],
  right: ['M9 18l6-6-6-6'],
  plus: ['M5 12h14', 'M12 5v14'],
  image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21'],
  download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
};
function icon(name, label) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icon');
  if (label) svg.setAttribute('aria-label', label);
  else svg.setAttribute('aria-hidden', 'true');
  for (const d of ICONS[name]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

const announce = (text) => {
  const status = document.getElementById('status');
  status.textContent = '';
  requestAnimationFrame(() => (status.textContent = text));
};
const go = (path) => {
  if (location.hash === `#${path}`) route();
  else location.hash = path;
};

// ---------- Shared pieces ----------
function cardView(card, extra) {
  const anthem = card.tracks[card.anthem];
  const words = t().card;
  const list = (items, render) => (items.length ? h('ol', { class: 'numbered' }, items.map((item) => h('li', {}, render(item)))) : h('p', { class: 'muted small', text: words.empty }));
  return [
    h('div', { class: 'hero' },
      h('div', { class: 'avatar', 'aria-hidden': 'true', text: [...card.name][0] ?? '' }),
      h('h1', { class: 'title', tabindex: '-1', text: card.name }),
      anthem && h('p', { class: 'anthem' }, icon('music'), h('span', {}, h('span', { class: 'sr-only', text: `${words.anthem}: ` }), `${anthem.title}${anthem.artist ? ` · ${anthem.artist}` : ''}`)),
      extra,
    ),
    h('section', { class: 'section' }, h('h2', { text: words.genres }), card.genres.length ? h('p', { text: card.genres.map(genreName).join(', ') }) : h('p', { class: 'muted small', text: words.empty })),
    h('section', { class: 'section' }, h('h2', { text: words.artists }), list(card.artists, (artist) => artistLabel(artist))),
    h('section', { class: 'section' }, h('h2', { text: words.tracks }), list(card.tracks, (track) => [h('span', {}, track.title, track.artist && h('span', { class: 'by', text: track.artist }))])),
  ];
}

async function linkFor(card) {
  return `${location.origin}${location.pathname}#/c/${await encode(card, DATA)}`;
}

/** The phone's own share sheet when there is one, the clipboard otherwise, and a box to copy from as a last resort. */
async function shareCard(card, slot) {
  const url = await linkFor(card);
  const words = t().me;
  slot.replaceChildren();
  if (navigator.share) {
    try {
      await navigator.share({ title: DATA.appName[state.lang], text: words.shareText(card.name), url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    slot.append(h('p', { class: 'small muted', role: 'status', text: words.copied }));
    return;
  } catch {
    const box = h('input', { class: 'input', readonly: true, value: url, 'aria-label': words.copyHere, onfocus: (event) => event.target.select() });
    slot.append(h('div', { class: 'copy-box' }, h('p', { class: 'small muted', text: words.copyHere }), box));
    box.focus();
  }
}

// ---------- Pages ----------
function welcomePage() {
  const words = t().welcome;
  const has = Boolean(state.card);
  return h('div', { class: 'welcome' },
    h('div', {},
      h('h1', { class: 'display', tabindex: '-1', text: DATA.welcome[state.lang].title }),
      h('p', { class: 'lead', text: words.body }),
      h('div', { class: 'buttons' },
        has ? h('a', { class: 'btn btn-primary btn-big', href: '#/me', text: words.open }) : h('a', { class: 'btn btn-primary btn-big', href: '#/make/1', text: words.start }),
        has ? h('a', { class: 'btn btn-secondary btn-big', href: '#/friends', text: t().nav.friends }) : null,
      ),
      h('section', { class: 'how' }, h('h2', { text: words.how }), h('ol', {}, words.steps.map((step) => h('li', { text: step })))),
    ),
    h('figure', { class: 'photo' },
      h('div', {}, h('img', { src: 'photos/ub-night.jpg', alt: DATA.welcome[state.lang].photo, width: '1200', height: '1500', decoding: 'async' })),
      h('figcaption', { text: DATA.welcome[state.lang].credit }),
    ),
  );
}

const STEPS = 4;
function stepFrame(step, title, body, content, { next, nextLabel, canSkip }) {
  const words = w().setup;
  const problem = h('div');
  const label = () => nextLabel ?? (canSkip?.() ? words.skipStep : words.next);
  const submit = h('button', { type: 'submit', class: 'btn btn-primary btn-big', text: label() });
  const form = h('form', {
    class: 'step',
    novalidate: true,
    onsubmit: (event) => {
      event.preventDefault();
      const error = next();
      problem.replaceChildren();
      if (error) problem.append(h('p', { class: 'alert', role: 'alert', text: error }));
    },
  },
    h('div', { class: 'progress' },
      h('button', { type: 'button', class: 'icon-btn', disabled: step === 1, 'aria-label': words.back, onclick: () => go(`/make/${step - 1}`) }, icon('back')),
      h('div', { class: 'segments', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(STEPS), 'aria-valuenow': String(step), 'aria-label': `${step}/${STEPS}` },
        Array.from({ length: STEPS }, (_, index) => h('span', { class: index < step ? 'on' : '' }))),
      h('span', { class: 'tiny muted', text: `${step}/${STEPS}` }),
    ),
    h('h1', { class: 'title', tabindex: '-1', text: title }),
    body && h('p', { class: 'lead', text: body }),
    h('div', { class: 'step-body', onclick: () => problem.replaceChildren(), oninput: () => problem.replaceChildren() }, content),
    problem,
    h('div', { class: 'bar' }, submit),
  );
  // "Skip for now" turns into "Continue" once something is added.
  form.addEventListener('mixtape:changed', () => (submit.textContent = label()));
  return form;
}

function genresStep(draft) {
  const words = w().genresStep;
  const count = h('p', { class: 'count', 'aria-live': 'polite' });
  const limit = h('p', { class: 'small muted', 'aria-live': 'polite' });
  const paint = () => (count.textContent = t().make.selected(draft.genres.length, LIMITS.genres));
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': words.title },
    DATA.genres.map((id) => {
      const chip = h('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(draft.genres.includes(id)), text: genreName(id),
        onclick: () => {
          limit.textContent = '';
          if (draft.genres.includes(id)) draft.genres = draft.genres.filter((item) => item !== id);
          else if (draft.genres.length < LIMITS.genres) draft.genres = [...draft.genres, id];
          else return (limit.textContent = words.limit);
          chip.setAttribute('aria-pressed', String(draft.genres.includes(id)));
          paint();
        },
      });
      return chip;
    }));
  paint();
  return stepFrame(1, words.title, words.body, [chips, count, limit], {
    next: () => {
      if (!draft.genres.length) return t().make.need;
      go('/make/2');
    },
  });
}

function artistsStep(draft) {
  const words = w().artistsStep;
  const input = h('input', { class: 'input', id: 'artist', placeholder: words.placeholder, autocomplete: 'off', maxlength: String(LIMITS.text), enterkeyhint: 'done' });
  const list = h('ul', { class: 'group', hidden: true });
  const count = h('p', { class: 'count', 'aria-live': 'polite' });
  const suggestions = h('div', { class: 'chips' });

  const add = (text) => {
    const artist = toArtist(text, DATA.artists);
    if (!artist || draft.artists.length >= LIMITS.artists) return;
    // Already there (maybe typed another way, like "хурд" for Hurd): just clear the box.
    if (!draft.artists.some((item) => item.id === artist.id)) draft.artists = [...draft.artists, artist];
    input.value = '';
    paint();
  };
  const paint = () => {
    list.hidden = !draft.artists.length;
    list.replaceChildren(...draft.artists.map((artist) => h('li', {},
      h('span', { class: 'grow', text: artistLabel(artist) }),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': t().make.remove(artistLabel(artist)), onclick: () => { draft.artists = draft.artists.filter((item) => item.id !== artist.id); paint(); } }, icon('close')),
    )));
    count.textContent = t().make.added(draft.artists.length, LIMITS.artists);
    list.dispatchEvent(new Event('mixtape:changed', { bubbles: true }));
    const key = input.value.trim().toLocaleLowerCase();
    const score = (artist) => artist.genres.filter((id) => draft.genres.includes(id)).length;
    const options = DATA.artists
      .filter((artist) => !draft.artists.some((item) => item.id === artist.id) && `${artist.name} ${artist.mn ?? ''}`.toLocaleLowerCase().includes(key))
      .sort((a, b) => score(b) - score(a))
      .slice(0, 8);
    suggestions.replaceChildren(...options.map((artist) => h('button', { type: 'button', class: 'chip', text: artistLabel(artist), onclick: () => add(artist.name) })));
  };
  input.addEventListener('input', paint);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (input.value.trim()) add(input.value);
    }
  });
  paint();

  return stepFrame(2, words.title, words.body, [
    h('div', { class: 'row-form' },
      h('label', { class: 'field', for: 'artist' }, h('span', { text: words.label }), input),
      h('button', { type: 'button', class: 'btn btn-secondary btn-big', onclick: () => input.value.trim() && add(input.value) }, icon('plus'), w().setup.add),
    ),
    h('p', { class: 'help', text: words.noMatch }),
    h('h2', { class: 'label', text: words.suggestions }),
    suggestions,
    h('div', { class: 'section' }, list, count),
  ], { next: () => void go('/make/3'), canSkip: () => !draft.artists.length });
}

function tracksStep(draft) {
  const words = w().tracksStep;
  const title = h('input', { class: 'input', id: 'song-title', autocomplete: 'off', maxlength: String(LIMITS.text) });
  const artist = h('input', { class: 'input', id: 'song-artist', autocomplete: 'off', maxlength: String(LIMITS.text) });
  const list = h('ul', { class: 'group', hidden: true });
  const count = h('p', { class: 'count', 'aria-live': 'polite' });

  const add = () => {
    const track = { title: clean(title.value, LIMITS.text), artist: clean(artist.value, LIMITS.text) };
    if (!track.title || draft.tracks.length >= LIMITS.tracks) return;
    const key = (item) => `${item.title}\n${item.artist}`.toLocaleLowerCase();
    if (!draft.tracks.some((item) => key(item) === key(track))) draft.tracks = [...draft.tracks, track];
    title.value = '';
    artist.value = '';
    title.focus();
    paint();
  };
  const paint = () => {
    list.hidden = !draft.tracks.length;
    list.replaceChildren(...draft.tracks.map((track, index) => h('li', {},
      h('button', {
        type: 'button', class: 'icon-btn', 'aria-pressed': String(draft.anthem === index), 'aria-label': t().make.makeAnthem(track.title),
        onclick: () => { draft.anthem = draft.anthem === index ? -1 : index; paint(); },
      }, icon('star')),
      h('span', { class: 'grow' }, track.title, track.artist && h('span', { class: 'small muted', text: ` · ${track.artist}` })),
      h('button', {
        type: 'button', class: 'icon-btn', 'aria-label': t().make.remove(track.title),
        onclick: () => {
          draft.tracks = draft.tracks.filter((_, other) => other !== index);
          if (draft.anthem === index) draft.anthem = -1;
          else if (draft.anthem > index) draft.anthem -= 1;
          paint();
        },
      }, icon('close')),
    )));
    count.textContent = t().make.added(draft.tracks.length, LIMITS.tracks);
    list.dispatchEvent(new Event('mixtape:changed', { bubbles: true }));
  };
  for (const box of [title, artist]) {
    box.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        add();
      }
    });
  }
  paint();

  return stepFrame(3, words.title, words.body, [
    h('div', { class: 'pair' },
      h('label', { class: 'field', for: 'song-title' }, h('span', { text: words.trackTitle }), title),
      h('label', { class: 'field', for: 'song-artist' }, h('span', { text: words.trackArtist }), artist),
    ),
    h('button', { type: 'button', class: 'btn btn-secondary', onclick: add }, icon('plus'), words.add),
    h('div', { class: 'section' }, list, count, h('p', { class: 'help', text: t().make.anthemHelp })),
  ], { next: () => void go('/make/4'), canSkip: () => !draft.tracks.length });
}

function nameStep(draft) {
  const words = t().make;
  const input = h('input', { class: 'input', id: 'nickname', value: draft.name, autocomplete: 'nickname', maxlength: String(LIMITS.name * 2), autocapitalize: 'none', spellcheck: 'false', 'aria-describedby': 'nickname-help' });
  return stepFrame(4, words.nameTitle, words.nameBody, [
    h('label', { class: 'field', for: 'nickname' }, h('span', { text: words.nameLabel }), input),
    h('p', { class: 'help', id: 'nickname-help', text: words.nameHelp }),
  ], {
    nextLabel: state.card ? words.save : words.finish,
    next: () => {
      const name = clean(input.value, LIMITS.name);
      if (!name) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return words.nameError;
      }
      draft.name = name;
      state.card = { ...draft };
      saveCard();
      state.draft = null;
      // Came here from a friend's link: go back and see what you share.
      const pending = read(KEYS.pending, null, 'session');
      write(KEYS.pending, null, 'session');
      go(typeof pending === 'string' && pending.startsWith('/c/') ? pending : '/me');
    },
  });
}

function makePage(step) {
  if (!state.draft) state.draft = state.card ? structuredClone(state.card) : emptyCard();
  const draft = state.draft;
  if (step > 1 && !draft.genres.length) return go('/make/1');
  return [genresStep, artistsStep, tracksStep, nameStep][step - 1](draft);
}

/** Makes the story picture, then opens the share sheet, or shows it with a Save button. */
async function shareStory(button, slot) {
  const words = t().me;
  button.disabled = true;
  slot.replaceChildren(h('p', { class: 'small muted', role: 'status', text: words.storyBusy }));
  try {
    const file = await storyImage(state.card, {
      appName: DATA.appName[state.lang], storyTitle: words.storyTitle, storyCta: words.storyCta,
      anthem: t().card.anthem, artists: t().card.artists, genre: genreName, artist: artistLabel,
      address: `${location.host}${location.pathname.replace(/index\.html$/, '')}`.replace(/\/$/, ''),
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        slot.replaceChildren();
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return slot.replaceChildren();
      }
    }
    const url = URL.createObjectURL(file);
    slot.replaceChildren(
      h('p', { class: 'small muted', role: 'status', text: words.storySaved }),
      h('img', { class: 'story-preview', src: url, alt: words.storyTitle, width: '270', height: '480' }),
      h('a', { class: 'btn btn-secondary', href: url, download: 'music-card.png', text: words.download }),
    );
  } catch {
    slot.replaceChildren(h('p', { class: 'alert', role: 'alert', text: words.storyFail }));
  } finally {
    button.disabled = false;
  }
}

function mePage() {
  if (!state.card) return emptyState(t().me.none);
  const words = t().me;
  const slot = h('div', { class: 'small' });
  const storySlot = h('div', { class: 'story-slot' });
  const storyButton = h('button', { type: 'button', class: 'btn btn-secondary btn-big', onclick: () => shareStory(storyButton, storySlot) }, icon('image'), words.story);
  const install = state.install
    ? h('button', {
        type: 'button', class: 'btn btn-quiet',
        onclick: async () => {
          const offer = state.install;
          state.install = null;
          await offer.prompt();
          route({ keepFocus: true });
        },
      }, icon('download'), words.install)
    : onIPhone() ? h('p', { class: 'small muted', text: words.iosInstall }) : null;
  return h('div', { class: 'page' },
    cardView(state.card, [
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-big', onclick: () => shareCard(state.card, slot) }, icon('share'), words.share),
        h('a', { class: 'btn btn-secondary btn-big', href: '#/make/1', onclick: () => (state.draft = null), text: words.edit }),
      ),
      slot,
    ]),
    h('section', { class: 'section extras' }, storyButton, storySlot, install),
    h('p', { class: 'note', text: words.note }),
  );
}

async function friendPage(code) {
  const card = await decode(code, DATA);
  const words = t().friend;
  if (!card) return emptyState(words.invalid);

  const own = state.card && same(card, state.card);
  const saved = state.friends.some((friend) => same(friend, card));
  const slot = h('div', { class: 'small' });

  const save = h('button', {
    type: 'button', class: 'btn btn-primary btn-big', disabled: saved,
    onclick: () => {
      state.friends = [card, ...state.friends.filter((friend) => friend.name.toLocaleLowerCase() !== card.name.toLocaleLowerCase())].slice(0, 200);
      write(KEYS.friends, state.friends.map((friend) => pack(friend, DATA)));
      save.disabled = true;
      save.replaceChildren(icon('check'), words.saved);
      announce(words.saved);
    },
  }, saved ? [icon('check'), words.saved] : words.save);

  const actions = own
    ? h('p', { class: 'actions muted', text: words.own })
    : h('div', { class: 'actions' }, state.card && save, state.card && h('button', { type: 'button', class: 'btn btn-secondary btn-big', onclick: () => shareCard(state.card, slot) }, icon('share'), words.reply));

  const view = h('div', { class: 'page' }, cardView(card, [actions, slot]));
  if (own) return view;

  if (!state.card) {
    write(KEYS.pending, `/c/${code}`, 'session');
    // Right under their name: this is what people came for.
    view.firstElementChild.after(h('div', { class: 'callout' },
      h('p', { text: words.makeYours }),
      h('a', { class: 'btn btn-primary', href: '#/make/1', text: t().welcome.start }),
    ));
    return view;
  }

  const result = compare(state.card, card);
  const total = sharedCount(result);
  const block = (title, items) => items.length > 0 && h('div', { class: 'section' }, h('h3', { class: 'small muted', text: title }), h('p', { text: items.join(', ') }));
  view.firstElementChild.after(h('section', { class: 'callout' },
    h('div', { class: 'shared-head' }, h('span', { class: 'big-count', text: String(total) }), h('h2', { text: words.shared })),
    total
      ? [
          block(words.genres, result.genres.map(genreName)),
          block(words.artists, result.artists.map(artistLabel)),
          block(words.tracks, result.tracks.map((track) => track.title)),
        ]
      : h('p', { class: 'muted', text: words.nothing }),
    block(words.newToYou, result.newArtists.map(artistLabel)),
  ));
  return view;
}

function friendsPage() {
  const words = t().friends;
  const page = h('div', { class: 'page' }, h('h1', { class: 'title', tabindex: '-1', text: words.title }), h('p', { class: 'lead', text: words.body }));
  if (!state.friends.length) {
    page.append(h('p', { class: 'callout muted', text: words.empty }));
    return page;
  }
  if (state.card) page.append(h('div', { class: 'actions start' }, h('a', { class: 'btn btn-primary', href: '#/blend' }, icon('users'), words.blend)));
  page.append(h('ul', { class: 'group section' },
    state.friends.map((friend) => friendRow(friend, state.card ? sharedCount(compare(state.card, friend)) : 0, words))));

  const ideas = state.card ? fromFriends(state.card, state.friends) : [];
  if (ideas.length) {
    page.append(h('section', { class: 'section' },
      h('h2', { text: words.discover }),
      h('p', { class: 'small muted', text: words.discoverBody }),
      h('ul', { class: 'group section-sm' }, ideas.map(({ artist, by }) => h('li', {},
        h('span', { class: 'grow' }, h('span', { class: 'friend-name', text: artistLabel(artist) }), h('span', { class: 'small muted block', text: words.likedBy(by) })),
        h('button', {
          type: 'button', class: 'icon-btn', 'aria-label': words.add(artistLabel(artist)),
          onclick: () => {
            if (state.card.artists.length >= LIMITS.artists) {
              announce(words.full);
              return alertIn(page, words.full);
            }
            state.card = { ...state.card, artists: [...state.card.artists, artist] };
            saveCard();
            announce(words.added(artistLabel(artist)));
            route({ keepFocus: true });
          },
        }, icon('plus')),
      ))),
    ));
  }
  return page;
}

function alertIn(page, text) {
  page.querySelector('.alert')?.remove();
  page.append(h('p', { class: 'alert', role: 'alert', text }));
}

function blendPage() {
  const words = t().blend;
  if (!state.card) return emptyState(t().me.none);
  const page = h('div', { class: 'page' }, h('h1', { class: 'title', tabindex: '-1', text: words.title }), h('p', { class: 'lead', text: words.body }));
  if (!state.friends.length) {
    page.append(h('p', { class: 'callout muted', text: words.needFriends }));
    return page;
  }
  // Starts with up to three friends picked, so there's something to see right away.
  if (!state.pick) state.pick = new Set(state.friends.slice(0, 3).map((friend) => friend.name));
  const results = h('div', { 'aria-live': 'polite' });
  const paint = () => {
    const chosen = state.friends.filter((friend) => state.pick.has(friend.name));
    const result = blend([state.card, ...chosen]);
    if (!result) return results.replaceChildren(h('p', { class: 'callout muted', text: words.pickMore }));
    const line = (title, items) => items.length > 0 && h('div', { class: 'section-sm' }, h('h3', { class: 'small muted', text: title }), h('p', { text: items.join(', ') }));
    const everyone = [
      line(t().card.genres, result.genres.map(genreName)),
      line(t().card.artists, result.artists.map(artistLabel)),
      line(t().card.tracks, result.tracks.map((track) => track.title)),
    ].filter(Boolean);
    const most = [...result.mostGenres.map((entry) => [genreName(entry.item), entry.count]), ...result.mostArtists.map((entry) => [artistLabel(entry.item), entry.count])];
    results.replaceChildren(
      h('section', { class: 'callout' },
        h('div', { class: 'shared-head' }, h('span', { class: 'big-count', text: String(sharedCount(result)) }), h('h2', { text: words.everyone })),
        everyone.length ? everyone : h('p', { class: 'muted', text: words.none }),
      ),
      most.length > 0 && h('section', { class: 'section' },
        h('h2', { text: words.most }),
        h('ul', { class: 'group section-sm' }, most.map(([name, count]) => h('li', {}, h('span', { class: 'grow', text: name }), h('span', { class: 'small muted', text: words.of(count, result.size) })))),
      ),
    );
  };
  page.append(
    h('section', { class: 'section' },
      h('h2', { text: words.pick }),
      h('div', { class: 'chips section-sm', role: 'group', 'aria-label': words.pick },
        h('button', { type: 'button', class: 'chip', 'aria-pressed': 'true', disabled: true, text: `${words.you} · ${state.card.name}` }),
        state.friends.slice(0, 30).map((friend) => {
          const chip = h('button', {
            type: 'button', class: 'chip', 'aria-pressed': String(state.pick.has(friend.name)), text: friend.name,
            onclick: () => {
              if (state.pick.has(friend.name)) state.pick.delete(friend.name);
              else if (state.pick.size < 8) state.pick.add(friend.name);
              chip.setAttribute('aria-pressed', String(state.pick.has(friend.name)));
              paint();
            },
          });
          return chip;
        }),
      ),
    ),
    results,
  );
  paint();
  return page;
}

function friendRow(friend, common, words) {
  const row = h('li', {});
  encode(friend, DATA).then((code) => {
    row.append(
      h('a', { class: 'friend grow', href: `#/c/${code}` },
        h('span', { class: 'mini-avatar', 'aria-hidden': 'true', text: [...friend.name][0] ?? '' }),
        h('span', { class: 'friend-text' }, h('span', { class: 'friend-name', text: friend.name }), h('span', { class: 'small muted', text: words.common(common) })),
        icon('right'),
      ),
      h('button', {
        type: 'button', class: 'icon-btn', 'aria-label': words.remove(friend.name),
        onclick: () => {
          state.friends = state.friends.filter((other) => other !== friend);
          write(KEYS.friends, state.friends.map((item) => pack(item, DATA)));
          route();
        },
      }, icon('close')),
    );
  });
  return row;
}

function privacyPage() {
  const words = t().privacy;
  const done = h('p', { class: 'small muted', role: 'status' });
  const dialog = document.getElementById('dialog');
  const ask = () => {
    dialog.replaceChildren(
      h('p', { text: words.confirm }),
      h('div', { class: 'buttons' },
        h('button', { type: 'button', class: 'btn btn-secondary', autofocus: true, text: words.cancel, onclick: () => dialog.close() }),
        h('button', {
          type: 'button', class: 'btn btn-primary', text: words.yes,
          onclick: () => {
            for (const key of Object.values(KEYS)) {
              write(key, null);
              write(key, null, 'session');
            }
            state.card = null;
            state.friends = [];
            state.draft = null;
            dialog.close();
            done.textContent = words.deleted;
            paintChrome();
          },
        }),
      ),
    );
    dialog.showModal();
  };
  return h('div', { class: 'page' },
    h('h1', { class: 'title', tabindex: '-1', text: words.title }),
    h('ul', { class: 'group section' }, words.points.map((point) => h('li', { class: 'small', text: point }))),
    h('p', { class: 'section', text: words.rules }),
    h('div', { class: 'section' }, h('button', { type: 'button', class: 'btn btn-secondary', text: words.delete, onclick: ask }), done),
  );
}

function emptyState(message) {
  return h('div', { class: 'page' },
    h('h1', { class: 'title', tabindex: '-1', text: message }),
    h('div', { class: 'actions start' },
      h('a', { class: 'btn btn-primary btn-big', href: state.card ? '#/me' : '#/make/1', text: state.card ? t().welcome.open : t().welcome.start }),
      h('a', { class: 'btn btn-secondary btn-big', href: '#/', text: t().home }),
    ),
  );
}

// ---------- Header, tab bar, footer ----------
function paintChrome(page = currentPage()) {
  const words = t();
  document.documentElement.lang = state.lang;
  document.getElementById('brand-name').textContent = DATA.appName[state.lang];
  document.getElementById('skip').textContent = words.skip;

  const making = page === 'make';
  const items = state.card ? [['me', '#/me', 'user'], ['friends', '#/friends', 'users']] : [];
  const current = (key) => (page === key || (key === 'friends' && page === 'blend') ? 'page' : null);

  document.getElementById('links').replaceChildren(...(making ? [] : items.map(([key, href]) => h('a', { href, 'aria-current': current(key), text: words.nav[key] }))));

  const lang = document.getElementById('lang');
  lang.setAttribute('aria-label', words.language);
  lang.replaceChildren(...[['mn', 'Монгол'], ['en', 'English']].map(([code, label]) => h('button', {
    type: 'button', lang: code, 'aria-pressed': String(state.lang === code), text: label,
    onclick: () => {
      state.lang = code;
      write(KEYS.lang, code);
      route({ keepFocus: true });
    },
  })));

  const tabbar = document.getElementById('tabbar');
  tabbar.hidden = making || !items.length;
  tabbar.setAttribute('aria-label', words.language === 'Хэл' ? 'Цэс' : 'Menu');
  tabbar.replaceChildren(h('ul', {}, items.map(([key, href, name]) => h('li', {}, h('a', { href, 'aria-current': current(key) }, h('span', { class: 'pill' }, icon(name)), words.nav[key])))));

  document.getElementById('foot').replaceChildren(
    h('a', { href: '#/privacy', text: words.nav.privacy }),
    h('span', { text: DATA.welcome[state.lang].credit }),
  );
}

function currentPage() {
  const [, page = ''] = (location.hash.slice(1) || '/').split('/');
  return { '': 'welcome', make: 'make', me: 'me', c: 'friend', friends: 'friends', blend: 'blend', privacy: 'privacy' }[page] ?? 'missing';
}

const TITLES = { welcome: null, make: (words) => words.welcome.start, me: (words) => words.nav.me, friend: () => null, friends: (words) => words.nav.friends, blend: (words) => words.blend.title, privacy: (words) => words.nav.privacy, missing: (words) => words.notFound };

let routing = 0;
async function route({ keepFocus = false } = {}) {
  const ticket = ++routing;
  const [, page = '', arg = ''] = (location.hash.slice(1) || '/').split('/');
  const name = currentPage();
  if (name !== 'make') state.draft = null;

  let view;
  if (name === 'welcome') view = welcomePage();
  else if (name === 'make') view = makePage(Math.min(STEPS, Math.max(1, Number.parseInt(arg, 10) || 1)));
  else if (name === 'me') view = mePage();
  else if (name === 'friend') view = await friendPage(arg);
  else if (name === 'friends') view = friendsPage();
  else if (name === 'blend') view = blendPage();
  else if (name === 'privacy') view = privacyPage();
  else view = emptyState(t().notFound);
  if (ticket !== routing || !view) return; // A newer page replaced this one while it loaded.

  const main = document.getElementById('main');
  main.replaceChildren(...[view].flat());
  paintChrome(name);

  const appName = DATA.appName[state.lang];
  const heading = main.querySelector('h1')?.textContent;
  const label = TITLES[name]?.(t()) ?? (name === 'friend' ? heading : null);
  document.title = label ? `${label} | ${appName}` : appName;

  if (!keepFocus) {
    window.scrollTo(0, 0);
    // Screen readers hear each new page. The very first load starts at the top as usual.
    if (!state.first) main.querySelector('h1')?.focus({ preventScroll: true });
  }
  state.first = false;
  void page;
}

document.getElementById('skip').addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('main').focus();
});
// Each page starts at the top, also after a reload.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('hashchange', () => route());
// Another tab changed the card or friends: pick it up.
window.addEventListener('storage', () => {
  state.card = loadCard();
  state.friends = loadFriends();
});
route();

// Offline: a service worker keeps the site's files. It never stores or sends any card.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
