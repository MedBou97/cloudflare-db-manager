-- CreateTable
CREATE TABLE "VectorRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "numericValue" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "vector" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "VectorRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VectorRecord_category_status_idx" ON "VectorRecord"("category", "status");

-- CreateIndex
CREATE INDEX "VectorRecord_createdById_idx" ON "VectorRecord"("createdById");

-- CreateIndex
CREATE INDEX "VectorRecord_createdAt_idx" ON "VectorRecord"("createdAt");
