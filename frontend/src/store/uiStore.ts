import { create } from 'zustand';

interface UiState {
  /** 全局加载（如 AI 生成中的全屏遮罩） */
  globalLoading: boolean;
  loadingText: string;
  /** 侧边栏折叠（响应式） */
  siderCollapsed: boolean;

  setGlobalLoading: (loading: boolean, text?: string) => void;
  setSiderCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  globalLoading: false,
  loadingText: '',
  siderCollapsed: false,

  setGlobalLoading: (loading, text = '') =>
    set({ globalLoading: loading, loadingText: text }),

  setSiderCollapsed: (collapsed) => set({ siderCollapsed: collapsed }),
}));
