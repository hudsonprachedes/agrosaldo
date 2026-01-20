import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';
import { PropertyAccessGuard } from './guards/property-access.guard';
import { HerdEvolutionService } from './herd-evolution.service';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
    PropertyAccessGuard,
    HerdEvolutionService,
  ],
  exports: [PropertyAccessGuard, HerdEvolutionService],
})
export class CommonModule {}
