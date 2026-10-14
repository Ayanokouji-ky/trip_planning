# 版本说明（Release Notes）

> 项目：AI 旅游行程规划与地图可视化平台（trip_planning）
> 本文档基于 `dev-plan.md` / `dev-progress.md` 的实际交付进度整理，覆盖 V1（MVP）、V2（迭代）与 V3（体验迭代）三个版本的全部已实现功能。

## 项目简介

用户输入旅游需求（或上传攻略截图）→ AI 生成结构化行程攻略 → 百度地图可视化展示节点与路线 → 支持在线编辑、拖拽排序与导出。技术栈：Spring Boot 2.7.18 + MyBatis（JDK 8）/ React 18 + Vite + TypeScript + Ant Design + Zustand / 百度地图 GL JS API / MySQL 8.0。

## 版本总览

| 版本 | 代号 | 完成日期 | 内容概要 |
|------|------|----------|----------|
| V1.0.0 | MVP（Phase 0–11） | 2026-10-12 | AI 攻略生成 + 地图行程可视化 + 行程管理与拖拽排序 + JSON/PNG 导出 + ECS 部署包 |
| V2.0.0 | 上线反馈迭代（Phase 12–16） | 2026-10-13 | 用户登录与归属隔离 + 可选 AI 模型 + 图片识图生成 + 地图视觉升级 + 移动端体验优化 |
| V3.0.0 | 体验迭代（Phase 17–20） | 2026-10-14 | AI 生成提速约 80% + 节点 AI 智能填充 + 多方式路线推荐与出行建议 + 前端体验优化 + 注册免登录 |

---

## V1.0.0（MVP）

**范围**：AI 攻略生成、地图行程可视化、行程管理（不含用户登录、图片导入、后台管理）。

### 1. 基础设施与后端服务
- Spring Boot 2.7.18 + JDK 8 + Maven Wrapper 脚手架，统一 `ApiResult<T>` 响应与 `GlobalExceptionHandler` 全局异常处理
- MySQL 5 张核心表：`travel_plan` / `plan_day` / `plan_node` / `plan_route` / `ai_generation`
- 健康检查：`GET /api/health`

### 2. 地图服务（百度 API 直连）
- 地理编码 `GET /api/map/geocode`：地址 → BD09 经纬度
- 路线规划 `GET /api/map/route`：驾车距离与耗时（UriComponentsBuilder 防双编码）

### 3. AI 服务（火山方舟）
- 对接 Ark responses API（deepseek-v4-1-flash），结构化输出多天/多节点行程
- `JsonExtractor` 4 步容错解析；每次调用记录至 `ai_generation`（SUCCESS/FAILED）
- 端到端实测：48s 生成「成都 2 日游」（10 节点全部地理编码成功 + 8 条真实驾车路线）

### 4. 行程 / 节点 / 路线 CRUD
- 行程：列表/详情/创建（自动建天）/更新/删除（级联）/复制（ID 重映射）
- 节点：增删改、创建时自动地理编码、自动排序；重排序接口
- 路线：按天重算真实距离耗时，单点失败不中断

### 5. AI 生成编排
- `POST /api/ai/generate`：AI 失败不建行程，成功后单事务持久化 plan + days + nodes（逐节点 geocode 50ms 限流）+ routes，回写 `ai_generation.plan_id`
- 参数校验（@Validated），AI 请求超时 120s

### 6. 前端 Web 应用（React 18 + antd + Zustand）
- 路由：首页 / 行程列表 `/plans` / 行程详情 `/plans/:id` / 生成页 `/generate`
- 行程列表：卡片网格响应式、复制/删除
- 行程详情：操作栏（返回/复制/删除/重算路线）、DayTabs 天筛选、NodeCard 节点卡（类型图标/时长/亮点/门票"仅供参考"）、NodeForm 新增编辑、RouteList 路线明细
- 地图可视化：SVG 编号标记（按节点类型配色）、路线折线、InfoWindow（节点/路线详情）、天筛选联动重绘、卡片↔地图双向联动
- 拖拽排序：dnd-kit 鼠标 + 键盘传感器，乐观更新 → 重排序 → 自动重算路线 → 权威刷新，失败回滚；地图随顺序自动重绘
- AI 生成表单：目的地标签、天数/日期/人数/预算/偏好结构化字段，全屏倒计时遮罩（Xs/120s 四阶段提示）
- 收尾打磨：免责声明全覆盖、全局 ErrorBoundary、JSON 导出（Blob 下载）与 PNG 导出（html2canvas-pro，兼容 antd oklch）、响应式布局、logback 滚动日志

