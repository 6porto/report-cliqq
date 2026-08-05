#!/bin/sh
set -e

echo "Aplicando migrations em ${DATABASE_URL}"
npx prisma migrate deploy

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "Rodando seed das lojas"
  npm run db:seed
fi

exec node dist/main.js
