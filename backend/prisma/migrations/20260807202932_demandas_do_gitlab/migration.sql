-- CreateTable
CREATE TABLE "Demanda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT,
    "url" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "sincronizadaEm" DATETIME NOT NULL,
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Demanda_ativa_idx" ON "Demanda"("ativa");
