/** 后端统一响应封装，镜像 ApiResult<T> */
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}
