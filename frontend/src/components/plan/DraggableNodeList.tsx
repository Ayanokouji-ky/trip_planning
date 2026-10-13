import { Fragment } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';
import type { PlanNode, PlanRoute } from '@/types/plan';
import NodeCard from './NodeCard';
import RouteCard from './RouteCard';

interface ItemProps {
  node: PlanNode;
  active: boolean;
  onSelect: (node: PlanNode) => void;
  onEdit: (node: PlanNode) => void;
  onDelete: (node: PlanNode) => void;
}

/** 可排序的节点卡片：整卡拖拽（8px 激活阈值防点击/滚动误触），右上是视觉提示 */
function SortableItem({ node, active, onSelect, onEdit, onDelete }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`sortable-node-card${isDragging ? ' sortable-node-card--dragging' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 10 : undefined,
        touchAction: 'none',
      }}
    >
      <HolderOutlined className="export-ignore drag-hint" />
      <NodeCard
        node={node}
        active={active}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

interface Props {
  /** 当天节点（已按 orderIndex 排序） */
  nodes: PlanNode[];
  /** 全部路线（用于节点间交错渲染 RouteCard） */
  routes: PlanRoute[];
  selectedNodeId: number | null;
  /** 拖拽结束，参数为重排后的节点 ID 顺序 */
  onReorder: (orderedIds: number[]) => void;
  onSelect: (node: PlanNode) => void;
  onEdit: (node: PlanNode) => void;
  onDelete: (node: PlanNode) => void;
}

/**
 * 当天节点的拖拽排序列表（仅支持单天内排序，跨天不走拖拽）。
 * 节点间交错插入路线卡片（NodeCard → RouteCard → NodeCard…），RouteCard 不参与排序。
 */
export default function DraggableNodeList({
  nodes,
  routes,
  selectedNodeId,
  onReorder,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  // 鼠标/触摸：移动 8px 才激活拖拽，点击与拖拽共存（触摸端整卡 touchAction:none）；
  // 键盘：空格开始、方向键移动、空格放下
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = nodes.map((n) => n.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={nodes.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        {nodes.map((node, i) => (
          <Fragment key={node.id}>
            <SortableItem
              node={node}
              active={selectedNodeId === node.id}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {i < nodes.length - 1 && (
              <RouteCard
                route={routes.find(
                  (r) => r.fromNodeId === node.id && r.toNodeId === nodes[i + 1].id,
                )}
              />
            )}
          </Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
}
