import { create } from 'zustand';
import { planApi } from '@/api/planApi';
import type { PlanDetailResponse, TravelPlan } from '@/types/plan';

interface PlanState {
  /** 行程列表 */
  plans: TravelPlan[];
  listLoading: boolean;
  /** 当前行程详情 */
  current: PlanDetailResponse | null;
  detailLoading: boolean;

  fetchPlans: (scope: 'mine' | 'public') => Promise<void>;
  fetchDetail: (id: number) => Promise<void>;
  setCurrent: (detail: PlanDetailResponse) => void;
  clearCurrent: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  plans: [],
  listLoading: false,
  current: null,
  detailLoading: false,

  fetchPlans: async (scope: 'mine' | 'public' = 'mine') => {
    set({ listLoading: true });
    try {
      const plans = await planApi.list(scope);
      set({ plans });
    } finally {
      set({ listLoading: false });
    }
  },

  fetchDetail: async (id) => {
    set({ detailLoading: true });
    try {
      const detail = await planApi.detail(id);
      set({ current: detail });
    } finally {
      set({ detailLoading: false });
    }
  },

  setCurrent: (detail) => set({ current: detail }),

  clearCurrent: () => set({ current: null }),
}));
