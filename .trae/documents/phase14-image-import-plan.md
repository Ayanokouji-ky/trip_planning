# Phase 14 — 图片一图流攻略识别生成（实施计划）

## Context（背景）

V2 迭代第 3 阶段（Phase 12/13 已完成）。目标：用户上传旅行攻略/行程截图，AI 识图后转为结构化行程，经人工确认环节消除误识别，最终落库为正式行程。

现状（已核实）：
- 后端已有完整的文本生成链路：`ArkAiServiceImpl`（Ark `responses` API + 白名单校验 + 降级 + `ai_generation` 记录）、`AiController`、`AiGenerateServiceImpl`（编排）、`PlanService.createFromAi`（geocode+route 单事务）、`JsonExtractor`（4 步容错）、`PromptBuilder`。
- `JwtInterceptor` 已覆盖 `/api/ai/**`（仅 `GET /api/ai/models` 为可选鉴权），`@CurrentUser` 可用。
- DB 已应用 `V2` 迁移，**尚无 `image_import` 表**。
- `application.yml` 无 multipart 大小配置（默认 1MB/10MB）；`aiRestTemplate` readTimeout=60s。
- 前端 `GeneratePage` 仅有文本表单；`constants/models.ts` 与 `modelStore`（含 `selectedImageModel`，已 persist）已就绪；`@dnd-kit/*` 已安装。
- 测试图片：`picTestCase/case1`（3 张）、`case2`（3 张）、`case3`（1 张）。

预期结果：`POST /api/ai/image-import` 返回识别预览，`POST /api/ai/image-import/confirm` 生成行程；前端生成页新增「图片导入」Tab，支持拖拽/粘贴/多图/排序/删除，识别结果可编辑后确认。

---

## 实施步骤

### A. 数据库迁移

1. 新增 `backend/src/main/resources/db/migration/V3__create_image_import.sql`：
   - `image_import` 表：`id, user_id, ai_generation_id, plan_id, model_name, image_count, image_paths(TEXT,JSON数组), recognized_json(MEDIUMTEXT), status(PENDING/RECOGNIZED/CONFIRMED/FAILED), error_message, created_at`；`KEY idx_image_import_user(user_id)`；InnoDB + utf8mb4。
2. 用项目外 JDBC 工具（`C:\Users\Sceley\AppData\Local\Temp\trip-dbtool\Exec`）应用该 SQL（mysql CLI 不可用）。

### B. 后端实现

3. 实体 `entity/ImageImport.java`（Lombok `@Data`，camelCase 镜像列名）。
4. `mapper/ImageImportMapper.java` + `resources/mapper/ImageImportMapper.xml`：`insert`(useGeneratedKeys)、`selectById`、`updateRecognized`、`updateFailed`、`updateConfirm`。
5. DTO：
   - `dto/request/ImageImportConfirmRequest.java`：`importId(@NotNull)`, `title`, `AiItineraryDto itinerary`（前端可回传编辑后的行程）。
   - `dto/response/ImageImportResponse.java`：`importId, itinerary, degraded, modelUsed, imageCount`。
6. `AiService` 新增方法 `AiGenerateResult recognizeItineraryFromImages(List<String> imageDataUrls, String model)`；`ArkAiServiceImpl` 实现：
   - 复用白名单校验（`ModelConstants.isValidImageModel`，缺省 `DEFAULT_IMAGE_MODEL`，非法抛 `BusinessException(400)`）+ 降级重试（失败时降级到默认识图模型，`degraded=true`）。
   - 构造 `input` 中一条 user 消息的 `content`：首个 `input_text`（识图提示词）+ N 个 `{type:"input_image", image_url: data:...}`。
   - 写 `ai_generation`（`input_type=IMAGE`）→ 复用 `extractTextFromResponse` / `JsonExtractor` / `validate`。
   - 抽出私有方法 `callArkApiWithContent(ai, model, ArrayNode content)` 供文本/图片共用。
7. `PromptBuilder` 新增 `buildImageSystemPrompt()`（同一 JSON Schema；额外要求：多图若属同一次行程需合并，无法识别字段留空）与 `buildImageUserPrompt(int imageCount)`。
8. `service/ImageImportService.java` + `impl/ImageImportServiceImpl.java`：
   - `recognize(MultipartFile[] files, String model, Long userId)`：校验非空/张数≤9/单张≤10MB/扩展名 jpg·jpeg·png·webp → 存 `uploads/{uuid}.{ext}` → 转 base64 data URL → 调 `recognizeItineraryFromImages` → 写 `image_import`(RECOGNIZED, 关联 ai_generation_id, 序列化 itinerary, image_paths JSON) → 返回预览；失败时写 FAILED 记录后抛出。
   - `confirm(ImageImportConfirmRequest, userId)`：校验记录存在且归属当前用户（否则 403）→ 行程取 `request.itinerary`（为空则解析 `recognized_json`）→ `planService.createFromAi` → 回写 `plan_id` + CONFIRMED → 返回 `AiGenerateResponse`（degraded=false, modelUsed=记录模型）+ 详情。
