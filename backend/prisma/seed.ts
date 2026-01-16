import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedUsers } from './seeds/users.seed';
import { seedProperties } from './seeds/properties.seed';
import { seedLivestock } from './seeds/livestock.seed';
import { seedMovements } from './seeds/movements.seed';
import { seedEpidemiologySurveys } from './seeds/epidemiology.seed';
import { seedAdmin } from './seeds/admin.seed';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await seedUsers(prisma);
  await seedProperties(prisma);
  await seedLivestock(prisma);
  await seedMovements(prisma);
  await seedEpidemiologySurveys(prisma);
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
