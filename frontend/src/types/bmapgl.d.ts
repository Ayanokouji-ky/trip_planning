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
  }

  class Marker extends Overlay {
    constructor(point: Point, opts?: MarkerOptions);
    setPoint(point: Point): void;
  }

  interface PolylineOptions {
    strokeColor?: string;
    strokeWeight?: number;
    strokeOpacity?: number;
    strokeStyle?: 'solid' | 'dashed';
  }

  class Polyline extends Overlay {
    constructor(points: Point[], opts?: PolylineOptions);
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

  interface MapOptions {
    minZoom?: number;
    maxZoom?: number;
    enableMapClick?: boolean;
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
    destroy(): void;
  }
}

interface Window {
  BMapGL?: typeof BMapGL;
}
