import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Button, Skeleton } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useBaiduMap } from '@/hooks/useBaiduMap';
import { useMapStore } from '@/store/mapStore';
import type { PlanNode, PlanRoute } from '@/types/plan';
import MapStyleSwitcher from './MapStyleSwitcher';
import { NIGHT_STYLE, type MapStyleKey } from './mapStyles';
import NodePopup from './NodePopup';
import RoutePopup from './RoutePopup';

/** place_type → 标记配色（景点蓝 / 餐厅橙 / 酒店紫 / 交通绿） */
const TYPE_COLORS: Record<string, string> = {
  ATTRACTION: '#1677ff',
  RESTAURANT: '#fa8c16',
  HOTEL: '#722ed1',
  TRANSPORT: '#52c41a',
  OTHER: '#8c8c8c',
};

/** transportMode → 折线线型：步行虚线、驾车实线、公交点划线（近似点线） */
const MODE_STROKE: Record<string, { style: 'solid' | 'dashed' | 'dotted'; weight: number }> = {
  driving: { style: 'solid', weight: 5 },
  walking: { style: 'dashed', weight: 4 },
  transit: { style: 'dotted', weight: 5 },
  riding: { style: 'dashed', weight: 4 },
};

/** 节点数超过该阈值时启用网格聚合 */
const CLUSTER_THRESHOLD = 50;

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** 圆角编号气泡（水滴 pin，类型配色 + 白描边） */
function numberedPin(color: string, num: number): BMapGL.Icon {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44">` +
    `<path d="M17 43 C 11 32 3 27 3 15.5 A 14 14 0 1 1 31 15.5 C 31 27 23 32 17 43 Z" ` +
    `fill="${color}" stroke="#ffffff" stroke-width="2.5"/>` +
    `<circle cx="17" cy="15.5" r="10.5" fill="rgba(255,255,255,0.22)"/>` +
    `<text x="17" y="20.5" text-anchor="middle" fill="#ffffff" font-size="13" ` +
    `font-weight="bold" font-family="Arial,sans-serif">${num}</text>` +
    `</svg>`;
  const size = new BMapGL.Size(34, 44);
  return new BMapGL.Icon(svgUrl(svg), size, {
    imageSize: size,
    anchor: new BMapGL.Size(17, 43),
  });
}

/** 起点旗帜（绿色） */
function startFlagIcon(): BMapGL.Icon {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44">` +
    `<ellipse cx="9" cy="41" rx="6" ry="2.5" fill="rgba(0,0,0,0.25)"/>` +
    `<line x1="9" y1="41" x2="9" y2="5" stroke="#087f5b" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M9 5 L30 10 L9 17 Z" fill="#12b886" stroke="#ffffff" stroke-width="2"/>` +
    `<circle cx="9" cy="41" r="3.5" fill="#087f5b" stroke="#ffffff" stroke-width="1.5"/>` +
    `</svg>`;
  const size = new BMapGL.Size(34, 44);
  return new BMapGL.Icon(svgUrl(svg), size, {
    imageSize: size,
    anchor: new BMapGL.Size(9, 43),
  });
}

/** 终点格纹旗 */
function finishFlagIcon(): BMapGL.Icon {
  const cells =
    [0, 1, 2].map((r) =>
      [0, 1, 2]
        .map((c) => {
          const fill = (r + c) % 2 === 0 ? '#f1f3f5' : '#212529';
          return `<rect x="${10 + c * 7}" y="${4 + r * 5}" width="7" height="5" fill="${fill}"/>`;
        })
        .join(''),
    ).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44">` +
    `<ellipse cx="9" cy="41" rx="6" ry="2.5" fill="rgba(0,0,0,0.25)"/>` +
    `<line x1="9" y1="41" x2="9" y2="4" stroke="#495057" stroke-width="3" stroke-linecap="round"/>` +
    `<g stroke="#ffffff" stroke-width="1.2">${cells}</g>` +
    `<circle cx="9" cy="41" r="3.5" fill="#495057" stroke="#ffffff" stroke-width="1.5"/>` +
    `</svg>`;
  const size = new BMapGL.Size(34, 44);
  return new BMapGL.Icon(svgUrl(svg), size, {
    imageSize: size,
    anchor: new BMapGL.Size(9, 43),
  });
}

/** 聚合圆点（数量） */
function clusterIcon(count: number): BMapGL.Icon {
  const r = Math.min(16 + Math.floor(count / 10) * 2, 26);
  const d = r * 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}">` +
    `<circle cx="${r}" cy="${r}" r="${r - 3}" fill="rgba(22,119,255,0.35)"/>` +
    `<circle cx="${r}" cy="${r}" r="${r - 7}" fill="#1677ff" stroke="#ffffff" stroke-width="2"/>` +
    `<text x="${r}" y="${r + 5}" text-anchor="middle" fill="#ffffff" font-size="13" ` +
    `font-weight="bold" font-family="Arial,sans-serif">${count}</text>` +
    `</svg>`;
  const size = new BMapGL.Size(d, d);
  return new BMapGL.Icon(svgUrl(svg), size, {
    imageSize: size,
    anchor: new BMapGL.Size(r, r),
  });
}

