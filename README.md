# AI 旅游行程规划与地图可视化平台

用户输入目的地、天数、预算、偏好等需求，AI 自动生成结构化旅游攻略，并在百度地图上可视化展示行程节点、游览顺序、交通路线和地点信息。支持拖拽调整节点顺序、查看地点详情与通行耗时、导出行程。

## 核心功能

- **AI 一站式攻略生成**：输入目的地/天数/预算/偏好/特殊需求，调用火山方舟 AI 生成每日行程安排（景点/餐饮/住宿/交通/避坑提示）
- **地图行程可视化**：百度地图 GL JS 展示编号标记点、节点间折线、点击弹窗查看详情、按天筛选、自动适配视野
- **节点拖拽排序**：拖拽调整游览顺序，自动重新计算路线距离与耗时
- **行程管理**：保存/复制/重命名/删除行程，导出 JSON / PNG 图片
- **用户登录与行程隔离**：JWT 鉴权，公共攻略与私有行程分 Tab 管理
- **可选模型选项**：支持切换 AI 文本模型（6 种）与识图模型（3 种），模型不可用自动降级
- **免责声明**：门票、开放时间、交通耗时等信息标注"仅供参考"

## 技术栈

| 层 | 技术 |
|---|---|
| 后端框架 | Spring Boot 2.7.18 + MyBatis 2.3.1 |
| JDK | 1.8 |
| 数据库 | MySQL 8.0（InnoDB / utf8mb4） |
| AI 模型 | 火山方舟 deepseek-v4-1-flash-260910 |
| 地图 | 百度地图 GL JS API（浏览器端）+ 百度地图服务端 API（地理编码/路线规划） |
| 前端框架 | React 18 + TypeScript + Vite 5 |
| UI 组件 | Ant Design 5 |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| 拖拽 | @dnd-kit/sortable |
| 导出 | html2canvas-pro（PNG）、Blob 下载（JSON） |
| 部署 | Docker Compose（backend: temurin8-jre / frontend: nginx:alpine） |

## 项目结构

```
trip_planning/
├── backend/                          # Spring Boot 后端
│   ├── mvnw.cmd                      # Maven Wrapper（无需全局安装 Maven）
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/trip/planner/
│       │   ├── config/               # CorsConfig, AppProperties, RestClientConfig
│       │   ├── controller/            # Health / Ai / Plan / Node / Map / Auth
│       │   ├── service/              # AiService, PlanService, NodeService, RouteService, MapService, UserService, JwtService
│       │   ├── mapper/               # MyBatis Mapper 接口
│       │   ├── entity/               # 表对应实体
│       │   ├── dto/                  # 请求/响应/AI 结构 DTO
│       │   ├── exception/            # 全局异常处理
│       │   └── util/                 # JsonExtractor, PromptBuilder, GeoUtils
│       └── resources/
│           ├── application.yml       # 开发环境配置
│           ├── application-prod.yml  # 生产环境配置（环境变量注入）
│           ├── db/schema.sql         # 数据库 DDL
│           ├── db/migration/         # V2 迁移脚本
│           ├── mapper/*.xml          # MyBatis XML
│           └── logback-spring.xml    # 日志配置
│
├── frontend/                         # React 前端
│   ├── index.html                    # 百度地图 script 入口
│   ├── vite.config.ts                # Vite 配置 + /api 代理 + /bmapgl 代理
│   └── src/
│       ├── api/                      # Axios 封装 + planApi/aiApi/mapApi/authApi
│       ├── components/
│       │   ├── map/                  # BaiduMapContainer, NodePopup, RoutePopup
│       │   ├── plan/                 # PlanCard, DayTabs, NodeCard, NodeForm, RouteList, DraggableNodeList
│       │   ├── ai/                   # GenerateForm, AiLoadingOverlay
│       │   ├── auth/                # ProtectedRoute, UserMenu
│       │   ├── layout/               # AppLayout
│       │   └── common/               # Disclaimer, ErrorBoundary
│       ├── pages/                    # HomePage, PlanListPage, PlanDetailPage, GeneratePage, LoginPage, RegisterPage
│       ├── store/                    # planStore, uiStore, mapStore, authStore, modelStore (Zustand)
│       ├── hooks/                    # useBaiduMap
│       ├── types/                    # TypeScript 类型定义
│       ├── constants/                # models.ts
│       └── utils/                    # geo, time, exportPlan, loadBaiduMap
│
├── deploy/                           # Docker 部署包
│   ├── docker-compose.yml
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── frontend/nginx/default.conf
│   ├── .env.example
│   └── build-package.ps1
│
├── settings/settings.xml             # Aliyun Maven 镜像
├── dev-plan.md                       # 开发计划文档
├── dev-progress.md                   # 开发进度跟踪
├── API.md                            # API 密钥信息
└── prompt.md                         # 项目需求文档
```

