-- CreateTable
CREATE TABLE "RespostaPriorizacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "demandaId" INTEGER NOT NULL,
    "beneficiados" INTEGER,
    "tipoDeGanho" INTEGER,
    "frequencia" INTEGER,
    "riscoDeAdiar" INTEGER,
    "esforco" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RespostaPriorizacao_demandaId_key" ON "RespostaPriorizacao"("demandaId");
