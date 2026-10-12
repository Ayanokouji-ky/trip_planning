import { client } from './client';
import type { AiGenerateRequest } from '@/types/ai';
import type { PlanDetailResponse } from '@/types/plan';

export const aiApi = {
  /** 端到端 AI 生成行程（实测 50-90s），返回完整行程详情；单独放宽到 120s */
  generate: (req: AiGenerateRequest) =>
    client.post<PlanDetailResponse>('/ai/generate', req, { timeout: 120000 }),
};
