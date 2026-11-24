import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Avatar, Button, Chip, Icon, Label, Muted, Panel, Screen, Stepper, styles } from '@/components/ui';
import { WEEKDAY_SHORT } from '@/engine/dates';
import { rankForLevel } from '@/engine/leveling';
import { GOAL_LABEL } from '@/engine/nutrition';
import type { Activity, Equipment, FitnessLevel, Goal } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { AVATAR_COLORS, colors, EMBLEMS } from '@/theme';

const FITNESS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];
const EQUIP: { v: Equipment; label: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'dumbbells', label: 'Dumbbells' },
  { v: 'gym', label: 'Gym' },
];
const ACTIVITY: { v: Activity; label: string }[] = [
  { v: 'sedentary', label: 'Sedentary' },
  { v: 'light', label: 'Light' },
  { v: 'moderate', label: 'Moderate' },
  { v: 'active', label: 'Active' },
  { v: 'very_active', label: 'Very active' },
];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.between}>
      <Text style={styles.text}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" />
    </View>
  );
}

export default function Settings() {
  const g = useGame();
  const p = g.profile!;
  const [name, setName] = useState(p.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const rank = rankForLevel(g.level);

  return (
    <Screen edges={['bottom']}>
      <Panel title="Avatar" icon="account-edit">
        <View style={{ alignItems: 'center' }}>
          <Avatar color={g.avatar.color} emblem={g.avatar.emblem} rank={rank} size={96} />
        </View>
        <Label>Color</Label>
        <View style={[styles.row, { gap: 10, flexWrap: 'wrap' }]}>
          {AVATAR_COLORS.map((c) => (
            <Pressable key={c} onPress={() => g.setAvatar({ color: c })} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: 3, borderColor: g.avatar.color === c ? colors.text : 'transparent' }} />
          ))}
        </View>
        <Label>Emblem (more unlock as you level)</Label>
        <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
          {EMBLEMS.map((e) => {
            const locked = g.level < e.level;
            const active = g.avatar.emblem === e.icon;
            return (
              <Pressable
                key={e.icon}
                disabled={locked}
                onPress={() => g.setAvatar({ emblem: e.icon })}
                style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.primarySoft : colors.panelHi, borderWidth: 1, borderColor: active ? colors.primary : colors.border, opacity: locked ? 0.4 : 1 }}
              >
                <Icon name={locked ? 'lock' : e.icon} color={active ? colors.primary : colors.text} size={22} />
                {locked && <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '800' }}>Lv{e.level}</Text>}
              </Pressable>
            );
          })}
        </View>
      </Panel>

      <Panel title="Profile" icon="account">
        <Label>Name</Label>
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} maxLength={20} />
          <Button small label="Save" disabled={!name.trim() || name.trim() === p.name} onPress={() => g.updateProfile({ name: name.trim() })} />
        </View>
        <View style={styles.between}><Label>Age</Label><Stepper value={p.age} min={13} onChange={(v) => g.updateProfile({ age: v })} /></View>
        <View style={styles.between}><Label>Height</Label><Stepper value={p.heightCm} min={120} onChange={(v) => g.updateProfile({ heightCm: v })} format={(v) => `${v} cm`} /></View>
        <View style={styles.between}><Label>Weight</Label><Stepper value={p.weightKg} min={30} step={0.5} onChange={(v) => g.updateProfile({ weightKg: v })} format={(v) => `${v} kg`} /></View>
        <Label>Fitness level</Label>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          {FITNESS.map((f) => <Chip key={f} label={cap(f)} active={p.fitness === f} onPress={() => g.updateProfile({ fitness: f })} />)}
        </View>
        <Label>Goal</Label>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          {(Object.keys(GOAL_LABEL) as Goal[]).map((k) => <Chip key={k} label={GOAL_LABEL[k]} active={p.goal === k} onPress={() => g.updateProfile({ goal: k })} />)}
        </View>
        <Label>Activity</Label>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          {ACTIVITY.map((a) => <Chip key={a.v} label={a.label} active={p.activity === a.v} onPress={() => g.updateProfile({ activity: a.v })} />)}
        </View>
        <Label>Equipment</Label>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          {EQUIP.map((e) => <Chip key={e.v} label={e.label} active={p.equipment === e.v} onPress={() => g.updateProfile({ equipment: e.v })} />)}
        </View>
        <Label>Recovery days</Label>
        <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
          {WEEKDAY_SHORT.map((d, i) => (
            <Chip key={d} label={d} color={colors.info} active={p.restDays.includes(i)}
              onPress={() => g.updateProfile({ restDays: p.restDays.includes(i) ? p.restDays.filter((x) => x !== i) : [...p.restDays, i] })} />
          ))}
        </View>
        <Muted style={{ fontSize: 12 }}>Changes re-plan today's quest only if you haven't started it.</Muted>
      </Panel>

      <Panel title="Reminders & feel" icon="bell-ring">
        <Toggle label="Daily quest reminder" value={g.settings.notifications} onChange={(v) => g.updateSettings({ notifications: v })} />
        <View style={styles.between}>
          <Label>Time</Label>
          <View style={[styles.row, { gap: 6 }]}>
            <Stepper value={p.reminderHour} onChange={(v) => g.updateProfile({ reminderHour: v % 24 })} format={(v) => `${String(v).padStart(2, '0')}h`} />
            <Stepper value={p.reminderMinute} step={15} onChange={(v) => g.updateProfile({ reminderMinute: v % 60 })} format={(v) => `${String(v).padStart(2, '0')}m`} />
          </View>
        </View>
        <Toggle label="9 PM deadline warning" value={g.settings.eveningWarning} onChange={(v) => g.updateSettings({ eveningWarning: v })} />
        <Toggle label="Haptic feedback" value={g.settings.haptics} onChange={(v) => g.updateSettings({ haptics: v })} />
        <Toggle label="Blue-flame visual effects" value={g.settings.effects !== false} onChange={(v) => g.updateSettings({ effects: v })} />
      </Panel>

      <Panel title="Danger zone" icon="alert" tone="danger">
        <Muted>Erase all progress, history, photos and settings. This cannot be undone.</Muted>
        {confirmReset ? (
          <View style={[styles.row, { gap: 8 }]}>
            <Button label="Cancel" variant="ghost" onPress={() => setConfirmReset(false)} style={{ flex: 1 }} />
            <Button label="Erase everything" variant="danger" onPress={() => { g.resetAll(); router.replace('/onboarding'); }} style={{ flex: 1 }} />
          </View>
        ) : (
          <Button label="Reset all data" icon="delete-forever" variant="danger" onPress={() => setConfirmReset(true)} />
        )}
      </Panel>

      <Muted style={{ textAlign: 'center', fontSize: 12 }}>Exercise Leveling v{Constants.expoConfig?.version ?? '1.0.0'}</Muted>
    </Screen>
  );
}
