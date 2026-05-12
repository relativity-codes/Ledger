import * as Clipboard from 'expo-clipboard';

export class SMSService {
  static async importFromClipboard(): Promise<string | null> {
    const text = await Clipboard.getStringAsync();
    
    // Bank SMS Keywords
    const keywords = ['credited', 'debited', 'balance', 'transaction', 'paid', 'received'];
    const hasKeywords = keywords.some(kw => text.toLowerCase().includes(kw));
    
    if (hasKeywords) {
      return text;
    }
    
    return null;
  }
}