## 快速开始

### 环境要求

- **JDK 1.8**（JAVA_HOME 指向 JDK 8）
- **Node.js 18+**
- **MySQL 8.0+**（端口 3306）
- Maven 无需全局安装（项目内置 Maven Wrapper）

### 1. 克隆仓库

```bash
git clone https://gitee.com/Ayanokouji/trip_planning.git
cd trip_planning
```

### 2. 初始化数据库

```bash
mysql -u root -p -e "CREATE DATABASE trip_planning DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p trip_planning < backend/src/main/resources/db/schema.sql
mysql -u root -p trip_planning < backend/src/main/resources/db/migration/V2__add_user_and_isolation.sql
```

### 3. 配置后端

编辑 [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml)，修改数据源连接和 API 密钥：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/trip_planning?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password

app:
  baidu:
    ak: your_baidu_server_ak          # 百度地图服务端 AK
  ai:
    api-key: your_ark_api_key         # 火山方舟 API Key
    model: deepseek-v4-1-flash-260910
```

### 4. 启动后端

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

后端启动在 `http://localhost:8080`，健康检查：`GET /api/health`

### 5. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动在 `http://localhost:5173`，Vite 自动代理 `/api` → `localhost:8080`

### 6. 访问应用

浏览器打开 `http://localhost:5173`，点击「生成行程」输入需求即可体验。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/ai/generate` | AI 生成行程（输入需求 → 返回完整行程 + 模型降级信息） |
| GET | `/api/ai/models?type=text\|image` | 获取可用模型列表 |
| GET | `/api/plans?scope=mine\|public` | 行程列表（需登录） |
| GET | `/api/plans/{id}` | 行程详情（含天/节点/路线） |
| POST | `/api/plans` | 创建行程 |
| PUT | `/api/plans/{id}` | 更新行程 |
| DELETE | `/api/plans/{id}` | 删除行程（级联） |
| POST | `/api/plans/{id}/copy` | 复制行程 |
| POST | `/api/plans/{id}/nodes` | 新增节点（自动地理编码） |
| PUT | `/api/plans/{id}/nodes/{nodeId}` | 更新节点 |
| DELETE | `/api/plans/{id}/nodes/{nodeId}` | 删除节点 |
| PUT | `/api/plans/{id}/nodes/reorder` | 拖拽重排序 |
| POST | `/api/plans/{id}/routes/recalculate` | 重新计算路线 |
| GET | `/api/map/geocode` | 地理编码（地址 → 经纬度） |
| GET | `/api/map/route` | 路线规划（距离/耗时） |

## 数据库表结构

| 表 | 说明 |
|---|---|
| `user` | 用户信息（用户名/密码BCrypt/邮箱/角色） |
| `travel_plan` | 行程主表（标题/城市/天数/状态/摘要/user_id/is_public） |
| `plan_day` | 每日行程（关联 plan_id，day_index，date，summary） |
| `plan_node` | 行程节点（地点名/类型/经纬度/顺序/时长/亮点/门票/交通/备注） |
| `plan_route` | 节点间路线（起终点/交通方式/距离/耗时/费用） |
| `ai_generation` | AI 生成记录（输入/模型/提示词/输出JSON/状态/user_id/plan_id） |

## Docker 部署

```bash
cd deploy
cp .env.example .env
# 编辑 .env 填入数据库连接、百度AK、AI Key
docker compose up -d
```

- 前端 Nginx 监听 80 端口，SPA 回退 + `/api` 反向代理（120s 超时）
- 后端 temurin8-jre 运行，仅暴露 8080 端口（内网）
- 日志按天滚动 + ERROR 独立归档

## 外部服务依赖

| 服务 | 用途 | 获取方式 |
|---|---|---|
| 火山方舟 Ark API | AI 攻略生成 | [console.volcengine.com](https://console.volcengine.com/ark) |
| 百度地图服务端 AK | 地理编码 + 路线规划 | [lbsyun.baidu.com](https://lbsyun.baidu.com/apiconsole/key)（服务端类型） |
| 百度地图浏览器端 AK | 前端地图展示 | 同上（浏览器端类型，Referer 白名单设为 `*` 或域名） |

## 免责说明

> AI 生成的门票价格、开放时间、交通耗时等信息仅供参考，请以官方信息为准。

## 仓库

- Gitee: https://gitee.com/Ayanokouji/trip_planning.git
- GitHub: https://github.com/Ayanokouji-ky/trip_planning.git
