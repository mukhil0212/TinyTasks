import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export const googleCalendarService = {
  async signIn() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return userInfo;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  },

  async addEventToCalendar(task: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  }) {
    try {
      const tokens = await GoogleSignin.getTokens();
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: task.name,
          description: task.description,
          start: {
            dateTime: task.startDate,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: task.endDate,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add event to Google Calendar');
      }

      const event = await response.json();
      return event.id;
    } catch (error) {
      console.error('Add to Calendar Error:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string) {
    try {
      const tokens = await GoogleSignin.getTokens();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event from Google Calendar');
      }
    } catch (error) {
      console.error('Delete Calendar Event Error:', error);
      throw error;
    }
  },
};
