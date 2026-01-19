import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedUsers } from './users.seed';
import { seedProperties } from './properties.seed';
import { seedLivestock } from './livestock.seed';
import { seedMovements } from './movements.seed';
import { seedEpidemiologySurveys } from './epidemiology.seed';
import { seedAdmin } from './admin.seed';

// Configurar PrismaClient baseado no tipo de conexão
const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';
const isAccelerate = databaseUrl.startsWith('prisma://') || 
                     databaseUrl.startsWith('prisma+postgres://');

let prisma: PrismaClient;

if (isAccelerate) {
  // Prisma Accelerate - usar accelerateUrl
  prisma = new PrismaClient({
    accelerateUrl: databaseUrl,
    log: ['error', 'warn'],
  });
} else {
  // Conexão direta PostgreSQL (local ou nuvem) - usar adapter
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['error', 'warn'],
  });
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  try {
    console.log('👤 Criando usuários...');
    await seedUsers(prisma);
    console.log('✅ Usuários criados com sucesso\n');

    console.log('🏡 Criando propriedades...');
    await seedProperties(prisma);
    console.log('✅ Propriedades criadas com sucesso\n');

    console.log('🐄 Criando rebanho...');
    await seedLivestock(prisma);
    console.log('✅ Rebanho criado com sucesso\n');

    console.log('📊 Criando movimentações...');
    await seedMovements(prisma);
    console.log('✅ Movimentações criadas com sucesso\n');

    console.log('💉 Criando dados epidemiológicos...');
    await seedEpidemiologySurveys(prisma);
    console.log('✅ Dados epidemiológicos criados com sucesso\n');

    console.log('👨‍💼 Criando dados administrativos...');
    await seedAdmin(prisma);
    console.log('✅ Dados administrativos criados com sucesso\n');

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
