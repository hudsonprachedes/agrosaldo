import { config as loadEnv } from 'dotenv';
import { defineConfig } from '@prisma/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Força carregar o .env da pasta backend com override
loadEnv({ override: true });

// Lê o .env manualmente para garantir a URL correta com prioridade correta
const envPath = resolve('.env');
const envContent = readFileSync(envPath, 'utf8');

// Ordem de prioridade: DIRECT_DATABASE_URL > DATABASE_URL (ignorando linhas comentadas)
const directDatabaseUrlMatch = envContent.match(/^\s*DIRECT_DATABASE_URL\s*=\s*["']?([^"'\n]+)/m);
const databaseUrlMatch = envContent.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\n]+)/m);

const resolvedUrl = directDatabaseUrlMatch?.[1] || databaseUrlMatch?.[1] || '';

console.log('Prisma config URL from .env:', resolvedUrl ? 
  (directDatabaseUrlMatch ? 'DIRECT_DATABASE_URL' : 'DATABASE_URL') + ': ' + resolvedUrl.replace(/\/\/.*@/, '//***:***@') : 
  'Nenhuma URL encontrada');

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
  datasource: {
    url: resolvedUrl,
  },
});
