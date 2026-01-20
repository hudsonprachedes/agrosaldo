import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PapelUsuario, Prisma, StatusUsuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { HerdEvolutionService } from '../../common/herd-evolution.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly herdEvolution: HerdEvolutionService,
  ) {}

  private readonly HERD_SPECIES = ['bovino', 'bubalino'] as const;

  private readonly CANONICAL_AGE_GROUPS = [
    '0-4m',
    '5-12m',
    '13-24m',
    '25-36m',
    '36+m',
  ] as const;

  private normalizeAgeGroupId(raw: unknown): string {
    if (typeof raw !== 'string' || !raw) return 'unknown';
    const value = raw.trim();
    if (value.endsWith('m')) return value;
    const directMap: Record<string, string> = {
      '0-4': '0-4m',
      '5-12': '5-12m',
      '12-24': '13-24m',
      '13-24': '13-24m',
      '24-36': '25-36m',
      '25-36': '25-36m',
      '36+': '36+m',
      '36+m': '36+m',
    };
    return directMap[value] ?? value;
  }

  private mapSexoFromFrontend(sex: string): 'macho' | 'femea' {
    return sex === 'female' ? 'femea' : 'macho';
  }

  private formatCpfCnpj(digits: string): string | null {
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (digits.length === 14) {
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5',
      );
    }
    return null;
  }

  private mapPropertyToDto(
    property: any,
    userId: string,
    cattleCountOverride?: number,
  ) {
    return {
      id: property.id,
      userId,
      name: property.nome,
      cep: property.cep ?? undefined,
      accessRoute: property.viaAcesso ?? undefined,
      community: property.comunidade ?? undefined,
      city: property.cidade,
      state: property.estado,
      stateRegistration: property.inscricaoEstadual ?? undefined,
      propertyCode: property.codigoPropriedade ?? undefined,
      totalArea: property.areaTotal,
      cultivatedArea: property.areaCultivada,
      naturalArea: property.areaNatural,
      pastureNaturalHa: property.pastoNaturalHa ?? undefined,
      pastureCultivatedHa: property.pastoCultivadoHa ?? undefined,
      areaTotalHa: property.areaTotalHa ?? undefined,
      cattleCount:
        typeof cattleCountOverride === 'number'
          ? cattleCountOverride
          : property.quantidadeGado,
      status: property.status,
      plan: property.plano,
      speciesEnabled: property.especiesHabilitadas ?? undefined,
      createdAt: property.criadoEm?.toISOString
        ? property.criadoEm.toISOString()
        : property.criadoEm,
      updatedAt: property.atualizadoEm?.toISOString
        ? property.atualizadoEm.toISOString()
        : property.atualizadoEm,
    };
  }

  async login(dto: LoginDto, appVersionHeader?: string) {
    const cpfCnpj = dto.cpfCnpj.replace(/\D/g, '');
    const cpfCnpjFormatted = this.formatCpfCnpj(cpfCnpj);

    const candidates = [dto.cpfCnpj, cpfCnpj, cpfCnpjFormatted].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );

    type UserWithProperties = Prisma.UsuarioGetPayload<{
      include: { propriedades: { include: { propriedade: true } } };
    }>;

    const user: UserWithProperties | null = await this.prisma.usuario.findFirst(
      {
        where: {
          OR: candidates.map((value) => ({ cpfCnpj: value })),
        },
        include: { propriedades: { include: { propriedade: true } } },
      },
    );

    if (!user || !(await bcrypt.compare(dto.password, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, role: user.papel, cpfCnpj: user.cpfCnpj };
    const token = await this.jwtService.signAsync(payload);

    const appVersion =
      typeof appVersionHeader === 'string' && appVersionHeader.trim().length > 0
        ? appVersionHeader.trim()
        : null;

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        ultimoLogin: new Date(),
        ...(appVersion ? { versaoApp: appVersion } : {}),
      } as any,
    });

    const onboardingConcluidoEm = (user as any).onboardingConcluidoEm as
      | Date
      | null
      | undefined;

    const propertyIds = (user.propriedades ?? [])
      .map((item: any) => item?.propriedade?.id)
      .filter(Boolean);

    const herdAgg = await this.prisma.rebanho.groupBy({
      by: ['propriedadeId'],
      where: {
        propriedadeId: { in: propertyIds },
        especie: { in: [...this.HERD_SPECIES] },
      },
      _sum: { cabecas: true },
    });

    const herdByPropertyId = (herdAgg ?? []).reduce(
      (acc: Record<string, number>, row: any) => {
        const key = row.propriedadeId;
        acc[key] = row._sum?.cabecas ?? 0;
        return acc;
      },
      {},
    );

    return {
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        cpfCnpj: user.cpfCnpj,
        phone: user.telefone,
        role: user.papel,
        status: user.status,
        financialStatus: user.statusFinanceiro ?? null,
        onboardingCompletedAt: onboardingConcluidoEm
          ? onboardingConcluidoEm.toISOString()
          : null,
        properties: user.propriedades
          ? user.propriedades.map((item: any) =>
              this.mapPropertyToDto(
                item.propriedade,
                user.id,
                herdByPropertyId[item?.propriedade?.id] ?? 0,
              ),
            )
          : [],
      },
      token,
    };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const cpfCnpj = dto.cpfCnpj.replace(/\D/g, '');
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.usuario.findFirst({
      where: {
        OR: [{ cpfCnpj }, { email }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um cadastro com este CPF/CNPJ ou email',
      );
    }

    const uf = (dto as any).uf as string | undefined;
    const referralCoupon = (dto as any).referralCoupon as string | undefined;
    const cattleCount = (dto as any).cattleCount as number | undefined;

    let user: {
      id: string;
      nome: string;
      email: string;
      cpfCnpj: string;
      telefone: string | null;
      papel: any;
      status: any;
      statusFinanceiro: any;
    };

    try {
      user = await this.prisma.$transaction(async (tx) => {
        const createdUser = await tx.usuario.create({
          data: {
            nome: dto.name,
            email,
            cpfCnpj,
            telefone: dto.phone,
            senha: passwordHash,
            status: 'pendente_aprovacao' as any,
            papel: 'proprietario' as any,
          },
        });

        const cattleCountValue =
          typeof cattleCount === 'number' && Number.isFinite(cattleCount)
            ? Math.max(0, Math.trunc(cattleCount))
            : 0;

        const suggestedPlan =
          cattleCountValue <= 500
            ? 'porteira'
            : cattleCountValue <= 1500
              ? 'piquete'
              : cattleCountValue <= 3000
                ? 'retiro'
                : cattleCountValue <= 6000
                  ? 'estancia'
                  : 'barao';

        await tx.solicitacaoPendente.create({
          data: {
            nome: dto.name,
            cpfCnpj,
            email,
            telefone: dto.phone ?? '',
            plano: suggestedPlan,
            tipo: 'signup',
            status: 'pending',
            enviadoEm: new Date(),
            origem: 'public_register',
            nomePropriedade: null,
            observacoes: JSON.stringify({
              uf: uf ?? null,
              referralCoupon: referralCoupon ?? null,
              cattleCount: cattleCountValue,
            }),
          },
        });

        return createdUser;
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Já existe um cadastro com este CPF/CNPJ, email ou nome de propriedade',
        );
      }
      const message =
        process.env.NODE_ENV !== 'production'
          ? typeof error?.message === 'string' && error.message.length > 0
            ? `Não foi possível concluir o cadastro: ${error.message}`
            : 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.'
          : 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';
      throw new BadRequestException(message);
    }

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.telefone,
      role: user.papel,
      status: user.status,
      financialStatus: user.statusFinanceiro ?? null,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { propriedades: { include: { propriedade: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const onboardingConcluidoEm = (user as any).onboardingConcluidoEm as
      | Date
      | null
      | undefined;

    const propertyIds = (user.propriedades ?? [])
      .map((item: any) => item?.propriedade?.id)
      .filter(Boolean);

    const herdAgg = await this.prisma.rebanho.groupBy({
      by: ['propriedadeId'],
      where: {
        propriedadeId: { in: propertyIds },
        especie: { in: [...this.HERD_SPECIES] },
      },
      _sum: { cabecas: true },
    });

    const herdByPropertyId = (herdAgg ?? []).reduce(
      (acc: Record<string, number>, row: any) => {
        const key = row.propriedadeId;
        acc[key] = row._sum?.cabecas ?? 0;
        return acc;
      },
      {},
    );

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.telefone,
      role: user.papel,
      status: user.status,
      financialStatus: user.statusFinanceiro ?? null,
      onboardingCompletedAt: onboardingConcluidoEm
        ? onboardingConcluidoEm.toISOString()
        : null,
      properties: user.propriedades.map((item: any) =>
        this.mapPropertyToDto(
          item.propriedade,
          user.id,
          herdByPropertyId[item?.propriedade?.id] ?? 0,
        ),
      ),
    };
  }

  async completeOnboarding(
    userId: string,
    payload: {
      propertyId: string;
      balances: Array<{
        species: 'bovino' | 'bubalino';
        sex: 'male' | 'female';
        ageGroupId: string;
        quantity: number;
      }>;
    },
  ) {
    const propertyId = payload?.propertyId;
    const balances = Array.isArray(payload?.balances) ? payload.balances : [];

    if (!propertyId || typeof propertyId !== 'string') {
      throw new BadRequestException('propertyId é obrigatório');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const onboardingDate = new Date();

      const rel = await tx.usuarioPropriedade.findUnique({
        where: {
          usuarioId_propriedadeId: {
            usuarioId: userId,
            propriedadeId: propertyId,
          },
        },
        select: { id: true },
      });

      if (!rel) {
        throw new ForbiddenException('Usuário não possui acesso à propriedade');
      }

      const canonicalSet = new Set(
        this.CANONICAL_AGE_GROUPS as unknown as string[],
      );

      const normalized = balances
        .map((b) => {
          const qty = Number((b as any).quantity ?? 0);
          const species = String((b as any).species ?? '').trim();
          const ageGroupId = this.normalizeAgeGroupId((b as any).ageGroupId);
          const sex = this.mapSexoFromFrontend(
            String((b as any).sex ?? 'male'),
          );
          return {
            species,
            ageGroupId: canonicalSet.has(ageGroupId) ? ageGroupId : 'unknown',
            sex,
            quantity: Number.isFinite(qty) ? Math.max(0, Math.trunc(qty)) : 0,
          };
        })
        .filter(
          (b) =>
            (b.species === 'bovino' || b.species === 'bubalino') &&
            b.quantity > 0,
        );

      // Zerar estoque existente dessas espécies antes de aplicar o saldo inicial.
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

      if (normalized.length > 0) {
        for (const b of normalized) {
          await this.herdEvolution.createBatchEntry(tx as any, {
            propertyId,
            species: b.species,
            sex: b.sex as any,
            initialAgeGroup: b.ageGroupId,
            baseDate: onboardingDate,
            quantity: b.quantity,
            source: 'saldo_inicial',
          });
        }

        await tx.movimento.createMany({
          data: normalized.map((b) => ({
            propriedadeId: propertyId,
            tipo: 'ajuste' as any,
            especie: b.species,
            data: onboardingDate,
            quantidade: b.quantity,
            sexo: b.sex as any,
            faixaEtaria: b.ageGroupId,
            descricao: '[SISTEMA] Saldo inicial (onboarding)',
            destino: null,
            valor: null,
            numeroGta: null,
            fotoUrl: null,
            causa: null,
          })) as any,
        });
      }

      const totalHerd = normalized.reduce((sum, b) => sum + b.quantity, 0);

      await tx.propriedade.update({
        where: { id: propertyId },
        data: { quantidadeGado: totalHerd },
      });

      return tx.usuario.update({
        where: { id: userId },
        data: { onboardingConcluidoEm: onboardingDate } as any,
      });
    });

    const onboardingConcluidoEm = (updated as any).onboardingConcluidoEm as
      | Date
      | null
      | undefined;

    return {
      onboardingCompletedAt: onboardingConcluidoEm
        ? onboardingConcluidoEm.toISOString()
        : null,
    };
  }
}
