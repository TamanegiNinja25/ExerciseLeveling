import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'daily-quest';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily quest reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Re-schedules the morning reminder and the evening deadline warning. */
export async function scheduleReminders(opts: {
  enabled: boolean;
  eveningWarning: boolean;
  hour: number;
  minute: number;
  name: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!opts.enabled || !(await ensurePermission())) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ Daily quest has arrived',
        body: `${opts.name}, today's training is ready. Check your intensity and clear it before midnight.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: opts.hour,
        minute: opts.minute,
        channelId: CHANNEL,
      },
    });

    if (opts.eveningWarning) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Quest deadline approaching',
          body: 'Unfinished daily quests at midnight trigger a penalty: XP loss and a harder tomorrow.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
          channelId: CHANNEL,
        },
      });
    }
  } catch (e) {
    console.warn('Failed to schedule reminders', e);
  }
}
