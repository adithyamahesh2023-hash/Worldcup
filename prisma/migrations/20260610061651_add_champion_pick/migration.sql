-- AlterTable
ALTER TABLE `users` ADD COLUMN `championTeamId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_championTeamId_fkey` FOREIGN KEY (`championTeamId`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
