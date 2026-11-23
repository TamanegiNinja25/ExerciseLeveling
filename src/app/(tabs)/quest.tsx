import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { TaskRow } from '@/components/TaskRow';
import { Button, Icon, Label, Muted, Panel, ProgressBar, Screen, styles } from '@/components/ui';
import { formatLong, todayKey } from '@/engine/dates';
import { questReward } from '@/engine/leveling';
import { taskCompletion } from '@/engine/quests';
import { useGame } from '@/store/useGame';
import { colors, intensityColor } from '@/theme';

export default function Quest() {
  const date = todayKey();
  const rec = useGame((s) => s.days[date]);
  const level = useGame((s) => s.level);
  const setTask = useGame((s) => s.setTask);

  if (!rec) {
    return (
      <Screen>
        <Muted>Preparing today's quest…</Muted>
      </Screen>
    );
  }

  const completion = taskCompletion(rec.tasks);
  const reward = rec.isRest ? 25 : questReward(level, rec.intensity.total);

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 4 }}>
        <Label>{formatLong(date)}</Label>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 2 }}>
          {rec.isRest ? 'RECOVERY QUEST' : 'DAILY QUEST'}
        </Text>
        <Muted style={{ textAlign: 'center' }}>
          {rec.isRest
            ? 'Scheduled recovery. Move lightly and stretch — no penalty today.'
            : 'Complete every task before midnight. Failure carries a penalty.'}
        </Muted>
        {!rec.isRest && (
          <Text style={{ color: intensityColor(rec.intensity.total), fontWeight: '900', fontSize: 15 }}>
            Intensity ×{rec.intensity.total.toFixed(2)}
          </Text>
        )}
      </View>

      {rec.claimed && (
        <Panel tone="success">
          <View style={[styles.row, { gap: 10 }]}>
            <Icon name="check-decagram" size={32} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.success, fontWeight: '900', fontSize: 18 }}>QUEST CLEARED</Text>
              <Muted>+{rec.xpDelta} XP earned today. Extra reps still count toward your lifetime totals.</Muted>
            </View>
          </View>
        </Panel>
      )}

      <Panel
        title="Tasks"
        icon="format-list-checks"
        right={<Text style={{ color: colors.accent, fontWeight: '800' }}>Reward: {reward} XP</Text>}
      >
        <ProgressBar value={completion} color={rec.claimed ? colors.success : colors.primary} />
        {rec.tasks.map((t) => (
          <TaskRow key={t.id} task={t} onChange={(v) => setTask(t.id, v)} />
        ))}
      </Panel>

      {rec.penaltyTasks.length > 0 && (
        <Panel title="Penalty quest" icon="skull-crossbones" tone="danger" right={rec.penaltyCleared ? <Text style={{ color: colors.success, fontWeight: '900' }}>CLEARED</Text> : undefined}>
          <Muted>
            Yesterday's quest was failed. Clear this penalty today for +30 XP and +1 VIT, or lose an extra 10% of your level's XP at midnight.
          </Muted>
          {rec.penaltyTasks.map((t) => (
            <TaskRow key={t.id} task={t} penalty onChange={(v) => setTask(t.id, v)} />
          ))}
        </Panel>
      )}

      {!rec.isRest && (
        <Panel title="Intensity" icon="speedometer" right={<Text style={{ color: intensityColor(rec.intensity.total), fontWeight: '900', fontSize: 20 }}>×{rec.intensity.total.toFixed(2)}</Text>}>
          {rec.intensity.reasons.map((r) => (
            <Muted key={r} style={{ fontSize: 13 }}>• {r}</Muted>
          ))}
          <Button label="See calendar" icon="calendar-month" variant="ghost" small onPress={() => router.push('/calendar')} />
        </Panel>
      )}

      <Button label="Bonus workouts" icon="dumbbell" variant="ghost" onPress={() => router.push('/train')} />
    </Screen>
  );
}
