import type { Seeking } from '../profile/types.ts';
import type { GenreId } from '../music/genres.ts';
import { accountEn } from './account.en.ts';
import { chatEn } from './chat.en.ts';
import { communityEn } from './community.en.ts';

export const en = {
  // A description, not a brand. Change it here and in mn.ts once a name is chosen.
  appName: 'Music, dates & friends',
  languageLabel: 'Language',
  skip: 'Skip to content',

  welcome: {
    title: 'Find the person you’d give your left earbud to.',
    body: 'Dates and friends in Ulaanbaatar, through the music you listen to. For adults 18+.',
    photo: 'Ulaanbaatar at night',
    credit: 'Ulaanbaatar. Photo: @naranbayar_1 on Unsplash',
  },

  steps: { genres: 'Genres', artists: 'Artists', tracks: 'Songs', links: 'Links', about: 'About you' },

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
  },

  seeking: { friends: 'Friends', dating: 'Dating' } satisfies Record<Seeking, string>,

  genresStep: {
    title: 'What do you listen to?',
    body: 'Pick up to five.',
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
    title: 'Add your links',
    body: 'Optional. Only people you connect with see them.',
    instagram: { button: 'Add Instagram', label: 'Instagram username or link', placeholder: '@username', help: 'We keep only the username and drop tracking codes.' },
    spotify: { button: 'Add Spotify', label: 'Spotify profile or playlist link', placeholder: 'https://open.spotify.com/…', help: 'In Spotify, tap Share, then Copy link. We remove the tracking code from the end.' },
    privacy: 'Check your accounts first: Instagram and Spotify can show your real name, face and posts.',
    profile: 'Spotify profile',
    playlist: 'Spotify playlist',
  },

  aboutStep: {
    title: 'Put a name to the music',
    body: 'Use a nickname. You don’t need your real name, workplace or contact details here.',
    username: 'Username',
    usernameHelp: 'Everyone can see this. 3–24 letters, numbers, dots or underscores.',
    seeking: 'What are you here for?',
    seekingHelp: 'Pick one or both. Dating is shown only to people who picked it too.',
    bio: 'Short bio (optional)',
    bioHelp: 'Only connections see this.',
    bioPlaceholder: 'Learning bass. Always looking for new indie bands.',
    photo: 'Profile picture (optional)',
    photoHelp: 'Only connections see this. Others see the first letter of your username.',
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
    instagram: 'Enter an Instagram username, like @name, or a link to a profile.',
    oneProfile: 'You can add one profile. Remove the current one to replace it.',
    photoType: 'That file couldn’t be opened. Choose a JPG, PNG or WebP picture.',
    photoSize: 'Choose a picture smaller than 10 MB.',
  },

  profile: {
    title: 'Your profile preview',
    body: 'What other people are allowed to see.',
    viewAs: 'Preview as',
    stranger: 'Someone new',
    connection: 'A connection',
    strangerNote: 'Your photo, bio and links are hidden from people you haven’t connected with.',
    connectionNote: 'People you accept as connections see your whole profile.',
    seeking: 'Here for',
    datingNote: 'Only people who also chose dating see that you did.',
    genres: 'Genres',
    artists: 'On repeat',
    tracks: 'Favorite songs',
    links: 'Links',
    newTab: '(opens in a new tab)',
    edit: 'Edit your profile',
    incompleteTitle: 'Your profile isn’t ready yet',
    incompleteBody: 'Pick at least one genre and a username to see your preview.',
    incompleteAction: 'Finish my profile',
    comingNext: 'Saved to your account. Other real people can’t see profiles yet.',
    discover: 'Discover people',
    hiddenNote: 'You’re hidden from Discover. You can change this in Settings.',
  },

  account: accountEn,
  chat: chatEn,
  community: communityEn,

  notFound: { title: 'This page doesn’t exist', action: 'Go to the start' },

  genres: {
    pop: 'Pop', hipHop: 'Hip-hop', rnb: 'R&B', rock: 'Rock', latin: 'Latin', electronic: 'Dance/Electronic',
    kPop: 'K-pop', indie: 'Indie', country: 'Country', metal: 'Metal', jazz: 'Jazz', classical: 'Classical',
    folk: 'Folk & Acoustic', soul: 'Soul', punk: 'Punk', ambient: 'Ambient', blues: 'Blues', jPop: 'J-pop',
    alternative: 'Alternative', caribbean: 'Caribbean',
    mongolianPop: 'Mongolian pop', lofi: 'Lo-fi',
  } satisfies Record<GenreId, string>,
};

export type Dictionary = typeof en;
