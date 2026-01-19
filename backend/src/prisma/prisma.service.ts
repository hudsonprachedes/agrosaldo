import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type GlobalWithPgPool = typeof globalThis & {
  __agrosaldo_pg_pool__?: Pool;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const datasourceUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

    if (!datasourceUrl) {
      throw new Error('Nenhuma URL de banco de dados encontrada. Configure DIRECT_DATABASE_URL ou DATABASE_URL.');
    }

    // Para Prisma v7 - usar adapter para conexão direta
    const globalForPool = globalThis as GlobalWithPgPool;
    const pool =
      globalForPool.__agrosaldo_pg_pool__ ??
      new Pool({ connectionString: datasourceUrl });

    if (!globalForPool.__agrosaldo_pg_pool__) {
      globalForPool.__agrosaldo_pg_pool__ = pool;
    }
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
