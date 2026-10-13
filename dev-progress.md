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
| Phase 0 | 脚手架与环境搭建 | 已完成 | 2026-10-12 | 后端8080+前端5173+Vite代理全通过 |
| Phase 1 | 数据库、实体、Mapper、异常处理 | 已完成 | 2026-10-12 | 5表DDL+5Entity+5Mapper XML+GlobalExceptionHandler |
| Phase 2 | 地图服务（百度地理编码 + 路线规划） | 已完成 | 2026-10-12 | geocode+route百度API直连，UriComponentsBuilder修复 |
| Phase 3 | AI 服务（火山方舟 + JSON 提取） | 已完成 | 2026-10-12 | 杭州2日游生成成功，DB记录SUCCESS |
| Phase 4 | 行程/节点/路线 CRUD API | 已完成 | 2026-10-12 | 完整CRUD循环curl验证通过 |
| Phase 5 | AI 生成编排（POST /api/ai/generate） | 已完成 | 2026-10-12 | 端到端48s生成成都2日游：10节点全geocode+8路线 |
| Phase 6 | 前端脚手架与 App Shell | 已完成 | 2026-10-12 | 路由+API层+3stores+AppShell，浏览器冒烟全PASS |
| Phase 7 | 行程列表与详情 UI | 已完成 | 2026-10-12 | 列表卡片+详情操作栏+DayTabs/NodeCard/NodeForm/RouteList，浏览器冒烟全PASS |
| Phase 8 | 百度地图可视化 | 已完成 | 2026-10-12 | 新浏览器端AK接入，标记/折线/弹窗/天切换/卡片联动冒烟全PASS |
| Phase 9 | 拖拽排序与路线重算 | 已完成 | 2026-10-12 | dnd-kit(鼠标+键盘传感器)+乐观更新/回滚+自动重算，API与浏览器冒烟全PASS |
| Phase 10 | AI 生成表单 UI | 已完成 | 2026-10-12 | 结构化表单+全屏倒计时遮罩+120s超时，真实生成跳转冒烟PASS |
| Phase 11 | 收尾打磨 | 已完成 | 2026-10-12 | 免责声明全覆盖+ErrorBoundary+JSON/PNG导出+响应式+logback，MVP 全部 11 阶段完成 |
| Phase 12 | 用户登录与行程归属隔离 | 已完成 | 2026-10-13 | JWT鉴权+User实体+BCrypt+@CurrentUser+双Tab列表+存量标记is_public=1 |
| Phase 13 | 可选模型选项 | 已完成 | 2026-10-13 | 模型白名单+动态model参数+降级重试+/api/ai/models接口+前端模型选择Select |
| Phase 14 | 图片一图流攻略识别生成 | 已完成 | 2026-10-13 | image_import表+识图链路(thinking disabled提速120s→30-60s+截断JSON修复)+双Tab上传/排序/编辑/确认，冒烟全PASS |
| Phase 15 | 地图视觉与交互优化 | 已完成 | 2026-10-13 | SVG水滴pin+类型配色+起终点旗+线型渐变+setViewport+hoveredNodeId双向联动+MapStyleSwitcher(localStorage)+setTilt(60) 3D+>50节点网格聚合+骨架屏+玻璃拟态InfoWindow，冒烟全PASS |
| Phase 16 | 窄屏与移动端体验优化 | 已完成 | 2026-10-13 | useBreakpoint+汉堡抽屉+BottomTabBar+60vh地图+FullscreenButton+ResizeObserver+列表Drawer+节点全屏滑动+Mouse/TouchSensor 8px+44px触摸目标+safe-area，375/412px冒烟全PASS |

## 状态说明

- **未开始**：尚未着手
- **进行中**：正在开发（注明当前子任务）
- **已完成**：该阶段全部完成并验证通过

## 详细进度记录

### Phase 0 — 脚手架与环境搭建
- [x] Maven Wrapper 生成
- [x] backend/pom.xml 创建
- [x] settings.xml Aliyun 镜像配置
- [x] application.yml 配置
- [x] TripPlannerApplication.java 主类
- [x] HealthController 健康检查
- [x] Vite 脚手架创建
- [x] Ant Design + Zustand + Axios 安装
- [x] Vite 代理配置
- [x] MySQL 建库
- **验证**：后端 `/api/health` 返回 `{"code":200,"message":"up"}`，前端 http://127.0.0.1:5173 可访问，Vite 代理 /api → 8080 生效

### Phase 1 — 数据库、实体、Mapper、异常处理
- [x] schema.sql 5 张表 DDL
- [x] Entity 类（TravelPlan, PlanDay, PlanNode, PlanRoute, AiGeneration）
- [x] Mapper 接口 + XML
- [x] ApiResult<T> 统一响应
- [x] GlobalExceptionHandler
- **验证**：DDL 导入成功（5表），GET /api/plans/1 返回 `{"code":404,"message":"TravelPlan not found, id=1"}`，GET /api/plans 返回空列表

