import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { LinksModule } from './modules/links/links.module';
import { QrModule } from './modules/qr/qr.module';
import { PublicModule } from './modules/public/public.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env['RATE_LIMIT_TTL'] || '60') * 1000,
        limit: parseInt(process.env['RATE_LIMIT_MAX'] || '100'),
      },
    ]),

    // Core modules
    SupabaseModule,
    AuthModule,
    LinksModule,
    QrModule,
    AnalyticsModule,
    BillingModule,
    WebhooksModule,
    // PublicModule must be LAST because it has a catch-all route /:slug
    PublicModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
