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

class VoiceService {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;

  constructor() {
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.processVoiceRecording = this.processVoiceRecording.bind(this);
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
}

export const voiceService = new VoiceService();
