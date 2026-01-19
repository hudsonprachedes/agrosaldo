import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PapelUsuario, Prisma, StatusUsuario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(dto: LoginDto) {
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

    const onboardingConcluidoEm = (user as any).onboardingConcluidoEm as
      | Date
      | null
      | undefined;

    const propertyIds = (user.propriedades ?? [])
      .map((item: any) => item?.propriedade?.id)
      .filter(Boolean);

    const cattleAgg = await this.prisma.rebanho.groupBy({
      by: ['propriedadeId'],
      where: {
        propriedadeId: { in: propertyIds },
        especie: 'bovino',
      },
      _sum: { cabecas: true },
    });

    const cattleByPropertyId = (cattleAgg ?? []).reduce(
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
                cattleByPropertyId[item?.propriedade?.id] ?? 0,
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

    const cattleAgg = await this.prisma.rebanho.groupBy({
      by: ['propriedadeId'],
      where: {
        propriedadeId: { in: propertyIds },
        especie: 'bovino',
      },
      _sum: { cabecas: true },
    });

    const cattleByPropertyId = (cattleAgg ?? []).reduce(
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
          cattleByPropertyId[item?.propriedade?.id] ?? 0,
        ),
      ),
    };
  }

  async completeOnboarding(userId: string) {
    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: { onboardingConcluidoEm: new Date() } as any,
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
