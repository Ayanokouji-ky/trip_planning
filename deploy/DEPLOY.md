# AI 旅游行程规划平台 — ECS 部署说明（Docker Compose）

## 拓扑

```
公网 :80 ──> frontend 容器（Nginx，SPA 静态资源）
                 └─ /api/* 反向代理 ──> backend 容器（Spring Boot :8080，仅容器内网）
                                          └─ MySQL 远程库 101.34.51.42:3306
```

- 只需在 ECS 安全组放行 **TCP 80**；8080 不对公网暴露。
- 数据库使用现有远程 MySQL，不在 ECS 建库。

## 一、服务器要求

- Linux（Alibaba Cloud Linux / CentOS / Ubuntu），x86_64
- 已安装 Docker 20.10+ 与 Docker Compose v2（`docker compose version` 可用）
- ECS 能访问公网（拉取基础镜像、调用百度地图与火山方舟 API）
- 首次构建镜像时需从 Docker Hub 拉取 `eclipse-temurin:8-jre`、`nginx:1.27-alpine`

未装 Docker（Alibaba Cloud Linux/CentOS）：

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
```

Ubuntu：

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
```

## 二、上传与配置

```bash
# 1. 上传 trip-planner-deploy.tar.gz 到服务器后解包
tar -xzf trip-planner-deploy.tar.gz
cd trip-planner-deploy

# 2. 配置环境变量（数据库密码、服务端 AK、AI Key）
cp .env.example .env
vi .env
```

`.env` 必填项：

| 变量 | 说明 |
|---|---|
| MYSQL_HOST / MYSQL_PORT / MYSQL_DB | 默认 101.34.51.42 / 3306 / trip_planning |
| MYSQL_USER / MYSQL_PASSWORD | 数据库账号密码 |
| BAIDU_SERVER_AK | 百度地图**服务端** AK（后端地理编码/路线） |
| ARK_API_KEY | 火山方舟 AI Key |

## 三、外部白名单（重要）

1. **MySQL**：确认 101.34.51.42 的安全组/防火墙放行 ECS 公网 IP 的 3306，且数据库用户允许从该 IP 连接。
2. **百度地图浏览器端 AK**：前端页面通过浏览器直连百度 API，请在百度地图控制台把 ECS 的公网 IP / 域名加入该 AK 的 Referer 白名单（浏览器 AK 已内置于前端构建产物，不在 .env 中）。

## 四、启动与验证

```bash
# 构建镜像并后台启动（首次约 2-5 分钟，主要是拉基础镜像）
docker compose up -d --build

# 查看状态（两个容器应为 running/healthy）
docker compose ps

# 后端健康检查，应返回 {"code":200,...}
curl http://127.0.0.1/api/health

# 看日志
docker compose logs -f backend
```

浏览器访问 `http://<ECS公网IP>/` 即可。

## 五、日常运维

```bash
docker compose restart backend     # 重启后端
docker compose down                # 停止并移除容器（数据在远程库，不丢失）
docker compose up -d --build       # 更新版本后重新构建启动
tail -f logs/trip-planner.log      # 后端日志文件（挂载在宿主机 ./logs）
```

调整 JVM 内存：在 docker-compose.yml 的 backend 服务加 `environment: [JAVA_OPTS=-Xms256m -Xmx768m]`。

## 六、升级版本

1. 用新的部署包解包（覆盖目录），保留旧的 `.env` 与 `logs/`。
2. `docker compose up -d --build`，镜像会以新 jar/dist 重建。

## 七、目录清单

```
trip-planner-deploy/
├── docker-compose.yml
├── .env.example
├── DEPLOY.md
├── backend/
│   ├── Dockerfile
│   └── app.jar                # Spring Boot fat jar（内置 prod profile）
└── frontend/
    ├── Dockerfile
    ├── nginx/default.conf     # SPA 回退 + /api 反代（120s 超时）
    └── dist/                  # Vite 构建静态资源
```
