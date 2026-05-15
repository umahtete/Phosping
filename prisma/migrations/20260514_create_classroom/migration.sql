-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "stage" JSONB NOT NULL,
    "scenes" JSONB NOT NULL,
    "outlines" JSONB NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);
