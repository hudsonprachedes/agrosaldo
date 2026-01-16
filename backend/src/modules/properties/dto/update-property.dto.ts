import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cultivatedArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  naturalArea?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cattleCount?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}
