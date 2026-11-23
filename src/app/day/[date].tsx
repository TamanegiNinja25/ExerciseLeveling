import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { TaskRow } from '@/components/TaskRow';
import { Icon, Label, Muted, Panel, ProgressBar, Screen, styles } from '@/components/ui';
import { getWorkout } from '@/data/workouts';
import { diffDays, formatLong, formatShort, todayKey } from '@/engine/dates';
import { isRestDay } from '@/engine/game';
import { computeTargets, totalsFor } from '@/engine/nutrition';
import { taskCompletion } from '@/engine/quests';
import { useGame } from '@/store/useGame';
import { colors, intensityColor, statusColor, statusLabel } from '@/theme';

function Macro({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.between}>
        <Muted>{label}</Muted>
        <Text style={{ color: colors.text, fontWeight: '800' }}>{Math.round(value)} / {target} {unit}</Text>
      </View>
      <ProgressBar value={value / target} color={value > target * 1.15 ? colors.danger : color} height={6} />
    </View>
  );
}

export default function DayReport() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const g = useGame();
  const rec = g.days[date];
  const profile = g.profile!;
  const targets = computeTargets(profile);
  const food = totalsFor(g.foods, date);
  const today = todayKey();
  const isFuture = diffDays(today, date) > 0;
  const sessions = g.sessions.filter((s) => s.date === date);
  const water = g.water[date] ?? 0;

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: formatShort(date) }} />
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>{formatLong(date)}</Text>

      {!rec ? (
        <Panel title={isFuture ? 'Planned' : 'No record'} icon={isFuture ? 'calendar-clock' : 'calendar-remove'}>
          <Muted>
            {isFuture
              ? isRestDay(profile, date)
                ? 'Scheduled recovery day: light walk and mobility.'
                : "Training day. Its intensity will be fixed at the start of the day, based on your progression, the previous day's diet and any recent misses."
              : 'This day is before you started, or outside the tracked range.'}
          </Muted>
        </Panel>
      ) : (
        <>
          <Panel tone={rec.status === 'missed' ? 'danger' : rec.status === 'cleared' ? 'success' : rec.status === 'partial' ? 'accent' : 'default'}>
            <View style={styles.between}>
              <View style={[styles.row, { gap: 8 }]}>
                <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: statusColor[rec.status] }} />
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>
                  {rec.status === 'pending' && rec.claimed ? 'Cleared' : statusLabel[rec.status]}
                  {rec.grace && rec.status === 'missed' ? ' (first day — no penalty)' : ''}
                </Text>
              </View>
              <Text style={{ color: rec.xpDelta >= 0 ? colors.success : colors.danger, fontWeight: '900', fontSize: 16 }}>
                {rec.xpDelta >= 0 ? '+' : ''}{rec.xpDelta} XP
              </Text>
            </View>
            <ProgressBar value={taskCompletion(rec.tasks)} color={statusColor[rec.status]} />
            <Muted style={{ fontSize: 12 }}>{Math.round(taskCompletion(rec.tasks) * 100)}% of the daily quest completed</Muted>
          </Panel>

          {!rec.isRest && (
            <Panel title="Intensity breakdown" icon="speedometer" right={<Text style={{ color: intensityColor(rec.intensity.total), fontWeight: '900', fontSize: 20 }}>×{rec.intensity.total.toFixed(2)}</Text>}>
              <View style={[styles.row, { gap: 8 }]}>
                {[
                  { l: 'Base', v: `×${rec.intensity.base.toFixed(2)}` },
                  { l: 'Diet', v: `${rec.intensity.diet >= 0 ? '+' : ''}${Math.round(rec.intensity.diet * 100)}%` },
                  { l: 'Penalty', v: `+${rec.intensity.penalty.toFixed(2)}` },
                ].map((x) => (
                  <View key={x.l} style={{ flex: 1, backgroundColor: colors.panelHi, borderRadius: 10, padding: 8, alignItems: 'center' }}>
                    <Label>{x.l}</Label>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{x.v}</Text>
                  </View>
                ))}
              </View>
              <Muted style={{ fontSize: 12 }}>total = base × (1 + diet) + penalty, clamped to 0.5–3.0</Muted>
              {rec.intensity.reasons.map((r) => (
                <Muted key={r} style={{ fontSize: 13 }}>• {r}</Muted>
              ))}
            </Panel>
          )}

          <Panel title="Quest log" icon="format-list-checks">
            {rec.tasks.map((t) => (
              <TaskRow key={t.id} task={t} locked onChange={() => {}} />
            ))}
          </Panel>

          {rec.penaltyTasks.length > 0 && (
            <Panel title="Penalty quest" icon="skull-crossbones" tone="danger" right={<Text style={{ color: rec.penaltyCleared ? colors.success : colors.danger, fontWeight: '900' }}>{rec.penaltyCleared ? 'CLEARED' : 'NOT CLEARED'}</Text>}>
              {rec.penaltyTasks.map((t) => (
                <TaskRow key={t.id} task={t} penalty locked onChange={() => {}} />
              ))}
            </Panel>
          )}
        </>
      )}

      {!isFuture && (
        <Panel title="Nutrition" icon="food-apple">
          {food.entries === 0 ? (
            <Muted>No meals logged for this day.</Muted>
          ) : (
            <>
              <Macro label="Calories" value={food.kcal} target={targets.kcal} unit="kcal" color={colors.accent} />
              <Macro label="Protein" value={food.protein} target={targets.protein} unit="g" color={colors.success} />
              <Macro label="Carbs" value={food.carbs} target={targets.carbs} unit="g" color={colors.info} />
              <Macro label="Fat" value={food.fat} target={targets.fat} unit="g" color={colors.primary} />
              <Muted style={{ fontSize: 12 }}>{food.entries} items · {food.processed} processed/sugary</Muted>
            </>
          )}
          <View style={styles.between}>
            <Muted>Water</Muted>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{(water / 1000).toFixed(2)} / {(targets.waterMl / 1000).toFixed(1)} L</Text>
          </View>
          <Muted style={{ fontSize: 12 }}>This day's diet sets the next day's intensity.</Muted>
        </Panel>
      )}

      {sessions.length > 0 && (
        <Panel title="Workouts" icon="dumbbell">
          {sessions.map((s) => (
            <View key={s.id} style={styles.between}>
              <View style={[styles.row, { gap: 6 }]}>
                <Icon name="check-circle" color={colors.success} size={18} />
                <Text style={{ color: colors.text, fontWeight: '700' }}>{getWorkout(s.workoutId)?.name ?? s.workoutId}</Text>
              </View>
              <Muted>{Math.round(s.durationSec / 60)} min · +{s.xp} XP</Muted>
            </View>
          ))}
        </Panel>
      )}
    </Screen>
  );
}
