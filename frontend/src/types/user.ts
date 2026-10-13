/** 用户相关类型，镜像后端 User 实体与认证 DTO */

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
