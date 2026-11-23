import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Empty, Icon, Label, Muted, Panel, ProgressBar, Screen, styles, tap } from '@/components/ui';
import { FOOD_PRESETS, TAG_LABEL, type FoodPreset } from '@/data/foods';
import { todayKey } from '@/engine/dates';
import { dietModifier } from '@/engine/intensity';
import { computeTargets, GOAL_LABEL, mealPlan, totalsFor } from '@/engine/nutrition';
import type { FoodTag } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

const TAG_COLOR: Record<FoodTag, string> = { whole: colors.success, processed: colors.accent, sugary: colors.danger };

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Label>{label}</Label>
      <Text style={{ color: colors.text, fontWeight: '900' }}>{Math.round(value)}<Text style={{ color: colors.muted, fontWeight: '600' }}>/{target}{unit}</Text></Text>
      <ProgressBar value={value / target} color={color} height={6} />
    </View>
  );
}

function AddFoodModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addFood = useGame((s) => s.addFood);
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '', tag: 'whole' as FoodTag });
  const results = useMemo(() => FOOD_PRESETS.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())), [q]);

  const addPreset = (f: FoodPreset) => {
    tap('success');
    addFood(f);
    onClose();
  };
  const addCustom = () => {
    const n = (s: string) => Math.max(0, Number(s.replace(',', '.')) || 0);
    if (!custom.name.trim() || !n(custom.kcal)) return;
    addFood({ name: custom.name.trim(), kcal: n(custom.kcal), protein: n(custom.protein), carbs: n(custom.carbs), fat: n(custom.fat), tag: custom.tag });
    setCustom({ name: '', kcal: '', protein: '', carbs: '', fat: '', tag: 'whole' });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.between, { padding: 16 }]}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>Log food</Text>
          <Pressable onPress={onClose} hitSlop={10}><Icon name="close" size={26} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }} keyboardShouldPersistTaps="handled">
          <Panel title="Custom entry" icon="pencil">
            <TextInput style={styles.input} placeholder="Food name" placeholderTextColor={colors.faint} value={custom.name} onChangeText={(t) => setCustom({ ...custom, name: t })} />
            <View style={[styles.row, { gap: 8 }]}>
              {(['kcal', 'protein', 'carbs', 'fat'] as const).map((k) => (
                <TextInput
                  key={k}
                  style={[styles.input, { flex: 1, paddingHorizontal: 8 }]}
                  placeholder={k === 'kcal' ? 'kcal' : `${k[0].toUpperCase()} g`}
                  placeholderTextColor={colors.faint}
                  keyboardType="decimal-pad"
                  value={custom[k]}
                  onChangeText={(t) => setCustom({ ...custom, [k]: t })}
                />
              ))}
            </View>
            <View style={[styles.row, { gap: 6 }]}>
              {(Object.keys(TAG_LABEL) as FoodTag[]).map((t) => (
                <Chip key={t} label={TAG_LABEL[t]} active={custom.tag === t} color={TAG_COLOR[t]} onPress={() => setCustom({ ...custom, tag: t })} />
              ))}
            </View>
            <Button label="Add custom food" icon="plus" disabled={!custom.name.trim() || !Number(custom.kcal)} onPress={addCustom} />
          </Panel>

          <TextInput style={styles.input} placeholder="Search common foods…" placeholderTextColor={colors.faint} value={q} onChangeText={setQ} />
          {results.map((f) => (
            <Pressable key={f.name} onPress={() => addPreset(f)}>
              <View style={[styles.between, { backgroundColor: colors.panel, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>{f.name}</Text>
                  <Muted style={{ fontSize: 12 }}>P {f.protein}g · C {f.carbs}g · F {f.fat}g · <Text style={{ color: TAG_COLOR[f.tag] }}>{TAG_LABEL[f.tag]}</Text></Muted>
                </View>
                <Text style={{ color: colors.accent, fontWeight: '900' }}>{f.kcal} kcal</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function Fuel() {
  const g = useGame();
  const profile = g.profile!;
  const date = todayKey();
  const targets = computeTargets(profile);
  const t = totalsFor(g.foods, date);
  const water = g.water[date] ?? 0;
  const entries = g.foods.filter((f) => f.date === date).sort((a, b) => b.time - a.time);
  const impact = dietModifier(t, targets, profile.goal, true);
  const [open, setOpen] = useState(false);
  const remaining = targets.kcal - t.kcal;

  return (
    <Screen>
      <View>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900' }}>Fuel</Text>
        <Muted>What you eat today sets tomorrow's training intensity.</Muted>
      </View>

      <Panel title="Today" icon="fire" right={<Text style={{ color: remaining >= 0 ? colors.success : colors.danger, fontWeight: '900' }}>{remaining >= 0 ? `${remaining} kcal left` : `${-remaining} kcal over`}</Text>}>
        <View style={styles.between}>
          <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900' }}>{t.kcal}<Text style={{ color: colors.muted, fontSize: 16 }}> / {targets.kcal} kcal</Text></Text>
        </View>
        <ProgressBar value={t.kcal / targets.kcal} color={t.kcal > targets.kcal * 1.15 ? colors.danger : colors.accent} height={10} />
        <View style={[styles.row, { gap: 12 }]}>
          <MacroBar label="Protein" value={t.protein} target={targets.protein} unit="g" color={colors.success} />
          <MacroBar label="Carbs" value={t.carbs} target={targets.carbs} unit="g" color={colors.info} />
          <MacroBar label="Fat" value={t.fat} target={targets.fat} unit="g" color={colors.primary} />
        </View>
        <Button label="Log food" icon="plus" onPress={() => setOpen(true)} />
      </Panel>

      <Panel title="Impact on tomorrow" icon="speedometer" tone={impact.value > 0.1 ? 'danger' : impact.value < 0 ? 'accent' : 'success'}
        right={<Text style={{ color: impact.value > 0 ? colors.danger : impact.value < 0 ? colors.info : colors.success, fontWeight: '900', fontSize: 18 }}>{impact.value >= 0 ? '+' : ''}{Math.round(impact.value * 100)}%</Text>}>
        {impact.reasons.map((r) => (
          <Muted key={r} style={{ fontSize: 13 }}>• {r}</Muted>
        ))}
      </Panel>

      <Panel title="Water" icon="water" right={<Text style={{ color: colors.info, fontWeight: '900' }}>{(water / 1000).toFixed(2)} / {(targets.waterMl / 1000).toFixed(1)} L</Text>}>
        <ProgressBar value={water / targets.waterMl} color={colors.info} />
        <View style={[styles.row, { gap: 8 }]}>
          <Button small label="+250 ml" icon="cup-water" variant="ghost" onPress={() => g.addWater(250)} style={{ flex: 1 }} />
          <Button small label="+500 ml" icon="bottle-soda-outline" variant="ghost" onPress={() => g.addWater(500)} style={{ flex: 1 }} />
          <Button small label="−250" variant="ghost" onPress={() => g.addWater(-250)} />
        </View>
      </Panel>

      <Panel title="Food log" icon="notebook">
        {entries.length === 0 ? (
          <Empty icon="silverware-fork-knife" text="Nothing logged yet today." />
        ) : (
          entries.map((f) => (
            <View key={f.id} style={[styles.between, { paddingVertical: 4 }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{f.name}</Text>
                <Muted style={{ fontSize: 12 }}>
                  {new Date(f.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · P {f.protein}g · <Text style={{ color: TAG_COLOR[f.tag] }}>{TAG_LABEL[f.tag]}</Text>
                </Muted>
              </View>
              <Text style={{ color: colors.text, fontWeight: '800', marginRight: 10 }}>{f.kcal}</Text>
              <Pressable hitSlop={8} onPress={() => g.removeFood(f.id)}><Icon name="trash-can-outline" size={18} color={colors.muted} /></Pressable>
            </View>
          ))
        )}
      </Panel>

      <Panel title={`Meal plan · ${GOAL_LABEL[profile.goal]}`} icon="silverware-variant">
        <Muted style={{ fontSize: 12 }}>BMR {targets.bmr} · TDEE {targets.tdee} · target {targets.kcal} kcal</Muted>
        {mealPlan(profile.goal).map((m) => (
          <View key={m.meal} style={{ gap: 2, paddingVertical: 4 }}>
            <View style={styles.between}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{m.meal}</Text>
              <Text style={{ color: colors.accent, fontWeight: '800' }}>~{Math.round(targets.kcal * m.share)} kcal</Text>
            </View>
            <Muted style={{ fontSize: 13 }}>{m.ideas.join(' · ')}</Muted>
          </View>
        ))}
      </Panel>

      <AddFoodModal visible={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}
