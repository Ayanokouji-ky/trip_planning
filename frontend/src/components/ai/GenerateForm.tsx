import { Button, DatePicker, Form, Input, InputNumber, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import type { AiGenerateRequest } from '@/types/ai';

const { TextArea } = Input;

export interface GenerateFormValues {
  destination: string;
  days: number;
  startDate?: Dayjs;
  peopleCount?: number;
  budgetLevel?: string;
  preferences?: string[];
  extraRequirement?: string;
}

interface Props {
  submitting: boolean;
  onSubmit: (values: GenerateFormValues, payload: AiGenerateRequest) => void;
}

const PREFERENCE_OPTIONS = [
  { value: '美食', label: '特色美食' },
  { value: '历史人文', label: '历史人文' },
  { value: '自然风光', label: '自然风光' },
  { value: '亲子游', label: '亲子游' },
  { value: '购物', label: '购物' },
  { value: '夜生活', label: '夜生活' },
  { value: '小众打卡', label: '小众打卡' },
  { value: '休闲度假', label: '休闲度假' },
];

const BUDGET_OPTIONS = [
  { value: '经济穷游', label: '经济穷游（节省开支）' },
  { value: '适中', label: '适中（性价比优先）' },
  { value: '品质舒适', label: '品质舒适（不亏待自己）' },
];

/** 结构化字段拼接为后端 requirement 自由文本 */
export function buildRequirement(values: GenerateFormValues): string {
  const parts: string[] = [`目的地：${values.destination}`, `天数：${values.days}天`];
  if (values.startDate) parts.push(`出发日期：${values.startDate.format('YYYY-MM-DD')}`);
  if (values.peopleCount) parts.push(`人数：${values.peopleCount}人`);
  if (values.budgetLevel) parts.push(`预算档位：${values.budgetLevel}`);
  if (values.preferences?.length) parts.push(`偏好：${values.preferences.join('、')}`);
  if (values.extraRequirement?.trim()) parts.push(`特殊需求：${values.extraRequirement.trim()}`);
  return parts.join('；') + '。';
}

/** AI 行程生成表单 */
export default function GenerateForm({ submitting, onSubmit }: Props) {
  const [form] = Form.useForm<GenerateFormValues>();

  const handleFinish = (raw: GenerateFormValues) => {
    // mode="tags" 的 Select 提交值为数组，归一化为单个城市名
    const dest = Array.isArray(raw.destination)
      ? String(raw.destination[0] ?? '')
      : raw.destination;
    const values: GenerateFormValues = { ...raw, destination: dest };
    const payload: AiGenerateRequest = {
      requirement: buildRequirement(values),
      title: `${dest}${values.days}日游`,
    };
    onSubmit(values, payload);
  };

  return (
    <Form<GenerateFormValues>
      form={form}
      layout="vertical"
      initialValues={{ days: 2, preferences: ['美食'] }}
      onFinish={handleFinish}
      disabled={submitting}
      // 阻止普通输入框 Enter 隐式提交；Select/TextArea/按钮内的回车放行（Select 用回车确认标签）
      onKeyDown={(e) => {
        const el = e.target as HTMLElement;
        if (
          e.key === 'Enter' &&
          el.tagName === 'INPUT' &&
          !el.closest('.ant-select')
        ) {
          e.preventDefault();
        }
      }}
    >
      <Form.Item
        name="destination"
        label="目的地"
        rules={[{ required: true, message: '请输入目的地城市' }]}
      >
        <Select
          showSearch
          placeholder="如：成都、杭州、西安"
          options={['成都', '杭州', '西安', '重庆', '北京', '上海', '广州', '厦门', '丽江', '三亚'].map(
            (city) => ({ value: city, label: city }),
          )}
          mode="tags"
          maxCount={1}
          allowClear
        />
      </Form.Item>

      <Form.Item
        name="days"
        label="游玩天数"
        rules={[{ required: true, message: '请输入天数' }]}
      >
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber min={1} max={15} style={{ width: '100%' }} />
          <Button disabled>天</Button>
        </Space.Compact>
      </Form.Item>

      <Form.Item name="startDate" label="出发日期（可选）">
        <DatePicker
          style={{ width: '100%' }}
          disabledDate={(current) => !!current && current.isBefore(dayjs().startOf('day'))}
          placeholder="选择出发日期"
        />
      </Form.Item>

      <Form.Item name="peopleCount" label="出行人数（可选）">
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber min={1} max={50} style={{ width: '100%' }} />
          <Button disabled>人</Button>
        </Space.Compact>
      </Form.Item>

      <Form.Item name="budgetLevel" label="预算档位（可选）">
        <Select allowClear placeholder="选择预算档位" options={BUDGET_OPTIONS} />
      </Form.Item>

      <Form.Item name="preferences" label="偏好（可多选）">
        <Select mode="multiple" placeholder="选择旅行偏好" options={PREFERENCE_OPTIONS} />
      </Form.Item>

      <Form.Item name="extraRequirement" label="特殊需求（可选）">
        <TextArea
          rows={3}
          maxLength={500}
          showCount
          placeholder="如：必看大熊猫、不吃辣、需要安排亲子酒店、行程节奏轻松一些…"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
          {submitting ? '生成中…' : '生成行程'}
        </Button>
      </Form.Item>
    </Form>
  );
}
