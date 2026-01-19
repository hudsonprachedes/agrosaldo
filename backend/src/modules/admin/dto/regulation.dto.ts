import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsBoolean,
  IsInt,
  IsObject,
} from 'class-validator';

export class CreateRegulationDto {
  @IsString()
  uf: string;

  @IsString()
  stateName: string;

  @IsInt()
  reportingDeadline: number;

  @IsArray()
  @IsString({ each: true })
  requiredDocuments: string[];

  @IsInt()
  declarationFrequency: number;

  @IsObject()
  declarationPeriods: Record<string, unknown>;

  @IsString()
  responsibleAgency: string;

  @IsArray()
  @IsString({ each: true })
  requiredVaccines: string[];

  @IsArray()
  @IsInt({ each: true })
  notificationLeadDays: number[];

  @IsBoolean()
  gtaRequired: boolean;

  @IsString()
  observations: string;
}

export class UpdateRegulationDto extends CreateRegulationDto {}
