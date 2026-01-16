import { PrismaClient } from '@prisma/client';

export async function seedLivestock(prisma: PrismaClient) {
  const properties = await (prisma as any).propriedade.findMany();
  if (!properties || properties.length === 0) {
    return;
  }

  const livestock = [
    {
      especie: 'bovino',
      faixaEtaria: '0-4',
      sexo: 'macho' as const,
      cabecas: 157,
      propriedadeId: properties[0].id,
    },
    {
      especie: 'bovino',
      faixaEtaria: '0-4',
      sexo: 'femea' as const,
      cabecas: 152,
      propriedadeId: properties[0].id,
    },
    {
      especie: 'bovino',
      faixaEtaria: '24-36',
      sexo: 'femea' as const,
      cabecas: 380,
      propriedadeId: properties[0].id,
    },
  ];

  for (const item of livestock) {
    await (prisma as any).rebanho.create({ data: item });
  }
}
