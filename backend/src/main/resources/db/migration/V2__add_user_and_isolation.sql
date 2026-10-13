-- ============================================================
-- Phase 12: 用户登录与行程归属隔离 — V2 迁移脚本
-- 1. 新建 user 表
-- 2. travel_plan 加 user_id / is_public
-- 3. ai_generation 加 user_id
-- 4. 存量 travel_plan 标记 is_public=1
-- 5. 新增索引
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT,
    `username`   VARCHAR(50)  NOT NULL COMMENT '用户名（登录名，唯一）',
    `password`   VARCHAR(100) NOT NULL COMMENT 'BCrypt 加密后的密码哈希',
    `email`      VARCHAR(100) NULL COMMENT '邮箱',
    `phone`      VARCHAR(20)  NULL COMMENT '手机号',
    `avatar`     VARCHAR(255) NULL COMMENT '头像 URL',
    `role`       VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT '角色: USER/ADMIN',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- travel_plan 增加归属与可见性字段
ALTER TABLE `travel_plan`
    ADD COLUMN `user_id`   BIGINT  NULL COMMENT '归属用户ID（NULL=存量公共数据）',
    ADD COLUMN `is_public` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公共行程: 0=私有 1=公共';

-- ai_generation 增加归属用户ID
ALTER TABLE `ai_generation`
    ADD COLUMN `user_id` BIGINT NULL COMMENT '发起生成的用户ID';

-- 存量行程（user_id IS NULL）统一标记为公共行程，未登录用户可见
UPDATE `travel_plan` SET `is_public` = 1 WHERE `user_id` IS NULL;

-- 行程归属索引（按用户查列表的高频查询路径）
CREATE INDEX `idx_user_plan` ON `travel_plan` (`user_id`);
