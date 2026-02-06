-- AlterTable: Make roleID optional in User table
-- Users now select their role (DONOR/RECIPIENT) at login instead of registration
ALTER TABLE "User" ALTER COLUMN "roleID" DROP NOT NULL;
