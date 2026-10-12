import { RouterProvider } from 'react-router-dom';
import { Spin } from 'antd';
import { router } from '@/router';
import { useUiStore } from '@/store/uiStore';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function App() {
  const { globalLoading, loadingText } = useUiStore();

  return (
    <>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      {globalLoading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(255,255,255,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin size="large" tip={loadingText || '加载中...'}>
            <div style={{ width: 200, height: 60 }} />
          </Spin>
        </div>
      )}
    </>
  );
}
