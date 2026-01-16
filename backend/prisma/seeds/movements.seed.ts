import { PrismaClient } from '@prisma/client';

export async function seedMovements(prisma: PrismaClient) {
  const properties = await (prisma as any).propriedade.findMany();
  if (!properties || properties.length === 0) {
    return;
  }
  const property = properties[0];

  const movements = [
    {
      propriedadeId: property.id,
      tipo: 'nascimento' as const,
      data: new Date('2024-01-15'),
      quantidade: 12,
      sexo: 'macho' as const,
      faixaEtaria: '0-4',
      descricao: 'Nascimento - Lote Janeiro',
    },
    {
      propriedadeId: property.id,
      tipo: 'morte' as const,
      data: new Date('2024-01-18'),
      quantidade: 2,
      sexo: 'macho' as const,
      faixaEtaria: '0-4',
      descricao: 'Morte natural - Complicações pós-parto',
      causa: 'Complicações pós-parto',
    },
    {
      propriedadeId: property.id,
      tipo: 'venda' as const,
      data: new Date('2024-01-20'),
      quantidade: 45,
      faixaEtaria: '24-36',
      descricao: 'Venda para Frigorífico JBS',
      destino: 'Frigorífico JBS - Cuiabá',
      valor: 157500,
      numeroGta: 'GTA-2024-001234',
    },
  ];

  for (const movement of movements) {
    await (prisma as any).movimento.create({
      data: movement as any,
    });
  }
}
