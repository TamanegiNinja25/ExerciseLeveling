import type { Equipment, Rank } from '../engine/types';
import type { Muscle } from './exercises';

export interface WorkoutStep {
  exerciseId: string;
  sets: number;
  /** Reps, seconds, minutes or km per set depending on the exercise unit. */
  amount: number;
  restSec: number;
}

export interface Workout {
  id: string;
  name: string;
  rank: Rank;
  focus: Muscle[];
  equipment: Equipment;
  minutes: number;
  description: string;
  steps: WorkoutStep[];
}

export const RANK_XP: Record<Rank, number> = { E: 40, D: 60, C: 90, B: 130, A: 180, S: 260 };

export const WORKOUTS: Workout[] = [
  // E-rank
  {
    id: 'e_awakening', name: 'First Steps', rank: 'E', focus: ['chest', 'core', 'legs'], equipment: 'none', minutes: 12,
    description: 'A gentle full-body circuit to learn the basic movements.',
    steps: [
      { exerciseId: 'knee_pushup', sets: 2, amount: 8, restSec: 45 },
      { exerciseId: 'squat', sets: 2, amount: 12, restSec: 45 },
      { exerciseId: 'crunch', sets: 2, amount: 12, restSec: 45 },
      { exerciseId: 'plank', sets: 2, amount: 20, restSec: 45 },
    ],
  },
  {
    id: 'e_walk', name: 'Recovery Walk', rank: 'E', focus: ['cardio'], equipment: 'none', minutes: 25,
    description: 'Low-intensity steady state plus mobility. Perfect for rest days.',
    steps: [
      { exerciseId: 'walk', sets: 1, amount: 20, restSec: 0 },
      { exerciseId: 'stretch', sets: 1, amount: 5, restSec: 0 },
    ],
  },
  {
    id: 'e_core', name: 'Core Ignition', rank: 'E', focus: ['core'], equipment: 'none', minutes: 10,
    description: 'Short core primer that builds the base for every other lift.',
    steps: [
      { exerciseId: 'crunch', sets: 3, amount: 15, restSec: 30 },
      { exerciseId: 'leg_raise', sets: 2, amount: 10, restSec: 30 },
      { exerciseId: 'plank', sets: 2, amount: 30, restSec: 30 },
    ],
  },
  // D-rank
  {
    id: 'd_push', name: 'Iron Palms', rank: 'D', focus: ['chest', 'arms', 'shoulders'], equipment: 'none', minutes: 18,
    description: 'Bodyweight push session for chest, shoulders and triceps.',
    steps: [
      { exerciseId: 'pushup', sets: 3, amount: 12, restSec: 60 },
      { exerciseId: 'pike_pushup', sets: 3, amount: 8, restSec: 60 },
      { exerciseId: 'dips', sets: 3, amount: 10, restSec: 60 },
    ],
  },
  {
    id: 'd_legs', name: 'Grounded', rank: 'D', focus: ['legs', 'glutes'], equipment: 'none', minutes: 18,
    description: 'Leg day without equipment. Expect the burn.',
    steps: [
      { exerciseId: 'squat', sets: 3, amount: 20, restSec: 60 },
      { exerciseId: 'lunge', sets: 3, amount: 12, restSec: 60 },
      { exerciseId: 'glute_bridge', sets: 3, amount: 15, restSec: 45 },
      { exerciseId: 'wall_sit', sets: 2, amount: 40, restSec: 45 },
    ],
  },
  {
    id: 'd_cardio', name: 'Ember Sprint', rank: 'D', focus: ['cardio'], equipment: 'none', minutes: 15,
    description: 'Intervals to raise your heart rate and agility.',
    steps: [
      { exerciseId: 'jumping_jack', sets: 3, amount: 40, restSec: 30 },
      { exerciseId: 'high_knees', sets: 3, amount: 30, restSec: 30 },
      { exerciseId: 'mountain_climber', sets: 3, amount: 30, restSec: 30 },
    ],
  },
  {
    id: 'd_db_full', name: 'Forged Basics', rank: 'D', focus: ['chest', 'back', 'legs'], equipment: 'dumbbells', minutes: 25,
    description: 'Full-body dumbbell fundamentals.',
    steps: [
      { exerciseId: 'db_goblet_squat', sets: 3, amount: 12, restSec: 75 },
      { exerciseId: 'db_press', sets: 3, amount: 10, restSec: 75 },
      { exerciseId: 'db_row', sets: 3, amount: 10, restSec: 75 },
    ],
  },
  // C-rank
  {
    id: 'c_hundred', name: 'The Hundred', rank: 'C', focus: ['chest', 'core', 'legs', 'cardio'], equipment: 'none', minutes: 35,
    description: '100 push-ups, 100 sit-ups, 100 squats and a run. Split it however you like.',
    steps: [
      { exerciseId: 'pushup', sets: 5, amount: 20, restSec: 60 },
      { exerciseId: 'situp', sets: 5, amount: 20, restSec: 45 },
      { exerciseId: 'squat', sets: 5, amount: 20, restSec: 45 },
      { exerciseId: 'run', sets: 1, amount: 3, restSec: 0 },
    ],
  },
  {
    id: 'c_hiit', name: 'Storm Circuit', rank: 'C', focus: ['cardio', 'legs'], equipment: 'none', minutes: 25,
    description: 'High-intensity circuit. Short rests, high output.',
    steps: [
      { exerciseId: 'burpee', sets: 4, amount: 12, restSec: 40 },
      { exerciseId: 'jump_squat', sets: 4, amount: 15, restSec: 40 },
      { exerciseId: 'mountain_climber', sets: 4, amount: 40, restSec: 40 },
    ],
  },
  {
    id: 'c_db_upper', name: 'Twin Blades', rank: 'C', focus: ['shoulders', 'arms', 'back'], equipment: 'dumbbells', minutes: 30,
    description: 'Dumbbell upper-body hypertrophy.',
    steps: [
      { exerciseId: 'db_shoulder_press', sets: 4, amount: 10, restSec: 75 },
      { exerciseId: 'db_row', sets: 4, amount: 12, restSec: 75 },
      { exerciseId: 'db_curl', sets: 3, amount: 12, restSec: 60 },
      { exerciseId: 'diamond_pushup', sets: 3, amount: 10, restSec: 60 },
    ],
  },
  {
    id: 'c_gym_pull', name: 'Gravity Pull', rank: 'C', focus: ['back', 'arms'], equipment: 'gym', minutes: 35,
    description: 'Back-focused gym session.',
    steps: [
      { exerciseId: 'lat_pulldown', sets: 4, amount: 10, restSec: 90 },
      { exerciseId: 'db_row', sets: 3, amount: 10, restSec: 75 },
      { exerciseId: 'db_curl', sets: 3, amount: 12, restSec: 60 },
    ],
  },
  // B-rank
  {
    id: 'b_endurance', name: 'Long Road', rank: 'B', focus: ['cardio', 'legs'], equipment: 'none', minutes: 50,
    description: 'Endurance builder: distance run with a leg finisher.',
    steps: [
      { exerciseId: 'run', sets: 1, amount: 6, restSec: 120 },
      { exerciseId: 'lunge', sets: 3, amount: 16, restSec: 60 },
      { exerciseId: 'calf_raise', sets: 3, amount: 25, restSec: 45 },
    ],
  },
  {
    id: 'b_calisthenics', name: 'Phantom Form', rank: 'B', focus: ['chest', 'back', 'core'], equipment: 'none', minutes: 40,
    description: 'Advanced calisthenics volume.',
    steps: [
      { exerciseId: 'diamond_pushup', sets: 4, amount: 15, restSec: 60 },
      { exerciseId: 'pike_pushup', sets: 4, amount: 12, restSec: 60 },
      { exerciseId: 'leg_raise', sets: 4, amount: 15, restSec: 45 },
      { exerciseId: 'superman', sets: 3, amount: 45, restSec: 45 },
    ],
  },
  {
    id: 'b_gym_lower', name: 'Titan Legs', rank: 'B', focus: ['legs', 'glutes'], equipment: 'gym', minutes: 45,
    description: 'Heavy compound lower-body session.',
    steps: [
      { exerciseId: 'back_squat', sets: 5, amount: 5, restSec: 150 },
      { exerciseId: 'db_rdl', sets: 4, amount: 10, restSec: 90 },
      { exerciseId: 'lunge', sets: 3, amount: 12, restSec: 60 },
    ],
  },
  // A-rank
  {
    id: 'a_gauntlet', name: 'Gauntlet', rank: 'A', focus: ['chest', 'legs', 'core', 'cardio'], equipment: 'none', minutes: 55,
    description: 'A punishing full-body gauntlet. Rest only when the timer says so.',
    steps: [
      { exerciseId: 'burpee', sets: 5, amount: 20, restSec: 45 },
      { exerciseId: 'pushup', sets: 5, amount: 30, restSec: 45 },
      { exerciseId: 'jump_squat', sets: 5, amount: 25, restSec: 45 },
      { exerciseId: 'plank', sets: 3, amount: 90, restSec: 45 },
    ],
  },
  {
    id: 'a_gym_power', name: 'Sovereign Lifts', rank: 'A', focus: ['back', 'chest', 'legs'], equipment: 'gym', minutes: 60,
    description: 'Strength block on the big three.',
    steps: [
      { exerciseId: 'deadlift', sets: 5, amount: 5, restSec: 180 },
      { exerciseId: 'bench_press', sets: 5, amount: 5, restSec: 150 },
      { exerciseId: 'back_squat', sets: 4, amount: 6, restSec: 150 },
      { exerciseId: 'pullup', sets: 4, amount: 8, restSec: 90 },
    ],
  },
  // S-rank
  {
    id: 's_limit', name: 'Breaking Point', rank: 'S', focus: ['chest', 'core', 'legs', 'cardio'], equipment: 'none', minutes: 75,
    description: 'The final trial: 10 km plus triple-hundred volume. Only for the disciplined.',
    steps: [
      { exerciseId: 'pushup', sets: 10, amount: 30, restSec: 45 },
      { exerciseId: 'situp', sets: 10, amount: 30, restSec: 30 },
      { exerciseId: 'squat', sets: 10, amount: 30, restSec: 30 },
      { exerciseId: 'run', sets: 1, amount: 10, restSec: 0 },
    ],
  },
  {
    id: 's_gym', name: 'Absolute', rank: 'S', focus: ['back', 'legs', 'chest', 'cardio'], equipment: 'gym', minutes: 80,
    description: 'Heavy strength followed by a conditioning finisher.',
    steps: [
      { exerciseId: 'deadlift', sets: 6, amount: 4, restSec: 180 },
      { exerciseId: 'back_squat', sets: 6, amount: 4, restSec: 180 },
      { exerciseId: 'bench_press', sets: 6, amount: 4, restSec: 150 },
      { exerciseId: 'rower', sets: 1, amount: 15, restSec: 0 },
    ],
  },
];

const BY_ID = new Map(WORKOUTS.map((w) => [w.id, w]));

export function getWorkout(id: string): Workout | undefined {
  return BY_ID.get(id);
}
