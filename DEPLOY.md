# Deploy via Docker (VPS Hostinger)

Dois containers:

| Serviço   | Imagem                  | O que faz                                                  |
| --------- | ----------------------- | ---------------------------------------------------------- |
| `backend` | `rollout-cliqq-backend` | NestJS na porta 3333, SQLite no volume `dados` (`/dados/rollout.db`) |
| `web`     | `rollout-cliqq-web`     | nginx servindo o build do Vite e proxiando `/api` → backend |
| `caddy`   | `caddy:2-alpine`        | Opcional (perfil `tls`): HTTPS automático via Let's Encrypt |

O frontend nunca fala com o backend direto: o nginx proxia `/api`, então é tudo
mesma origem e não existe problema de CORS.

O banco fica no volume Docker `dados`, fora da imagem — rebuild não apaga o andamento.

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

Mínimo a revisar: `PORTA_WEB` e, se for usar domínio com HTTPS, `DOMINIO`.

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
docker compose cp backend:/dados/rollout.db ./rollout-$(date +%F).db
```

Restaurar:

```bash
docker compose stop backend
docker compose cp ./rollout-2026-08-05.db backend:/dados/rollout.db
docker compose start backend
```

Logs e reinício:

```bash
docker compose logs -f
docker compose restart backend
```

## Notas

- SQLite não escala horizontalmente: mantenha **uma** réplica do `backend`.
- A imagem do backend carrega as devDependencies porque `prisma` (migrations) e
  `tsx` (seed) rodam em runtime. É proposital.
- `SEED_ON_START=false` no `.env` desliga o seed automático a cada restart.
