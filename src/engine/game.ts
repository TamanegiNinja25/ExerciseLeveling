/**
 * Core game rules. Every function here mutates a *draft* GameData that the
 * store has already cloned, so they stay pure from React's point of view.
 */
import { getExercise } from '../data/exercises';
import { getWorkout, RANK_XP } from '../data/workouts';
import { checkAchievements } from './achievements';
import { addDays, diffDays, weekday } from './dates';
import { computeIntensity, nextProgression } from './intensity';
import { grantXp, loseXp, pushMessage, questReward, xpToNext } from './leveling';
import { totalsFor } from './nutrition';
import { allDone, generateDailyTasks, generatePenaltyTasks, taskCompletion } from './quests';
import type { DateKey, DayRecord, GameData, Profile, StatKey } from './types';

export const MISSED_XP_LOSS = 0.25; // fraction of the current level's requirement
export const PENALTY_FAIL_XP_LOSS = 0.1;
export const MAX_BACKFILL_DAYS = 60;

export function createInitialData(): GameData {
  return {
    onboarded: false,
    profile: null,
    level: 1,
    xp: 0,
    totalXp: 0,
    statPoints: 0,
    stats: { str: 5, agi: 5, end: 5, vit: 5, foc: 5 },
    streak: 0,
    bestStreak: 0,
    progression: 1,
    days: {},
    foods: [],
    water: {},
    weights: [],
    photos: [],
    sessions: [],
    achievements: {},
    activeTitle: null,
    avatar: { color: '#8B5CF6', emblem: 'sword' },
    messages: [],
    lastEvaluated: null,
    settings: { notifications: true, eveningWarning: true, haptics: true },
    lifetime: {},
  };
}

export function startGame(d: GameData, profile: Profile): void {
  d.profile = profile;
  d.onboarded = true;
  d.weights.push({ date: profile.createdAt, kg: profile.weightKg });
  const bonus: Partial<Record<StatKey, number>> =
    profile.fitness === 'advanced' ? { str: 4, agi: 4, end: 4, vit: 4 }
      : profile.fitness === 'intermediate' ? { str: 2, agi: 2, end: 2, vit: 2 } : {};
  for (const [k, v] of Object.entries(bonus)) d.stats[k as StatKey] += v!;
  pushMessage(d, profile.createdAt, 'info', 'Player registered',
    `Welcome, ${profile.name}. Your first daily quest is ready. Clear it before midnight — missed quests carry a penalty.`);
  ensureDay(d, profile.createdAt);
}

export const isRestDay = (p: Profile, date: DateKey) => p.restDays.includes(weekday(date));

/** Creates the record for `date` if it doesn't exist yet. */
export function ensureDay(d: GameData, date: DateKey): DayRecord | null {
  if (!d.profile) return null;
  const existing = d.days[date];
  if (existing) return existing;

  const isRest = isRestDay(d.profile, date);
  const intensity = computeIntensity(d, date);
  const prev = d.days[addDays(date, -1)];
  const rec: DayRecord = {
    date,
    isRest,
    grace: date === d.profile.createdAt,
    intensity,
    tasks: generateDailyTasks(d.profile, intensity.total, isRest),
    penaltyTasks: prev && prev.status === 'missed' && !prev.grace ? generatePenaltyTasks(prev) : [],
    status: isRest ? 'rest' : 'pending',
    claimed: false,
    penaltyCleared: false,
    completion: 0,
    xpDelta: 0,
    workouts: [],
    evaluated: false,
  };
  d.days[date] = rec;
  return rec;
}

/** Finalises a past day: partial credit, misses, XP loss, streak and progression. */
export function closeDay(d: GameData, date: DateKey): void {
  const rec = d.days[date];
  if (!rec || rec.evaluated) return;
  rec.completion = taskCompletion(rec.tasks);
  const level = d.level;

  if (rec.isRest) {
    rec.status = 'rest';
  } else if (rec.claimed) {
    rec.status = 'cleared';
    d.progression = nextProgression(d.progression, 'cleared');
  } else if (rec.completion >= 0.5) {
    rec.status = 'partial';
    const xp = Math.round(questReward(level, rec.intensity.total) * rec.completion * 0.5);
    grantXp(d, xp, date);
    rec.xpDelta += xp;
    d.streak = 0;
    d.progression = nextProgression(d.progression, 'partial');
    pushMessage(d, date, 'quest', 'Quest partially completed',
      `${Math.round(rec.completion * 100)}% done on ${date}. +${xp} XP, but your streak was reset.`);
  } else {
    rec.status = 'missed';
    d.streak = 0;
    if (!rec.grace) {
      const lost = loseXp(d, xpToNext(level) * MISSED_XP_LOSS);
      rec.xpDelta -= lost;
      d.progression = nextProgression(d.progression, 'missed');
      pushMessage(d, date, 'penalty', 'PENALTY: Daily quest failed',
        `You lost ${lost} XP. A penalty quest has been added to your next day and intensity will rise.`);
    }
  }

  if (rec.penaltyTasks.length > 0 && !rec.penaltyCleared) {
    const lost = loseXp(d, xpToNext(level) * PENALTY_FAIL_XP_LOSS);
    rec.xpDelta -= lost;
    pushMessage(d, date, 'penalty', 'Penalty quest ignored', `An extra ${lost} XP was lost.`);
  }

  if (totalsFor(d.foods, date).entries >= 3) d.stats.foc += 1;
  rec.evaluated = true;
}

