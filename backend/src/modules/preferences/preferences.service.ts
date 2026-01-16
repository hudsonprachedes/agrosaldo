import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertUserHasProperty(userId: string, propertyId: string) {
    const link = await this.prisma.usuarioPropriedade.findFirst({
      where: { usuarioId: userId, propriedadeId: propertyId },
      select: { id: true },
    });
    if (!link) {
      throw new ForbiddenException('Sem acesso à propriedade');
    }
  }

  async getOrCreate(userId: string, propertyId: string) {
    await this.assertUserHasProperty(userId, propertyId);

    return this.prisma.preferenciasUsuario.upsert({
      where: {
        usuarioId_propriedadeId: {
          usuarioId: userId,
          propriedadeId: propertyId,
        },
      },
      update: {},
      create: {
        usuarioId: userId,
        propriedadeId: propertyId,
      },
    });
  }

  async update(userId: string, propertyId: string, dto: UpdatePreferencesDto) {
    await this.assertUserHasProperty(userId, propertyId);

    return this.prisma.preferenciasUsuario.upsert({
      where: {
        usuarioId_propriedadeId: {
          usuarioId: userId,
          propriedadeId: propertyId,
        },
      },
      update: {
        notificacoes: dto.notificacoes,
        sincronizacaoAuto: dto.sincronizacaoAuto,
        modoEscuro: dto.modoEscuro,
        notificacaoNascimento: dto.notificacaoNascimento,
        notificacaoMorte: dto.notificacaoMorte,
        notificacaoVacina: dto.notificacaoVacina,
      },
      create: {
        usuarioId: userId,
        propriedadeId: propertyId,
        notificacoes: dto.notificacoes ?? true,
        sincronizacaoAuto: dto.sincronizacaoAuto ?? true,
        modoEscuro: dto.modoEscuro ?? false,
        notificacaoNascimento: dto.notificacaoNascimento ?? true,
        notificacaoMorte: dto.notificacaoMorte ?? true,
        notificacaoVacina: dto.notificacaoVacina ?? true,
      },
    });
  }
}
