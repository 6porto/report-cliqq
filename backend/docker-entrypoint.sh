#!/bin/sh
set -e

# Senha com @ : / # ? quebraria a URL se fosse interpolada crua no compose.
if [ -z "${DATABASE_URL}" ]; then
  if [ -z "${POSTGRES_PASSWORD}" ]; then
    echo "Defina DATABASE_URL ou POSTGRES_PASSWORD"
    exit 1
  fi

  escapar() {
    node -e 'process.stdout.write(encodeURIComponent(process.argv[1] || ""))' "$1"
  }

  DATABASE_URL="postgresql://$(escapar "${POSTGRES_USER:-rollout}"):$(escapar "${POSTGRES_PASSWORD}")@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-rollout}?schema=public"
  export DATABASE_URL
fi

# `docker compose exec` não herda o que o entrypoint exporta, então a URL fica
# gravada aqui: é o que faz `db:seed` e `db:migrar-do-sqlite` funcionarem à mão.
printf 'DATABASE_URL="%s"\n' "${DATABASE_URL}" > /app/backend/.env

echo "Aplicando migrations no Postgres"

tentativa=1
while true; do
  if npx prisma migrate deploy > /tmp/migrate.log 2>&1; then
    cat /tmp/migrate.log
    break
  fi

  cat /tmp/migrate.log

  # URL malformada não melhora com nova tentativa.
  if grep -q 'P1013' /tmp/migrate.log; then
    echo "DATABASE_URL inválida — confira POSTGRES_PASSWORD, POSTGRES_HOST e POSTGRES_PORT"
    exit 1
  fi

  if [ "$tentativa" -ge 10 ]; then
    echo "Banco não respondeu após $tentativa tentativas"
    exit 1
  fi

  echo "Banco indisponível, nova tentativa em 3s ($tentativa/10)"
  tentativa=$((tentativa + 1))
  sleep 3
done

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "Rodando seed das lojas"
  npm run db:seed
fi

exec node dist/main.js
