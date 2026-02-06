-- CreateTable
CREATE TABLE "Distribution" (
    "disID" TEXT NOT NULL,
    "donorID" TEXT NOT NULL,
    "recipientID" TEXT NULL,
    "locID" TEXT NOT NULL,
    "foodID" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "photoProof" TEXT,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "actualTime" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("disID")
);

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_donorID_fkey" FOREIGN KEY ("donorID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_locID_fkey" FOREIGN KEY ("locID") REFERENCES "DropOffLocation"("locID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_foodID_fkey" FOREIGN KEY ("foodID") REFERENCES "Food"("foodID") ON DELETE RESTRICT ON UPDATE CASCADE;
