import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  tenantId: string;

  @IsString()
  tenantName: string;

  @IsString()
  plan: string;

  @IsNumber()
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsString()
  paymentFrequency: string;

  @IsString()
  status: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentFrequency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string | null;
}
