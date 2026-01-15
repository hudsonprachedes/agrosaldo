import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsNumber()
  totalArea: number;

  @IsNumber()
  cultivatedArea: number;

  @IsNumber()
  naturalArea: number;

  @IsNumber()
  cattleCount: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  plan?: string;
}
