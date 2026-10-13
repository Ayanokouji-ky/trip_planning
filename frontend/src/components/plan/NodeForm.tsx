import { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
} from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import type { PlanNode, NodeSaveRequest } from '@/types/plan';
import type { NodeEnrichResponse } from '@/types/ai';
import { aiApi } from '@/api/aiApi';

const { TextArea } = Input;

/** 合法节点类型（与后端枚举一致） */
const PLACE_TYPES = ['ATTRACTION', 'RESTAURANT', 'HOTEL', 'TRANSPORT', 'OTHER'];

interface Props {
  open: boolean;
  /** 编辑时传入已有节点；新增时传 null */
  node: PlanNode | null;
  /** 目标天（新增时必填） */
  dayId: number;
  submitting: boolean;
  onSubmit: (values: NodeSaveRequest) => void;
  onCancel: () => void;
}

/** 新增/编辑节点弹窗表单（Phase 18：支持按名称 AI 填充） */
export default function NodeForm({ open, node, dayId, submitting, onSubmit, onCancel }: Props) {
  const [form] = Form.useForm<NodeSaveRequest>();
  const [enriching, setEnriching] = useState(false);
  const placeName = Form.useWatch('placeName', form);

  useEffect(() => {
    if (open) {
      if (node) {
        form.setFieldsValue({
          dayId: node.dayId,
          placeName: node.placeName,
          placeType: node.placeType,
          suggestedDuration: node.suggestedDuration,
          highlight: node.highlight,
          description: node.description,
          openTime: node.openTime,
          ticketInfo: node.ticketInfo,
          estimatedCost: node.estimatedCost,
          note: node.note,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ dayId, placeType: 'ATTRACTION' });
      }
    }
  }, [open, node, dayId, form]);

  /** Phase 18：按地点名称调用 AI 填充其余字段（全部可编辑） */
  const handleEnrich = async () => {
    const name = (placeName || '').trim();
    if (!name) {
      message.warning('请先输入地点名称');
      return;
    }
    setEnriching(true);
    try {
      const res: NodeEnrichResponse = await aiApi.enrichNode({ name });
      form.setFieldsValue({
        placeType: res.placeType && PLACE_TYPES.includes(res.placeType) ? res.placeType : 'OTHER',
        suggestedDuration: res.suggestedDuration ?? undefined,
        highlight: res.highlight ?? undefined,
        description: res.description ?? undefined,
        openTime: res.openTime ?? undefined,
        ticketInfo: res.ticketInfo ?? undefined,
        estimatedCost: res.estimatedCost ?? undefined,
      });
      message.success('AI 填充完成，字段可继续修改');
    } catch {
      // client 拦截器已提示具体错误；此处引导手动填写
      message.info('AI 填充失败，请手动填写相关字段');
    } finally {
      setEnriching(false);
    }
  };

  return (
    <Modal
      title={node ? '编辑节点' : '新增节点'}
      open={open}
      confirmLoading={submitting}
      onOk={() => form.validateFields().then(onSubmit)}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="dayId" hidden>
          <InputNumber />
        </Form.Item>
        <Form.Item label="地点名称" required style={{ marginBottom: 16 }}>
          <Space.Compact block>
            <Form.Item
              name="placeName"
              noStyle
              rules={[{ required: true, message: '请输入地点名称' }]}
            >
              <Input placeholder="如：宽窄巷子（输入后可点 AI 填充）" maxLength={100} />
            </Form.Item>
            <Button
              type="primary"
              ghost
              icon={<ThunderboltOutlined />}
              loading={enriching}
              disabled={!(placeName || '').trim()}
              onClick={handleEnrich}
            >
              AI 填充
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item name="placeType" label="类型" initialValue="ATTRACTION">
          <Select
            options={[
              { value: 'ATTRACTION', label: '景点' },
              { value: 'RESTAURANT', label: '餐饮' },
              { value: 'HOTEL', label: '住宿' },
              { value: 'TRANSPORT', label: '交通' },
              { value: 'OTHER', label: '其他' },
            ]}
          />
        </Form.Item>
        <Form.Item name="suggestedDuration" label="建议游览时长（分钟）">
          <InputNumber min={1} max={1440} style={{ width: '100%' }} placeholder="如 120" />
        </Form.Item>
        <Form.Item name="highlight" label="亮点">
          <TextArea rows={2} placeholder="一句话亮点推荐" maxLength={500} />
        </Form.Item>
        <Form.Item name="description" label="详细描述">
          <TextArea rows={3} maxLength={2000} />
        </Form.Item>
        <Form.Item name="openTime" label="开放时间">
          <Input placeholder="如 08:00-18:00" maxLength={100} />
        </Form.Item>
        <Form.Item name="ticketInfo" label="门票信息">
          <Input placeholder="如 成人票 60 元（仅供参考）" maxLength={200} />
        </Form.Item>
        <Form.Item name="estimatedCost" label="预估费用（元）">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="如 60" />
        </Form.Item>
        <Form.Item name="note" label="备注">
          <TextArea rows={2} maxLength={500} />
        </Form.Item>
        <div style={{ color: '#999', fontSize: 12 }}>
          门票、开放时间等信息仅供参考，出行前请以官方渠道为准。
        </div>
      </Form>
    </Modal>
  );
}
