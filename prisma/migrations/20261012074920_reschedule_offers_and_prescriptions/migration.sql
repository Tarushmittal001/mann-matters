-- CreateTable
CREATE TABLE "RescheduleOffer" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "chosenDate" TEXT,
    "chosenTime" TEXT,
    "actedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RescheduleOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "bookingId" TEXT,
    "userId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "prescriberName" TEXT NOT NULL,
    "prescriberCreds" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "advice" TEXT NOT NULL DEFAULT '',
    "followUpDays" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RescheduleOffer_bookingId_key" ON "RescheduleOffer"("bookingId");

-- CreateIndex
CREATE INDEX "RescheduleOffer_expertId_actedAt_idx" ON "RescheduleOffer"("expertId", "actedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_number_key" ON "Prescription"("number");

-- CreateIndex
CREATE INDEX "Prescription_userId_issuedAt_idx" ON "Prescription"("userId", "issuedAt");

-- CreateIndex
CREATE INDEX "Prescription_expertId_issuedAt_idx" ON "Prescription"("expertId", "issuedAt");

-- AddForeignKey
ALTER TABLE "RescheduleOffer" ADD CONSTRAINT "RescheduleOffer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