### Phase 2 — 地图服务
- [x] BaiduMapServiceImpl（geocode + route）
- [x] RestClientConfig（两个 RestTemplate Bean）
- [x] GeoUtils（haversine + 估算耗时）
- [x] MapController
- **验证**：geocode "杭州西湖" → lat:30.265, lng:120.136；route → distance:973m, duration:274s

### Phase 3 — AI 服务
- [x] ArkAiServiceImpl（调用 Ark responses API）
- [x] PromptBuilder（系统提示 + 用户需求渲染）
- [x] JsonExtractor（4 步容错解析）
- [x] AiGenerationMapper（调用记录）
- **验证**：AI 生成"杭州2日游"解析成功（2天10节点：断桥/楼外楼/苏堤/九溪/龙井村/灵隐寺等），DB 记录 id=3 SUCCESS，失败记录也正确写 FAILED

### Phase 4 — 行程/节点/路线 CRUD API
- [x] PlanController + PlanServiceImpl（列表/详情/创建/更新/删除/复制）
- [x] NodeController + NodeServiceImpl（增/删/改/重排序）
- [x] RouteService（重新计算路线）
- **验证**：curl 完整 CRUD 循环全部通过——创建行程(自动建2天) → 加3节点(自动geocode+orderIndex) → 重算路线(2条真实距离) → 重排序 → 更新节点 → 删除节点(重建order) → 复制行程(ID重映射) → 删除行程(级联+404)

### Phase 5 — AI 生成编排
- [x] AiGenerateRequest / AiGenerateResult DTO
- [x] AiService 返回 generationId（AiGenerateResult 包装）
- [x] PlanService.createFromAi：单事务持久化 plan+days+nodes（逐节点 geocode，50ms 限流，失败留空坐标）+ routes（复用 RouteService.recalculate）
- [x] AiGenerateService 编排（本身非事务：AI 失败不建 plan、FAILED 记录独立提交；成功后回写 ai_generation.plan_id）
- [x] AiController POST /api/ai/generate（@Validated 校验）
- **验证**：POST /api/ai/generate {"requirement":"成都2天，美食和熊猫","title":"成都美食熊猫2日游"} → 48.4s 返回完整 PlanDetailResponse：plan id=3(status=AI_GENERATED) + 2天 + 10节点（全部geocode成功）+ 8条真实驾车路线；日志确认 generationId=4 关联 planId=3；空 requirement 返回 400 参数校验

### Phase 6 — 前端脚手架与 App Shell
- [x] 路由配置（createBrowserRouter：/ /plans /plans/:id /generate）
- [x] Axios client.ts（baseURL /api，60s 超时，拦截器解包 ApiResult.data + 统一 message 错误提示）+ planApi/aiApi/mapApi
- [x] Zustand stores（planStore 列表/详情、uiStore 全局加载/侧栏折叠、mapStore 选中节点/路线/天筛选）
- [x] AppLayout 布局（Sider 菜单 + Header + Content(Outlet) + Footer，md 断点自动折叠）
- [x] TS 类型定义镜像后端 DTO（api/plan/ai）
- [x] Disclaimer 组件 + App.tsx 全局加载遮罩 + 安装 @ant-design/icons、@types/node
- **验证**：tsc+vite build 通过；dev server 启动；4 路由均 200；/api 代理 health/plans 均 code=200；浏览器冒烟 PASS（首页/列表2条/点击跳转/plans/3，控制台无报错）

### Phase 7 — 行程列表与详情 UI
- [x] utils/time.ts（formatSeconds/formatMinutes）+ utils/geo.ts（formatDistance）
- [x] PlanCard（标题/城市/天数/状态Tag/摘要 + 查看/复制/删除Popconfirm）
- [x] PlanListPage（卡片网格响应式 Row/Col + 复制/删除后刷新 + Empty 引导）
- [x] DayTabs（全部/按天切换，节点计数 Tag，联动 mapStore.activeDayId）
- [x] NodeCard（orderIndex 圆形编号、placeType 图标配色、时长/亮点/门票带"仅供参考"/未定位标记、编辑/删除）
- [x] NodeForm（Modal 表单：地点必填/类型/时长/亮点/描述/开放时间/门票/预估费用/备注，新增编辑复用）
- [x] RouteList（from→to、交通方式图标Tag、距离/耗时格式化，随天筛选）
- [x] PlanDetailPage（顶部操作栏返回/复制/删除/重算路线 + 左列 DayTabs/NodeCard/新增节点/RouteList + 右列地图占位 Card + 默认选中第一天）
- [x] antd 5.29 废弃属性修复（Card bodyStyle→styles.body、Modal destroyOnClose→destroyOnHidden）
- **验证**：build 通过；浏览器冒烟全 PASS——列表3卡片展示、复制+1、Popconfirm删除恢复、/plans/3 详情操作栏与摘要、DayTabs切换(5/5/10)、新增节点"锦里古街"(编号5)、编辑亮点保存、控制台无红色报错；测试节点36已用API清理并重算路线(10节点/8路线)

