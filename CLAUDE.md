# rollout-cliqq

Report do rollout do CliQQ para 600 filiais.

## Stack e comandos

- Monorepo npm workspaces: `backend` (NestJS 11 + Prisma + PostgreSQL 16), `frontend` (React 19 + Vite + TanStack Query + Recharts).
- `npm run db:up` — sobe o Postgres de desenvolvimento (`docker-compose.dev.yml`, porta 5433); `npm run db:down` derruba.
- `npm run dev` — sobe backend (:3333) e frontend (:5173, proxy `/api`).
- `npm run db:seed --workspace backend` — carrega/atualiza as 587 lojas reais de `backend/prisma/dados/lojas.tsv` (upsert por código; preserva status e datas).
- `npm run db:reset --workspace backend` — recria o banco do zero e apaga o andamento; só quando pedido.
- `npm run test --workspace backend` — Jest.
- Após mudar `prisma/schema.prisma`: `npm run db:migrate --workspace backend`.

## Convenções

- Nomes de código e comentários em PT-BR.
- Backend: um módulo Nest por contexto (`filiais`, `rollout`, `relatorio`); regra em service, DTO com class-validator, Prisma isolado em `PrismaService`.
- Toda mudança de status passa por `RolloutService.atualizarStatus` — ela grava `EventoRollout` e ajusta `dataInicio`/`dataConclusao`. O `AtualizarFilialDto` omite `status` de propósito, então o CRUD rejeita a tentativa com 400.
- Edição completa da loja fica em `frontend/src/componentes/FormularioLoja.tsx`: salva o cadastro via `PATCH /filiais/:id` e, se o status mudou, dispara o endpoint de rollout em seguida.
- Status válidos ficam em `backend/src/comum/status-rollout.ts` e espelhados em `frontend/src/api/tipos.ts`.
- `cidade`, `uf` e `regional` são opcionais (45 lojas vieram com `#N/D`); relatórios agrupam esses casos como "Não informado".
- Fonte do cadastro é o TSV em `backend/prisma/dados/lojas.tsv` — alterar lá e rodar o seed, não editar linha a linha no banco.
- O histórico de migrations começa em `20260821120000_inicial_postgres`: as migrations do SQLite foram consolidadas nesse baseline e não existem mais.
- Busca textual usa `mode: 'insensitive'` — no Postgres o `contains` é sensível a maiúsculas, ao contrário do SQLite.
- Priorização: as demandas são as issues abertas de `mercantil/mercantil` com `system::cliqq-centralizado` e `type::crm` ou `type::melhoria`. O botão "Atualizar do GitLab" chama `POST /priorizacao/sincronizar`, que faz uma busca por tipo (a API só faz AND de labels), une por `iid` e grava em `Demanda`. Filtro e mapeamento ficam em `backend/src/comum/issues-gitlab.ts`; o cliente HTTP em `backend/src/gitlab/`.
- Issue que sai do filtro vira `Demanda.ativa = false` e some da tela — a `RespostaPriorizacao` **nunca** é apagada, então ela reaparece intacta se a issue voltar. `GET /priorizacao` só devolve as ativas.
- A sincronização exige `GITLAB_TOKEN` (escopo `read_api`) e `GITLAB_URL` no `.env`; sem token o endpoint responde 503 com a mensagem que a tela exibe.
- Versão: a aba lista as milestones de `mercantil/mercantil` cujo título começa com `feature/` ou `fix/` (case-insensitive) e, ao selecionar uma, as issues vinculadas. Tudo é lido ao vivo do GitLab por `GET /versao/milestones` e `GET /versao/milestones/:id/issues` — não há tabela no banco. Filtro, mapeamento e ordenação ficam em `backend/src/comum/versao-gitlab.ts`, espelhados em `frontend/src/dominio/versao.ts`. O endpoint de issues usa o `id` global da milestone, não o `iid`.
- A escala das 5 perguntas fica em `backend/src/comum/priorizacao.ts` e é espelhada em `frontend/src/dominio/priorizacao.ts`. Uma resposta por demanda (upsert por `demandaId` — vale sempre a última).
- As 4 perguntas de valor pontuam 5/10/20; o esforço tem 7 níveis próprios (20 a 2, de "1 dia" a "mais de 2 meses"), com `dias` em dias úteis. Mexer na pontuação do esforço exige migração de dados das respostas já gravadas (a migration `20260807214429_reescala_esforco`, que fazia isso no SQLite, foi consolidada no baseline do Postgres).
- Regra das ondas fica em `backend/src/comum/ondas.ts` (Onda 1: 40+ op/dia, Onda 2: 20–39, Onda 3: < 20) e é aplicada no seed apenas para lojas sem onda; a lista espelhada no front está em `frontend/src/dominio/ondas.ts`.

## Gráficos

- Cores vêm de CSS custom properties em `frontend/src/estilos/global.css` (light + dark) e do mapa em `frontend/src/tema/cores.ts`.
- Ordem da pilha de status é fixa (`ORDEM_PILHA_STATUS`: concluído → em operação → em adaptação → em treinamento → não iniciado → bloqueado): garante separação para daltônicos; não reordenar sem revalidar a paleta.
- `STATUS_EM_IMPLANTACAO` agrupa os três estados intermediários — usar essa constante em vez de comparar status um a um.
- Status sempre com ícone + rótulo, nunca só cor. Um eixo por gráfico — nunca eixo duplo.
- Na matriz de priorização o eixo X é o tempo de desenvolvimento (crescente para a direita) e o Y é a soma das 4 primeiras perguntas: prioridade alta = alto e à esquerda. O afastamento de pontos coincidentes acontece só no eixo X, que é categórico, para o Y nunca mentir sobre a pontuação.
