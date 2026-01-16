import { Module } from '@nestjs/common';
import { QuestionarioEpidemiologicoController } from './questionario-epidemiologico.controller';
import { QuestionarioEpidemiologicoService } from './questionario-epidemiologico.service';

@Module({
  controllers: [QuestionarioEpidemiologicoController],
  providers: [QuestionarioEpidemiologicoService],
})
export class QuestionarioEpidemiologicoModule {}
