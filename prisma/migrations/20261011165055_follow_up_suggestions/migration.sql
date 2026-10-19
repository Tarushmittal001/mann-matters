-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "message" TEXT NOT NULL DEFAULT '',
    "actedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowUp_expertId_userId_key" ON "FollowUp"("expertId", "userId");

-- CreateIndex
CREATE INDEX "FollowUp_userId_actedAt_idx" ON "FollowUp"("userId", "actedAt");

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
