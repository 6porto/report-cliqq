-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Filial" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "cidade" TEXT,
    "uf" TEXT,
    "regional" TEXT,
    "onda" TEXT,
    "mediaOperacoes90Dias" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NAO_INICIADO',
    "dataPrevista" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Filial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoRollout" (
    "id" SERIAL NOT NULL,
    "filialId" INTEGER NOT NULL,
    "statusAnterior" TEXT,
    "statusNovo" TEXT NOT NULL,
    "observacao" TEXT,
    "autor" TEXT,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoRollout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetaRollout" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "quantidadeAcumulada" INTEGER NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "MetaRollout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demanda" (
    "id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT,
    "url" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "sincronizadaEm" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaPriorizacao" (
    "id" SERIAL NOT NULL,
    "demandaId" INTEGER NOT NULL,
    "beneficiados" INTEGER,
    "tipoDeGanho" INTEGER,
    "frequencia" INTEGER,
    "riscoDeAdiar" INTEGER,
    "esforco" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespostaPriorizacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Filial_codigo_key" ON "Filial"("codigo");

-- CreateIndex
CREATE INDEX "Filial_status_idx" ON "Filial"("status");

-- CreateIndex
CREATE INDEX "Filial_uf_idx" ON "Filial"("uf");

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

-- CreateIndex
CREATE INDEX "Demanda_ativa_idx" ON "Demanda"("ativa");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaPriorizacao_demandaId_key" ON "RespostaPriorizacao"("demandaId");

-- AddForeignKey
ALTER TABLE "EventoRollout" ADD CONSTRAINT "EventoRollout_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

