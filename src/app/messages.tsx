import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Empty, Icon, Muted, Screen, styles } from '@/components/ui';
import { formatShort } from '@/engine/dates';
import type { MessageKind } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

const KIND: Record<MessageKind, { icon: string; color: string }> = {
  levelup: { icon: 'arrow-up-bold-circle', color: colors.accent },
  rank: { icon: 'chevron-triple-up', color: colors.danger },
  penalty: { icon: 'skull-crossbones', color: colors.danger },
  quest: { icon: 'sword-cross', color: colors.success },
  achievement: { icon: 'trophy', color: colors.accent },
  info: { icon: 'information', color: colors.info },
};

export default function Messages() {
  const messages = useGame((s) => s.messages);
  const markRead = useGame((s) => s.markMessagesRead);

  // Mark as read when leaving, so unread items stay highlighted while viewing.
  useEffect(() => () => markRead(), [markRead]);

  return (
    <Screen edges={['bottom']}>
      {messages.length === 0 && <Empty icon="bell-sleep" text="No system messages yet." />}
      {messages.map((m) => (
        <View key={m.id} style={[styles.row, { gap: 12, backgroundColor: colors.panel, borderRadius: 12, borderWidth: 1, borderColor: m.read ? colors.border : KIND[m.kind].color, padding: 12 }]}>
          <Icon name={KIND[m.kind].icon} color={KIND[m.kind].color} size={24} />
          <View style={{ flex: 1 }}>
            <View style={styles.between}>
              <Text style={{ color: colors.text, fontWeight: '900', flex: 1 }}>{m.title}</Text>
              <Text style={{ color: colors.faint, fontSize: 11 }}>{formatShort(m.date)}</Text>
            </View>
            <Muted style={{ fontSize: 13 }}>{m.body}</Muted>
          </View>
        </View>
      ))}
    </Screen>
  );
}
