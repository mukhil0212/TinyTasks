import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { voiceService } from './voiceService';

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

  /**
   * Test notification with personalized message
   * This will schedule a notification to be delivered in the specified number of seconds
   */
  async scheduleTestNotification(params: {
    userName: string;
    delaySeconds?: number;
  }) {
    try {
      // Default to 5 seconds if not specified
      const delaySeconds = params.delaySeconds || 5;
      const testTask = {
        id: 'test-notification',
        name: 'Test Task',
        description: 'This is a test notification',
        remindAt: new Date(Date.now() + delaySeconds * 1000),
        userName: params.userName,
        dueDate: new Date(Date.now() + 3600 * 1000), // Due in 1 hour for testing
      };

      // Schedule the test notification
      const identifier = await this.scheduleTaskReminder(testTask);

      return {
        success: true,
        message: `Test notification scheduled for ${delaySeconds} seconds from now`,
        identifier
      };
    } catch (error: unknown) {
      console.error('Test Notification Error:', error);
      let errorMessage = 'Unknown error';

      // Check if error is an Error object
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      return {
        success: false,
        message: `Failed to schedule test notification: ${errorMessage}`
      };
    }
  },

  async scheduleTaskReminder(task: {
    id: string;
    name: string;
    description?: string;
    remindAt: Date;
    userName?: string;
    dueDate?: Date;
  }) {
    try {
      // Generate a personalized notification message if userName is provided
      let notificationBody = task.description || 'Your task is due soon!';

      if (task.userName) {
        try {
          // Get a personalized funny message
          const personalizedMessage = await voiceService.generatePersonalizedNotification({
            taskName: task.name,
            userName: task.userName,
            dueDate: task.dueDate
          });

          notificationBody = personalizedMessage;
          console.log(`Using personalized notification: ${notificationBody}`);
        } catch (error) {
          console.error('Error generating personalized notification:', error);
          // Fall back to the default message if something goes wrong
        }
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${task.name}`,
          body: notificationBody,
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
