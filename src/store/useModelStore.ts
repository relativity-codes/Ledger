import { create } from 'zustand';
import { ModelManager, ModelType, ModelDownloadProgress } from '../services/ModelManager';

interface ModelState {
  isGemmaDownloaded: boolean;
  gemmaProgress: ModelDownloadProgress | null;
  checkStatus: () => Promise<void>;
  downloadModel: (type: ModelType) => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  isGemmaDownloaded: false,
  gemmaProgress: null,
  checkStatus: async () => {
    const status = await ModelManager.isModelDownloaded('gemma');
    set({ isGemmaDownloaded: status });
  },
  downloadModel: async (type: ModelType) => {
    await ModelManager.downloadModel(type, (progress) => {
      set({ gemmaProgress: progress });
    });
    const status = await ModelManager.isModelDownloaded(type);
    set({ isGemmaDownloaded: status, gemmaProgress: null });
  },
}));
