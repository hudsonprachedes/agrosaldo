import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdatePixConfigDto {
  @IsString()
  pixKey: string;

  @IsString()
  pixKeyType: string;

  @IsOptional()
  @IsString()
  qrCodeImage?: string;

  @IsBoolean()
  active: boolean;
}
