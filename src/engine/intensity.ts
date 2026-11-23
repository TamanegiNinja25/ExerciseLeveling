import { addDays } from './dates';
import { computeTargets, totalsFor, type DayTotals, type Targets } from './nutrition';
import type { DateKey, GameData, Goal, IntensityBreakdown } from './types';

export const INTENSITY_MIN = 0.5;
export const INTENSITY_MAX = 3.0;

/** How the base progression multiplier moves after each day closes. */
export const PROGRESSION_STEP = {
  cleared: 0.02, // ~+10% per 5-day training week
  partial: 0.005,
  missed: -0.03, // detraining
  floor: 1.0,
  cap: 2.5,
};

export const PENALTY_PER_MISS = 0.1;
export const PENALTY_CAP = 0.4;
export const PENALTY_WINDOW_DAYS = 7;

const round2 = (n: number) => Math.round(n * 100) / 100;
const pct = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n * 100)}%`;

export interface Modifier {
  value: number;
  reasons: string[];
}

/**
 * Turns yesterday's food log into a fractional intensity adjustment.
 *
 * Surplus calories → harder training to burn it; under-fuelling → easier for
 * safety; hitting protein → small boost (you recover well enough to push);
 * processed/sugary food → a "junk tax"; no log → small nudge to start logging.
 *
 * `inProgress` is for live forecasts of a day that hasn't ended: a low calorie
 * count then just means "more meals to come", so it isn't treated as under-fuelling.
 */
export function dietModifier(t: DayTotals, targets: Targets, goal: Goal, inProgress = false): Modifier {
  if (t.entries === 0) {
    return inProgress
      ? { value: 0.05, reasons: ['No meals logged yet today: +5% unless you log food'] }
      : { value: 0.05, reasons: ['No meals logged yesterday: +5% (log food to calibrate)'] };
  }
  const reasons: string[] = [];
  let value = 0;
  const ratio = t.kcal / targets.kcal;

  if (ratio > 1.15) {
    let surplus = Math.min(0.3, (ratio - 1) * 0.6);
    // A planned surplus is part of a muscle-building diet, so it is taxed less.
    if (goal === 'build_muscle') surplus /= 2;
    value += surplus;
    reasons.push(`Calorie surplus (${Math.round(ratio * 100)}% of target): ${pct(surplus)}`);
  } else if (ratio < 0.7 && inProgress) {
    reasons.push(`${Math.round(ratio * 100)}% of calorie target logged so far (day in progress)`);
  } else if (ratio < 0.7) {
    value -= 0.15;
    reasons.push(`Under-fuelled (${Math.round(ratio * 100)}% of target): -15% for safety`);
  } else {
    reasons.push(`Calories on target (${Math.round(ratio * 100)}%): +0%`);
  }

  if (t.protein >= targets.protein * 0.9) {
    value += 0.05;
    reasons.push('Protein goal met: +5% (recovery boosted)');
  }

  if (t.processed > 0) {
    const junk = Math.min(0.15, t.processed * 0.03);
    value += junk;
    reasons.push(`${t.processed} processed/sugary item${t.processed > 1 ? 's' : ''}: ${pct(junk)}`);
  }

  return { value: round2(value), reasons };
}

/** Flat additive load from days missed in the trailing window before `date`. */
export function penaltyLoad(d: GameData, date: DateKey): Modifier {
  let misses = 0;
  for (let i = 1; i <= PENALTY_WINDOW_DAYS; i++) {
    const rec = d.days[addDays(date, -i)];
    if (rec && rec.status === 'missed' && !rec.grace) misses++;
  }
  if (misses === 0) return { value: 0, reasons: [] };
  const value = Math.min(PENALTY_CAP, misses * PENALTY_PER_MISS);
  return {
    value: round2(value),
    reasons: [`${misses} missed day${misses > 1 ? 's' : ''} in the last ${PENALTY_WINDOW_DAYS}: +${value.toFixed(2)}× penalty load`],
  };
}

export function computeIntensity(d: GameData, date: DateKey, dietInProgress = false): IntensityBreakdown {
  const base = round2(d.progression);
  if (!d.profile) return { base, diet: 0, penalty: 0, total: base, reasons: [] };

  const targets = computeTargets(d.profile);
  // There is no "yesterday" to have logged on the very first day.
  const diet: Modifier = date === d.profile.createdAt
    ? { value: 0, reasons: ['First day: no diet history yet'] }
    : dietModifier(totalsFor(d.foods, addDays(date, -1)), targets, d.profile.goal, dietInProgress);
  const pen = penaltyLoad(d, date);
  const total = round2(Math.min(INTENSITY_MAX, Math.max(INTENSITY_MIN, base * (1 + diet.value) + pen.value)));

  return {
    base,
    diet: diet.value,
    penalty: pen.value,
    total,
    reasons: [`Progression: ${base.toFixed(2)}× from consistent training`, ...diet.reasons, ...pen.reasons],
  };
}

/**
 * What `date`'s intensity would be if the day before it ends with `outcome`.
 * Uses the food logged so far, so it updates live as meals are added.
 */
export function projectIntensity(d: GameData, date: DateKey, outcome: 'cleared' | 'missed'): IntensityBreakdown {
  const prevKey = addDays(date, -1);
  const prev = d.days[prevKey];
  const affects = prev && !prev.isRest && !(prev.grace && outcome === 'missed');
  const sim: GameData = {
    ...d,
    progression: affects ? nextProgression(d.progression, outcome) : d.progression,
    days: prev ? { ...d.days, [prevKey]: { ...prev, status: prev.isRest ? 'rest' : outcome } } : d.days,
  };
  return computeIntensity(sim, date, true);
}

export function nextProgression(current: number, outcome: 'cleared' | 'partial' | 'missed'): number {
  const n = current + PROGRESSION_STEP[outcome];
  return round2(Math.min(PROGRESSION_STEP.cap, Math.max(PROGRESSION_STEP.floor, n)));
}
