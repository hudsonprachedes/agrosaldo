import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';

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
