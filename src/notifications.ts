import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function requestNotificationPermission() {
  if (!Device.isDevice) {
    return { granted: false, warning: 'Notifications require a real device.' };
  }

  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.AuthorizationStatus.PROVISIONAL) {
    return { granted: true }; 
  }

  const permission = await Notifications.requestPermissionsAsync({
    ios: { allowsAlert: true, allowsSound: true, allowsBadge: true },
  });

  return { granted: permission.granted ?? false };
}

export async function scheduleNotification(
  taskId: string,
  title: string,
  body: string,
  triggerDate: Date,
  isAlarm = false
) {
  const trigger = {
    date: triggerDate,
  } as any;

  const content = {
    title,
    body,
    sound: isAlarm ? 'default' : 'default',
    priority: isAlarm ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
    categoryIdentifier: 'TASK_ACTIONS',
    data: { taskId, actionType: 'default' },
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content,
    trigger,
  });

  return notificationId;
}

export async function cancelNotifications(notificationIds: string[]) {
  await Promise.all(notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export function buildNotificationSchedule(
  dueAtUtc: string,
  timezone: string,
  template: CategoryTemplate
) {
  const dueDate = new Date(dueAtUtc);
  const schedule = [] as { notificationId?: string; type: 'alarm' | 'notification'; triggerAtUtc: Date }[];

  template.alarmOffsets?.forEach((minutes) => {
    schedule.push({
      type: 'alarm',
      triggerAtUtc: new Date(dueDate.getTime() - minutes * 60000),
    });
  });

  template.notificationOffsets?.forEach((minutes) => {
    schedule.push({
      type: 'notification',
      triggerAtUtc: new Date(dueDate.getTime() - minutes * 60000),
    });
  });

  return schedule
    .filter((item) => item.triggerAtUtc.getTime() > Date.now())
    .sort((a, b) => a.triggerAtUtc.getTime() - b.triggerAtUtc.getTime());
}
