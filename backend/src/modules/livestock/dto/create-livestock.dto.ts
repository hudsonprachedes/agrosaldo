import { IsInt, IsString, Min } from 'class-validator';

export class CreateLivestockDto {
  @IsString()
  species: string;

  @IsString()
  ageGroup: string;

  @IsString()
  sex: string;

  @IsInt()
  @Min(0)
  headcount: number;
}
