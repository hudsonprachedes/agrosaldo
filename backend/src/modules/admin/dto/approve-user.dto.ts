import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ApproveUserDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  trialDays?: number;

  @IsOptional()
  @IsString()
  trialPlan?: string;
}
