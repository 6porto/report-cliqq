# Deploy via Docker (VPS Hostinger)

Três containers:

| Serviço   | Imagem                  | O que faz                                                  |
| --------- | ----------------------- | ---------------------------------------------------------- |
| `db`      | `postgres:16-alpine`    | PostgreSQL no volume `pgdados`, só na rede interna do compose |
| `backend` | `rollout-cliqq-backend` | NestJS na porta 3333, conecta no `db` via `DATABASE_URL`     |
| `web`     | `rollout-cliqq-web`     | nginx servindo o build do Vite e proxiando `/api` → backend |
| `caddy`   | `caddy:2-alpine`        | Opcional (perfil `tls`): HTTPS automático via Let's Encrypt |

O frontend nunca fala com o backend direto: o nginx proxia `/api`, então é tudo
mesma origem e não existe problema de CORS.

O banco fica no volume Docker `pgdados`, fora da imagem — rebuild não apaga o
andamento. O Postgres não publica porta no host: só o `backend` alcança ele.

---

## 1. Preparar a VPS

SSH na VPS (painel Hostinger → VPS → detalhes de acesso):

```bash
ssh root@SEU_IP
```

Instalar Docker (Ubuntu/Debian):

```bash
curl -fsSL https://get.docker.com | sh
docker compose version
```

Se a imagem da VPS já veio com o template "Docker" da Hostinger, pule esse passo.

## 2. Enviar o código

Com Git (recomendado — o repo ainda não é git, então inicialize antes na sua máquina):

```powershell
# na sua máquina, dentro de c:\dev\QQ\rollout-cliqq
git init
git add .
git commit -m "chore: setup docker"
git remote add origin <url-do-repo>
git push -u origin master
```

```bash
# na VPS
mkdir -p /opt && cd /opt
git clone <url-do-repo> rollout-cliqq
cd rollout-cliqq
```

Sem Git, copie direto da sua máquina:

```powershell
scp -r c:\dev\QQ\rollout-cliqq root@SEU_IP:/opt/rollout-cliqq
```

## 3. Configurar variáveis

```bash
cd /opt/rollout-cliqq
cp .env.example .env
nano .env
```

Obrigatório: `POSTGRES_PASSWORD` — o compose se recusa a subir sem ela. Também
revise `PORTA_WEB` e, se for usar domínio com HTTPS, `DOMINIO`.

A senha do Postgres só é lida na primeira subida (quando o volume `pgdados` é
criado). Trocar depois exige `ALTER USER` dentro do banco, não basta editar o
`.env`.

## 4. Subir

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

O backend roda `prisma migrate deploy` e o seed das 587 lojas no start. O seed é
upsert por código: preserva status, datas e ondas ajustadas manualmente.

Acesse: `http://SEU_IP:8080`

## 5. Firewall

```bash
ufw allow OpenSSH
ufw allow 8080/tcp      # só enquanto acessar por IP:porta
ufw enable
```

## 6. HTTPS com domínio (opcional, recomendado)

Aponte um registro A do seu domínio para o IP da VPS. Depois:

```bash
ufw allow 80/tcp && ufw allow 443/tcp
ufw delete allow 8080/tcp
```

No `.env`, preencha `DOMINIO=rollout.seudominio.com.br` e
`PORTA_WEB=127.0.0.1:8080` (fecha o acesso direto, deixa só o Caddy na frente).

```bash
docker compose --profile tls up -d
```

O Caddy emite e renova o certificado sozinho. Acesse `https://rollout.seudominio.com.br`.

---

## Operação

Atualizar depois de mudar o código:

```bash
cd /opt/rollout-cliqq
git pull
docker compose up -d --build
```

Recarregar o cadastro depois de editar `backend/prisma/dados/lojas.tsv`:

```bash
docker compose exec backend npm run db:seed
```

Backup do banco:

```bash
docker compose exec -T db pg_dump -U rollout -d rollout -Fc > ./rollout-$(date +%F).dump
```

Restaurar (apaga o conteúdo atual):

```bash
docker compose stop backend
docker compose exec -T db pg_restore -U rollout -d rollout --clean --if-exists < ./rollout-2026-08-21.dump
docker compose start backend
```

Logs e reinício:

```bash
docker compose logs -f
docker compose restart backend
```

## Migrar o banco SQLite que já está em produção

Só precisa ser feito uma vez, na virada para o Postgres. O volume antigo
(`dados`) continua intacto até você removê-lo, então dá para repetir se der erro.

```bash
cd /opt/rollout-cliqq

# 1. Copie o SQLite do volume antigo para o host, com a stack antiga ainda parada
docker compose down
docker run --rm -v rollout-cliqq_dados:/dados -v "$PWD":/saida alpine \
  cp /dados/rollout.db /saida/rollout-antigo.db

# 2. Atualize o código, configure POSTGRES_PASSWORD no .env e suba só o banco
git pull
docker compose up -d db

# 3. Suba o backend com o seed desligado — ele cria as tabelas vazias
SEED_ON_START=false docker compose up -d --build backend

# 4. Importe os dados do SQLite
docker compose cp ./rollout-antigo.db backend:/tmp/rollout-antigo.db
docker compose exec backend npm run db:migrar-do-sqlite -- /tmp/rollout-antigo.db

# 5. Suba o resto normalmente
docker compose up -d --build
```

O script recusa rodar se o Postgres já tiver filiais — importe sempre num banco
recém-criado. Depois de conferir a tela, o volume antigo pode sair:
`docker volume rm rollout-cliqq_dados`.

## Notas

- O `db` aceita mais de uma réplica do `backend`, mas o seed roda no start de
  cada uma: com várias réplicas, deixe `SEED_ON_START=false` e rode o seed à mão.
- A imagem do backend carrega as devDependencies porque `prisma` (migrations) e
  `tsx` (seed) rodam em runtime. É proposital.
- `SEED_ON_START=false` no `.env` desliga o seed automático a cada restart.
