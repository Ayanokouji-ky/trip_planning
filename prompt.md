### 项目名称

**AI 旅游行程规划与地图可视化平台**

### 1. 项目概述

本项目是一个旅游攻略生成与行程规划网站。用户输入文本需求或上传图片后，系统调用 AI 模型生成结构化旅游攻略，并在地图上可视化展示行程节点、游览顺序、交通路线和地点信息。用户可以在地图上调整节点顺序、查看地点详情、查看两点之间的通行方式和耗时，并对攻略进行二次编辑。

### 2. 目标用户

- 自由行用户：希望快速生成完整行程，并直观看到地点距离和路线。
- 旅行规划者：需要从多个平台整理信息，希望自动合并为统一行程。
- 内容创作者：希望通过图片或文本快速生成攻略草稿，再手动优化。

### 3. 核心业务流程

1. 用户输入目的地、天数、预算、偏好、同行人等信息，或上传包含景点信息的图片。
2. 系统解析用户输入，调用 AI 模型生成结构化攻略。
3. 系统将 AI 输出中的地点、顺序、时间、交通方式解析为行程节点和路线。
4. 前端在地图上展示节点和路线，节点按游览顺序编号。
5. 用户点击节点查看地点信息，点击路线查看通行方式和耗时。
6. 用户可拖动节点、删除节点、新增节点、调整顺序。
7. 系统重新计算路线和行程时间，并支持保存、分享、导出。

### 4. 功能需求

#### 4.1 AI 一站式攻略生成

- 支持文本输入，包括：
    - 目的地城市
    - 出行日期或天数
    - 出发城市
    - 人数与人员构成
    - 预算范围
    - 旅行偏好，如自然风光、人文、美食、亲子、摄影
    - 特殊需求，如少走路、不早起、避开排队、老人儿童同行
- 支持图片导入，例如：
    - 用户上传包含景点照片、截图、手账、笔记的图片
    - 系统调用多模态 AI 识别图片中的地点、文字、场景
    - 识别结果用于补充行程节点
- AI 生成内容需包含：
    - 每日行程安排
    - 每个景点建议游览时间
    - 景点重点参观项目
    - 餐饮推荐
    - 住宿区域建议
    - 交通方式建议
    - 预算估算
    - 避坑提示
- 系统需要把 AI 输出转换为结构化数据，例如：
    - `day`
    - `time_start`
    - `time_end`
    - `place_name`
    - `place_type`
    - `suggested_duration`
    - `highlight`
    - `transport_from_previous`
    - `estimated_cost`
    - `note`

#### 4.2 地图行程可视化

- 前端使用 React 集成地图组件，建议使用 Leaflet + react-leaflet，或高德地图 JS API。2, 11
- 地图中每个行程节点显示为一个标记点，标记点按游览顺序编号。
- 节点之间通过折线连接，表示游览顺序。
- 点击节点可展示：
    - 地点名称
    - 建议游览时间
    - 重点游玩项目
    - 开放时间
    - 门票信息
    - 交通到达方式
    - 用户备注
- 点击连线可展示：
    - 起点和终点
    - 推荐通行方式，如步行、地铁、公交、打车、驾车
    - 预计距离
    - 预计耗时
- 支持节点拖拽调整顺序。
- 支持新增节点，例如用户手动添加餐厅、酒店、临时景点。
- 支持删除节点。
- 支持重新规划路线，例如根据新顺序重新计算交通耗时。
- 支持行程导出为图片或 PDF。

#### 4.3 文本与图片导入生成攻略

- 文本导入：
    - 用户粘贴小红书、公众号、游记、笔记文本
    - 系统提取地点、时间、餐饮、交通、住宿等信息
    - 生成初步行程
- 图片导入：
    - 用户上传景点照片、地图截图、攻略长图
    - 系统识别图片中的地点名称或文字
    - 若识别到明确地点，则加入候选节点
    - 用户确认后加入正式行程
- 系统需提供人工确认环节，避免 AI 误识别地点。

#### 4.4 用户与行程管理

- 用户注册、登录、个人信息管理。
- 行程保存、复制、重命名、删除。
- 行程版本管理，例如保留修改历史。
- 行程分享，可生成分享链接。
- 行程导出，支持导出为 JSON、图片或 PDF。

#### 4.5 后台管理

- 景点基础信息管理。
- 城市信息管理。
- AI 生成记录管理。
- 用户行程管理。
- 敏感内容审核。
- 系统配置管理，例如 AI 模型参数、地图服务配置。

