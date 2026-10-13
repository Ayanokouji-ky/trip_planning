import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Empty,
  message,
  Popconfirm,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalculatorOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlanStore } from '@/store/planStore';
import { useMapStore } from '@/store/mapStore';
import { planApi } from '@/api/planApi';
import type { NodeSaveRequest, PlanDetailResponse, PlanNode } from '@/types/plan';
import { exportElementPng, exportPlanJson } from '@/utils/exportPlan';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Disclaimer from '@/components/common/Disclaimer';
import DayTabs from '@/components/plan/DayTabs';
import NodeCard from '@/components/plan/NodeCard';
import NodeForm from '@/components/plan/NodeForm';
import RouteList from '@/components/plan/RouteList';
import DraggableNodeList from '@/components/plan/DraggableNodeList';
import BottomTabBar, { type BottomTab } from '@/components/plan/BottomTabBar';
import NodeDetailOverlay from '@/components/plan/NodeDetailOverlay';
import BaiduMapContainer from '@/components/map/BaiduMapContainer';

const { Title, Paragraph } = Typography;

/** 行程详情页：顶部操作栏 + 左侧天/节点/路线 + 右侧百度地图 */
export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const planId = Number(id);
  const navigate = useNavigate();
  const { screens, isMobile } = useBreakpoint();
  const { current, detailLoading, fetchDetail, clearCurrent, setCurrent } = usePlanStore();
  const { activeDayId, setActiveDay, selectedNodeId, selectNode, reset: resetMap } =
    useMapStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<PlanNode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [exportingImg, setExportingImg] = useState(false);
  // 窄屏：底部 Tab（地图/列表/详情）+ 列表抽屉 + 节点详情覆盖层
  const [mobileTab, setMobileTab] = useState<BottomTab>('map');
  const [listOpen, setListOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const itineraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchDetail(planId);
    return () => {
      clearCurrent();
      resetMap();
    };
  }, [id, planId, fetchDetail, clearCurrent, resetMap]);

  /** 每个行程首次加载时默认选中第一天（不拦截用户后续切到"全部"） */
  const initializedPlanId = useRef<number | null>(null);
  useEffect(() => {
    if (current && initializedPlanId.current !== current.plan.id) {
      initializedPlanId.current = current.plan.id;
      const first = [...current.days].sort((a, b) => a.dayIndex - b.dayIndex)[0];
      if (first) setActiveDay(first.id);
    }
  }, [current, setActiveDay]);

  const visibleNodes = useMemo(() => {
    if (!current) return [];
    if (activeDayId != null) {
      return current.nodes
        .filter((n) => n.dayId === activeDayId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    }
    // 全部：按天（dayIndex）再按 orderIndex 分组排序
    const dayOrder = new Map(
      [...current.days]
        .sort((a, b) => a.dayIndex - b.dayIndex)
        .map((d, i) => [d.id, i]),
    );
    return [...current.nodes].sort(
      (a, b) =>
        (dayOrder.get(a.dayId) ?? 0) - (dayOrder.get(b.dayId) ?? 0) ||
        a.orderIndex - b.orderIndex,
    );
  }, [current, activeDayId]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );

  /** 表单目标天：优先当前筛选天，否则第一天 */
  const formDayId =
    activeDayId ??
    (current ? [...current.days].sort((a, b) => a.dayIndex - b.dayIndex)[0]?.id : 0);

  const handleSubmit = async (values: NodeSaveRequest) => {
    setSubmitting(true);
    try {
      if (editingNode) {
        await planApi.updateNode(planId, editingNode.id, values);
        message.success('节点已更新');
      } else {
        await planApi.addNode(planId, values);
        message.success('节点已添加（坐标自动定位中）');
      }
      setFormOpen(false);
      setEditingNode(null);
      await fetchDetail(planId);
    } catch {
      // 拦截器已统一提示
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNode = async (node: PlanNode) => {
    try {
      await planApi.removeNode(planId, node.id);
      message.success('节点已删除');
      await fetchDetail(planId);
    } catch {
      // 拦截器已统一提示
    }
  };

  /**
   * 拖拽排序：乐观更新本地 orderIndex → reorder API → 自动重算路线 → 权威刷新；
   * 任一步失败回滚到拖拽前快照。
   */
  const handleReorder = async (dayId: number, orderedIds: number[]) => {
    if (!current) return;
    const snapshot = current;
    const optimisticNodes = current.nodes.map((node) => {
      const idx = orderedIds.indexOf(node.id);
      return idx >= 0 ? { ...node, orderIndex: idx } : node;
    });
    setCurrent({ ...current, nodes: optimisticNodes });
    setReordering(true);
    try {
      await planApi.reorderNodes(planId, { dayId, nodeIds: orderedIds });
      const routes = await planApi.recalculateRoutes(planId);
      message.success(`顺序已保存，重算 ${routes.length} 条路线`);
      await fetchDetail(planId);
    } catch {
      setCurrent(snapshot);
      message.error('排序保存失败，已回滚');
    } finally {
      setReordering(false);
    }
  };

  const handleCopy = async () => {
    try {
      const copied = await planApi.copy(planId);
      message.success(`已复制为「${copied.title}」`);
      navigate(`/plans/${copied.id}`);
    } catch {
      // 拦截器已统一提示
    }
  };

  const handleDelete = async () => {
    try {
      await planApi.remove(planId);
      message.success('行程已删除');
      navigate('/plans');
    } catch {
      // 拦截器已统一提示
    }
  };

  const handleExport = async (key: string) => {
    if (!current) return;
    if (key === 'json') {
      exportPlanJson(current);
      message.success('JSON 已开始下载');
      return;
    }
    if (key === 'png') {
      if (!itineraryRef.current) return;
      setExportingImg(true);
      try {
        await exportElementPng(itineraryRef.current, current.plan.title);
        message.success('图片已开始下载');
      } catch {
        message.error('图片导出失败，请重试');
      } finally {
        setExportingImg(false);
      }
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const routes = await planApi.recalculateRoutes(planId);
      message.success(`已重算 ${routes.length} 条路线`);
      await fetchDetail(planId);
    } catch {
      // 拦截器已统一提示
    } finally {
      setRecalculating(false);
    }
  };

  /** 窄屏 Tab 切换：重复点击当前 Tab 回到地图视图 */
  const handleTabChange = (tab: BottomTab) => {
    if (tab === mobileTab) {
      setMobileTab('map');
      setListOpen(false);
      setDetailOpen(false);
      return;
    }
    setMobileTab(tab);
    setListOpen(tab === 'list');
    setDetailOpen(tab === 'detail');
  };

  /** 窄屏点击节点卡片 → 全屏详情覆盖层（地图同时联动定位） */
  const handleMobileSelect = (n: PlanNode) => {
    selectNode(n.id);
    setMobileTab('detail');
    setListOpen(false);
    setDetailOpen(true);
  };

  const openNodeForm = (n: PlanNode) => {
    setEditingNode(n);
    setFormOpen(true);
  };

  /** 行程主体（天切换 + 节点列表 + 路线），桌面卡片 / 移动抽屉复用 */
  const renderItineraryBody = (onSelect: (n: PlanNode) => void) => (
    <>
      <DayTabs days={current!.days} nodes={current!.nodes} />
      {visibleNodes.length === 0 ? (
        <Empty description="当天还没有节点" />
      ) : activeDayId != null ? (
        <DraggableNodeList
          nodes={visibleNodes}
          selectedNodeId={selectedNodeId}
          onReorder={(orderedIds) => handleReorder(activeDayId, orderedIds)}
          onSelect={onSelect}
          onEdit={openNodeForm}
          onDelete={handleDeleteNode}
        />
      ) : (
        // 全部天：按天分组展示，不支持跨天拖拽
        [...current!.days]
          .sort((a, b) => a.dayIndex - b.dayIndex)
          .map((day) => {
            const dayNodes = visibleNodes.filter((n) => n.dayId === day.id);
            if (dayNodes.length === 0) return null;
            return (
              <div key={day.id} style={{ marginBottom: 8 }}>
                <Paragraph type="secondary" style={{ margin: '8px 0 4px', fontWeight: 600 }}>
                  第 {day.dayIndex} 天
                </Paragraph>
                {dayNodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    active={selectedNodeId === node.id}
                    onSelect={onSelect}
                    onEdit={openNodeForm}
                    onDelete={handleDeleteNode}
                  />
                ))}
              </div>
            );
          })
      )}
      <RouteList routes={current!.routes} nodes={current!.nodes} visibleNodeIds={visibleNodeIds} />
    </>
  );

  return (
    <Spin spinning={detailLoading}>
      <Disclaimer />
      {current ? (
        <>
          {/* 顶部操作栏 */}
          <Card style={{ marginTop: 16 }} styles={{ body: { padding: '12px 24px' } }}>
            <Row align="middle" justify="space-between" gutter={[8, 8]}>
              <Space size="middle" wrap>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/plans')}>
                  返回
                </Button>
                <Title level={4} style={{ margin: 0 }}>
                  {current.plan.title}
                </Title>
                <Tag color="blue">{current.plan.city}</Tag>
                <Tag>{current.plan.days} 天</Tag>
                <Tag color={current.plan.status === 'AI_GENERATED' ? 'green' : 'default'}>
                  {current.plan.status}
                </Tag>
              </Space>
              <Space wrap>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      { key: 'json', icon: <FileTextOutlined />, label: '导出 JSON' },
                      { key: 'png', icon: <FileImageOutlined />, label: '导出图片 PNG' },
                    ],
                    onClick: ({ key }) => handleExport(key),
                  }}
                >
                  <Button icon={<DownloadOutlined />} loading={exportingImg}>
                    导出
                  </Button>
                </Dropdown>
                <Button
                  icon={<CalculatorOutlined />}
                  loading={recalculating}
                  onClick={handleRecalculate}
                >
                  重算路线
                </Button>
                <Button icon={<CopyOutlined />} onClick={handleCopy}>
                  复制
                </Button>
                <Popconfirm
                  title="删除该行程？"
                  description="行程及其所有节点、路线将被删除"
                  okText="删除"
                  okButtonProps={{ danger: true }}
                  cancelText="取消"
                  onConfirm={handleDelete}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </Row>
            {current.plan.summary && (
              <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                {current.plan.summary}
              </Paragraph>
            )}
          </Card>

          {isMobile ? (
            <>
              {/* 窄屏：地图为主视图（60vh），列表收进底部抽屉，不挤压地图 */}
              <Card title="地图" styles={{ body: { padding: 8 } }} style={{ marginTop: 16 }}>
                <BaiduMapContainer nodes={visibleNodes} routes={current.routes} height="60vh" />
              </Card>

              <Drawer
                placement="bottom"
                height="75vh"
                open={listOpen}
                onClose={() => {
                  setListOpen(false);
                  setMobileTab('map');
                }}
                title={
                  <Space size={8}>
                    行程安排
                    {reordering && <Spin size="small" />}
                  </Space>
                }
                extra={
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingNode(null);
                      setFormOpen(true);
                    }}
                  >
                    新增节点
                  </Button>
                }
                styles={{ body: { padding: '12px 16px' } }}
              >
                <div ref={itineraryRef}>{renderItineraryBody(handleMobileSelect)}</div>
              </Drawer>

              {/* 窄屏节点详情：全屏覆盖 + 左右滑动切换 */}
              <NodeDetailOverlay
                open={detailOpen}
                nodes={visibleNodes}
                selectedNodeId={selectedNodeId}
                onSelect={(n) => selectNode(n.id)}
                onClose={() => {
                  setDetailOpen(false);
                  setMobileTab('map');
                }}
                onEdit={openNodeForm}
                onDelete={handleDeleteNode}
              />

              <BottomTabBar active={mobileTab} onChange={handleTabChange} />
              {/* 固定 Tab 栏占位，避免遮挡页脚 */}
              <div style={{ height: 64 }} />
            </>
          ) : (
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              {/* 左列：天切换 + 节点列表 + 路线（图片导出区域） */}
              <Col xs={24} lg={10}>
                <div ref={itineraryRef}>
                  <Card
                    title={
                      <Space size={8}>
                        行程安排
                        {reordering && <Spin size="small" />}
                      </Space>
                    }
                    extra={
                      <Button
                        className="export-ignore"
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingNode(null);
                          setFormOpen(true);
                        }}
                      >
                        新增节点
                      </Button>
                    }
                  >
                    {renderItineraryBody((n) => selectNode(n.id))}
                  </Card>
                </div>
              </Col>

              {/* 右列：百度地图 */}
              <Col xs={24} lg={14}>
                <Card title="地图" styles={{ body: { padding: 8 } }}>
                  <BaiduMapContainer
                    nodes={visibleNodes}
                    routes={current.routes}
                    height={screens.lg ? 560 : 360}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <NodeForm
            open={formOpen}
            node={editingNode}
            dayId={formDayId}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingNode(null);
            }}
          />
        </>
      ) : (
        !detailLoading && (
          <Card style={{ marginTop: 16 }}>
            <Empty description="行程不存在或已删除">
              <Button type="primary" onClick={() => navigate('/plans')}>
                返回列表
              </Button>
            </Empty>
          </Card>
        )
      )}
    </Spin>
  );
}
