-- CreateTable
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

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_donorID_fkey" FOREIGN KEY ("donorID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_recipientID_fkey" FOREIGN KEY ("recipientID") REFERENCES "User"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_disID_fkey" FOREIGN KEY ("disID") REFERENCES "Distribution"("disID") ON DELETE RESTRICT ON UPDATE CASCADE;
