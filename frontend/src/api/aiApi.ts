import { client } from './client';
import type { AiGenerateRequest, AiGenerateResponse, ModelInfo } from '@/types/ai';

export const aiApi = {
  /** 端到端 AI 生成行程（实测 50-90s），返回完整行程详情 + 模型降级信息；单独放宽到 120s */
  generate: (req: AiGenerateRequest) =>
    client.post<AiGenerateResponse>('/ai/generate', req, { timeout: 120000 }),

  /** 获取可用模型列表 type=text|image */
  getModels: (type: 'text' | 'image' = 'text') =>
    client.get<ModelInfo[]>('/ai/models', { params: { type } }),
};
