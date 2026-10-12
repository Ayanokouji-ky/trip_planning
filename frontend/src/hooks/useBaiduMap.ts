import { useEffect, useState, type RefObject } from 'react';
import { loadBaiduMapScript } from '@/utils/loadBaiduMap';

interface UseBaiduMapResult {
  map: BMapGL.Map | null;
  ready: boolean;
  error: string | null;
}

/** 动态加载百度地图 GL 脚本并在容器上初始化地图实例 */
export function useBaiduMap(containerRef: RefObject<HTMLDivElement | null>): UseBaiduMapResult {
  const [map, setMap] = useState<BMapGL.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let mapInstance: BMapGL.Map | null = null;

    loadBaiduMapScript()
      .then(() => {
        if (disposed || mapInstance) return;
        try {
          mapInstance = new BMapGL.Map(container, { enableMapClick: false });
          // 默认中心（成都），加载数据后会 setViewport 覆盖
          mapInstance.centerAndZoom(new BMapGL.Point(104.0665, 30.5723), 12);
          mapInstance.enableScrollWheelZoom(true);
          setMap(mapInstance);
        } catch {
          if (!disposed) setError('地图初始化失败，请刷新重试');
        }
      })
      .catch((e: Error) => {
        if (!disposed) setError(e.message || '百度地图脚本加载失败，请检查网络后刷新');
      });

    return () => {
      disposed = true;
      mapInstance?.destroy();
    };
  }, [containerRef]);

  return { map, ready: map !== null, error };
}
