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
import { seedRegulations } from './regulations.seed';

const TEST_USER_CPF_CNPJ = '52998224725';
const SUPER_ADMIN_CPF_CNPJ = '04252011000110';

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
    const testUser = await (prisma as any).usuario.findUnique({
      where: { cpfCnpj: TEST_USER_CPF_CNPJ },
      select: { id: true, cpfCnpj: true, papel: true },
    });

    if (testUser && testUser.cpfCnpj !== SUPER_ADMIN_CPF_CNPJ && testUser.papel !== 'super_admin') {
      const testUserProperties = await (prisma as any).usuarioPropriedade.findMany({
        where: { usuarioId: testUser.id },
        select: { propriedadeId: true },
      });

      const testPropertyIds = testUserProperties.map((p: any) => p.propriedadeId);

      await prisma.$transaction([
        (prisma as any).notificacaoUsuario.deleteMany({ where: { usuarioId: testUser.id } }),
        (prisma as any).assinatura.deleteMany({ where: { usuarioId: testUser.id } }),
        (prisma as any).preferenciasUsuario.deleteMany({ where: { usuarioId: testUser.id } }),
        (prisma as any).usuarioPropriedade.deleteMany({ where: { usuarioId: testUser.id } }),
        ...(testPropertyIds.length > 0
          ? [
              (prisma as any).questionarioEpidemiologico.deleteMany({
                where: { propriedadeId: { in: testPropertyIds } },
              }),
              (prisma as any).movimento.deleteMany({
                where: { propriedadeId: { in: testPropertyIds } },
              }),
              (prisma as any).rebanho.deleteMany({
                where: { propriedadeId: { in: testPropertyIds } },
              }),
            ]
          : []),
        (prisma as any).usuario.delete({ where: { id: testUser.id } }),
      ]);
    }

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

    console.log('📜 Criando regulamentações estaduais...');
    await seedRegulations(prisma);
    console.log('✅ Regulamentações criadas com sucesso\n');

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
