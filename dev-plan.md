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

**环境**：JDK 1.8.0.152（JAVA_HOME）、Maven 3.8.1 缓存（不在 PATH，需 Maven Wrapper）、Node 18、Windows

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

---

# V2 迭代实施计划（基于上线反馈）

## V2 Context

基于线上用户反馈的五点改进需求（详见 `prompt.md` 第 10 章），在已上线 MVP 基础上扩展功能与优化体验。保持现有技术栈不变，扩展 5 张表 + 新增 2 张表（user、image_import）。

**V2 开发顺序**（按依赖关系）：
1. Phase 12 — 用户登录与行程归属隔离（基础，其他模块依赖 user_id）
2. Phase 13 — 可选模型选项（AI 调用层改造，图片识图复用）
3. Phase 14 — 图片一图流识图（复用 Phase 13 的动态 model 机制）
4. Phase 15 — 地图视觉与交互优化（纯前端改造，移动端适配依赖）
5. Phase 16 — 窄屏与移动端优化（依赖 Phase 15 地图改造完成）

## V2 新增目录/文件

```
backend/src/main/java/com/trip/planner/
├── config/           {SecurityConfig, JwtConfig}              # 新增
├── controller/       {AuthController, ImageImportController}  # 新增
├── service/          {UserService, JwtService, ImageImportService}  # 新增
│   └── impl/          {UserServiceImpl, JwtServiceImpl, ImageImportServiceImpl}
├── mapper/           {UserMapper, ImageImportMapper}          # 新增
├── entity/           {User, ImageImport}                      # 新增
├── dto/
│   ├── request/      {LoginRequest, RegisterRequest, ImageImportRequest}  # 新增
│   ├── response/     {LoginResponse, UserResponse, ImageImportResponse}  # 新增
│   └── ai/           {ModelOption}                            # 新增
├── interceptor/      {JwtInterceptor}                        # 新增
├── annotation/       {@CurrentUser}                           # 新增
└── constant/         {ModelConstants}                         # 新增（模型白名单）

backend/src/main/resources/
├── application.yml   # 新增 jwt.secret, jwt.expiration
└── db/migration/
    └── V2__add_user_and_image_import.sql                      # 新增迁移脚本

frontend/src/
├── api/              {authApi.ts, imageApi.ts}                 # 新增
├── components/
│   ├── auth/         {LoginPage, RegisterPage, UserMenu}      # 新增
│   ├── image/        {ImageUploadZone, ImagePreviewList}      # 新增
│   ├── map/          {MapStyleSwitcher, FullscreenButton}     # 新增
│   └── mobile/       {BottomTabBar, MobileNodeSheet}          # 新增
├── constants/        {models.ts}                              # 新增
├── hooks/            {useAuth.ts, useBreakpoint.ts}           # 新增
├── pages/            {LoginPage, RegisterPage}                 # 新增
└── store/            {authStore.ts, modelStore.ts}             # 新增
```

## V2 实施阶段

### Phase 12 — 用户登录与行程归属隔离

**目标**：实现用户注册/登录，行程归属隔离，存量数据标记为公共实例。

**后端**：
- `schema.sql` 迁移脚本 `V2__add_user_and_image_import.sql`：
  - `CREATE TABLE user`（id, username UNIQUE, password, email, phone, avatar, role, created_at, updated_at）
  - `ALTER TABLE travel_plan ADD COLUMN user_id BIGINT NULL, ADD COLUMN is_public TINYINT DEFAULT 0`
  - `ALTER TABLE ai_generation ADD COLUMN user_id BIGINT NULL`
  - `UPDATE travel_plan SET is_public=1 WHERE user_id IS NULL`（存量数据标记公共）
  - `CREATE INDEX idx_user_plan ON travel_plan(user_id)`
- `User` 实体 + `UserMapper`（findByUsername, insert, findById）
- `JwtService`：生成/验证 Token（jjwt 0.11.5，HS256，7 天有效期）
- `JwtInterceptor`：拦截 `/api/plans/**`, `/api/ai/**`, `/api/nodes/**`，解析 Token → 注入 userId 到 ThreadLocal
- `@CurrentUser` 注解 + `HandlerMethodArgumentResolver`：Controller 方法参数注入当前用户
- `AuthController`：
  - `POST /api/auth/register` — 注册（BCrypt 哈希）
  - `POST /api/auth/login` — 登录，返回 `{token, user}`
  - `GET /api/auth/me` — 获取当前用户
- `SecurityConfig`：放行 `/api/auth/**`、`/api/health`，其余需 Token
- `PlanController` / `AiController` 改造：
  - 生成行程时写入 `user_id`
  - 列表查询：`GET /api/plans?scope=mine|public`，mine 返回当前用户行程，public 返回 `is_public=1`
  - 详情/编辑/删除接口校验 `plan.user_id == currentUser.id`，否则 403
- **验证**：注册→登录→生成行程→列表仅见自己→公共 Tab 见存量行程→编辑他人行程返回 403

