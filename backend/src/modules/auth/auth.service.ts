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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { cpfCnpj: dto.cpfCnpj },
      include: { properties: { include: { property: true } } },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, role: user.role, cpfCnpj: user.cpfCnpj };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpfCnpj: user.cpfCnpj,
        phone: user.phone,
        role: user.role,
        status: user.status,
        properties: user.properties.map(item => item.property),
      },
      token,
    };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        cpfCnpj: dto.cpfCnpj,
        phone: dto.phone,
        password: passwordHash,
        status: 'pending_approval',
        role: 'operator',
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.phone,
      role: user.role,
      status: user.status,
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { properties: { include: { property: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cpfCnpj: user.cpfCnpj,
      phone: user.phone,
      role: user.role,
      status: user.status,
      properties: user.properties.map(item => item.property),
    };
  }
}
