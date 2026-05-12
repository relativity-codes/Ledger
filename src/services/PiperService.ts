import * as Speech from 'expo-speech';

/**
 * Service for Text-to-Speech feedback.
 * Uses expo-speech to provide a reliable voice interface.
 */
export class PiperService {
  /**
   * Speaks the provided text using the system engine.
   * @param text The text to read aloud.
   */
  static async speak(text: string): Promise<void> {
    const isSpeaking = await Speech.isSpeakingAsync();
    
    if (isSpeaking) {
      await Speech.stop();
    }

    return new Promise((resolve) => {
      Speech.speak(text, {
        onDone: () => resolve(),
        onError: (error) => {
          console.error('Speech error:', error);
          resolve(); // Resolve anyway to not block the app
        },
        pitch: 1.0,
        rate: 1.0,
      });
    });
  }

  /**
   * Stops any ongoing speech.
   */
  static async stop(): Promise<void> {
    await Speech.stop();
  }
}
