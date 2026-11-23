import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { msUntilMidnight } from '@/engine/dates';
import { scheduleReminders } from '@/notifications';
import { useGame, waitForHydration } from '@/store/useGame';
import { colors } from '@/theme';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, text: colors.text, border: colors.border, primary: colors.primary },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  // Load persisted state, then close out any days that ended while the app was away.
  useEffect(() => {
    waitForHydration().then(() => {
      useGame.getState().runRollover();
      setReady(true);
    });
  }, []);

  // Re-evaluate when returning to the foreground and exactly at midnight.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') useGame.getState().runRollover();
    });
    let timer: ReturnType<typeof setTimeout>;
    const armMidnight = () => {
      timer = setTimeout(() => {
        useGame.getState().runRollover();
        armMidnight();
      }, msUntilMidnight() + 1000);
    };
    armMidnight();
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [ready]);

  // Keep scheduled reminders in sync with profile + settings.
  const profile = useGame((s) => s.profile);
  const settings = useGame((s) => s.settings);
  useEffect(() => {
    if (!ready || !profile) return;
    void scheduleReminders({
      enabled: settings.notifications,
      eveningWarning: settings.eveningWarning,
      hour: profile.reminderHour,
      minute: profile.reminderMinute,
      name: profile.name,
    });
  }, [ready, profile?.reminderHour, profile?.reminderMinute, profile?.name, settings.notifications, settings.eveningWarning]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
        <Stack.Screen name="day/[date]" options={{ title: 'Day Report' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress' }} />
        <Stack.Screen name="achievements" options={{ title: 'Achievements & Titles' }} />
        <Stack.Screen name="settings" options={{ title: 'Profile & Settings' }} />
        <Stack.Screen name="messages" options={{ title: 'System Log' }} />
      </Stack>
    </ThemeProvider>
  );
}
