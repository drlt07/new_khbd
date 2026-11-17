-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'SUPERSEDED');

-- AlterEnum
ALTER TYPE "LessonStatus" ADD VALUE 'REVIEW';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "avgScore" DOUBLE PRECISION,
ADD COLUMN     "competency" TEXT,
ADD COLUMN     "difficulties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxSize" INTEGER,
ADD COLUMN     "needs" TEXT,
ADD COLUMN     "slotKey" TEXT,
ADD COLUMN     "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "supportGoal" TEXT;

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "fit" TEXT;

-- AlterTable
ALTER TABLE "GroupTask" ADD COLUMN     "assessment" TEXT,
ADD COLUMN     "challenge" TEXT,
ADD COLUMN     "materials" TEXT;

-- AlterTable
ALTER TABLE "Grouping" ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "engine" TEXT,
ADD COLUMN     "lineageId" TEXT,
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "step" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "balanceSizes" SET DEFAULT false;

-- AlterTable
ALTER TABLE "LessonPlan" ADD COLUMN     "content" TEXT,
ADD COLUMN     "engine" TEXT,
ADD COLUMN     "methods" TEXT;

-- Dữ liệu cũ: mỗi bộ nhóm là phiên bản 1 đã duyệt; mỗi nhóm giữ slotKey = id
UPDATE "Grouping" SET "lineageId" = "id", "status" = 'CONFIRMED', "step" = 4, "confirmedAt" = "updatedAt", "engine" = 'rules-v1';
UPDATE "Group" SET "slotKey" = "id";
ALTER TABLE "Grouping" ALTER COLUMN "lineageId" SET NOT NULL;
ALTER TABLE "Group" ALTER COLUMN "slotKey" SET NOT NULL;

-- CreateTable
CREATE TABLE "LearningResource" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "url" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_createdAt_idx" ON "ActivityLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Grouping_classId_lineageId_idx" ON "Grouping"("classId", "lineageId");

-- AddForeignKey
ALTER TABLE "LearningResource" ADD CONSTRAINT "LearningResource_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

