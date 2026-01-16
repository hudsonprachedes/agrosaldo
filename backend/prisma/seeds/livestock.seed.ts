import { PrismaClient } from '@prisma/client';

export async function seedLivestock(prisma: PrismaClient) {
  const properties = await (prisma as any).propriedade.findMany();
  if (!properties || properties.length === 0) {
    return;
  }

  const ageGroups = ['0-4', '5-12', '12-24', '24-36', '36+'] as const;

  for (const property of properties) {
    await (prisma as any).rebanho.deleteMany({ where: { propriedadeId: property.id } });

    const totalTarget = property.quantidadeGado ?? 0;

    // Distribuição base por faixa (soma 100)
    const weightsByAge: Record<(typeof ageGroups)[number], number> = {
      '0-4': 12,
      '5-12': 18,
      '12-24': 22,
      '24-36': 26,
      '36+': 22,
    };

    for (const ageGroup of ageGroups) {
      const groupTotal = Math.max(0, Math.round((totalTarget * weightsByAge[ageGroup]) / 100));

      // 48% machos, 52% fêmeas
      const male = Math.round(groupTotal * 0.48);
      const female = Math.max(0, groupTotal - male);

      const entries = [
        { sexo: 'macho', cabecas: male },
        { sexo: 'femea', cabecas: female },
      ];

      for (const entry of entries) {
        await (prisma as any).rebanho.create({
          data: {
            propriedadeId: property.id,
            especie: 'bovino',
            faixaEtaria: ageGroup,
            sexo: entry.sexo,
            cabecas: entry.cabecas,
          },
        });
      }
    }
  }
}
