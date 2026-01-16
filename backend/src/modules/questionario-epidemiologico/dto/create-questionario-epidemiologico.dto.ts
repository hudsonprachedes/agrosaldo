import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsString, ValidateNested } from 'class-validator';

class EpidemiologyAnswerDto {
  @IsString()
  fieldId: string;

  @IsDefined()
  value: unknown;
}

export class CreateQuestionarioEpidemiologicoDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EpidemiologyAnswerDto)
  answers: EpidemiologyAnswerDto[];
}
