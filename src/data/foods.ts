import type { FoodTag } from '../engine/types';

export interface FoodPreset {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tag: FoodTag;
}

export const FOOD_PRESETS: FoodPreset[] = [
  { name: 'Chicken breast (150g)', kcal: 248, protein: 46, carbs: 0, fat: 5, tag: 'whole' },
  { name: 'Salmon fillet (150g)', kcal: 312, protein: 31, carbs: 0, fat: 20, tag: 'whole' },
  { name: 'Eggs (2 large)', kcal: 143, protein: 13, carbs: 1, fat: 10, tag: 'whole' },
  { name: 'White rice (1 bowl)', kcal: 240, protein: 4, carbs: 53, fat: 0, tag: 'whole' },
  { name: 'Brown rice (1 bowl)', kcal: 218, protein: 5, carbs: 46, fat: 2, tag: 'whole' },
  { name: 'Oatmeal (60g dry)', kcal: 228, protein: 8, carbs: 40, fat: 4, tag: 'whole' },
  { name: 'Greek yogurt (170g)', kcal: 100, protein: 17, carbs: 6, fat: 0, tag: 'whole' },
  { name: 'Banana', kcal: 105, protein: 1, carbs: 27, fat: 0, tag: 'whole' },
  { name: 'Apple', kcal: 95, protein: 0, carbs: 25, fat: 0, tag: 'whole' },
  { name: 'Tofu (150g)', kcal: 120, protein: 13, carbs: 3, fat: 7, tag: 'whole' },
  { name: 'Natto (1 pack)', kcal: 90, protein: 8, carbs: 6, fat: 5, tag: 'whole' },
  { name: 'Miso soup', kcal: 40, protein: 3, carbs: 5, fat: 1, tag: 'whole' },
  { name: 'Salad with dressing', kcal: 150, protein: 3, carbs: 10, fat: 11, tag: 'whole' },
  { name: 'Whey protein shake', kcal: 120, protein: 24, carbs: 3, fat: 1, tag: 'whole' },
  { name: 'Almonds (30g)', kcal: 174, protein: 6, carbs: 6, fat: 15, tag: 'whole' },
  { name: 'Sweet potato (200g)', kcal: 172, protein: 3, carbs: 40, fat: 0, tag: 'whole' },
  { name: 'Beef steak (200g)', kcal: 500, protein: 50, carbs: 0, fat: 32, tag: 'whole' },
  { name: 'Whole-grain bread (2 slices)', kcal: 160, protein: 8, carbs: 28, fat: 2, tag: 'whole' },
  { name: 'Onigiri', kcal: 180, protein: 4, carbs: 38, fat: 1, tag: 'processed' },
  { name: 'Ramen (1 bowl)', kcal: 550, protein: 20, carbs: 70, fat: 20, tag: 'processed' },
  { name: 'Burger', kcal: 550, protein: 25, carbs: 45, fat: 30, tag: 'processed' },
  { name: 'Fries (medium)', kcal: 365, protein: 4, carbs: 48, fat: 17, tag: 'processed' },
  { name: 'Pizza (2 slices)', kcal: 570, protein: 24, carbs: 70, fat: 22, tag: 'processed' },
  { name: 'Instant noodles', kcal: 380, protein: 8, carbs: 52, fat: 15, tag: 'processed' },
  { name: 'Fried chicken (3 pcs)', kcal: 650, protein: 40, carbs: 25, fat: 42, tag: 'processed' },
  { name: 'Soda (350ml)', kcal: 150, protein: 0, carbs: 39, fat: 0, tag: 'sugary' },
  { name: 'Chocolate bar', kcal: 230, protein: 3, carbs: 26, fat: 13, tag: 'sugary' },
  { name: 'Ice cream (1 cup)', kcal: 270, protein: 5, carbs: 31, fat: 14, tag: 'sugary' },
  { name: 'Donut', kcal: 260, protein: 3, carbs: 31, fat: 14, tag: 'sugary' },
  { name: 'Bubble tea', kcal: 350, protein: 2, carbs: 70, fat: 7, tag: 'sugary' },
];

export const TAG_LABEL: Record<FoodTag, string> = {
  whole: 'Whole food',
  processed: 'Processed',
  sugary: 'Sugary',
};
