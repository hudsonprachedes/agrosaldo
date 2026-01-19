import 'reflect-metadata';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

export async function createApp(
  expressInstance?: Express,
): Promise<INestApplication> {
  const app = expressInstance
    ? await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
        { bodyParser: false },
      )
    : await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const corsOriginsEnv = process.env.CORS_ORIGIN;
  const corsOrigins = (
    corsOriginsEnv?.length
      ? corsOriginsEnv
      : 'http://localhost:5173,http://localhost:3000,http://localhost:8080'
  )
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AgroSaldo API')
    .setDescription('API backend para o AgroSaldo')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.init();
  return app;
}
