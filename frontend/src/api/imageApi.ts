import { client } from './client';
import type {
  AiGenerateResponse,
  ImageImportConfirmRequest,
  ImageImportResponse,
} from '@/types/ai';

export const imageApi = {
  /** 上传图片识图（多图 multipart，识图耗时较长，单独放宽到 120s） */
  recognize: (files: File[], model?: string) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    if (model) form.append('model', model);
    // 不显式设置 Content-Type，交给 axios 自动生成 multipart boundary
    return client.post<ImageImportResponse>('/ai/image-import', form, { timeout: 120000 });
  },

  /** 确认识别结果（可含编辑）→ 正式生成行程 */
  confirm: (req: ImageImportConfirmRequest) =>
    client.post<AiGenerateResponse>('/ai/image-import/confirm', req, { timeout: 120000 }),
};
