# AI 旅游行程规划与地图可视化平台 — MVP 实施计划

## Context（背景）

本项目是全新开发，基于 `prompt.md` 需求文档和 `API.md` 提供的 AI（火山方舟 deepseek-v4-1-flash）和百度地图 AK。目标是构建一个旅游攻略生成与行程规划网站：用户输入需求 → AI 生成结构化攻略 → 地图可视化展示节点/路线 → 可编辑调整。

**MVP 范围**：AI 攻略生成 + 地图行程可视化 + 行程管理（不含用户登录、图片导入、后台管理）。

**已确认的技术选型**：
- 后端：Spring Boot 2.7.18 + MyBatis（JDK 8 兼容）
- 前端：React 18 + Vite + TypeScript + Ant Design + Zustand + Axios
- 地图：百度地图 GL JS API（直连，BD09 坐标系）
- 认证：JWT（MVP 暂不实现，后续扩展）
- 数据库：MySQL 8.0.32（root/123456）

**环境**：JDK 1.8.0_152（JAVA_HOME）、Maven 3.8.1 缓存（不在 PATH，需 Maven Wrapper）、Node 18、Windows

---

## 项目目录结构

```
trip_planning/
├── backend/
│   ├── mvnw.cmd, mvnw, .mvn/                    # Maven Wrapper
│   ├── pom.xml
│   └── src/main/java/com/trip/planner/
│       ├── TripPlannerApplication.java
│       ├── config/        {CorsConfig, AppProperties, RestClientConfig}
│       ├── controller/   {HealthController, AiController, PlanController, NodeController, MapController}
│       ├── service/       {AiService, PlanService, NodeService, RouteService, MapService}
│       │   └── impl/       {ArkAiServiceImpl, PlanServiceImpl, NodeServiceImpl, RouteServiceImpl, BaiduMapServiceImpl}
│       ├── mapper/        {TravelPlanMapper, PlanDayMapper, PlanNodeMapper, PlanRouteMapper, AiGenerationMapper}
│       ├── entity/        {TravelPlan, PlanDay, PlanNode, PlanRoute, AiGeneration}
│       ├── dto/
│       │   ├── request/   {AiGenerateRequest, PlanSaveRequest, NodeSaveRequest, NodeReorderRequest}
│       │   ├── response/  {ApiResult, PlanDetailResponse, PlanSummaryResponse, NodeResponse, RouteResponse, GeocodeResponse, RouteInfoResponse, AiGenerateResponse}
│       │   └── ai/        {AiItineraryDto, AiDayDto, AiNodeDto}
│       ├── exception/     {BusinessException, ResourceNotFoundException, AiGenerationException, GlobalExceptionHandler}
│       └── util/          {JsonExtractor, PromptBuilder, GeoUtils}
│   └── src/main/resources/
│       ├── application.yml
│       ├── mapper/*.xml
│       └── db/schema.sql
│
├── frontend/
│   ├── package.json, vite.config.ts, tsconfig.json
│   ├── index.html          # 百度地图 script 标签
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── router/index.tsx
│       ├── api/            {client.ts, planApi.ts, aiApi.ts, mapApi.ts}
│       ├── types/          {api.ts, plan.ts, ai.ts, bmapgl.d.ts}
│       ├── store/          {planStore.ts, uiStore.ts, mapStore.ts}   # Zustand
│       ├── hooks/          {useBaiduMap.ts, usePlan.ts}
│       ├── components/
│       │   ├── layout/     {AppLayout}
│       │   ├── map/        {BaiduMapContainer, NodePopup, RoutePopup}
│       │   ├── plan/       {PlanList, PlanCard, DayTabs, NodeCard, NodeForm, RouteList, DraggableNodeList}
│       │   ├── ai/         {GenerateForm, AiLoadingOverlay}
│       │   └── common/     {Loading, ErrorBoundary, Disclaimer, Empty}
│       ├── pages/          {HomePage, PlanListPage, PlanDetailPage, GeneratePage}
│       └── utils/          {geo.ts, time.ts, exportPlan.ts}
│
└── settings/settings.xml    # Aliyun Maven 镜像
```

---

## 实施阶段

