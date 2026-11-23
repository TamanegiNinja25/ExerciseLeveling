import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Chip, Icon, Label, Muted, RankBadge, Screen, styles } from '@/components/ui';
import { hasEquipment, MUSCLE_LABEL, type Muscle } from '@/data/exercises';
import { RANK_XP, WORKOUTS } from '@/data/workouts';
import { levelForRank, RANK_ORDER } from '@/engine/leveling';
import type { Rank } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors, rankColor } from '@/theme';

export default function Train() {
  const level = useGame((s) => s.level);
  const equipment = useGame((s) => s.profile!.equipment);
  const sessions = useGame((s) => s.sessions);
  const [rank, setRank] = useState<Rank | null>(null);
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [ownedOnly, setOwnedOnly] = useState(true);

  const list = useMemo(
    () =>
      WORKOUTS.filter((w) => (!rank || w.rank === rank) && (!muscle || w.focus.includes(muscle)) && (!ownedOnly || hasEquipment(equipment, w.equipment))),
    [rank, muscle, ownedOnly, equipment],
  );

  const completedCount = (id: string) => sessions.filter((s) => s.workoutId === id).length;

  return (
    <Screen>
      <View>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>Training</Text>
        <Muted>Ranked workouts from E to S. Higher ranks unlock as you level up and pay more XP. Reps also count toward today's quest.</Muted>
      </View>

      <Label>Rank</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip label="All" active={!rank} onPress={() => setRank(null)} />
        {RANK_ORDER.map((r) => (
          <Chip key={r} label={`${r}-Rank`} active={rank === r} color={rankColor[r]} onPress={() => setRank(rank === r ? null : r)} />
        ))}
      </ScrollView>
      <Label>Muscle group</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Chip label="All" active={!muscle} onPress={() => setMuscle(null)} />
        {(Object.keys(MUSCLE_LABEL) as Muscle[]).map((m) => (
          <Chip key={m} label={MUSCLE_LABEL[m]} active={muscle === m} onPress={() => setMuscle(muscle === m ? null : m)} />
        ))}
      </ScrollView>
      <View style={[styles.row, { gap: 6 }]}>
        <Chip label="My equipment only" icon="filter" active={ownedOnly} onPress={() => setOwnedOnly(!ownedOnly)} color={colors.accent} />
      </View>

      {list.length === 0 && <Muted>No workouts match these filters.</Muted>}

      {list.map((w) => {
        const locked = level < levelForRank(w.rank);
        const count = completedCount(w.id);
        return (
          <Pressable key={w.id} onPress={() => router.push(`/workout/${w.id}`)}>
            <View style={{ backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: locked ? colors.border : rankColor[w.rank] + '66', padding: 14, gap: 6, opacity: locked ? 0.55 : 1 }}>
              <View style={styles.between}>
                <View style={[styles.row, { gap: 10, flex: 1 }]}>
                  <RankBadge rank={w.rank} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>{w.name}</Text>
                    <Muted style={{ fontSize: 12 }}>
                      {w.minutes} min · {w.focus.map((f) => MUSCLE_LABEL[f]).join(', ')}
                    </Muted>
                  </View>
                </View>
                {locked ? (
                  <View style={[styles.row, { gap: 4 }]}>
                    <Icon name="lock" size={16} color={colors.muted} />
                    <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>Lv {levelForRank(w.rank)}</Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.accent, fontWeight: '900' }}>+{Math.round(RANK_XP[w.rank] * (1 + level * 0.02))} XP</Text>
                )}
              </View>
              <Muted style={{ fontSize: 13 }}>{w.description}</Muted>
              <View style={[styles.row, { gap: 10 }]}>
                <Text style={{ color: colors.faint, fontSize: 12, fontWeight: '700' }}>
                  {w.equipment === 'none' ? 'BODYWEIGHT' : w.equipment.toUpperCase()}
                </Text>
                {count > 0 && <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>✓ Completed ×{count}</Text>}
              </View>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}