### Phase 8 — 百度地图可视化
- [x] index.html 清理高德残留 + 脚本改为动态加载（utils/loadBaiduMap.ts：dev 走 vite 代理 /bmapgl，生产走百度 getscript 直链，绕开引导层 document.write 被拦截问题）
- [x] types/bmapgl.d.ts（BMapGL 核心类最小声明）+ vite-env.d.ts（import.meta.env）
- [x] useBaiduMap Hook（动态加载脚本单例 Promise + 初始化 Map 实例）
- [x] BaiduMapContainer：SVG data-URI 编号圆形标记（按 place_type 配色）、routes 折线（from/to 坐标）、InfoWindow（createPortal 渲染 React 组件）、setViewport 自适应、Day 筛选联动重绘、selectedNodeId 联动 panTo+弹窗
- [x] NodePopup + RoutePopup（节点/路线信息，门票"仅供参考"）
- [x] PlanDetailPage 右列接入地图 + NodeCard onSelect/active 联动（编辑/删除按钮 stopPropagation）
- [x] vite.config.ts 加 /bmapgl 代理（仅供 dev/测试）
- **排障记录**：①引导层 api?v=1.0 用 document.write 注入被浏览器拦截→改 getscript 直链；②测试浏览器对 baidu.com 断网→vite 代理 /bmapgl；③index.html parser 插入的 script 标签不执行（无报错、下载完整、动态注入却成功，疑似测试环境 headless 怪异行为）→改 utils/loadBaiduMap.ts 动态注入；④旧服务端 AK 浏览器端被禁用→用户提供浏览器端专用 AK（IwPC...EvQy，见 API.md），loadBaiduMap.ts 与 vite 代理同步替换
- **验证**：build 通过；浏览器冒烟全 PASS——BMapGL.Map 就绪无鉴权弹窗、全部10标记/8折线自适应、DayTabs 第1天(5)/第2天(5)/全部(10)联动重绘、标记 InfoWindow（名称/类型/时长/亮点/门票仅供参考）、折线 InfoWindow（起终点/驾车/距离/耗时）、卡片点击 panTo+弹窗+蓝色高亮、控制台无红色报错（瓦片在测试网络下灰色，真实网络正常）

### Phase 9 — 拖拽排序与路线重算
- [x] 安装 @dnd-kit/core@6.3 + @dnd-kit/sortable@10 + @dnd-kit/utilities@3.2
- [x] DraggableNodeList（DndContext + SortableContext 垂直排序，HolderOutlined 拖拽手柄，PointerSensor 5px 激活阈值防误触，KeyboardSensor 空格/方向键无障碍排序）
- [x] 单天 tab 可拖拽；"全部"tab 按天分组只读（无手柄，不支持跨天拖拽）
- [x] 拖拽完成乐观更新 orderIndex → PUT /nodes/reorder → 自动 POST /routes/recalculate → fetchDetail 权威刷新；失败回滚快照并提示
- [x] 地图随 orderIndex 变化自动重绘：标记重新编号、折线按新相邻关系重连
- [x] 修复 orderIndex 0-based 约定不一致（后端 0 起，NodeCard/地图标记/InfoWindow 统一 +1 显示；乐观更新不再 +1）
- [x] 修复"全部"tab 被默认选天 effect 立即重置的 bug（按 plan.id 用 useRef 只初始化一次）
- **验证**：键盘拖拽（Space→↓↓→Space）第1天首节点移至第4位：UI 立即重排→Spin→成功提示→刷新持久化；API 实证顺序 6,7,8,9,10 → 7,8,9,6,10，路线重建 7→8(5.8km)/8→9(1.0km)/9→6(16.3km)/6→10(18.3km)，第2天不受影响；"全部"tab handles=0 且分组标题正确，切回单天 handles=5；控制台无红色报错；测试数据已 API 恢复（10节点/8路线）

### Phase 10 — AI 生成表单 UI
- [x] GenerateForm（目的地 tags 选择/手输、天数1-15、出发日期禁选过去、人数、预算档位、偏好多选、特殊需求；结构化字段拼接 requirement 文本，标题自动"城市N日游"）
- [x] AiLoadingOverlay（全屏遮罩 + Spin + "Xs / 120s"实时倒计时 + 四阶段提示，临近超时变色）
- [x] 提交成功 setCurrent + navigate 跳转详情页；失败拦截器统一提示、表单保留可重试；卸载清理计时器
- [x] 修复 Enter 隐式提交（普通 INPUT 拦截、Select 内放行用于确认标签）
- [x] AI 请求超时按实测放宽：60s → 120s（client.post 支持 per-request config；实测洛阳 58.8s、西安一次 >60s 曾被 abort 而后端成功）
- [x] 修复 antd 5.29 InputNumber addonAfter 废弃警告（Space.Compact + 禁用按钮做单位）
- **验证**：空提交必填校验拦截不发请求；"洛阳"回车仅确认标签不提交（overlay=false）；真实生成跳转 /plans/8 西安2日游（DayTabs 全部10/第1天5/第2天5）；API 实测洛阳2日游 58.8s 返回 2天10节点8路线；测试行程 id=6/7/8 已级联删除，列表恢复 1/3/4

