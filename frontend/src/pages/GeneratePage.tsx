import { useEffect, useRef, useState } from 'react';
import { Card, Tabs, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '@/api/aiApi';
import { usePlanStore } from '@/store/planStore';
import Disclaimer from '@/components/common/Disclaimer';
import GenerateForm, { type GenerateFormValues } from '@/components/ai/GenerateForm';
import AiLoadingOverlay from '@/components/ai/AiLoadingOverlay';
import ImageImportPanel from '@/components/image/ImageImportPanel';
import type { AiGenerateRequest } from '@/types/ai';

const { Title, Paragraph } = Typography;

/** AI 生成页：结构化表单 → 全屏加载（倒计时）→ 成功跳转详情 / 失败保留重试 */
export default function GeneratePage() {
  const navigate = useNavigate();
  const setCurrent = usePlanStore((s) => s.setCurrent);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
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

  const handleSubmit = async (_values: GenerateFormValues, payload: AiGenerateRequest) => {
    setSubmitting(true);
    startTimer();
    try {
      const { plan, degraded, modelUsed } = await aiApi.generate(payload);
      setCurrent(plan);
      if (degraded) {
        message.warning(`所选模型不可用，已降级为 ${modelUsed}`);
      }
      navigate(`/plans/${plan.plan.id}`);
    } catch {
      // 拦截器已统一 message 提示；表单值保留，用户可直接重试
    } finally {
      stopTimer();
      setSubmitting(false);
    }
  };

  return (
    <div className="generate-page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <Disclaimer />
      <div className="generate-hero">
        <Title level={3} style={{ color: '#fff', marginBottom: 4 }}>
          AI 生成行程
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 0 }}>
          填写旅行需求由 AI 生成攻略，或上传攻略 / 行程图片由 AI 识别后生成行程。
        </Paragraph>
      </div>
      <Card className="generate-card" style={{ marginTop: 16 }}>
        <Tabs
          defaultActiveKey="text"
          items={[
            {
              key: 'text',
              label: '文本生成',
              children: (
                <>
                  <GenerateForm submitting={submitting} onSubmit={handleSubmit} />
                  {submitting && <AiLoadingOverlay elapsed={elapsed} timeoutSeconds={120} />}
                </>
              ),
            },
            {
              key: 'image',
              label: '图片导入',
              children: <ImageImportPanel />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
