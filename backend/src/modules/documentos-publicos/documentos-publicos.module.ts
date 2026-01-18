import { Module } from '@nestjs/common';
import { DocumentosPublicosController } from './documentos-publicos.controller';
import { DocumentosPublicosService } from './documentos-publicos.service';

@Module({
  controllers: [DocumentosPublicosController],
  providers: [DocumentosPublicosService],
})
export class DocumentosPublicosModule {}
