import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, diffDays, monthGrid } from '../src/engine/dates';
import { createInitialData, rollover, setTaskDone, startGame } from '../src/engine/game';
import { computeIntensity, dietModifier, nextProgression, projectIntensity } from '../src/engine/intensity';
import { grantXp, loseXp, rankForLevel, xpToNext } from '../src/engine/leveling';
import { computeTargets, type DayTotals } from '../src/engine/nutrition';
import { generateDailyTasks } from '../src/engine/quests';
import type { FoodEntry, GameData, Profile } from '../src/engine/types';

const START = '2026-01-05'; // a Monday

function profile(over: Partial<Profile> = {}): Profile {
  return {
    name: 'Tester', sex: 'male', age: 30, heightCm: 175, weightKg: 75, activity: 'moderate',
    fitness: 'beginner', goal: 'general', equipment: 'none', restDays: [], reminderHour: 7,
    reminderMinute: 0, createdAt: START, ...over,
  };
}

function newGame(over: Partial<Profile> = {}): GameData {
  const d = createInitialData();
  startGame(d, profile(over));
  return d;
}

function clearDay(d: GameData, date: string) {
  for (const t of d.days[date].tasks) setTaskDone(d, date, t.id, t.target);
}

const totals = (o: Partial<DayTotals>): DayTotals => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, entries: 1, processed: 0, ...o });

test('dates: arithmetic and month grid', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(diffDays('2026-03-01', '2026-03-31'), 30);
  const grid = monthGrid(2026, 1); // Feb 2026 starts on Sunday
  assert.equal(grid[0], '2026-02-01');
  assert.equal(grid.length % 7, 0);
});

test('leveling: xp curve, multi-level gain, rank thresholds, no de-level', () => {
  const d = createInitialData();
  assert.equal(xpToNext(1), 125);
  grantXp(d, xpToNext(1) + xpToNext(2) + 10, START);
  assert.equal(d.level, 3);
  assert.equal(d.xp, 10);
  assert.equal(d.statPoints, 6);
  assert.equal(loseXp(d, 1000), 10);
  assert.equal(d.level, 3);
  assert.equal(rankForLevel(9), 'E');
  assert.equal(rankForLevel(10), 'D');
  assert.equal(rankForLevel(70), 'S');
});

test('nutrition: Mifflin–St Jeor targets', () => {
  const t = computeTargets(profile());
  assert.equal(t.bmr, Math.round(10 * 75 + 6.25 * 175 - 5 * 30 + 5));
  assert.equal(t.kcal, Math.round(t.bmr * 1.55));
  assert.equal(t.protein, Math.round(75 * 1.4));
});

test('diet modifier: surplus raises, under-fuelling lowers, junk is taxed', () => {
  const targets = computeTargets(profile());
  assert.equal(dietModifier({ ...totals({}), entries: 0 }, targets, 'general').value, 0.05);
  assert.equal(dietModifier(totals({ kcal: targets.kcal }), targets, 'general').value, 0);
  const surplus = dietModifier(totals({ kcal: targets.kcal * 1.5 }), targets, 'general').value;
  assert.equal(surplus, 0.3);
  const bulk = dietModifier(totals({ kcal: targets.kcal * 1.5 }), targets, 'build_muscle').value;
  assert.equal(bulk, 0.15);
  assert.equal(dietModifier(totals({ kcal: targets.kcal * 0.5 }), targets, 'general').value, -0.15);
  const junk = dietModifier(totals({ kcal: targets.kcal, processed: 10 }), targets, 'general').value;
  assert.equal(junk, 0.15);
});

test('diet modifier: an unfinished day is not treated as under-fuelled', () => {
  const targets = computeTargets(profile());
  const lunchOnly = totals({ kcal: targets.kcal * 0.3 });
  assert.equal(dietModifier(lunchOnly, targets, 'general').value, -0.15);
  assert.equal(dietModifier(lunchOnly, targets, 'general', true).value, 0);
  // A surplus already eaten still counts mid-day.
  assert.equal(dietModifier(totals({ kcal: targets.kcal * 1.5 }), targets, 'general', true).value, 0.3);
});

test('quests: targets scale with intensity', () => {
  const p = profile();
  const base = generateDailyTasks(p, 1, false);
  const hard = generateDailyTasks(p, 1.5, false);
  assert.equal(base[0].target, 10);
  assert.equal(hard[0].target, 15);
  assert.equal(generateDailyTasks(p, 2, true)[0].exerciseId, 'walk');
});

test('progression: clamps to floor and cap', () => {
  assert.equal(nextProgression(1, 'missed'), 1);
  assert.equal(nextProgression(1, 'cleared'), 1.02);
  assert.equal(nextProgression(2.5, 'cleared'), 2.5);
});

test('game: clearing grants XP and streak; progression rises after rollover', () => {
  const d = newGame();
  clearDay(d, START);
  assert.equal(d.days[START].claimed, true);
  assert.equal(d.streak, 1);
  assert.ok(d.totalXp > 0);
  rollover(d, addDays(START, 1));
  assert.equal(d.days[START].status, 'cleared');
  assert.equal(d.progression, 1.02);
  assert.equal(d.days[addDays(START, 1)].intensity.base, 1.02);
});

test('game: first day is a grace day; later misses cost XP and spawn a penalty quest', () => {
  const d = newGame();
  rollover(d, addDays(START, 1));
  assert.equal(d.days[START].status, 'missed');
  assert.equal(d.days[START].xpDelta, 0);
  assert.equal(d.days[addDays(START, 1)].penaltyTasks.length, 0);

  const day2 = addDays(START, 1);
  clearDay(d, day2);
  const xpBefore = d.xp;
  rollover(d, addDays(START, 3)); // day 3 missed (app not opened)
  const day3 = d.days[addDays(START, 2)];
  assert.equal(day3.status, 'missed');
  assert.ok(day3.xpDelta < 0);
  assert.ok(d.xp < xpBefore);
  assert.equal(d.streak, 0);

  const day4 = d.days[addDays(START, 3)];
  assert.ok(day4.penaltyTasks.length > 0);
  assert.equal(day4.intensity.penalty, 0.1);
});

test('game: diet logged yesterday changes today\'s intensity', () => {
  const d = newGame();
  const targets = computeTargets(d.profile!);
  const feast: FoodEntry = { id: 'f', date: START, name: 'Feast', kcal: targets.kcal * 1.5, protein: 0, carbs: 0, fat: 0, tag: 'processed', time: 0 };
  d.foods.push(feast);
  clearDay(d, START);
  const projected = projectIntensity(d, addDays(START, 1), 'cleared');
  rollover(d, addDays(START, 1));
  const today = d.days[addDays(START, 1)];
  assert.equal(today.intensity.diet, 0.33);
  assert.equal(today.intensity.total, projected.total);
  assert.equal(today.intensity.total, computeIntensity(d, addDays(START, 1)).total);
  assert.ok(today.intensity.total > 1.3);
});

test('game: rest days never penalise', () => {
  const d = newGame({ restDays: [2] }); // Tuesdays
  clearDay(d, START);
  rollover(d, addDays(START, 2)); // Tuesday untouched
  const tue = d.days[addDays(START, 1)];
  assert.equal(tue.isRest, true);
  assert.equal(tue.status, 'rest');
  assert.equal(d.streak, 1);
});
