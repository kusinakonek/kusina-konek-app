-- CreateTable
CREATE TABLE "Food" (
    "foodID" TEXT NOT NULL,
    "userID" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "dateCooked" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "image" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("foodID")
);

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
