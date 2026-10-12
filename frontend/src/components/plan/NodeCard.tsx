import { Card, Popconfirm, Tag, Tooltip, Typography } from 'antd';
import {
  BankOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { PlanNode } from '@/types/plan';
import { formatMinutes } from '@/utils/time';

const { Text, Paragraph } = Typography;

const PLACE_TYPE_META: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  ATTRACTION: { color: 'blue', label: '景点', icon: <BankOutlined /> },
  RESTAURANT: { color: 'orange', label: '餐饮', icon: <CoffeeOutlined /> },
  HOTEL: { color: 'purple', label: '住宿', icon: <HomeOutlined /> },
  TRANSPORT: { color: 'cyan', label: '交通', icon: <RocketOutlined /> },
  OTHER: { color: 'default', label: '其他', icon: <EnvironmentOutlined /> },
};

interface Props {
  node: PlanNode;
  onEdit: (node: PlanNode) => void;
  onDelete: (node: PlanNode) => void;
  /** 点击卡片主体（联动地图定位） */
  onSelect?: (node: PlanNode) => void;
  /** 当前是否被地图/侧栏选中 */
  active?: boolean;
}

/** 节点卡片：编号 + 地点名 + 类型 + 时长/亮点/门票（仅供参考） */
export default function NodeCard({ node, onEdit, onDelete, onSelect, active }: Props) {
  const typeMeta = PLACE_TYPE_META[node.placeType ?? 'OTHER'] ?? PLACE_TYPE_META.OTHER;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 8,
        cursor: onSelect ? 'pointer' : undefined,
        borderColor: active ? '#1677ff' : undefined,
        boxShadow: active ? '0 0 0 2px rgba(22,119,255,0.15)' : undefined,
      }}
      onClick={() => onSelect?.(node)}
      actions={[
        <Tooltip key="edit" title="编辑节点">
          <EditOutlined
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
          />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="删除该节点？"
          description="删除后当天剩余节点将重新排序"
          okText="删除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          onConfirm={() => onDelete(node)}
        >
          <DeleteOutlined onClick={(e) => e.stopPropagation()} />
        </Popconfirm>,
      ]}
    >
      <Card.Meta
        avatar={
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1677ff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            {node.orderIndex + 1}
          </div>
        }
        title={
          <>
            {node.placeName} <Tag color={typeMeta.color} icon={typeMeta.icon}>{typeMeta.label}</Tag>
            {node.lat == null && (
              <Tooltip title="该地点未能定位坐标">
                <Tag color="red" icon={<InfoCircleOutlined />}>
                  未定位
                </Tag>
              </Tooltip>
            )}
          </>
        }
        description={
          <div>
            {node.suggestedDuration != null && (
              <Text type="secondary" style={{ display: 'block' }}>
                <ClockCircleOutlined /> 建议游览 {formatMinutes(node.suggestedDuration)}
                {node.openTime ? ` · 开放时间 ${node.openTime}` : ''}
              </Text>
            )}
            {node.highlight && (
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 2 }}
                style={{ marginTop: 4, marginBottom: 4 }}
              >
                亮点：{node.highlight}
              </Paragraph>
            )}
            {node.ticketInfo && (
              <Text type="secondary" style={{ display: 'block' }}>
                门票：{node.ticketInfo}{' '}
                <Tag color="warning" style={{ marginLeft: 4 }}>
                  仅供参考
                </Tag>
              </Text>
            )}
            {node.estimatedCost != null && (
              <Text type="secondary" style={{ display: 'block' }}>
                预估费用：¥{node.estimatedCost}
              </Text>
            )}
            {node.description && (
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 2, expandable: true, symbol: '展开' }}
                style={{ marginTop: 4, marginBottom: 0 }}
              >
                {node.description}
              </Paragraph>
            )}
            {node.note && (
              <Text type="warning" style={{ display: 'block', fontSize: 12 }}>
                备注：{node.note}
              </Text>
            )}
          </div>
        }
      />
    </Card>
  );
}
