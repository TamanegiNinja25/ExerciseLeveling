import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, Label, Muted, Panel, Screen, styles } from '@/components/ui';
import { addDays, diffDays, MONTH_NAMES, monthGrid, todayKey, WEEKDAY_SHORT } from '@/engine/dates';
import { isRestDay } from '@/engine/game';
import { projectIntensity } from '@/engine/intensity';
import type { DayRecord } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors, intensityColor, statusColor } from '@/theme';

const LEGEND: { key: keyof typeof statusColor; label: string }[] = [
  { key: 'cleared', label: 'Cleared' },
  { key: 'partial', label: 'Partial' },
  { key: 'missed', label: 'Missed' },
  { key: 'rest', label: 'Recovery' },
  { key: 'pending', label: 'Today' },
];

function cellColor(rec: DayRecord | undefined, isFuture: boolean, isRest: boolean) {
  if (rec) return statusColor[rec.status];
  if (isFuture) return isRest ? statusColor.rest : statusColor.future;
  return statusColor.none;
}

export default function Calendar() {
  const g = useGame();
  const today = todayKey();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const cells = useMemo(() => monthGrid(ym.y, ym.m), [ym]);
  const profile = g.profile!;

  const monthRecs = cells.filter((k): k is string => !!k).map((k) => g.days[k]).filter((r): r is DayRecord => !!r);
  const closed = monthRecs.filter((r) => r.evaluated || r.claimed);
  const count = (s: DayRecord['status']) => monthRecs.filter((r) => r.status === s).length;
  const trainingDays = closed.filter((r) => !r.isRest);
  const clearRate = trainingDays.length ? trainingDays.filter((r) => r.status === 'cleared').length / trainingDays.length : 0;
  const avgIntensity = trainingDays.length ? trainingDays.reduce((a, r) => a + r.intensity.total, 0) / trainingDays.length : 0;
  const netXp = monthRecs.reduce((a, r) => a + r.xpDelta, 0);
  const maxIntensity = Math.max(1.5, ...monthRecs.map((r) => r.intensity.total));

  const tomorrow = addDays(today, 1);
  const tomorrowRest = isRestDay(profile, tomorrow);
  const ifClear = projectIntensity(g, tomorrow, 'cleared');
  const ifMiss = projectIntensity(g, tomorrow, 'missed');

  const shift = (delta: number) => {
    const d = new Date(ym.y, ym.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <Screen>
      <View>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>Training Calendar</Text>
        <Muted>Each day's quest intensity is set by your consistency, yesterday's diet and recent penalties. Tap a day for its full report.</Muted>
      </View>

      <Panel>
        <View style={styles.between}>
          <Pressable hitSlop={10} onPress={() => shift(-1)} style={{ padding: 4 }}><Icon name="chevron-left" size={26} /></Pressable>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18 }}>{MONTH_NAMES[ym.m]} {ym.y}</Text>
          <Pressable hitSlop={10} onPress={() => shift(1)} style={{ padding: 4 }}><Icon name="chevron-right" size={26} /></Pressable>
        </View>

        <View style={{ flexDirection: 'row' }}>
          {WEEKDAY_SHORT.map((d) => (
            <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.faint, fontWeight: '800', fontSize: 11 }}>{d.toUpperCase()}</Text>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((k, i) => {
            if (!k) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 0.82 }} />;
            const rec = g.days[k];
            const future = diffDays(today, k) > 0;
            const rest = isRestDay(profile, k);
            const c = cellColor(rec, future, rest);
            const isToday = k === today;
            return (
              <Pressable key={k} onPress={() => router.push(`/day/${k}`)} style={{ width: `${100 / 7}%`, aspectRatio: 0.82, padding: 2 }}>
                <View
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: rec ? c + '2E' : colors.bgElevated,
                    borderWidth: isToday ? 2 : 1,
                    borderColor: isToday ? colors.primary : rec ? c + '88' : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  <Text style={{ color: future ? colors.faint : colors.text, fontWeight: '800', fontSize: 13 }}>{Number(k.slice(8))}</Text>
                  {rec && !rec.isRest ? (
                    <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>×{rec.intensity.total.toFixed(1)}</Text>
                  ) : rec?.isRest || (future && rest) ? (
                    <Icon name="sleep" size={10} color={colors.info} />
                  ) : null}
                  {rec?.status === 'missed' && !rec.grace && <Icon name="skull" size={9} color={colors.danger} />}
                  {rec && rec.workouts.length > 0 && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.row, { flexWrap: 'wrap', gap: 10, justifyContent: 'center' }]}>
          {LEGEND.map((l) => (
            <View key={l.key} style={[styles.row, { gap: 4 }]}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: statusColor[l.key] }} />
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>{l.label}</Text>
            </View>
          ))}
          <View style={[styles.row, { gap: 4 }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>Workout</Text>
          </View>
        </View>
      </Panel>

      {!tomorrowRest ? (
        <Panel title="Tomorrow's forecast" icon="crystal-ball" tone="accent">
          <View style={[styles.row, { gap: 10 }]}>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: 10, padding: 10 }}>
              <Label>If you clear today</Label>
              <Text style={{ color: intensityColor(ifClear.total), fontSize: 26, fontWeight: '900' }}>×{ifClear.total.toFixed(2)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.dangerSoft, borderRadius: 10, padding: 10 }}>
              <Label>If you miss today</Label>
              <Text style={{ color: intensityColor(ifMiss.total), fontSize: 26, fontWeight: '900' }}>×{ifMiss.total.toFixed(2)}</Text>
            </View>
          </View>
          {ifClear.reasons.slice(1).map((r) => (
            <Muted key={r} style={{ fontSize: 13 }}>• {r}</Muted>
          ))}
          <Muted style={{ fontSize: 12 }}>Based on what you've eaten today. Log meals on the Fuel tab to update it.</Muted>
        </Panel>
      ) : (
        <Panel title="Tomorrow" icon="sleep">
          <Muted>Tomorrow is a scheduled recovery day: a light walk and mobility work, with no penalty risk.</Muted>
        </Panel>
      )}

      <Panel title={`${MONTH_NAMES[ym.m]} summary`} icon="chart-bar">
        <View style={[styles.row, { gap: 8 }]}>
          {[
            { v: count('cleared'), l: 'Cleared', c: colors.success },
            { v: count('partial'), l: 'Partial', c: colors.accent },
            { v: count('missed'), l: 'Missed', c: colors.danger },
            { v: count('rest'), l: 'Recovery', c: colors.info },
          ].map((x) => (
            <View key={x.l} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: x.c, fontSize: 22, fontWeight: '900' }}>{x.v}</Text>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700' }}>{x.l}</Text>
            </View>
          ))}
        </View>
        <View style={styles.between}>
          <Muted>Clear rate</Muted>
          <Text style={{ color: colors.text, fontWeight: '800' }}>{Math.round(clearRate * 100)}%</Text>
        </View>
        <View style={styles.between}>
          <Muted>Average intensity</Muted>
          <Text style={{ color: colors.text, fontWeight: '800' }}>{avgIntensity ? `×${avgIntensity.toFixed(2)}` : '—'}</Text>
        </View>
        <View style={styles.between}>
          <Muted>Net XP this month</Muted>
          <Text style={{ color: netXp >= 0 ? colors.success : colors.danger, fontWeight: '800' }}>{netXp >= 0 ? '+' : ''}{netXp}</Text>
        </View>
        <View style={styles.between}>
          <Muted>Base progression</Muted>
          <Text style={{ color: colors.text, fontWeight: '800' }}>×{g.progression.toFixed(2)}</Text>
        </View>
      </Panel>

      <Panel title="Intensity trend" icon="chart-line-variant">
        {monthRecs.length === 0 ? (
          <Muted>No days recorded this month yet.</Muted>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 2 }}>
              {cells.filter((k): k is string => !!k).map((k) => {
                const r = g.days[k];
                const h = r && !r.isRest ? (r.intensity.total / maxIntensity) * 86 : 0;
                return (
                  <View key={k} style={{ flex: 1, height: Math.max(2, h), borderRadius: 2, backgroundColor: r ? (r.isRest ? colors.border : statusColor[r.status]) : colors.panelHi }} />
                );
              })}
            </View>
            <Muted style={{ fontSize: 12 }}>Bar height = intensity multiplier. Color = day outcome.</Muted>
          </>
        )}
      </Panel>
    </Screen>
  );
}
