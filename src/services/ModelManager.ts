import { File, Directory, Paths } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { GEMMA_4_E2B_IT } from 'react-native-litert-lm';
export interface ModelDownloadProgress {
  progress: number;
  totalBytes: number;
  bytesWritten: number;
}

export type ModelType = 'gemma';

const MODELS = {
  gemma: {
    url: GEMMA_4_E2B_IT,
    filename: "gemma-4-E2B-it.litertlm",
  },
};

export class ModelManager {
  private static downloadResumables: Map<ModelType, any> = new Map();

  static getModelPath(type: ModelType): string {
    const path = new File(Paths.document, "models", MODELS[type].filename).uri;
    console.log(`[LEDGER_DEBUG] Resolving model path for ${type}:`, path);
    return path;
  }

  static async isModelDownloaded(type: ModelType): Promise<boolean> {
    const file = new File(Paths.document, "models", MODELS[type].filename);
    const exists = file.exists;
    console.log(`[LEDGER_DEBUG] Checking if ${type} model exists:`, { exists, path: file.uri });
    return exists;
  }

  static async downloadModel(
    type: ModelType,
    onProgress: (progress: ModelDownloadProgress) => void
  ): Promise<string> {
    const model = MODELS[type];
    const modelsDir = new Directory(Paths.document, "models");
    const modelFile = new File(modelsDir, model.filename);

    if (modelFile.exists) {
      return modelFile.uri;
    }

    if (!modelsDir.exists) {
      await modelsDir.create({ intermediates: true });
    }

    const callback = (data: any) => {
      onProgress({
        progress: data.totalBytesWritten / data.totalBytesExpectedToWrite,
        totalBytes: data.totalBytesExpectedToWrite,
        bytesWritten: data.totalBytesWritten,
      });
    };

    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      model.url,
      modelFile.uri,
      {},
      callback
    );

    this.downloadResumables.set(type, downloadResumable);

    try {
      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error('Download failed');
      return result.uri;
    } catch (e) {
      console.error(`Error downloading ${type} model:`, e);
      throw e;
    } finally {
      this.downloadResumables.delete(type);
    }
  }

  static async cancelDownload(type: ModelType) {
    const resumable = this.downloadResumables.get(type);
    if (resumable) {
      await resumable.pauseAsync();
      this.downloadResumables.delete(type);
    }
  }
}