**前端**：
- `authStore`（Zustand）：token, user, login(), logout(), isAuthenticated
- `authApi.ts`：register, login, me
- `client.ts` 拦截器：请求附加 `Authorization: Bearer {token}`；401 响应跳转登录页
- 路由守卫：`/generate`, `/plans/:id/edit` 需登录，未登录跳 `/login`
- `LoginPage` / `RegisterPage`：Ant Design Form，用户名+密码
- `UserMenu`：Header 右上角，显示用户名/登出
- `PlanListPage` 改造：双 Tab「我的行程」/「公共攻略」
- 行程卡片显示归属标签（我的/公共）
- **验证**：未登录访问生成页跳转登录；登录后双 Tab 切换；公共行程可查看不可编辑

### Phase 13 — 可选模型选项

**目标**：AI 调用层支持动态切换模型，前端提供模型选择 UI。

**后端**：
- `ModelConstants` 常量类：模型白名单（识图 3 + 文本 6）
- `AiGenerateRequest` 新增 `model` 字段（可选，默认 deepseek-v4-1-flash-260910）
- `ArkAiServiceImpl` 改造：`model` 从 `@Value` 注入改为方法参数传入；调用前校验白名单
- `AiGeneration` 记录 `model_name` 字段（已有，确保写入）
- 模型不可用时降级到默认模型，响应中标注 `degraded=true`
- 新增接口 `GET /api/ai/models?type=text|image` — 返回可用模型列表
- **验证**：curl 切换不同 model 生成成功；白名单外 model 返回 400；降级场景正常

**前端**：
- `constants/models.ts`：TEXT_MODELS, IMAGE_MODELS 常量（id, label, tag, description）
- `modelStore`（Zustand）：selectedTextModel, selectedImageModel，持久化 localStorage
- `GenerateForm` 新增「模型选择」Select 组件，选项后附 Tag（推荐/质量优先/速度快/国产）
- 切换模型实时更新 store，提交时附加 model 参数
- 模型选择 UI 与文本/图片 Tab 联动：文本 Tab 显示文本模型，图片 Tab 显示识图模型
- **验证**：切换模型生成成功；刷新页面模型选择保留；异常模型后端降级并 Toast 提示

### Phase 14 — 图片一图流攻略识别生成

**目标**：用户上传图片，AI 识别后转为结构化行程。

**后端**：
- `ImageImport` 实体 + `ImageImportMapper`
- `ImageImportService` / `ImageImportServiceImpl`：
  - 接收 MultipartFile[]，存储到 `uploads/{uuid}.{ext}`
  - 图片转 base64 data URL
  - 调用 Ark `responses` API，`input` 数组包含多个 `{type: "input_image", image_url: "data:..."}`
  - 复用 `JsonExtractor` 4 步容错解析
  - 复用 `PlanService` 创建行程（geocode + route）
  - 记录 `image_import` 表
- `ImageImportController`：
  - `POST /api/ai/image-import` — 上传图片 + 返回识别结果（预览）
  - `POST /api/ai/image-import/confirm` — 用户确认后正式生成行程
- 文件大小限制 10MB，类型校验 jpg/png/webp
- **验证**：上传 picTestCase/case1 图片 → 识别地点 → 确认 → 生成行程；多图合并正常

**前端**：
- `GeneratePage` 新增 Tab：文本生成 / 图片导入
- `ImageUploadZone`：antd Upload.Dragger，支持拖拽、粘贴（Paste 事件）、多文件
- `ImagePreviewList`：缩略图 + 拖拽排序（@dnd-kit）+ 删除
- 上传后调 `/api/ai/image-import` → 返回识别的节点列表
- 识别结果预览：可删除误识别节点、补充信息
- 确认按钮 → 调 `/api/ai/image-import/confirm` → 跳转详情页
- 模型选择联动 Phase 13（图片场景显示识图模型）
- **验证**：picTestCase 3 个 case 全部识别成功；拖拽排序图片正常；确认后跳转详情

### Phase 15 — 地图视觉与交互优化

**目标**：提升地图视觉表现力与交互体验。

**前端**：
- 节点标记美化：
  - 自定义 `BMapGL.Overlay`：SVG 图标 + 圆角编号气泡
  - `place_type` 配色映射：景点蓝、餐厅橙、酒店紫、交通绿
  - 起点旗帜图标、终点终点旗
- 路线样式：
  - `Polyline` 配置：步行虚线、驾车实线、公交点划线
  - 渐变色（起→终浅到深），hover 加粗高亮
- 视野自适应：`map.setViewport(points)` 生成/拖拽后自动调整
- 节点与列表双向联动：
  - `mapStore` 新增 `hoveredNodeId`
  - 地图标记 hover → store.setHovered → 列表项高亮 + 滚动
  - 列表项 hover → 地图标记放大跳动（`setAnimation`）
  - 列表项点击 → `map.panTo` + 打开 InfoWindow
- 地图风格切换：
  - `MapStyleSwitcher` 组件：日间/夜间/卫星
  - `map.setMapStyleV2(styleJson)` 切换
  - 偏好存 localStorage
