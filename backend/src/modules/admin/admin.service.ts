import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ApproveUserDto } from './dto/approve-user.dto';
import { CreateRegulationDto, UpdateRegulationDto } from './dto/regulation.dto';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { UpdatePixConfigDto } from './dto/pix-config.dto';
import { UpdateCompanySettingsDto } from './dto/company-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private getPlanRank(planId: string) {
    const order = ['porteira', 'piquete', 'retiro', 'estancia', 'barao'];
    const idx = order.indexOf((planId ?? '').toLowerCase());
    return idx === -1 ? 0 : idx;
  }

  private getRequiredPlanByTotalCattle(totalCattle: number) {
    if (totalCattle <= 500) return 'porteira';
    if (totalCattle <= 1000) return 'piquete';
    if (totalCattle <= 2000) return 'retiro';
    if (totalCattle <= 3000) return 'estancia';
    return 'barao';
  }

  getPlansCatalog() {
    return [
      { id: 'porteira', name: 'Porteira', price: 49.9, maxCattle: 500 },
      { id: 'piquete', name: 'Piquete', price: 99.9, maxCattle: 1000 },
      { id: 'retiro', name: 'Retiro', price: 149.9, maxCattle: 2000 },
      { id: 'estancia', name: 'Estância', price: 249.9, maxCattle: 3000 },
      { id: 'barao', name: 'Barão', price: 499.9, maxCattle: -1 },
    ];
  }

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
        where: {
          propriedade: {
            usuarios: {
              some: {
                usuario: {
                  papel: { in: ['proprietario', 'operador'] as any },
                },
              },
            },
          },
        } as any,
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
    const safeMonths = Number.isFinite(months)
      ? Math.max(1, Math.min(24, months))
      : 12;
    const now = new Date();

    const periodStart = new Date(
      now.getFullYear(),
      now.getMonth() - (safeMonths - 1),
      1,
    );
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
      series.push({
        month: key,
        value: Number((monthlyTotals.get(key) ?? 0).toFixed(2)),
      });
    }

    return series;
  }

  async getAnalytics(period?: string) {
    const now = new Date();
    const normalized = (period ?? '30d').toLowerCase();

    const months =
      normalized === '7d'
        ? 1
        : normalized === '90d'
          ? 3
          : normalized === '1y'
            ? 12
            : 6;
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

    const revenueSeries = categories.map((c) =>
      Number((revenueByMonth.get(c) ?? 0).toFixed(2)),
    );

    const newSignupsByMonth = new Map<string, number>();
    const approvedByMonth = new Map<string, number>();
    const pendingByMonth = new Map<string, number>();
    const rejectedByMonth = new Map<string, number>();

    for (const u of tenantUsers) {
      const key = this.monthKey(u.criadoEm);
      newSignupsByMonth.set(key, (newSignupsByMonth.get(key) ?? 0) + 1);
      if ((u.status as any) === 'ativo')
        approvedByMonth.set(key, (approvedByMonth.get(key) ?? 0) + 1);
      else if ((u.status as any) === 'rejeitado')
        rejectedByMonth.set(key, (rejectedByMonth.get(key) ?? 0) + 1);
      else pendingByMonth.set(key, (pendingByMonth.get(key) ?? 0) + 1);
    }

    const newSignupsSeries = categories.map(
      (c) => newSignupsByMonth.get(c) ?? 0,
    );
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
      orderBy: { criadoEm: 'desc' },
    });
  }

  async approveUser(userId: string, dto: ApproveUserDto, ip?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const trialDays =
      typeof dto.trialDays === 'number' && Number.isFinite(dto.trialDays)
        ? dto.trialDays
        : 0;
    const trialPlan = (dto.trialPlan ?? '').toLowerCase();

    const catalog = this.getPlansCatalog();
    const trialPlanItem = catalog.find((p) => p.id === trialPlan);
    const shouldCreateTrial = trialDays > 0 && Boolean(trialPlanItem);

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        status: (dto.status as any) || ('ativo' as any),
        statusFinanceiro: 'ok' as any,
      },
    });

    if (shouldCreateTrial) {
      const now = new Date();
      const end = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      const latest = await this.prisma.assinatura.findFirst({
        where: { usuarioId: userId },
        orderBy: { inicioEm: 'desc' },
      });

      if (latest) {
        await this.prisma.assinatura.update({
          where: { id: latest.id },
          data: {
            plano: trialPlan as any,
            status: 'ativa' as any,
            valorMensal: 0,
            inicioEm: now,
            fimEm: end,
          },
        });
      } else {
        await this.prisma.assinatura.create({
          data: {
            usuarioId: userId,
            plano: trialPlan as any,
            status: 'ativa' as any,
            valorMensal: 0,
            inicioEm: now,
            fimEm: end,
          },
        });
      }
    }

    // Log audit
    await this.createAuditLog(
      'SYSTEM', // TODO: Get actual admin ID from context
      'Sistema',
      'USER_APPROVED',
      `Usuário ${user.email} aprovado com status ${updated.status}`,
      ip ?? '127.0.0.1',
    );

    return updated;
  }

  async resetUserOnboarding(userId: string, dto: any, ip?: string) {
    const propertyId = String(dto?.propertyId ?? '').trim();
    if (!propertyId) {
      throw new BadRequestException('propertyId é obrigatório');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { propriedades: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const hasRelation = (user.propriedades ?? []).some(
      (p: any) => p?.propriedadeId === propertyId,
    );
    if (!hasRelation) {
      throw new NotFoundException('Propriedade não vinculada ao usuário');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rebanho.deleteMany({
        where: {
          propriedadeId: propertyId,
          especie: { in: ['bovino', 'bubalino'] },
        },
      });

      await (tx as any).loteRebanho.deleteMany({
        where: {
          propriedadeId: propertyId,
          especie: { in: ['bovino', 'bubalino'] },
        },
      });

      await tx.propriedade.update({
        where: { id: propertyId },
        data: { quantidadeGado: 0 },
      });

      await tx.usuario.update({
        where: { id: userId },
        data: { onboardingConcluidoEm: null } as any,
      });
    });

    await this.createAuditLog(
      'SYSTEM',
      'Admin',
      'ONBOARDING_RESET',
      `Onboarding resetado para usuário ${user.email} na propriedade ${propertyId}`,
      ip ?? '127.0.0.1',
    );

    return { success: true };
  }

  async liberarAcessoPosPagamento(userId: string, ip?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        statusFinanceiro: 'ok' as any,
        status: 'ativo' as any,
      },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'PAYMENT_RELEASE',
      `Acesso liberado após pagamento para ${user.email}`,
      ip ?? '127.0.0.1',
    );

    return updated;
  }

  async impersonateUser(
    adminUser: { id: string; cpfCnpj?: string },
    userId: string,
    ip?: string,
  ) {
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
      ip ?? '127.0.0.1',
    );

    return { token };
  }

  async updateUserStatus(
    userId: string,
    dto: { status: string; reason?: string },
    ip?: string,
  ) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
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
      ip ?? '127.0.0.1',
    );

    return updated;
  }

  async resetUserPassword(userId: string, ip?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
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
      ip ?? '127.0.0.1',
    );

    return { tempPassword };
  }

  async updateUser(
    userId: string,
    dto: { cpfCnpj?: string; telefone?: string | null; email?: string },
    ip?: string,
  ) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
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
      ip ?? '127.0.0.1',
    );

    return updated;
  }

  async updateUserPlan(userId: string, dto: { plan: string }, ip?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
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
      ip ?? '127.0.0.1',
    );

    return updated;
  }

  async rejectUser(userId: string, dto?: { reason?: string }, ip?: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });
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
      ip ?? '127.0.0.1',
    );

    return updated;
  }

  listTenants() {
    return this.prisma.usuario
      .findMany({
        where: { papel: { in: ['proprietario', 'operador'] as any } },
        include: {
          propriedades: {
            include: { propriedade: { include: { rebanho: true } } },
          },
          assinaturas: {
            orderBy: { inicioEm: 'desc' },
            take: 1,
          },
        },
        orderBy: { criadoEm: 'desc' },
      })
      .then((users) =>
        users.map((u: any) => {
          const properties = (u.propriedades ?? [])
            .map((up: any) => up.propriedade)
            .filter(Boolean);
          const propertyCount = properties.length;
          const cattleCount = properties.reduce((acc: number, p: any) => {
            const herdSum = (p?.rebanho ?? []).reduce(
              (s: number, r: any) => s + (Number(r?.cabecas) || 0),
              0,
            );
            return acc + herdSum;
          }, 0);
          const currentPlan = u.assinaturas?.[0]?.plano ?? null;

          return {
            ...u,
            properties,
            propertyCount,
            cattleCount,
            currentPlan,
          };
        }),
      );
  }

  // --- Regulations ---

  private mapRegulationToDto(row: any) {
    return {
      id: row.id,
      uf: row.uf,
      stateName: row.nomeEstado,
      reportingDeadline: row.prazoEntrega,
      requiredDocuments: row.documentosNecessarios ?? [],
      declarationFrequency: row.frequenciaDeclaracao,
      declarationPeriods: row.periodosDeclaracao,
      responsibleAgency: row.orgaoResponsavel,
      requiredVaccines: row.vacinasObrigatorias ?? [],
      notificationLeadDays: row.diasAvisoNotificacao ?? [],
      gtaRequired: row.gtaObrigatoria,
      observations: row.observacoes,
      updatedAt: row.atualizadoEm?.toISOString
        ? row.atualizadoEm.toISOString()
        : row.atualizadoEm,
      updatedBy: row.atualizadoPor,
    };
  }

  async listRegulations() {
    const rows = await this.prisma.regulamentacaoEstadual.findMany({
      orderBy: { nomeEstado: 'asc' },
    });

    return rows.map((r: any) => this.mapRegulationToDto(r));
  }

  async createRegulation(dto: CreateRegulationDto, adminName: string) {
    const created = await (this.prisma as any).regulamentacaoEstadual.create({
      data: {
        uf: dto.uf,
        nomeEstado: dto.stateName,
        prazoEntrega: dto.reportingDeadline,
        documentosNecessarios: dto.requiredDocuments ?? [],
        frequenciaDeclaracao: dto.declarationFrequency,
        periodosDeclaracao: dto.declarationPeriods ?? {},
        orgaoResponsavel: dto.responsibleAgency,
        vacinasObrigatorias: dto.requiredVaccines ?? [],
        diasAvisoNotificacao: dto.notificationLeadDays ?? [],
        gtaObrigatoria: dto.gtaRequired,
        observacoes: dto.observations,
        atualizadoPor: adminName,
      },
    });

    return this.mapRegulationToDto(created);
  }

  async updateRegulation(
    id: string,
    dto: UpdateRegulationDto,
    adminName: string,
  ) {
    const updated = await (this.prisma as any).regulamentacaoEstadual.update({
      where: { id },
      data: {
        ...(dto.uf !== undefined ? { uf: dto.uf } : {}),
        ...(dto.stateName !== undefined ? { nomeEstado: dto.stateName } : {}),
        ...(dto.reportingDeadline !== undefined
          ? { prazoEntrega: dto.reportingDeadline }
          : {}),
        ...(dto.requiredDocuments !== undefined
          ? { documentosNecessarios: dto.requiredDocuments }
          : {}),
        ...(dto.declarationFrequency !== undefined
          ? { frequenciaDeclaracao: dto.declarationFrequency }
          : {}),
        ...(dto.declarationPeriods !== undefined
          ? { periodosDeclaracao: dto.declarationPeriods }
          : {}),
        ...(dto.responsibleAgency !== undefined
          ? { orgaoResponsavel: dto.responsibleAgency }
          : {}),
        ...(dto.requiredVaccines !== undefined
          ? { vacinasObrigatorias: dto.requiredVaccines }
          : {}),
        ...(dto.notificationLeadDays !== undefined
          ? { diasAvisoNotificacao: dto.notificationLeadDays }
          : {}),
        ...(dto.gtaRequired !== undefined
          ? { gtaObrigatoria: dto.gtaRequired }
          : {}),
        ...(dto.observations !== undefined
          ? { observacoes: dto.observations }
          : {}),
        atualizadoPor: adminName,
      },
    });

    return this.mapRegulationToDto(updated);
  }

  async deleteRegulation(id: string) {
    return (this.prisma as any).regulamentacaoEstadual.delete({
      where: { id },
    });
  }

  // --- Financial ---

  private mapPaymentToDto(row: any) {
    return {
      id: row.id,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      plan: row.plano,
      amount: row.valor,
      paymentMethod: row.metodoPagamento,
      paymentFrequency: row.frequenciaPagamento,
      status: row.status,
      dueDate: row.vencimentoEm?.toISOString
        ? row.vencimentoEm.toISOString()
        : row.vencimentoEm,
      paidAt: row.pagoEm?.toISOString ? row.pagoEm.toISOString() : row.pagoEm,
      cattleCountAtPayment: row.cabecasNoPagamento ?? null,
      createdAt: row.criadoEm?.toISOString
        ? row.criadoEm.toISOString()
        : row.criadoEm,
    };
  }

  private async getCattleCountSnapshotForTenant(tenantId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { cpfCnpj: tenantId },
      select: { id: true },
    });
    if (!user?.id) return null;

    const propAgg = await this.prisma.propriedade.aggregate({
      _sum: { quantidadeGado: true },
      where: {
        usuarios: {
          some: {
            usuarioId: user.id,
          },
        },
      },
    });
    return propAgg._sum?.quantidadeGado ?? 0;
  }

  async listPayments() {
    const rows = await (this.prisma as any).pagamentoFinanceiro.findMany({
      orderBy: { criadoEm: 'desc' },
    });

    return rows.map((r: any) => this.mapPaymentToDto(r));
  }

  async createPayment(dto: CreatePaymentDto) {
    const snapshot = dto.paidAt
      ? await this.getCattleCountSnapshotForTenant(dto.tenantId)
      : null;

    const created = await (this.prisma as any).pagamentoFinanceiro.create({
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
        cabecasNoPagamento: dto.paidAt ? snapshot : null,
      },
    });

    return this.mapPaymentToDto(created);
  }

  async updatePayment(paymentId: string, dto: UpdatePaymentDto) {
    const existing = await (this.prisma as any).pagamentoFinanceiro.findUnique({
      where: { id: paymentId },
    });
    if (!existing) throw new NotFoundException('Pagamento não encontrado');

    const willSetPaidAt = dto.paidAt !== undefined;
    const nextPaidAt = willSetPaidAt
      ? dto.paidAt
        ? new Date(dto.paidAt)
        : null
      : (existing.pagoEm ?? null);

    const shouldUpdateSnapshot =
      willSetPaidAt &&
      nextPaidAt &&
      (existing.cabecasNoPagamento === null ||
        existing.cabecasNoPagamento === undefined);

    const snapshot = shouldUpdateSnapshot
      ? await this.getCattleCountSnapshotForTenant(existing.tenantId)
      : null;

    const updated = await (this.prisma as any).pagamentoFinanceiro.update({
      where: { id: paymentId },
      data: {
        ...(dto.plan !== undefined ? { plano: dto.plan } : {}),
        ...(dto.amount !== undefined ? { valor: dto.amount } : {}),
        ...(dto.paymentMethod !== undefined
          ? { metodoPagamento: dto.paymentMethod }
          : {}),
        ...(dto.paymentFrequency !== undefined
          ? { frequenciaPagamento: dto.paymentFrequency }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.dueDate !== undefined
          ? { vencimentoEm: new Date(dto.dueDate) }
          : {}),
        ...(dto.paidAt !== undefined
          ? { pagoEm: dto.paidAt ? new Date(dto.paidAt) : null }
          : {}),
        ...(shouldUpdateSnapshot ? { cabecasNoPagamento: snapshot } : {}),
      },
    });

    return this.mapPaymentToDto(updated);
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

  // --- Configurações Gerais (Empresa) ---

  async getCompanySettings() {
    const row = await (this.prisma as any).configuracaoEmpresa.findFirst({
      orderBy: { criadoEm: 'desc' },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      nome: row.nome,
      cnpj: row.cnpj,
      telefone: row.telefone ?? null,
      email: row.email ?? null,
      endereco: row.endereco ?? null,
      site: row.site ?? null,
      criadoEm: row.criadoEm,
      atualizadoEm: row.atualizadoEm,
    };
  }

  async updateCompanySettings(
    dto: UpdateCompanySettingsDto,
    ctx: { userId?: string; cpfCnpj?: string; ip?: string },
  ) {
    const current = await (this.prisma as any).configuracaoEmpresa.findFirst();

    const saved = current
      ? await (this.prisma as any).configuracaoEmpresa.update({
          where: { id: current.id },
          data: {
            nome: dto.nome,
            cnpj: dto.cnpj,
            telefone: dto.telefone ?? null,
            email: dto.email ?? null,
            endereco: dto.endereco ?? null,
            site: dto.site ?? null,
          },
        })
      : await (this.prisma as any).configuracaoEmpresa.create({
          data: {
            nome: dto.nome,
            cnpj: dto.cnpj,
            telefone: dto.telefone ?? null,
            email: dto.email ?? null,
            endereco: dto.endereco ?? null,
            site: dto.site ?? null,
          },
        });

    await this.createAuditLog(
      ctx.userId ?? 'SYSTEM',
      ctx.cpfCnpj ?? 'SuperAdmin',
      'COMPANY_SETTINGS_UPDATED',
      `Configurações gerais atualizadas (CNPJ: ${dto.cnpj})`,
      ctx.ip ?? '127.0.0.1',
    );

    return {
      id: saved.id,
      nome: saved.nome,
      cnpj: saved.cnpj,
      telefone: saved.telefone ?? null,
      email: saved.email ?? null,
      endereco: saved.endereco ?? null,
      site: saved.site ?? null,
      criadoEm: saved.criadoEm,
      atualizadoEm: saved.atualizadoEm,
    };
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
    additionalChargeEnabled?: boolean;
    additionalChargePerHead?: number;
    features?: string[];
    active?: boolean;
  }) {
    return (this.prisma as any).planoSaas.create({
      data: {
        nome: dto.name,
        preco: dto.price,
        maxCabecas: dto.maxCattle ?? null,
        cobrancaAdicionalAtiva: dto.additionalChargeEnabled ?? false,
        valorCobrancaAdicional: dto.additionalChargePerHead ?? 0.1,
        recursos: dto.features ?? [],
        ativo: dto.active ?? true,
      },
    });
  }

  async updatePlan(
    id: string,
    dto: {
      name?: string;
      price?: number;
      maxCattle?: number | null;
      additionalChargeEnabled?: boolean;
      additionalChargePerHead?: number;
      features?: string[];
      active?: boolean;
    },
  ) {
    return (this.prisma as any).planoSaas.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { nome: dto.name } : {}),
        ...(dto.price !== undefined ? { preco: dto.price } : {}),
        ...(dto.maxCattle !== undefined ? { maxCabecas: dto.maxCattle } : {}),
        ...(dto.additionalChargeEnabled !== undefined
          ? { cobrancaAdicionalAtiva: dto.additionalChargeEnabled }
          : {}),
        ...(dto.additionalChargePerHead !== undefined
          ? { valorCobrancaAdicional: dto.additionalChargePerHead }
          : {}),
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
    referrerName?: string;
    referrerCpfCnpj?: string;
    referrerPhone?: string;
  }) {
    const code = String(dto.code ?? '')
      .trim()
      .toUpperCase();

    const created = await (this.prisma as any).cupomIndicacao.create({
      data: {
        codigo: code,
        tipo: dto.type,
        valor: dto.value,
        maxUso: dto.maxUsage ?? null,
        comissao: dto.commission ?? 0,
        criadoPor: dto.createdBy,
        status: dto.status ?? 'active',
      },
    });

    if (String(dto.type ?? '').toLowerCase() === 'referral') {
      const name =
        typeof dto.referrerName === 'string' ? dto.referrerName.trim() : '';
      const cpfCnpj =
        typeof dto.referrerCpfCnpj === 'string'
          ? dto.referrerCpfCnpj.trim()
          : '';
      const phone =
        typeof dto.referrerPhone === 'string' ? dto.referrerPhone.trim() : '';

      if (name) {
        await (this.prisma as any).indicadorParceiro.upsert({
          where: { codigo: code },
          create: {
            nome: name,
            codigo: code,
            ...(cpfCnpj ? { cpfCnpj } : {}),
            ...(phone ? { telefone: phone } : {}),
            status: 'active',
          },
          update: {
            nome: name,
            ...(cpfCnpj ? { cpfCnpj } : {}),
            ...(phone ? { telefone: phone } : {}),
          },
        });
      }
    }

    return created;
  }

  async updateCoupon(id: string, dto: { status?: string }) {
    return (this.prisma as any).cupomIndicacao.update({
      where: { id },
      data: {
        ...(dto?.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async listReferrers() {
    return (this.prisma as any).indicadorParceiro.findMany({
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listCouponUsages() {
    const [paidPayments, requests] = await Promise.all([
      (this.prisma as any).pagamentoFinanceiro.findMany({
        where: {
          status: 'paid',
          pagoEm: { not: null },
        },
        select: {
          tenantId: true,
          pagoEm: true,
          plano: true,
          valor: true,
        },
        orderBy: { pagoEm: 'desc' },
        take: 500,
      }),
      this.prisma.solicitacaoPendente.findMany({
        where: { tipo: 'signup' },
        select: {
          cpfCnpj: true,
          observacoes: true,
        },
        orderBy: { enviadoEm: 'desc' },
        take: 1000,
      }),
    ]);

    const couponByCpfCnpj = new Map<string, string>();
    for (const r of requests ?? []) {
      const cpfCnpj = String(r.cpfCnpj ?? '').trim();
      if (!cpfCnpj) continue;

      let referralCoupon: string | undefined;
      if (r.observacoes) {
        try {
          const parsed = JSON.parse(r.observacoes);
          referralCoupon =
            typeof parsed?.referralCoupon === 'string'
              ? parsed.referralCoupon
              : undefined;
        } catch {
          // ignore
        }
      }
      if (referralCoupon && String(referralCoupon).trim()) {
        couponByCpfCnpj.set(
          cpfCnpj,
          String(referralCoupon).trim().toUpperCase(),
        );
      }
    }

    const usages = (paidPayments ?? [])
      .map((p: any) => {
        const cpfCnpj = String(p.tenantId ?? '').trim();
        const coupon = cpfCnpj ? couponByCpfCnpj.get(cpfCnpj) : undefined;
        if (!coupon) return null;

        return {
          cpfCnpj,
          coupon,
          paidAt: p.pagoEm,
          plan: p.plano,
          amount: p.valor,
        };
      })
      .filter(Boolean);

    return usages;
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
        ...(dto.sentAt !== undefined
          ? { enviadoEm: new Date(dto.sentAt) }
          : {}),
        ...(dto.recipients !== undefined
          ? { destinatarios: dto.recipients }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.targetAudience !== undefined
          ? { publicoAlvo: dto.targetAudience }
          : {}),
        ...(dto.color !== undefined ? { cor: dto.color } : {}),
        ...(dto.startDate !== undefined
          ? { inicioEm: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { fimEm: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
    });
  }

  async getDashboardActivity(limit?: number) {
    const take =
      limit && Number.isFinite(limit)
        ? Math.max(1, Math.min(50, Math.trunc(limit)))
        : 10;

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

  async listAuditLogs(params?: {
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const takeRaw = params?.limit;
    const skipRaw = params?.offset;

    const take =
      typeof takeRaw === 'number' && Number.isFinite(takeRaw)
        ? Math.max(1, Math.min(200, Math.trunc(takeRaw)))
        : 100;
    const skip =
      typeof skipRaw === 'number' && Number.isFinite(skipRaw)
        ? Math.max(0, Math.trunc(skipRaw))
        : 0;

    const where: any = {
      ...(params?.userId ? { usuarioId: params.userId } : {}),
      ...(params?.action ? { acao: params.action } : {}),
    };

    if (params?.startDate || params?.endDate) {
      const gte = params?.startDate ? new Date(params.startDate) : undefined;
      const lte = params?.endDate ? new Date(params.endDate) : undefined;
      where.dataHora = {
        ...(gte ? { gte } : {}),
        ...(lte ? { lte } : {}),
      };
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).logAuditoria.findMany({
        where,
        orderBy: { dataHora: 'desc' },
        take,
        skip,
      }),
      (this.prisma as any).logAuditoria.count({ where }),
    ]);

    return {
      items,
      total,
      limit: take,
      offset: skip,
    };
  }

  // --- Activity Logs ---

  async listActivityLogs(params?: {
    tenantId?: string;
    event?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const takeRaw = params?.limit;
    const skipRaw = params?.offset;

    const take =
      typeof takeRaw === 'number' && Number.isFinite(takeRaw)
        ? Math.max(1, Math.min(200, Math.trunc(takeRaw)))
        : 50;
    const skip =
      typeof skipRaw === 'number' && Number.isFinite(skipRaw)
        ? Math.max(0, Math.trunc(skipRaw))
        : 0;

    const where: any = {
      ...(params?.tenantId ? { usuarioId: params.tenantId } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.event ? { evento: params.event } : {}),
      ...(params?.includeArchived ? {} : { arquivadoEm: null }),
    };

    if (params?.startDate || params?.endDate) {
      const gte = params?.startDate ? new Date(params.startDate) : undefined;
      const lte = params?.endDate ? new Date(params.endDate) : undefined;
      where.dataHora = {
        ...(gte ? { gte } : {}),
        ...(lte ? { lte } : {}),
      };
    }

    const activityModel = (this.prisma as any).logAtividade;
    if (!activityModel?.findMany || !activityModel?.count) {
      return {
        items: [],
        total: 0,
        limit: take,
        offset: skip,
      };
    }

    const [items, total] = await Promise.all([
      activityModel.findMany({
        where,
        orderBy: { dataHora: 'desc' },
        take,
        skip,
      }),
      activityModel.count({ where }),
    ]);

    return {
      items,
      total,
      limit: take,
      offset: skip,
    };
  }

  async archiveActivityLogs(ids: string[]) {
    if (!ids?.length) {
      throw new BadRequestException('ids é obrigatório');
    }

    const activityModel = (this.prisma as any).logAtividade;
    if (!activityModel?.updateMany) {
      return { updated: 0 };
    }

    const result = await activityModel.updateMany({
      where: { id: { in: ids } },
      data: { arquivadoEm: new Date() },
    });

    return { updated: result.count };
  }

  async unarchiveActivityLogs(ids: string[]) {
    if (!ids?.length) {
      throw new BadRequestException('ids é obrigatório');
    }

    const activityModel = (this.prisma as any).logAtividade;
    if (!activityModel?.updateMany) {
      return { updated: 0 };
    }

    const result = await activityModel.updateMany({
      where: { id: { in: ids } },
      data: { arquivadoEm: null },
    });

    return { updated: result.count };
  }

  async deleteActivityLogs(ids: string[]) {
    if (!ids?.length) {
      throw new BadRequestException('ids é obrigatório');
    }

    const activityModel = (this.prisma as any).logAtividade;
    if (!activityModel?.deleteMany) {
      return { deleted: 0 };
    }

    const result = await activityModel.deleteMany({
      where: { id: { in: ids } },
    });

    return { deleted: result.count };
  }

  async createAuditLog(
    userId: string,
    userName: string,
    action: string,
    details: string,
    ip: string,
  ) {
    return (this.prisma as any).logAuditoria.create({
      data: {
        usuarioId: userId,
        usuarioNome: userName,
        acao: action,
        detalhes: details,
        ip: ip,
      },
    });
  }

  async getFinancialReport() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [paidPayments, activeTenantsCount, overdueTenantsCount] =
      await Promise.all([
        this.prisma.pagamentoFinanceiro.findMany({
          where: { status: 'paid' as any },
          select: {
            valor: true,
            pagoEm: true,
            frequenciaPagamento: true,
          },
        }),
        this.prisma.usuario.count({
          where: {
            papel: { in: ['proprietario', 'operador'] as any },
            status: 'ativo' as any,
          },
        }),
        this.prisma.usuario.count({
          where: {
            papel: { in: ['proprietario', 'operador'] as any },
            statusFinanceiro: 'inadimplente' as any,
          },
        }),
      ]);

    const totalRevenue = paidPayments.reduce(
      (sum, p) => sum + Number(p.valor ?? 0),
      0,
    );

    const mrr = paidPayments
      .filter(
        (p) =>
          String(p.frequenciaPagamento ?? '').toLowerCase() === 'monthly' &&
          p.pagoEm &&
          p.pagoEm >= monthStart,
      )
      .reduce((sum, p) => sum + Number(p.valor ?? 0), 0);

    const arpu = activeTenantsCount > 0 ? mrr / activeTenantsCount : 0;

    const totalTenantsBase = activeTenantsCount + overdueTenantsCount;
    const churnRate =
      totalTenantsBase > 0 ? (overdueTenantsCount / totalTenantsBase) * 100 : 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      activeSubscriptions: activeTenantsCount,
      mrr: Number(mrr.toFixed(2)),
      churnRate: Number(churnRate.toFixed(2)),
      arpu: Number(arpu.toFixed(2)),
    };
  }

  async listRequests() {
    return this.prisma.solicitacaoPendente.findMany({
      orderBy: { enviadoEm: 'desc' },
      take: 100,
    });
  }

  async approveRequest(id: string, dto: { reason?: string }) {
    const current = await this.prisma.solicitacaoPendente.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Solicitação não encontrada');

    const requestType = String(current.tipo ?? '').toLowerCase();

    if (requestType === 'signup') {
      const cpfCnpj = String(current.cpfCnpj ?? '').replace(/\D/g, '');
      const user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { cpfCnpj },
            {
              email: String(current.email ?? '')
                .trim()
                .toLowerCase(),
            },
          ],
        },
      });

      if (user) {
        const anyDto = dto as any;
        const trialDays =
          typeof anyDto?.trialDays === 'number' &&
          Number.isFinite(anyDto.trialDays)
            ? anyDto.trialDays
            : 0;
        const trialPlan =
          typeof anyDto?.trialPlan === 'string'
            ? String(anyDto.trialPlan).toLowerCase()
            : '';

        await this.prisma.usuario.update({
          where: { id: user.id },
          data: {
            status: 'ativo' as any,
            statusFinanceiro: 'ok' as any,
          },
        });

        const catalog = this.getPlansCatalog();
        const trialPlanItem = catalog.find((p) => p.id === trialPlan);
        const shouldCreateTrial = trialDays > 0 && Boolean(trialPlanItem);

        if (shouldCreateTrial) {
          const now = new Date();
          const end = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

          const latest = await this.prisma.assinatura.findFirst({
            where: { usuarioId: user.id },
            orderBy: { inicioEm: 'desc' },
          });

          if (latest) {
            await this.prisma.assinatura.update({
              where: { id: latest.id },
              data: {
                plano: trialPlan as any,
                status: 'ativa' as any,
                valorMensal: 0,
                inicioEm: now,
                fimEm: end,
              },
            });
          } else {
            await this.prisma.assinatura.create({
              data: {
                usuarioId: user.id,
                plano: trialPlan as any,
                status: 'ativa' as any,
                valorMensal: 0,
                inicioEm: now,
                fimEm: end,
              },
            });
          }
        }
      }
    }

    // Downgrade é manual: ao aprovar uma solicitação de downgrade, atualizamos a assinatura.
    if (requestType === 'plan_downgrade') {
      const requested = String(current.plano ?? '').toLowerCase();
      const catalog = this.getPlansCatalog();
      const requestedPlan = catalog.find((p) => p.id === requested);

      if (requestedPlan) {
        const user = await this.prisma.usuario.findFirst({
          where: { cpfCnpj: current.cpfCnpj },
        });

        if (user) {
          const latest = await this.prisma.assinatura.findFirst({
            where: { usuarioId: user.id },
            orderBy: { inicioEm: 'desc' },
          });

          if (latest) {
            const propAgg = await this.prisma.propriedade.aggregate({
              _sum: { quantidadeGado: true },
              where: {
                usuarios: {
                  some: {
                    usuarioId: user.id,
                  },
                },
              },
            });
            const totalCattle = propAgg._sum?.quantidadeGado ?? 0;
            const requiredPlan = this.getRequiredPlanByTotalCattle(totalCattle);

            const requestedRank = this.getPlanRank(requested);
            const requiredRank = this.getPlanRank(requiredPlan);

            // Se o rebanho atual exige um plano maior, não pode efetivar downgrade.
            if (requestedRank >= requiredRank) {
              await this.prisma.assinatura.update({
                where: { id: latest.id },
                data: {
                  plano: requested as any,
                  valorMensal: requestedPlan.price,
                },
              });
            }
          }
        }
      }
    }

    const updated = await this.prisma.solicitacaoPendente.update({
      where: { id },
      data: { status: 'approved' },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'approve',
      `Solicitação ${id} aprovada${dto?.reason ? `: ${dto.reason}` : ''}`,
      '127.0.0.1',
    );

    return updated;
  }

  async rejectRequest(id: string, dto: { reason: string }) {
    const current = await this.prisma.solicitacaoPendente.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Solicitação não encontrada');

    const requestType = String(current.tipo ?? '').toLowerCase();
    if (requestType === 'signup') {
      const cpfCnpj = String(current.cpfCnpj ?? '').replace(/\D/g, '');
      const user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { cpfCnpj },
            {
              email: String(current.email ?? '')
                .trim()
                .toLowerCase(),
            },
          ],
        },
      });
      if (user) {
        await this.prisma.usuario.update({
          where: { id: user.id },
          data: {
            status: 'rejeitado' as any,
          },
        });
      }
    }

    const updated = await this.prisma.solicitacaoPendente.update({
      where: { id },
      data: {
        status: 'rejected',
        observacoes: dto?.reason ?? current.observacoes,
      },
    });

    await this.createAuditLog(
      'SYSTEM',
      'Sistema',
      'reject',
      `Solicitação ${id} rejeitada${dto?.reason ? `: ${dto.reason}` : ''}`,
      '127.0.0.1',
    );

    return updated;
  }
}
