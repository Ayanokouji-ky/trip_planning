import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import HomePage from '@/pages/HomePage';
import PlanListPage from '@/pages/PlanListPage';
import PlanDetailPage from '@/pages/PlanDetailPage';
import GeneratePage from '@/pages/GeneratePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'plans', element: <PlanListPage /> },
      { path: 'plans/:id', element: <PlanDetailPage /> },
      { path: 'generate', element: <GeneratePage /> },
    ],
  },
]);
