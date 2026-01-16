import { Controller, Get, Headers, Param, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  private assertPropertyHeader(propertyIdParam: string, propertyIdHeader?: string) {
    if (!propertyIdHeader) {
      throw new ForbiddenException('Property header required');
    }
    if (propertyIdHeader !== propertyIdParam) {
      throw new ForbiddenException('Property mismatch');
    }
  }

  @Get('dashboard/:propertyId')
  getDashboard(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.analyticsService.getDashboard(propertyId);
  }

  @Get('periodo/:propertyId')
  getPeriod(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    return this.analyticsService.getPeriod(propertyId, start, end);
  }

  @Get('mortalidade/:propertyId')
  getMortality(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.analyticsService.getMortality(propertyId);
  }

  @Get('receita/:propertyId')
  getRevenue(
    @Param('propertyId') propertyId: string,
    @Headers('x-property-id') propertyHeaderId?: string,
    @Query('months') months?: string,
  ) {
    this.assertPropertyHeader(propertyId, propertyHeaderId);
    return this.analyticsService.getRevenue(propertyId, months ? Number(months) : undefined);
  }
}
