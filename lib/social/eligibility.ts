import type { AgeGroup, Eligibility } from './types.ts';

export const ADULT_AGE = 18;

/** Today's date in Ulaanbaatar, whatever the device's time zone says. */
function todayInUlaanbaatar(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

/** Returns null when it is not a real, possible date of birth. */
export function getAgeGroup(year: number, month: number, day: number, now: Date): Exclude<AgeGroup, 'unknown'> | null {
  if (![year, month, day].every(Number.isInteger)) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  const today = todayInUlaanbaatar(now);
  const hadBirthday = today.month > month || (today.month === month && today.day >= day);
  const age = today.year - year - (hadBirthday ? 0 : 1);

  if (age < 0 || age > 110) return null;
  return age >= ADULT_AGE ? 'adult' : 'minor';
}

export function isEligible({ age }: Eligibility) {
  return age === 'adult';
}
