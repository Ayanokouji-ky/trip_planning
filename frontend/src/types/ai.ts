/** AI 生成相关类型，镜像后端 DTO */

export interface AiGenerateRequest {
  requirement: string;
  title?: string;
  /** 可选：指定 AI 模型 ID */
  model?: string;
}

/** AI 生成接口响应（Phase 13：含模型降级信息） */
export interface AiGenerateResponse {
  /** 生成的行程详情 */
  plan: import('./plan').PlanDetailResponse;
  /** 所选模型不可用时是否降级到默认模型 */
  degraded: boolean;
  /** 实际使用的模型 ID */
  modelUsed: string;
}

/** 模型信息（GET /api/ai/models 返回） */
export interface ModelInfo {
  id: string;
  label: string;
  tag: string;
  description: string;
}

export interface GeocodeResponse {
  lat: number;
  lng: number;
  confidence?: number;
  level?: string;
}

export interface RouteInfoResponse {
  distance?: number;
  duration?: number;
  transportMode: string;
  cost?: number;
  source?: string;
}
