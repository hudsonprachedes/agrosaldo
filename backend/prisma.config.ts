import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const resolvedUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: resolvedUrl,
  },
  migrations: {
    seed: 'tsx ./prisma/seeds/main.ts',
  },
});
