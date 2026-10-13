import { useEffect, useState } from 'react';
import { Button, Col, Empty, message, Row, Spin, Tabs, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '@/store/planStore';
import { useAuthStore } from '@/store/authStore';
import { planApi } from '@/api/planApi';
import PlanCard from '@/components/plan/PlanCard';

const { Title } = Typography;

type Scope = 'mine' | 'public';

/** 行程列表页：双 Tab（我的行程 / 公共攻略）+ PlanCard 网格 + 查看/复制/删除 */
export default function PlanListPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.token != null);
  const { plans, listLoading, fetchPlans } = usePlanStore();
  const [activeTab, setActiveTab] = useState<Scope>(
    isAuthenticated ? 'mine' : 'public',
  );

  useEffect(() => {
    fetchPlans(activeTab);
  }, [fetchPlans, activeTab]);

  const handleTabChange = (key: string) => {
    const scope = key as Scope;
    if (scope === 'mine' && !isAuthenticated) {
      navigate('/login');
      return;
    }
    setActiveTab(scope);
  };

  const handleCopy = async (id: number) => {
    try {
      const copied = await planApi.copy(id);
      message.success(`已复制为「${copied.title}」`);
      fetchPlans(activeTab);
    } catch {
      // 拦截器已统一提示
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await planApi.remove(id);
      message.success('行程已删除');
      fetchPlans(activeTab);
    } catch {
      // 拦截器已统一提示
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          行程列表
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/generate')}
        >
          AI 生成行程
        </Button>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          { key: 'mine', label: '我的行程' },
          { key: 'public', label: '公共攻略' },
        ]}
      />
      <Spin spinning={listLoading}>
        {plans.length === 0 && !listLoading ? (
          <Empty
            description={
              activeTab === 'mine' ? '还没有行程，去生成一个吧' : '暂无公共攻略'
            }
          >
            {activeTab === 'mine' && (
              <Button type="primary" onClick={() => navigate('/generate')}>
                立即生成
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {plans.map((plan) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={plan.id}>
                <PlanCard plan={plan} onCopy={handleCopy} onDelete={handleDelete} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}
