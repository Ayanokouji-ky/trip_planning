import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from '@/constants/models';

interface ModelState {
  /** 文本生成所选模型 ID */
  selectedTextModel: string;
  /** 图片识图所选模型 ID */
  selectedImageModel: string;
  setTextModel: (model: string) => void;
  setImageModel: (model: string) => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedTextModel: DEFAULT_TEXT_MODEL,
      selectedImageModel: DEFAULT_IMAGE_MODEL,
      setTextModel: (model) => set({ selectedTextModel: model }),
      setImageModel: (model) => set({ selectedImageModel: model }),
    }),
    { name: 'model-storage' },
  ),
);
