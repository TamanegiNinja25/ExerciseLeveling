import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  Avatar, Button, Icon, Label, Muted, Panel, ProgressBar, RankBadge, Screen, styles, tap,
} from '@/components/ui';
import { addDays, msUntilMidnight, todayKey } from '@/engine/dates';
import { power, RANK_THRESHOLDS, rankForLevel, STAT_LABELS, xpToNext } from '@/engine/leveling';
import { taskCompletion } from '@/engine/quests';
import type { MessageKind, StatKey } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors, intensityColor, rankColor } from '@/theme';

function useCountdown() {
  const [ms, setMs] = useState(msUntilMidnight());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Which unread notice deserves the home-screen banner. */
const BANNER_PRIORITY: Record<MessageKind, number> = { penalty: 5, rank: 4, levelup: 3, achievement: 2, quest: 1, info: 1 };

function Tile({ icon, value, label, color = colors.text }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.panel, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', gap: 2 }}>
      <Icon name={icon} size={20} color={color} />
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export default function Status() {
  const g = useGame();
  const countdown = useCountdown();
  const profile = g.profile!;
  const rank = rankForLevel(g.level);
  const need = xpToNext(g.level);
  const today = g.days[todayKey()];
  const unread = g.messages.filter((m) => !m.read);
  // Only surface fresh news (today/yesterday); older items wait in the System Log.
  const fresh = unread.filter((m) => m.date >= addDays(todayKey(), -1));
  const latest = [...fresh].sort((a, b) => BANNER_PRIORITY[b.kind] - BANNER_PRIORITY[a.kind])[0];
  const nextRank = [...RANK_THRESHOLDS].reverse().find((r) => r.minLevel > g.level);
  const [assigning, setAssigning] = useState(false);

  return (
    <Screen>
      <View style={styles.between}>
        <View style={[styles.row, { gap: 12, flex: 1 }]}>
          <Avatar color={g.avatar.color} emblem={g.avatar.emblem} rank={rank} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }} numberOfLines={1}>{profile.name}</Text>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>{g.activeTitle ?? 'No title equipped'}</Text>
            <View style={[styles.row, { gap: 6, marginTop: 4 }]}>
              <RankBadge rank={rank} size={22} />
              <Text style={{ color: rankColor[rank], fontWeight: '800' }}>{rank}-Rank</Text>
              <Text style={{ color: colors.muted }}>· Lv. {g.level}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.row, { gap: 4 }]}>
          <Pressable hitSlop={8} onPress={() => router.push('/messages')} style={{ padding: 6 }}>
            <Icon name={unread.length ? 'bell-badge' : 'bell-outline'} size={24} color={unread.length ? colors.accent : colors.muted} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => router.push('/settings')} style={{ padding: 6 }}>
            <Icon name="cog-outline" size={24} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      {latest && (
        <Pressable onPress={() => router.push('/messages')}>
          <Panel tone={latest.kind === 'penalty' ? 'danger' : latest.kind === 'achievement' || latest.kind === 'levelup' || latest.kind === 'rank' ? 'accent' : 'default'}>
            <View style={[styles.row, { gap: 10 }]}>
              <Icon name={latest.kind === 'penalty' ? 'alert-octagon' : 'message-alert'} color={latest.kind === 'penalty' ? colors.danger : colors.accent} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '900' }}>{latest.title}</Text>
                <Muted>{latest.body}</Muted>
                {fresh.length > 1 && <Text style={{ color: colors.faint, fontSize: 12, marginTop: 2 }}>+{fresh.length - 1} more in System Log</Text>}
              </View>
              <Pressable hitSlop={10} onPress={() => g.markMessagesRead(latest.id)} accessibilityLabel="Dismiss">
                <Icon name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
          </Panel>
        </Pressable>
      )}

      <Panel title={`Level ${g.level}`} icon="star-circle" right={<Text style={{ color: colors.muted, fontWeight: '700' }}>{g.xp} / {need} XP</Text>}>
        <ProgressBar value={g.xp / need} height={10} />
        <Muted style={{ fontSize: 12 }}>{need - g.xp} XP to level {g.level + 1} · Lifetime {g.totalXp.toLocaleString()} XP</Muted>
        {nextRank && (
          <View style={[styles.row, { gap: 6 }]}>
            <RankBadge rank={nextRank.rank} size={18} />
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
              {nextRank.rank}-Rank at Lv. {nextRank.minLevel} · {nextRank.minLevel - g.level} level{nextRank.minLevel - g.level === 1 ? '' : 's'} to go
            </Text>
          </View>
        )}
      </Panel>

      {today && (
        <Pressable onPress={() => router.push('/quest')}>
          <Panel
            title={today.isRest ? 'Recovery day' : 'Daily quest'}
            icon={today.isRest ? 'sleep' : 'sword-cross'}
            tone={today.claimed ? 'success' : today.penaltyTasks.length && !today.penaltyCleared ? 'danger' : 'default'}
            right={<Text style={{ color: today.claimed ? colors.success : colors.accent, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{today.claimed ? 'CLEARED' : `⏳ ${countdown}`}</Text>}
          >
            <View style={styles.between}>
              <View>
                <Label>Today's intensity</Label>
                <Text style={{ color: intensityColor(today.intensity.total), fontSize: 34, fontWeight: '900' }}>
                  ×{today.intensity.total.toFixed(2)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Label>Progress</Label>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>{Math.round(taskCompletion(today.tasks) * 100)}%</Text>
              </View>
            </View>
            {!today.isRest && (
              <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
                <Text style={pill}>Base ×{today.intensity.base.toFixed(2)}</Text>
                <Text style={[pill, today.intensity.diet > 0 ? { color: colors.danger } : today.intensity.diet < 0 ? { color: colors.info } : null]}>
                  Diet {today.intensity.diet >= 0 ? '+' : ''}{Math.round(today.intensity.diet * 100)}%
                </Text>
                {today.intensity.penalty > 0 && <Text style={[pill, { color: colors.danger }]}>Penalty +{today.intensity.penalty.toFixed(2)}</Text>}
              </View>
            )}
            <ProgressBar value={taskCompletion(today.tasks)} color={today.claimed ? colors.success : colors.primary} />
            {today.penaltyTasks.length > 0 && !today.penaltyCleared && (
              <Text style={{ color: colors.danger, fontWeight: '800' }}>⚠ Penalty quest active — {today.penaltyTasks.length} tasks</Text>
            )}
          </Panel>
        </Pressable>
      )}

      <View style={[styles.row, { gap: 10 }]}>
        <Tile icon="fire" value={g.streak} label="STREAK" color={colors.accent} />
        <Tile icon="trophy" value={g.bestStreak} label="BEST" color={colors.primary} />
        <Tile icon="flash" value={power(g.stats, g.level)} label="POWER" color={colors.danger} />
        <Tile icon="dumbbell" value={g.sessions.length} label="WORKOUTS" color={colors.info} />
      </View>

      <Panel
        title="Stats"
        icon="chart-box"
        right={g.statPoints > 0 ? (
          <Pressable onPress={() => setAssigning(!assigning)} style={{ backgroundColor: assigning ? colors.accent : colors.accentSoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: assigning ? '#1A1206' : colors.accent, fontWeight: '900', fontSize: 12 }}>{assigning ? 'Done' : `Assign ${g.statPoints} pts`}</Text>
          </Pressable>
        ) : undefined}
      >
        {(Object.keys(STAT_LABELS) as StatKey[]).map((k) => (
          <View key={k} style={styles.between}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>
                {STAT_LABELS[k].short} <Text style={{ color: colors.muted, fontWeight: '600' }}>{STAT_LABELS[k].name}</Text>
              </Text>
              <Muted style={{ fontSize: 12 }}>{STAT_LABELS[k].desc}</Muted>
            </View>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', marginHorizontal: 12, fontVariant: ['tabular-nums'] }}>{g.stats[k]}</Text>
            {assigning && g.statPoints > 0 && (
              <Pressable onPress={() => { tap('medium'); g.allocate(k); }} style={{ backgroundColor: colors.accentSoft, borderRadius: 8, padding: 6 }}>
                <Icon name="plus" size={18} color={colors.accent} />
              </Pressable>
            )}
          </View>
        ))}
      </Panel>

      <View style={[styles.row, { gap: 10 }]}>
        <Button label="Progress" icon="camera" variant="ghost" onPress={() => router.push('/progress')} style={{ flex: 1 }} />
        <Button label="Achievements" icon="trophy-variant" variant="ghost" onPress={() => router.push('/achievements')} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

const pill = {
  color: colors.muted,
  backgroundColor: colors.panelHi,
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 3,
  fontSize: 12,
  fontWeight: '800',
  overflow: 'hidden',
} as const;
