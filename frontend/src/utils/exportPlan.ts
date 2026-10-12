import html2canvas from 'html2canvas-pro';
import type { PlanDetailResponse } from '@/types/plan';

/** 文件名合法化（去掉 Windows 非法字符） */
function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || '行程';
}

function triggerDownload(href: string, filename: string, revoke = true) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) {
    // 延迟释放，确保下载已开始
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
}

/** 导出完整行程 JSON（plan + days + nodes + routes） */
export function exportPlanJson(detail: PlanDetailResponse): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    plan: detail.plan,
    days: detail.days,
    nodes: detail.nodes,
    routes: detail.routes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(
    URL.createObjectURL(blob),
    `${sanitizeFileName(detail.plan.title)}-行程.json`,
  );
}

/**
 * 将指定 DOM 元素导出为 PNG 图片。
 * 克隆文档中带 .export-ignore 标记的元素（编辑按钮、拖拽手柄等）会被移除。
 */
export async function exportElementPng(element: HTMLElement, title: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    onclone: (doc) => {
      // 移除操作类 UI：拖拽手柄/自定义忽略标记/卡片编辑删除按钮条
      doc
        .querySelectorAll('.export-ignore, .ant-card-actions')
        .forEach((node) => node.remove());
    },
  });
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图片生成失败'));
        return;
      }
      triggerDownload(URL.createObjectURL(blob), `${sanitizeFileName(title)}-行程.png`);
      resolve();
    }, 'image/png');
  });
}
