import { client } from './client';
import type { LoginRequest, RegisterRequest, LoginResponse, User } from '@/types/user';

export const authApi = {
  register: (req: RegisterRequest) => client.post<LoginResponse>('/auth/register', req),
  login: (req: LoginRequest) => client.post<LoginResponse>('/auth/login', req),
  me: () => client.get<User>('/auth/me'),
};
