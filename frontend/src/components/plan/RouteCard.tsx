import { Tag, Typography } from 'antd';
import { BulbOutlined, CarOutlined, ManOutlined, RocketOutlined } from '@ant-design/icons';
import type { PlanRoute } from '@/types/plan';
import { formatDistance } from '@/utils/geo';
import { formatSeconds } from '@/utils/time';

const { Text } = Typography;

/** 交通方式元数据（RouteList / RouteCard 共用） */
export const TRANSPORT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  driving: { label: '驾车', icon: <CarOutlined />, color: 'blue' },
  walking: { label: '步行', icon: <ManOutlined />, color: 'green' },
  transit: { label: '公交', icon: <RocketOutlined />, color: 'orange' },
  riding: { label: '骑行', icon: <RocketOutlined />, color: 'purple' },
};

interface Props {
  /** 相邻两节点间的路线；缺失（如端点未定位）时仅渲染连接线 */
  route?: PlanRoute;
}

/** 节点间路线卡片（交错布局）：竖向连接线 + 紧凑路线信息（方式 + 距离/耗时 + 建议文案） */
export default function RouteCard({ route }: Props) {
  if (!route) {
    return <div className="route-connector route-connector--plain" aria-hidden="true" />;
  }
  const meta = TRANSPORT_META[route.transportMode] ?? TRANSPORT_META.driving;
  return (
    <div className="route-connector">
      <div className="route-card">
        <Tag icon={meta.icon} color={meta.color} style={{ marginRight: 6 }}>
          {meta.label}
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDistance(route.distance)} · {formatSeconds(route.duration)}
        </Text>
        {route.suggestion && (
          <div className="route-card-suggestion">
            <BulbOutlined style={{ color: '#faad14', marginRight: 4 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {route.suggestion}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
