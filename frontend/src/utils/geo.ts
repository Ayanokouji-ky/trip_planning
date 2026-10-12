/** 地理距离格式化工具 */

/** 米 → "X.Xkm" 或 "Xm" */
export function formatDistance(meters?: number | null): string {
  if (meters == null || meters < 0) return '-';
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
