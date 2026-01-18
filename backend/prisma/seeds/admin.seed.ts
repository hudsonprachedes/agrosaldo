import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await (prisma as any).usuario.upsert({
    where: { email: 'admin@agrosaldo.com' },
    update: {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      telefone: '(65) 90000-0000',
      cpfCnpj: '04252011000110',
      senha: passwordHash,
      papel: 'super_admin',
      status: 'ativo',
    },
    create: {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      cpfCnpj: '04252011000110',
      telefone: '(65) 90000-0000',
      senha: passwordHash,
      papel: 'super_admin' as const,
      status: 'ativo' as const,
    },
  });

  // PIX Config (para tela /bloqueado e /admin/financeiro)
  await (prisma as any).configuracaoPix.upsert({
    where: { id: 'seed-pix-config' },
    update: {
      chavePix: '04.252.011/0001-10',
      tipoChavePix: 'cnpj',
      imagemQrCode: null,
      ativo: true,
    },
    create: {
      id: 'seed-pix-config',
      chavePix: '04.252.011/0001-10',
      tipoChavePix: 'cnpj',
      imagemQrCode: null,
      ativo: true,
    },
  });

  // Payments (para /admin/financeiro)
  await (prisma as any).pagamentoFinanceiro.deleteMany({});
  const now = new Date();
  const paymentSeed: any[] = [];

  for (let i = 0; i < 12; i++) {
    const due = new Date(now.getFullYear(), now.getMonth() - i, 10);
    const paidAt = new Date(now.getFullYear(), now.getMonth() - i, 12);

    paymentSeed.push({
      tenantId: 'seed-tenant-1',
      tenantName: 'Fazenda Santa Rita',
      plano: 'porteira',
      valor: 49.9,
      metodoPagamento: 'pix',
      frequenciaPagamento: 'monthly',
      status: i === 0 ? 'pending' : 'paid',
      vencimentoEm: due,
      pagoEm: i === 0 ? null : paidAt,
    });

    paymentSeed.push({
      tenantId: 'seed-tenant-2',
      tenantName: 'Fazenda Ouro Verde',
      plano: 'barao',
      valor: 499.9,
      metodoPagamento: 'pix',
      frequenciaPagamento: 'monthly',
      status: i === 1 ? 'overdue' : 'paid',
      vencimentoEm: due,
      pagoEm: i === 1 ? null : paidAt,
    });
  }

  for (const p of paymentSeed) {
    await (prisma as any).pagamentoFinanceiro.create({ data: p });
  }

  // Pending requests (para /admin/solicitacoes)
  await (prisma as any).solicitacaoPendente.deleteMany({});
  await (prisma as any).solicitacaoPendente.createMany({
    data: [
      {
        nome: 'Carlos Andrade',
        cpfCnpj: '529.982.247-25',
        email: 'carlos@fazenda.com',
        telefone: '(65) 98888-7777',
        plano: 'piquete',
        tipo: 'new_account',
        status: 'pending',
        enviadoEm: new Date(now.getFullYear(), now.getMonth(), 2),
        origem: 'site',
        nomePropriedade: 'Fazenda Nova Era',
        observacoes: 'Solicitou acesso e cadastrou 1200 cabeças',
      },
      {
        nome: 'Marina Souza',
        cpfCnpj: '04.252.011/0001-10',
        email: 'marina@rancho.com',
        telefone: '(65) 97777-6666',
        plano: 'porteira',
        tipo: 'plan_downgrade',
        status: 'pending',
        enviadoEm: new Date(now.getFullYear(), now.getMonth(), 4),
        origem: 'app',
        nomePropriedade: 'Rancho Estrela',
        observacoes: 'Solicitou downgrade (upgrade é automático conforme cabeças; downgrade requer aprovação)',
      },
    ],
  });

  // Audit logs (para /admin/auditoria)
  await (prisma as any).logAuditoria.deleteMany({});
  await (prisma as any).logAuditoria.createMany({
    data: [
      {
        usuarioId: 'SYSTEM',
        usuarioNome: 'Sistema',
        acao: 'USER_APPROVED',
        detalhes: 'Seed: aprovação de usuário simulada',
        ip: '127.0.0.1',
      },
      {
        usuarioId: 'SYSTEM',
        usuarioNome: 'Sistema',
        acao: 'PAYMENT_RECEIVED',
        detalhes: 'Seed: pagamento registrado',
        ip: '127.0.0.1',
      },
    ],
  });

  await (prisma as any).planoSaas.deleteMany({});
  await (prisma as any).planoSaas.createMany({
    data: [
      { nome: 'Porteira', preco: 49.9, maxCabecas: 500, recursos: [], ativo: true },
      { nome: 'Piquete', preco: 99.9, maxCabecas: 1000, recursos: [], ativo: true },
      { nome: 'Retiro', preco: 149.9, maxCabecas: 2000, recursos: [], ativo: true },
      { nome: 'Estância', preco: 249.9, maxCabecas: 3000, recursos: [], ativo: true },
      {
        nome: 'Barão',
        preco: 499.9,
        maxCabecas: null,
        cobrancaAdicionalAtiva: true,
        valorCobrancaAdicional: 0.1,
        recursos: [],
        ativo: true,
      },
    ],
  });

  await (prisma as any).cupomIndicacao.deleteMany({});
  await (prisma as any).cupomIndicacao.createMany({
    data: [
      {
        codigo: 'AGRO2024',
        tipo: 'discount',
        valor: 20,
        quantidadeUso: 45,
        maxUso: 100,
        comissao: 0,
        criadoPor: 'Admin',
        status: 'active',
      },
      {
        codigo: 'PARCEIRO10',
        tipo: 'referral',
        valor: 10,
        quantidadeUso: 23,
        maxUso: null,
        comissao: 15,
        criadoPor: 'João Silva',
        status: 'active',
      },
      {
        codigo: 'PRIMEIROMES',
        tipo: 'discount',
        valor: 100,
        quantidadeUso: 12,
        maxUso: 50,
        comissao: 0,
        criadoPor: 'Admin',
        status: 'active',
      },
    ],
  });

  await (prisma as any).indicadorParceiro.deleteMany({});
  await (prisma as any).indicadorParceiro.createMany({
    data: [
      {
        nome: 'João Silva',
        codigo: 'JOAO2024',
        indicacoes: 15,
        comissaoTotal: 1250.0,
        comissaoPendente: 350.0,
        status: 'active',
      },
      {
        nome: 'Maria Oliveira',
        codigo: 'MARIA2024',
        indicacoes: 8,
        comissaoTotal: 680.0,
        comissaoPendente: 120.0,
        status: 'active',
      },
    ],
  });

  await (prisma as any).comunicacaoAdmin.deleteMany({});
  await (prisma as any).comunicacaoAdmin.createMany({
    data: [
      {
        tipo: 'push',
        titulo: 'Campanha de Aftosa Iniciada!',
        mensagem: 'A campanha de vacinação contra aftosa começou. Atualize seus registros.',
        enviadoEm: new Date('2024-01-15'),
        destinatarios: 245,
        status: 'sent',
        publicoAlvo: 'all',
        cor: null,
        inicioEm: null,
        fimEm: null,
      },
      {
        tipo: 'banner',
        titulo: 'Manutenção Programada',
        mensagem: 'O sistema ficará indisponível no dia 20/01 das 02h às 04h.',
        enviadoEm: new Date('2024-01-14'),
        destinatarios: 312,
        status: 'active',
        publicoAlvo: 'all',
        cor: 'warning',
        inicioEm: new Date('2024-01-14'),
        fimEm: new Date('2024-01-21'),
      },
      {
        tipo: 'push',
        titulo: 'Lembrete de Pagamento',
        mensagem: 'Sua fatura vence em 3 dias. Regularize para manter o acesso.',
        enviadoEm: new Date('2024-01-12'),
        destinatarios: 48,
        status: 'sent',
        publicoAlvo: 'overdue',
        cor: null,
        inicioEm: null,
        fimEm: null,
      },
    ],
  });
}
