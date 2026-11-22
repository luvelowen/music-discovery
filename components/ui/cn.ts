/** Joins class names, skipping the ones that are switched off. */
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}
