import type { Activity, DateKey, FoodEntry, Goal, Profile } from './types';

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_CALORIE_ADJ: Record<Goal, number> = {
  lose_fat: -0.2,
  build_muscle: 0.1,
  endurance: 0.05,
  general: 0,
};

const PROTEIN_PER_KG: Record<Goal, number> = {
  lose_fat: 2.0,
  build_muscle: 2.0,
  endurance: 1.6,
  general: 1.4,
};

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  bmr: number;
  tdee: number;
}

/** Mifflin–St Jeor BMR → TDEE → goal-adjusted daily targets. */
export function computeTargets(p: Profile): Targets {
  const sexOffset = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexOffset;
  const tdee = bmr * ACTIVITY_FACTOR[p.activity];
  const kcal = Math.round(tdee * (1 + GOAL_CALORIE_ADJ[p.goal]));
  const protein = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, waterMl: Math.round(p.weightKg * 35), bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export interface DayTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  entries: number;
  processed: number;
}

export function totalsFor(foods: FoodEntry[], date: DateKey): DayTotals {
  const t: DayTotals = { kcal: 0, protein: 0, carbs: 0, fat: 0, entries: 0, processed: 0 };
  for (const f of foods) {
    if (f.date !== date) continue;
    t.kcal += f.kcal;
    t.protein += f.protein;
    t.carbs += f.carbs;
    t.fat += f.fat;
    t.entries += 1;
    if (f.tag !== 'whole') t.processed += 1;
  }
  return t;
}

export interface MealSuggestion {
  meal: string;
  share: number;
  ideas: string[];
}

const MEAL_IDEAS: Record<Goal, MealSuggestion[]> = {
  lose_fat: [
    { meal: 'Breakfast', share: 0.25, ideas: ['Greek yogurt + berries + oats', 'Egg-white omelette with spinach', 'Protein smoothie with banana'] },
    { meal: 'Lunch', share: 0.35, ideas: ['Grilled chicken salad with quinoa', 'Tuna & brown rice bowl', 'Tofu stir-fry with vegetables'] },
    { meal: 'Dinner', share: 0.3, ideas: ['Salmon, broccoli & sweet potato', 'Lean beef & vegetable soup', 'Chicken breast with roasted veggies'] },
    { meal: 'Snack', share: 0.1, ideas: ['Apple + 10 almonds', 'Cottage cheese', 'Boiled eggs'] },
  ],
  build_muscle: [
    { meal: 'Breakfast', share: 0.25, ideas: ['3 eggs, toast & avocado', 'Oats with whey and peanut butter', 'Rice, natto & miso soup'] },
    { meal: 'Lunch', share: 0.3, ideas: ['Chicken thigh rice bowl', 'Beef & pasta bolognese', 'Salmon onigiri + edamame'] },
    { meal: 'Dinner', share: 0.3, ideas: ['Steak, potatoes & greens', 'Pork & vegetable stir-fry with rice', 'Turkey chili with beans'] },
    { meal: 'Snack', share: 0.15, ideas: ['Protein shake + banana', 'Trail mix', 'Milk & granola'] },
  ],
  endurance: [
    { meal: 'Breakfast', share: 0.3, ideas: ['Oatmeal with honey & banana', 'Whole-grain toast with eggs', 'Rice porridge with egg'] },
    { meal: 'Lunch', share: 0.3, ideas: ['Pasta with chicken & tomato', 'Soba with tofu & vegetables', 'Burrito bowl'] },
    { meal: 'Dinner', share: 0.3, ideas: ['Salmon, rice & vegetables', 'Chicken curry with rice', 'Lentil stew & bread'] },
    { meal: 'Snack', share: 0.1, ideas: ['Dates or dried fruit', 'Rice cakes + peanut butter', 'Sports drink after long runs'] },
  ],
  general: [
    { meal: 'Breakfast', share: 0.25, ideas: ['Yogurt, fruit & granola', 'Eggs & whole-grain toast', 'Miso soup, rice & fish'] },
    { meal: 'Lunch', share: 0.35, ideas: ['Chicken wrap with salad', 'Bento: rice, fish, vegetables', 'Bean & vegetable soup'] },
    { meal: 'Dinner', share: 0.3, ideas: ['Stir-fried vegetables with tofu', 'Grilled fish & salad', 'Chicken & vegetable pasta'] },
    { meal: 'Snack', share: 0.1, ideas: ['Fruit', 'Handful of nuts', 'Cheese & crackers'] },
  ],
};

export function mealPlan(goal: Goal): MealSuggestion[] {
  return MEAL_IDEAS[goal];
}

export const GOAL_LABEL: Record<Goal, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  endurance: 'Endurance',
  general: 'General fitness',
};
