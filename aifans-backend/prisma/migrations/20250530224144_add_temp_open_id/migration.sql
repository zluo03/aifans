/*
  Warnings:

  - A unique constraint covering the columns `[tempOpenId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `tempOpenId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_tempOpenId_key` ON `users`(`tempOpenId`);
