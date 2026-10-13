import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Props {
  children: ReactNode;
}

/** 路由守卫：未登录跳 /login，并携带来源 location 便于登录后回跳 */
export default function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.token != null);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
