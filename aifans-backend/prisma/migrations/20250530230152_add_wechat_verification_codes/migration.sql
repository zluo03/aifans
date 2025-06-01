/*
  Warnings:

  - You are about to drop the column `created_at` on the `wechat_verification_codes` table. All the data in the column will be lost.
  - You are about to drop the column `expired_at` on the `wechat_verification_codes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `wechat_verification_codes` table. All the data in the column will be lost.
  - Added the required column `expiredAt` to the `wechat_verification_codes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `wechat_verification_codes_expired_at_idx` ON `wechat_verification_codes`;

-- AlterTable
ALTER TABLE `wechat_verification_codes` DROP COLUMN `created_at`,
    DROP COLUMN `expired_at`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `expiredAt` DATETIME(3) NOT NULL,
    MODIFY `code` VARCHAR(191) NOT NULL,
    MODIFY `openId` VARCHAR(191) NOT NULL;
