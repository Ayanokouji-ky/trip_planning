import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Input, InputNumber, Select, Space, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { imageApi } from '@/api/imageApi';
import { useModelStore } from '@/store/modelStore';
import { usePlanStore } from '@/store/planStore';
import { IMAGE_MODELS, MODEL_TAG_COLORS } from '@/constants/models';
import ImageUploadZone, { type UploadedImage } from './ImageUploadZone';
import ImagePreviewList from './ImagePreviewList';
import AiLoadingOverlay from '@/components/ai/AiLoadingOverlay';
import type { AiDayDto, AiItineraryDto, AiNodeDto, ImageImportResponse } from '@/types/ai';

const { Text, Paragraph } = Typography;

const PLACE_TYPE_OPTIONS = [
  { value: 'ATTRACTION', label: '景点' },
  { value: 'RESTAURANT', label: '餐厅' },
  { value: 'HOTEL', label: '住宿' },
  { value: 'TRANSPORT', label: '交通' },
  { value: 'OTHER', label: '其他' },
];

const emptyNode = (): AiNodeDto => ({
  place_name: '',
  place_type: 'ATTRACTION',
  suggested_duration: 60,
});

/** 图片导入 Tab：上传图片 → 识图预览 → 编辑确认 → 生成行程 */
export default function ImageImportPanel() {
  const navigate = useNavigate();
  const setCurrent = usePlanStore((s) => s.setCurrent);
  const selectedImageModel = useModelStore((s) => s.selectedImageModel);
  const setImageModel = useModelStore((s) => s.setImageModel);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ImageImportResponse | null>(null);
  const [draft, setDraft] = useState<AiItineraryDto | null>(null);
  const [title, setTitle] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const imagesRef = useRef<UploadedImage[]>([]);
  imagesRef.current = images;

  const busy = recognizing || confirming;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      // 卸载时回收所有预览 objectURL
      imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    };
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecognize = async () => {
    if (!images.length) {
      message.warning('请先上传至少一张图片');
      return;
    }
    setRecognizing(true);
    startTimer();
    try {
      const res = await imageApi.recognize(images.map((i) => i.file), selectedImageModel);
      setResult(res);
      setDraft(JSON.parse(JSON.stringify(res.itinerary)) as AiItineraryDto);
      setTitle(`${res.itinerary.destination || '图片识别'}行程`);
      if (res.degraded) {
        message.warning(`所选识图模型不可用，已降级为 ${res.modelUsed}`);
      }
    } catch {
      // 拦截器已统一提示，保留图片可重试
    } finally {
      stopTimer();
      setRecognizing(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || !draft) return;
    const hasNode = draft.itinerary?.some((d) => (d.nodes?.length ?? 0) > 0);
    if (!hasNode) {
      message.warning('识别结果中没有任何节点，无法生成行程');
      return;
    }
    setConfirming(true);
    startTimer();
    try {
      const { plan, degraded, modelUsed } = await imageApi.confirm({
        importId: result.importId,
        title: title.trim() || undefined,
        itinerary: draft,
      });
      setCurrent(plan);
      if (degraded) message.warning(`已降级为 ${modelUsed}`);
      navigate(`/plans/${plan.plan.id}`);
    } catch {
      // 拦截器已统一提示
    } finally {
      stopTimer();
      setConfirming(false);
    }
  };

  const handleReset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.url));
    setImages([]);
    setResult(null);
    setDraft(null);
    setTitle('');
  };

  // ===== 识别结果编辑（按天分组，可编辑/删除/新增节点）=====

  const updateNode = (dayIdx: number, nodeIdx: number, patch: Partial<AiNodeDto>) => {
    setDraft((d) => {
      if (!d) return d;
      const itinerary = d.itinerary.map((day, di) => {
        if (di !== dayIdx) return day;
        const nodes = day.nodes.map((n, ni) => (ni === nodeIdx ? { ...n, ...patch } : n));
        return { ...day, nodes };
      });
      return { ...d, itinerary };
    });
  };

  const removeNode = (dayIdx: number, nodeIdx: number) => {
    setDraft((d) => {
      if (!d) return d;
      const itinerary = d.itinerary.map((day, di) =>
        di !== dayIdx ? day : { ...day, nodes: day.nodes.filter((_, ni) => ni !== nodeIdx) },
      );
      return { ...d, itinerary };
    });
  };

  const addNode = (dayIdx: number) => {
    setDraft((d) => {
      if (!d) return d;
      const itinerary = d.itinerary.map((day, di) =>
        di !== dayIdx ? day : { ...day, nodes: [...day.nodes, emptyNode()] },
      );
      return { ...d, itinerary };
    });
  };

  // ===== 上传态 =====
  if (!result) {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <ImageUploadZone images={images} onChange={setImages} disabled={busy} />
        <ImagePreviewList images={images} onChange={setImages} disabled={busy} />
        <div>
          <Text strong style={{ marginRight: 8 }}>
            识图模型
          </Text>
          <Select
            style={{ minWidth: 240 }}
            value={selectedImageModel}
            onChange={setImageModel}
            options={IMAGE_MODELS.map((m) => ({
              value: m.id,
              label: (
                <Space size="small">
                  <span>{m.label}</span>
                  <Tag color={MODEL_TAG_COLORS[m.tag] ?? 'default'} style={{ margin: 0 }}>
                    {m.tag}
                  </Tag>
                </Space>
              ),
            }))}
          />
        </div>
        <Button
          type="primary"
          size="large"
          block
          loading={recognizing}
          disabled={!images.length}
          onClick={handleRecognize}
        >
          {recognizing ? '识别中…' : `开始识别（${images.length} 张）`}
        </Button>
        {busy && <AiLoadingOverlay elapsed={elapsed} timeoutSeconds={120} />}
      </Space>
    );
  }

  // ===== 结果编辑态 =====
  const days: AiDayDto[] = draft?.itinerary ?? [];
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type={result.degraded ? 'warning' : 'success'}
        showIcon
        message={`已识别 ${result.imageCount} 张图片，共 ${days.length} 天行程（模型：${result.modelUsed}）`}
        description="请核对识别结果，可修改名称/类型、删除误识别的地点或补充节点，确认无误后生成行程。"
      />

      <div>
        <Text strong style={{ marginRight: 8 }}>
          行程标题
        </Text>
        <Input
          style={{ maxWidth: 360 }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="可选，缺省自动生成"
          disabled={busy}
        />
      </div>

      {days.map((day, dayIdx) => (
        <Card
          key={dayIdx}
          size="small"
          title={`第 ${day.day ?? dayIdx + 1} 天`}
          extra={<Text type="secondary">{day.summary || ''}</Text>}
        >
          {(day.nodes ?? []).length === 0 && (
            <Paragraph type="secondary" style={{ margin: 0 }}>
              该天无识别节点
            </Paragraph>
          )}
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {(day.nodes ?? []).map((node, nodeIdx) => (
              <div key={nodeIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    flex: '0 0 24px',
                    height: 24,
                    lineHeight: '24px',
                    textAlign: 'center',
                    borderRadius: 12,
                    background: '#1677ff',
                    color: '#fff',
                    fontSize: 12,
                  }}
                >
                  {nodeIdx + 1}
                </span>
                <Input
                  value={node.place_name}
                  onChange={(e) => updateNode(dayIdx, nodeIdx, { place_name: e.target.value })}
                  placeholder="地点名称"
                  disabled={busy}
                  style={{ flex: 1, minWidth: 140 }}
                />
                <Select
                  value={node.place_type}
                  onChange={(v) => updateNode(dayIdx, nodeIdx, { place_type: v })}
                  options={PLACE_TYPE_OPTIONS}
                  style={{ width: 96 }}
                  disabled={busy}
                />
                <InputNumber
                  value={node.suggested_duration}
                  min={0}
                  onChange={(v) => updateNode(dayIdx, nodeIdx, { suggested_duration: v ?? undefined })}
                  disabled={busy}
                  style={{ width: 84 }}
                  addonAfter="分"
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  aria-label="删除该节点"
                  onClick={() => removeNode(dayIdx, nodeIdx)}
                  disabled={busy}
                />
              </div>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => addNode(dayIdx)}
              disabled={busy}
              block
            >
              添加节点
            </Button>
          </Space>
        </Card>
      ))}

      <Space>
        <Button type="primary" size="large" loading={confirming} onClick={handleConfirm} disabled={busy}>
          {confirming ? '生成中…' : '确认生成行程'}
        </Button>
        <Button size="large" icon={<ReloadOutlined />} onClick={handleReset} disabled={busy}>
          重新上传
        </Button>
      </Space>

      {busy && <AiLoadingOverlay elapsed={elapsed} timeoutSeconds={120} />}
    </Space>
  );
}
