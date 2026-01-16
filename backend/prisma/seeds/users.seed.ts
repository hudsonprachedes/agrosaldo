import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('123456', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const users = [
    {
      nome: 'João Silva',
      email: 'joao@fazendaexemplo.com',
      cpfCnpj: '52998224725',
      telefone: '(65) 98765-4321',
      senha: passwordHash,
      papel: 'proprietario' as const,
      status: 'ativo' as const,
    },
    {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      cpfCnpj: '04252011000110',
      telefone: '(65) 90000-0000',
      senha: adminPasswordHash,
      papel: 'super_admin' as const,
      status: 'ativo' as const,
    },
  ];

  for (const user of users) {
    await (prisma as any).usuario.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }
}
