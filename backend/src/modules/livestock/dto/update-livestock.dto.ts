import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLivestockDto {
  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  ageGroup?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  headcount?: number;
}
