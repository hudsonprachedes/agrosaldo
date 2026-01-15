import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsNumber()
  totalArea?: number;

  @IsOptional()
  @IsNumber()
  cultivatedArea?: number;

  @IsOptional()
  @IsNumber()
  naturalArea?: number;

  @IsOptional()
  @IsNumber()
  cattleCount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}
