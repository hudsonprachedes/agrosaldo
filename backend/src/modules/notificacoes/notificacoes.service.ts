import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type NotificationType = 'announcement' | 'system' | 'reminder';
type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationDTO {
  id: string;
  propertyId?: string;
  userId?: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  actionUrl?: string;
  icon?: string;
  createdAt: string;
  readAt?: string;
}

@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  private parseMonthDayToDate(year: number, monthDay: string) {
    const [mmRaw, ddRaw] = String(monthDay).split('-');
    const mm = Number(mmRaw);
    const dd = Number(ddRaw);
    if (!Number.isInteger(mm) || !Number.isInteger(dd) || mm < 1 || mm > 12)
      return null;
    const date = new Date(year, mm - 1, dd);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  private getDiffDaysTo(target: Date) {
    return Math.ceil(
      (target.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );
  }

  private getEarliestUpcomingDeadline(
    periods: Array<{ code?: unknown; label?: unknown; start?: unknown; end?: unknown }>,
  ): { year: number; competence: string; label: string; deadline: Date } | null {
    const now = new Date();
    const candidates: Array<{
      year: number;
      competence: string;
      label: string;
      deadline: Date;
    }> = [];

    for (const p of periods) {
      const code = typeof p?.code === 'string' && p.code ? p.code : 'PERIODO';
      const label =
        typeof p?.label === 'string' && p.label ? p.label : String(code);
      const end = typeof p?.end === 'string' ? p.end : null;
      if (!end) continue;

      const deadlineThisYear = this.parseMonthDayToDate(now.getFullYear(), end);
      const deadlineNextYear = this.parseMonthDayToDate(now.getFullYear() + 1, end);

      if (deadlineThisYear) {
        candidates.push({
          year: deadlineThisYear.getFullYear(),
          competence: code,
          label,
          deadline: deadlineThisYear,
        });
      }
      if (deadlineNextYear) {
        candidates.push({
          year: deadlineNextYear.getFullYear(),
          competence: code,
          label,
          deadline: deadlineNextYear,
        });
      }
    }

    const upcoming = candidates
      .filter((c) => c.deadline.getTime() >= now.getTime())
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
    return upcoming[0] ?? null;
  }

  private async buildHerdDeclarationNotifications(
    userId: string,
    propertyId: string,
  ): Promise<Omit<NotificationDTO, 'status' | 'readAt'>[]> {
    await this.assertUserHasProperty(userId, propertyId);

    const property = await this.prisma.propriedade.findUnique({
      where: { id: propertyId },
      select: { id: true, estado: true, nome: true },
    });
    const uf = property?.estado ? String(property.estado) : '';
    if (!uf) return [];

    const regulation = await (this.prisma as any).regulamentacaoEstadual.findUnique({
      where: { uf },
    });
    if (!regulation) return [];

    const declarationPeriods = regulation.periodosDeclaracao as any;
    const periods = Array.isArray(declarationPeriods?.periods)
      ? declarationPeriods.periods
      : [];
    const next = this.getEarliestUpcomingDeadline(periods);
    if (!next) return [];

    const leadDays = Array.isArray(regulation.diasAvisoNotificacao)
      ? (regulation.diasAvisoNotificacao as number[]).filter((d) => Number.isFinite(d))
      : [];
    if (leadDays.length === 0) return [];

    const diffDays = this.getDiffDaysTo(next.deadline);
    if (!leadDays.includes(diffDays)) return [];

    const userPropertiesSameUf = await this.prisma.usuarioPropriedade.findMany({
      where: { usuarioId: userId, propriedade: { estado: uf } },
      select: { propriedadeId: true },
    });
    const propertyIdsSameUf = userPropertiesSameUf
      .map((x) => String(x.propriedadeId))
      .filter(Boolean);

    if (propertyIdsSameUf.length === 0) return [];

    const alreadySubmitted = await (this.prisma as any).declaracaoRebanho.findFirst({
      where: {
        uf,
        ano: next.year,
        competencia: next.competence,
        propriedadeId: { in: propertyIdsSameUf },
        status: 'entregue',
      },
      select: { id: true },
    });
    if (alreadySubmitted) return [];

    const agency = String(regulation.orgaoResponsavel ?? '').trim();
    const agencyText = agency ? ` (${agency})` : '';

    return [
      {
        id: `system-herd-declaration-${uf}-${next.year}-${next.competence}`,
        propertyId,
        type: 'reminder' as const,
        title: `Declaração de Rebanho${agencyText}`,
        message:
          diffDays <= 0
            ? `A declaração ${next.label} vence hoje (${uf}). Faça a declaração no órgão do seu estado.`
            : `Faltam ${diffDays} dia(s) para o vencimento da declaração ${next.label} (${uf}). Faça a declaração no órgão do seu estado.`,
        icon: '📋',
        actionUrl: '/rebanho',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async assertUserHasProperty(userId: string, propertyId: string) {
    const link = await this.prisma.usuarioPropriedade.findFirst({
      where: { usuarioId: userId, propriedadeId: propertyId },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException('Sem acesso à propriedade');
    }
  }

  private mapStatus(row: { status: string; lidoEm: Date | null } | null): {
    status: NotificationStatus;
    readAt?: string;
  } {
    const raw = String(row?.status ?? 'unread');
    const status = (
      raw === 'read' || raw === 'archived' || raw === 'unread' ? raw : 'unread'
    ) as NotificationStatus;
    return {
      status,
      readAt: row?.lidoEm ? row.lidoEm.toISOString() : undefined,
    };
  }

  private async getUserStatuses(userId: string, notificationIds: string[]) {
    if (notificationIds.length === 0)
      return new Map<string, { status: NotificationStatus; readAt?: string }>();

    const rows = await (this.prisma as any).notificacaoUsuario.findMany({
      where: { usuarioId: userId, notificacaoId: { in: notificationIds } },
      select: { notificacaoId: true, status: true, lidoEm: true },
    });

    const map = new Map<
      string,
      { status: NotificationStatus; readAt?: string }
    >();
    for (const r of rows) {
      map.set(String(r.notificacaoId), this.mapStatus(r));
    }
    return map;
  }

  private normalizeAdminCommunications(
    rows: any[],
  ): Omit<NotificationDTO, 'status' | 'readAt'>[] {
    const now = new Date();

    return rows
      .filter((r) => {
        const status = String(r.status ?? '').toLowerCase();
        if (status === 'draft' || status === 'rascunho') return false;

        const start = r.inicioEm ? new Date(r.inicioEm) : null;
        const end = r.fimEm ? new Date(r.fimEm) : null;
        if (start && start > now) return false;
        if (end && end < now) return false;

        return true;
      })
      .map((r) => {
        const sentAt = r.enviadoEm ? new Date(r.enviadoEm) : new Date();
        return {
          id: `admin-${r.id}`,
          type: 'announcement' as const,
          title: String(r.titulo ?? r.title ?? 'Comunicado'),
          message: String(r.mensagem ?? r.message ?? ''),
          icon: '📢',
          createdAt: sentAt.toISOString(),
        };
      });
  }

  private async buildSystemNotifications(
    userId: string,
    propertyId: string,
  ): Promise<Omit<NotificationDTO, 'status' | 'readAt'>[]> {
    await this.assertUserHasProperty(userId, propertyId);

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const evolutions = await this.prisma.movimento.findMany({
      where: {
        propriedadeId: propertyId,
        tipo: 'ajuste' as any,
        descricao: { startsWith: '[SISTEMA] Evolução automática' },
        data: { gte: thirtyDaysAgo },
      },
      orderBy: { data: 'desc' },
      take: 50,
      select: {
        id: true,
        data: true,
        descricao: true,
      } as any,
    });

    const herdDeclarationNotifs = await this.buildHerdDeclarationNotifications(
      userId,
      propertyId,
    );

    const rows = await this.prisma.questionarioEpidemiologico.findMany({
      where: { propriedadeId: propertyId },
      orderBy: { proximoEm: 'desc' },
      take: 1,
      select: { id: true, proximoEm: true },
    });

    const evolutionNotifs: Omit<NotificationDTO, 'status' | 'readAt'>[] = (
      evolutions as any[]
    ).map((e) => {
      const createdAt = e.data
        ? new Date(e.data).toISOString()
        : new Date().toISOString();
      return {
        id: `system-age-evolution-${propertyId}-${e.id}`,
        propertyId,
        type: 'system' as const,
        title: 'Evolução automática do rebanho',
        message: String(e.descricao ?? ''),
        icon: '🐄',
        actionUrl: '/rebanho',
        createdAt,
      };
    });

    if (rows.length === 0) return [...evolutionNotifs, ...herdDeclarationNotifs];

    const nextDue = rows[0].proximoEm;
    const diffDays = Math.ceil(
      (nextDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    );

    if (diffDays > 7) return herdDeclarationNotifs;

    return [
      ...evolutionNotifs,
      ...herdDeclarationNotifs,
      {
        id: `system-survey-${propertyId}-${rows[0].id}`,
        propertyId,
        type: 'reminder' as const,
        title: 'Questionário Epidemiológico',
        message:
          diffDays <= 0
            ? 'Questionário vencido. Envie o quanto antes.'
            : `Próximo vencimento em ${diffDays} dia(s).`,
        icon: '📅',
        actionUrl: '/questionario-epidemiologico',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async list(userId: string, propertyId?: string): Promise<NotificationDTO[]> {
    const [adminRows, systemNotifs] = await Promise.all([
      (this.prisma as any).comunicacaoAdmin.findMany({
        orderBy: { enviadoEm: 'desc' },
        take: 200,
      }),
      propertyId
        ? this.buildSystemNotifications(userId, propertyId)
        : Promise.resolve([]),
    ]);

    const base = [
      ...this.normalizeAdminCommunications(adminRows),
      ...systemNotifs,
    ];

    const statusMap = await this.getUserStatuses(
      userId,
      base.map((n) => n.id),
    );

    const merged: NotificationDTO[] = base
      .map((n) => {
        const status = statusMap.get(n.id) ?? { status: 'unread' as const };
        return {
          ...n,
          userId,
          status: status.status,
          readAt: status.readAt,
        };
      })
      .filter((n) => n.status !== 'archived')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return merged;
  }

  async markAsRead(userId: string, notificationId: string) {
    await (this.prisma as any).notificacaoUsuario.upsert({
      where: {
        usuarioId_notificacaoId: {
          usuarioId: userId,
          notificacaoId: notificationId,
        },
      },
      update: {
        status: 'read',
        lidoEm: new Date(),
      },
      create: {
        usuarioId: userId,
        notificacaoId: notificationId,
        status: 'read',
        lidoEm: new Date(),
      },
    });

    return { success: true };
  }

  async archive(userId: string, notificationId: string) {
    await (this.prisma as any).notificacaoUsuario.upsert({
      where: {
        usuarioId_notificacaoId: {
          usuarioId: userId,
          notificacaoId: notificationId,
        },
      },
      update: {
        status: 'archived',
      },
      create: {
        usuarioId: userId,
        notificacaoId: notificationId,
        status: 'archived',
      },
    });

    return { success: true };
  }

  async archiveAll(userId: string, propertyId?: string) {
    const current = await this.list(userId, propertyId);
    if (current.length === 0) return { success: true, archived: 0 };

    await Promise.all(current.map((n) => this.archive(userId, n.id)));

    return { success: true, archived: current.length };
  }
}
