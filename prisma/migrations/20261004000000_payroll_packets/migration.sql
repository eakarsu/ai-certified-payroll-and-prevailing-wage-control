CREATE TABLE "PayrollPacket" (
    "id" TEXT NOT NULL,
    "weeklyPayrollId" TEXT NOT NULL,
    "payrollProjectId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "preparedById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "receiptReference" TEXT,
    "receiptArtifactId" TEXT,
    "receiptRecordedById" TEXT,
    "receiptRecordedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollPacket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PayrollPacket_weeklyPayrollId_snapshotHash_key" ON "PayrollPacket"("weeklyPayrollId", "snapshotHash");
CREATE INDEX "PayrollPacket_payrollProjectId_createdAt_idx" ON "PayrollPacket"("payrollProjectId", "createdAt");
ALTER TABLE "PayrollLine" ADD COLUMN "weeklyPayrollId" TEXT;
CREATE INDEX "PayrollLine_weeklyPayrollId_idx" ON "PayrollLine"("weeklyPayrollId");
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_weeklyPayrollId_fkey" FOREIGN KEY ("weeklyPayrollId") REFERENCES "WeeklyPayroll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
