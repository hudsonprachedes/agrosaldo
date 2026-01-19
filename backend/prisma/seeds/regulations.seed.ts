import { PrismaClient } from '@prisma/client';

const DEFAULT_NOTIFICATION_LEAD_DAYS = [30, 15, 7, 3, 0];

type Period = {
  code: string;
  label: string;
  start: string; // MM-DD
  end: string; // MM-DD
};

type DeclarationPeriods = {
  periods: Period[];
};

export async function seedRegulations(prisma: PrismaClient) {
  const base: Array<{
    uf: string;
    stateName: string;
    declarationFrequency: number;
    declarationPeriods: DeclarationPeriods;
    responsibleAgency: string;
    requiredVaccines: string[];
    requiredDocuments: string[];
  }> = [
    {
      uf: 'GO',
      stateName: 'Goiás',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro (até 31/dez)', start: '11-01', end: '12-31' },
        ],
      },
      responsibleAgency: 'Agrodefesa',
      requiredVaccines: ['Raiva (em regiões de risco)', 'Brucelose'],
      requiredDocuments: ['Nota Fiscal da vacina', 'CPF/CNPJ', 'Acesso ao SIDAGO'],
    },
    {
      uf: 'MG',
      stateName: 'Minas Gerais',
      declarationFrequency: 1,
      declarationPeriods: {
        periods: [{ code: 'ANUAL', label: '1º de Maio a 30 de Junho', start: '05-01', end: '06-30' }],
      },
      responsibleAgency: 'IMA',
      requiredVaccines: ['Brucelose', 'Raiva (se houver foco na região)'],
      requiredDocuments: ['Atestado de vacinação emitido por veterinário', 'NF da vacina'],
    },
    {
      uf: 'MS',
      stateName: 'Mato Grosso do Sul',
      declarationFrequency: 1,
      declarationPeriods: {
        periods: [{ code: 'ANUAL', label: '1º de Novembro a 1º de Dezembro', start: '11-01', end: '12-01' }],
      },
      responsibleAgency: 'IAGRO',
      requiredVaccines: ['Brucelose (fêmeas de 3 a 8 meses)'],
      requiredDocuments: ['Nota Fiscal de compra', 'Acesso ao sistema IAGRO'],
    },
    {
      uf: 'MT',
      stateName: 'Mato Grosso',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'INDEA',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Atestado médico veterinário', 'NF da vacina'],
    },
    {
      uf: 'PR',
      stateName: 'Paraná',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'ADAPAR',
      requiredVaccines: ['Brucelose (obrigatória em todo o país)'],
      requiredDocuments: ['Comprovante de compra de vacinas', 'Acesso à ADAPAR'],
    },
    {
      uf: 'RS',
      stateName: 'Rio Grande do Sul',
      declarationFrequency: 1,
      declarationPeriods: {
        periods: [{ code: 'ANUAL', label: '1º de Abril a 30 de Junho', start: '04-01', end: '06-30' }],
      },
      responsibleAgency: 'SEAPI',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Declaração anual preenchida no Produtor Online'],
    },
    {
      uf: 'SP',
      stateName: 'São Paulo',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'CDA',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Nota Fiscal eletrônica', 'Cadastro no sistema GEDAVE'],
    },
    {
      uf: 'RO',
      stateName: 'Rondônia',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'IDARON',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Nota Fiscal', 'Comprovantes de movimentação (GTA)'],
    },
    {
      uf: 'PB',
      stateName: 'Paraíba',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'SEDAP',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Documentos gerais (NF, atestados, GTAs, nascimentos/óbitos)'],
    },
    {
      uf: 'ES',
      stateName: 'Espírito Santo',
      declarationFrequency: 1,
      declarationPeriods: {
        periods: [{ code: 'ANUAL', label: '1º de Maio a 30 de Junho', start: '05-01', end: '06-30' }],
      },
      responsibleAgency: 'IDAF',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Documentos de identificação', 'NF da vacina'],
    },
    {
      uf: 'AC',
      stateName: 'Acre',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'IDAF',
      requiredVaccines: ['Brucelose'],
      requiredDocuments: ['Documentos gerais (NF, atestados, GTAs, nascimentos/óbitos)'],
    },
    {
      uf: 'TO',
      stateName: 'Tocantins',
      declarationFrequency: 2,
      declarationPeriods: {
        periods: [
          { code: 'MAIO', label: 'Maio', start: '05-01', end: '05-31' },
          { code: 'NOV', label: 'Novembro', start: '11-01', end: '11-30' },
        ],
      },
      responsibleAgency: 'ADAPEC',
      requiredVaccines: ['Brucelose', 'Raiva (Ilha do Bananal)'],
      requiredDocuments: ['Formulário eletrônico no site da ADAPEC'],
    },
  ];

  for (const r of base) {
    const existing = await (prisma as any).regulamentacaoEstadual.findFirst({
      where: { uf: r.uf },
      select: { id: true },
    });

    const data = {
      uf: r.uf,
      nomeEstado: r.stateName,
      prazoEntrega: 0,
      documentosNecessarios: r.requiredDocuments,
      frequenciaDeclaracao: r.declarationFrequency,
      periodosDeclaracao: r.declarationPeriods as any,
      orgaoResponsavel: r.responsibleAgency,
      vacinasObrigatorias: r.requiredVaccines,
      diasAvisoNotificacao: DEFAULT_NOTIFICATION_LEAD_DAYS,
      gtaObrigatoria: true,
      observacoes:
        'Obrigatoriedade: declaração deve abranger todas as espécies de interesse pecuário. Consequência: sem atualização impede emissão de GTA e pode gerar multas.',
      atualizadoPor: 'Seed',
    };

    if (existing?.id) {
      await (prisma as any).regulamentacaoEstadual.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await (prisma as any).regulamentacaoEstadual.create({ data });
  }
}
