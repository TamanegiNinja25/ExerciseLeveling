import type { GameData, MessageKind, Rank, StatKey, Stats } from './types';

export const STAT_POINTS_PER_LEVEL = 3;

/** XP needed to advance from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return Math.round(80 + 40 * level + 5 * level * level);
}

export const RANK_THRESHOLDS: { rank: Rank; minLevel: number }[] = [
  { rank: 'S', minLevel: 70 },
  { rank: 'A', minLevel: 50 },
  { rank: 'B', minLevel: 35 },
  { rank: 'C', minLevel: 20 },
  { rank: 'D', minLevel: 10 },
  { rank: 'E', minLevel: 1 },
];

export function rankForLevel(level: number): Rank {
  return RANK_THRESHOLDS.find((r) => level >= r.minLevel)!.rank;
}

export const RANK_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export function rankIndex(r: Rank): number {
  return RANK_ORDER.indexOf(r);
}

/** Minimum level required to attempt a workout of the given rank. */
export function levelForRank(r: Rank): number {
  return { E: 1, D: 1, C: 10, B: 20, A: 35, S: 50 }[r];
}

export const STAT_LABELS: Record<StatKey, { name: string; short: string; desc: string }> = {
  str: { name: 'Strength', short: 'STR', desc: 'Pushing, pulling and lifting power.' },
  agi: { name: 'Agility', short: 'AGI', desc: 'Speed, cardio and explosiveness.' },
  end: { name: 'Endurance', short: 'END', desc: 'Core stability and stamina.' },
  vit: { name: 'Vitality', short: 'VIT', desc: 'Leg power, recovery and resilience.' },
  foc: { name: 'Focus', short: 'FOC', desc: 'Discipline: streaks, nutrition and consistency.' },
};

export function power(stats: Stats, level: number): number {
  const sum = stats.str + stats.agi + stats.end + stats.vit + stats.foc;
  return Math.round(sum * (1 + level / 10));
}

let msgCounter = 0;
export function uid(prefix = 'id'): string {
  msgCounter = (msgCounter + 1) % 1e6;
  return `${prefix}_${Date.now().toString(36)}_${msgCounter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function pushMessage(d: GameData, date: string, kind: MessageKind, title: string, body: string): void {
  d.messages.unshift({ id: uid('msg'), date, kind, title, body, read: false });
  if (d.messages.length > 60) d.messages.length = 60;
}

/** Adds XP, resolving any number of level-ups. Mutates the draft. */
export function grantXp(d: GameData, amount: number, date: string): number {
  if (amount <= 0) return 0;
  const before = rankForLevel(d.level);
  d.xp += amount;
  d.totalXp += amount;
  let gained = 0;
  while (d.xp >= xpToNext(d.level)) {
    d.xp -= xpToNext(d.level);
    d.level += 1;
    d.statPoints += STAT_POINTS_PER_LEVEL;
    gained += 1;
  }
  if (gained > 0) {
    pushMessage(d, date, 'levelup', `LEVEL UP → ${d.level}`,
      `You gained ${gained} level${gained > 1 ? 's' : ''} and ${gained * STAT_POINTS_PER_LEVEL} stat points.`);
    const after = rankForLevel(d.level);
    if (after !== before) {
      pushMessage(d, date, 'rank', `RANK UP: ${after}-Rank`, `Your rank has risen from ${before} to ${after}. New trials are unlocked.`);
    }
  }
  return gained;
}

/** Removes XP within the current level (never de-levels). Returns XP actually lost. */
export function loseXp(d: GameData, amount: number): number {
  const lost = Math.min(d.xp, Math.max(0, Math.round(amount)));
  d.xp -= lost;
  d.totalXp = Math.max(0, d.totalXp - lost);
  return lost;
}

/** Daily quest reward scales with level and the day's intensity. */
export function questReward(level: number, intensity: number): number {
  return Math.round((80 + level * 8) * intensity);
}
