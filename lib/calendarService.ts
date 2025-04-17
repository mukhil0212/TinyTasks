import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Task } from '../types/task';
import { supabase } from './supabase';

class CalendarService {
  private calendarId: string | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the calendar service
   * Request permissions and get or create the app's calendar
   */
  async initialize(): Promise<boolean> {
    try {
      // Request calendar permissions
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        console.log('Calendar permission not granted');
        return false;
      }

      try {
        // Get the calendar ID (create if it doesn't exist)
        this.calendarId = await this.getOrCreateCalendar();
        this.isInitialized = true;
        return true;
      } catch (calendarError) {
        console.error('Error getting or creating calendar:', calendarError);
        // If we can't create a calendar, we'll still mark as initialized but with no calendar
        this.isInitialized = true;
        this.calendarId = null;
        return false;
      }
    } catch (error) {
      console.error('Error initializing calendar service:', error);
      return false;
    }
  }

  /**
   * Get the app's calendar or create it if it doesn't exist
   */
  private async getOrCreateCalendar(): Promise<string> {
    try {
      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Look for our app's calendar
      const appCalendar = calendars.find(
        calendar => calendar.title === 'TinyTasks' && calendar.source.name === 'TinyTasks'
      );

      // If it exists, return its ID
      if (appCalendar) {
        return appCalendar.id;
      }

      // Otherwise, create a new calendar
      const newCalendarId = await this.createCalendar();
      return newCalendarId;
    } catch (error) {
      console.error('Error getting or creating calendar:', error);
      throw error;
    }
  }

  /**
   * Create a new calendar for the app
   */
  private async createCalendar(): Promise<string> {
    try {
      // Get available calendar sources
      const sources = await Calendar.getSourcesAsync();
      if (!sources || sources.length === 0) {
        throw new Error('No calendar sources available');
      }

      // Find a suitable source (prefer the default source)
      let calendarSource = sources.find(source => source.name === 'Default');

      // If no default source, use the first available source
      if (!calendarSource) {
        calendarSource = sources[0];
      }

      if (!calendarSource) {
        throw new Error('No suitable calendar source found');
      }

      // Create a new calendar with the selected source
      const newCalendarID = await Calendar.createCalendarAsync({
        title: 'TinyTasks',
        color: '#7C3AED',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: calendarSource.id,
        name: 'TinyTasks',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      return newCalendarID;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event for a task
   */
  async createEventForTask(task: Task): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    // If we don't have a calendar ID, we can't create events
    if (!this.calendarId) {
      console.log('No calendar available for creating events');
      return null;
    }

    try {
      // Create start and end dates
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date || task.start_date);

      // Create the event
      const eventId = await Calendar.createEventAsync(this.calendarId, {
        title: task.name,
        notes: task.description,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        alarms: [{ relativeOffset: -30 }], // 30 minutes before
      });

      // Update the task with the calendar event ID
      await supabase
        .from('tasks')
        .update({ google_calendar_event_id: eventId })
        .eq('id', task.id);

      return eventId;
    } catch (error) {
      console.error('Error creating event for task:', error);
      return null;
    }
  }

  /**
   * Update a calendar event for a task
   */
  async updateEventForTask(task: Task): Promise<boolean> {
    if (!task.google_calendar_event_id) return false;

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    // If we don't have a calendar ID, we can't update events
    if (!this.calendarId) {
      console.log('No calendar available for updating events');
      return false;
    }

    try {
      // Create start and end dates
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.end_date || task.start_date);

      // Update the event
      await Calendar.updateEventAsync(task.google_calendar_event_id, {
        title: task.name,
        notes: task.description,
        startDate,
        endDate,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return true;
    } catch (error) {
      console.error('Error updating event for task:', error);

      // If the event doesn't exist anymore, clear the reference in our database
      if (error.message && (error.message.includes('No event found') || error.message.includes('not found'))) {
        try {
          await supabase
            .from('tasks')
            .update({ google_calendar_event_id: null })
            .eq('id', task.id);
        } catch (dbError) {
          console.error('Error clearing event ID from task:', dbError);
        }
      }

      return false;
    }
  }

  /**
   * Delete a calendar event for a task
   */
  async deleteEventForTask(task: Task): Promise<boolean> {
    if (!task.google_calendar_event_id) return false;

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    // If we don't have a calendar ID, we can't delete events
    if (!this.calendarId) {
      console.log('No calendar available for deleting events');
      return false;
    }

    try {
      // Delete the event
      await Calendar.deleteEventAsync(task.google_calendar_event_id);

      // Clear the event ID from the task
      try {
        await supabase
          .from('tasks')
          .update({ google_calendar_event_id: null })
          .eq('id', task.id);
      } catch (dbError) {
        console.error('Error clearing event ID from task:', dbError);
      }

      return true;
    } catch (error) {
      console.error('Error deleting event for task:', error);

      // If the event doesn't exist anymore, still clear the reference in our database
      if (error.message && (error.message.includes('No event found') || error.message.includes('not found'))) {
        try {
          await supabase
            .from('tasks')
            .update({ google_calendar_event_id: null })
            .eq('id', task.id);
        } catch (dbError) {
          console.error('Error clearing event ID from task:', dbError);
        }
      }

      return false;
    }
  }

  /**
   * Sync all tasks with the calendar
   */
  async syncAllTasks(userId: string): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return;
    }

    // If we don't have a calendar ID, we can't sync tasks
    if (!this.calendarId) {
      console.log('No calendar available for syncing tasks');
      return;
    }

    try {
      // Get all tasks
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .is('parent_id', null) // Only sync parent tasks
        .eq('completed', false); // Only sync incomplete tasks

      if (error) throw error;
      if (!tasks || tasks.length === 0) return;

      console.log(`Syncing ${tasks.length} tasks with calendar`);

      // Sync each task
      for (const task of tasks) {
        try {
          if (task.google_calendar_event_id) {
            // Update existing event
            await this.updateEventForTask(task);
          } else {
            // Create new event
            await this.createEventForTask(task);
          }
        } catch (taskError) {
          console.error(`Error syncing task ${task.id}:`, taskError);
          // Continue with other tasks even if one fails
        }
      }

      console.log('Calendar sync completed successfully');
    } catch (error) {
      console.error('Error syncing all tasks:', error);
    }
  }
}

export const calendarService = new CalendarService();
