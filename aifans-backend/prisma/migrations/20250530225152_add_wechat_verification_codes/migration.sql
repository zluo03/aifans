-- CreateTable
CREATE TABLE `wechat_verification_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(6) NOT NULL,
    `openId` VARCHAR(64) NOT NULL,
    `expired_at` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `wechat_verification_codes_code_idx`(`code`),
    INDEX `wechat_verification_codes_openId_idx`(`openId`),
    INDEX `wechat_verification_codes_expired_at_idx`(`expired_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
