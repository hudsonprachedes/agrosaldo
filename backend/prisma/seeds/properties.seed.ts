import { PrismaClient } from '@prisma/client';

export async function seedProperties(prisma: PrismaClient) {
  const properties = [
    {
      name: 'Fazenda Santa Rita',
      city: 'Cuiabá',
      state: 'MT',
      totalArea: 1500,
      cultivatedArea: 800,
      naturalArea: 700,
      cattleCount: 2340,
      status: 'active' as const,
      plan: 'porteira' as const,
    },
    {
      name: 'Fazenda Ouro Verde',
      city: 'Rondonópolis',
      state: 'MT',
      totalArea: 3200,
      cultivatedArea: 2000,
      naturalArea: 1200,
      cattleCount: 4520,
      status: 'active' as const,
      plan: 'premium' as const,
    },
  ];

  for (const property of properties) {
    await prisma.property.upsert({
      where: { name: property.name },
      update: property as any,
      create: property as any,
    });
  }
}
