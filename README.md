# Rollout CliQQ

Ferramenta de report do rollout do CliQQ nas lojas: atualização do andamento
por loja e visualização da evolução em gráficos.

Base carregada: **587 lojas reais** (RS 260, PR 162, SC 85, SP 19, MS 16, 45 sem
UF/cidade informadas), somando 12.817 operações/dia (média dos últimos 90 dias).
Fonte: `backend/prisma/dados/lojas.tsv` — editar esse arquivo e rodar o seed
atualiza o cadastro sem apagar o andamento já registrado.

## Stack

- **backend/** — NestJS 11 + Prisma + PostgreSQL 16
- **frontend/** — React 19 + Vite + TanStack Query + Recharts
- Monorepo npm workspaces

O Postgres de desenvolvimento sobe em container (`docker-compose.dev.yml`); a
aplicação continua rodando fora do Docker.

## Rodar

```bash
npm install
cp backend/.env.example backend/.env     # DATABASE_URL aponta para o Postgres local
npm run db:up                            # sobe o Postgres de desenvolvimento (:5433)
npm run db:migrate --workspace backend   # cria/atualiza o banco
npm run db:seed --workspace backend      # carrega/atualiza as lojas do TSV (não apaga andamento)
npm run dev                              # backend :3333 e frontend :5173
```

`npm run db:down` derruba o container do banco (o volume `pgdados_dev` fica).

`npm run db:reset --workspace backend` recria o banco do zero — **apaga todo o
andamento registrado**. Use só para começar de novo.

O Vite faz proxy de `/api` para `http://localhost:3333`.

## Modelo de dados

| Modelo | Papel |
| --- | --- |
| `Filial` | cadastro (código, cidade/UF, `mediaOperacoes90Dias`, regional, onda, observação) + status atual e datas prevista/início/conclusão |
| `EventoRollout` | histórico de cada mudança de status (quem, quando, observação) |
| `MetaRollout` | curva de meta acumulada por data — base da linha "meta" no gráfico |

Status (`backend/src/comum/status-rollout.ts`): `NAO_INICIADO`, `EM_TREINAMENTO`,
`EM_ADAPTACAO`, `EM_OPERACAO`, `CONCLUIDO`, `BLOQUEADO`.

Entrar em qualquer um dos três estados de implantação (treinamento, adaptação,
operação) carimba `dataInicio`; `CONCLUIDO` carimba `dataConclusao`. Só
`CONCLUIDO` conta como cobertura nos relatórios.

## Ondas

Definidas pela média de operações dos últimos 90 dias
(`backend/src/comum/ondas.ts`), aplicadas pelo seed:

| Onda | Regra | Lojas | Operações/dia | Acumulado ao fim da onda |
| --- | --- | ---: | ---: | ---: |
| Onda 1 | 40 ou mais | 39 | 2.168 | 16,9% — 2.168/dia |
| Onda 2 | 20 a 39 | 226 | 6.108 | 64,6% — 8.276/dia |
| Onda 3 | menos de 20 | 322 | 4.541 | 100% — 12.817/dia |

O seed só calcula a onda de quem ainda não tem uma; onda trocada na mão pelo
formulário é preservada nas próximas cargas.

## API (`/api`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/filiais` | lista paginada com filtros `status`, `regional`, `uf`, `onda`, `busca` |
| GET | `/filiais/filtros` | valores distintos para os selects |
| GET | `/filiais/:id` | filial + histórico de eventos |
| POST | `/filiais` | cria filial |
| POST | `/filiais/importar` | carga em lote (upsert por `codigo`) |
| PATCH | `/filiais/:id` | edita cadastro |
| DELETE | `/filiais/:id` | remove filial |
| PATCH | `/rollout/filiais/:id/status` | muda status, grava evento e ajusta datas |
| GET | `/rollout/eventos` | timeline de mudanças |
| GET/PUT | `/rollout/metas` | lê/define a curva de meta acumulada |
| GET | `/relatorio/resumo` | KPIs: total, concluídas, %, atrasadas, ritmo 7 dias, % de operações cobertas |
| GET | `/relatorio/evolucao?granularidade=semana\|mes` | série acumulada realizado x meta |
| GET | `/relatorio/uf` | status por UF |
| GET | `/relatorio/cobertura-ondas` | % acumulado das operações da rede previsto ao fim de cada onda (e o já concluído) |
| GET | `/relatorio/porte` | status por faixa de média de operações |
| GET | `/relatorio/regional` | status por regional (quando informada) |
| GET | `/relatorio/ondas` | status por onda |

## Report (frontend)

- **Report** (andamento real): KPIs (inclui % de operações cobertas), evolução acumulada x meta, situação das lojas, status por UF e por onda.
- **Plano** (projeções): distribuição das operações no dia (por hora, com operações/minuto), projeção de crescimento (curvas de +10% a +50% por semana) e cobertura de operações por onda.
- **Lojas**: tabela filtrável (busca, status, UF, onda) só de leitura, com botão **Editar** em cada linha. O formulário do modal traz todos os campos da loja (código, nome, cidade, UF, regional, onda, média de operações, observação, datas e status) e permite excluir a loja. A mudança de status acontece apenas por ali.
  - O `PATCH /filiais/:id` não aceita `status` (retorna 400): a mudança sempre passa por `/rollout/filiais/:id/status` para gravar o evento. O formulário faz isso automaticamente e usa a data de conclusão/início informada.
  - Campos enviados como `null` são limpos; código duplicado retorna 409.

Cores seguem a paleta de status validada para daltonismo (ordem da pilha fixa:
concluído → em andamento → planejado → não iniciado → bloqueado); status sempre
acompanha ícone + rótulo, nunca só cor.

## Testes

```bash
npm run test --workspace backend
```
