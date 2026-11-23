import { Pressable, Text, View } from 'react-native';
import { Icon, Muted, Panel, Screen, styles } from '@/components/ui';
import { ACHIEVEMENTS } from '@/engine/achievements';
import { formatShort } from '@/engine/dates';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

export default function Achievements() {
  const unlocked = useGame((s) => s.achievements);
  const activeTitle = useGame((s) => s.activeTitle);
  const setTitle = useGame((s) => s.setTitle);
  const titles = ACHIEVEMENTS.filter((a) => a.title && unlocked[a.id]).map((a) => a.title!);
  const count = Object.keys(unlocked).length;

  return (
    <Screen edges={['bottom']}>
      <Panel title="Titles" icon="tag" right={<Muted style={{ fontSize: 12 }}>{titles.length} unlocked</Muted>}>
        {titles.length === 0 ? (
          <Muted>Earn achievements to unlock titles you can display under your name.</Muted>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[null, ...titles].map((t) => (
              <Pressable
                key={t ?? 'none'}
                onPress={() => setTitle(t)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: activeTitle === t ? colors.accent : colors.border, backgroundColor: activeTitle === t ? colors.accentSoft : colors.panelHi }}
              >
                <Text style={{ color: activeTitle === t ? colors.accent : colors.text, fontWeight: '800' }}>{t ?? 'None'}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Panel>

      <Panel title="Achievements" icon="trophy" right={<Muted style={{ fontSize: 12 }}>{count}/{ACHIEVEMENTS.length}</Muted>}>
        {ACHIEVEMENTS.map((a) => {
          const date = unlocked[a.id];
          return (
            <View key={a.id} style={[styles.row, { gap: 12, paddingVertical: 6, opacity: date ? 1 : 0.45 }]}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: date ? colors.accentSoft : colors.panelHi, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={date ? a.icon : 'lock'} color={date ? colors.accent : colors.faint} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{a.name}</Text>
                <Muted style={{ fontSize: 12 }}>{a.desc}{a.title ? ` · Title: “${a.title}”` : ''}</Muted>
              </View>
              {date && <Text style={{ color: colors.muted, fontSize: 11 }}>{formatShort(date)}</Text>}
            </View>
          );
        })}
      </Panel>
    </Screen>
  );
}
