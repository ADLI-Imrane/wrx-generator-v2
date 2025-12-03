import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SupabaseModule } from '../../common/supabase/supabase.module';
import { JwtAuthGuard } from '../../common/guards';

@Module({
  imports: [SupabaseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, JwtAuthGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
