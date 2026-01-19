import { PrismaClient } from '@prisma/client';

export async function seedProperties(prisma: PrismaClient) {
  const properties = [
    {
      nome: 'Fazenda Santa Rita',
      cidade: 'Cuiabá',
      estado: 'MT',
      areaTotal: 1500,
      areaCultivada: 800,
      areaNatural: 700,
      quantidadeGado: 2340,
      status: 'ativa' as const,
      plano: 'estancia' as const,
    },
    {
      nome: 'Fazenda Ouro Verde',
      cidade: 'Rondonópolis',
      estado: 'MT',
      areaTotal: 3200,
      areaCultivada: 2000,
      areaNatural: 1200,
      quantidadeGado: 4520,
      status: 'ativa' as const,
      plano: 'barao' as const,
    },
  ];

  const createdProperties: Array<{ id: string; nome: string }> = [];

  for (const property of properties) {
    const created = await prisma.propriedade.upsert({
      where: { nome: property.nome },
      update: property as any,
      create: property as any,
    });
    createdProperties.push(created as any);
  }

  const owner = await prisma.usuario.findUnique({
    where: { cpfCnpj: '52998224725' },
  });

  if (owner) {
    for (const property of createdProperties) {
      await prisma.usuarioPropriedade.upsert({
        where: {
          usuarioId_propriedadeId: {
            usuarioId: owner.id,
            propriedadeId: property.id,
          },
        },
        update: {},
        create: {
          usuarioId: owner.id,
          propriedadeId: property.id,
        },
      });
    }
  }
}
