import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Body,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyAccessGuard } from '../../common/guards/property-access.guard';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PropertyAccessGuard)
@Controller('preferencias')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @Throttle({
    default: { ttl: 60, limit: 120 },
  })
  get(
    @CurrentUser() user: { id: string },
    @Headers('x-property-id') propertyId: string | undefined,
  ) {
    if (!propertyId) {
      throw new ForbiddenException('Property header required');
    }
    return this.preferencesService.getOrCreate(user.id, propertyId);
  }

  @Put()
  @Throttle({
    default: { ttl: 60, limit: 60 },
  })
  update(
    @CurrentUser() user: { id: string },
    @Headers('x-property-id') propertyId: string | undefined,
    @Body() dto: UpdatePreferencesDto,
  ) {
    if (!propertyId) {
      throw new ForbiddenException('Property header required');
    }
    return this.preferencesService.update(user.id, propertyId, dto);
  }
}
