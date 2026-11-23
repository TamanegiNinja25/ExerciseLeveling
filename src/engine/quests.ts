import { getExercise } from '../data/exercises';
import type { DayRecord, FitnessLevel, Goal, Profile, QuestTask, Unit } from './types';

type Template = { exerciseId: string; amount: number };

/** Baseline daily quest at intensity 1.0. */
const BASE: Record<FitnessLevel, Template[]> = {
  beginner: [
    { exerciseId: 'pushup', amount: 10 },
    { exerciseId: 'situp', amount: 15 },
    { exerciseId: 'squat', amount: 20 },
    { exerciseId: 'run', amount: 1 },
  ],
  intermediate: [
    { exerciseId: 'pushup', amount: 25 },
    { exerciseId: 'situp', amount: 30 },
    { exerciseId: 'squat', amount: 40 },
    { exerciseId: 'run', amount: 2.5 },
  ],
  advanced: [
    { exerciseId: 'pushup', amount: 50 },
    { exerciseId: 'situp', amount: 60 },
    { exerciseId: 'squat', amount: 80 },
    { exerciseId: 'run', amount: 5 },
  ],
};

/** One goal-specific bonus task, scaled by fitness level. */
const GOAL_EXTRA: Record<Goal, Template> = {
  lose_fat: { exerciseId: 'jumping_jack', amount: 40 },
  build_muscle: { exerciseId: 'plank', amount: 45 },
  endurance: { exerciseId: 'burpee', amount: 10 },
  general: { exerciseId: 'plank', amount: 30 },
};

const LEVEL_SCALE: Record<FitnessLevel, number> = { beginner: 1, intermediate: 1.6, advanced: 2.4 };

const REST_DAY: Template[] = [
  { exerciseId: 'walk', amount: 20 },
  { exerciseId: 'stretch', amount: 5 },
];

export function roundAmount(n: number, unit: Unit): number {
  switch (unit) {
    case 'km':
      return Math.max(0.1, Math.round(n * 10) / 10);
    case 'sec':
      return Math.max(5, Math.round(n / 5) * 5);
    default:
      return Math.max(1, Math.round(n));
  }
}

function makeTask(t: Template, multiplier: number, idx: number, prefix = ''): QuestTask {
  const ex = getExercise(t.exerciseId);
  return {
    id: `${prefix}${t.exerciseId}_${idx}`,
    exerciseId: ex.id,
    label: `${prefix ? 'Penalty: ' : ''}${ex.name}`,
    unit: ex.unit,
    target: roundAmount(t.amount * multiplier, ex.unit),
    done: 0,
    stat: ex.stat,
  };
}

export function generateDailyTasks(p: Profile, intensity: number, isRest: boolean): QuestTask[] {
  if (isRest) return REST_DAY.map((t, i) => makeTask(t, 1, i));
  const extra = GOAL_EXTRA[p.goal];
  const templates = [...BASE[p.fitness]];
  if (p.goal === 'endurance') templates[3] = { ...templates[3], amount: templates[3].amount * 1.3 };
  if (p.goal === 'build_muscle') {
    templates[0] = { ...templates[0], amount: templates[0].amount * 1.2 };
    templates[2] = { ...templates[2], amount: templates[2].amount * 1.2 };
  }
  templates.push({ ...extra, amount: extra.amount * LEVEL_SCALE[p.fitness] });
  return templates.map((t, i) => makeTask(t, intensity, i));
}

/**
 * A missed day spawns a penalty quest: half of each unfinished task, plus a
 * burpee tax that grows with how badly the day was missed.
 */
export function generatePenaltyTasks(missed: DayRecord): QuestTask[] {
  const out: QuestTask[] = [];
  missed.tasks.forEach((t, i) => {
    const remaining = t.target - t.done;
    if (remaining <= 0) return;
    out.push(makeTask({ exerciseId: t.exerciseId, amount: remaining * 0.5 }, 1, i, 'pen_'));
  });
  const burpees = Math.round(10 + (1 - missed.completion) * 10);
  out.push(makeTask({ exerciseId: 'burpee', amount: burpees }, 1, 99, 'pen_'));
  return out;
}

export function taskCompletion(tasks: QuestTask[]): number {
  if (tasks.length === 0) return 1;
  const sum = tasks.reduce((acc, t) => acc + Math.min(1, t.done / t.target), 0);
  return Math.round((sum / tasks.length) * 100) / 100;
}

export const allDone = (tasks: QuestTask[]) => tasks.length > 0 && tasks.every((t) => t.done >= t.target);
