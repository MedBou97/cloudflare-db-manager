-- Drop indices first (SQLite drops them with the table, but being explicit)
DROP INDEX IF EXISTS "VectorRecord_category_status_idx";
DROP INDEX IF EXISTS "VectorRecord_createdById_idx";
DROP INDEX IF EXISTS "VectorRecord_createdAt_idx";
DROP INDEX IF EXISTS "VectorRecord_datasetId_idx";
DROP INDEX IF EXISTS "Dataset_importedById_idx";

-- Drop tables (VectorRecord first due to FK reference to Dataset)
DROP TABLE IF EXISTS "VectorRecord";
DROP TABLE IF EXISTS "Dataset";
