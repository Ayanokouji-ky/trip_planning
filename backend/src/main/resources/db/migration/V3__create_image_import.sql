-- ============================================================
-- Phase 14: 图片一图流攻略识别生成 — V3 迁移脚本
-- 新建 image_import 表（图片导入识图记录）
-- ============================================================

CREATE TABLE IF NOT EXISTS `image_import` (
    `id`               BIGINT       NOT NULL AUTO_INCREMENT,
    `user_id`          BIGINT       NULL COMMENT '上传用户ID',
    `ai_generation_id` BIGINT       NULL COMMENT '关联的 ai_generation 记录ID',
    `plan_id`          BIGINT       NULL COMMENT '确认生成后关联的行程ID',
    `model_name`       VARCHAR(64)  NULL COMMENT '识图使用的模型ID',
    `image_count`      INT          NOT NULL DEFAULT 0 COMMENT '上传图片张数',
    `image_paths`      TEXT         NULL COMMENT '已存储图片相对路径，JSON 数组',
    `recognized_json`  MEDIUMTEXT   NULL COMMENT 'AI 识别出的行程原始 JSON',
    `status`           VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/RECOGNIZED/CONFIRMED/FAILED',
    `error_message`    VARCHAR(500) NULL COMMENT '失败原因',
    `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_image_import_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图片导入识图记录';
