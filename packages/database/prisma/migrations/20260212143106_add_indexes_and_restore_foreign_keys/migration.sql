-- DropForeignKey
ALTER TABLE "Distribution" DROP CONSTRAINT "Distribution_recipientID_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roleID_fkey";

-- CreateIndex
CREATE INDEX "Distribution_donorID_status_idx" ON "Distribution"("donorID", "status");

-- CreateIndex
CREATE INDEX "Distribution_recipientID_claimedAt_idx" ON "Distribution"("recipientID", "claimedAt");

-- CreateIndex
CREATE INDEX "Distribution_status_recipientID_idx" ON "Distribution"("status", "recipientID");

-- CreateIndex
CREATE INDEX "Distribution_timestamp_idx" ON "Distribution"("timestamp");

-- CreateIndex
CREATE INDEX "Feedback_donorID_idx" ON "Feedback"("donorID");

-- CreateIndex
CREATE INDEX "Feedback_disID_idx" ON "Feedback"("disID");

-- CreateIndex
CREATE INDEX "User_emailHash_idx" ON "User"("emailHash");

-- CreateIndex
CREATE INDEX "User_phoneNoHash_idx" ON "User"("phoneNoHash");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Role"("roleID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "User"("userID") ON DELETE SET NULL ON UPDATE CASCADE;