9. `controller/ImageImportController.java`：`/api/ai/image-import`
   - `POST`（`consumes=multipart/form-data`，`@RequestParam MultipartFile[] files`、`model`）→ 识别预览。
   - `POST /confirm`（`@RequestBody @Validated`）→ 生成行程。
10. 配置：
    - `application.yml` 增 `spring.servlet.multipart`（`max-file-size: 10MB`、`max-request-size: 60MB`）与 `app.upload.dir: uploads`。
    - `AppProperties` 增 `Upload{ dir }` 内部类。
    - `RestClientConfig.aiRestTemplate` readTimeout 60s → **120s**（识图/长生成，符合项目约定）。
    - `GlobalExceptionHandler` 增 `MaxUploadSizeExceededException` → 400「文件过大」。
    - `uploads/` 加入 `.gitignore`（若尚未忽略）。

### C. 前端实现

11. `types/ai.ts` 新增镜像类型：`ImageImportResponse`、`ImageImportConfirmRequest`，以及 `AiNodeDto`/`AiDayDto`/`AiItineraryDto`（snake_case，供预览编辑）。
12. `api/imageApi.ts`：`recognize(files, model)`（FormData + multipart header + 120s 超时）、`confirm(req)`（120s 超时）。
13. `components/image/ImageUploadZone.tsx`：antd `Upload.Dragger`（`multiple`、`accept=image/*`、`beforeUpload` 返回 `false` 手动收集）+ 窗口 `paste` 粘贴图片；产出 `UploadedImage{id,file,url}` 列表。
14. `components/image/ImagePreviewList.tsx`：`@dnd-kit` 缩略图排序 + 单张删除（复用 Phase 9 的 sensor 约定：`PointerSensor(distance 8)` + `KeyboardSensor`）。
15. `components/image/ImageImportPanel.tsx`（图片 Tab 容器）：
    - 上传区 + 预览排序区；识图模型 `Select`（`IMAGE_MODELS`，绑 `modelStore.selectedImageModel/setImageModel`）。
    - 「开始识别」→ `AiLoadingOverlay`（倒计时）→ 识别成功进入结果编辑态。
    - 结果编辑：按天分组，节点可改名称/类型/时长、删除误识别节点、每天「添加节点」；下方标题输入。
    - 「确认生成行程」→ `imageApi.confirm` → `setCurrent(plan)` → `navigate('/plans/{id}')`；「重新上传」重置。
16. `pages/GeneratePage.tsx`：外层加 `Tabs`（「文本生成」=现有 `GenerateForm`，「图片导入」= `ImageImportPanel`），文本占位提示保留。

### D. 验收

17. 后端构建：`backend\mvnw.cmd -s ..\settings\settings.xml "-Dmaven.repo.local=..\.m2\repository" clean package -DskipTests` → BUILD SUCCESS；**重启后端**（新增端点/配置）。
18. 前端构建：`npm run build` → 见 `✓ built`。
19. API 冒烟（`Invoke-RestMethod`，中文 body 走 UTF-8 临时文件）：注册/登录取 token → `image-import` 上传 `case1`(3) → 返回 itinerary → `confirm` → `GET /api/plans/{id}` 校验 2 天/多节点/路线；再验 `case2+case3`(3+1=4 图) 多图合并。
20. 浏览器冒烟（`browser_use`，`http://127.0.0.1:5173`）：/generate → 切「图片导入」→ 上传 → 识别 → 删除一个误识别节点 → 确认 → 跳详情页；控制台无红色报错。
21. 清理测试数据：`DELETE /api/plans/{id}` 删除本次测试行程，`GET /api/plans?scope=public` 确认恢复；上传的 `uploads/` 临时文件清理。
22. 更新 `dev-progress.md` 三处（总览表 Phase 14 行 / 详细记录勾选+证据 / 变更日志）。

## 关键文件

- 新增：`db/migration/V3__create_image_import.sql`、`entity/ImageImport.java`、`mapper/ImageImportMapper.java`(+XML)、`dto/request/ImageImportConfirmRequest.java`、`dto/response/ImageImportResponse.java`、`service/ImageImportService.java`(+impl)、`controller/ImageImportController.java`、前端 `api/imageApi.ts`、`components/image/{ImageUploadZone,ImagePreviewList,ImageImportPanel}.tsx`。
- 修改：`AiService.java`、`impl/ArkAiServiceImpl.java`、`util/PromptBuilder.java`、`config/AppProperties.java`、`config/RestClientConfig.java`、`exception/GlobalExceptionHandler.java`、`application.yml`、前端 `types/ai.ts`、`pages/GeneratePage.tsx`。

## 约束与复用

- 不引入新依赖（dnd-kit / antd 已装）。
- 复用：`JsonExtractor`、`PromptBuilder`、`PlanService.createFromAi`、`ModelConstants.IMAGE_MODELS`、`AiLoadingOverlay`、`modelStore`、`client` 拦截器。
- 中文注释；`orderIndex` 0-based（UI +1）。
