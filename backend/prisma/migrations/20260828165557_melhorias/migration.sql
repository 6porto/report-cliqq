-- CreateTable
CREATE TABLE "Melhoria" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataPrevista" TIMESTAMP(3),
    "subiuEmProducao" BOOLEAN NOT NULL DEFAULT false,
    "dataSubida" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Melhoria_pkey" PRIMARY KEY ("id")
);
