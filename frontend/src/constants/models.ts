/**
 * AI 模型清单常量（与后端 ModelConstants 对齐，来源：API.md）
 */

export interface ModelOption {
  /** 模型 ID（传给后端生成接口的 model 参数） */
  id: string;
  /** 展示名称 */
  label: string;
  /** 简短标签：推荐 / 质量优先 / 速度快 / 国产 / GA 稳定 */
  tag: string;
  /** 描述说明 */
  description: string;
}

/** 默认文本模型 */
export const DEFAULT_TEXT_MODEL = 'deepseek-v4-1-flash-260910';
/** 默认识图模型 */
export const DEFAULT_IMAGE_MODEL = 'doubao-seed-2-1-pro-260915';

/** 文本模型白名单 */
export const TEXT_MODELS: ModelOption[] = [
  { id: 'deepseek-v4-1-flash-260910', label: 'DeepSeek V4.1 Flash', tag: '推荐', description: '默认模型，速度与质量均衡' },
  { id: 'deepseek-v4-pro-260425', label: 'DeepSeek V4 Pro', tag: '质量优先', description: '生成质量最高，耗时较长' },
  { id: 'glm-5-3-flash-260828', label: 'GLM-5-3 Flash', tag: '国产轻量', description: '国产模型，轻量快速' },
  { id: 'deepseek-v4-pro-ga-260813', label: 'DeepSeek V4 Pro GA', tag: 'GA 稳定', description: 'GA 稳定版，适合生产环境' },
  { id: 'deepseek-v4-flash-ga-260731', label: 'DeepSeek V4 Flash GA', tag: 'GA 轻量', description: 'GA 轻量版，响应快' },
  { id: 'glm-5-2-260617', label: 'GLM-5-2', tag: '国产', description: 'GLM 基础版' },
];

/** 识图模型白名单 */
export const IMAGE_MODELS: ModelOption[] = [
  { id: 'doubao-seed-2-1-pro-260915', label: '豆包 Seed 2.1 Pro', tag: '质量优先', description: '默认识图模型，识别精度最高' },
  { id: 'doubao-seed-2-1-turbo-260628', label: '豆包 Seed 2.1 Turbo', tag: '均衡', description: '速度与精度均衡' },
  { id: 'doubao-seed-2-1-lite-260915', label: '豆包 Seed 2.1 Lite', tag: '速度快', description: '速度优先，适合批量识图' },
];

/** 模型标签颜色映射 */
export const MODEL_TAG_COLORS: Record<string, string> = {
  推荐: 'blue',
  质量优先: 'purple',
  均衡: 'cyan',
  速度快: 'green',
  国产: 'geekblue',
  国产轻量: 'geekblue',
  'GA 稳定': 'gold',
  'GA 轻量': 'lime',
};
