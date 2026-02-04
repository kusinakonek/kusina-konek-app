-- CreateTable
CREATE TABLE "DropOffLocation" (
    "locID" TEXT NOT NULL,
    "foodID" TEXT,
    "userID" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,

    CONSTRAINT "DropOffLocation_pkey" PRIMARY KEY ("locID")
);

-- AddForeignKey
ALTER TABLE "DropOffLocation" ADD CONSTRAINT "DropOffLocation_foodID_fkey" FOREIGN KEY ("foodID") REFERENCES "Food"("foodID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropOffLocation" ADD CONSTRAINT "DropOffLocation_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
