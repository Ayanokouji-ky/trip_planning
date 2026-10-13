import { client } from './client';
import type {
  NodeReorderRequest,
  NodeSaveRequest,
  PlanDetailResponse,
  PlanNode,
  PlanRoute,
  PlanSaveRequest,
  TravelPlan,
} from '@/types/plan';

export const planApi = {
  list: (scope: 'mine' | 'public' = 'mine') =>
    client.get<TravelPlan[]>('/plans', { scope }),

  detail: (id: number) => client.get<PlanDetailResponse>(`/plans/${id}`),

  create: (req: PlanSaveRequest) => client.post<TravelPlan>('/plans', req),

  update: (id: number, req: Partial<PlanSaveRequest>) =>
    client.put<TravelPlan>(`/plans/${id}`, req),

  remove: (id: number) => client.delete<void>(`/plans/${id}`),

  copy: (id: number) => client.post<TravelPlan>(`/plans/${id}/copy`),

  addNode: (planId: number, req: NodeSaveRequest) =>
    client.post<PlanNode>(`/plans/${planId}/nodes`, req),

  updateNode: (planId: number, nodeId: number, req: Partial<NodeSaveRequest>) =>
    client.put<PlanNode>(`/plans/${planId}/nodes/${nodeId}`, req),

  removeNode: (planId: number, nodeId: number) =>
    client.delete<void>(`/plans/${planId}/nodes/${nodeId}`),

  reorderNodes: (planId: number, req: NodeReorderRequest) =>
    client.put<PlanNode[]>(`/plans/${planId}/nodes/reorder`, req),

  recalculateRoutes: (planId: number) =>
    client.post<PlanRoute[]>(`/plans/${planId}/routes/recalculate`),
};
