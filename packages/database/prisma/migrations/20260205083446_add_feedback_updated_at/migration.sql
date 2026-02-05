/*
  Warnings:

  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'CLAIMED', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Distribution" ADD COLUMN     "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
