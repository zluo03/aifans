-- AlterTable
ALTER TABLE `Creator` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;

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

-- AddForeignKey
ALTER TABLE `user_messages` ADD CONSTRAINT `user_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_messages` ADD CONSTRAINT `user_messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
