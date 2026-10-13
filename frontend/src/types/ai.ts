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

/** ===== Phase 14：图片识图相关的 AI 结构化行程（镜像后端 AiItineraryDto，snake_case） ===== */

export interface AiNodeDto {
  place_name: string;
  place_type?: string;
  time_start?: string;
  time_end?: string;
  suggested_duration?: number;
  highlight?: string;
  description?: string;
  open_time?: string;
  ticket_info?: string;
  transport_from_previous?: string;
  estimated_cost?: number;
  note?: string;
}

export interface AiDayDto {
  day: number;
  date?: string;
  summary?: string;
  nodes: AiNodeDto[];
}

export interface AiItineraryDto {
  destination: string;
  days: number;
  summary?: string;
  itinerary: AiDayDto[];
}

/** 图片识图预览响应（POST /api/ai/image-import 返回） */
export interface ImageImportResponse {
  importId: number;
  itinerary: AiItineraryDto;
  degraded: boolean;
  modelUsed: string;
  imageCount: number;
}

/** 图片识图确认请求（POST /api/ai/image-import/confirm） */
export interface ImageImportConfirmRequest {
  importId: number;
  title?: string;
  /** 用户确认/编辑后的行程；为空则由后端使用已存储的识别结果 */
  itinerary?: AiItineraryDto;
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