### 7. 部署交付
- ECS 部署包：`application-prod.yml`（环境变量外置）+ Docker Compose（backend + nginx 前端，80 入口/8080 内网）+ SPA 回退与 `/api` 反代
- 一键打包脚本 `build-package.ps1`，产物 `dist-packages/trip-planner-deploy.tar.gz`（21.7MB）

---

## V2.0.0（上线反馈迭代）

**背景**：基于 `prompt.md` 第 10 章线上用户反馈的五点改进需求，在 V1 基础上扩展。新增 `user`、`image_import` 两张表。

### 1. 用户登录与行程归属隔离（Phase 12）
- 注册/登录/当前用户：`POST /api/auth/register`（BCrypt 加盐）、`POST /api/auth/login`、`GET /api/auth/me`
- JWT 鉴权：jjwt HS256，7 天有效期；`JwtInterceptor` 强制鉴权 `/api/**`（GET /api/plans* 可选），`@CurrentUser` 注入当前用户
- 行程归属：生成行程写入 `user_id`；`GET /api/plans?scope=mine|public` 双范围查询；非本人行程操作返回 403
- 存量数据迁移：无主行程标记 `is_public=1`（迁移脚本 `V2__add_user_and_isolation.sql`）
- 前端：登录/注册页、路由守卫（生成页需登录）、请求拦截器自动附加 Token、401 自动跳登录、列表双 Tab「我的行程 / 公共攻略」、行程卡片归属标签

### 2. 可选 AI 模型（Phase 13）
- 模型白名单：文本 6 款 + 识图 3 款（`ModelConstants`），非白名单返回 400
- 生成请求支持可选 `model` 参数，缺省默认文本模型
- 调用失败（RestClientException）自动降级重试到默认模型，响应返回 `degraded` 与 `modelUsed`
- 模型目录接口 `GET /api/ai/models?type=text|image`
- 前端：生成页「AI 模型」下拉（标签配色 + 说明），选择持久化 localStorage；降级 Toast 提示

### 3. 图片一图流攻略识别生成（Phase 14）
- 上传识别：`POST /api/ai/image-import`（multipart，≤9 张、单张 ≤10MB、jpg/jpeg/png/webp），落盘 + base64 送火山方舟识图模型（doubao-seed-2-1-pro）
- 识图提速与稳定性：关闭 thinking（120s → 30–60s）+ 提示词强制 JSON 闭合 + `JsonExtractor` 截断修复兜底
- 确认生成：`POST /api/ai/image-import/confirm` → 复用 V1 持久化链路（geocode + 路线重算），`image_import` 记录全流程状态（迁移脚本 `V3__create_image_import.sql`）
- 前端：生成页双 Tab「文本生成 / 图片导入」；上传区支持拖拽/点击/粘贴截图；缩略图拖拽排序与删除；结果编辑态（按天分组，可编辑名称/类型/时长、删除、添加节点、修改标题）；识别全程 120s 倒计时遮罩
- 实测：单图 31.3s / 3 图 44.9s / 4 图 58.4s，4 图合并为 3 天 15 节点行程并成功确认生成

### 4. 地图视觉与交互优化（Phase 15）
- 标记美化：水滴形编号 pin（按类型配色 景点蓝/餐厅橙/酒店紫/交通绿/其他灰），起点绿旗、终点黑白格纹旗
- 路线美化：按交通方式线型（驾车实线/步行虚线/公交点线/骑行虚线）+ 起浅终深渐变色 + hover 加粗高亮
- 视野自适应：绘制完成后 `setViewport` 自动包纳全部节点；挂载后 3D 视角（tilt 60°）
- 双向联动增强：列表 hover ↔ 地图标记跳动（BOUNCE）双向同步，卡片自动 scrollIntoView
- 地图风格切换：日间/夜间/卫星三态 Segmented，偏好持久化（`trip.mapStyle`）
- 大数据量优化：>50 个定位节点启用网格聚合（点击放大、缩放联动重算）
- 体验细节：加载骨架屏、玻璃拟态 InfoWindow（毛玻璃 blur）

### 5. 窄屏与移动端体验优化（Phase 16）
- 响应式骨架：`useBreakpoint` Hook（<768px 判定移动端，首帧防闪跳）
- 布局适配：窄屏汉堡菜单侧抽屉替代侧边栏；生成表单固定底部提交栏；详情页切换为「地图（60vh）+ 底部 Tab（地图/列表/详情）+ 列表抽屉（75vh）」移动端信息架构
- 移动交互：节点详情全屏覆盖层（左右滑动切换 + 上/下一个按钮）；拖拽改用 Touch + Mouse 传感器（8px 激活距离）+ 键盘传感器
- 地图增强：全屏按钮（Fullscreen API）+ ResizeObserver 容器变化自动 `map.resize()`
- 触摸友好：44px 最小触摸目标、`viewport-fit=cover` + `env(safe-area-inset-bottom)` 刘海屏安全区、`font-size: 16px` 防 iOS 聚焦缩放
- 验证：375/412px 宽度无横向滚动，移动端全流程冒烟通过

