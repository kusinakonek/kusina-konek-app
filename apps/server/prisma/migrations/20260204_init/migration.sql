-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DONOR', 'RECIPIENT', 'VOLUNTEER');

-- CreateTable: Role
CREATE TABLE "Role" (
    "roleID" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleID")
);

-- CreateTable: Status
CREATE TABLE "Status" (
    "statusID" SERIAL NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("statusID")
);

-- CreateTable: User
CREATE TABLE "User" (
    "userID" TEXT NOT NULL,
    "roleID" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "suffix" TEXT,
    "phoneNo" TEXT NOT NULL,
    "phoneNoHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "isOrg" BOOLEAN NOT NULL DEFAULT false,
    "orgName" TEXT,
    "password" TEXT NOT NULL,
    "DateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userID")
);

-- CreateTable: Address
CREATE TABLE "Address" (
    "addID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("addID")
);

-- CreateTable: Food
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

-- CreateTable: DropOffLocation
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

-- CreateTable: Distribution
CREATE TABLE "Distribution" (
    "disID" TEXT NOT NULL,
    "donorID" TEXT NOT NULL,
    "recipientID" TEXT NOT NULL,
    "locID" TEXT NOT NULL,
    "foodID" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "photoProof" TEXT,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "actualTime" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("disID")
);

-- CreateTable: Feedback
CREATE TABLE "Feedback" (
    "feedbackID" TEXT NOT NULL,
    "donorID" TEXT NOT NULL,
    "recipientID" TEXT NOT NULL,
    "disID" TEXT NOT NULL,
    "ratingScore" INTEGER NOT NULL,
    "comments" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("feedbackID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "Status_statusName_key" ON "Status"("statusName");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNoHash_key" ON "User"("phoneNoHash");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "Address_UserID_key" ON "Address"("UserID");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Role"("roleID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropOffLocation" ADD CONSTRAINT "DropOffLocation_foodID_fkey" FOREIGN KEY ("foodID") REFERENCES "Food"("foodID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DropOffLocation" ADD CONSTRAINT "DropOffLocation_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_donorID_fkey" FOREIGN KEY ("donorID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_locID_fkey" FOREIGN KEY ("locID") REFERENCES "DropOffLocation"("locID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_foodID_fkey" FOREIGN KEY ("foodID") REFERENCES "Food"("foodID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_donorID_fkey" FOREIGN KEY ("donorID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_disID_fkey" FOREIGN KEY ("disID") REFERENCES "Distribution"("disID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default roles
INSERT INTO "Role" ("roleName") VALUES ('DONOR'), ('RECIPIENT'), ('VOLUNTEER') ON CONFLICT DO NOTHING;

-- Seed default statuses
INSERT INTO "Status" ("statusName") VALUES ('PENDING'), ('CONFIRMED'), ('COMPLETED'), ('CANCELLED') ON CONFLICT DO NOTHING;
