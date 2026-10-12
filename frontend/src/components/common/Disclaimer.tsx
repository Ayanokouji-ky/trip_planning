import { Alert } from 'antd';

/** "仅供参考" 免责声明 */
export default function Disclaimer() {
  return (
    <Alert
      type="warning"
      showIcon
      message="行程内容由 AI 生成，门票、开放时间、价格等信息仅供参考，出行前请以官方渠道为准。"
      style={{ borderRadius: 0 }}
    />
  );
}