### 5. 非功能需求

- 响应式界面，支持 PC 和移动端浏览。
- 地图加载需流畅，节点较多时避免卡顿。
- AI 接口调用需异步处理，避免前端长时间阻塞。
- 用户行程数据需持久化保存。
- 接口需做权限校验，防止未授权访问。
- AI 输出内容需标注“仅供参考”，尤其是门票、开放时间、交通耗时等信息。

### 6. 技术架构

#### 6.1 前端

- 框架：React
- 路由：React Router
- 状态管理：Redux / Zustand / Context API
- UI 组件：Ant Design 或 Material UI
- 地图：Leaflet + react-leaflet，或高德地图 JS API2, 11
- 路线绘制：Polyline 绘制节点连线，或接入地图路线服务2, 11
- 请求封装：Axios
- 图片上传：支持预览、压缩、上传进度展示

#### 6.2 后端

- 框架：SSM，即 Spring + Spring MVC + MyBatis
- 运行环境：JDK 8 或以上
- 服务器：Tomcat
- 构建工具：Maven
- 接口风格：RESTful API
- 权限控制：Session / JWT / Spring Security
- AI 调用层：封装统一 AI 服务接口，支持后续切换模型
- 文件存储：本地存储或对象存储，用于保存图片、导出文件
- 日志：记录 AI 请求、行程生成、地图路线查询等关键操作

#### 6.3 数据库

- 数据库：MySQL
- 主要表设计：

| 表名 | 主要字段 | 说明 |
| ------ |------ |------ |
| user | id, username, password, email, phone, avatar, created_at | 用户信息 |
| travel_plan | id, user_id, title, city, days, status, created_at, updated_at | 行程主表 |
| plan_day | id, plan_id, day_index, date, summary | 每日行程 |
| plan_node | id, plan_id, day_id, place_name, lat, lng, order_index, suggested_duration, place_type, description, open_time, ticket_info, note | 行程节点 |
| plan_route | id, plan_id, from_node_id, to_node_id, transport_mode, distance, duration, cost | 节点间路线 |
| ai_generation | id, user_id, plan_id, input_type, input_content, model_name, prompt, output_json, created_at | AI 生成记录 |
| place_info | id, name, city, lat, lng, type, description, open_time, ticket_info, source, updated_at | 地点基础信息 |
| image_import | id, user_id, plan_id, image_url, ocr_result, ai_result, status, created_at | 图片导入记录 |

### 7. AI 模块设计

#### 7.1 输入结构

AI 接收的参数建议统一为：

- destination
- start_city
- days
- start_date
- travelers
- budget
- preferences
- constraints
- imported_places
- output_format

#### 7.2 输出结构

AI 输出建议强制为 JSON，例如：

```json
{
  "destination": "杭州",
  "days": 3,
  "summary": "杭州3日慢游行程",
  "itinerary": [
    {
      "day": 1,
      "date": "2026-10-20",
      "nodes": [
        {
          "place_name": "西湖",
          "lat": 30.24,
          "lng": 120.14,
          "order_index": 1,
          "suggested_duration": 120,
          "highlight": "断桥、苏堤、湖景散步",
          "transport_from_previous": null,
          "estimated_cost": 0,
          "note": "建议上午游览，避开傍晚人流高峰"
        }
      ]
    }
  ]
}
```

#### 7.3 校验与修正

AI 输出后，后端需要做以下处理：

- 校验地点是否有经纬度。
- 校验节点顺序是否合理。
- 校验每日行程是否过满。
- 调用地图服务补充距离和耗时。
- 对门票、开放时间、营业时间标注“可能变化，需以官方信息为准”。4, 16
- 允许用户手动修改 AI 生成结果。

### 8. 地图交互设计

- 地图初始化时，根据行程城市自动定位中心点。
- 节点按游览顺序显示编号，例如 1、2、3。
- 不同节点类型使用不同图标，例如景点、餐厅、酒店、交通枢纽。
- 点击节点弹出详情卡片。
- 点击连线弹出路线信息卡片。
- 拖拽节点后，系统更新 `order_index` 并重新计算路线。
- 路线计算可调用地图服务商的路线规划接口，获取步行、公交、驾车等方案。
- 若路线接口失败，则降级显示直线距离和预估时间。



### 9. 开发重点

