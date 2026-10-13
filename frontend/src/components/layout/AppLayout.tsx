import { Layout, Menu, Grid } from 'antd';
import { HomeOutlined, UnorderedListOutlined, RobotOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import UserMenu from '@/components/auth/UserMenu';

const { Header, Sider, Content, Footer } = Layout;

const MENU_ITEMS = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/plans', icon: <UnorderedListOutlined />, label: '我的行程' },
  { key: '/generate', icon: <RobotOutlined />, label: 'AI 生成' },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const { siderCollapsed, setSiderCollapsed } = useUiStore();

  // 小屏自动折叠侧边栏
  useEffect(() => {
    setSiderCollapsed(!screens.md);
  }, [screens.md, setSiderCollapsed]);

  // 高亮当前路由（/plans/1 归到 /plans）
  const selectedKey = location.pathname.startsWith('/plans')
    ? '/plans'
    : location.pathname === '/generate'
      ? '/generate'
      : '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: screens.md ? '0 24px' : '0 12px',
            fontSize: screens.md ? 16 : 14,
            fontWeight: 500,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            AI 旅游行程规划与地图可视化平台
          </span>
          <UserMenu />
        </Header>
        <Content style={{ padding: screens.md ? 24 : 12, minHeight: 360 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', color: '#999', padding: '12px 24px' }}>
          Trip Planner ©2026 · 内容仅供参考
        </Footer>
      </Layout>
    </Layout>
  );
}
