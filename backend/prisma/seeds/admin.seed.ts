import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { cpfCnpj: '00.000.000/0001-00' },
    update: {
      name: 'Admin Master',
      email: 'admin@agrosaldo.com',
      phone: '(65) 90000-0000',
      password: passwordHash,
      role: 'super_admin',
      status: 'active',
    },
    create: {
      name: 'Admin Master',
      email: 'admin@agrosaldo.com',
      cpfCnpj: '00.000.000/0001-00',
      phone: '(65) 90000-0000',
      password: passwordHash,
      role: 'super_admin',
      status: 'active',
    },
  });
}
