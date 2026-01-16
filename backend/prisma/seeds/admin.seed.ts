import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await (prisma as any).usuario.upsert({
    where: { cpfCnpj: '04.252.011/0001-10' },
    update: {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      telefone: '(65) 90000-0000',
      senha: passwordHash,
      papel: 'super_admin',
      status: 'ativo',
    },
    create: {
      nome: 'Admin Master',
      email: 'admin@agrosaldo.com',
      cpfCnpj: '04.252.011/0001-10',
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
      valor: 69.9,
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
      valor: 399.0,
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
        plano: 'retiro',
        tipo: 'plan_upgrade',
        status: 'pending',
        enviadoEm: new Date(now.getFullYear(), now.getMonth(), 4),
        origem: 'app',
        nomePropriedade: 'Rancho Estrela',
        observacoes: 'Solicitou upgrade por exceder o limite atual',
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
}
