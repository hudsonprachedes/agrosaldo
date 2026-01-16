import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApproveUserDto } from './dto/approve-user.dto';
import { CreateRegulationDto, UpdateRegulationDto } from './dto/regulation.dto';
import { CreatePaymentDto } from './dto/payment.dto';
import { UpdatePixConfigDto } from './dto/pix-config.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Dashboard & KPIs ---

  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      pendingRequests,
      overdueCount,
      revenueData,
      totalCattleResult
    ] = await Promise.all([
      this.prisma.usuario.count({
        where: { papel: { in: ['proprietario', 'operador'] as any } }
      }),
      this.prisma.usuario.count({
        where: { 
          papel: { in: ['proprietario', 'operador'] as any },
          status: 'ativo' as any
        }
      }),
      this.prisma.usuario.count({
        where: { status: 'pendente_aprovacao' as any }
      }),
      this.prisma.usuario.count({
        where: { statusFinanceiro: 'inadimplente' as any }
      }),
      this.prisma.usuario.aggregate({
        _sum: {
          receitaMensal: true
        },
        where: { status: 'ativo' as any }
      }),
      this.prisma.rebanho.aggregate({
        _sum: {
          cabecas: true
        }
      })
    ]);

    return {
      totalTenants,
      activeTenants,
      totalCattle: totalCattleResult._sum.cabecas || 0,
      mrr: revenueData._sum.receitaMensal || 0,
      pendingRequests,
      overdueCount
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
    return (this.prisma as any).configuracaoPix.findFirst({
      orderBy: { criadoEm: 'desc' }
    });
  }

  async updatePixConfig(dto: UpdatePixConfigDto) {
    const current = await (this.prisma as any).configuracaoPix.findFirst();
    if (current) {
      return (this.prisma as any).configuracaoPix.update({
        where: { id: current.id },
        data: dto as any
      });
    } else {
      return (this.prisma as any).configuracaoPix.create({
        data: dto as any
      });
    }
  }

  // --- Audit Logs ---

  async listAuditLogs() {
    return (this.prisma as any).logAuditoria.findMany({
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
    return [
      {
        id: '1',
        userId: 'user-1',
        type: 'upgrade',
        status: 'pending',
        createdAt: new Date(),
      },
    ];
  }

  async approveRequest(id: string, dto: any) {
    return { id, status: 'approved', message: 'Solicitação aprovada' };
  }

  async rejectRequest(id: string, dto: any) {
    return { id, status: 'rejected', message: 'Solicitação rejeitada' };
  }
}
