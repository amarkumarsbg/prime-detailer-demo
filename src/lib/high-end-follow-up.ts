/**
 * Build month offsets for high-end maintenance reminders from preset schedule + chosen first milestone.
 * If `firstMonths` matches a preset, behavior matches "all presets >= first".
 * If `firstMonths` is custom (not in preset), it is included first, then all preset milestones strictly after it.
 */
export function buildHighEndReminderMonthIntervals(
  presetMonths: number[],
  firstMonths: number
): number[] {
  const sorted = [...presetMonths]
    .filter((m) => Number.isFinite(m) && m > 0)
    .sort((a, b) => a - b);
  const cap = 120;
  const f = Math.min(cap, Math.max(1, Math.round(firstMonths)));
  if (sorted.length === 0) return [f];
  if (sorted.includes(f)) {
    return sorted.filter((m) => m >= f);
  }
  return [f, ...sorted.filter((m) => m > f)];
}

/** Suggested first value when switching from preset schedule to manual entry (not in `presetMonths`). */
export function defaultManualFirstFollowUpMonths(presetMonths: number[]): number {
  const sorted = [...presetMonths].filter((m) => Number.isFinite(m) && m > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return 6;
  const g = sorted[0] - 1;
  return g >= 1 ? g : 3;
}
