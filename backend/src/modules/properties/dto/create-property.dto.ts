import { IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  @Length(2, 2)
  state: string;

  @IsNumber()
  @Min(0)
  totalArea: number;

  @IsNumber()
  @Min(0)
  cultivatedArea: number;

  @IsNumber()
  @Min(0)
  naturalArea: number;

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

  @IsOptional()
  @IsString()
  plano?: string;
}
