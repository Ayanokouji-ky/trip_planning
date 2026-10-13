# 更新日志（CHANGELOG）

> 项目：AI 旅游行程规划与地图可视化平台（trip_planning）
> 本文档按时间倒序记录功能更新，并附项目功能总览与使用方法。版本详情见 `RELEASE-NOTES.md`，开发明细见 `dev-progress.md`。

---

## [V2.0.0] — 2026-10-13

### 新增
- **用户系统**：注册 / 登录 / 登出（JWT 鉴权，7 天有效期），行程归属隔离，「我的行程 / 公共攻略」双 Tab
- **可选 AI 模型**：生成页可切换文本模型（6 款）与识图模型（3 款），白名单校验，调用失败自动降级并提示
- **图片识别生成行程**：上传 ≤9 张攻略截图（支持拖拽 / 点击 / 粘贴），AI 识别后可编辑再确认生成完整行程
- **地图视觉升级**：水滴编号标记（按类型配色）、起终点旗帜、路线线型与渐变色、日间/夜间/卫星风格切换、3D 视角、超 50 节点自动聚合、玻璃拟态信息窗
- **移动端适配**：<768px 切换移动端布局——汉堡菜单、底部 Tab（地图/列表/详情）、列表抽屉、节点全屏滑动切换、44px 触摸目标、刘海屏安全区

### 变更
- 行程列表/详情/生成等接口接入鉴权，非本人行程操作返回 403
- 存量无主行程自动标记为公共实例（`is_public=1`）
- AI 生成请求超时放宽至 120s，识图链路关闭 thinking 提速（120s → 30–60s）
- 拖拽传感器调整为 Touch + Mouse（8px 激活距离）+ 键盘组合，防移动端误触

### 数据库
- `V2__add_user_and_isolation.sql`：新增 `user` 表，`travel_plan` 增加 `user_id`/`is_public`
- `V3__create_image_import.sql`：新增 `image_import` 表

---

## [V1.0.0] — 2026-10-12（MVP）

### 新增
- **AI 攻略生成**：输入目的地/天数/偏好等结构化需求，火山方舟大模型生成多天结构化行程（含类型/时长/亮点/门票/费用），全程 120s 倒计时遮罩
- **行程管理**：行程列表 / 详情 / 创建（自动建天）/ 复制 / 删除（级联）；节点增删改（自动地理编码）；路线按天自动重算真实距离耗时
- **地图可视化**：百度地图 GL 渲染节点标记与路线折线，信息窗展示节点/路线详情，天筛选联动重绘，卡片 ↔ 地图双向联动
- **拖拽排序**：单天内节点拖拽调整顺序（dnd-kit），乐观更新 + 失败回滚，完成后自动重算路线并刷新地图
- **AI 生成表单**：目的地标签、天数 1–15、出发日期、人数、预算档位、偏好多选、特殊需求
- **导出**：行程 JSON 导出（Blob 下载）与 PNG 截图导出（html2canvas-pro）
- **稳定性**：全局异常处理、ErrorBoundary 错误边界、免责声明全覆盖、logback 滚动日志
- **部署交付**：Docker Compose + nginx 一键打包脚本，产物 `dist-packages/trip-planner-deploy.tar.gz`

---

# 项目功能总览

| 功能模块 | 说明 | 入口 |
|----------|------|------|
| AI 文本生成 | 结构化表单描述需求 → AI 生成多天行程（节点+路线） | `/generate`「文本生成」Tab |
| 图片识别生成 | 上传攻略截图 → AI 识图 → 编辑确认 → 生成行程 | `/generate`「图片导入」Tab |
| 模型选择 | 文本/识图模型白名单内切换，失败自动降级 | 生成页「AI 模型」下拉 |
| 行程列表 | 我的行程 / 公共攻略双 Tab，卡片复制/删除 | `/plans` |
| 行程详情 | DayTabs 天筛选、节点卡、路线明细、操作栏 | `/plans/:id` |
| 节点编辑 | 新增/编辑/删除节点，自动地理编码定位 | 详情页左列按钮 |
| 拖拽排序 | 单天内拖拽调整游览顺序，路线自动重算 | 详情页单天 Tab 手柄 |
| 地图展示 | 标记/折线/信息窗/3D 视角/自动视野 | 详情页右列 |
| 地图交互 | 点击卡片或标记联动、hover 高亮、风格切换、全屏 | 详情页地图区 |
| 大数据量聚合 | >50 个定位节点自动网格聚合 | 自动生效 |
| 导出 | JSON（全量数据）/ PNG（页面截图） | 详情页「导出」下拉 |
| 账户 | 注册 / 登录 / 登出，行程归属隔离 | 页头右上角 |

