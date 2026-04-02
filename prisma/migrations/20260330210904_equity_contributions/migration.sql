-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'DEPOSITED');

-- CreateTable
CREATE TABLE "EquityContribution" (
    "id" TEXT NOT NULL,
    "partnerName" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'PENDING',
    "promisedDate" TIMESTAMP(3),
    "depositedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquityContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EquityContribution_companyId_idx" ON "EquityContribution"("companyId");

-- AddForeignKey
ALTER TABLE "EquityContribution" ADD CONSTRAINT "EquityContribution_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
