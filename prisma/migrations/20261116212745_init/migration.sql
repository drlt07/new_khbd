-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SCHOOL_MANAGER', 'TEACHER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('NOT_ANALYZED', 'ANALYZING', 'PENDING_REVIEW', 'CONFIRMED', 'NEEDS_MORE_DATA');

-- CreateEnum
CREATE TYPE "ProfileDimension" AS ENUM ('INTEREST', 'STRENGTH', 'COMPETENCY', 'LEARNING_NEED', 'LEARNING_PREFERENCE', 'DEVELOPMENT_GOAL');

-- CreateEnum
CREATE TYPE "ItemOrigin" AS ENUM ('TEACHER', 'AI', 'IMPORT');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EDITED', 'REJECTED', 'NEEDS_DATA');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('MANUAL_ENTRY', 'FREE_TEXT_NOTE', 'FILE_UPLOAD', 'EXCEL_IMPORT', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('SCORE_SHEET', 'TEST', 'ASSIGNMENT', 'PRODUCT', 'IMAGE', 'ASSESSMENT_DOC', 'OBSERVATION_NOTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'EXTRACTED', 'FAILED');

-- CreateEnum
CREATE TYPE "LessonPlanStatus" AS ENUM ('DRAFT', 'GENERATED', 'CONFIRMED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityPhase" AS ENUM ('OPENING', 'KNOWLEDGE', 'PRACTICE', 'APPLICATION');

-- CreateEnum
CREATE TYPE "GuidanceLevel" AS ENUM ('INDEPENDENT', 'PARTIAL_GUIDANCE', 'STEP_BY_STEP');

-- CreateEnum
CREATE TYPE "AITaskType" AS ENUM ('DOCUMENT_EXTRACTION', 'STUDENT_PROFILE_ANALYSIS', 'EVIDENCE_MAPPING', 'LEARNING_NEEDS_ANALYSIS', 'LESSON_ANALYSIS', 'ACTIVITY_RECOMMENDATION', 'FLEXIBLE_GROUPING', 'DIFFERENTIATED_TASK_GENERATION', 'LESSON_PLAN_GENERATION', 'LESSON_PLAN_REVISION');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'EDITED', 'REJECTED', 'REANALYZE_REQUESTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT,
    "phone" TEXT,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "gradeLevel" INTEGER,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentCode" TEXT,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "notes" TEXT,
    "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'NOT_ANALYZED',
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentFramework" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "subjectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentFramework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCriteria" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "dimension" "ProfileDimension" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEvidence" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL,
    "source" "DataSource" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "storageKey" TEXT,
    "textContent" TEXT,
    "extractedData" JSONB,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "processingError" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceStudentLink" (
    "evidenceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceStudentLink_pkey" PRIMARY KEY ("evidenceId","studentId")
);

