import { Spin, Typography } from 'antd';

const { Text, Title } = Typography;

interface Props {
  /** 已等待秒数 */
  elapsed: number;
  /** 超时阈值（秒），AI 生成请求使用 120s */
  timeoutSeconds?: number;
}

function stageText(elapsed: number, timeout: number): string {
  if (elapsed >= timeout) return '请求已超时，请关闭后重试';
  if (elapsed >= timeout * 0.75) return '正在计算路线距离与耗时…';
  if (elapsed >= timeout * 0.4) return '正在逐一定位地点坐标…';
  if (elapsed >= timeout * 0.15) return 'AI 正在规划景点与日程安排…';
  return '正在理解你的旅行需求…';
}

/** AI 生成全屏加载遮罩：Spin + 已用时间倒计时 + 阶段提示 */
export default function AiLoadingOverlay({ elapsed, timeoutSeconds = 60 }: Props) {
  const nearTimeout = elapsed >= timeoutSeconds - 10;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '40px 56px',
          textAlign: 'center',
          minWidth: 320,
          maxWidth: 420,
        }}
      >
        <Spin size="large" />
        <Title level={5} style={{ marginTop: 24, marginBottom: 8 }}>
          AI 正在生成行程
        </Title>
        <Text type="secondary">通常需要 30-60 秒，请保持页面打开</Text>
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ fontSize: 20 }}>
            {elapsed}s
          </Text>
          <Text type="secondary"> / {timeoutSeconds}s</Text>
        </div>
        <Text type={nearTimeout ? 'warning' : 'secondary'} style={{ display: 'block', marginTop: 8 }}>
          {stageText(elapsed, timeoutSeconds)}
        </Text>
      </div>
    </div>
  );
}