### Phase 0 — 脚手架与环境搭建
- 用缓存的 Maven 3.8.1 生成 Maven Wrapper（`mvnw.cmd`）
- 创建 `pom.xml`：spring-boot-starter-parent 2.7.18, JDK 8, mybatis-spring-boot-starter 2.3.1, mysql-connector-j, lombok
- `settings.xml` 配置 Aliyun 镜像加速依赖下载
- `application.yml`：数据源（localhost:3306/trip_planning, root/123456）、MyBatis 配置、自定义属性（baidu.ak, ai.api-key, ai.endpoint, ai.model）
- Vite 脚手架 + Ant Design + Zustand + Axios + react-router-dom 安装
- MySQL 建库 `trip_planning`
- `HealthController` 验证后端启动，`/api/health` 返回 `ApiResult.ok("up")`
- Vite 代理 `/api → http://localhost:8080`
- **验证**：后端启动、前端启动、数据库存在

### Phase 1 — 数据库、实体、Mapper、异常处理
- `schema.sql`：5 张表 DDL（travel_plan, plan_day, plan_node, plan_route, ai_generation），InnoDB + utf8mb4，索引优化
- 实体类（Lombok @Data），MyBatis Mapper 接口 + XML（`map-underscore-to-camel-case`）
- `ApiResult<T>` 统一响应封装（code, message, data）
- `GlobalExceptionHandler`：404/400/500 统一处理
- **验证**：DDL 导入成功、`GET /api/plans/1` 返回 404

### Phase 2 — 地图服务（百度地理编码 + 路线规划）
- `BaiduMapServiceImpl`：geocode(address) → lat/lng；route(from, to, mode) → distance/duration
- `RestClientConfig`：两个 RestTemplate Bean（地图 15s 超时、AI 60s 超时）
- `GeoUtils`：haversine 距离计算 + 按交通方式估算耗时（API 失败降级用）
- `MapController`：`GET /api/map/geocode`、`GET /api/map/route`
- **验证**：geocode "杭州西湖" 返回正确经纬度；route 查询返回距离/耗时

### Phase 3 — AI 服务（火山方舟 + JSON 提取）
- `ArkAiServiceImpl`：调用 `POST /api/v3/responses`，Authorization Bearer，`stream:false`
- **请求格式**（responses 风格，非 chat messages）：`input` 数组 + `role` + `content[{type:"input_text", text}]`
- `PromptBuilder`：系统提示词强制输出 JSON 格式 + 用户需求渲染
- `JsonExtractor`：4 步容错解析（直接解析 → 去除 markdown 代码块 → 截取首尾{} → 抛异常）
- `AiGenerationMapper`：记录 AI 调用（PENDING → SUCCESS/FAILED）
- **验证**：调用 AI 生成"杭州2日游"，解析出 `AiItineraryDto`，DB 记录 SUCCESS

### Phase 4 — 行程/节点/路线 CRUD API
- `PlanController` + `PlanServiceImpl`：
  - `GET /api/plans` — 列表
  - `GET /api/plans/{id}` — 详情（plan + days[] + nodes[] + routes[]，3 次独立查询拼装）
  - `POST /api/plans` / `PUT /api/plans/{id}` — 创建/更新
  - `DELETE /api/plans/{id}` — 级联删除（事务）
  - `POST /api/plans/{id}/copy` — 深拷贝（oldId→newId 映射重连路线）
- `NodeController` + `NodeServiceImpl`：
  - `POST /api/plans/{id}/nodes` — 新增节点（自动 geocode）
  - `PUT /api/plans/{id}/nodes/{nodeId}` — 更新
  - `DELETE /api/plans/{id}/nodes/{nodeId}` — 删除 + 重建 order_index
  - `PUT /api/plans/{id}/nodes/reorder` — 批量重排序（事务）
- `RouteService`：
  - `POST /api/plans/{id}/routes/recalculate` — 按天重新计算路线
- **验证**：curl 完整 CRUD 循环

### Phase 5 — AI 生成编排（`POST /api/ai/generate`）
- **端到端流程**（单事务）：
  1. 构建 prompt → 2. 写 ai_generation(PENDING) → 3. 调 AI → 4. 解析 JSON → 5. 写 travel_plan → 6. 写 plan_day → 7. 逐节点 geocode（50ms 间隔限流） → 8. 逐路线 route 查询 → 9. 写 ai_generation(SUCCESS) → 10. 返回 PlanDetailResponse
- **容错**：geocode/route 单点失败不中断整体，节点坐标 null 时降级显示
- **AI 失败**：不创建 plan，单独非事务写 ai_generation(FAILED)
- **验证**：`POST /api/ai/generate` 生成完整行程（~20-40s），DB 各表数据完整

