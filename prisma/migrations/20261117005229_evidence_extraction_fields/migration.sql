-- AlterTable
ALTER TABLE "StudentEvidence" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "extractedAt" TIMESTAMP(3),
ADD COLUMN     "extractionNote" TEXT;

-- CreateIndex
CREATE INDEX "StudentEvidence_classId_checksum_idx" ON "StudentEvidence"("classId", "checksum");
