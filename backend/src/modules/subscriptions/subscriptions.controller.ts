import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('assinaturas/minha')
  getMySubscription(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Post('assinaturas/minha')
  subscribeOrUpgrade(
    @CurrentUser() user: { id: string },
    @Body() body: { planId?: string },
  ) {
    return this.subscriptionsService.subscribeOrUpgrade(
      user.id,
      body?.planId ?? '',
    );
  }

  @Get('planos')
  getPlansCatalog() {
    return this.subscriptionsService.getPlansCatalog();
  }
}
