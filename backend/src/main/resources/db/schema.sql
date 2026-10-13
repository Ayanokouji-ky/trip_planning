-- ============================================================
-- AI 旅游行程规划与地图可视化平台 — 数据库表结构
-- MySQL 8.0+, InnoDB, utf8mb4
-- ============================================================

-- 用户表（Phase 12：登录与归属隔离）
CREATE TABLE IF NOT EXISTS `user` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT,
    `username`   VARCHAR(50)  NOT NULL COMMENT '用户名（登录名，唯一）',
    `password`   VARCHAR(100) NOT NULL COMMENT 'BCrypt 加密后的密码哈希',
    `email`      VARCHAR(100) NULL COMMENT '邮箱',
    `phone`      VARCHAR(20)  NULL COMMENT '手机号',
    `avatar`     VARCHAR(255) NULL COMMENT '头像 URL',
    `role`       VARCHAR(20)  NOT NULL DEFAULT 'USER' COMMENT '角色: USER/ADMIN',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 行程主表
CREATE TABLE IF NOT EXISTS `travel_plan` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `title`       VARCHAR(200) NOT NULL COMMENT '行程标题',
    `city`        VARCHAR(50)  NOT NULL COMMENT '目的地城市',
    `days`        INT          NOT NULL DEFAULT 1 COMMENT '行程天数',
    `status`      VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' COMMENT '行程状态: DRAFT/ACTIVE/ARCHIVED',
    `summary`     TEXT         NULL COMMENT '行程概述',
    `user_id`     BIGINT       NULL COMMENT '归属用户ID（NULL=存量公共数据）',
    `is_public`   TINYINT      NOT NULL DEFAULT 0 COMMENT '是否公共行程: 0=私有 1=公共',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`),
    KEY `idx_user_plan` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程主表';

-- 每日行程
CREATE TABLE IF NOT EXISTS `plan_day` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT,
    `plan_id`     BIGINT       NOT NULL COMMENT '关联行程ID',
    `day_index`   INT          NOT NULL COMMENT '第几天, 从1开始',
    `date`        DATE         NULL COMMENT '具体日期',
    `summary`     VARCHAR(500) NULL COMMENT '当日行程摘要',
    PRIMARY KEY (`id`),
    KEY `idx_plan_id` (`plan_id`),
    KEY `idx_plan_day` (`plan_id`, `day_index`),
    CONSTRAINT `fk_day_plan` FOREIGN KEY (`plan_id`) REFERENCES `travel_plan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日行程';

-- 行程节点（景点/餐饮/住宿等）
CREATE TABLE IF NOT EXISTS `plan_node` (
    `id`                 BIGINT       NOT NULL AUTO_INCREMENT,
    `plan_id`            BIGINT       NOT NULL COMMENT '关联行程ID',
    `day_id`             BIGINT       NOT NULL COMMENT '关联每日行程ID',
    `place_name`         VARCHAR(200) NOT NULL COMMENT '地点名称',
    `place_type`         VARCHAR(30)  NULL COMMENT '地点类型: ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER',
    `lat`                DECIMAL(10,6) NULL COMMENT '纬度 (BD09)',
    `lng`                DECIMAL(10,6) NULL COMMENT '经度 (BD09)',
    `order_index`        INT          NOT NULL DEFAULT 0 COMMENT '游览顺序, 从0开始',
    `suggested_duration` INT          NULL COMMENT '建议游览时长(分钟)',
    `highlight`          VARCHAR(500) NULL COMMENT '重点参观项目',
    `description`        TEXT         NULL COMMENT '地点描述',
    `open_time`          VARCHAR(200) NULL COMMENT '开放时间',
    `ticket_info`        VARCHAR(500) NULL COMMENT '门票信息',
    `transport_from_prev` VARCHAR(200) NULL COMMENT '从上一节点过来的交通方式',
    `estimated_cost`     DECIMAL(10,2) NULL COMMENT '预计花费(元)',
    `note`               TEXT         NULL COMMENT '用户备注/避坑提示',
    PRIMARY KEY (`id`),
    KEY `idx_plan_id` (`plan_id`),
    KEY `idx_day_id` (`day_id`),
    KEY `idx_order` (`day_id`, `order_index`),
    CONSTRAINT `fk_node_plan` FOREIGN KEY (`plan_id`) REFERENCES `travel_plan` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_node_day` FOREIGN KEY (`day_id`) REFERENCES `plan_day` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='行程节点';

-- 节点间路线
CREATE TABLE IF NOT EXISTS `plan_route` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT,
    `plan_id`         BIGINT       NOT NULL COMMENT '关联行程ID',
    `from_node_id`    BIGINT       NOT NULL COMMENT '起点节点ID',
    `to_node_id`      BIGINT       NOT NULL COMMENT '终点节点ID',
    `transport_mode`  VARCHAR(20)  NOT NULL DEFAULT 'driving' COMMENT '通行方式: driving/walking/transit/riding',
    `distance`        DECIMAL(10,2) NULL COMMENT '距离(米)',
    `duration`        INT          NULL COMMENT '预计耗时(秒)',
    `cost`            DECIMAL(10,2) NULL COMMENT '交通费用(元)',
    PRIMARY KEY (`id`),
    KEY `idx_plan_id` (`plan_id`),
    KEY `idx_from_node` (`from_node_id`),
    KEY `idx_to_node` (`to_node_id`),
    CONSTRAINT `fk_route_plan` FOREIGN KEY (`plan_id`) REFERENCES `travel_plan` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_route_from` FOREIGN KEY (`from_node_id`) REFERENCES `plan_node` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_route_to` FOREIGN KEY (`to_node_id`) REFERENCES `plan_node` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='节点间路线';

-- AI 生成记录
CREATE TABLE IF NOT EXISTS `ai_generation` (
    `id`             BIGINT       NOT NULL AUTO_INCREMENT,
    `plan_id`        BIGINT       NULL COMMENT '关联行程ID (生成成功后关联)',
    `input_type`     VARCHAR(20)  NOT NULL DEFAULT 'TEXT' COMMENT '输入类型: TEXT/IMAGE',
    `input_content`  TEXT         NOT NULL COMMENT '用户输入内容',
    `model_name`     VARCHAR(100) NOT NULL COMMENT 'AI模型名称',
    `prompt`         TEXT         NULL COMMENT '发送给AI的完整提示词',
    `output_json`    MEDIUMTEXT   NULL COMMENT 'AI返回的JSON原始内容',
    `status`         VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '生成状态: PENDING/SUCCESS/FAILED',
    `error_message`  TEXT         NULL COMMENT '失败原因',
    `user_id`        BIGINT       NULL COMMENT '发起生成的用户ID',
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_plan_id` (`plan_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI生成记录';