/** 颜色插值：from → to 按 t ∈ [0,1]（路线渐变：起浅终深） */
function lerpColor(from: string, to: string, t: number): string {
  const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [r1, g1, b1] = hex(from);
  const [r2, g2, b2] = hex(to);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;
}

interface ClusterItem {
  lng: number;
  lat: number;
  count: number;
}

/** 网格聚合：按当前 zoom 将邻近点合并为聚合点 */
function clusterPoints(nodes: PlanNode[], zoom: number): ClusterItem[] {
  const cellDeg = 360 / Math.pow(2, zoom + 1);
  const buckets = new Map<string, { lng: number; lat: number; count: number }>();
  nodes.forEach((n) => {
    const key = `${Math.floor(n.lng! / cellDeg)}:${Math.floor(n.lat! / cellDeg)}`;
    const cur = buckets.get(key);
    if (cur) {
      cur.lng += n.lng!;
      cur.lat += n.lat!;
      cur.count += 1;
    } else {
      buckets.set(key, { lng: n.lng!, lat: n.lat!, count: 1 });
    }
  });
  return [...buckets.values()].map((b) => ({
    lng: b.lng / b.count,
    lat: b.lat / b.count,
    count: b.count,
  }));
}

interface PopupState {
  kind: 'node' | 'route';
  node?: PlanNode;
  route?: PlanRoute;
  from?: PlanNode;
  to?: PlanNode;
  point: BMapGL.Point;
}

interface Props {
  /** 当前可见节点（已按天筛选），无坐标的会被跳过 */
  nodes: PlanNode[];
  /** 路线（from/to 不在可见节点中的会被跳过） */
  routes: PlanRoute[];
  /** 容器高度（数字 px 或 CSS 长度，如 '60vh'） */
  height?: number | string;
}

