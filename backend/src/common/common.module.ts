import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';
import { PropertyAccessGuard } from './guards/property-access.guard';

@Global()
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
    PropertyAccessGuard,
  ],
  exports: [PropertyAccessGuard],
})
export class CommonModule {}
