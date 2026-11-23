import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { todayKey } from '../engine/dates';
import {
  allocateStat,
  completeWorkout,
  createInitialData,
  ensureDay,
  rollover,
  setTaskDone,
  startGame,
} from '../engine/game';
import { checkAchievements } from '../engine/achievements';
import { uid } from '../engine/leveling';
import type { Avatar, FoodEntry, GameData, Profile, Settings, StatKey } from '../engine/types';

interface Actions {
  onboard: (profile: Omit<Profile, 'createdAt'>) => void;
  runRollover: () => void;
  setTask: (taskId: string, done: number) => void;
  finishWorkout: (workoutId: string, durationSec: number, performed: Record<string, number>) => number;
  allocate: (stat: StatKey) => void;
  addFood: (food: Omit<FoodEntry, 'id' | 'date' | 'time'>, date?: string) => void;
  removeFood: (id: string) => void;
  addWater: (ml: number) => void;
  logWeight: (kg: number) => void;
  addPhoto: (uri: string, note: string) => void;
  removePhoto: (id: string) => void;
  markMessagesRead: () => void;
  setAvatar: (a: Partial<Avatar>) => void;
  setTitle: (title: string | null) => void;
  updateProfile: (p: Partial<Profile>) => void;
  updateSettings: (s: Partial<Settings>) => void;
  resetAll: () => void;
}

export type GameStore = GameData & Actions;

/** Pull just the data fields so engine functions never see store actions. */
function dataOf(s: GameStore): GameData {
  const { onboard, runRollover, setTask, finishWorkout, allocate, addFood, removeFood, addWater, logWeight,
    addPhoto, removePhoto, markMessagesRead, setAvatar, setTitle, updateProfile, updateSettings, resetAll,
    ...data } = s;
  return data;
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      /** Clone → mutate with engine rules → commit. */
      const mutate = <T>(fn: (d: GameData) => T): T => {
        const draft: GameData = structuredClone(dataOf(get()));
        const result = fn(draft);
        set(draft);
        return result;
      };

      return {
        ...createInitialData(),

        onboard: (profile) => mutate((d) => startGame(d, { ...profile, createdAt: todayKey() })),
        runRollover: () => mutate((d) => rollover(d, todayKey())),
        setTask: (taskId, done) => mutate((d) => setTaskDone(d, todayKey(), taskId, done)),
        finishWorkout: (workoutId, durationSec, performed) =>
          mutate((d) => completeWorkout(d, workoutId, durationSec, todayKey(), performed)),
        allocate: (stat) => mutate((d) => allocateStat(d, stat)),

        addFood: (food, date) =>
          mutate((d) => {
            const day = date ?? todayKey();
            d.foods.push({ ...food, id: uid('food'), date: day, time: Date.now() });
            checkAchievements(d, todayKey());
          }),
        removeFood: (id) => mutate((d) => void (d.foods = d.foods.filter((f) => f.id !== id))),
        addWater: (ml) =>
          mutate((d) => {
            const k = todayKey();
            d.water[k] = Math.max(0, (d.water[k] ?? 0) + ml);
          }),
        logWeight: (kg) =>
          mutate((d) => {
            const k = todayKey();
            d.weights = d.weights.filter((w) => w.date !== k);
            d.weights.push({ date: k, kg });
            d.weights.sort((a, b) => a.date.localeCompare(b.date));
            if (d.profile) d.profile.weightKg = kg;
          }),
        addPhoto: (uri, note) =>
          mutate((d) => {
            d.photos.unshift({ id: uid('photo'), uri, note, date: todayKey(), level: d.level });
            checkAchievements(d, todayKey());
          }),
        removePhoto: (id) => mutate((d) => void (d.photos = d.photos.filter((p) => p.id !== id))),
        markMessagesRead: () => mutate((d) => d.messages.forEach((m) => (m.read = true))),
        setAvatar: (a) => mutate((d) => void (d.avatar = { ...d.avatar, ...a })),
        setTitle: (title) => mutate((d) => void (d.activeTitle = title)),
        updateProfile: (p) =>
          mutate((d) => {
            if (!d.profile) return;
            d.profile = { ...d.profile, ...p };
            // Re-plan today's quest if it hasn't been touched yet.
            const today = d.days[todayKey()];
            if (today && !today.claimed && today.tasks.every((t) => t.done === 0)) {
              delete d.days[todayKey()];
              ensureDay(d, todayKey());
            }
          }),
        updateSettings: (s) => mutate((d) => void (d.settings = { ...d.settings, ...s })),
        resetAll: () => set(createInitialData()),
      };
    },
    {
      name: 'exercise-leveling/v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => dataOf(s),
    },
  ),
);

/** Resolves once persisted state has been loaded from disk. */
export function waitForHydration(): Promise<void> {
  if (useGame.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useGame.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}
