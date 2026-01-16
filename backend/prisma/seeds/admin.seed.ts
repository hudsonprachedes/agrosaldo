import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await (prisma as any).usuario.upsert({
    where: { cpfCnpj: '00.000.000/0001-00' },
    update: {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      telefone: '(65) 90000-0000',
      senha: passwordHash,
      papel: 'super_admin',
      status: 'ativo',
    },
    create: {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      cpfCnpj: '00.000.000/0001-00',
      telefone: '(65) 90000-0000',
      senha: passwordHash,
      papel: 'super_admin' as const,
      status: 'ativo' as const,
    },
  });
}
