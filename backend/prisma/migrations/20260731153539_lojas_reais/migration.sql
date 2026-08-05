-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Filial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "uf" TEXT,
    "regional" TEXT,
    "onda" TEXT,
    "mediaOperacoes90Dias" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NAO_INICIADO',
    "dataPrevista" DATETIME,
    "dataInicio" DATETIME,
    "dataConclusao" DATETIME,
    "responsavel" TEXT,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_Filial" ("atualizadoEm", "cidade", "codigo", "criadoEm", "dataConclusao", "dataInicio", "dataPrevista", "id", "nome", "observacao", "onda", "regional", "responsavel", "status", "uf") SELECT "atualizadoEm", "cidade", "codigo", "criadoEm", "dataConclusao", "dataInicio", "dataPrevista", "id", "nome", "observacao", "onda", "regional", "responsavel", "status", "uf" FROM "Filial";
DROP TABLE "Filial";
ALTER TABLE "new_Filial" RENAME TO "Filial";
CREATE UNIQUE INDEX "Filial_codigo_key" ON "Filial"("codigo");
CREATE INDEX "Filial_status_idx" ON "Filial"("status");
CREATE INDEX "Filial_uf_idx" ON "Filial"("uf");
CREATE INDEX "Filial_regional_idx" ON "Filial"("regional");
CREATE INDEX "Filial_onda_idx" ON "Filial"("onda");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
