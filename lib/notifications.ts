import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleTaskReminder(task: {
    id: string;
    name: string;
    description?: string;
    remindAt: Date;
  }) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${task.name}`,
          body: task.description || 'Your task is due soon!',
          data: { taskId: task.id },
        },
        trigger: {
          date: task.remindAt,
          channelId: 'task-reminders',
        },
      });
      return identifier;
    } catch (error) {
      console.error('Schedule Reminder Error:', error);
      throw error;
    }
  },

  async cancelReminder(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Cancel Reminder Error:', error);
      throw error;
    }
  },

  async setupNotificationChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    }
  },
};