# 使用方法

## 1. 环境准备

- JDK 1.8（JAVA_HOME 指向 JDK 8）、Node.js 18+、MySQL 8.0
- 建库并导入表结构：
  ```
  mysql -u root -p123456 -e "CREATE DATABASE IF NOT EXISTS trip_planning DEFAULT CHARSET utf8mb4;"
  mysql -u root -p123456 trip_planning < backend/src/main/resources/db/schema.sql
  mysql -u root -p123456 trip_planning < backend/src/main/resources/db/migration/V2__add_user_and_isolation.sql
  mysql -u root -p123456 trip_planning < backend/src/main/resources/db/migration/V3__create_image_import.sql
  ```
- 配置密钥：`backend/src/main/resources/application.yml` 中的百度地图 AK、火山方舟 API Key、`jwt.secret`

## 2. 启动服务

```
# 后端（端口 8080）
cd backend
.\mvnw.cmd spring-boot:run

# 前端（端口 5173，另开终端）
cd frontend
npm install
npm run dev
```

浏览器访问 **http://127.0.0.1:5173**（前端经 Vite 代理访问后端 `/api`）。

## 3. 核心操作流程

### 注册与登录
1. 首页点击页头「登录」，注册账号后登录（生成行程需登录）
2. 登录后进入「我的行程」；「公共攻略」Tab 可查看所有公开行程（只读）

### 文本生成行程
1. 侧栏进入「AI 生成」→ 文本生成 Tab
2. 填写目的地（回车确认标签）、天数、出发日期、人数、预算、偏好，可选特殊需求与 AI 模型
3. 点击「生成行程」，等待倒计时结束自动跳转详情页；生成失败时表单保留可重试

### 图片识别生成行程
1. 生成页切换到「图片导入」Tab，选择识图模型
2. 上传 1–9 张攻略截图（拖拽/点击/Ctrl+V 粘贴），可拖动缩略图调整顺序、删除
3. 点击「开始识别」，完成后进入编辑态：修改标题、按天编辑节点名称/类型/时长、删除或添加节点
4. 确认无误后点击「生成行程」，AI 结果持久化为完整行程并跳转详情

### 编辑与排序
- **天筛选**：DayTabs 切换「全部 / 第 N 天」；「全部」按天分组只读，单天 Tab 支持拖拽
- **节点**：「新增节点」或卡片上「编辑/删除」；修改后自动地理编码
- **拖拽**：按住卡片左侧手柄（⠿）上下拖动调整顺序，松手后自动重算该天路线并刷新地图；失败自动回滚并提示
- **重算路线**：操作栏「重算路线」可手动触发

### 地图交互
- 点击节点卡片或地图标记：地图平移定位并弹出信息窗
- hover 节点卡片 ↔ 地图标记跳动 双向联动
- 右上角切换 日间/夜间/卫星 底图（偏好自动记忆）
- 左上角全屏按钮进入地图全屏
- 缩放时超过 50 个定位节点自动聚合，点击聚合圆点放大展开

### 导出
- 详情页「导出」下拉 →「导出 JSON」获得行程全量数据文件；「导出 PNG」获得页面截图

## 4. 常用 API 速查

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` / `/api/auth/login` | 注册 / 登录（返回 token） |
| GET | `/api/plans?scope=mine\|public` | 行程列表（需 Authorization 头） |
| GET | `/api/plans/{id}` | 行程详情（含天/节点/路线） |
| POST | `/api/ai/generate` | 文本生成行程（120s 超时） |
| POST | `/api/ai/image-import` | 上传图片识别（multipart） |
| POST | `/api/ai/image-import/{id}/confirm` | 确认识图结果生成行程 |
| GET | `/api/ai/models?type=text\|image` | 可用模型列表 |
| POST | `/api/plans/{id}/nodes/reorder` | 节点重排序 |
| POST | `/api/plans/{id}/routes/recalculate` | 重算路线 |

除注册/登录/健康检查/模型列表外，接口均需 `Authorization: Bearer {token}`。

## 5. 生产部署

- 使用 `dist-packages/trip-planner-deploy.tar.gz` 部署包（内含 Docker Compose：后端 jar + nginx 前端，80 端口入口）
- 服务器配置 `.env`（数据库、百度 AK、AI Key、JWT 密钥等环境变量），执行包内构建脚本一键打包
- 详见部署包内 `.env.example` 与 `build-package.ps1`

## 6. 注意事项

- 景点门票、距离与耗时均为规划参考，实际以现场与路况为准（页面已有免责声明）
- 识别图片建议使用文字清晰的攻略截图，单张 ≤10MB，最多 9 张
- 地图瓦片在个别受限网络下可能显示灰色，属网络环境问题
