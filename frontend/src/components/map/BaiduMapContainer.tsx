import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Spin } from 'antd';
import { useBaiduMap } from '@/hooks/useBaiduMap';
import { useMapStore } from '@/store/mapStore';
import type { PlanNode, PlanRoute } from '@/types/plan';
import NodePopup from './NodePopup';
import RoutePopup from './RoutePopup';

/** place_type → 标记颜色 */
const TYPE_COLORS: Record<string, string> = {
  ATTRACTION: '#1677ff',
  RESTAURANT: '#fa8c16',
  HOTEL: '#722ed1',
  TRANSPORT: '#13c2c2',
  OTHER: '#8c8c8c',
};

/** 生成带编号的圆形 SVG 标记图标 */
function numberedIcon(color: string, num: number): BMapGL.Icon {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">` +
    `<circle cx="16" cy="16" r="14" fill="${color}" stroke="#ffffff" stroke-width="2.5"/>` +
    `<text x="16" y="21.5" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="bold" font-family="Arial,sans-serif">${num}</text>` +
    `</svg>`;
  const size = new BMapGL.Size(32, 32);
  return new BMapGL.Icon(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    size,
    { imageSize: size },
  );
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
  height?: number;
}

/** 百度地图容器：编号标记 + 路线折线 + InfoWindow 弹窗 + 视口自适应 */
export default function BaiduMapContainer({ nodes, routes, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { map, ready, error } = useBaiduMap(containerRef);
  const { selectedNodeId, selectNode } = useMapStore();

  const [popup, setPopup] = useState<PopupState | null>(null);
  const popupContainer = useMemo(() => document.createElement('div'), []);

  const located = useMemo(
    () => nodes.filter((n) => n.lat != null && n.lng != null),
    [nodes],
  );
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  /** 绘制标记与折线（数据/天筛选变化时重绘） */
  useEffect(() => {
    if (!map) return;
    map.clearOverlays();

    const points: BMapGL.Point[] = [];

    located.forEach((node) => {
      const point = new BMapGL.Point(node.lng!, node.lat!);
      points.push(point);
      const marker = new BMapGL.Marker(point, {
        icon: numberedIcon(
          TYPE_COLORS[node.placeType ?? 'OTHER'] ?? TYPE_COLORS.OTHER,
          node.orderIndex + 1,
        ),
        title: node.placeName,
      });
      marker.addEventListener('click', () => {
        selectNode(node.id);
        setPopup({ kind: 'node', node, point });
      });
      map.addOverlay(marker);
    });

    routes.forEach((route) => {
      const from = nodeById.get(route.fromNodeId);
      const to = nodeById.get(route.toNodeId);
      if (!from || !to || from.lat == null || from.lng == null || to.lat == null || to.lng == null) {
        return;
      }
      const line = new BMapGL.Polyline(
        [new BMapGL.Point(from.lng, from.lat), new BMapGL.Point(to.lng, to.lat)],
        { strokeColor: '#1677ff', strokeWeight: 4, strokeOpacity: 0.65 },
      );
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
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            zIndex: 1,
          }}
        >
          <Spin />
          {error ? (
            <Alert type="warning" showIcon message={error} style={{ maxWidth: 320 }} />
          ) : (
            <span style={{ color: '#999' }}>地图加载中...</span>
          )}
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
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
