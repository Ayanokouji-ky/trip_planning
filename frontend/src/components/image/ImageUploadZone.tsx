import { useEffect } from 'react';
import { Upload, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

/** 待上传图片（保留原始 File 以便提交，url 用于本地预览） */
export interface UploadedImage {
  id: string;
  file: File;
  url: string;
}

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  disabled?: boolean;
  maxCount?: number;
}

let seq = 0;
const nextId = () => `img-${Date.now()}-${seq++}`;

function toUploaded(files: File[]): UploadedImage[] {
  return files
    .filter((f) => f.type.startsWith('image/'))
    .map((f) => ({ id: nextId(), file: f, url: URL.createObjectURL(f) }));
}

/** 图片上传区：拖拽 / 点击选择 / 剪贴板粘贴，支持多图 */
export default function ImageUploadZone({ images, onChange, disabled, maxCount = 9 }: Props) {
  const addFiles = (files: File[]) => {
    if (disabled) return;
    const incoming = toUploaded(files);
    if (!incoming.length) return;
    const merged = [...images, ...incoming].slice(0, maxCount);
    // 超出张数限制的多余图片，回收其 objectURL
    [...images, ...incoming].slice(maxCount).forEach((img) => URL.revokeObjectURL(img.url));
    onChange(merged);
  };

  // 监听窗口粘贴事件（截图/复制图片可直接粘贴）
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return (
    <Upload.Dragger
      multiple
      accept="image/*"
      disabled={disabled}
      showUploadList={false}
      // 返回 false 阻止自动上传，由父组件统一收集后手动提交
      beforeUpload={(file, fileList) => {
        if (file === fileList[fileList.length - 1]) {
          addFiles(fileList as unknown as File[]);
        }
        return false;
      }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
      <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 12 }}>
        支持 jpg / png / webp，单张不超过 10MB，最多 {maxCount} 张；也可直接粘贴（Ctrl+V）截图。
        可上传攻略截图、行程安排或景点照片，AI 会识别其中的地点并整理为行程。
      </Paragraph>
    </Upload.Dragger>
  );
}
