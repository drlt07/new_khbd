-- CreateTable
CREATE TABLE "KnowledgeCollection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "subjectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "volume" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "pageCount" INTEGER,
    "bookPageStart" INTEGER,
    "bookPageEnd" INTEGER,
    "charCount" INTEGER,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "outline" JSONB,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "processingError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "pdfPage" INTEGER NOT NULL,
    "bookPage" INTEGER,
    "lessonLabel" TEXT,
    "lessonTitle" TEXT,
    "heading" TEXT,
    "content" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCollection_ownerId_name_key" ON "KnowledgeCollection"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeDocument_collectionId_checksum_key" ON "KnowledgeDocument"("collectionId", "checksum");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_collectionId_lessonLabel_idx" ON "KnowledgeChunk"("collectionId", "lessonLabel");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_documentId_chunkIndex_key" ON "KnowledgeChunk"("documentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "KnowledgeCollection" ADD CONSTRAINT "KnowledgeCollection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCollection" ADD CONSTRAINT "KnowledgeCollection_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "KnowledgeCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Chỉ mục full-text (cấu hình 'simple' trên văn bản đã bỏ dấu) cho truy xuất đoạn tài liệu
CREATE INDEX "KnowledgeChunk_search_idx" ON "KnowledgeChunk" USING GIN (to_tsvector('simple', "searchText"));
