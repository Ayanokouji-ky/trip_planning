# 开发进度跟踪

> 本文档用于跨设备同步开发进度。每次开发前请先拉取最新代码，开发后更新进度并提交推送。

## 项目信息

- **仓库**：https://gitee.com/Ayanokouji/trip_planning.git
- **分支**：main
- **技术栈**：Spring Boot 2.7.18 + MyBatis / React 18 + Vite + 百度地图
- **详细计划**：见 `dev-plan.md`

## 环境准备（每台新电脑需完成）

1. JDK 1.8（JAVA_HOME 指向 JDK 8）
2. Maven 3.8.1+（或使用项目内 Maven Wrapper）
3. Node.js 18+
4. MySQL 8.0（root/123456，端口 3306）
5. 克隆仓库：`git clone https://gitee.com/Ayanokouji/trip_planning.git`
6. 创建数据库：`CREATE DATABASE trip_planning DEFAULT CHARSET utf8mb4;`
7. 导入表结构：`mysql -u root -p123456 trip_planning < backend/src/main/resources/db/schema.sql`
8. 后端启动：`cd backend; .\mvnw.cmd spring-boot:run`
9. 前端启动：`cd frontend; npm install; npm run dev`

## 阶段进度总览

| 阶段 | 名称 | 状态 | 完成日期 | 备注 |
|------|------|------|----------|------|
| Phase 0 | 脚手架与环境搭建 | 未开始 | - | |
| Phase 1 | 数据库、实体、Mapper、异常处理 | 未开始 | - | |
| Phase 2 | 地图服务（百度地理编码 + 路线规划） | 未开始 | - | |
| Phase 3 | AI 服务（火山方舟 + JSON 提取） | 未开始 | - | |
| Phase 4 | 行程/节点/路线 CRUD API | 未开始 | - | |
| Phase 5 | AI 生成编排（POST /api/ai/generate） | 未开始 | - | |
| Phase 6 | 前端脚手架与 App Shell | 未开始 | - | |
| Phase 7 | 行程列表与详情 UI | 未开始 | - | |
| Phase 8 | 百度地图可视化 | 未开始 | - | |
| Phase 9 | 拖拽排序与路线重算 | 未开始 | - | |
| Phase 10 | AI 生成表单 UI | 未开始 | - | |
| Phase 11 | 收尾打磨 | 未开始 | - | |

## 状态说明

- **未开始**：尚未着手
- **进行中**：正在开发（注明当前子任务）
- **已完成**：该阶段全部完成并验证通过

## 详细进度记录

### Phase 0 — 脚手架与环境搭建
- [ ] Maven Wrapper 生成
- [ ] backend/pom.xml 创建
- [ ] settings.xml Aliyun 镜像配置
- [ ] application.yml 配置
- [ ] TripPlannerApplication.java 主类
- [ ] HealthController 健康检查
- [ ] Vite 脚手架创建
- [ ] Ant Design + Zustand + Axios 安装
- [ ] Vite 代理配置
- [ ] MySQL 建库
- **验证**：后端 `/api/health` 返回 OK，前端 http://localhost:5173 可访问

### Phase 1 — 数据库、实体、Mapper、异常处理
- [ ] schema.sql 5 张表 DDL
- [ ] Entity 类（TravelPlan, PlanDay, PlanNode, PlanRoute, AiGeneration）
- [ ] Mapper 接口 + XML
- [ ] ApiResult<T> 统一响应
- [ ] GlobalExceptionHandler
- **验证**：DDL 导入成功，GET /api/plans/1 返回 404

### Phase 2 — 地图服务
- [ ] BaiduMapServiceImpl（geocode + route）
- [ ] RestClientConfig（两个 RestTemplate Bean）
- [ ] GeoUtils（haversine + 估算耗时）
- [ ] MapController
- **验证**：geocode 返回正确经纬度，route 返回距离/耗时

### Phase 3 — AI 服务
- [ ] ArkAiServiceImpl（调用 Ark responses API）
- [ ] PromptBuilder（系统提示 + 用户需求渲染）
- [ ] JsonExtractor（4 步容错解析）
- [ ] AiGenerationMapper（调用记录）
- **验证**：AI 生成"杭州2日游"解析成功，DB 记录 SUCCESS

### Phase 4 — 行程/节点/路线 CRUD API
- [ ] PlanController + PlanServiceImpl（列表/详情/创建/更新/删除/复制）
- [ ] NodeController + NodeServiceImpl（增/删/改/重排序）
- [ ] RouteService（重新计算路线）
- **验证**：curl 完整 CRUD 循环

### Phase 5 — AI 生成编排
- [ ] AiController POST /api/ai/generate
- [ ] 端到端事务流程（prompt → AI → JSON → geocode → route → 持久化）
- [ ] 容错处理（geocode/route 单点失败不中断）
- [ ] AI 失败记录（非事务写 FAILED）
- **验证**：POST /api/ai/generate 生成完整行程，DB 各表数据完整

### Phase 6 — 前端脚手架与 App Shell
- [ ] 路由配置
- [ ] Axios client.ts
- [ ] Zustand stores
- [ ] AppLayout 布局
- [ ] TS 类型定义
- [ ] Disclaimer 组件
- **验证**：前端启动、路由跳转、API 代理生效

### Phase 7 — 行程列表与详情 UI
- [ ] PlanListPage
- [ ] PlanDetailPage
- [ ] NodeCard + NodeForm
- [ ] RouteList
- [ ] utils 格式化工具
- **验证**：列表展示、详情查看、节点增删改、复制行程

### Phase 8 — 百度地图可视化
- [ ] index.html 加载百度地图 script
- [ ] useBaiduMap Hook
- [ ] BaiduMapContainer（标记 + 折线 + 弹窗）
- [ ] NodePopup + RoutePopup
- [ ] Day 筛选联动
- **验证**：地图展示标记+折线、点击弹窗、天切换刷新

### Phase 9 — 拖拽排序与路线重算
- [ ] @dnd-kit 安装 + DraggableNodeList
- [ ] 拖拽 → 乐观更新 → API reorder
- [ ] 重排后自动 recalculateRoutes
- [ ] 地图标记重新编号
- **验证**：拖拽节点 → 排序更新 → 路线重算 → 地图刷新

### Phase 10 — AI 生成表单 UI
- [ ] GenerateForm
- [ ] AiLoadingOverlay
- [ ] 提交 → 跳转详情页
- **验证**：填写需求 → 提交 → 加载动画 → 跳转详情页

### Phase 11 — 收尾打磨
- [ ] 免责声明
- [ ] ErrorBoundary
- [ ] JSON 导出 + 图片导出
- [ ] 响应式适配
- [ ] 后端日志配置
- **验证**：导出功能、移动端布局、错误处理

## 变更日志

| 日期 | 操作人 | 变更内容 |
|------|--------|----------|
| 2026-10-12 | - | 初始化项目计划与进度文档 |
