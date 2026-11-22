import type { GenreId } from '../music/genres.ts';
import { communityEn } from './community.en.ts';

export const en = {
  // A description, not a brand. Change it here and in mn.ts once a name is chosen.
  appName: 'Music community',
  languageLabel: 'Language',
  skip: 'Skip to content',
  loading: 'Loading your profile',

  welcome: {
    title: 'Discover people through the music you love.',
    subtitle: 'Discover new music through people.',
    body: 'A music and friendship community for university students in Ulaanbaatar, aged 18 and over.',
    start: 'Create my music profile',
    resume: 'Continue my music profile',
    view: 'View my profile',
    exampleCover: 'An example cover. Yours will be made from the music you pick.',
    yourCover: 'Your cover, made from the music you picked.',
    shelfTitle: 'Start with a sound you love',
    shelfHint: 'Tap a sleeve to add it to your cover.',
    promises: [
      { title: 'Music comes first', body: 'People who haven’t connected with you see your music and username. They don’t see your photo, bio or links.' },
      { title: 'Friends, not dating', body: 'This is a place to share music and make friends. There are no romantic matches.' },
      { title: 'Your location stays yours', body: 'We don’t ask where you are, and the app can’t read your device’s location.' },
    ],
  },

  steps: { genres: 'Genres', artists: 'Artists', tracks: 'Songs', links: 'Spotify', about: 'About you' },

  setup: {
    progress: (current: number, total: number) => `Step ${current} of ${total}`,
    back: 'Back',
    next: 'Continue',
    skipStep: 'Skip for now',
    finish: 'Preview my profile',
    save: 'Save changes',
    remove: (name: string) => `Remove ${name}`,
    add: 'Add',
    count: (count: number, max: number) => `${count} of ${max} added`,
    coverEmpty: 'Your cover takes shape as you pick genres.',
    localOnly: 'Saved only in this browser. Nothing has been published.',
    saveFailed: 'Your browser blocked saving. Your changes will be lost when you close this tab.',
  },

  genresStep: {
    title: 'What do you listen to?',
    body: 'Pick up to five. Your first pick takes the biggest space on your cover.',
    selected: (count: number, max: number) => `${count} of ${max} picked`,
    limit: 'That’s five. Tap one of your picks to swap it out.',
    required: 'Pick at least one genre to continue.',
  },

  artistsStep: {
    title: 'Who’s always on repeat?',
    body: 'Add up to ten artists. Local or international, famous or barely known.',
    label: 'Artist or band',
    placeholder: 'For example, Magnolian',
    suggestions: 'Suggested artists',
    noMatch: 'Not on our list? Press Add to use the name you typed.',
  },

  tracksStep: {
    title: 'Which songs feel like you?',
    body: 'Add up to five songs. They give people an easy way to start talking about music.',
    trackTitle: 'Song title',
    trackArtist: 'Artist',
    add: 'Add song',
  },

  linksStep: {
    title: 'Share your Spotify',
    body: 'Optional. Add a profile or playlist link. Only your connections will see it.',
    label: 'Spotify profile or playlist link',
    help: 'In Spotify, tap Share, then Copy link. We remove the tracking code from the end.',
    privacy: 'Check your Spotify first: a profile can show your real name, photo and playlists.',
    profile: 'Spotify profile',
    playlist: 'Spotify playlist',
  },

  aboutStep: {
    title: 'Put a name to the music',
    body: 'Use a nickname. You don’t need your real name, school or contact details here.',
    username: 'Username',
    usernameHelp: 'Everyone can see this. 3–24 letters, numbers, dots or underscores.',
    bio: 'Short bio (optional)',
    bioHelp: 'Only connections see this.',
    bioPlaceholder: 'Learning bass. Always looking for new indie bands.',
    photo: 'Profile picture (optional)',
    photoHelp: 'Only connections see this. Others see artwork from your top genre.',
    choosePhoto: 'Choose picture',
    changePhoto: 'Change picture',
    removePhoto: 'Remove picture',
  },

  errors: {
    usernameLength: 'Use 3 to 24 characters.',
    usernameCharacters: 'Use only letters, numbers, dots and underscores, without spaces.',
    contactInfo: 'For your safety, leave out phone numbers, emails, handles and links.',
    duplicate: 'You’ve already added that.',
    full: 'The list is full. Remove one to add another.',
    empty: 'Type a name first.',
    trackIncomplete: 'Add both the song title and the artist.',
    invalid: 'That isn’t a Spotify profile or playlist link. It should start with open.spotify.com.',
    shortLink: 'Short links can’t be checked. Open it, then copy the full open.spotify.com address.',
    wrongKind: 'That link is for a song, album, artist or show. Use a profile or playlist link.',
    oneProfile: 'You can add one profile. Remove the current one to replace it.',
    photoType: 'That file couldn’t be opened. Choose a JPG, PNG or WebP picture.',
    photoSize: 'Choose a picture smaller than 10 MB.',
  },

  profile: {
    title: 'Your profile preview',
    body: 'Check what other people will see before anything is published.',
    viewAs: 'Preview as',
    stranger: 'Someone new',
    connection: 'A connection',
    strangerNote: 'Your photo, bio and Spotify links are hidden from people you haven’t connected with.',
    connectionNote: 'People you accept as connections see your whole profile.',
    genres: 'Genres',
    artists: 'On repeat',
    tracks: 'Favorite songs',
    links: 'Listen on Spotify',
    newTab: '(opens in a new tab)',
    edit: 'Edit your profile',
    incompleteTitle: 'Your profile isn’t ready yet',
    incompleteBody: 'Pick at least one genre and a username to see your preview.',
    incompleteAction: 'Finish my profile',
    comingNext: 'This is a prototype, so your profile stays in this browser and no real person can see it.',
    discover: 'Discover people',
    hiddenNote: 'You’re hidden from Discover. You can change this in Settings.',
  },

  deleteData: {
    trigger: 'Delete from this browser',
    title: 'Delete your profile from this browser?',
    body: 'Your profile, connections, settings, blocks and reports will be erased. You can’t undo this.',
    confirm: 'Delete profile',
    cancel: 'Keep profile',
  },

  community: communityEn,

  notFound: { title: 'This page doesn’t exist', action: 'Go to the start' },

  genres: {
    mongolianPop: 'Mongolian pop', hipHop: 'Hip-hop', kPop: 'K-pop', pop: 'Pop', indie: 'Indie', rock: 'Rock',
    longSong: 'Long song', throatSinging: 'Throat singing', morinKhuur: 'Morin khuur', ethnoFusion: 'Ethno fusion',
    composedSongs: 'Mongolian classics', rnb: 'R&B', electronic: 'Electronic', lofi: 'Lo-fi', jazz: 'Jazz',
    classical: 'Classical', metal: 'Metal', jPop: 'J-pop & anime',
  } satisfies Record<GenreId, string>,
};

export type Dictionary = typeof en;
