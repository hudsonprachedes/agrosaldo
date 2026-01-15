import { PrismaClient } from '@prisma/client';

export async function seedLivestock(prisma: PrismaClient) {
  const properties = await prisma.property.findMany();
  if (properties.length === 0) {
    return;
  }

  const livestock = [
    {
      species: 'bovino',
      ageGroup: '0-4',
      sex: 'male' as const,
      headcount: 157,
      propertyId: properties[0].id,
    },
    {
      species: 'bovino',
      ageGroup: '0-4',
      sex: 'female' as const,
      headcount: 152,
      propertyId: properties[0].id,
    },
    {
      species: 'bovino',
      ageGroup: '24-36',
      sex: 'female' as const,
      headcount: 380,
      propertyId: properties[0].id,
    },
  ];

  for (const item of livestock) {
    await prisma.livestock.create({ data: item });
  }
}
