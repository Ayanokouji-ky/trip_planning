import { useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'antd';
import type { PlanNode, NodeSaveRequest } from '@/types/plan';

const { TextArea } = Input;

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

/** 新增/编辑节点弹窗表单 */
export default function NodeForm({ open, node, dayId, submitting, onSubmit, onCancel }: Props) {
  const [form] = Form.useForm<NodeSaveRequest>();

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
        <Form.Item
          name="placeName"
          label="地点名称"
          rules={[{ required: true, message: '请输入地点名称' }]}
        >
          <Input placeholder="如：宽窄巷子" maxLength={100} />
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
