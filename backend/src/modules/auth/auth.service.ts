import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private mapPropertyToDto(property: any, userId: string) {
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
      cattleCount: property.quantidadeGado,
      status: property.status,
      plan: property.plano,
      speciesEnabled: property.especiesHabilitadas ?? undefined,
      createdAt: property.criadoEm?.toISOString ? property.criadoEm.toISOString() : property.criadoEm,
      updatedAt: property.atualizadoEm?.toISOString ? property.atualizadoEm.toISOString() : property.atualizadoEm,
    };
  }

  async login(dto: LoginDto) {
    const user = await (this.prisma as any).usuario.findUnique({
      where: { cpfCnpj: dto.cpfCnpj },
      include: { propriedades: { include: { propriedade: true } } },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, role: user.papel, cpfCnpj: user.cpfCnpj };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        cpfCnpj: user.cpfCnpj,
        phone: user.telefone,
        role: user.papel,
        status: user.status,
        properties: user.propriedades
          ? user.propriedades.map((item: any) => this.mapPropertyToDto(item.propriedade, user.id))
          : [],
      },
      token,
    };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await (this.prisma as any).usuario.create({
      data: {
        nome: dto.name,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        telefone: dto.phone,
        senha: passwordHash,
        status: 'pendente_aprovacao',
        papel: 'operador',
      },
    });

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.telefone,
      role: user.papel,
      status: user.status,
    };
  }

  async me(userId: string) {
    const user = await (this.prisma as any).usuario.findUnique({
      where: { id: userId },
      include: { propriedades: { include: { propriedade: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.telefone,
      role: user.papel,
      status: user.status,
      properties: user.propriedades.map((item: any) => this.mapPropertyToDto(item.propriedade, user.id)),
    };
  }
}