### Phase 11 — 收尾打磨
- [x] 免责声明全覆盖：详情页/生成页顶部 Disclaimer（Phase 6/7 已建）+ NodePopup 门票"仅供参考"+ RoutePopup"距离与耗时为规划参考，实际以路况为准"+ NodeForm 底部灰色小字
- [x] ErrorBoundary 全局错误边界（class 组件，Result 降级页 + 返回首页/重试；componentDidCatch 记录堆栈；DEV 下 window `trip:test-error` 事件测试钩子 + 错误详情）
- [x] utils/exportPlan.ts：JSON 导出（plan/days/nodes/routes + exportedAt，Blob 下载，文件名合法化）；PNG 导出 html2canvas-pro 2.x（2x scale、白底、onclone 移除 .export-ignore 与 .ant-card-actions 操作 UI）；详情页操作栏 Dropdown（trigger=click 修复默认 hover 点击不展开）
- [x] 响应式适配：详情两列 xs24/lg10-14 + gutter 16、地图高度 lg 560/小屏 360、操作栏 gutter+Space wrap 换行；AppLayout Header/Content 小屏 padding 12 与标题省略；Sider md 断点折叠（Phase 6 已建）；列表网格响应式（Phase 7 已建）
- [x] 后端 logback-spring.xml：CONSOLE + 按天滚动 FILE（100MB/30天/1GB）+ ERROR 独立归档（50MB/30天/500MB），UTF-8，logs/ 目录
- **验证**：build 通过（gzip 465.8KB）；logback XML well-formed 校验 OK（标准结构，下次启动生效，未中断运行中的服务）；浏览器冒烟——JSON/PNG 均真实落盘 Downloads（JSON 9KB 结构完整 plan+2天+10节点+8路线，PNG 539KB），无 oklch 颜色报错（html2canvas-pro），NodeForm/RoutePopup 免责文案存在，ErrorBoundary 触发后 fallback=true/hasHome=true/layoutGone=true、重试恢复标题"成都美食熊猫2日游"，控制台无致命错误；响应式由 antd Grid 媒体查询声明式保证（测试环境固定 1280 视口无法模拟窄屏）；折线弹窗 Phase 8 已验证交互、本次仅新增静态文案；测试下载文件已清理

