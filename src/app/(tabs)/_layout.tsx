import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Icon } from '@/components/ui';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

export default function TabLayout() {
  const onboarded = useGame((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
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
  );
}
