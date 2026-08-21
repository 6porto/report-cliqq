import { existsSync } from 'node:fs';
import { join } from 'node:path';

// `docker compose exec` não herda o que o entrypoint exporta, e o Prisma Client
// não lê .env sozinho. Sem isto, seed e importação falham dentro do container.
const arquivo = join(__dirname, '..', '.env');

if (!process.env.DATABASE_URL && existsSync(arquivo)) {
  process.loadEnvFile(arquivo);
}
