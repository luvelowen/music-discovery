export const STEPS = ['genres', 'artists', 'tracks', 'links', 'about'] as const;

export type Step = (typeof STEPS)[number];

export function isStep(value: string): value is Step {
  return STEPS.some((step) => step === value);
}
