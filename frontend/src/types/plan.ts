/** 行程相关类型，镜像后端 entity 与 DTO */

export interface TravelPlan {
  id: number;
  title: string;
  city: string;
  days: number;
  status: 'DRAFT' | 'AI_GENERATED' | 'ACTIVE' | 'ARCHIVED';
  summary?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanDay {
  id: number;
  planId: number;
  dayIndex: number;
  date?: string;
  summary?: string;
}

export type PlaceType = 'ATTRACTION' | 'RESTAURANT' | 'HOTEL' | 'TRANSPORT' | 'OTHER';

export interface PlanNode {
  id: number;
  planId: number;
  dayId: number;
  placeName: string;
  placeType?: PlaceType | string;
  lat?: number;
  lng?: number;
  orderIndex: number;
  suggestedDuration?: number;
  highlight?: string;
  description?: string;
  openTime?: string;
  ticketInfo?: string;
  transportFromPrev?: string;
  estimatedCost?: number;
  note?: string;
}

export interface PlanRoute {
  id: number;
  planId: number;
  fromNodeId: number;
  toNodeId: number;
  transportMode: string;
  distance?: number;
  duration?: number;
  cost?: number;
  /** 出行建议文案（Phase 19，打车估价带"仅供参考"） */
  suggestion?: string | null;
}

export interface PlanDetailResponse {
  plan: TravelPlan;
  days: PlanDay[];
  nodes: PlanNode[];
  routes: PlanRoute[];
}

export interface PlanSaveRequest {
  title: string;
  city: string;
  days: number;
  summary?: string;
}

export interface NodeSaveRequest {
  dayId: number;
  placeName: string;
  placeType?: string;
  suggestedDuration?: number;
  highlight?: string;
  description?: string;
  openTime?: string;
  ticketInfo?: string;
  estimatedCost?: number;
  note?: string;
}

export interface NodeReorderRequest {
  dayId: number;
  nodeIds: number[];
}
