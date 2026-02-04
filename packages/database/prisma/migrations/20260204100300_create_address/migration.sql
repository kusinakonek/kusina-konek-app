-- CreateTable
CREATE TABLE "Address" (
    "addID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("addID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Address_UserID_key" ON "Address"("UserID");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
