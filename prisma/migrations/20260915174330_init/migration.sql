-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "analysisSource" TEXT NOT NULL,
    "scaleInputs" JSONB NOT NULL,
    "requirements" JSONB NOT NULL,
    "architecture" JSONB NOT NULL,
    "databaseSchema" JSONB NOT NULL,
    "apiEndpoints" JSONB NOT NULL,
    "roadmap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);
