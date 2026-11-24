import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { FlameBurst } from '@/components/Flame';
import { Icon } from '@/components/ui';
import type { MessageKind, SystemMessage } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

/** Moments worth a full-screen flame burst, highest priority first. */
const CELEBRATE: Partial<Record<MessageKind, number>> = { rank: 3, levelup: 2, clear: 1 };

const BURST_COPY: Record<string, (m: SystemMessage, level: number) => { title: string; subtitle: string }> = {
  rank: (m) => ({ title: 'RANK UP', subtitle: m.title.replace(/^RANK UP:\s*/, '') + ' unlocked' }),
  levelup: (m, level) => ({ title: 'LEVEL UP', subtitle: `Level ${level} · ${m.body}` }),
  clear: (m) => ({ title: 'QUEST CLEARED', subtitle: m.body }),
};

/** Watches for messages that arrive while the app is open (not ones from launch). */
function useCelebration() {
  const messages = useGame((s) => s.messages);
  const seen = useRef<string | null>(messages[0]?.id ?? null);
  const [burst, setBurst] = useState<SystemMessage | null>(null);

  useEffect(() => {
    const idx = seen.current ? messages.findIndex((m) => m.id === seen.current) : messages.length;
    const fresh = messages.slice(0, idx === -1 ? messages.length : idx);
    seen.current = messages[0]?.id ?? null;
    const best = fresh
      .filter((m) => CELEBRATE[m.kind])
      .sort((a, b) => CELEBRATE[b.kind]! - CELEBRATE[a.kind]!)[0];
    if (best) setBurst(best);
  }, [messages]);

  return [burst, () => setBurst(null)] as const;
}

export default function TabLayout() {
  const onboarded = useGame((s) => s.onboarded);
  const level = useGame((s) => s.level);
  const [burst, clearBurst] = useCelebration();
  if (!onboarded) return <Redirect href="/onboarding" />;

  const copy = burst ? BURST_COPY[burst.kind](burst, level) : null;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.faint,
          tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
          tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Status', tabBarIcon: ({ color }) => <Icon name="shield-account" color={color as string} size={24} /> }} />
        <Tabs.Screen name="quest" options={{ title: 'Quest', tabBarIcon: ({ color }) => <Icon name="sword-cross" color={color as string} size={24} /> }} />
        <Tabs.Screen name="train" options={{ title: 'Train', tabBarIcon: ({ color }) => <Icon name="dumbbell" color={color as string} size={24} /> }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <Icon name="calendar-month" color={color as string} size={24} /> }} />
        <Tabs.Screen name="fuel" options={{ title: 'Fuel', tabBarIcon: ({ color }) => <Icon name="food-apple" color={color as string} size={24} /> }} />
      </Tabs>
      {burst && copy && <FlameBurst key={burst.id} title={copy.title} subtitle={copy.subtitle} onDone={clearBurst} />}
    </View>
  );
}
