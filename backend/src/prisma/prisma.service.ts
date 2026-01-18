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
    const globalForPool = globalThis as GlobalWithPgPool;
    const pool =
      globalForPool.__agrosaldo_pg_pool__ ??
      new Pool({ connectionString: process.env.DATABASE_URL });

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
