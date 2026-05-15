-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN "title" TEXT;
ALTER TABLE "Classroom" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Classroom" ADD COLUMN "userId" TEXT;
ALTER TABLE "Classroom" ADD COLUMN "ltiContextId" TEXT;
ALTER TABLE "Classroom" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Classroom" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Classroom_userId_idx" ON "Classroom"("userId");
CREATE INDEX "Classroom_ltiContextId_idx" ON "Classroom"("ltiContextId");