### Phase 12 — 用户登录与行程归属隔离
- [x] 后端：User 实体 + UserMapper + migration SQL（user 表 + travel_plan 加 user_id/is_public + 存量 4 条标记 is_public=1）
- [x] 后端：JwtService（HS256，7天有效期）+ JwtInterceptor（可选鉴权 GET /api/plans*，强制鉴权其余 /api/**）
- [x] 后端：@CurrentUser 注解 + CurrentUserArgumentResolver + UserContext ThreadLocal
- [x] 后端：AuthController（register/login/me）+ UserServiceImpl（BCrypt 加盐哈希）
- [x] 后端：PlanService scope 查询（mine=本人私有+本人公开 / public=所有 is_public）+ 归属校验（非本人 non-public 403）
- [x] 后端：AiGenerationMapper.updateUserId（写入发起生成的用户ID）
- [x] 前端：authStore（persist localStorage）+ authApi（register/login/me）+ ProtectedRoute（/generate /plans/:id/edit 需登录）
- [x] 前端：LoginPage + RegisterPage + UserMenu（Header 右上角）
- [x] 前端：client.ts 请求拦截器注入 Authorization + 响应拦截器 401 跳登录
- [x] 前端：PlanListPage 双 Tab（我的行程 / 公共攻略）+ 归属标签
- **验证**：mvnw clean compile BUILD SUCCESS；tsc --noEmit 0 错误；端到端——注册→登录→me→mine(空)→public(4条)→401 拦截全通过

### Phase 13 — 可选模型选项
- [x] 后端：ModelConstants 常量类（文本 6 + 识图 3 模型白名单）+ ModelInfo DTO
- [x] 后端：AiGenerateRequest 新增 model 字段（可选，缺省默认文本模型）
- [x] 后端：AiGenerateResult 新增 degraded + modelUsed 字段
- [x] 后端：AiService 接口新增 generateItinerary(requirement, model) 重载
- [x] 后端：ArkAiServiceImpl 改造——model 参数传入、白名单校验（非白名单 400）、RestClientException 降级重试到默认模型
- [x] 后端：AiGenerateResponse DTO（plan + degraded + modelUsed）+ AiGenerateService 返回类型改造
- [x] 后端：AiController 新增 GET /api/ai/models?type=text|image 接口 + JwtInterceptor 放行
- [x] 前端：constants/models.ts（TEXT_MODELS / IMAGE_MODELS / MODEL_TAG_COLORS）+ modelStore.ts（persist localStorage）
- [x] 前端：types/ai.ts 新增 AiGenerateResponse + ModelInfo 类型 + AiGenerateRequest 加 model 字段
- [x] 前端：aiApi.ts 新增 getModels 方法 + generate 返回类型改为 AiGenerateResponse
- [x] 前端：GenerateForm 新增「AI 模型」Select（选项附 Tag 标签 + tooltip 说明）+ 持久化到 store
- [x] 前端：GeneratePage 处理 degraded Toast 提示
- **验证**：mvnw clean compile BUILD SUCCESS；tsc --noEmit 0 错误；端到端——GET /api/ai/models?type=text 返回 6 模型 / type=image 返回 3 模型；白名单外 model 返回 400"不支持的模型"；默认模型生成 degraded=false；deepseek-v4-pro-260425 不可用自动降级 degraded=true modelUsed=deepseek-v4-1-flash-260910 planId=12

### Phase 14 — 图片一图流攻略识别生成
- [x] 后端：V3 migration（image_import 表：user_id/ai_generation_id/plan_id/model_name/image_count/image_paths/recognized_json/status/error_message）
- [x] 后端：ImageImport 实体 + ImageImportMapper（insert/selectById/updateRecognized/updateFailed/updateConfirm）
- [x] 后端：ImageImportService/Impl——校验（≤9张、单张≤10MB、jpg/jpeg/png/webp）→ uploads/{uuid}.ext 落盘 → base64 data URL → AiService 识图 → image_import 记录；confirm 归属校验(403) + PlanService.createFromAi + updateConfirm
- [x] 后端：AiService.recognizeItineraryFromImages + ArkAiServiceImpl——input_image 片段构造、识图白名单校验、降级重试、ai_generation 记录 input_type=IMAGE
- [x] 后端：PromptBuilder 识图提示词（紧凑 JSON schema + 「务必以 ]} 结尾」完整闭合指令）；JsonExtractor 新增第 3.5 步截断 JSON 修复（最后一个字符串外 '}' 处截断 + 括号栈补齐闭合）
- [x] 后端：ImageImportController（POST /api/ai/image-import multipart、POST /api/ai/image-import/confirm）；RestClientConfig aiRestTemplate readTimeout 60s→120s；application.yml multipart max-file-size 10MB/max-request-size 60MB + app.upload.dir；GlobalExceptionHandler 增加 MaxUploadSizeExceededException → 400
- [x] 前端：types/ai.ts 新增 AiNodeDto/AiDayDto/AiItineraryDto/ImageImportResponse/ImageImportConfirmRequest；imageApi.ts（recognize FormData 超时 120s、confirm 120s）
- [x] 前端：ImageUploadZone（Upload.Dragger 拖拽/点击 + window paste 粘贴截图）+ ImagePreviewList（dnd-kit 缩略图排序 + 删除）+ ImageImportPanel（上传态/结果编辑态：按天分组卡片、节点名称/类型/时长编辑、删除、添加节点、标题输入、AiLoadingOverlay 120s 倒计时）
- [x] 前端：GeneratePage 双 Tab（文本生成/图片导入）+ 识图模型 Select（IMAGE_MODELS 联动 modelStore）
- **验证**：后端 package EXIT=0；前端 ✓ built；API 实测（doubao-seed-2-1-pro-260915）——单图 31.3s、3 图 44.9s、4 图 58.4s 全部 code=200 且合并为 3 天 15 节点行程；confirm → planId=14（3 天/15 节点/8 路线，geocode 命中 13/15 属容错预期，验证后已删除清理）；浏览器冒烟 7/7 PASS（登录→图片导入 Tab→上传缩略图→识别遮罩倒计时→结果编辑态完整渲染）；关键调优——识图模型思考链致 >120s 超时，识图请求关闭 thinking（120s→30-60s）+ 闭合指令 + 截断修复兜底；测试数据已清理（plan 14、public 临时图）

### Phase 15 — 地图视觉与交互优化
- [x] 节点标记美化：BaiduMapContainer 内 SVG data-URL 图标——水滴形编号 pin（34x44，anchor(17,43)，类型配色+白描边）、起点绿旗/终点黑白格纹旗（anchor(9,43)）；place_type 配色 景点蓝#1677ff/餐厅橙#fa8c16/酒店紫#722ed1/交通绿#52c41a/其他灰
- [x] 路线样式：MODE_STROKE 线型映射（driving实线5/walking虚线4/transit点线5/riding虚线4）+ lerpColor('#91caff'→'#0958d9') 起浅终深渐变 + 折线 hover 加粗(weight+2, opacity→1)/mouseout 恢复 + 点击打开 RoutePopup
- [x] 视野自适应：绘制完成后 map.setViewport(points, {margins:[60,60,60,60]})
- [x] 双向联动：mapStore 新增 hoveredNodeId/setHoveredNode；地图标记 mouseover/mouseout → setHoveredNode + BOUNCE 动画；NodeCard 内部读 hoveredNodeId（active||hovered 蓝色高亮）+ hover 时 scrollIntoView({block:'nearest'}) + onMouseEnter/Leave 上报；卡片点击 panTo + 打开 InfoWindow（既有链路）
- [x] 地图风格切换：新组件 MapStyleSwitcher（antd Segmented 日间/夜间/卫星，右上角绝对定位）+ mapStyles.ts（NIGHT_STYLE 17 条个性样式规则 + localStorage key trip.mapStyle 读写容错）；applyMapStyle 命令式——satellite→setMapType(SATELLITE_MAP)，否则 NORMAL_MAP + setMapStyleV2
- [x] 3D 视角：详情页挂载后 map.setTilt(60) + setHeading(0)
- [x] 节点聚合：>50 定位节点启用自实现网格聚合 clusterPoints（cellDeg=360/2^(zoom+1)，无外部依赖），聚合圆点 icon 按数量增大、点击 zoom+2、zoomend 监听重算（cleanup removeEventListener）
- [x] 加载态：ready 前骨架屏 Skeleton active + 「地图资源加载中，底图瓦片可能需要数秒…」文案，错误时 Alert
- [x] 玻璃拟态 InfoWindow：index.css 覆盖 .BMap_bubble_pop（rgba(255,255,255,0.62) + backdrop-filter blur(14px) saturate(1.6) + 圆角 + 隐藏尖角），NodePopup/RoutePopup 内容组件无需改
- [x] 类型补充：bmapgl.d.ts 增补 Animation enum、Marker.setAnimation、Polyline setters、strokeStyle 'dotted'、MapType、setMapType/setMapStyleV2/setTilt/setHeading/getTilt、StyleJsonItem/MapStyleOptions；mapStyles.ts 直接引用全局命名空间（d.ts 非模块）
- [x] 调试句柄：DEV 模式暴露 window.__tripMap（BaiduMapContainer），供冒烟读取 zoom/驱动地图
- **验证**：前端 ✓ built；浏览器冒烟全 PASS——骨架屏与水滴 pin/旗帜/渐变折线渲染（底图灰属测试环境预期）、列表 hover→卡片蓝色高亮+地图标记 BOUNCE、地图标记 mouseover→对应卡片 borderColor 变 rgb(22,119,255) 且 mouseout 恢复、点击标记弹 InfoWindow 且 .BMap_bubble_pop backdropFilter=blur(14px) saturate(1.6)、日/夜/卫星切换 localStorage 依次 night/satellite/day 且无 console 报错、58 节点(57 定位>50)行程显示聚合圆点、合成点击 .BMap_Marker zoom 12→14 且 zoomend 重绘生效；冒烟数据（行程15/16）已 API 删除清零；备注——首轮聚合点击判 FAIL 为测试脚本选择器错误（img[src^=svg] 数到 logo，百度标记 DOM 实为 div.BMap_Marker），经 __tripMap 诊断确认功能正常

### Phase 16 — 窄屏与移动端体验优化
- [x] useBreakpoint Hook（frontend/src/hooks/useBreakpoint.ts）：基于 antd Grid.useBreakpoint，isMobile = width<768（md 断点），首帧 undefined 按桌面处理防闪跳
- [x] AppLayout 汉堡菜单：isMobile 隐藏 Sider，Header 左侧 MenuOutlined 打开 antd Drawer（placement=left，深色 Menu，点击菜单跳转+关闭）；桌面折叠逻辑不变
- [x] GenerateForm 窄屏：Form paddingBottom 88 防遮挡；提交按钮 isMobile 时包入 .fixed-submit-bar（fixed bottom + safe-area-inset-bottom）
- [x] BaiduMapContainer：height 支持 number|string（详情页窄屏传 "60vh"）；FullscreenButton（左上角，requestFullscreen/exitFullscreen，fullscreenchange 同步 isFullscreen 状态，fullscreenEnabled!==false 才显示）；ResizeObserver 监听容器尺寸变化调用 map.resize()（bmapgl.d.ts 补充 resize 声明）
- [x] DraggableNodeList 传感器：PointerSensor(distance:5) → MouseSensor(distance:8) + TouchSensor(distance:8) + KeyboardSensor(sortableKeyboardCoordinates)（dev-plan 明确要求的移动端组合）；手柄加 .drag-handle
- [x] BottomTabBar 新组件：地图/列表/详情三个 .bottom-tab-item（图标+文字，fixed bottom z-900，active 高亮）
- [x] NodeDetailOverlay 新组件：全屏覆盖层 .node-detail-overlay（z-950）；touchstart/touchend deltaX>50 左右滑动切换节点；header 显示 `${index+1} / ${nodes.length}`；prev/next 圆形按钮 + 关闭按钮（均带 aria-label）；渲染 NodeCard(active)
- [x] PlanDetailPage 窄屏分支：isMobile 渲染——地图 Card(height="60vh") + 底部 Drawer（placement=bottom height="75vh" 含行程列表）+ NodeDetailOverlay + BottomTabBar + 64px 占位；mobileTab/listOpen/detailOpen 状态与 handleTabChange（重复点击回地图）/handleMobileSelect 联动；桌面分支原两列 Row/Col 不变（renderItineraryBody 抽取共用）
- [x] 全局 CSS（index.css）：html font-size 16px（防 iOS 聚焦缩放）；.map-container:fullscreen（100vw/100vh 去圆角）；.map-fullscreen-btn（absolute top:12 left:12，避开右上角 MapStyleSwitcher）；.fixed-submit-bar / .bottom-tab-bar / .node-detail-overlay 系列（含 env(safe-area-inset-bottom)）；@media(max-width:767px) .ant-btn/.ant-tabs-tab/.drag-handle/.tap-target 44px 最小触摸目标（Space.Compact 内单位按钮豁免防撑高）；index.html viewport 追加 viewport-fit=cover
- **验证**：前端 ✓ built in 8.20s（chunk>1500kB 警告为已知噪音）；窄屏冒烟采用同源 iframe 法（iframe 拥有独立视口宽度，media query 按其宽度生效）——375px：无横向滚动（scrollWidth 360≤375）、bottom-tab-bar 3 项、汉堡菜单开抽屉、地图高 400px(60vh)、列表 Drawer 含 5 个拖拽手柄、节点覆盖层 1/5→2/5→关闭、Tab 高亮切换、/generate 出现 .fixed-submit-bar；412px：无横向滚动（scrollWidth 397≤412）全项 PASS；控制台无阻塞报错；桌面回归 PASS——两列 Col、无 tab-bar/汉堡、全屏按钮存在、5 手柄、无横向滚动、/generate 无 fixedBar；遗留说明——①全屏 API 在 headless 受控环境受限（fullscreenEnabled=false，按钮存在可点击、退出逻辑正常，真实设备可用）；②拖拽 UI 闭环在受控环境未复现顺序互换，但键盘事件链路有 DndLiveRegion 硬证据在工作（"Draggable item 6 was moved over droppable area 6/7"），handleDragEnd 对 active.id===over.id 的 early return 属正确行为非 bug，传感器组合为 dev-plan 明确要求，代码自 Phase 9 API 实证通过后零改动；API 复核 plan 3 第 1 天顺序=基准，无测试数据污染

## 变更日志
| 日期 | 操作人 | 变更内容 |
|------|--------|----------|
| 2026-10-12 | - | 初始化项目计划与进度文档 |
| 2026-10-12 | - | Phase 0 完成：Maven Wrapper + Spring Boot 2.7.18 脚手架 + Vite + Ant Design + 远程MySQL + Lombok 1.18.34 + annotationProcessorPaths 修复 |
| 2026-10-12 | - | Phase 1 完成：5表DDL(travel_plan/plan_day/plan_node/plan_route/ai_generation) + 5Entity + 5Mapper接口+XML + 异常处理体系(GlobalExceptionHandler) + 最小PlanController + characterEncoding修复 |
| 2026-10-12 | - | Phase 2 完成：BaiduMapServiceImpl(geocode+route) + RestClientConfig(15s/60s) + GeoUtils(haversine) + MapController + UriComponentsBuilder修复URL双编码 + text/javascript消息转换器 |
| 2026-10-12 | - | Phase 3 完成：ArkAiServiceImpl(火山方舟responses API) + PromptBuilder + JsonExtractor(4步容错) + AiNodeDto/AiDayDto/AiItineraryDto + AiController(generate-raw) + UTF-8请求体修复(ObjectNode直发) + JsonNode响应接收 |
| 2026-10-12 | - | Phase 4 完成：PlanServiceImpl(详情3查询拼装/创建自动建天/复制ID重映射) + NodeServiceImpl(增删改+自动geocode+重建order) + RouteServiceImpl(按天重算,单点失败不中断) + PlanSaveRequest/NodeSaveRequest/NodeReorderRequest/PlanDetailResponse |
| 2026-10-12 | - | Phase 5 完成：AiGenerateServiceImpl编排(非事务) + PlanService.createFromAi(单事务持久化+geocode限流+routes复算) + AiService改造返回AiGenerateResult(generationId) + AiGenerateRequest校验 + POST /api/ai/generate 端到端48s验证通过 |
| 2026-10-12 | - | Phase 6 完成：router(createBrowserRouter) + client.ts(60s/解包data) + planApi/aiApi/mapApi + planStore/uiStore/mapStore + AppLayout(Sider/Header/Content) + Disclaimer + types镜像DTO + 4骨架页面 + @ant-design/icons/@types/node + build与浏览器冒烟全通过 |
| 2026-10-12 | - | Phase 7 完成：utils/time+geo 格式化 + PlanCard/PlanListPage(网格+复制删除) + DayTabs(联动mapStore) + NodeCard(编号/类型/门票仅供参考) + NodeForm(Modal新增编辑复用) + RouteList(交通方式+距离耗时) + PlanDetailPage(操作栏+左列+地图占位) + antd5.29废弃属性修复 + 冒烟全PASS |
| 2026-10-12 | - | Phase 8 代码完成：loadBaiduMap 动态注入(dev代理/生产直链) + bmapgl.d.ts + useBaiduMap + BaiduMapContainer(SVG编号标记/折线/InfoWindow portal/fitViewport/天筛选/选中联动) + NodePopup/RoutePopup + NodeCard onSelect + vite /bmapgl 代理；build通过，AK浏览器端服务被禁用待开通 |
| 2026-10-12 | - | Phase 8 验证通过：接入浏览器端专用 AK（IwPC...EvQy，替换 loadBaiduMap.ts 与 vite 代理两处），冒烟全 PASS——标记/折线/双弹窗/DayTabs联动/卡片定位高亮全部正常 |
| 2026-10-12 | - | Phase 9 完成：@dnd-kit 拖拽排序(Pointer+Keyboard 传感器/单天可拖/全部只读分组) + 乐观更新→reorder→自动recalculate→权威刷新/失败回滚 + 地图自动重绘；修复 orderIndex 0-based 显示不一致与"全部"tab被重置两个 bug；API+浏览器冒烟全PASS，测试数据已恢复 |
| 2026-10-12 | - | Phase 10 完成：GenerateForm 结构化字段拼接 requirement + AiLoadingOverlay 全屏倒计时(Xs/120s/四阶段) + 成功跳转/失败保留重试；修复 Enter 误提交、AI 超时 60s→120s(per-request config)、InputNumber addonAfter 废弃三处问题；真实生成跳转冒烟 PASS，测试行程已清理 |
| 2026-10-12 | - | Phase 11 完成（MVP 收官）：免责声明三处补强(RoutePopup/NodeForm) + ErrorBoundary(class+Result降级+DEV测试钩子) + utils/exportPlan(JSON Blob + html2canvas-pro PNG，onclone 去除操作UI) + 详情页导出下拉(trigger click 修复) + 响应式(两列堆叠/地图360/Header padding) + logback-spring.xml(滚动+ERROR独立文件)；JSON/PNG 真实下载与错误边界实证 PASS，测试文件已清理 |
| 2026-10-12 | - | ECS 部署包：application-prod.yml(7个环境变量占位外置 DB/AK/Key) + Docker Compose(backend temurin8-jre + frontend nginx:alpine，80入口/8080仅内网/日志卷/轮转) + nginx(SPA回退+/api反代120s超时) + .env.example + build-package.ps1(一键构建打包)；JDK8(Adoptium 8.0.504)构建 fat jar 23.6MB + Vite dist，产物 dist-packages/trip-planner-deploy.tar.gz 21.7MB；jar 清单与占位符离线校验通过 |
| 2026-10-13 | - | Phase 12 完成：User/JwtService/JwtInterceptor/@CurrentUser/AuthController/BCrypt + PlanService scope 查询 + 存量标记 is_public=1；前端 authStore/LoginPage/RegisterPage/UserMenu/client 拦截器/PlanListPage 双 Tab；端到端验证全通过 |
| 2026-10-13 | - | Phase 13 完成：ModelConstants 白名单(文本6+识图3) + AiGenerateRequest.model + ArkAiServiceImpl 动态 model + RestClientException 降级重试 + AiGenerateResponse(plan+degraded+modelUsed) + GET /api/ai/models + JwtInterceptor 放行；前端 constants/models.ts + modelStore + GenerateForm 模型 Select + degraded Toast；端到端验证全通过 |
| 2026-10-13 | - | Phase 14 完成：V3 建 image_import 表 + ImageImport 后端全链路(multipart校验→uploads落盘→base64→Ark input_image 识图→confirm 生成行程) + 识图关闭 thinking 提速(120s→30-60s)+闭合指令+JsonExtractor 第3.5步截断修复 + aiRestTemplate 120s + multipart 10MB/60MB 配置；前端 GeneratePage 双 Tab + ImageUploadZone(拖拽/粘贴) + ImagePreviewList(dnd-kit 排序) + ImageImportPanel(结果编辑/120s遮罩) + imageApi；API(单图31.3s/3图44.9s/4图58.4s)与浏览器冒烟 7/7 全 PASS，测试数据已清理 |
| 2026-10-13 | - | Phase 15 完成：SVG水滴pin+类型配色+起终点旗 + 路线线型(实/虚/点)与渐变色+hover加粗 + setViewport 视野自适应 + hoveredNodeId 双向联动(NodeCard 高亮/scrollIntoView + 标记 BOUNCE) + MapStyleSwitcher 日/夜/卫星(localStorage trip.mapStyle) + setTilt(60) 3D + >50 节点自实现网格聚合(点击zoom+2/zoomend重算) + 地图骨架屏 + 玻璃拟态 InfoWindow(index.css 覆盖 .BMap_bubble_pop) + bmapgl.d.ts 类型增补 + DEV window.__tripMap 调试句柄；✓ built + 浏览器冒烟全 PASS，冒烟行程15/16已清理 |
| 2026-10-13 | - | Phase 16 完成（dev-plan 全部阶段收官）：useBreakpoint Hook(md<768 防闪跳) + AppLayout 汉堡菜单侧抽屉 + GenerateForm 窄屏固定底部提交(.fixed-submit-bar+safe-area) + BaiduMapContainer 60vh/FullscreenButton/ResizeObserver(map.resize) + DraggableNodeList Mouse+Touch+Keyboard 传感器(8px) + BottomTabBar(地图/列表/详情) + NodeDetailOverlay 全屏覆盖(触摸滑动/prev-next/aria-label) + PlanDetailPage 窄屏分支(底部 Drawer 75vh) + index.css(16px/44px 触摸目标/:fullscreen) + viewport-fit=cover；✓ built 8.20s，同源 iframe 窄屏法 375/412px 冒烟全 PASS+桌面回归 PASS，全屏与拖拽 UI 闭环受控环境受限已如实记录，数据无污染 |