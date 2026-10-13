-- V4: plan_route 增加出行建议文案列（Phase 19 多方式路线推荐）
ALTER TABLE `plan_route`
    ADD COLUMN `suggestion` VARCHAR(200) NULL COMMENT '出行建议文案（如：距离 850m，建议步行约 12 分钟）' AFTER `cost`;
