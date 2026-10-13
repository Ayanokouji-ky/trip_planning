import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import type { ApiResult } from '@/types/api';

const instance = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

// 请求拦截器：从 zustand persist 的 localStorage 读取 token，注入 Authorization
instance.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { token?: string | null } | null };
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore malformed storage
    }
  }
  return config;
});

// 响应拦截器：解包 ApiResult，统一错误提示；401 清除登录态并跳 /login
instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResult<unknown>;
    if (body && typeof body.code === 'number') {
      if (body.code === 200) {
        return body.data;
      }
      const err = new Error(body.message || '请求失败');
      message.error(err.message);
      return Promise.reject(err);
    }
    return response.data;
  },
  (error: AxiosError<ApiResult<unknown>>) => {
    const status = error.response?.status;
    if (status === 401) {
      // 清除登录态
      localStorage.removeItem('auth-storage');
      // 在 /login 页面不跳转，避免循环（登录失败时仅提示错误）
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        return Promise.reject(new Error('未登录或登录已过期'));
      }
    }
    const msg = error.response?.data?.message || `网络错误: ${error.message}`;
    message.error(msg);
    return Promise.reject(new Error(msg));
  },
);

// 拦截器解包后返回值与 axios 默认类型不符，封装一层类型安全方法
function request<T>(config: AxiosRequestConfig): Promise<T> {
  return instance.request(config) as unknown as Promise<T>;
}

export const client = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    request<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>) =>
    request<T>({ method: 'POST', url, data, ...config }),
  put: <T>(url: string, data?: unknown) => request<T>({ method: 'PUT', url, data }),
  delete: <T>(url: string) => request<T>({ method: 'DELETE', url }),
};
