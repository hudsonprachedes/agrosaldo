import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import { LivestockModule } from './modules/livestock/livestock.module';
import { MovementsModule } from './modules/movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UsersModule } from './modules/users/users.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { QuestionarioEpidemiologicoModule } from './modules/questionario-epidemiologico/questionario-epidemiologico.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { DocumentosPublicosModule } from './modules/documentos-publicos/documentos-publicos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: process.env.NODE_ENV === 'test' ? 10000 : 300,
        },
      ],
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    LivestockModule,
    MovementsModule,
    FinanceModule,
    PreferencesModule,
    SubscriptionsModule,
    QuestionarioEpidemiologicoModule,
    NotificacoesModule,
    DocumentosPublicosModule,
    AdminModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
