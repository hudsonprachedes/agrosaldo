import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PropertyAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user as { id?: string; role?: string } | undefined;
    const userId = user?.id;

    const propertyId = request.headers?.['x-property-id'] as string | undefined;

    if (!propertyId || typeof propertyId !== 'string' || propertyId.trim() === '') {
      throw new ForbiddenException('Property header required');
    }

    if (!userId) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user?.role === 'super_admin') {
      return true;
    }

    const link = await this.prisma.usuarioPropriedade.findFirst({
      where: { usuarioId: userId, propriedadeId: propertyId },
      select: { id: true },
    });

    if (!link) {
      throw new ForbiddenException('Sem acesso à propriedade');
    }

    request.propertyId = propertyId;
    return true;
  }
}
