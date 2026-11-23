import type { Equipment, StatKey, Unit } from '../engine/types';

export type Muscle = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'glutes' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  unit: Unit;
  muscles: Muscle[];
  equipment: Equipment;
  stat: StatKey;
  cue: string;
}

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  legs: 'Legs',
  glutes: 'Glutes',
  cardio: 'Cardio',
};

export const EXERCISES: Exercise[] = [
  // Bodyweight — upper
  { id: 'pushup', name: 'Push-ups', unit: 'reps', muscles: ['chest', 'arms', 'shoulders'], equipment: 'none', stat: 'str', cue: 'Body in a straight line, chest to fist height, full lockout.' },
  { id: 'knee_pushup', name: 'Knee Push-ups', unit: 'reps', muscles: ['chest', 'arms'], equipment: 'none', stat: 'str', cue: 'Knees down, hips in line with shoulders.' },
  { id: 'diamond_pushup', name: 'Diamond Push-ups', unit: 'reps', muscles: ['arms', 'chest'], equipment: 'none', stat: 'str', cue: 'Hands form a diamond under the sternum; elbows tight.' },
  { id: 'pike_pushup', name: 'Pike Push-ups', unit: 'reps', muscles: ['shoulders', 'arms'], equipment: 'none', stat: 'str', cue: 'Hips high, lower the head between the hands.' },
  { id: 'dips', name: 'Chair Dips', unit: 'reps', muscles: ['arms', 'chest'], equipment: 'none', stat: 'str', cue: 'Shoulders down, elbows back, 90° at the bottom.' },
  { id: 'superman', name: 'Superman Hold', unit: 'sec', muscles: ['back'], equipment: 'none', stat: 'end', cue: 'Lift arms and legs, squeeze glutes and upper back.' },
  { id: 'pullup', name: 'Pull-ups', unit: 'reps', muscles: ['back', 'arms'], equipment: 'gym', stat: 'str', cue: 'Dead hang to chin over bar, no kipping.' },
  // Bodyweight — core
  { id: 'situp', name: 'Sit-ups', unit: 'reps', muscles: ['core'], equipment: 'none', stat: 'end', cue: 'Feet anchored, curl up vertebra by vertebra.' },
  { id: 'crunch', name: 'Crunches', unit: 'reps', muscles: ['core'], equipment: 'none', stat: 'end', cue: 'Ribs toward hips, lower back stays down.' },
  { id: 'plank', name: 'Plank', unit: 'sec', muscles: ['core', 'shoulders'], equipment: 'none', stat: 'end', cue: 'Elbows under shoulders, brace like taking a punch.' },
  { id: 'leg_raise', name: 'Leg Raises', unit: 'reps', muscles: ['core'], equipment: 'none', stat: 'end', cue: 'Lower back pressed down, slow on the way down.' },
  { id: 'mountain_climber', name: 'Mountain Climbers', unit: 'reps', muscles: ['core', 'cardio'], equipment: 'none', stat: 'agi', cue: 'Drive knees fast, hips level.' },
  { id: 'russian_twist', name: 'Russian Twists', unit: 'reps', muscles: ['core'], equipment: 'none', stat: 'end', cue: 'Lean back 45°, rotate from the ribs.' },
  // Bodyweight — legs
  { id: 'squat', name: 'Squats', unit: 'reps', muscles: ['legs', 'glutes'], equipment: 'none', stat: 'vit', cue: 'Hips below knees, chest up, knees track toes.' },
  { id: 'lunge', name: 'Lunges', unit: 'reps', muscles: ['legs', 'glutes'], equipment: 'none', stat: 'vit', cue: 'Back knee kisses the floor, torso upright.' },
  { id: 'jump_squat', name: 'Jump Squats', unit: 'reps', muscles: ['legs', 'cardio'], equipment: 'none', stat: 'agi', cue: 'Explode up, land softly into the next rep.' },
  { id: 'glute_bridge', name: 'Glute Bridges', unit: 'reps', muscles: ['glutes'], equipment: 'none', stat: 'vit', cue: 'Drive through heels, squeeze at the top for 1s.' },
  { id: 'wall_sit', name: 'Wall Sit', unit: 'sec', muscles: ['legs'], equipment: 'none', stat: 'vit', cue: 'Thighs parallel to floor, back flat on the wall.' },
  { id: 'calf_raise', name: 'Calf Raises', unit: 'reps', muscles: ['legs'], equipment: 'none', stat: 'vit', cue: 'Full stretch at the bottom, pause at the top.' },
  // Cardio
  { id: 'run', name: 'Run', unit: 'km', muscles: ['cardio', 'legs'], equipment: 'none', stat: 'agi', cue: 'Conversational pace; walk breaks are allowed.' },
  { id: 'walk', name: 'Brisk Walk', unit: 'min', muscles: ['cardio'], equipment: 'none', stat: 'vit', cue: 'Fast enough that talking takes effort.' },
  { id: 'jumping_jack', name: 'Jumping Jacks', unit: 'reps', muscles: ['cardio'], equipment: 'none', stat: 'agi', cue: 'Land on the balls of your feet, arms fully overhead.' },
  { id: 'burpee', name: 'Burpees', unit: 'reps', muscles: ['cardio', 'chest', 'legs'], equipment: 'none', stat: 'agi', cue: 'Chest to floor, jump with hands overhead.' },
  { id: 'high_knees', name: 'High Knees', unit: 'sec', muscles: ['cardio'], equipment: 'none', stat: 'agi', cue: 'Knees to hip height, quick arms.' },
  { id: 'stretch', name: 'Mobility Stretch', unit: 'min', muscles: ['legs', 'back'], equipment: 'none', stat: 'foc', cue: 'Slow breathing, hold each stretch 30s.' },
  // Dumbbells
  { id: 'db_press', name: 'Dumbbell Floor Press', unit: 'reps', muscles: ['chest', 'arms'], equipment: 'dumbbells', stat: 'str', cue: 'Elbows at 45°, pause when triceps touch the floor.' },
  { id: 'db_row', name: 'Dumbbell Row', unit: 'reps', muscles: ['back', 'arms'], equipment: 'dumbbells', stat: 'str', cue: 'Pull elbow to hip, flat back.' },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press', unit: 'reps', muscles: ['shoulders', 'arms'], equipment: 'dumbbells', stat: 'str', cue: 'Ribs down, press straight overhead.' },
  { id: 'db_goblet_squat', name: 'Goblet Squat', unit: 'reps', muscles: ['legs', 'glutes'], equipment: 'dumbbells', stat: 'vit', cue: 'Hold the bell at the chest, sit between your heels.' },
  { id: 'db_rdl', name: 'Dumbbell Romanian Deadlift', unit: 'reps', muscles: ['glutes', 'back', 'legs'], equipment: 'dumbbells', stat: 'vit', cue: 'Hinge at hips, soft knees, bells close to legs.' },
  { id: 'db_curl', name: 'Dumbbell Curl', unit: 'reps', muscles: ['arms'], equipment: 'dumbbells', stat: 'str', cue: 'Elbows pinned, no swinging.' },
  // Gym
  { id: 'bench_press', name: 'Bench Press', unit: 'reps', muscles: ['chest', 'arms', 'shoulders'], equipment: 'gym', stat: 'str', cue: 'Shoulder blades pinned, bar to lower chest.' },
  { id: 'back_squat', name: 'Barbell Back Squat', unit: 'reps', muscles: ['legs', 'glutes'], equipment: 'gym', stat: 'vit', cue: 'Brace, break at hips and knees together.' },
  { id: 'deadlift', name: 'Deadlift', unit: 'reps', muscles: ['back', 'glutes', 'legs'], equipment: 'gym', stat: 'str', cue: 'Bar over mid-foot, push the floor away.' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', unit: 'reps', muscles: ['back', 'arms'], equipment: 'gym', stat: 'str', cue: 'Pull to upper chest, lean back slightly.' },
  { id: 'rower', name: 'Rowing Machine', unit: 'min', muscles: ['cardio', 'back'], equipment: 'gym', stat: 'agi', cue: 'Legs, then hips, then arms.' },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  const e = BY_ID.get(id);
  if (!e) throw new Error(`Unknown exercise: ${id}`);
  return e;
}

const EQUIP_LEVEL: Record<Equipment, number> = { none: 0, dumbbells: 1, gym: 2 };

export function hasEquipment(owned: Equipment, needed: Equipment): boolean {
  return EQUIP_LEVEL[owned] >= EQUIP_LEVEL[needed];
}

/** Exercises that hit the same primary muscle with the same unit — used for "swap". */
export function alternativesFor(id: string, owned: Equipment): Exercise[] {
  const ex = getExercise(id);
  return EXERCISES.filter(
    (e) => e.id !== id && e.unit === ex.unit && e.muscles[0] === ex.muscles[0] && hasEquipment(owned, e.equipment),
  );
}

export function formatAmount(n: number, unit: Unit): string {
  switch (unit) {
    case 'km':
      return `${n.toFixed(1)} km`;
    case 'min':
      return `${n} min`;
    case 'sec':
      return n >= 60 ? `${Math.floor(n / 60)}m ${n % 60 ? `${n % 60}s` : ''}`.trim() : `${n}s`;
    default:
      return `${n}`;
  }
}
