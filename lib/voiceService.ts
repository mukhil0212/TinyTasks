import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_URL = 'http://10.0.0.66:3001/api';

interface TaskDetails {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  groupId?: string;
  groupName?: string;
}

interface SubTask {
  name: string;
  description?: string;
}

class VoiceService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  constructor() {
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.processVoiceRecording = this.processVoiceRecording.bind(this);
    this.createTaskFromText = this.createTaskFromText.bind(this);
    this.splitTaskIntoSubtasks = this.splitTaskIntoSubtasks.bind(this);
  }

  async startRecording(): Promise<void> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      this.isRecording = true;
    } catch (err) {
      console.error('Failed to start recording', err);
      throw err;
    }
  }

  async stopRecording(): Promise<string> {
    try {
      if (!this.recording) {
        throw new Error('Not recording');
      }

      console.log('Stopping recording..');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;

      if (!uri) {
        throw new Error('Recording failed: no audio file created');
      }

      console.log('Recording stopped and saved at', uri);
      return uri;
    } catch (error: unknown) {
      console.error('Failed to stop recording', error);
      this.recording = null;
      this.isRecording = false;
      const message = error instanceof Error ? error.message : 'Failed to stop recording';
      throw new Error(message);
    }
  }

  async processVoiceRecording(uri: string): Promise<TaskDetails> {
    try {
      // Check if the audio file exists
      const audioInfo = await FileSystem.getInfoAsync(uri);
      if (!audioInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);

      // Create form data
      const formData = new FormData();

      // Create file object
      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      const file = {
        uri: fileUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      };

      // Append file to form data
      formData.append('audio', file as any);

      console.log('File object:', file);

      console.log('Sending request to:', `${API_URL}/tasks/create-from-voice`);

      // Log request details
      console.log('Request URL:', `${API_URL}/tasks/create-from-voice`);
      console.log('Form data entries:', Array.from(formData.entries()));

      // Send to backend
      const response = await fetch(`${API_URL}/tasks/create-from-voice`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        },
      });

      // Log response
      console.log('Response status:', response.status);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        console.log('Server error response:', responseData);
        throw new Error(responseData.error || 'Failed to process voice recording');
      }

      if (!responseData.task || typeof responseData.task !== 'object' || !responseData.task.name) {
        throw new Error('Invalid task data received from server');
      }

      return responseData.task as TaskDetails;

    } catch (error: unknown) {
      console.error('Failed to process voice recording:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new Error(`Failed to process voice recording: ${message}`);
    }
  }

  async createTaskFromText(text: string): Promise<TaskDetails> {
    try {
      const response = await fetch(`${API_URL}/tasks/create-from-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const responseData = await response.json();
      console.log('Text response data:', responseData);

      if (!response.ok) {
        console.log('Server error response:', responseData);
        throw new Error(responseData.error || 'Failed to process text input');
      }

      if (!responseData.task || typeof responseData.task !== 'object' || !responseData.task.name) {
        throw new Error('Invalid task data received from server');
      }

      return responseData.task as TaskDetails;
    } catch (error: unknown) {
      console.error('Failed to process text input:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new Error(`Failed to process text input: ${message}`);
    }
  }

  async splitTaskIntoSubtasks(task: { name: string; description?: string }): Promise<SubTask[]> {
    try {
      const response = await fetch(`${API_URL}/tasks/split-subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ task })
      });

      const responseData = await response.json();
      console.log('Split task response:', responseData);

      if (!response.ok) {
        console.log('Server error response:', responseData);
        throw new Error(responseData.error || 'Failed to split task');
      }

      if (!responseData.subtasks || !Array.isArray(responseData.subtasks)) {
        throw new Error('Invalid subtasks data received from server');
      }

      return responseData.subtasks as SubTask[];
    } catch (error: unknown) {
      console.error('Failed to split task:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new Error(`Failed to split task: ${message}`);
    }
  }

  // Generate a random funny notification message
  private generateFunnyMessage(userName: string, taskName: string): string {
    const funnyMessages = [
      `Hey ${userName}, don't forget about your task: ${taskName}!`,
      `${userName}! That ${taskName} isn't going to complete itself, you know!`,
      `Knock knock, ${userName}! Time to work on ${taskName}.`,
      `${userName}, I hate to be the bearer of bad news, but ${taskName} is waiting for you!`,
      `${userName}, if ${taskName} was a pizza, it would be getting cold by now!`,
      `Hey ${userName}, remember that thing called ${taskName}? Yeah, it misses you.`,
      `${userName}, your ${taskName} is giving me the side-eye. Better get to it!`,
      `${userName}, I'm not saying ${taskName} is important, but... actually, yes I am.`,
      `Attention ${userName}! Mission ${taskName} awaits your expertise!`,
      `${userName}, procrastination called. It said even it thinks you should start ${taskName} now.`,
      `${userName}, your ${taskName} is feeling neglected. Time to show it some love!`,
      `Ahem, ${userName}! The clock is ticking on ${taskName}. Just saying...`,
      `${userName}, I've been told ${taskName} is getting impatient waiting for you.`,
      `Hey ${userName}! ${taskName} called and said it misses your attention.`,
      `${userName}, if ${taskName} had feelings, it would be feeling abandoned right now.`,
      `Excuse me, ${userName}? Yes, it's me, your friendly reminder about ${taskName}.`,
      `${userName}, let's make a deal: you complete ${taskName}, and I'll stop bothering you about it.`,
      `Breaking news, ${userName}! ${taskName} still needs to be done. Shocking, I know.`,
      `${userName}, I don't mean to nag, but... ${taskName}. That's it. That's the reminder.`,
      `${userName}, remember when you said you'd do ${taskName}? Pepperidge Farm remembers.`
    ];
    const randomIndex = Math.floor(Math.random() * funnyMessages.length);
    return funnyMessages[randomIndex];
  }

  async generatePersonalizedNotification(params: {
    taskName: string;
    userName: string;
    dueDate?: Date;
  }): Promise<string> {
    // Simply return a random funny message from our collection
    return this.generateFunnyMessage(params.userName, params.taskName);
  }
}

export const voiceService = new VoiceService();
