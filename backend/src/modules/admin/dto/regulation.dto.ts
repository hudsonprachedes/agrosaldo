import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class CreateRegulationDto {
  @IsString()
  uf: string;

  @IsString()
  stateName: string;

  @IsNumber()
  reportingDeadline: number;

  @IsArray()
  @IsString({ each: true })
  requiredDocuments: string[];

  @IsString()
  saldoReportFrequency: string;

  @IsNumber()
  saldoReportDay: number;

  @IsBoolean()
  gtaRequired: boolean;

  @IsString()
  observations: string;
}

export class UpdateRegulationDto extends CreateRegulationDto {}