/** 百度地图容器：类型配色标记 + 起终点旗 + 线型渐变路线 + 3D 视角 + 风格切换 + 聚合 */
export default function BaiduMapContainer({ nodes, routes, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, ready, error } = useBaiduMap(containerRef);
  const { selectedNodeId, hoveredNodeId, setHoveredNode, selectNode } = useMapStore();

  const [popup, setPopup] = useState<PopupState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const popupContainer = useMemo(() => document.createElement('div'), []);
  const markersRef = useRef<Map<number, BMapGL.Marker>>(new Map());

  const located = useMemo(
    () => nodes.filter((n) => n.lat != null && n.lng != null),
    [nodes],
  );
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  /** 应用底图风格：日间恢复默认 / 夜间个性样式 / 卫星切底图类型 */
  const applyMapStyle = (style: MapStyleKey) => {
    if (!map) return;
    if (style === 'satellite') {
      map.setMapType(BMapGL.SATELLITE_MAP);
      return;
    }
    map.setMapType(BMapGL.NORMAL_MAP);
    map.setMapStyleV2({ styleJson: style === 'night' ? NIGHT_STYLE : [] });
  };

  /** 绘制标记与折线（数据/天筛选变化时重绘；>50 节点启用网格聚合） */
  useEffect(() => {
    if (!map) return;
    map.clearOverlays();
    markersRef.current.clear();

    if (located.length > CLUSTER_THRESHOLD) {
      const renderCluster = () => {
        map.clearOverlays();
        clusterPoints(located, map.getZoom()).forEach((c) => {
          const marker = new BMapGL.Marker(
            new BMapGL.Point(c.lng, c.lat),
            { icon: clusterIcon(c.count) },
          );
          marker.addEventListener('click', () => map.setZoom(map.getZoom() + 2));
          map.addOverlay(marker);
        });
      };
      renderCluster();
      map.addEventListener('zoomend', renderCluster);
      return () => {
        map.removeEventListener('zoomend', renderCluster);
      };
    }

    const points: BMapGL.Point[] = [];

    located.forEach((node, idx) => {
      const point = new BMapGL.Point(node.lng!, node.lat!);
      points.push(point);
      const isFirst = idx === 0;
      const isLast = idx === located.length - 1 && located.length > 1;
      const marker = new BMapGL.Marker(point, {
        icon: isFirst
          ? startFlagIcon()
          : isLast
            ? finishFlagIcon()
            : numberedPin(
                TYPE_COLORS[node.placeType ?? 'OTHER'] ?? TYPE_COLORS.OTHER,
                node.orderIndex + 1,
              ),
        title: node.placeName,
      });
      marker.addEventListener('click', () => {
        selectNode(node.id);
        setPopup({ kind: 'node', node, point });
      });
      marker.addEventListener('mouseover', () => setHoveredNode(node.id));
      marker.addEventListener('mouseout', () => setHoveredNode(null));
      markersRef.current.set(node.id, marker);
      map.addOverlay(marker);
    });

    const total = Math.max(routes.length - 1, 1);
    routes.forEach((route, i) => {
      const from = nodeById.get(route.fromNodeId);
      const to = nodeById.get(route.toNodeId);
      if (!from || !to || from.lat == null || from.lng == null || to.lat == null || to.lng == null) {
        return;
      }
      const mode = MODE_STROKE[route.transportMode] ?? MODE_STROKE.walking;
      const color = lerpColor('#91caff', '#0958d9', i / total);
      const line = new BMapGL.Polyline(
        [new BMapGL.Point(from.lng, from.lat), new BMapGL.Point(to.lng, to.lat)],
        { strokeColor: color, strokeWeight: mode.weight, strokeOpacity: 0.75, strokeStyle: mode.style },
      );
      // hover 加粗高亮
      line.addEventListener('mouseover', () => {
        line.setStrokeWeight(mode.weight + 2);
        line.setStrokeOpacity(1);
      });
      line.addEventListener('mouseout', () => {
        line.setStrokeWeight(mode.weight);
        line.setStrokeOpacity(0.75);
      });
      line.addEventListener('click', (e) => {
        const latlng = (e as { latlng?: { lng: number; lat: number } } | undefined)?.latlng;
        const point = latlng
          ? new BMapGL.Point(latlng.lng, latlng.lat)
          : new BMapGL.Point(to.lng!, to.lat!);
        setPopup({ kind: 'route', route, from, to, point });
      });
      map.addOverlay(line);
    });

    if (points.length > 0) {
      map.setViewport(points, { margins: [60, 60, 60, 60] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, located, routes, nodeById]);

  /** 3D 视角：详情页默认 3D 视角 */
  useEffect(() => {
    if (!map) return;
    map.setTilt(60);
    map.setHeading(0);
  }, [map]);

  /** 全屏切换（Fullscreen API）：跟踪状态以切换按钮图标 */
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (document.fullscreenEnabled) {
      el.requestFullscreen().catch(() => {});
    }
  };

  /** ResizeObserver：容器尺寸变化（全屏切换/抽屉开合/旋转屏幕）通知地图重算 */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !map || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);

  /** dev 调试句柄：供冒烟测试读取 zoom / 驱动地图 */
  useEffect(() => {
    if (import.meta.env.DEV && map) {
      (window as unknown as { __tripMap?: BMapGL.Map }).__tripMap = map;
    }
  }, [map]);

  /** hover 联动：地图标记 hover 的节点跳动；其他标记复位 */
  useEffect(() => {
    markersRef.current.forEach((marker, nodeId) => {
      marker.setAnimation(hoveredNodeId === nodeId ? BMapGL.Animation.BOUNCE : null);
    });
  }, [hoveredNodeId]);

  /** InfoWindow 打开/关闭管理 */
  useEffect(() => {
    if (!map) return;
    if (!popup) {
      map.closeInfoWindow();
      return;
    }
    const infoWindow = new BMapGL.InfoWindow(popupContainer, {
      width: 280,
      enableCloseOnClick: true,
    });
    infoWindow.addEventListener('close', () => setPopup(null));
    map.openInfoWindow(infoWindow, popup.point);
  }, [map, popup, popupContainer]);

  /** 侧栏 NodeCard 点击 → 地图定位并弹窗 */
  useEffect(() => {
    if (!map || selectedNodeId == null) return;
    const node = nodeById.get(selectedNodeId);
    if (!node || node.lat == null || node.lng == null) return;
    const point = new BMapGL.Point(node.lng, node.lat);
    map.panTo(point);
    setPopup((prev) =>
      prev?.kind === 'node' && prev.node?.id === node.id ? prev : { kind: 'node', node, point },
    );
  }, [map, selectedNodeId, nodeById]);

  return (
    <div
      className="map-container"
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {!ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            justifyContent: 'center',
            background: '#fafafa',
            zIndex: 1,
          }}
        >
          {error ? (
            <Alert type="warning" showIcon message={error} style={{ maxWidth: 320 }} />
          ) : (
            <>
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
              <span style={{ color: '#999', textAlign: 'center' }}>
                地图资源加载中，底图瓦片可能需要数秒…
              </span>
            </>
          )}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {ready && map && (
        <>
          <MapStyleSwitcher onApply={applyMapStyle} />
          {/* 全屏沉浸模式（Fullscreen API），不支持时隐藏 */}
          {document.fullscreenEnabled !== false && (
            <Button
              className="map-fullscreen-btn"
              type="default"
              size="small"
              aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          )}
        </>
      )}
      {popup?.kind === 'node' && popup.node
        ? createPortal(<NodePopup node={popup.node} />, popupContainer)
        : null}
      {popup?.kind === 'route' && popup.route
        ? createPortal(
            <RoutePopup route={popup.route} from={popup.from} to={popup.to} />,
            popupContainer,
          )
        : null}
    </div>
  );
}
