export type MapStyleKey = 'day' | 'night' | 'satellite';

const STORAGE_KEY = 'trip.mapStyle';

/** 夜间样式：深色底 + 低饱和道路 + 高亮水系（精简版个性样式） */
export const NIGHT_STYLE: BMapGL.StyleJsonItem[] = [
  { featureType: 'background', elementType: 'geometry', stylers: { color: '#141a26' } },
  { featureType: 'land', elementType: 'geometry', stylers: { color: '#141a26' } },
  { featureType: 'water', elementType: 'geometry', stylers: { color: '#0e2a47' } },
  { featureType: 'green', elementType: 'geometry', stylers: { color: '#16301f' } },
  { featureType: 'highway', elementType: 'geometry.fill', stylers: { color: '#2b3a55' } },
  { featureType: 'highway', elementType: 'geometry.stroke', stylers: { color: '#1b2436' } },
  { featureType: 'arterial', elementType: 'geometry.fill', stylers: { color: '#232e44' } },
  { featureType: 'arterial', elementType: 'geometry.stroke', stylers: { color: '#1b2436' } },
  { featureType: 'local', elementType: 'geometry.fill', stylers: { color: '#1d2740' } },
  { featureType: 'road', elementType: 'labels', stylers: { visibility: 'on' } },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: { color: '#7d8ba1' } },
  { featureType: 'road', elementType: 'labels.text.stroke', stylers: { color: '#141a26' } },
  { featureType: 'building', elementType: 'geometry.fill', stylers: { color: '#1f2739' } },
  { featureType: 'poilabel', elementType: 'labels.text.fill', stylers: { color: '#6b7a94' } },
  { featureType: 'districtlabel', elementType: 'labels.text.fill', stylers: { color: '#93a3bd' } },
  { featureType: 'subway', elementType: 'geometry', stylers: { color: '#2a3a5c' } },
  { featureType: 'manmade', elementType: 'geometry', stylers: { color: '#1a2338' } },
];

const VALID: MapStyleKey[] = ['day', 'night', 'satellite'];

/** 读取本地偏好（非法/缺省回退 day） */
export function loadMapStylePref(): MapStyleKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as MapStyleKey | null;
    return v && VALID.includes(v) ? v : 'day';
  } catch {
    return 'day';
  }
}

export function saveMapStylePref(style: MapStyleKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // localStorage 不可用时忽略
  }
}
