import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { seedUsers } from './seeds/users.seed';
import { seedProperties } from './seeds/properties.seed';
import { seedLivestock } from './seeds/livestock.seed';
import { seedMovements } from './seeds/movements.seed';
import { seedEpidemiologySurveys } from './seeds/epidemiology.seed';
import { seedAdmin } from './seeds/admin.seed';

// Força carregar o .env com override
loadEnv({ override: true });

// Lê o .env manualmente para garantir a URL correta (mesma lógica do prisma.config.ts)
const envPath = resolve('.env');
const envContent = readFileSync(envPath, 'utf8');

// Ordem de prioridade: DIRECT_DATABASE_URL > DATABASE_URL (ignorando linhas comentadas)
const directDatabaseUrlMatch = envContent.match(/^\s*DIRECT_DATABASE_URL\s*=\s*["']?([^"'\n]+)/m);
const databaseUrlMatch = envContent.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\n]+)/m);

const connectionString = directDatabaseUrlMatch?.[1] || databaseUrlMatch?.[1] || '';

function redactConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    url.username = '';
    url.password = '';
    url.search = '';
    return url.toString();
  } catch {
    return '[invalid-connection-string]';
  }
}

if (connectionString) {
  console.log(`[Prisma Seed] connectionString=${redactConnectionString(connectionString)}`);
} else {
  console.log('[Prisma Seed] connectionString=undefined (DATABASE_URL não encontrado no .env)');
}

const adapter = new PrismaPg({
  connectionString,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedUsers(prisma);
  await seedProperties(prisma);
  await seedLivestock(prisma);
  await seedMovements(prisma);
  await seedEpidemiologySurveys(prisma);
  await seedAdmin(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