### Phase 6 — 前端脚手架与 App Shell
- 路由配置（/, /plans, /plans/:id, /generate）
- Axios `client.ts`：baseURL `/api`，60s 超时，响应拦截器解包 `data.data`
- Zustand stores：planStore（列表/当前行程）、uiStore（全局加载）、mapStore（选中节点/路线/天筛选）
- `AppLayout`：Header + Sider + Content，响应式
- TS 类型定义镜像后端 DTO
- `Disclaimer` 组件
- **验证**：前端启动、路由跳转、API 代理生效

### Phase 7 — 行程列表与详情 UI
- `PlanListPage`：Antd List + PlanCard（查看/复制/删除）
- `PlanDetailPage`：顶部操作栏 + 左侧 DayTabs/NodeList + 右侧地图占位
- `NodeCard`：地点名/类型图标/游览时长/亮点/门票（带"仅供参考"标签）
- `NodeForm`：新增/编辑节点表单
- `RouteList`：路线信息（起终点/交通方式/距离/耗时）
- `utils/time.ts`、`utils/geo.ts`：格式化工具
- **验证**：列表展示、详情查看、节点增删改、复制行程

### Phase 8 — 百度地图可视化
- `index.html` 加载百度地图 GL JS API script
- `useBaiduMap` Hook：初始化地图、等待 BMapGL 就绪
- `BaiduMapContainer`：
  - 节点标记（按 order_index 编号，不同 place_type 不同图标）
  - 节点间折线连接（Polyline）
  - 点击标记 → InfoWindow 弹窗（NodePopup）
  - 点击折线 → RoutePopup
  - 自动 fitViewport 到所有节点
  - Day 筛选联动
- 侧栏 NodeCard 点击 → 地图定位到对应标记
- **验证**：地图展示标记+折线、点击弹窗、天切换刷新

### Phase 9 — 拖拽排序与路线重算
- `@dnd-kit/sortable` 实现拖拽排序
- `DraggableNodeList`：拖拽手柄 + 排序
- 拖拽完成 → 乐观更新 planStore → 调 API reorderNodes → 失败回滚
- 重排后自动调 recalculateRoutes
- 地图标记重新编号、折线重新连接
- **验证**：拖拽节点 → 排序更新 → 路线重算 → 地图刷新

### Phase 10 — AI 生成表单 UI
- `GenerateForm`：目的地/天数/日期/人数/预算/偏好/特殊需求
- `AiLoadingOverlay`：全屏 Spin + 倒计时 + 超时提示
- 提交 → 60s 超时 → 成功跳转 `/plans/{id}` → 失败保留表单 + 重试
- **验证**：填写需求 → 提交 → 加载动画 → 跳转详情页 → 地图+行程展示

### Phase 11 — 收尾打磨
- "仅供参考"免责声明（详情页顶部 + 弹窗 + 表单）
- `ErrorBoundary` 全局错误边界
- JSON 导出 + 图片导出（html2canvas）
- 响应式适配（Sider 折叠、地图高度自适应）
- 后端日志配置（logback-spring.xml）
- **验证**：导出功能、移动端布局、错误处理

---

## 关键风险与对策

| 风险 | 对策 |
|---|---|
| AI 返回非合法 JSON | 4 步容错提取（直接解析→去 markdown→截取{}→抛异常记录） |
| AI 不返回经纬度 | 后端逐节点调百度 geocode 补全，50ms 间隔限流 |
| geocode 单点失败 | try/catch 单节点，坐标 null 时 UI 标记"未定位" |
| 百度公交路线距离不准 | 默认 driving 模式，transit 作为可选 + 弹窗标注 |
| AI 调用失败 | ai_generation 记录 FAILED（非事务），不创建空 plan |
| Maven 不在 PATH | Phase 0 生成 Maven Wrapper，所有后续命令用 `.\mvnw.cmd` |
| AI Key 泄露前端 | app.ai.* 仅后端读取，前端只用百度 AK（浏览器端） |

---

## 验证清单（端到端）

1. `.\mvnw.cmd spring-boot:run` 启动后端 → `curl http://localhost:8080/api/health` 返回 OK
2. `npm run dev` 启动前端 → http://localhost:5173 可访问
3. `POST /api/ai/generate` 生成"杭州3日游" → 返回完整 PlanDetailResponse（含经纬度、路线）
4. `GET /api/plans` 列表显示生成的行程
5. 前端行程详情页：地图显示编号标记 + 折线，点击弹窗，切换天
6. 拖拽节点排序 → 路线自动重算
7. 导出 JSON 文件可下载
8. 移动端宽度下布局正常
