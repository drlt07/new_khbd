-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('DRAFT', 'DONE');

-- CreateEnum
CREATE TYPE "ActivityPhase" AS ENUM ('OPENING', 'KNOWLEDGE', 'PRACTICE', 'APPLICATION');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "forSupport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profile" TEXT,
ADD COLUMN     "scoreMax" DOUBLE PRECISION,
ADD COLUMN     "scoreMin" DOUBLE PRECISION;
-- Giữ lại nhiệm vụ cũ làm mô tả đặc trưng nhóm
UPDATE "Group" SET "profile" = "task" WHERE "task" IS NOT NULL;
ALTER TABLE "Group" DROP COLUMN "task";

-- AlterTable
ALTER TABLE "Grouping" DROP COLUMN "method",
ADD COLUMN     "balanceSizes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scoreSheetId" TEXT,
ADD COLUMN     "subject" TEXT;

-- DropEnum
DROP TYPE "GroupingMethod";

-- CreateTable
CREATE TABLE "ScoreSheet" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreColumn" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScoreColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentScore" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StudentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "groupingId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periods" INTEGER NOT NULL DEFAULT 1,
    "requirements" TEXT,
    "knowledgeGoals" TEXT,
    "competencyGoals" TEXT,
    "qualityGoals" TEXT,
    "materials" TEXT,
    "assessment" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "phase" "ActivityPhase" NOT NULL,
    "title" TEXT NOT NULL,
    "minutes" INTEGER,
    "goal" TEXT,
    "content" TEXT,
    "product" TEXT,
    "organization" TEXT,
    "byGroup" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupTask" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "product" TEXT,
    "support" TEXT,

    CONSTRAINT "GroupTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentScore_columnId_studentId_key" ON "StudentScore"("columnId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupTask_activityId_groupId_key" ON "GroupTask"("activityId", "groupId");

-- AddForeignKey
ALTER TABLE "ScoreSheet" ADD CONSTRAINT "ScoreSheet_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreColumn" ADD CONSTRAINT "ScoreColumn_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "ScoreSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "ScoreColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grouping" ADD CONSTRAINT "Grouping_scoreSheetId_fkey" FOREIGN KEY ("scoreSheetId") REFERENCES "ScoreSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_groupingId_fkey" FOREIGN KEY ("groupingId") REFERENCES "Grouping"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTask" ADD CONSTRAINT "GroupTask_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "LessonActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupTask" ADD CONSTRAINT "GroupTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

