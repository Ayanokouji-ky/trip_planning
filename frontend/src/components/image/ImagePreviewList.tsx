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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Tooltip } from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import type { UploadedImage } from './ImageUploadZone';

interface SortableThumbProps {
  image: UploadedImage;
  index: number;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

function SortableThumb({ image, index, onRemove, disabled }: SortableThumbProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #f0f0f0',
    background: '#fafafa',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <img
        src={image.url}
        alt={`预览图 ${index + 1}`}
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Tooltip title="拖拽调整顺序">
        <span
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            padding: '2px 4px',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            cursor: disabled ? 'not-allowed' : 'grab',
            fontSize: 12,
          }}
        >
          <HolderOutlined />
        </span>
      </Tooltip>
      <Button
        size="small"
        danger
        type="text"
        aria-label="删除该图片"
        icon={<DeleteOutlined />}
        disabled={disabled}
        onClick={() => onRemove(image.id)}
        style={{
          position: 'absolute',
          top: 2,
          right: 2,
          background: 'rgba(255,255,255,0.85)',
          borderRadius: 4,
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 18,
          height: 18,
          lineHeight: '18px',
          textAlign: 'center',
          fontSize: 11,
          color: '#fff',
          background: 'rgba(0,0,0,0.5)',
          borderTopRightRadius: 6,
        }}
      >
        {index + 1}
      </span>
    </div>
  );
}

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
}

/** 已选图片预览：缩略图 + 拖拽排序（鼠标/键盘）+ 删除 */
export default function ImagePreviewList({ images, onChange, disabled }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(images, oldIndex, newIndex));
  };

  const handleRemove = (id: string) => {
    const target = images.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.url);
    onChange(images.filter((i) => i.id !== id));
  };

  if (!images.length) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {images.map((img, idx) => (
            <SortableThumb
              key={img.id}
              image={img}
              index={idx}
              onRemove={handleRemove}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
