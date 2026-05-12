import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useGemmaService, StructuredEntry } from './GemmaService';

export function useOCR() {
  const { analyzeReceipt } = useGemmaService();

  const processReceipt = async (imageUri: string): Promise<StructuredEntry> => {
    // Preprocess: Resize to 1024px using the new Contextual API
    const context = ImageManipulator.manipulate(imageUri);
    context.resize({ width: 1024 });
    
    const imageRef = await context.renderAsync();
    const processed = await imageRef.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.8
    });

    console.log('Analyzing receipt with Gemma vision:', processed.uri);
    
    // Call Gemma's native multimodal analysis directly
    return await analyzeReceipt(processed.uri);
  };

  return { processReceipt };
}
