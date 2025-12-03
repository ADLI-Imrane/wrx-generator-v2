import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { User } from '@supabase/supabase-js';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['7d', '30d', '90d', 'all'] })
  getAnalytics(
    @CurrentUser() user: User,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' | 'all' = '30d'
  ) {
    return this.analyticsService.getAnalytics(user.id, timeRange);
  }
}
