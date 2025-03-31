import * as Crypto from 'expo-crypto';

interface NylasCalendar {
  id: string;
  name: string;
  isPrimary: boolean;
}

interface NylasEvent {
  id: string;
  title: string;
  description?: string;
  when: {
    start_time: number;
    end_time: number;
  };
  calendar_id: string;
}

const NYLAS_API_URL = 'https://api.nylas.com';

export const nylasCalendarService = {
  async authorize(emailAddress: string) {
    try {
      const state = await Crypto.randomUUID();
      const params = new URLSearchParams({
        client_id: process.env.EXPO_PUBLIC_NYLAS_CLIENT_ID as string,
        response_type: 'code',
        redirect_uri: process.env.EXPO_PUBLIC_NYLAS_REDIRECT_URI as string,
        scope: 'calendar',
        login_hint: emailAddress,
        state,
      });
      
      return `${NYLAS_API_URL}/oauth/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Nylas Authorization Error:', error);
      throw error;
    }
  },

  async addEventToCalendar(task: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  }, accessToken: string) {
    try {
      const calendarId = await this.getPrimaryCalendarId(accessToken);
      const response = await fetch(`${NYLAS_API_URL}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': '*',
        },
        mode: 'cors',
        body: JSON.stringify({
          calendar_id: calendarId,
          when: {
            start_time: Math.floor(new Date(task.startDate).getTime() / 1000),
            end_time: Math.floor(new Date(task.endDate).getTime() / 1000),
          },
          title: task.name,
          description: task.description || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      const event: NylasEvent = await response.json();
      return event.id;
    } catch (error) {
      console.error('Add to Calendar Error:', error);
      throw error;
    }
  },

  async deleteEvent(eventId: string, accessToken: string) {
    try {
      const response = await fetch(`${NYLAS_API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Origin': '*',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Delete Calendar Event Error:', error);
      throw error;
    }
  },

  async getPrimaryCalendarId(accessToken: string): Promise<string> {
    try {
      const response = await fetch(`${NYLAS_API_URL}/calendars`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Origin': '*',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.statusText}`);
      }

      const calendars = await response.json();
      const primaryCalendar = calendars.find((cal: NylasCalendar) => cal.isPrimary);
      
      if (!primaryCalendar) {
        throw new Error('No primary calendar found');
      }

      return primaryCalendar.id;
    } catch (error) {
      console.error('Get Primary Calendar Error:', error);
      throw error;
    }
  },

  async exchangeCodeForToken(code: string) {
    try {
      const response = await fetch(`${NYLAS_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': '*',
        },
        mode: 'cors',
        body: JSON.stringify({
          client_id: process.env.EXPO_PUBLIC_NYLAS_CLIENT_ID,
          client_secret: process.env.EXPO_PUBLIC_NYLAS_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: process.env.EXPO_PUBLIC_NYLAS_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to exchange code: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token Exchange Error:', error);
      throw error;
    }
  }
};
