-- CreateTable
CREATE TABLE "Status" (
    "statusID" SERIAL NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("statusID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_statusName_key" ON "Status"("statusName");
