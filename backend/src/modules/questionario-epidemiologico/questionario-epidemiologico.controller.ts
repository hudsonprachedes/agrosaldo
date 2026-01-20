import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PropertyAccessGuard } from '../../common/guards/property-access.guard';
import { CreateQuestionarioEpidemiologicoDto } from './dto/create-questionario-epidemiologico.dto';
import { QuestionarioEpidemiologicoService } from './questionario-epidemiologico.service';

@ApiTags('questionario-epidemiologico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PropertyAccessGuard)
@Controller('questionario-epidemiologico')
export class QuestionarioEpidemiologicoController {
  constructor(private readonly service: QuestionarioEpidemiologicoService) {}

  @Post()
  create(
    @Headers('x-property-id') propertyId: string,
    @Body() dto: CreateQuestionarioEpidemiologicoDto,
  ) {
    return this.service.create(propertyId, dto);
  }

  @Get()
  findAll(@Headers('x-property-id') propertyId: string) {
    return this.service.findAll(propertyId);
  }

  @Get('latest')
  findLatest(@Headers('x-property-id') propertyId: string) {
    return this.service.findLatest(propertyId);
  }

  @Get(':id')
  findOne(
    @Headers('x-property-id') propertyId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(propertyId, id);
  }
}
