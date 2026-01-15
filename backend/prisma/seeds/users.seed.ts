import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('123456', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const users = [
    {
      name: 'João Silva',
      email: 'joao@fazendaexemplo.com',
      cpfCnpj: '123.456.789-00',
      phone: '(65) 98765-4321',
      password: passwordHash,
      role: 'owner' as const,
      status: 'active' as const,
    },
    {
      name: 'Admin Master',
      email: 'admin@agrosaldo.com',
      cpfCnpj: '00.000.000/0001-00',
      phone: '(65) 90000-0000',
      password: adminPasswordHash,
      role: 'super_admin' as const,
      status: 'active' as const,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { cpfCnpj: user.cpfCnpj },
      update: user,
      create: user,
    });
  }
}
