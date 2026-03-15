-- CreateTable: Dataset
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

-- AddColumn: datasetId to VectorRecord
ALTER TABLE "VectorRecord" ADD COLUMN "datasetId" TEXT REFERENCES "Dataset" ("id") ON DELETE SET NULL;

-- CreateIndex
CREATE INDEX "VectorRecord_datasetId_idx" ON "VectorRecord"("datasetId");

-- Insert Default dataset for existing records
INSERT INTO "Dataset" ("id", "name", "description", "importedAt")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default',
    'Auto-created dataset for records that existed before the Datasets feature was introduced.',
    datetime('now')
);

-- Migrate all existing records into the Default dataset
UPDATE "VectorRecord" SET "datasetId" = '00000000-0000-0000-0000-000000000001' WHERE "datasetId" IS NULL;
