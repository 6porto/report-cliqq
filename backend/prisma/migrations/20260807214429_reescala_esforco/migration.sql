-- A escala de esforço passou de 3 para 7 níveis. As notas antigas viram o nível
-- equivalente na escala nova; sem isso a nota 10 sairia da escala e a demanda
-- voltaria a contar como incompleta.
-- 20 "Alguns dias"      -> 17 "2 dias"
-- 10 "1 semana ou mais" -> 14 "1 semana"
--  5 "1 mês ou mais"    ->  8 "1 mês"
UPDATE "RespostaPriorizacao" SET "esforco" = 17 WHERE "esforco" = 20;
UPDATE "RespostaPriorizacao" SET "esforco" = 14 WHERE "esforco" = 10;
UPDATE "RespostaPriorizacao" SET "esforco" = 8 WHERE "esforco" = 5;
