import { client } from './client';
import type { AiGenerateRequest, AiGenerateResponse, ModelInfo, NodeEnrichRequest, NodeEnrichResponse } from '@/types/ai';

export const aiApi = {
  /** 端到端 AI 生成行程（Phase 17 提速后实测约 10s），返回完整行程详情 + 模型降级信息；单独放宽到 120s */
  generate: (req: AiGenerateRequest) =>
    client.post<AiGenerateResponse>('/ai/generate', req, { timeout: 120000 }),

  /** 获取可用模型列表 type=text|image */
  getModels: (type: 'text' | 'image' = 'text') =>
    client.get<ModelInfo[]>('/ai/models', { params: { type } }),

  /** Phase 18：节点 AI 智能填充——只输入地点名称生成其余表单字段 */
  enrichNode: (req: NodeEnrichRequest) =>
    client.post<NodeEnrichResponse>('/ai/enrich-node', req, { timeout: 120000 }),
};
