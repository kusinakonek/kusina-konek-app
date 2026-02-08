-- AlterTable
ALTER TABLE "Distribution" ALTER COLUMN "quantity" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "DropOffLocation" ALTER COLUMN "barangay" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Food" ALTER COLUMN "dateCooked" DROP NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE TEXT;
