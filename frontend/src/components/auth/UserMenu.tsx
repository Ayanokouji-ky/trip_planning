import { Button, Dropdown, Space, Typography } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const { Text } = Typography;

/** Header 右上角用户菜单：已登录显示用户名 + 登出；未登录显示登录按钮 */
export default function UserMenu() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  if (token == null) {
    return (
      <Button type="primary" onClick={() => navigate('/login')}>
        登录
      </Button>
    );
  }

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
          },
        ],
        onClick: () => {
          logout();
          navigate('/plans');
        },
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Space style={{ cursor: 'pointer' }} size={6}>
        <UserOutlined />
        <Text>{user?.username ?? '用户'}</Text>
      </Space>
    </Dropdown>
  );
}
