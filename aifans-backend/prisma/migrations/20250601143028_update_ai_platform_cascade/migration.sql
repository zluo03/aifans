-- DropForeignKey
ALTER TABLE `posts` DROP FOREIGN KEY `posts_aiPlatformId_fkey`;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_aiPlatformId_fkey` FOREIGN KEY (`aiPlatformId`) REFERENCES `ai_platforms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
