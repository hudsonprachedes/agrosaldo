import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyAccessGuard } from '../../common/guards/property-access.guard';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financeiro')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('pix-config')
  getPixConfig() {
    return this.financeService.getPixConfig();
  }

  @Get('resumo')
  @UseGuards(PropertyAccessGuard)
  getSummary(
    @Headers('x-property-id') propertyId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    return this.financeService.getSummary(propertyId, period ?? 'month');
  }
}
