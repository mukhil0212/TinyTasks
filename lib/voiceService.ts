import { Audio } from 'expo-av';
import Groq from 'groq';
import * as FileSystem from 'expo-file-system';

const transcriptionModel = 'whisper-large-v3-turbo'; // Best price/performance for multilingual
const chatModel = 'mixtral-8x7b-32768';

const groqClient = new Groq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
});

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

  constructor() {
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.transcribeAudio = this.transcribeAudio.bind(this);
    this.extractTaskDetails = this.extractTaskDetails.bind(this);
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
    } catch (err) {
      console.error('Failed to start recording', err);
      throw err;
    }
  }

  async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      if (!uri) throw new Error('No recording URI available');
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      throw err;
    }
  }

  async transcribeAudio(uri: string): Promise<string> {
    try {
      const audioFile = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const binaryString = atob(audioFile);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/m4a' });
      const file = new File([blob], 'recording.m4a', { type: 'audio/m4a' });

      const response = await groqClient.audio.transcriptions.create({
        file,
        model: transcriptionModel,
        language: 'en', // Improves accuracy and latency
        response_format: 'verbose_json',
        temperature: 0, // Best for transcription accuracy
        prompt: 'This is a voice recording for creating a task. The task may include a title, description, dates, and category.',
      });

      // Check transcription quality
      const segments = response.segments || [];
      for (const segment of segments) {
        if (segment.avg_logprob < -0.5) {
          console.warn('Low confidence in transcription segment:', segment);
        }
        if (segment.no_speech_prob > 0.8) {
          console.warn('Possible non-speech segment detected:', segment);
        }
      }

      return response.text;
    } catch (err) {
      console.error('Failed to transcribe audio', err);
      throw err;
    }
  }

  async extractTaskDetails(text: string): Promise<TaskDetails> {
    try {
      const response = await groqClient.chat.completions.create({
        model: chatModel,
        messages: [
          {
            role: 'system',
            content: 'Extract task details from the transcribed text. Return a JSON object with: name (required), description (optional), startDate (optional, ISO string), endDate (optional, ISO string), groupId (optional), and groupName (optional).'
          },
          {
            role: 'user',
            content: text
          }
        ]
      });

      const taskDetails = JSON.parse(response.choices[0].message.content || '{}');
      return taskDetails;
    } catch (err) {
      console.error('Failed to extract task details', err);
      throw err;
    }
  }
}

export const voiceService = new VoiceService();
