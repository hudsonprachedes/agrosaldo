import { PrismaClient } from '@prisma/client';

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function seedEpidemiologySurveys(prisma: PrismaClient) {
  const properties = await (prisma as any).propriedade.findMany();
  if (!properties || properties.length === 0) {
    return;
  }

  const now = new Date();

  for (const property of properties) {
    await (prisma as any).questionarioEpidemiologico.deleteMany({
      where: { propriedadeId: property.id },
    });

    const submittedDates = [addMonths(now, -12), addMonths(now, -6), now];

    for (const submittedAt of submittedDates) {
      const answers = [
        { fieldId: 'a_email', value: 'joao@fazendaexemplo.com' },
        { fieldId: 'a_telefone', value: '(65) 98765-4321' },
        { fieldId: 'b_area_pastagem_cultivada_ha', value: 800 },
        { fieldId: 'b_area_pastagem_natural_ha', value: 700 },
        { fieldId: 'b_quantidade_vacas_leiteiras', value: 120 },
        { fieldId: 'b_finalidade_criacao_bovinos', value: 'mista' },
        { fieldId: 'b_ordenha', value: 'mecanica' },
        { fieldId: 'b_ordenha_vezes_ao_dia', value: 'duas' },
        { fieldId: 'c_contato_com_javalis', value: 'nao' },
        { fieldId: 'd_aves_acesso_agua', value: 'sim' },
        { fieldId: 'd_aves_contato_silvestres', value: 'nao' },
        { fieldId: 'e_mordedura_morcego_ultimos_6_meses', value: 'nao' },
      ];

      await (prisma as any).questionarioEpidemiologico.create({
        data: {
          propriedadeId: property.id,
          versao: 1,
          respostas: answers,
          enviadoEm: submittedAt,
          proximoEm: addMonths(submittedAt, 6),
        },
      });
    }
  }
}
