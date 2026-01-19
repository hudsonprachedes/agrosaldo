import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedRegulations } from './regulations.seed';

const SUPER_ADMIN_EMAIL = 'admin@agrosaldo.com';
const SUPER_ADMIN_CPF_CNPJ = '04252011000110';

const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL (ou PRISMA_DATABASE_URL) não está definido. Configure a variável de ambiente antes de rodar o seed.',
  );
}
const isAccelerate =
  databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://');

let prisma: PrismaClient;

if (isAccelerate) {
  prisma = new PrismaClient({
    accelerateUrl: databaseUrl,
    log: ['error', 'warn'],
  });
} else {
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ['error', 'warn'],
  });
}

async function main() {
  console.log('🌱 Seed de PRODUÇÃO: recriando superadmin, planos e regulamentações...\n');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const existingAdmin = await (prisma as any).usuario.findFirst({
    where: {
      OR: [{ email: SUPER_ADMIN_EMAIL }, { cpfCnpj: SUPER_ADMIN_CPF_CNPJ }],
    },
    select: { id: true },
  });

  await prisma.$transaction([
    ...(existingAdmin?.id
      ? [
          (prisma as any).notificacaoUsuario.deleteMany({
            where: { usuarioId: existingAdmin.id },
          }),
          (prisma as any).assinatura.deleteMany({
            where: { usuarioId: existingAdmin.id },
          }),
          (prisma as any).preferenciasUsuario.deleteMany({
            where: { usuarioId: existingAdmin.id },
          }),
          (prisma as any).usuarioPropriedade.deleteMany({
            where: { usuarioId: existingAdmin.id },
          }),
          (prisma as any).usuario.delete({ where: { id: existingAdmin.id } }),
        ]
      : []),
    (prisma as any).planoSaas.deleteMany({}),
    (prisma as any).regulamentacaoEstadual.deleteMany({}),
  ]);

  await (prisma as any).usuario.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      nome: 'Admin Master',
      email: SUPER_ADMIN_EMAIL,
      telefone: '(65) 90000-0000',
      cpfCnpj: SUPER_ADMIN_CPF_CNPJ,
      senha: passwordHash,
      papel: 'super_admin',
      status: 'ativo',
    },
    create: {
      nome: 'Admin Master',
      email: SUPER_ADMIN_EMAIL,
      cpfCnpj: SUPER_ADMIN_CPF_CNPJ,
      telefone: '(65) 90000-0000',
      senha: passwordHash,
      papel: 'super_admin' as const,
      status: 'ativo' as const,
    },
  });

  await (prisma as any).planoSaas.createMany({
    data: [
      { nome: 'Porteira', preco: 49.9, maxCabecas: 500, recursos: [], ativo: true },
      { nome: 'Piquete', preco: 99.9, maxCabecas: 1000, recursos: [], ativo: true },
      { nome: 'Retiro', preco: 149.9, maxCabecas: 2000, recursos: [], ativo: true },
      { nome: 'Estância', preco: 249.9, maxCabecas: 3000, recursos: [], ativo: true },
      {
        nome: 'Barão',
        preco: 499.9,
        maxCabecas: null,
        cobrancaAdicionalAtiva: true,
        valorCobrancaAdicional: 0.1,
        recursos: [],
        ativo: true,
      },
    ],
  });

  await seedRegulations(prisma);

  console.log('✅ Seed de produção concluído (superadmin + planos + regulamentações).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
