import { Card, List, Tag, Typography } from 'antd';
import { ArrowRightOutlined, BulbOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { PlanNode, PlanRoute } from '@/types/plan';
import { formatDistance } from '@/utils/geo';
import { formatSeconds } from '@/utils/time';
import { TRANSPORT_META } from './RouteCard';

const { Text } = Typography;

interface Props {
  routes: PlanRoute[];
  nodes: PlanNode[];
  /** 仅显示这些 node 之间的路线（当前天筛选） */
  visibleNodeIds?: Set<number>;
}

/** 路线列表：起点 → 终点，交通方式 + 距离 + 耗时 */
export default function RouteList({ routes, nodes, visibleNodeIds }: Props) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const filtered = visibleNodeIds
    ? routes.filter((r) => visibleNodeIds.has(r.fromNodeId) && visibleNodeIds.has(r.toNodeId))
    : routes;

  if (filtered.length === 0) {
    return null;
  }

  return (
    <Card
      size="small"
      title={
        <>
          <EnvironmentOutlined /> 路线（{filtered.length} 条）
        </>
      }
      style={{ marginTop: 8 }}
    >
      <List
        size="small"
        dataSource={filtered}
        renderItem={(route) => {
          const from = nodeMap.get(route.fromNodeId);
          const to = nodeMap.get(route.toNodeId);
          const meta = TRANSPORT_META[route.transportMode] ?? TRANSPORT_META.driving;
          return (
            <List.Item style={{ padding: '6px 0' }}>
              <div style={{ width: '100%' }}>
                <Text strong>{from?.placeName ?? `#${route.fromNodeId}`}</Text>
                <ArrowRightOutlined style={{ margin: '0 8px', color: '#999' }} />
                <Text strong>{to?.placeName ?? `#${route.toNodeId}`}</Text>
                <div style={{ marginTop: 4 }}>
                  <Tag icon={meta.icon} color={meta.color}>
                    {meta.label}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDistance(route.distance)} · {formatSeconds(route.duration)}
                  </Text>
                </div>
                {route.suggestion && (
                  <div style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <BulbOutlined style={{ color: '#faad14', marginRight: 4 }} />
                      {route.suggestion}
                    </Text>
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}
