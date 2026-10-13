import { useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { RegisterRequest } from '@/types/user';

const { Title, Link, Paragraph } = Typography;

/** 注册页：用户名 + 密码 + 可选邮箱，注册成功后直接登录并跳 /plans */
export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: RegisterRequest) => {
    setSubmitting(true);
    try {
      const { token, user } = await authApi.register(values);
      login(token, user);
      message.success(`注册成功，欢迎 ${user.username}`);
      navigate('/plans', { replace: true });
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
            注册
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            创建账号，开始规划你的专属旅行
          </Paragraph>
        </div>
        <Form<RegisterRequest>
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          requiredMark={false}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少 3 个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="邮箱（可选）" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          已有账号？ <Link onClick={() => navigate('/login')}>去登录</Link>
        </div>
      </Card>
    </div>
  );
}
