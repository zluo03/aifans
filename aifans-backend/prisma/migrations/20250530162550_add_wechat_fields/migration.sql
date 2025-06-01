/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[wechatOpenId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wechatUnionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `passwordHash`,
    ADD COLUMN `isWechatUser` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `wechatAvatar` VARCHAR(191) NULL,
    ADD COLUMN `wechatNickname` VARCHAR(191) NULL,
    ADD COLUMN `wechatOpenId` VARCHAR(191) NULL,
    ADD COLUMN `wechatUnionId` VARCHAR(191) NULL,
    MODIFY `username` VARCHAR(191) NULL,
    MODIFY `nickname` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_wechatOpenId_key` ON `users`(`wechatOpenId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_wechatUnionId_key` ON `users`(`wechatUnionId`);
