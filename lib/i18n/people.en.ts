import type { PeopleProblem } from '../people/types.ts';

export const peopleEn = {
  loading: 'Loading',
  errors: {
    unavailable: 'This person isn’t available.',
    notAccepting: 'They aren’t taking new requests.',
    needsSharedGenre: 'They take requests from people who share a genre.',
    dailyLimit: 'You’ve reached today’s limit of 10 requests.',
    reportLimit: 'You’ve reached today’s limit of 10 reports.',
    notReady: 'Finish your profile and confirm your email first.',
    invalid: 'That didn’t work. Try again.',
    offline: 'No connection to the app. Try again.',
    signedOut: 'You’re signed out. Log in again.',
  } satisfies Record<PeopleProblem, string>,
};
