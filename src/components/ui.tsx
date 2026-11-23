import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, rankColor } from '../theme';
import { useGame } from '../store/useGame';
import type { Rank } from '../engine/types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: string; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color} />;
}

export function tap(style: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web' || !useGame.getState().settings.haptics) return;
  if (style === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else void Haptics.impactAsync(style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
}

export function Screen({ children, scroll = true, edges = ['top'] as ('top' | 'bottom')[] }: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { flex: 1 }]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** Bordered "system window" panel with an optional header strip. */
export function Panel({ title, icon, right, children, style, tone = 'default' }: {
  title?: string;
  icon?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'danger' | 'accent' | 'success';
}) {
  const border = tone === 'danger' ? colors.danger : tone === 'accent' ? colors.accent : tone === 'success' ? colors.success : colors.border;
  return (
    <View style={[styles.panel, { borderColor: border }, style]}>
      {title ? (
        <View style={styles.panelHeader}>
          <View style={[styles.row, { flex: 1, marginRight: right ? 10 : 0 }]}>
            {icon ? <Icon name={icon} size={16} color={tone === 'default' ? colors.primary : border} /> : null}
            <Text numberOfLines={1} style={[styles.panelTitle, { flexShrink: 1 }, icon ? { marginLeft: 6 } : null]}>{title.toUpperCase()}</Text>
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 8, track = colors.panelHi }: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, backgroundColor: track, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Button({ label, onPress, icon, variant = 'primary', disabled, style, small }: {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'ghost' | 'danger' | 'accent' | 'success';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg = {
    primary: colors.primary,
    accent: colors.accent,
    danger: colors.danger,
    success: colors.success,
    ghost: 'transparent',
  }[variant];
  const fg = variant === 'ghost' ? colors.text : variant === 'accent' ? '#1A1206' : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.borderHi },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }, small && { fontSize: 13 }, icon ? { marginLeft: 6 } : null]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = colors.primary, icon }: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: color + '33', borderColor: color }]}
    >
      {icon ? <Icon name={icon} size={14} color={active ? color : colors.muted} /> : null}
      <Text style={[styles.chipText, active && { color }, icon ? { marginLeft: 4 } : null]}>{label}</Text>
    </Pressable>
  );
}

export function RankBadge({ rank, size = 28 }: { rank: Rank; size?: number }) {
  const c = rankColor[rank];
  return (
    <View style={{ width: size, height: size, borderRadius: 6, borderWidth: 1.5, borderColor: c, backgroundColor: c + '22', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c, fontWeight: '900', fontSize: size * 0.5 }}>{rank}</Text>
    </View>
  );
}

export function Avatar({ color, emblem, rank, size = 72 }: { color: string; emblem: string; rank: Rank; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: rankColor[rank], padding: 3 }}>
      <View style={{ flex: 1, borderRadius: size, backgroundColor: color + '33', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={emblem} size={size * 0.45} color={color} />
      </View>
    </View>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, format = (v: number) => String(v), disabled }: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return (
    <View style={[styles.row, { opacity: disabled ? 0.5 : 1 }]}>
      <Pressable disabled={disabled} hitSlop={8} onPress={() => { tap(); onChange(Math.max(min, round(value - step))); }} style={styles.stepBtn}>
        <Icon name="minus" size={18} />
      </Pressable>
      <Text style={styles.stepValue}>{format(value)}</Text>
      <Pressable disabled={disabled} hitSlop={8} onPress={() => { tap(); onChange(round(value + step)); }} style={styles.stepBtn}>
        <Icon name="plus" size={18} />
      </Pressable>
    </View>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 24 }}>
      <Icon name={icon} size={36} color={colors.faint} />
      <Muted style={{ marginTop: 8, textAlign: 'center' }}>{text}</Muted>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  buttonText: { fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  chipText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.panelHi,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepValue: { color: colors.text, fontWeight: '800', fontSize: 16, minWidth: 64, textAlign: 'center' },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  h1: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  text: { color: colors.text, fontSize: 15 },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
});
