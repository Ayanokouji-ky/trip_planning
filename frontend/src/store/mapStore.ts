import { create } from 'zustand';

interface MapState {
  /** 当前选中节点（地图标记/侧栏卡片联动） */
  selectedNodeId: number | null;
  /** 当前 hover 节点（地图标记 ↔ 列表卡片双向联动） */
  hoveredNodeId: number | null;
  /** 当前选中路线 */
  selectedRouteId: number | null;
  /** 天筛选：null 表示全部天 */
  activeDayId: number | null;

  selectNode: (nodeId: number | null) => void;
  setHoveredNode: (nodeId: number | null) => void;
  selectRoute: (routeId: number | null) => void;
  setActiveDay: (dayId: number | null) => void;
  reset: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  selectedRouteId: null,
  activeDayId: null,

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),
  selectRoute: (routeId) => set({ selectedRouteId: routeId }),
  setActiveDay: (dayId) => set({ activeDayId: dayId }),
  reset: () =>
    set({ selectedNodeId: null, hoveredNodeId: null, selectedRouteId: null, activeDayId: null }),
}));
