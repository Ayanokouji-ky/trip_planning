/** AI 生成相关类型，镜像后端 DTO */

export interface AiGenerateRequest {
  requirement: string;
  title?: string;
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
