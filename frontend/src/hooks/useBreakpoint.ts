import { Grid } from 'antd';

/**
 * 响应式断点 Hook：封装 Grid.useBreakpoint
 * isMobile = width < 768（antd md 断点）
 * 首帧未完成测量时按桌面处理，避免桌面端闪跳移动布局
 */
export function useBreakpoint() {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md != null ? !screens.md : false;
  return { screens, isMobile };
}
