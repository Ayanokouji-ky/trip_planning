import { Tag, Typography } from 'antd';
import type { PlanNode } from '@/types/plan';
import { formatMinutes } from '@/utils/time';

const { Text, Paragraph } = Typography;

const TYPE_LABELS: Record<string, string> = {
  ATTRACTION: '景点',
  RESTAURANT: '餐饮',
  HOTEL: '住宿',
  TRANSPORT: '交通',
  OTHER: '其他',
};

/** 地图节点 InfoWindow 内容 */
export default function NodePopup({ node }: { node: PlanNode }) {
  return (
    <div style={{ minWidth: 220, maxWidth: 280 }}>
      <div style={{ marginBottom: 4 }}>
        <Text strong>
          {node.orderIndex + 1}. {node.placeName}
        </Text>{' '}
        <Tag color="blue">{TYPE_LABELS[node.placeType ?? 'OTHER'] ?? node.placeType}</Tag>
      </div>
      {node.suggestedDuration != null && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            建议游览 {formatMinutes(node.suggestedDuration)}
            {node.openTime ? ` · ${node.openTime}` : ''}
          </Text>
        </div>
      )}
      {node.highlight && (
        <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0' }} ellipsis={{ rows: 2 }}>
          {node.highlight}
        </Paragraph>
      )}
      {node.ticketInfo && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            门票：{node.ticketInfo}
          </Text>{' '}
          <Tag color="warning" style={{ fontSize: 11 }}>
            仅供参考
          </Tag>
        </div>
      )}
      {node.note && (
        <div>
          <Text type="warning" style={{ fontSize: 12 }}>
            备注：{node.note}
          </Text>
        </div>
      )}
    </div>
  );
}
