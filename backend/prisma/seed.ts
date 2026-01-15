import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users.seed.js';
import { seedProperties } from './seeds/properties.seed.js';
import { seedLivestock } from './seeds/livestock.seed.js';
import { seedMovements } from './seeds/movements.seed.js';
import { seedAdmin } from './seeds/admin.seed.js';

const prisma = new PrismaClient();

async function main() {
  await seedUsers(prisma);
  await seedProperties(prisma);
  await seedLivestock(prisma);
  await seedMovements(prisma);
  await seedAdmin(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async error => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
