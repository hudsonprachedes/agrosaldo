import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Detecta se está usando Prisma Accelerate (connection pooling)
 * Nota: db.prisma.io com postgres:// é conexão direta PostgreSQL, não Accelerate
 */
function isPrismaAccelerate(databaseUrl: string): boolean {
  const url = databaseUrl.toLowerCase();
  // Usar Accelerate somente quando a URL explicitamente for prisma:// ou prisma+postgres://
  // Ou quando a variável PRISMA_ACCELERATE estiver forçada
  return (
    url.startsWith('prisma://') ||
    url.startsWith('prisma+postgres://') ||
    process.env.PRISMA_ACCELERATE === 'true'
  );
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    // Obter DATABASE_URL (suporta PRISMA_DATABASE_URL como fallback para compatibilidade)
    const databaseUrl =
      configService.get<string>('DATABASE_URL') ||
      configService.get<string>('PRISMA_DATABASE_URL');

    if (!databaseUrl || databaseUrl.trim() === '') {
      throw new Error(
        'DATABASE_URL não está definida. Verifique o arquivo .env na raiz do backend.',
      );
    }

    const isCloud = isPrismaAccelerate(databaseUrl);

    // Preparar configuração do Prisma antes de chamar super()
    let prismaConfig: any;
    if (isCloud) {
      prismaConfig = {
        accelerateUrl: databaseUrl,
        log: isProduction ? undefined : ['error', 'warn'],
      };
    } else {
      // Para conexão direta PostgreSQL (desenvolvimento local)
      // Garantir UTF-8 na conexão
      const poolConfig: any = {
        connectionString: databaseUrl,
      };

      // Adicionar parâmetros de encoding UTF-8 se não estiverem na URL
      if (!databaseUrl.includes('client_encoding')) {
        // O PostgreSQL usa UTF-8 por padrão, mas vamos garantir explicitamente
        poolConfig.client_encoding = 'UTF8';
      }

      const pool = new Pool(poolConfig);
      prismaConfig = {
        adapter: new PrismaPg(pool),
        log: isProduction ? undefined : ['error'],
      };
    }

    // Chamada única a super com a configuração preparada
    super(prismaConfig);
    if (!isProduction && isCloud) {
      this.logger.log(
        '☁️  Detectado: Conexão na nuvem (Prisma Accelerate). Aplicando configurações otimizadas...',
      );
    }
  }

  async onModuleInit() {
    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    try {
      await this.$connect();
      if (!isProduction) {
        this.logger.log(
          '✅ Conexão com banco de dados estabelecida com sucesso',
        );
      }
    } catch (error) {
      if (!isProduction) {
        this.logger.error('❌ Falha ao conectar com o banco de dados:', error);
      }
      // Em serverless, não abortar - deixar lazy connection
      if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