- **AI 输出结构化**：必须让 AI 返回稳定 JSON，否则前端地图无法直接使用。
- **地点地理编码**：AI 输出的地点名称需要转换为经纬度。
- **地图节点与路线联动**：节点顺序变化后，路线、耗时、日程都需要同步更新。
- **行程数据模型设计**：`travel_plan`、`plan_day`、`plan_node`、`plan_route` 之间的关系要清晰。
- **前后端数据契约**：AI 生成结果、行程保存接口、地图渲染数据结构必须统一。
- **用户体验**：AI 生成过程需要加载状态、失败重试、局部修正能力。
- **数据准确性提示**：门票、开放时间、交通耗时不能保证完全准确，需要明确提示。4, 16

### 10. 迭代优化需求（V2 — 上线反馈）

> 本阶段基于线上用户反馈，对已上线版本进行功能扩展与体验优化。保持现有技术栈（Spring Boot 2.7.18 + React 18 + Vite + TypeScript + 百度地图 GL JS + 火山方舟 Ark responses API）不变，在现有 5 张表（travel_plan / plan_day / plan_node / plan_route / ai_generation）基础上扩展。建议开发顺序：10.1 用户体系 → 10.3 模型选择 → 10.2 图片识图 → 10.5 地图优化 → 10.4 移动端。

#### 10.1 用户登录与行程归属隔离

- 用户注册/登录（用户名 + 密码，BCrypt 加盐哈希），可选绑定邮箱/手机号
- 未登录用户仅可浏览公共行程，无法生成/编辑/保存行程
- 新生成的行程默认仅创建者可见；数据库中已存在的存量行程（user_id 为空）统一 UPDATE 标记为 `is_public=1`，作为公共实例所有用户可见
- 行程列表分两个 Tab：「我的行程」（当前用户私有 + 本人公开）与「公共攻略」（所有 is_public 行程）
- 用户可将自有行程主动设为公开分享
- AI 生成记录（ai_generation 表）同步绑定 user_id，便于追溯
- **数据表变更**：
    - 新增 `user` 表：id, username, password, email, phone, avatar, role(ADMIN/USER), created_at, updated_at
    - `travel_plan` 新增字段：`user_id` BIGINT NULL, `is_public` TINYINT DEFAULT 0
    - 存量数据处理：`UPDATE travel_plan SET is_public=1 WHERE user_id IS NULL`
- **技术实现**：后端 JWT Token 鉴权 + 拦截器统一校验 + 自定义 `@CurrentUser` 注解注入当前用户；前端登录/注册页 + Token 存 localStorage + Axios 请求拦截器附加 Authorization + 路由守卫；生成/编辑/删除接口必须校验 user_id 与行程归属一致

#### 10.2 图片一图流攻略识别生成

- 生成入口新增「图片导入」Tab，与「文本生成」并列
- 支持单张/多张图片上传（jpg/png/webp，单张 ≤ 10MB），支持拖拽上传、粘贴上传、图片预览
- 系统调用多模态识图模型，识别图片中的地点名称、文字描述、日期与天数、交通方式、餐饮/住宿信息
- 识别结果转为结构化行程节点，复用文本生成同一套 JSON 结构（itinerary → day → nodes）
- 提供人工确认环节：用户可删除误识别节点、补充缺失信息后再正式生成
- 多张图片按上传顺序合并为一个完整行程
- 测试用例：项目 `picTestCase` 目录（case1/case2/case3，共 7 张图片）
- **数据表变更**：新增 `image_import` 表：id, user_id, plan_id, image_urls(JSON), ocr_result, ai_result, model_name, status, created_at
- **技术实现**：前端 antd Upload 组件 + 拖拽排序；后端调用火山方舟 Ark `responses` API，input 中使用 `input_image` 类型并传入 base64 data URL（图片内容转为 data:image/jpeg;base64,... 形式）；图片存储本地 `uploads/` 目录，UUID 命名；复用现有 AI JSON 4 步容错提取逻辑；识图模型默认 `doubao-seed-2-1-pro-260915`（详见 10.3）

#### 10.3 可选模型选项

**模型清单**（来源：API.md）：
- 识图模型：
    - `doubao-seed-2-1-pro-260915`（默认·质量优先）
    - `doubao-seed-2-1-turbo-260628`（均衡）
    - `doubao-seed-2-1-lite-260915`（速度优先）
- 文本模型：
    - `deepseek-v4-1-flash-260910`（默认·推荐）
    - `deepseek-v4-pro-260425`（质量优先）
    - `glm-5-3-flash-260828`（国产轻量）
    - `deepseek-v4-pro-ga-260813`（GA 稳定版）
    - `deepseek-v4-flash-ga-260731`（GA 轻量）
    - `glm-5-2-260617`（GLM 基础版）

