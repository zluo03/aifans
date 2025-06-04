/*
  Warnings:

  - A unique constraint covering the columns `[wechatOpenId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wechatUnionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tempOpenId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Creator` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `isWechatUser` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `password` VARCHAR(191) NULL,
    ADD COLUMN `tempOpenId` VARCHAR(191) NULL,
    ADD COLUMN `wechatAvatar` VARCHAR(191) NULL,
    ADD COLUMN `wechatNickname` VARCHAR(191) NULL,
    ADD COLUMN `wechatOpenId` VARCHAR(191) NULL,
    ADD COLUMN `wechatUnionId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `user_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_messages_senderId_idx`(`senderId`),
    INDEX `user_messages_receiverId_idx`(`receiverId`),
    INDEX `user_messages_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_wechatOpenId_key` ON `users`(`wechatOpenId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_wechatUnionId_key` ON `users`(`wechatUnionId`);

-- CreateIndex
CREATE UNIQUE INDEX `users_tempOpenId_key` ON `users`(`tempOpenId`);

-- AddForeignKey
ALTER TABLE `user_messages` ADD CONSTRAINT `user_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_messages` ADD CONSTRAINT `user_messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
