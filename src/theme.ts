import type { DayStatus, Rank } from './engine/types';

export const colors = {
  bg: '#0B0D14',
  bgElevated: '#10131D',
  panel: '#141826',
  panelHi: '#1B2033',
  border: '#262C44',
  borderHi: '#3A4266',
  text: '#E8EAF2',
  muted: '#8D93AB',
  faint: '#5A6080',
  primary: '#8B5CF6',
  primarySoft: '#8B5CF633',
  accent: '#F59E0B',
  accentSoft: '#F59E0B26',
  success: '#22C55E',
  successSoft: '#22C55E26',
  danger: '#EF4444',
  dangerSoft: '#EF444426',
  info: '#38BDF8',
  infoSoft: '#38BDF826',
};

export const rankColor: Record<Rank, string> = {
  E: '#9CA3AF',
  D: '#22C55E',
  C: '#38BDF8',
  B: '#8B5CF6',
  A: '#F59E0B',
  S: '#EF4444',
};

export const statusColor: Record<DayStatus | 'future' | 'none', string> = {
  cleared: colors.success,
  partial: colors.accent,
  missed: colors.danger,
  rest: colors.info,
  pending: colors.primary,
  future: colors.faint,
  none: colors.border,
};

export const statusLabel: Record<DayStatus, string> = {
  cleared: 'Cleared',
  partial: 'Partial',
  missed: 'Missed — penalty',
  rest: 'Recovery day',
  pending: 'In progress',
};

/** Green → amber → red as the multiplier climbs. */
export function intensityColor(x: number): string {
  if (x < 0.95) return colors.info;
  if (x < 1.25) return colors.success;
  if (x < 1.6) return colors.accent;
  return colors.danger;
}

export const AVATAR_COLORS = ['#8B5CF6', '#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#E8EAF2'];

/** Emblems unlock as you level. */
export const EMBLEMS: { icon: string; level: number }[] = [
  { icon: 'sword', level: 1 },
  { icon: 'shield', level: 1 },
  { icon: 'fire', level: 1 },
  { icon: 'lightning-bolt', level: 3 },
  { icon: 'arm-flex', level: 5 },
  { icon: 'run-fast', level: 8 },
  { icon: 'skull', level: 12 },
  { icon: 'dragon', level: 20 },
  { icon: 'crown', level: 35 },
  { icon: 'star-four-points', level: 50 },
];

export const space = (n: number) => n * 4;
