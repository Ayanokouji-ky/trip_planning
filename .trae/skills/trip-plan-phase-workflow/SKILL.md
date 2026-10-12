---
name: trip-plan-phase-workflow
description: 按 dev-plan.md 阶段推进 trip_planning 项目（"启动 Phase N"）的标准交付流程，含构建、browser_use 冒烟、测试数据 API 清理、dev-progress.md 更新。用于本仓库的阶段开发；不用于一次性问答或非本仓库任务。
---

# Trip Planning 阶段开发工作流

用户说"启动 Phase N"时严格按本流程执行，回复一律使用中文。

## 1. 开工前

- 读 `dev-plan.md` 找到该 Phase 的任务清单与验收标准；读 `dev-progress.md` 确认上一阶段状态与变更日志。
- 后端 Spring Boot(:8080) 与前端 Vite(:5173) 通常已在后台运行，**不要重启**；Vite 前端改动自动热更新。验证服务直接发 HTTP 请求，不要重复启动长驻进程（避免抢占终端导致服务被杀）。
- 需要改后端时才考虑重启后端。

## 2. 实现

- 按 dev-plan 清单逐项实现；多文件任务先用 TodoWrite 建计划。
- 前端类型镜像后端 DTO（camelCase），API 走 `src/api/`，全局状态走 `src/store/`（Zustand）。
- 不做后续 Phase 的功能（如 Phase 7 不做地图、不做拖拽）。

## 3. 构建验证（可观测证据，不靠推断）

- 前端（PowerShell，npm 不在 PATH）：

  ```powershell
  $env:Path = "C:\Program Files\nodejs;$env:Path"; & "C:\Program Files\nodejs\npm.cmd" run build
  ```

  必须看到 `✓ built` 才算通过；PowerShell profile 的红字报错是噪音可忽略。
- 后端用 `backend\mvnw.cmd`。
- Windows 下 `curl` 是 Invoke-WebRequest 别名，HTTP 验证用 `Invoke-RestMethod` 或 `curl.exe`。

## 4. 浏览器冒烟

- 用 `browser_use` subagent，URL 一律 `http://127.0.0.1:5173`，任务要写成可执行的具体步骤（点击目标、预期文案、截图），单次 query 不超过 3 个 URL。
- 预算截断时用 resume 继续同一 agent，不要从头重测。
- 已知测试环境限制：对 `api.map.baidu.com` 网络受限（主脚本已走 vite `/bmapgl` 代理），底图瓦片灰色属预期，以覆盖物/交互为准。
- 合成鼠标事件（dispatchEvent）dnd-kit 不响应；验证拖拽用真实 CDP 鼠标或 **KeyboardSensor**（聚焦手柄 → Space → 方向键 → Space）。

## 5. 测试数据清理

- 冒烟产生的测试数据**必须用 HTTP API 清理**（新增节点删除后按天 reorder + recalculate 恢复）。
- 禁止 mysql 命令行带明文密码；DB 验证一律走 API。
- PowerShell 内联中文/JSON body 必坏：写 UTF-8 临时文件再用 `-InFile`：

  ```powershell
  $tmp = "$env:TEMP\req.json"; [System.IO.File]::WriteAllText($tmp, ($body | ConvertTo-Json), [System.Text.Encoding]::UTF8)
  Invoke-RestMethod -Uri "http://localhost:8080/api/..." -Method Put -ContentType "application/json; charset=utf-8" -InFile $tmp
  ```

- 清理后再调一次 GET 确认数据恢复原状（如 plan 3 = 10 节点 / 8 路线）。

## 6. 收尾更新 dev-progress.md（三处都要改）

1. 阶段进度总览表：状态 `未开始 → 已完成`（或"进行中"并写明阻塞条件）、完成日期、备注。
2. 详细进度记录：本 Phase 的 `[ ]` 全部勾掉并补实际实现要点，附验证证据（build/冒烟/API 实证数据）。
3. 变更日志：追加一行 `| 日期 | - | Phase N 完成：... |`。

## 7. 汇报

- 中文汇总：新增/修改文件（用 file:/// 绝对链接）、验证结果（PASS/FAIL + 关键数据）、遗留阻塞（如需要用户操作百度控制台等外部条件时，标"进行中"不要标完成）。

## 关键约定速查

- 前端构建：`npm run build`（tsc && vite build）；目录 `frontend/`。
- 后端：端口 8080，响应 `ApiResult{code,message,data}`，前端 client 已解包。
- 测试行程：plan id=3 成都2日游（2 天 10 节点 8 路线，dayId 5/6，节点 id 6-15）。
- orderIndex 后端 0-based，UI 显示统一 +1。
- 浏览器端百度 AK 与服务端 AK 不同，见 `API.md`。
