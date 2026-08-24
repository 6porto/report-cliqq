-- Renomeia em vez de recriar: o lançamento passou a representar a média
-- semanal, mas os registros já feitos continuam válidos.
ALTER TABLE "PedidoDiario" RENAME TO "MediaOperacoesSemanal";
ALTER TABLE "MediaOperacoesSemanal" RENAME COLUMN "data" TO "semana";
ALTER TABLE "MediaOperacoesSemanal" RENAME COLUMN "quantidade" TO "mediaOperacoes";

ALTER TABLE "MediaOperacoesSemanal" RENAME CONSTRAINT "PedidoDiario_pkey" TO "MediaOperacoesSemanal_pkey";
ALTER INDEX "PedidoDiario_data_key" RENAME TO "MediaOperacoesSemanal_semana_key";
ALTER SEQUENCE "PedidoDiario_id_seq" RENAME TO "MediaOperacoesSemanal_id_seq";
