/** 时间与时长格式化工具 */

/** 秒 → "X小时X分"（路线耗时，不足1分钟显示"1分钟内"） */
export function formatSeconds(seconds?: number | null): string {
  if (seconds == null || seconds <= 0) return '-';
  if (seconds < 60) return '1分钟内';
  const minutes = Math.round(seconds / 60);
  return formatMinutes(minutes);
}

/** 分钟 → "X小时X分"（节点游览时长，suggestedDuration 单位为分钟） */
export function formatMinutes(minutes?: number | null): string {
  if (minutes == null || minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分`;
}
