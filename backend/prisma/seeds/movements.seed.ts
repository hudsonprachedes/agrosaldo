import { PrismaClient } from '@prisma/client';

export async function seedMovements(prisma: PrismaClient) {
  const property = await prisma.property.findFirst();
  if (!property) {
    return;
  }

  const movements = [
    {
      propertyId: property.id,
      type: 'birth' as const,
      date: new Date('2024-01-15'),
      quantity: 12,
      sex: 'male' as const,
      ageGroup: '0-4',
      description: 'Nascimento - Lote Janeiro',
    },
    {
      propertyId: property.id,
      type: 'death' as const,
      date: new Date('2024-01-18'),
      quantity: 2,
      sex: 'male' as const,
      ageGroup: '0-4',
      description: 'Morte natural - Complicações pós-parto',
      cause: 'Complicações pós-parto',
    },
    {
      propertyId: property.id,
      type: 'sale' as const,
      date: new Date('2024-01-20'),
      quantity: 45,
      ageGroup: '24-36',
      description: 'Venda para Frigorífico JBS',
      destination: 'Frigorífico JBS - Cuiabá',
      value: 157500,
      gtaNumber: 'GTA-2024-001234',
    },
  ];

  for (const movement of movements) {
    await prisma.movement.create({ data: movement });
  }
}
