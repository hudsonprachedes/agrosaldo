import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsString()
  nome: string;

  @IsString()
  cnpj: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  site?: string;
}