- 3D 视角：`map.setTilt(60)` + `map.setHeading()`，详情页默认 3D
- 节点聚合：节点 > 50 时启用 `BMapGL.MarkerClusterer`
- 加载态：AI 生成中地图骨架屏 + 进度文案
- 信息卡片：玻璃拟态 CSS（backdrop-filter: blur）
- **验证**：节点类型颜色区分；路线线型区分；hover 双向联动；风格切换生效；3D 视角可见；50+ 节点聚合正常

### Phase 16 — 窄屏与移动端体验优化

**目标**：优化手机端全流程体验。

**前端**：
- 响应式断点改造：
  - `useBreakpoint` Hook 封装 `Grid.useBreakpoint`
  - 全局 `isMobile = width < 768`
- 生成表单：窄屏单列堆叠，输入框全宽，提交按钮 `position: fixed; bottom: 0`
- 地图区域：
  - 窄屏 `min-height: 60vh`
  - `FullscreenButton`：Fullscreen API 切换沉浸式
  - `ResizeObserver` 监听容器尺寸变化通知地图
- 节点列表：
  - 窄屏改为底部 Drawer（antd MobileSheet / 自定义）
  - 展开/收起手势，不挤压地图
- 拖拽排序：
  - `@dnd-kit` 启用 `TouchSensor` + `MouseSensor` 组合
  - 激活距离 8px，避免误触
- 顶部导航：窄屏汉堡菜单 → 侧抽屉（antd Drawer）
- 行程详情：窄屏卡片全屏覆盖 + 左右滑动切换节点
- 底部 Tab 栏：窄屏新增 `BottomTabBar`（地图/列表/详情），`position: fixed; bottom: 0`
- 触摸友好：全局 CSS `min-width: 44px; min-height: 44px` 用于可点击元素
- 安全区适配：`padding: env(safe-area-inset-bottom)` 适配刘海屏
- 字号适配：`html { font-size: 16px; }` + rem 单位
- **验证**：iPhone SE（375px）/ iPhone 14（390px）/ Pixel 7（412px）/ iPad 模拟器下主要操作无横向滚动；地图全屏；拖拽可用；底部 Tab 切换

---

## V2 关键风险与对策

| 风险 | 对策 |
|---|---|
| 存量行程 user_id 为空导致权限校验异常 | 迁移脚本统一标记 is_public=1，查询时 `WHERE user_id = ? OR is_public = 1` |
| JWT Token 泄露 | localStorage 存储 + HttpOnly Cookie 不可用（前后端分离）→ 限制 7 天有效期 + 后端 Token 黑名单（可选） |
| 图片 base64 过大导致 AI 请求超时 | 单张压缩到 ≤ 1MB 后转 base64；多图分批调用；后端 120s 超时 |
| 识图模型误识别地点 | 人工确认环节必须保留；识别结果预览 + 删除/补充后再生成 |
| 模型不可用导致生成失败 | 白名单校验 + 自动降级到默认模型 + 响应标注 degraded |
| 移动端 @dnd-kit 触摸冲突 | TouchSensor + MouseSensor 组合，activationConstraint.distance=8 |
| 3D 视角低端设备卡顿 | 检测 WebGL 性能，低端设备降级 2D；`requestAnimationFrame` 节流 |
| 节点聚合与拖拽冲突 | 聚合仅在高 zoom-out 级别启用；拖拽时临时禁用聚合 |
| 地图风格 JSON 加载失败 | 三种风格内嵌为常量，不依赖外部文件 |

---

## V2 验证清单

1. 注册新用户 → 登录 → Token 正常存储 → 刷新页面保持登录态
2. 未登录访问 `/generate` → 跳转登录页 → 登录后跳回
3. 登录后生成行程 → 「我的行程」Tab 显示 → 「公共攻略」Tab 显示存量行程
4. 切换文本模型（6 种）→ 全部生成成功 → `ai_generation.model_name` 记录正确
5. 上传 `picTestCase/case1`（3 张图）→ 识别地点 → 预览删除误识别 → 确认生成 → 详情页正常
6. 上传 `picTestCase/case2`（3 张图）+ `case3`（1 张图）→ 多图合并行程
7. 切换识图模型（3 种）→ 全部识别成功
8. 地图节点颜色区分 4 种 place_type → 路线线型区分 3 种 transport_mode
9. 地图节点 hover → 列表高亮；列表 hover → 地图跳动；列表点击 → 地图平移
10. 地图风格切换日间/夜间/卫星 → 刷新后保留偏好
11. 3D 视角可见 → `setTilt(60)` 生效
12. 50+ 节点行程 → 缩小地图 → 节点聚合显示
13. iPhone SE 模拟（375px）→ 生成表单单列 → 地图全屏 → 底部 Sheet 展开 → 拖拽排序可用
14. 底部 Tab 栏切换地图/列表/详情 → 汉堡菜单展开侧抽屉
15. 编辑他人行程 → 返回 403 → 前端 Toast 提示
