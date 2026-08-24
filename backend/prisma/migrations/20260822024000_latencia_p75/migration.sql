-- Mesma estratégia do P99: as semanas já lançadas herdam o P50 como P75,
-- que é o menor valor possível sem violar p50 <= p75.
ALTER TABLE "LatenciaSemanal" ADD COLUMN "p75" INTEGER;

UPDATE "LatenciaSemanal" SET "p75" = "p50" WHERE "p75" IS NULL;

ALTER TABLE "LatenciaSemanal" ALTER COLUMN "p75" SET NOT NULL;