---

## V3.0.0（体验迭代）

**范围**：基于 V3 开发计划（dev-plan.md Phase 17–20）的体验与效率迭代，另含注册流程修复优化。

### 1. AI 文本生成提速（Phase 17）
- 火山方舟调用统一注入 `"thinking":{"type":"disabled"}`，提示词瘦身（紧凑 schema + 字数限制 + JSON 闭合指令），`max_output_tokens=8000` 防长尾
- 实测同需求 3 次生成 10.2/10.4/10.5s（基线 48–58s，**提速约 80%**），JSON 完整无截断，节点数与 V2 产出一致

### 2. 节点 AI 智能填充（Phase 18）
- 新增 `POST /api/ai/enrich-node`：输入地点名（+可选城市），AI 返回类型/建议时长/亮点/简介/开放时间/门票/预估费用
- 新增/编辑节点表单「AI 填充」按钮一键回填 7 字段（可继续修改），生僻名容错降级（仅返回 OTHER）
- 实测「宽窄巷子」2.2s 全字段返回，免费景点预估费用正确为 0

### 3. 多方式路线推荐（Phase 19）
- 百度 direction v2 四端点分发（驾车/公交/步行/骑行），公交多方案取耗时最短
- 距离分档策略：≤1km 步行 / 1–5km 公交优先（失败降级驾车）+ 打车估价 / 5–30km 公交驾车取优 / >30km 驾车
- 打车本地估价（base 14 元 + 超 3km × 2.3 元/km，按驾车距离估算，避免公交绕行偏高约 30%）
- `plan_route` 新增 `suggestion` 出行建议文案列（迁移脚本 `V4__add_route_suggestion.sql`），路线列表与地图信息窗展示（如「建议公交/地铁约 25 分钟；打车约 18 元，仅供参考」）
- 实测四档全符合预期，5 节点行程重算仅 1.7s

### 4. 前端体验优化（Phase 20）
- 拖拽升级为**整卡拖拽**（listeners 上卡根，8px 阈值下点击与拖拽共存），拖拽中 grabbing 阴影，原手柄缩为视觉提示
- 单天模式节点卡与路线卡**交错布局**（新组件 RouteCard 竖向连接线：NodeCard→RouteCard→NodeCard），「全部」Tab 保持按天分组
- 生成页视觉：渐变 hero + 进场动画、卡片 hover 浮起、按钮渐变；AI 遮罩新增顶部流动进度条
- 375px 窄屏回归无横向溢出，移动端 Drawer 自动继承新布局

### 5. 注册体验优化（2026-10-14）
- 修复 `/api/auth/register` 只返用户信息（无 token）导致前端自动登录失效、被路由守卫弹回登录页的问题——**注册成功即自动登录直达行程列表**
- 注册表单新增**确认密码**（两次输入不一致即时提示）
- 邮箱改为可选（与前端表单标注一致），空串归一化为 null，非法格式仍 400 拒绝

---

## 数据库版本

| 版本 | 脚本 | 内容 |
|------|------|------|
| 初始 | `db/schema.sql` | 5 张核心表（travel_plan / plan_day / plan_node / plan_route / ai_generation） |
| V2 | `db/migration/V2__add_user_and_isolation.sql` | `user` 表；`travel_plan` 增加 `user_id`/`is_public`；`ai_generation` 增加 `user_id`；存量行程标记公共 |
| V3 | `db/migration/V3__create_image_import.sql` | `image_import` 表（识图记录全流程） |
| V4 | `db/migration/V4__add_route_suggestion.sql` | `plan_route` 增加 `suggestion` 出行建议文案列 |

**V1 → V3 升级提示**：需依次执行 V2、V3、V4 迁移脚本，并配置 `jwt.secret`、`jwt.expiration`、识图模型相关配置项与 `app.route.taxi.*` 打车估价参数（缺省有默认值）。

## 已知限制

- 地图底图在部分受限网络下瓦片显示灰色（真实网络正常）
- 图片识别地理编码存在少量未命中（实测 15 节点命中 13，属容错预期，未定位节点地图上不显示）
- 前端构建产物单 chunk 超 1500kB（体积警告，不影响运行）
- 全屏 API 与真实拖拽体验需在真机浏览器验证（headless 受控环境受限）
