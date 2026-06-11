-- Drop indices
DROP INDEX IF EXISTS "VectorRecord_category_status_idx";
DROP INDEX IF EXISTS "VectorRecord_createdById_idx";
DROP INDEX IF EXISTS "VectorRecord_createdAt_idx";
DROP INDEX IF EXISTS "VectorRecord_datasetId_idx";
DROP INDEX IF EXISTS "Dataset_importedById_idx";

-- Drop tables
DROP TABLE IF EXISTS "VectorRecord";
DROP TABLE IF EXISTS "Dataset";
