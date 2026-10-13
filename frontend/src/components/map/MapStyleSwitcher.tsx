import { Segmented } from 'antd';
import { useEffect, useState } from 'react';
import {
  loadMapStylePref,
  saveMapStylePref,
  type MapStyleKey,
} from './mapStyles';

const OPTIONS: { value: MapStyleKey; label: string }[] = [
  { value: 'day', label: '日间' },
  { value: 'night', label: '夜间' },
  { value: 'satellite', label: '卫星' },
];

interface Props {
  /** 应用样式到地图实例 */
  onApply: (style: MapStyleKey) => void;
}

/** 地图风格切换器：日间/夜间/卫星，偏好持久化 localStorage */
export default function MapStyleSwitcher({ onApply }: Props) {
  const [style, setStyle] = useState<MapStyleKey>('day');

  // 初始化恢复本地偏好
  useEffect(() => {
    const saved = loadMapStylePref();
    setStyle(saved);
    onApply(saved);
    // 仅初始化时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (value: MapStyleKey) => {
    setStyle(value);
    saveMapStylePref(value);
    onApply(value);
  };

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
      <Segmented
        size="small"
        options={OPTIONS}
        value={style}
        onChange={(v) => handleChange(v as MapStyleKey)}
      />
    </div>
  );
}
