-- Adiciona em duas etapas: as semanas já lançadas herdam o P95 como P99,
-- que é o menor valor possível sem violar p95 <= p99.
ALTER TABLE "LatenciaSemanal" ADD COLUMN "p99" INTEGER;

UPDATE "LatenciaSemanal" SET "p99" = "p95" WHERE "p99" IS NULL;

ALTER TABLE "LatenciaSemanal" ALTER COLUMN "p99" SET NOT NULL;
