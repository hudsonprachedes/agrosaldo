import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificacoesService } from './notificacoes.service';

@ApiTags('notificacoes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-property-id') propertyId: string | undefined,
  ) {
    return this.notificacoesService.list(user.id, propertyId);
  }

  @Patch(':id/lida')
  @Throttle({
    default: { ttl: 60, limit: 120 },
  })
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificacoesService.markAsRead(user.id, id);
  }

  @Delete(':id')
  @Throttle({
    default: { ttl: 60, limit: 60 },
  })
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificacoesService.archive(user.id, id);
  }

  @Delete()
  @Throttle({
    default: { ttl: 3600, limit: 10 },
  })
  archiveAll(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-property-id') propertyId: string | undefined,
  ) {
    return this.notificacoesService.archiveAll(user.id, propertyId);
  }
}
