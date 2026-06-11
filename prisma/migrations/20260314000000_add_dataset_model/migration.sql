-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedById" TEXT,
    CONSTRAINT "Dataset_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Dataset_importedById_idx" ON "Dataset"("importedById");

-- AlterTable
ALTER TABLE "VectorRecord" ADD COLUMN "datasetId" TEXT REFERENCES "Dataset" ("id") ON DELETE SET NULL;

-- CreateIndex
CREATE INDEX "VectorRecord_datasetId_idx" ON "VectorRecord"("datasetId");
