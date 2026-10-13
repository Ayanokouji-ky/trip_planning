import { useRef } from 'react';
import { Button, Empty } from 'antd';
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { PlanNode } from '@/types/plan';
import NodeCard from './NodeCard';

interface Props {
  open: boolean;
  /** 可滑动切换的节点集合（当前筛选下的有序节点） */
  nodes: PlanNode[];
  selectedNodeId: number | null;
  onSelect: (node: PlanNode) => void;
  onClose: () => void;
  onEdit: (node: PlanNode) => void;
  onDelete: (node: PlanNode) => void;
}

/** 窄屏节点详情全屏覆盖层：左右滑动（或箭头按钮）切换节点 */
export default function NodeDetailOverlay({
  open,
  nodes,
  selectedNodeId,
  onSelect,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const touchX = useRef<number | null>(null);
  if (!open) return null;

  const index = nodes.findIndex((n) => n.id === selectedNodeId);
  const node = index >= 0 ? nodes[index] : null;

  const go = (delta: number) => {
    if (index < 0) return;
    const next = nodes[index + delta];
    if (next) onSelect(next);
  };

  return (
    <div
      className="node-detail-overlay"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -50) go(1);
        else if (dx > 50) go(-1);
        touchX.current = null;
      }}
    >
      <div className="node-detail-header">
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} aria-label="关闭详情" />
        <span style={{ color: '#8c8c8c', fontSize: 13 }}>
          {index >= 0 ? `${index + 1} / ${nodes.length}` : ''}
        </span>
        {/* 占位保持标题居中 */}
        <span style={{ width: 32 }} />
      </div>
      {node ? (
        <NodeCard node={node} active onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
      ) : (
        <Empty description="先在列表中选择一个节点" />
      )}
      <div className="node-detail-nav">
        <Button
          shape="circle"
          icon={<LeftOutlined />}
          disabled={index <= 0}
          onClick={() => go(-1)}
          aria-label="上一个节点"
        />
        <span className="node-detail-hint">左右滑动切换节点</span>
        <Button
          shape="circle"
          icon={<RightOutlined />}
          disabled={index < 0 || index >= nodes.length - 1}
          onClick={() => go(1)}
          aria-label="下一个节点"
        />
      </div>
    </div>
  );
}
