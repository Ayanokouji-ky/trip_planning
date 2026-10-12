import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
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
import type { PlanNode } from '@/types/plan';
import NodeCard from './NodeCard';

interface ItemProps {
  node: PlanNode;
  active: boolean;
  onSelect: (node: PlanNode) => void;
  onEdit: (node: PlanNode) => void;
  onDelete: (node: PlanNode) => void;
}

/** 可排序的节点卡片：左侧拖拽手柄 + NodeCard */
function SortableItem({ node, active, onSelect, onEdit, onDelete }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'stretch',
        gap: 4,
        opacity: isDragging ? 0.7 : 1,
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className="export-ignore"
        title="拖拽调整顺序"
        style={{
          cursor: 'grab',
          color: '#bfbfbf',
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px',
          touchAction: 'none',
          fontSize: 16,
        }}
      >
        <HolderOutlined />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <NodeCard
          node={node}
          active={active}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

interface Props {
  /** 当天节点（已按 orderIndex 排序） */
  nodes: PlanNode[];
  selectedNodeId: number | null;
  /** 拖拽结束，参数为重排后的节点 ID 顺序 */
  onReorder: (orderedIds: number[]) => void;
  onSelect: (node: PlanNode) => void;
  onEdit: (node: PlanNode) => void;
  onDelete: (node: PlanNode) => void;
}

/** 当天节点的拖拽排序列表（仅支持单天内排序，跨天不走拖拽） */
export default function DraggableNodeList({
  nodes,
  selectedNodeId,
  onReorder,
  onSelect,
  onEdit,
  onDelete,
}: Props) {
  // 鼠标：移动 5px 才激活拖拽，避免与卡片点击冲突；键盘：空格开始、方向键移动、空格放下
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
        {nodes.map((node) => (
          <SortableItem
            key={node.id}
            node={node}
            active={selectedNodeId === node.id}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
