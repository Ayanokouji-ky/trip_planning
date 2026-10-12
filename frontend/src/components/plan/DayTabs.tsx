import { Tabs, Tag } from 'antd';
import type { PlanDay, PlanNode } from '@/types/plan';
import { useMapStore } from '@/store/mapStore';

interface Props {
  days: PlanDay[];
  nodes: PlanNode[];
}

/** 按天切换 Tab，联动 mapStore.activeDayId（null 表示全部） */
export default function DayTabs({ days, nodes }: Props) {
  const { activeDayId, setActiveDay } = useMapStore();

  const items = [
    {
      key: 'all',
      label: (
        <>
          全部 <Tag>{nodes.length}</Tag>
        </>
      ),
    },
    ...[...days]
      .sort((a, b) => a.dayIndex - b.dayIndex)
      .map((day) => ({
        key: String(day.id),
        label: (
          <>
            第 {day.dayIndex} 天 <Tag>{nodes.filter((n) => n.dayId === day.id).length}</Tag>
          </>
        ),
      })),
  ];

  return (
    <Tabs
      activeKey={activeDayId == null ? 'all' : String(activeDayId)}
      items={items}
      onChange={(key) => setActiveDay(key === 'all' ? null : Number(key))}
      size="small"
    />
  );
}
