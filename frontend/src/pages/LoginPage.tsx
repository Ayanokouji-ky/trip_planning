import { useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '@/types/user';
import type { Location } from 'react-router-dom';

const { Title, Link, Paragraph } = Typography;

interface FromState {
  from?: Location;
}

/** 登录页：用户名 + 密码，登录成功后回跳来源或 /plans */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginRequest) => {
    setSubmitting(true);
    try {
      const { token, user } = await authApi.login(values);
      login(token, user);
      message.success(`欢迎回来，${user.username}`);
      const from = (location.state as FromState | null)?.from;
      navigate(from?.pathname ?? '/plans', { replace: true });
    } catch {
      // 拦截器已统一提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: 16,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            登录
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            登录后可生成、保存和管理你的私人行程
          </Paragraph>
        </div>
        <Form<LoginRequest>
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          还没有账号？ <Link onClick={() => navigate('/register')}>立即注册</Link>
        </div>
      </Card>
    </div>
  );
}
