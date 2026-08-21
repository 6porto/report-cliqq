#!/bin/sh
set -e

echo "Aplicando migrations no Postgres"

tentativa=1
until npx prisma migrate deploy; do
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