/** Close every unevaluated day before `today`, back-filling days the app wasn't opened. */
export function rollover(d: GameData, today: DateKey): void {
  if (!d.profile) return;
  const yesterday = addDays(today, -1);
  let k = d.lastEvaluated ? addDays(d.lastEvaluated, 1) : d.profile.createdAt;
  if (diffDays(k, yesterday) > MAX_BACKFILL_DAYS) k = addDays(yesterday, -MAX_BACKFILL_DAYS);
  while (diffDays(k, yesterday) >= 0) {
    ensureDay(d, k);
    closeDay(d, k);
    d.lastEvaluated = k;
    k = addDays(k, 1);
  }
  ensureDay(d, today);
  checkAchievements(d, today);
}

function claimIfComplete(d: GameData, rec: DayRecord): void {
  if (!rec.claimed && allDone(rec.tasks)) {
    rec.claimed = true;
    if (rec.isRest) {
      grantXp(d, 25, rec.date);
      rec.xpDelta += 25;
      d.stats.foc += 1;
      pushMessage(d, rec.date, 'quest', 'Recovery complete', 'Active recovery done. +25 XP, +1 FOC.');
    } else {
      rec.status = 'cleared';
      const xp = questReward(d.level, rec.intensity.total);
      d.streak += 1;
      d.bestStreak = Math.max(d.bestStreak, d.streak);
      const stats = new Set(rec.tasks.map((t) => t.stat));
      stats.forEach((s) => (d.stats[s] += 1));
      if (d.streak % 7 === 0) d.stats.foc += 1;
      grantXp(d, xp, rec.date);
      rec.xpDelta += xp;
      pushMessage(d, rec.date, 'quest', 'DAILY QUEST CLEARED',
        `+${xp} XP at ${rec.intensity.total.toFixed(2)}× intensity. Streak: ${d.streak} day${d.streak === 1 ? '' : 's'}.`);
    }
  }
  if (rec.penaltyTasks.length > 0 && !rec.penaltyCleared && allDone(rec.penaltyTasks)) {
    rec.penaltyCleared = true;
    grantXp(d, 30, rec.date);
    rec.xpDelta += 30;
    d.stats.vit += 1;
    pushMessage(d, rec.date, 'quest', 'Penalty quest cleared', 'You faced the penalty and survived. +30 XP, +1 VIT.');
  }
}

/** Set progress for one task on today's quest. */
export function setTaskDone(d: GameData, date: DateKey, taskId: string, done: number): void {
  const rec = d.days[date];
  if (!rec || rec.evaluated) return;
  const task = rec.tasks.find((t) => t.id === taskId) ?? rec.penaltyTasks.find((t) => t.id === taskId);
  if (!task) return;
  const next = Math.max(0, Math.round(done * 10) / 10);
  d.lifetime[task.exerciseId] = Math.max(0, (d.lifetime[task.exerciseId] ?? 0) + (next - task.done));
  task.done = next;
  claimIfComplete(d, rec);
  checkAchievements(d, date);
}

export function completeWorkout(
  d: GameData,
  workoutId: string,
  durationSec: number,
  date: DateKey,
  performed: Record<string, number>,
): number {
  const w = getWorkout(workoutId);
  const rec = ensureDay(d, date);
  if (!w || !rec) return 0;
  const xp = Math.round(RANK_XP[w.rank] * (1 + d.level * 0.02));
  grantXp(d, xp, date);
  rec.xpDelta += xp;
  const id = `ses_${Date.now().toString(36)}`;
  d.sessions.push({ id, workoutId, date, durationSec, xp });
  rec.workouts.push(id);
  new Set(w.steps.map((s) => getExercise(s.exerciseId).stat)).forEach((s) => (d.stats[s] += 1));

  // Reps done in a workout also count toward matching daily quest tasks.
  for (const [exId, amount] of Object.entries(performed)) {
    const task = rec.tasks.find((t) => t.exerciseId === exId);
    if (task) {
      task.done = Math.round((task.done + amount) * 10) / 10;
    }
    d.lifetime[exId] = (d.lifetime[exId] ?? 0) + amount;
  }
  pushMessage(d, date, 'quest', `${w.rank}-Rank workout complete`, `“${w.name}” finished. +${xp} XP.`);
  claimIfComplete(d, rec);
  checkAchievements(d, date);
  return xp;
}

export function allocateStat(d: GameData, stat: StatKey): void {
  if (d.statPoints <= 0) return;
  d.statPoints -= 1;
  d.stats[stat] += 1;
}
