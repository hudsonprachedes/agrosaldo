import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  notificacoes?: boolean;

  @IsOptional()
  @IsBoolean()
  sincronizacaoAuto?: boolean;

  @IsOptional()
  @IsBoolean()
  modoEscuro?: boolean;

  @IsOptional()
  @IsBoolean()
  notificacaoNascimento?: boolean;

  @IsOptional()
  @IsBoolean()
  notificacaoMorte?: boolean;

  @IsOptional()
  @IsBoolean()
  notificacaoVacina?: boolean;
}
