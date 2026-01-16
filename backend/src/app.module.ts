import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    AdminModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
