-- CreateTable
CREATE TABLE "DatabaseConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "engine" TEXT NOT NULL DEFAULT 'postgres',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 5432,
    "databaseName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "sslMode" TEXT NOT NULL DEFAULT 'require',
    "encryptedConfig" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastTestedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "DatabaseConnection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DatabaseConnection_createdById_status_idx" ON "DatabaseConnection"("createdById", "status");

-- CreateIndex
CREATE INDEX "DatabaseConnection_engine_idx" ON "DatabaseConnection"("engine");

-- CreateIndex
CREATE INDEX "DatabaseConnection_createdAt_idx" ON "DatabaseConnection"("createdAt");
