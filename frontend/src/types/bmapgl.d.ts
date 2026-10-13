/** 百度地图 GL JS API（BMapGL）最小类型声明 */

declare namespace BMapGL {
  class Point {
    constructor(lng: number, lat: number);
    lng: number;
    lat: number;
  }

  class Size {
    constructor(width: number, height: number);
    width: number;
    height: number;
  }

  interface IconOptions {
    anchor?: Size;
    imageSize?: Size;
  }

  class Icon {
    constructor(url: string, size: Size, opts?: IconOptions);
  }

  type EventCallback = (e?: unknown) => void;

  class Overlay {
    addEventListener(event: string, cb: EventCallback): void;
    removeEventListener(event: string, cb: EventCallback): void;
  }

  interface MarkerOptions {
    icon?: Icon;
    title?: string;
    offset?: Size;
  }

  class Marker extends Overlay {
    constructor(point: Point, opts?: MarkerOptions);
    setPoint(point: Point): void;
    setAnimation(animation: Animation | null): void;
  }

  /** 标记动画（运行时由 BMapGL 提供，ambient enum 不参与内联） */
  enum Animation {
    BOUNCE = 1,
    DROP = 2,
    SCALE = 3,
    THROW = 4,
  }

  interface PolylineOptions {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    enableEditing?: boolean;
  }

  class Polyline extends Overlay {
    constructor(points: Point[], opts?: PolylineOptions);
    setStrokeColor(color: string): void;
    setStrokeWeight(weight: number): void;
    setStrokeOpacity(opacity: number): void;
    setStrokeStyle(style: 'solid' | 'dashed' | 'dotted'): void;
  }

  interface InfoWindowOptions {
    width?: number;
    height?: number;
    title?: string;
    offset?: Size;
    enableCloseOnClick?: boolean;
  }

  class InfoWindow {
    constructor(content: string | HTMLElement, opts?: InfoWindowOptions);
    addEventListener(event: string, cb: EventCallback): void;
    removeEventListener(event: string, cb: EventCallback): void;
  }

  interface ViewportOptions {
    margins?: number[];
    zoomFactor?: number;
    delay?: number;
  }

  /** 地图底图类型（运行时由 BMapGL 提供） */
  type MapType = unknown;

  const NORMAL_MAP: MapType;
  const SATELLITE_MAP: MapType;
  const EARTH_MAP: MapType;

  /** 个性地图样式规则（featureType/elementType/stylers） */
  interface StyleJsonItem {
    featureType: string;
    elementType: string;
    stylers: Record<string, string | number>;
  }

  interface MapStyleOptions {
    styleId?: string;
    styleJson?: StyleJsonItem[] | null;
  }

  interface MapOptions {
    minZoom?: number;
    maxZoom?: number;
    enableMapClick?: boolean;
    mapType?: MapType;
  }

  class Map {
    constructor(container: HTMLElement | string, opts?: MapOptions);
    centerAndZoom(point: Point, zoom: number): void;
    setCenter(point: Point): void;
    setZoom(zoom: number): void;
    getZoom(): number;
    addOverlay(overlay: Overlay): void;
    removeOverlay(overlay: Overlay): void;
    clearOverlays(): void;
    panTo(point: Point): void;
    setViewport(points: Point[], opts?: ViewportOptions): void;
    openInfoWindow(infoWindow: InfoWindow, point: Point): void;
    closeInfoWindow(): void;
    enableScrollWheelZoom(enable: boolean): void;
    /** 3D 视角：俯仰角（0 俯视，60 立体）与旋转角 */
    setTilt(tilt: number): void;
    setHeading(heading: number): void;
    getTilt(): number;
    /** 容器尺寸变化后重算地图（全屏/抽屉开合等场景） */
    resize(): void;
    /** 底图类型与个性样式切换 */
    setMapType(type: MapType): void;
    setMapStyleV2(opts?: MapStyleOptions): void;
    addEventListener(event: string, cb: EventCallback): unknown;
    removeEventListener(event: string, cb?: EventCallback): void;
    destroy(): void;
  }
}

interface Window {
  BMapGL?: typeof BMapGL;
}
