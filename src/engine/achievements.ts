import { getWorkout } from '../data/workouts';
import { pushMessage, rankForLevel, rankIndex } from './leveling';
import type { DateKey, GameData } from './types';

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** Unlocks a selectable title shown under the player name. */
  title?: string;
  check: (d: GameData) => boolean;
}

const clearedDays = (d: GameData) => Object.values(d.days).filter((r) => r.claimed && !r.isRest);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_clear', name: 'Awakening', desc: 'Clear your first daily quest.', icon: 'star-four-points', title: 'The Awakened', check: (d) => clearedDays(d).length >= 1 },
  { id: 'streak_3', name: 'Momentum', desc: 'Reach a 3-day streak.', icon: 'fire', check: (d) => d.bestStreak >= 3 },
  { id: 'streak_7', name: 'Relentless', desc: 'Reach a 7-day streak.', icon: 'fire', title: 'The Relentless', check: (d) => d.bestStreak >= 7 },
  { id: 'streak_30', name: 'Unbreakable', desc: 'Reach a 30-day streak.', icon: 'diamond-stone', title: 'The Unbreakable', check: (d) => d.bestStreak >= 30 },
  { id: 'level_5', name: 'Getting Stronger', desc: 'Reach level 5.', icon: 'arrow-up-bold', check: (d) => d.level >= 5 },
  { id: 'level_10', name: 'Double Digits', desc: 'Reach level 10.', icon: 'arrow-up-bold-circle', check: (d) => d.level >= 10 },
  { id: 'level_25', name: 'Veteran', desc: 'Reach level 25.', icon: 'shield-star', title: 'Veteran', check: (d) => d.level >= 25 },
  { id: 'level_50', name: 'Living Legend', desc: 'Reach level 50.', icon: 'crown', title: 'Living Legend', check: (d) => d.level >= 50 },
  { id: 'rank_c', name: 'C-Rank', desc: 'Reach C-Rank.', icon: 'alpha-c-circle', check: (d) => rankIndex(rankForLevel(d.level)) >= 2 },
  { id: 'rank_a', name: 'A-Rank', desc: 'Reach A-Rank.', icon: 'alpha-a-circle', title: 'Elite', check: (d) => rankIndex(rankForLevel(d.level)) >= 4 },
  { id: 'rank_s', name: 'S-Rank', desc: 'Reach S-Rank.', icon: 'alpha-s-circle', title: 'Apex', check: (d) => rankIndex(rankForLevel(d.level)) >= 5 },
  { id: 'workouts_10', name: 'Regular', desc: 'Complete 10 workouts.', icon: 'dumbbell', check: (d) => d.sessions.length >= 10 },
  { id: 'workouts_50', name: 'Gym Rat', desc: 'Complete 50 workouts.', icon: 'weight-lifter', title: 'Iron Devotee', check: (d) => d.sessions.length >= 50 },
  { id: 'trial_s', name: 'Breaking Point', desc: 'Complete an S-rank workout.', icon: 'sword-cross', title: 'Trialbreaker', check: (d) => d.sessions.some((s) => getWorkout(s.workoutId)?.rank === 'S') },
  { id: 'penalty_survivor', name: 'Penalty Survivor', desc: 'Clear a penalty quest.', icon: 'skull-crossbones', title: 'Survivor', check: (d) => Object.values(d.days).some((r) => r.penaltyCleared) },
  { id: 'photo_first', name: 'Victory Pose', desc: 'Save your first progress photo.', icon: 'camera', check: (d) => d.photos.length >= 1 },
  { id: 'food_7', name: 'Mindful Eater', desc: 'Log food on 7 different days.', icon: 'food-apple', title: 'The Disciplined', check: (d) => new Set(d.foods.map((f) => f.date)).size >= 7 },
  { id: 'pushups_1000', name: 'Thousand Palms', desc: 'Do 1,000 lifetime push-ups.', icon: 'hand-back-right', check: (d) => (d.lifetime.pushup ?? 0) >= 1000 },
  { id: 'run_42', name: 'Marathoner', desc: 'Run 42 km in total.', icon: 'run-fast', title: 'Marathoner', check: (d) => (d.lifetime.run ?? 0) >= 42 },
  { id: 'intensity_2', name: 'Overdrive', desc: 'Clear a daily quest at 2.0× intensity or more.', icon: 'lightning-bolt', title: 'Overdriven', check: (d) => clearedDays(d).some((r) => r.intensity.total >= 2) },
];

/** Unlocks any newly satisfied achievements; each grants one stat point. */
export function checkAchievements(d: GameData, date: DateKey): string[] {
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (d.achievements[a.id] || !a.check(d)) continue;
    d.achievements[a.id] = date;
    d.statPoints += 1;
    unlocked.push(a.id);
    pushMessage(d, date, 'achievement', `Achievement: ${a.name}`,
      `${a.desc} +1 stat point.${a.title ? ` Title unlocked: “${a.title}”.` : ''}`);
  }
  return unlocked;
}
