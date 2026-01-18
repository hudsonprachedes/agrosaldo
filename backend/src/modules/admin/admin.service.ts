import { Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ApproveUserDto } from './dto/approve-user.dto';
import { CreateRegulationDto, UpdateRegulationDto } from './dto/regulation.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { UpdatePixConfigDto } from './dto/pix-config.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private buildMonthlyCategories(start: Date, end: Date) {
    const categories: string[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endMonth) {
      categories.push(this.monthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return categories;
  }

  // --- Dashboard & KPIs ---

  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      pendingRequests,
      overdueCount,
      revenueData,
      totalCattleResult,
    ] = await Promise.all([
      this.prisma.usuario.count({
        where: { papel: { in: ['proprietario', 'operador'] as any } },
      }),
      this.prisma.usuario.count({
        where: {
          papel: { in: ['proprietario', 'operador'] as any },
          status: 'ativo' as any,
        },
      }),
      this.prisma.usuario.count({
        where: { status: 'pendente_aprovacao' as any },
      }),
      this.prisma.usuario.count({
        where: { statusFinanceiro: 'inadimplente' as any },
      }),
      this.prisma.usuario.aggregate({
        _sum: {
          receitaMensal: true,
        },
        where: { status: 'ativo' as any },
      }),
      this.prisma.rebanho.aggregate({
        _sum: {
          cabecas: true,
        },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      totalCattle: totalCattleResult._sum.cabecas || 0,
      mrr: revenueData._sum.receitaMensal || 0,
      pendingRequests,
      overdueCount,
    };
  }

  async getMrrSeries(months = 12) {
    const safeMonths = Number.isFinite(months) ? Math.max(1, Math.min(24, months)) : 12;
    const now = new Date();

    const periodStart = new Date(now.getFullYear(), now.getMonth() - (safeMonths - 1), 1);
    const rows = await this.prisma.pagamentoFinanceiro.findMany({
      where: {
        status: 'paid',
        frequenciaPagamento: 'monthly',
        pagoEm: { not: null, gte: periodStart },
      },
      select: { pagoEm: true, valor: true },
      orderBy: { pagoEm: 'asc' },
    });

    const monthlyTotals = new Map<string, number>();
    for (const row of rows) {
      if (!row.pagoEm) continue;
      const key = `${row.pagoEm.getFullYear()}-${String(row.pagoEm.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + row.valor);
    }

    const series: { month: string; value: number }[] = [];
    for (let i = safeMonths - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      series.push({ month: key, value: Number((monthlyTotals.get(key) ?? 0).toFixed(2)) });
    }

    return series;
  }

  async getAnalytics(period?: string) {
    const now = new Date();
    const normalized = (period ?? '30d').toLowerCase();

    const months = normalized === '7d' ? 1 : normalized === '90d' ? 3 : normalized === '1y' ? 12 : 6;
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const categories = this.buildMonthlyCategories(start, now);

    const [kpis, payments, tenantUsers, properties] = await Promise.all([
      this.getDashboardStats(),
      this.prisma.pagamentoFinanceiro.findMany({
        where: {
          status: 'paid',
          pagoEm: { not: null, gte: start },
        },
        select: { pagoEm: true, valor: true },
        orderBy: { pagoEm: 'asc' },
      }),
      this.prisma.usuario.findMany({
        where: {
          papel: { in: ['proprietario', 'operador'] as any },
          criadoEm: { gte: start },
        },
        select: { criadoEm: true, status: true },
        orderBy: { criadoEm: 'asc' },
      }),
      this.prisma.propriedade.findMany({
        select: { criadoEm: true, plano: true, quantidadeGado: true },
        orderBy: { criadoEm: 'asc' },
      }),
    ]);

    const revenueByMonth = new Map<string, number>();
    for (const row of payments) {
      if (!row.pagoEm) continue;
      const key = this.monthKey(row.pagoEm);
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + row.valor);
    }

    const revenueSeries = categories.map((c) => Number((revenueByMonth.get(c) ?? 0).toFixed(2)));

    const newSignupsByMonth = new Map<string, number>();
    const approvedByMonth = new Map<string, number>();
    const pendingByMonth = new Map<string, number>();
    const rejectedByMonth = new Map<string, number>();

    for (const u of tenantUsers) {
      const key = this.monthKey(u.criadoEm);
      newSignupsByMonth.set(key, (newSignupsByMonth.get(key) ?? 0) + 1);
      if ((u.status as any) === 'ativo') approvedByMonth.set(key, (approvedByMonth.get(key) ?? 0) + 1);
      else if ((u.status as any) === 'rejeitado') rejectedByMonth.set(key, (rejectedByMonth.get(key) ?? 0) + 1);
      else pendingByMonth.set(key, (pendingByMonth.get(key) ?? 0) + 1);
    }

    const newSignupsSeries = categories.map((c) => newSignupsByMonth.get(c) ?? 0);
    const approvedSeries = categories.map((c) => approvedByMonth.get(c) ?? 0);
    const pendingSeries = categories.map((c) => pendingByMonth.get(c) ?? 0);
    const rejectedSeries = categories.map((c) => rejectedByMonth.get(c) ?? 0);

    // Cálculo simples de "clientes ativos" por mês (aprox): acumulado de aprovados
    let activeAcc = 0;
    const activeSeries = categories.map((c) => {
      activeAcc += approvedByMonth.get(c) ?? 0;
      return activeAcc;
    });

    const planLabels = ['porteira', 'piquete', 'retiro', 'estancia', 'barao'];
    const planCounts = new Map<string, number>();
    for (const p of properties) {
      const key = String(p.plano);
      planCounts.set(key, (planCounts.get(key) ?? 0) + 1);
    }
    const planSeries = planLabels.map((l) => planCounts.get(l) ?? 0);

    // Não existe histórico de gado; usamos o total atual repetido como série (mantém UI)
    const cattleSeries = categories.map(() => kpis.totalCattle);

    return {
      kpis,
      categories,
      clientGrowth: {
        activeTenants: activeSeries,
        newSignups: newSignupsSeries,
      },
      revenue: {
        mrr: revenueSeries,
      },
      planDistribution: {
        labels: planLabels,
        series: planSeries,
      },
      cattle: {
        total: cattleSeries,
      },
      conversion: {
        approved: approvedSeries,
        pending: pendingSeries,
        rejected: rejectedSeries,
      },
    };
  }

  // --- User Management ---

  listPendingUsers() {
    return this.prisma.usuario.findMany({
      where: { status: 'pendente_aprovacao' as any },
      include: { propriedades: { include: { propriedade: true } } },
      orderBy: { criadoEm: 'desc' }
    });
  }

  async approveUser(userId: string, dto: ApproveUserDto) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        status: (dto.status as any) || ('ativo' as any),
      },
    });

    // Log audit
    await this.createAuditLog(
      'SYSTEM', // TODO: Get actual admin ID from context
      'Sistema',
      'USER_APPROVED',
      `Usuário ${user.email} aprovado com status ${updated.status}`,
      '127.0.0.1' // TODO: Get actual IP
    );

    return updated;
  }

  async impersonateUser(adminUser: { id: string; cpfCnpj?: string }, userId: string) {
    const target = await (this.prisma as any).usuario.findUnique({
      where: { id: userId },
    });
    if (!target) throw new NotFoundException('Usuário não encontrado');

    const payload: any = {
      sub: target.id,
      role: target.papel,
      cpfCnpj: target.cpfCnpj,
      impersonatedBy: adminUser.id,
      impersonatedUserId: target.id,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: 60 * 15,
    });

    await this.createAuditLog(
      adminUser.id,
      'SuperAdmin',
      'ADMIN_IMPERSONATE',
      `Impersonate iniciado para ${target.email}`,
      '127.0.0.1'
    );

    return { token };
  }

  async updateUserStatus(userId: string, dto: { status: string; reason?: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const nextStatus = (dto?.status as any) ?? user.status;

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        status: nextStatus,
      },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'USER_STATUS_UPDATED',
      `Status do usuário ${user.email} alterado para ${updated.status}${dto?.reason ? `: ${dto.reason}` : ''}`,
      '127.0.0.1'
    );

    return updated;
  }

  async resetUserPassword(userId: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { senha: passwordHash },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'USER_PASSWORD_RESET',
      `Senha resetada para ${user.email}`,
      '127.0.0.1'
    );

    return { tempPassword };
  }

  async updateUser(userId: string, dto: { cpfCnpj?: string; telefone?: string | null; email?: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        ...(dto?.cpfCnpj !== undefined ? { cpfCnpj: dto.cpfCnpj } : {}),
        ...(dto?.telefone !== undefined ? { telefone: dto.telefone } : {}),
        ...(dto?.email !== undefined ? { email: dto.email } : {}),
      },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'USER_UPDATED',
      `Dados do usuário ${user.email} atualizados`,
      '127.0.0.1'
    );

    return updated;
  }

  async updateUserPlan(userId: string, dto: { plan: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const requested = String(dto?.plan ?? '').toLowerCase();

    const latest = await this.prisma.assinatura.findFirst({
      where: { usuarioId: userId },
      orderBy: { inicioEm: 'desc' },
    });

    const updated = latest
      ? await this.prisma.assinatura.update({
          where: { id: latest.id },
          data: { plano: requested as any },
        })
      : await this.prisma.assinatura.create({
          data: {
            usuarioId: userId,
            plano: requested as any,
            status: 'ativa' as any,
            inicioEm: new Date(),
          },
        });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'USER_PLAN_UPDATED',
      `Plano do usuário ${user.email} alterado para ${requested}`,
      '127.0.0.1'
    );

    return updated;
  }

  async rejectUser(userId: string, dto?: { reason?: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        status: 'rejeitado' as any,
      },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'USER_REJECTED',
      `Usuário ${user.email} rejeitado${dto?.reason ? `: ${dto.reason}` : ''}`,
      '127.0.0.1'
    );

    return updated;
  }

  listTenants() {
    return this.prisma.usuario.findMany({
      where: { papel: { in: ['proprietario', 'operador'] as any } },
      include: { propriedades: { include: { propriedade: true } } },
      orderBy: { criadoEm: 'desc' }
    });
  }

  // --- Regulations ---

  async listRegulations() {
    return this.prisma.regulamentacaoEstadual.findMany({
      orderBy: { nomeEstado: 'asc' }
    });
  }

  async createRegulation(dto: CreateRegulationDto, adminName: string) {
    return (this.prisma as any).regulamentacaoEstadual.create({
      data: {
        ...dto,
        atualizadoPor: adminName
      }
    });
  }

  async updateRegulation(id: string, dto: UpdateRegulationDto, adminName: string) {
    return (this.prisma as any).regulamentacaoEstadual.update({
      where: { id },
      data: {
        ...dto,
        atualizadoPor: adminName
      }
    });
  }

  async deleteRegulation(id: string) {
    return (this.prisma as any).regulamentacaoEstadual.delete({ where: { id } });
  }

  // --- Financial ---

  async listPayments() {
    return (this.prisma as any).pagamentoFinanceiro.findMany({
      orderBy: { criadoEm: 'desc' }
    });
  }

  async createPayment(dto: CreatePaymentDto) {
    return this.prisma.pagamentoFinanceiro.create({
      data: {
        tenantId: dto.tenantId,
        tenantName: dto.tenantName,
        plano: dto.plan,
        valor: dto.amount,
        metodoPagamento: dto.paymentMethod,
        frequenciaPagamento: dto.paymentFrequency,
        status: dto.status,
        vencimentoEm: new Date(dto.dueDate),
        pagoEm: dto.paidAt ? new Date(dto.paidAt) : null,
      }
    });
  }

  // --- Pix Config ---

  async getPixConfig() {
    const row = await (this.prisma as any).configuracaoPix.findFirst({
      orderBy: { criadoEm: 'desc' },
    });

    if (!row) return null;

    return {
      id: row.id,
      pixKey: row.chavePix,
      pixKeyType: row.tipoChavePix,
      qrCodeImage: row.imagemQrCode ?? null,
      active: row.ativo,
      createdAt: row.criadoEm,
      updatedAt: row.atualizadoEm,
    };
  }

  async updatePixConfig(dto: UpdatePixConfigDto) {
    const current = await (this.prisma as any).configuracaoPix.findFirst();
    if (current) {
      return (this.prisma as any).configuracaoPix.update({
        where: { id: current.id },
        data: {
          chavePix: dto.pixKey,
          tipoChavePix: dto.pixKeyType,
          imagemQrCode: dto.qrCodeImage,
          ativo: dto.active,
        },
      });
    } else {
      return (this.prisma as any).configuracaoPix.create({
        data: {
          chavePix: dto.pixKey,
          tipoChavePix: dto.pixKeyType,
          imagemQrCode: dto.qrCodeImage,
          ativo: dto.active,
        },
      });
    }
  }

  // --- Planos SaaS (Admin) ---

  async listPlans() {
    return (this.prisma as any).planoSaas.findMany({
      orderBy: { preco: 'asc' },
    });
  }

  async createPlan(dto: {
    name: string;
    price: number;
    maxCattle?: number | null;
    features?: string[];
    active?: boolean;
  }) {
    return (this.prisma as any).planoSaas.create({
      data: {
        nome: dto.name,
        preco: dto.price,
        maxCabecas: dto.maxCattle ?? null,
        recursos: dto.features ?? [],
        ativo: dto.active ?? true,
      },
    });
  }

  async updatePlan(id: string, dto: {
    name?: string;
    price?: number;
    maxCattle?: number | null;
    features?: string[];
    active?: boolean;
  }) {
    return (this.prisma as any).planoSaas.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { nome: dto.name } : {}),
        ...(dto.price !== undefined ? { preco: dto.price } : {}),
        ...(dto.maxCattle !== undefined ? { maxCabecas: dto.maxCattle } : {}),
        ...(dto.features !== undefined ? { recursos: dto.features } : {}),
        ...(dto.active !== undefined ? { ativo: dto.active } : {}),
      },
    });
  }

  async deletePlan(id: string) {
    return (this.prisma as any).planoSaas.delete({ where: { id } });
  }

  // --- Indicação (Admin) ---

  async listCoupons() {
    return (this.prisma as any).cupomIndicacao.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async createCoupon(dto: {
    code: string;
    type: string;
    value: number;
    maxUsage?: number | null;
    commission?: number;
    createdBy: string;
    status?: string;
  }) {
    return (this.prisma as any).cupomIndicacao.create({
      data: {
        codigo: dto.code,
        tipo: dto.type,
        valor: dto.value,
        maxUso: dto.maxUsage ?? null,
        comissao: dto.commission ?? 0,
        criadoPor: dto.createdBy,
        status: dto.status ?? 'active',
      },
    });
  }

  async listReferrers() {
    return (this.prisma as any).indicadorParceiro.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  // --- Comunicação (Admin) ---

  async listCommunications() {
    return (this.prisma as any).comunicacaoAdmin.findMany({
      orderBy: { enviadoEm: 'desc' },
      take: 200,
    });
  }

  async createCommunication(dto: {
    type: string;
    title: string;
    message: string;
    sentAt?: string;
    recipients: number;
    status: string;
    targetAudience: string;
    color?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return (this.prisma as any).comunicacaoAdmin.create({
      data: {
        tipo: dto.type,
        titulo: dto.title,
        mensagem: dto.message,
        enviadoEm: dto.sentAt ? new Date(dto.sentAt) : new Date(),
        destinatarios: dto.recipients,
        status: dto.status,
        publicoAlvo: dto.targetAudience,
        cor: dto.color ?? null,
        inicioEm: dto.startDate ? new Date(dto.startDate) : null,
        fimEm: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async deleteCommunication(id: string) {
    return (this.prisma as any).comunicacaoAdmin.delete({ where: { id } });
  }

  async updateCommunication(
    id: string,
    dto: Partial<{
      type: string;
      title: string;
      message: string;
      sentAt: string;
      recipients: number;
      status: string;
      targetAudience: string;
      color: string | null;
      startDate: string | null;
      endDate: string | null;
    }>,
  ) {
    return (this.prisma as any).comunicacaoAdmin.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { tipo: dto.type } : {}),
        ...(dto.title !== undefined ? { titulo: dto.title } : {}),
        ...(dto.message !== undefined ? { mensagem: dto.message } : {}),
        ...(dto.sentAt !== undefined ? { enviadoEm: new Date(dto.sentAt) } : {}),
        ...(dto.recipients !== undefined ? { destinatarios: dto.recipients } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.targetAudience !== undefined ? { publicoAlvo: dto.targetAudience } : {}),
        ...(dto.color !== undefined ? { cor: dto.color } : {}),
        ...(dto.startDate !== undefined ? { inicioEm: dto.startDate ? new Date(dto.startDate) : null } : {}),
        ...(dto.endDate !== undefined ? { fimEm: dto.endDate ? new Date(dto.endDate) : null } : {}),
      },
    });
  }

  async getDashboardActivity(limit?: number) {
    const take = limit && Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.trunc(limit))) : 10;

    const logs = await (this.prisma as any).logAuditoria.findMany({
      orderBy: { dataHora: 'desc' },
      take,
    });

    return logs.map((l: any) => ({
      id: l.id,
      action: l.acao,
      details: l.detalhes,
      userName: l.usuarioNome,
      timestamp: l.dataHora,
    }));
  }

  // --- Audit Logs ---

  async listAuditLogs(userId?: string) {
    return (this.prisma as any).logAuditoria.findMany({
      where: userId ? { usuarioId: userId } : undefined,
      orderBy: { dataHora: 'desc' },
      take: 100
    });
  }

  async createAuditLog(userId: string, userName: string, action: string, details: string, ip: string) {
    return (this.prisma as any).logAuditoria.create({
      data: {
        usuarioId: userId,
        usuarioNome: userName,
        acao: action,
        detalhes: details,
        ip: ip
      }
    });
  }

  async getFinancialReport() {
    return {
      totalRevenue: 15000,
      activeSubscriptions: 45,
      mrr: 3500,
      churnRate: 2.5,
      arpu: 77.78,
    };
  }

  async listRequests() {
    return this.prisma.solicitacaoPendente.findMany({
      orderBy: { enviadoEm: 'desc' },
      take: 100,
    });
  }

  async approveRequest(id: string, dto: { reason?: string }) {
    const current = await this.prisma.solicitacaoPendente.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Solicitação não encontrada');

    const updated = await this.prisma.solicitacaoPendente.update({
      where: { id },
      data: { status: 'approved' },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'approve',
      `Solicitação ${id} aprovada${dto?.reason ? `: ${dto.reason}` : ''}`,
      '127.0.0.1'
    );

    return updated;
  }

  async rejectRequest(id: string, dto: { reason: string }) {
    const current = await this.prisma.solicitacaoPendente.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Solicitação não encontrada');

    const updated = await this.prisma.solicitacaoPendente.update({
      where: { id },
      data: { status: 'rejected', observacoes: dto?.reason ?? current.observacoes },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'reject',
      `Solicitação ${id} rejeitada${dto?.reason ? `: ${dto.reason}` : ''}`,
      '127.0.0.1'
    );

    return updated;
  }
}