-- CreateTable
CREATE TABLE "StudentObservation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "evidenceId" TEXT,
    "assessmentName" TEXT NOT NULL,
    "term" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "requirementRef" TEXT,
    "comment" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentInterest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriaId" TEXT,
    "recommendationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" "ConfidenceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentStrength" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriaId" TEXT,
    "recommendationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" "ConfidenceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentStrength_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLearningNeed" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriaId" TEXT,
    "recommendationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "supportStrategy" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" "ConfidenceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLearningNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentLearningPreference" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriaId" TEXT,
    "recommendationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" "ConfidenceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLearningPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDevelopmentGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriaId" TEXT,
    "recommendationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" "ConfidenceLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDevelopmentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriaId" TEXT,
    "subjectId" TEXT,
    "recommendationId" TEXT,
    "competencyName" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confidence" "ConfidenceLevel",
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCompetencyProfile" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "summary" TEXT,
    "teacherComment" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastAnalyzedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCompetencyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topic" TEXT,
    "title" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "objectives" JSONB,
    "requirements" TEXT,
    "knowledgeContent" TEXT,
    "plannedMethods" TEXT,
    "references" TEXT,
    "templateFileKey" TEXT,
    "lessonAnalysis" JSONB,
    "content" JSONB,
    "status" "LessonPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "wizardStep" INTEGER NOT NULL DEFAULT 1,
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "phase" "ActivityPhase" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "content" TEXT,
    "product" TEXT,
    "organization" TEXT,
    "differentiation" TEXT,
    "support" TEXT,
    "assessment" TEXT,
    "durationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningGroup" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "activityId" TEXT,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "rationale" TEXT,
    "product" TEXT,
    "support" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'CONFIRMED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT,
    "rationale" TEXT,
    "isNewChallenge" BOOLEAN NOT NULL DEFAULT false,
    "insufficientData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifferentiatedTask" (
    "id" TEXT NOT NULL,
    "activityId" TEXT,
    "groupId" TEXT,
    "studentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "product" TEXT,
    "guidanceLevel" "GuidanceLevel" NOT NULL DEFAULT 'PARTIAL_GUIDANCE',
    "complexityNote" TEXT,
    "assessmentCriteria" TEXT,
    "origin" "ItemOrigin" NOT NULL DEFAULT 'TEACHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DifferentiatedTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMaterial" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "url" TEXT,
    "storageKey" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlanVersion" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonPlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "taskType" "AITaskType" NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT,
    "lessonPlanId" TEXT,
    "requestedById" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "promptVersion" TEXT,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "studentId" TEXT,
    "lessonPlanId" TEXT,
    "dimension" "ProfileDimension",
    "kind" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "rationale" TEXT,
    "evidenceRefs" JSONB,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
    "missingInfo" TEXT,
    "payload" JSONB,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherApproval" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "editedContent" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssessmentCriteriaToStudentEvidence" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssessmentCriteriaToStudentEvidence_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StudentEvidenceToStudentInterest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentEvidenceToStudentInterest_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StudentEvidenceToStudentStrength" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentEvidenceToStudentStrength_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StudentEvidenceToStudentLearningNeed" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentEvidenceToStudentLearningNeed_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StudentEvidenceToStudentLearningPreference" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentEvidenceToStudentLearningPreference_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StudentDevelopmentGoalToStudentEvidence" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentDevelopmentGoalToStudentEvidence_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CompetencyAssessmentToStudentEvidence" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompetencyAssessmentToStudentEvidence_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DifferentiatedTaskToLearningMaterial" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DifferentiatedTaskToLearningMaterial_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_name_key" ON "Subject"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Class_ownerId_idx" ON "Class"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_ownerId_name_schoolYear_key" ON "Class"("ownerId", "name", "schoolYear");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_classId_studentCode_key" ON "Student"("classId", "studentCode");

-- CreateIndex
CREATE INDEX "AssessmentCriteria_frameworkId_dimension_idx" ON "AssessmentCriteria"("frameworkId", "dimension");

-- CreateIndex
CREATE INDEX "StudentEvidence_classId_idx" ON "StudentEvidence"("classId");

-- CreateIndex
CREATE INDEX "StudentObservation_studentId_idx" ON "StudentObservation"("studentId");

-- CreateIndex
CREATE INDEX "AcademicResult_studentId_subjectId_idx" ON "AcademicResult"("studentId", "subjectId");

-- CreateIndex
CREATE INDEX "StudentInterest_studentId_idx" ON "StudentInterest"("studentId");

-- CreateIndex
CREATE INDEX "StudentStrength_studentId_idx" ON "StudentStrength"("studentId");

-- CreateIndex
CREATE INDEX "StudentLearningNeed_studentId_idx" ON "StudentLearningNeed"("studentId");

-- CreateIndex
CREATE INDEX "StudentLearningPreference_studentId_idx" ON "StudentLearningPreference"("studentId");

-- CreateIndex
CREATE INDEX "StudentDevelopmentGoal_studentId_idx" ON "StudentDevelopmentGoal"("studentId");

-- CreateIndex
CREATE INDEX "CompetencyAssessment_studentId_idx" ON "CompetencyAssessment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCompetencyProfile_studentId_key" ON "StudentCompetencyProfile"("studentId");

-- CreateIndex
CREATE INDEX "LessonPlan_teacherId_idx" ON "LessonPlan"("teacherId");

-- CreateIndex
CREATE INDEX "LessonPlan_classId_idx" ON "LessonPlan"("classId");

-- CreateIndex
CREATE INDEX "LessonActivity_lessonPlanId_idx" ON "LessonActivity"("lessonPlanId");

-- CreateIndex
CREATE INDEX "LearningGroup_lessonPlanId_idx" ON "LearningGroup"("lessonPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningGroupMember_groupId_studentId_key" ON "LearningGroupMember"("groupId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonPlanVersion_lessonPlanId_versionNumber_key" ON "LessonPlanVersion"("lessonPlanId", "versionNumber");

-- CreateIndex
CREATE INDEX "AIAnalysis_studentId_idx" ON "AIAnalysis"("studentId");

-- CreateIndex
CREATE INDEX "AIAnalysis_lessonPlanId_idx" ON "AIAnalysis"("lessonPlanId");

-- CreateIndex
CREATE INDEX "AIRecommendation_studentId_reviewStatus_idx" ON "AIRecommendation"("studentId", "reviewStatus");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "_AssessmentCriteriaToStudentEvidence_B_index" ON "_AssessmentCriteriaToStudentEvidence"("B");

-- CreateIndex
CREATE INDEX "_StudentEvidenceToStudentInterest_B_index" ON "_StudentEvidenceToStudentInterest"("B");

-- CreateIndex
CREATE INDEX "_StudentEvidenceToStudentStrength_B_index" ON "_StudentEvidenceToStudentStrength"("B");

-- CreateIndex
CREATE INDEX "_StudentEvidenceToStudentLearningNeed_B_index" ON "_StudentEvidenceToStudentLearningNeed"("B");

-- CreateIndex
CREATE INDEX "_StudentEvidenceToStudentLearningPreference_B_index" ON "_StudentEvidenceToStudentLearningPreference"("B");

-- CreateIndex
CREATE INDEX "_StudentDevelopmentGoalToStudentEvidence_B_index" ON "_StudentDevelopmentGoalToStudentEvidence"("B");

-- CreateIndex
CREATE INDEX "_CompetencyAssessmentToStudentEvidence_B_index" ON "_CompetencyAssessmentToStudentEvidence"("B");

-- CreateIndex
CREATE INDEX "_DifferentiatedTaskToLearningMaterial_B_index" ON "_DifferentiatedTaskToLearningMaterial"("B");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFramework" ADD CONSTRAINT "AssessmentFramework_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentFramework" ADD CONSTRAINT "AssessmentFramework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCriteria" ADD CONSTRAINT "AssessmentCriteria_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "AssessmentFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvidence" ADD CONSTRAINT "StudentEvidence_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvidence" ADD CONSTRAINT "StudentEvidence_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEvidence" ADD CONSTRAINT "StudentEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceStudentLink" ADD CONSTRAINT "EvidenceStudentLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceStudentLink" ADD CONSTRAINT "EvidenceStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservation" ADD CONSTRAINT "StudentObservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservation" ADD CONSTRAINT "StudentObservation_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentObservation" ADD CONSTRAINT "StudentObservation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicResult" ADD CONSTRAINT "AcademicResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicResult" ADD CONSTRAINT "AcademicResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicResult" ADD CONSTRAINT "AcademicResult_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "StudentEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInterest" ADD CONSTRAINT "StudentInterest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInterest" ADD CONSTRAINT "StudentInterest_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInterest" ADD CONSTRAINT "StudentInterest_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStrength" ADD CONSTRAINT "StudentStrength_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStrength" ADD CONSTRAINT "StudentStrength_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStrength" ADD CONSTRAINT "StudentStrength_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningNeed" ADD CONSTRAINT "StudentLearningNeed_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningNeed" ADD CONSTRAINT "StudentLearningNeed_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningNeed" ADD CONSTRAINT "StudentLearningNeed_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningPreference" ADD CONSTRAINT "StudentLearningPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningPreference" ADD CONSTRAINT "StudentLearningPreference_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLearningPreference" ADD CONSTRAINT "StudentLearningPreference_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDevelopmentGoal" ADD CONSTRAINT "StudentDevelopmentGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDevelopmentGoal" ADD CONSTRAINT "StudentDevelopmentGoal_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDevelopmentGoal" ADD CONSTRAINT "StudentDevelopmentGoal_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAssessment" ADD CONSTRAINT "CompetencyAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAssessment" ADD CONSTRAINT "CompetencyAssessment_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "AssessmentCriteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAssessment" ADD CONSTRAINT "CompetencyAssessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAssessment" ADD CONSTRAINT "CompetencyAssessment_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCompetencyProfile" ADD CONSTRAINT "StudentCompetencyProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGroup" ADD CONSTRAINT "LearningGroup_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGroup" ADD CONSTRAINT "LearningGroup_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "LessonActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGroupMember" ADD CONSTRAINT "LearningGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LearningGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGroupMember" ADD CONSTRAINT "LearningGroupMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifferentiatedTask" ADD CONSTRAINT "DifferentiatedTask_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "LessonActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifferentiatedTask" ADD CONSTRAINT "DifferentiatedTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "LearningGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifferentiatedTask" ADD CONSTRAINT "DifferentiatedTask_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMaterial" ADD CONSTRAINT "LearningMaterial_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlanVersion" ADD CONSTRAINT "LessonPlanVersion_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlanVersion" ADD CONSTRAINT "LessonPlanVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "AIAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApproval" ADD CONSTRAINT "TeacherApproval_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "AIRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApproval" ADD CONSTRAINT "TeacherApproval_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentCriteriaToStudentEvidence" ADD CONSTRAINT "_AssessmentCriteriaToStudentEvidence_A_fkey" FOREIGN KEY ("A") REFERENCES "AssessmentCriteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentCriteriaToStudentEvidence" ADD CONSTRAINT "_AssessmentCriteriaToStudentEvidence_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentInterest" ADD CONSTRAINT "_StudentEvidenceToStudentInterest_A_fkey" FOREIGN KEY ("A") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentInterest" ADD CONSTRAINT "_StudentEvidenceToStudentInterest_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentInterest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentStrength" ADD CONSTRAINT "_StudentEvidenceToStudentStrength_A_fkey" FOREIGN KEY ("A") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentStrength" ADD CONSTRAINT "_StudentEvidenceToStudentStrength_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentStrength"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentLearningNeed" ADD CONSTRAINT "_StudentEvidenceToStudentLearningNeed_A_fkey" FOREIGN KEY ("A") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentLearningNeed" ADD CONSTRAINT "_StudentEvidenceToStudentLearningNeed_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentLearningNeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentLearningPreference" ADD CONSTRAINT "_StudentEvidenceToStudentLearningPreference_A_fkey" FOREIGN KEY ("A") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentEvidenceToStudentLearningPreference" ADD CONSTRAINT "_StudentEvidenceToStudentLearningPreference_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentLearningPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentDevelopmentGoalToStudentEvidence" ADD CONSTRAINT "_StudentDevelopmentGoalToStudentEvidence_A_fkey" FOREIGN KEY ("A") REFERENCES "StudentDevelopmentGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentDevelopmentGoalToStudentEvidence" ADD CONSTRAINT "_StudentDevelopmentGoalToStudentEvidence_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetencyAssessmentToStudentEvidence" ADD CONSTRAINT "_CompetencyAssessmentToStudentEvidence_A_fkey" FOREIGN KEY ("A") REFERENCES "CompetencyAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompetencyAssessmentToStudentEvidence" ADD CONSTRAINT "_CompetencyAssessmentToStudentEvidence_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DifferentiatedTaskToLearningMaterial" ADD CONSTRAINT "_DifferentiatedTaskToLearningMaterial_A_fkey" FOREIGN KEY ("A") REFERENCES "DifferentiatedTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DifferentiatedTaskToLearningMaterial" ADD CONSTRAINT "_DifferentiatedTaskToLearningMaterial_B_fkey" FOREIGN KEY ("B") REFERENCES "LearningMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
