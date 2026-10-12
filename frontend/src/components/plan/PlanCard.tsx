import { Card, Popconfirm, Tag, Typography } from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TravelPlan } from '@/types/plan';

const { Paragraph, Text } = Typography;

const STATUS_META: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: '草稿' },
  AI_GENERATED: { color: 'green', label: 'AI 生成' },
  ACTIVE: { color: 'blue', label: '进行中' },
  ARCHIVED: { color: 'orange', label: '已归档' },
};

interface Props {
  plan: TravelPlan;
  onCopy: (id: number) => void;
  onDelete: (id: number) => void;
}

/** 行程卡片：标题/城市/天数/状态/摘要 + 查看/复制/删除 */
export default function PlanCard({ plan, onCopy, onDelete }: Props) {
  const navigate = useNavigate();
  const status = STATUS_META[plan.status] ?? { color: 'default', label: plan.status };

  return (
    <Card
      hoverable
      actions={[
        <EyeOutlined key="view" onClick={() => navigate(`/plans/${plan.id}`)} />,
        <CopyOutlined
          key="copy"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(plan.id);
          }}
        />,
        <Popconfirm
          key="delete"
          title="删除该行程？"
          description="行程及其所有节点、路线将被删除"
          okText="删除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={() => onDelete(plan.id)}
        >
          <DeleteOutlined onClick={(e) => e.stopPropagation()} />
        </Popconfirm>,
      ]}
      onClick={() => navigate(`/plans/${plan.id}`)}
    >
      <Card.Meta
        title={
          <>
            {plan.title} <Tag color={status.color}>{status.label}</Tag>
          </>
        }
        description={
          <>
            <Text type="secondary">
              <EnvironmentOutlined /> {plan.city} · {plan.days} 天
            </Text>
            <Paragraph
              type="secondary"
              ellipsis={{ rows: 2 }}
              style={{ marginTop: 8, marginBottom: 0, minHeight: 44 }}
            >
              {plan.summary || '暂无摘要'}
            </Paragraph>
          </>
        }
      />
    </Card>
  );
}
