-- CreateTable
CREATE TABLE "LatenciaSemanal" (
    "id" SERIAL NOT NULL,
    "semana" TIMESTAMP(3) NOT NULL,
    "p50" INTEGER NOT NULL,
    "p95" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LatenciaSemanal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LatenciaSemanal_semana_key" ON "LatenciaSemanal"("semana");