- 生成页面新增「模型选择」下拉框，文本与图片场景分别展示对应模型列表
- 每个模型选项后附带简短标签（推荐 / 质量优先 / 速度快 / 国产 / GA 稳定）
- 用户选择记录到 `ai_generation.model_name` 字段，并持久化到 localStorage 作为下次默认选项
- 所选模型不可用时，降级到默认模型并提示用户
- **技术实现**：后端 AI 调用层将 model 参数从配置项改为请求参数动态传入，校验模型白名单；前端模型配置常量集中管理（`src/constants/models.ts`），区分文本/识图场景

#### 10.4 窄屏与移动端体验优化

- **生成表单**：窄屏（< 768px）下所有表单项单列堆叠，输入框全宽，提交按钮固定底部
- **地图区域**：窄屏下高度自适应（min 60vh），增加「全屏」按钮切换沉浸式地图
- **节点列表**：窄屏下改为底部可折叠 Sheet（抽屉式），点击展开/收起，不挤压地图
- **拖拽排序**：触摸屏下可用，@dnd-kit 启用 TouchSensor 与 MouseSensor 并行
- **触摸友好**：所有可点击元素最小 44×44px，字号适配移动端
- **顶部导航**：窄屏下收为汉堡菜单，展开侧抽屉
- **行程详情**：窄屏下卡片全屏覆盖式展示，支持左右滑动切换节点
- **底部 Tab 栏**：窄屏下增加底部导航（地图/列表/详情），方便单手操作
- **技术实现**：Ant Design Grid 响应式断点（xs/sm/md/lg）+ `Grid.useBreakpoint` Hook；@dnd-kit 将 `PointerSensor` 替换为 `TouchSensor + MouseSensor` 组合，激活距离 8px；CSS 媒体查询 + rem/vw + `safe-area-inset` 适配刘海屏；地图全屏用 Fullscreen API + ResizeObserver；Chrome DevTools 设备模拟器覆盖 iPhone SE/12/14、Pixel、iPad 回归

#### 10.5 地图视觉与交互优化

- **节点标记美化**：
    - 不同 `place_type` 使用不同颜色与图标：景点(蓝/相机)、餐厅(橙/餐具)、酒店(紫/床)、交通(绿/车)
    - 节点编号气泡样式圆角化，游览顺序清晰可见
    - 起点与终点特殊标识（如旗帜、终点旗）
- **路线样式优化**：
    - 不同 `transport_mode` 区分线型：步行=虚线、驾车=实线、公交=点划线
    - 路线渐变色显示方向（起点浅 → 终点深）
    - 路线 hover 高亮加粗
- **视野自适应**：生成/拖拽后自动 `fitBounds` 到所有节点范围，无节点时定位到城市中心
- **节点与列表双向联动**：
    - 地图节点 hover → 列表对应项高亮滚动
    - 列表项 hover → 地图对应节点放大跳动
    - 点击列表项 → 地图平移到该节点并打开详情
- **地图风格切换**：支持日间/夜间/卫星三种地图样式，记住用户偏好
- **3D 视角**：启用百度地图 GL 的 3D 倾斜视角（`setTilt`），城市地标建筑 3D 呈现
- **节点聚合**：zoom out 到一定层级时同区域节点聚合（`MarkerClusterer`），节点 > 50 时启用，避免重叠
- **加载态**：AI 生成中地图显示骨架屏与进度提示；信息卡片采用玻璃拟态/卡片式设计
- **技术实现**：百度地图 GL JS 自定义 Overlay（继承 `BMapGL.Overlay`）+ SVG 图标；`setMapStyleV2` 配置样式 JSON；`map.setViewport(points)` 自适应视野；Zustand store 共享 `hoveredNodeId` 实现双向联动；`setTilt(60)` + `setHeading` 3D 视角；WebGL 渲染层性能优化

#### 10.6 验收标准

- **用户体系**：未登录无法生成行程；登录后「我的行程」与「公共攻略」分离可见；存量行程作为公共实例可见
- **图片识图**：`picTestCase` 3 个 case 均能正确识别主要地点并生成行程；多图合并正常
- **模型选择**：切换不同模型均能成功生成；异常模型自动降级到默认并提示
- **移动端**：iPhone SE 以上设备主要操作无横向滚动、地图可全屏、拖拽可用
- **地图优化**：节点类型颜色区分、路线样式区分、列表与地图双向联动、3D 视角可用、风格切换正常

