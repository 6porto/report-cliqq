-- CreateTable
CREATE TABLE "Filial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "regional" TEXT NOT NULL,
    "onda" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NAO_INICIADO',
    "dataPrevista" DATETIME,
    "dataInicio" DATETIME,
    "dataConclusao" DATETIME,
    "responsavel" TEXT,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventoRollout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filialId" INTEGER NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT NOT NULL,
    "observacao" TEXT,
    "autor" TEXT,
    "registradoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoRollout_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaRollout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" DATETIME NOT NULL,
    "quantidadeAcumulada" INTEGER NOT NULL,
    "descricao" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Filial_codigo_key" ON "Filial"("codigo");

-- CreateIndex
CREATE INDEX "Filial_status_idx" ON "Filial"("status");

-- CreateIndex
CREATE INDEX "Filial_regional_idx" ON "Filial"("regional");

-- CreateIndex
CREATE INDEX "Filial_onda_idx" ON "Filial"("onda");

-- CreateIndex
CREATE INDEX "EventoRollout_filialId_idx" ON "EventoRollout"("filialId");

-- CreateIndex
CREATE INDEX "EventoRollout_registradoEm_idx" ON "EventoRollout"("registradoEm");

-- CreateIndex
CREATE UNIQUE INDEX "MetaRollout_data_key" ON "MetaRollout"("data");
