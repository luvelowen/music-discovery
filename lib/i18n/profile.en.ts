import type { CompletionItem } from '../profile/completion.ts';
import type { Moment, Outing, PromptId } from '../profile/types.ts';

export const profileEn = {
  edit: 'Edit profile',
  editTitle: 'Edit profile',
  editBody: 'Changes save as you go.',
  identity: 'Photo, name and bio',
  music: 'Music and links',
  notAdded: 'Not added',
  about: 'About',
  anthem: 'My anthem',
  anthemShort: 'Anthem',
  anthemBody: 'One of your favorite songs, shown large at the top. Your song privacy setting applies.',
  anthemEmpty: 'Add a favorite song first.',
  noAnthem: 'No anthem',
  answers: 'In my words',
  answersBody: 'Up to three. Anyone who can see your profile can read these.',
  momentsTitle: 'I listen most',
  outingsTitle: 'Take me to',
  pickThree: 'Up to three. Anyone who can see your profile can see these.',
  done: 'Done',
  prompts: {
    neverSkip: 'The song I never skip',
    firstConcert: 'The first concert I went to',
    perfectNight: 'My perfect night out sounds like',
    secretFavourite: 'A song I love and won’t admit to',
    introduceMe: 'Please introduce me to',
  } satisfies Record<PromptId, string>,
  moments: {
    commute: 'On the bus', lateNight: 'Late at night', gettingReady: 'Getting ready', workout: 'Working out',
    working: 'Working or studying', cooking: 'Cooking', walking: 'Walking', driving: 'Driving',
  } satisfies Record<Moment, string>,
  outings: {
    concerts: 'Big concerts', festivals: 'Festivals', smallGigs: 'Small gigs', karaoke: 'Karaoke',
    dancing: 'Dancing', recordShops: 'Record shops', listeningIn: 'A night in with music', jamming: 'Jam sessions',
  } satisfies Record<Outing, string>,
  nextTitle: 'Make it more you',
  nextBody: 'Only you see this list.',
  goVisible: 'Show me in Discover',
  next: {
    photo: 'Add a photo',
    bio: 'Write a short bio',
    anthem: 'Choose your anthem',
    answers: 'Answer a question',
    moments: 'Say when you listen',
    outings: 'Say where you’d go',
  } satisfies Record<CompletionItem, string>,
};
