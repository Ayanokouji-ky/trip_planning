import { Button, Result } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/** 全局错误边界：子树渲染异常时展示降级页，避免整站白屏 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    // DEV 测试钩子：window.dispatchEvent(new Event('trip:test-error'))
    if (import.meta.env.DEV) {
      this.testHook = () =>
        this.setState({ hasError: true, error: new Error('手动触发的错误边界测试') });
      window.addEventListener('trip:test-error', this.testHook);
    }
  }

  componentWillUnmount() {
    if (this.testHook) window.removeEventListener('trip:test-error', this.testHook);
  }

  private testHook: (() => void) | null = null;

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 保留现场便于排查
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.assign('/');
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Result
        status="error"
        title="页面出错了"
        subTitle="页面渲染时发生异常，可尝试返回首页或刷新页面。"
        extra={[
          <Button type="primary" key="home" onClick={this.handleReload}>
            返回首页
          </Button>,
          <Button key="reset" onClick={this.handleReset}>
            重试
          </Button>,
        ]}
      >
        {import.meta.env.DEV && this.state.error && (
          <pre
            style={{
              textAlign: 'left',
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 240,
            }}
          >
            {this.state.error.message}
          </pre>
        )}
      </Result>
    );
  }
}
