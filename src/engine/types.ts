export type DateKey = string; // 'YYYY-MM-DD' in local time

export type Sex = 'male' | 'female' | 'other';
export type Goal = 'lose_fat' | 'build_muscle' | 'endurance' | 'general';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'none' | 'dumbbells' | 'gym';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type StatKey = 'str' | 'agi' | 'end' | 'vit' | 'foc';
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type Unit = 'reps' | 'sec' | 'km' | 'min';
export type DayStatus = 'pending' | 'cleared' | 'partial' | 'missed' | 'rest';
export type FoodTag = 'whole' | 'processed' | 'sugary';

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  fitness: FitnessLevel;
  goal: Goal;
  equipment: Equipment;
  /** Weekdays (0 = Sunday) that are scheduled recovery days. */
  restDays: number[];
  reminderHour: number;
  reminderMinute: number;
  createdAt: DateKey;
}

export type Stats = Record<StatKey, number>;

export interface QuestTask {
  id: string;
  exerciseId: string;
  label: string;
  unit: Unit;
  target: number;
  done: number;
  stat: StatKey;
}

export interface IntensityBreakdown {
  /** Gradual progression multiplier earned from consistent training. */
  base: number;
  /** Fractional adjustment from the previous day's diet, e.g. +0.12. */
  diet: number;
  /** Flat additive load from recently missed days. */
  penalty: number;
  /** Final clamped multiplier applied to quest targets. */
  total: number;
  reasons: string[];
}

export interface DayRecord {
  date: DateKey;
  isRest: boolean;
  /** Day the profile was created: missing it carries no penalty. */
  grace: boolean;
  intensity: IntensityBreakdown;
  tasks: QuestTask[];
  penaltyTasks: QuestTask[];
  status: DayStatus;
  claimed: boolean;
  penaltyCleared: boolean;
  completion: number;
  xpDelta: number;
  workouts: string[];
  evaluated: boolean;
}

export interface FoodEntry {
  id: string;
  date: DateKey;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tag: FoodTag;
  time: number;
}

export interface WeightEntry {
  date: DateKey;
  kg: number;
}

export interface Photo {
  id: string;
  uri: string;
  date: DateKey;
  level: number;
  note: string;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  date: DateKey;
  durationSec: number;
  xp: number;
}

export type MessageKind = 'levelup' | 'penalty' | 'quest' | 'achievement' | 'info' | 'rank';

export interface SystemMessage {
  id: string;
  date: DateKey;
  kind: MessageKind;
  title: string;
  body: string;
  read: boolean;
}

export interface Avatar {
  color: string;
  emblem: string;
}

export interface Settings {
  notifications: boolean;
  eveningWarning: boolean;
  haptics: boolean;
}

export interface GameData {
  onboarded: boolean;
  profile: Profile | null;
  level: number;
  xp: number;
  totalXp: number;
  statPoints: number;
  stats: Stats;
  streak: number;
  bestStreak: number;
  /** Base intensity multiplier that grows with consistent clears. */
  progression: number;
  days: Record<DateKey, DayRecord>;
  foods: FoodEntry[];
  water: Record<DateKey, number>;
  weights: WeightEntry[];
  photos: Photo[];
  sessions: WorkoutSession[];
  achievements: Record<string, DateKey>;
  activeTitle: string | null;
  avatar: Avatar;
  messages: SystemMessage[];
  lastEvaluated: DateKey | null;
  settings: Settings;
  /** Lifetime reps / distance per exercise id. */
  lifetime: Record<string, number>;
}
