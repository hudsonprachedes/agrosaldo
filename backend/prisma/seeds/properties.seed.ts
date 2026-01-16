import { PrismaClient, type Property } from '@prisma/client';

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
      plan: 'barao' as const,
    },
  ];

  const createdProperties: Property[] = [];

  for (const property of properties) {
    const created = await prisma.property.upsert({
      where: { name: property.name },
      update: property as any,
      create: property as any,
    });
    createdProperties.push(created);
  }

  const owner = await prisma.user.findUnique({
    where: { cpfCnpj: '123.456.789-00' },
  });

  if (owner) {
    for (const property of createdProperties) {
      await prisma.userProperty.upsert({
        where: {
          userId_propertyId: {
            userId: owner.id,
            propertyId: property.id,
          },
        },
        update: {},
        create: {
          userId: owner.id,
          propertyId: property.id,
        },
      });
    }
  }
}
