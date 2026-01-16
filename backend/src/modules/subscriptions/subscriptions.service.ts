import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  private getPlanRank(planId: string) {
    const order = ['porteira', 'piquete', 'retiro', 'estancia', 'barao'];
    const idx = order.indexOf((planId ?? '').toLowerCase());
    return idx === -1 ? 0 : idx;
  }

  private getRequiredPlanByTotalCattle(totalCattle: number) {
    if (totalCattle <= 500) return 'porteira';
    if (totalCattle <= 1500) return 'piquete';
    if (totalCattle <= 3000) return 'retiro';
    if (totalCattle <= 6000) return 'estancia';
    return 'barao';
  }

  async getMySubscription(userId: string) {
    const latest = await this.prisma.assinatura.findFirst({
      where: { usuarioId: userId },
      orderBy: { inicioEm: 'desc' },
    });

    if (!latest) return null;

    const propAgg = await this.prisma.propriedade.aggregate({
      _sum: { quantidadeGado: true },
      where: {
        usuarios: {
          some: {
            usuarioId: userId,
          },
        },
      },
    });

    const totalCattle = propAgg._sum?.quantidadeGado ?? 0;
    const requiredPlan = this.getRequiredPlanByTotalCattle(totalCattle);

    const currentRank = this.getPlanRank(latest.plano as any);
    const requiredRank = this.getPlanRank(requiredPlan);

    // Upgrade automático: apenas quando excede o limite do plano atual.
    // Downgrade nunca é automático (manual via suporte/admin).
    if (requiredRank > currentRank) {
      const catalog = this.getPlansCatalog();
      const plan = catalog.find((p) => p.id === requiredPlan);

      const updated = await this.prisma.assinatura.update({
        where: { id: latest.id },
        data: {
          plano: requiredPlan as any,
          valorMensal: plan?.price ?? latest.valorMensal,
        },
      });
      return updated;
    }

    return latest;
  }

  async subscribeOrUpgrade(userId: string, requestedPlanId: string) {
    const requested = (requestedPlanId ?? '').toLowerCase();
    const catalog = this.getPlansCatalog();
    const requestedPlan = catalog.find((p) => p.id === requested);
    if (!requestedPlan) {
      throw new BadRequestException('Plano inválido');
    }

    const latest = await this.prisma.assinatura.findFirst({
      where: { usuarioId: userId },
      orderBy: { inicioEm: 'desc' },
    });

    if (latest && String(latest.status).toLowerCase() !== 'ativa') {
      throw new ForbiddenException('Assinatura não está ativa');
    }

    const propAgg = await this.prisma.propriedade.aggregate({
      _sum: { quantidadeGado: true },
      where: {
        usuarios: {
          some: {
            usuarioId: userId,
          },
        },
      },
    });
    const totalCattle = propAgg._sum?.quantidadeGado ?? 0;

    const requiredPlan = this.getRequiredPlanByTotalCattle(totalCattle);
    const requiredRank = this.getPlanRank(requiredPlan);
    const requestedRank = this.getPlanRank(requested);

    if (requestedRank < requiredRank) {
      throw new BadRequestException('Plano escolhido não cobre o total de cabeças atual');
    }

    if (!latest) {
      const created = await this.prisma.assinatura.create({
        data: {
          usuarioId: userId,
          plano: requested as any,
          status: 'ativa' as any,
          valorMensal: requestedPlan.price,
          inicioEm: new Date(),
        },
      });
      return created;
    }

    const currentRank = this.getPlanRank(latest.plano as any);
    if (requestedRank < currentRank) {
      throw new BadRequestException('Downgrade não é automático. Solicite pelo suporte');
    }

    if (requestedRank === currentRank) {
      return latest;
    }

    const updated = await this.prisma.assinatura.update({
      where: { id: latest.id },
      data: {
        plano: requested as any,
        valorMensal: requestedPlan.price,
      },
    });
    return updated;
  }

  getPlansCatalog() {
    return [
      { id: 'porteira', name: 'Porteira', price: 29.9, maxCattle: 500 },
      { id: 'piquete', name: 'Piquete', price: 69.9, maxCattle: 1500 },
      { id: 'retiro', name: 'Retiro', price: 129.9, maxCattle: 3000 },
      { id: 'estancia', name: 'Estância', price: 249.9, maxCattle: 6000 },
      { id: 'barao', name: 'Barão', price: 399.9, maxCattle: -1 },
    ];
  }
}
