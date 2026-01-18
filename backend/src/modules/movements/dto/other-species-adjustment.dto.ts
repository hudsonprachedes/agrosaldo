import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OtherSpeciesBalanceItemDto {
  @IsString()
  speciesId: string;

  @IsInt()
  @Min(0)
  count: number;
}

export class OtherSpeciesAdjustmentDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherSpeciesBalanceItemDto)
  balances: OtherSpeciesBalanceItemDto[];
}
