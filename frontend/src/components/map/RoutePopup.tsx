import { Tag, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type { PlanNode, PlanRoute } from '@/types/plan';
import { formatDistance } from '@/utils/geo';
import { formatSeconds } from '@/utils/time';

const { Text } = Typography;

const TRANSPORT_LABELS: Record<string, string> = {
  driving: '驾车',
  walking: '步行',
  transit: '公交',
  riding: '骑行',
};

interface Props {
  route: PlanRoute;
  from?: PlanNode;
  to?: PlanNode;
}

/** 地图路线 InfoWindow 内容 */
export default function RoutePopup({ route, from, to }: Props) {
  return (
    <div style={{ minWidth: 200 }}>
      <div style={{ marginBottom: 4 }}>
        <Text strong>{from?.placeName ?? `#${route.fromNodeId}`}</Text>
        <ArrowRightOutlined style={{ margin: '0 6px', color: '#999', fontSize: 12 }} />
        <Text strong>{to?.placeName ?? `#${route.toNodeId}`}</Text>
      </div>
      <Tag color="blue">{TRANSPORT_LABELS[route.transportMode] ?? route.transportMode}</Tag>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {formatDistance(route.distance)} · 约 {formatSeconds(route.duration)}
      </Text>
      <div style={{ marginTop: 4 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          距离与耗时为规划参考，实际以路况为准
        </Text>
      </div>
    </div>
  );
}
