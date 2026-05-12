import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { Audio } from 'expo-av';

export class SpeechService {
  private static isListening = false;

  static async initialize(): Promise<void> {
    console.log('[LEDGER_DEBUG] Initializing SpeechService...');
    const permission = await Audio.requestPermissionsAsync();
    console.log('[LEDGER_DEBUG] Microphone permission result:', permission.granted);

    if (!permission.granted) {
      throw new Error('Microphone permission denied');
    }

    const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    console.log('[LEDGER_DEBUG] Speech recognition available:', available);

    if (!available) {
      throw new Error('Speech recognition not available');
    }
  }

  static async startSpeechRecognition(
    onResult: (text: string) => void,
    onError: (err: any) => void
  ) {
    try {
      if (this.isListening) {
        console.log('[LEDGER_DEBUG] Already listening, skipping start...');
        return;
      }

      console.log('[LEDGER_DEBUG] Starting speech recognition...');
      this.isListening = true;

      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });

      ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
        const transcript = event.results
          ?.map((r: any) => r.transcript)
          .join(' ')
          .trim();

        console.log('[LEDGER_DEBUG] Speech recognition result:', transcript);
        if (transcript) {
          onResult(transcript);
          this.stop();
        }
      });

      ExpoSpeechRecognitionModule.addListener('error', (error: any) => {
        console.error('[LEDGER_DEBUG] Speech recognition error event:', error);
        onError(error);
        this.stop();
      });

    } catch (err) {
      console.error('[LEDGER_DEBUG] Speech recognition exception:', err);
      onError(err);
    }
  }

  static stop() {
    if (this.isListening) {
      console.log('[LEDGER_DEBUG] Stopping speech recognition...');
      ExpoSpeechRecognitionModule.stop();
      this.isListening = false;
    }
  }
}