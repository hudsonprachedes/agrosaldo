import { PrismaClient } from '@prisma/client';

export async function seedMovements(prisma: PrismaClient) {
  const properties = await (prisma as any).propriedade.findMany();
  if (!properties || properties.length === 0) {
    return;
  }

  const now = new Date();

  for (const property of properties) {
    await (prisma as any).movimento.deleteMany({ where: { propriedadeId: property.id } });

    const movements: any[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const monthLabel = monthDate.toLocaleString('pt-BR', { month: 'long' });

      // Nascimentos
      movements.push({
        propriedadeId: property.id,
        tipo: 'nascimento',
        data: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
        quantidade: 60 + (11 - i) * 2,
        sexo: 'femea',
        faixaEtaria: '0-4',
        descricao: `Nascimento - Lote ${monthLabel}`,
      });
      movements.push({
        propriedadeId: property.id,
        tipo: 'nascimento',
        data: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12),
        quantidade: 55 + (11 - i) * 2,
        sexo: 'macho',
        faixaEtaria: '0-4',
        descricao: `Nascimento - Lote ${monthLabel}`,
      });

      // Mortes
      movements.push({
        propriedadeId: property.id,
        tipo: 'morte',
        data: new Date(monthDate.getFullYear(), monthDate.getMonth(), 18),
        quantidade: Math.max(2, 6 - Math.floor((11 - i) / 3)),
        sexo: 'macho',
        faixaEtaria: '0-4',
        descricao: 'Morte natural - causas diversas',
        causa: 'Causas naturais',
      });

      // Vendas
      movements.push({
        propriedadeId: property.id,
        tipo: 'venda',
        data: new Date(monthDate.getFullYear(), monthDate.getMonth(), 22),
        quantidade: 18 + (11 - i),
        faixaEtaria: '24-36',
        descricao: 'Venda para frigorífico',
        destino: 'Frigorífico (seed)',
        valor: 18_000 + (11 - i) * 800,
        numeroGta: `GTA-${monthDate.getFullYear()}-${String(i + 1).padStart(2, '0')}0001`,
      });

      // Vacinas
      movements.push({
        propriedadeId: property.id,
        tipo: 'vacina',
        data: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        quantidade: 250 + (11 - i) * 5,
        descricao: 'Vacinação - campanha mensal',
      });
    }

    for (const movement of movements) {
      await (prisma as any).movimento.create({ data: movement });
    }
  }
}
