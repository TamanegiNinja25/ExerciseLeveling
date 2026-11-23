import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Button, Empty, Icon, Muted, Panel, Screen, Stepper, styles } from '@/components/ui';
import { EXERCISES, formatAmount } from '@/data/exercises';
import { formatShort } from '@/engine/dates';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

/** Copy picked images out of the purgeable cache into app documents. */
function persistImage(uri: string): string {
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, 'photos');
    dir.create({ idempotent: true });
    const dest = new File(dir, `victory_${Date.now()}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch (e) {
    console.warn('Could not persist photo, keeping original uri', e);
    return uri;
  }
}

export default function Progress() {
  const g = useGame();
  const latestWeight = g.weights[g.weights.length - 1]?.kg ?? g.profile!.weightKg;
  const [weight, setWeight] = useState(latestWeight);
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const pick = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.7 };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) {
      g.addPhoto(persistImage(res.assets[0].uri), note.trim());
      setNote('');
    }
  };

  const recent = g.weights.slice(-14);
  const min = Math.min(...recent.map((w) => w.kg)) - 1;
  const max = Math.max(...recent.map((w) => w.kg)) + 1;
  const first = g.weights[0]?.kg;
  const delta = first !== undefined ? latestWeight - first : 0;
  const lifetime = EXERCISES.filter((e) => (g.lifetime[e.id] ?? 0) > 0).sort((a, b) => (g.lifetime[b.id] ?? 0) - (g.lifetime[a.id] ?? 0));
  const photo = g.photos.find((p) => p.id === selected);

  return (
    <Screen edges={['bottom']}>
      <Panel title="Victory photos" icon="camera" right={<Muted style={{ fontSize: 12 }}>{g.photos.length} saved</Muted>}>
        <TextInput style={styles.input} placeholder="Caption (optional)" placeholderTextColor={colors.faint} value={note} onChangeText={setNote} maxLength={60} />
        <View style={[styles.row, { gap: 8 }]}>
          {Platform.OS !== 'web' && <Button label="Camera" icon="camera" onPress={() => pick(true)} style={{ flex: 1 }} />}
          <Button label="Gallery" icon="image" variant="ghost" onPress={() => pick(false)} style={{ flex: 1 }} />
        </View>
        {photo && (
          <View style={{ gap: 6 }}>
            <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12 }} />
            <View style={styles.between}>
              <Muted>{formatShort(photo.date)} · Lv. {photo.level}{photo.note ? ` · ${photo.note}` : ''}</Muted>
              <Pressable onPress={() => { g.removePhoto(photo.id); setSelected(null); }}><Icon name="trash-can-outline" color={colors.danger} /></Pressable>
            </View>
          </View>
        )}
        {g.photos.length === 0 ? (
          <Empty icon="image-filter-hdr" text="Save a photo after a tough session to track your transformation." />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {g.photos.map((p) => (
              <Pressable key={p.id} onPress={() => setSelected(selected === p.id ? null : p.id)} style={{ width: '31.5%' }}>
                <Image source={{ uri: p.uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 8, borderWidth: selected === p.id ? 2 : 0, borderColor: colors.primary }} />
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{formatShort(p.date)} · Lv{p.level}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Panel>

      <Panel title="Body weight" icon="scale-bathroom" right={<Text style={{ color: delta <= 0 ? colors.success : colors.accent, fontWeight: '900' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)} kg</Text>}>
        <View style={styles.between}>
          <Stepper value={weight} step={0.1} min={30} onChange={setWeight} format={(v) => `${v.toFixed(1)} kg`} />
          <Button small label="Log today" icon="check" onPress={() => g.logWeight(Math.round(weight * 10) / 10)} />
        </View>
        {recent.length > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, marginTop: 6 }}>
            {recent.map((w) => (
              <View key={w.date} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                <Text style={{ color: colors.muted, fontSize: 8 }}>{w.kg.toFixed(1)}</Text>
                <View style={{ width: '100%', height: ((w.kg - min) / (max - min)) * 70 + 4, backgroundColor: colors.primary, borderRadius: 3 }} />
                <Text style={{ color: colors.faint, fontSize: 8 }}>{w.date.slice(5)}</Text>
              </View>
            ))}
          </View>
        )}
        <Muted style={{ fontSize: 12 }}>Logging weight also updates your calorie targets.</Muted>
      </Panel>

      <Panel title="Lifetime totals" icon="sigma">
        {lifetime.length === 0 ? (
          <Muted>Complete quests and workouts to build up your totals.</Muted>
        ) : (
          lifetime.map((e) => (
            <View key={e.id} style={styles.between}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{e.name}</Text>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{formatAmount(Math.round((g.lifetime[e.id] ?? 0) * 10) / 10, e.unit)}</Text>
            </View>
          ))
        )}
      </Panel>
    </Screen>
  );
}
