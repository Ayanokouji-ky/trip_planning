import { Drawer, Grid, Layout, Menu } from 'antd';
import {
  HomeOutlined,
  MenuOutlined,
  RobotOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUiStore } from '@/store/uiStore';
import UserMenu from '@/components/auth/UserMenu';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const { Header, Sider, Content, Footer } = Layout;

const MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/plans', icon: <UnorderedListOutlined />, label: '我的行程' },
  { key: '/generate', icon: <RobotOutlined />, label: 'AI 生成' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { screens, isMobile } = useBreakpoint();
  const { siderCollapsed, setSiderCollapsed } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 桌面端：小屏自动折叠侧边栏（窄屏走抽屉，无需折叠）
  useEffect(() => {
    if (!isMobile) setSiderCollapsed(!screens.md);
  }, [screens.md, isMobile, setSiderCollapsed]);

  // 高亮当前路由（/plans/1 归到 /plans）
  const selectedKey = location.pathname.startsWith('/plans')
    ? '/plans'
    : location.pathname === '/generate'
      ? '/generate'
      : '/';

  const handleMenuClick = (key: string) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          breakpoint="md"
          theme="dark"
        >
          <div
            style={{
              height: 48,
              margin: 12,
              color: '#fff',
              fontWeight: 600,
              fontSize: siderCollapsed ? 14 : 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {siderCollapsed ? '旅' : 'AI 旅游规划'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={MENU_ITEMS}
            onClick={({ key }) => handleMenuClick(key)}
          />
        </Sider>
      )}

      {/* 窄屏：汉堡菜单 → 侧抽屉导航 */}
      {isMobile && (
        <Drawer
          placement="left"
          width={240}
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          title={null}
          closeIcon={null}
          styles={{ body: { padding: 0, background: '#001529' } }}
        >
          <div
            style={{
              height: 48,
              margin: 12,
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            AI 旅游规划
          </div>
          <Menu
            theme="dark"
            mode="inline"
            inlineCollapsed={false}
            selectedKeys={[selectedKey]}
            items={MENU_ITEMS}
            onClick={({ key }) => handleMenuClick(key)}
          />
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: isMobile ? '0 12px' : screens.md ? '0 24px' : '0 12px',
            fontSize: isMobile ? 15 : screens.md ? 16 : 14,
            fontWeight: 500,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            gap: 8,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {isMobile && (
              <MenuOutlined
                className="tap-target"
                aria-label="打开菜单"
                style={{ fontSize: 20, flexShrink: 0 }}
                onClick={() => setMobileMenuOpen(true)}
              />
            )}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              AI 旅游行程规划与地图可视化平台
            </span>
          </span>
          <UserMenu />
        </Header>
        <Content style={{ padding: isMobile || !screens.md ? 12 : 24, minHeight: 360 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', color: '#999', padding: '12px 24px' }}>
          Trip Planner ©2026 · 内容仅供参考
        </Footer>
      </Layout>
    </Layout>
  );
}
