import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  cpfCnpj: string;

  @IsString()
  @MinLength(4)
  password: string;
}
