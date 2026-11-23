import type { DateKey } from './types';

const DAY_MS = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAY_SHORT = WEEKDAYS;

export function toKey(d: Date): DateKey {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayKey = (): DateKey => toKey(new Date());

export function addDays(k: DateKey, n: number): DateKey {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Whole days from a to b (b - a). Rounded so DST shifts don't skew it. */
export function diffDays(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / DAY_MS);
}

export const weekday = (k: DateKey): number => fromKey(k).getDay();

export function formatShort(k: DateKey): string {
  const d = fromKey(k);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatLong(k: DateKey): string {
  const d = fromKey(k);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Calendar grid for a month, Sunday-first, padded with nulls to full weeks. */
export function monthGrid(year: number, month: number): (DateKey | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DateKey | null)[] = Array(first.getDay()).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(toKey(new Date(year, month, i)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Milliseconds until local midnight — the daily quest deadline. */
export function msUntilMidnight(now = new Date()): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}
