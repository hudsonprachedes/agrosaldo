import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMovementDto {
  @IsString()
  type: string;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  value?: number;

  @IsOptional()
  @IsString()
  gtaNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  cause?: string;
}
