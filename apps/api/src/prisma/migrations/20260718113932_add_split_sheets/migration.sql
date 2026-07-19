-- CreateEnum
CREATE TYPE "SplitSheetStatus" AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'LOCKED');

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "SplitSheet" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "totalPercentage" INTEGER NOT NULL DEFAULT 0,
    "status" "SplitSheetStatus" NOT NULL DEFAULT 'DRAFT',
    "lockedAt" TIMESTAMP(3),
    "lockedHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitSheetEntry" (
    "id" TEXT NOT NULL,
    "splitSheetId" TEXT NOT NULL,
    "collaboratorName" TEXT NOT NULL,
    "collaboratorEmail" TEXT NOT NULL,
    "collaboratorId" TEXT,
    "percentage" INTEGER NOT NULL,
    "confirmationToken" TEXT NOT NULL,
    "confirmationStatus" "ConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitSheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SplitSheet_workId_key" ON "SplitSheet"("workId");

-- CreateIndex
CREATE INDEX "SplitSheet_workId_idx" ON "SplitSheet"("workId");

-- CreateIndex
CREATE INDEX "SplitSheet_status_idx" ON "SplitSheet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SplitSheetEntry_confirmationToken_key" ON "SplitSheetEntry"("confirmationToken");

-- CreateIndex
CREATE INDEX "SplitSheetEntry_splitSheetId_idx" ON "SplitSheetEntry"("splitSheetId");

-- CreateIndex
CREATE INDEX "SplitSheetEntry_confirmationToken_idx" ON "SplitSheetEntry"("confirmationToken");

-- CreateIndex
CREATE INDEX "SplitSheetEntry_collaboratorEmail_idx" ON "SplitSheetEntry"("collaboratorEmail");

-- AddForeignKey
ALTER TABLE "SplitSheet" ADD CONSTRAINT "SplitSheet_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSheetEntry" ADD CONSTRAINT "SplitSheetEntry_splitSheetId_fkey" FOREIGN KEY ("splitSheetId") REFERENCES "SplitSheet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
