import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { User } from '@supabase/supabase-js';
import { BillingService } from './billing.service';
import { Request } from 'express';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan or update existing subscription' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        priceId: { type: 'string', description: 'Stripe price ID' },
        successUrl: { type: 'string', description: 'URL to redirect on success' },
        cancelUrl: { type: 'string', description: 'URL to redirect on cancel' },
      },
      required: ['priceId'],
    },
  })
  async subscribeToPlan(
    @CurrentUser() user: User,
    @Body() body: { priceId: string; successUrl?: string; cancelUrl?: string }
  ) {
    return this.billingService.subscribeToPlan(
      user.id,
      user.email || '',
      body.priceId,
      body.successUrl,
      body.cancelUrl
    );
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a cancelled subscription' })
  async reactivateSubscription(@CurrentUser() user: User) {
    return this.billingService.reactivateSubscription(user.id);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Stripe customer portal session' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        returnUrl: { type: 'string', description: 'URL to return to after portal' },
      },
    },
  })
  async createPortalSession(@CurrentUser() user: User, @Body() body: { returnUrl?: string }) {
    return this.billingService.createPortalSession(user.id, body.returnUrl);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription details' })
  async getSubscription(@CurrentUser() user: User) {
    return this.billingService.getSubscription(user.id);
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current usage statistics' })
  async getUsage(@CurrentUser() user: User) {
    return this.billingService.getUsage(user.id);
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get billing history / invoices' })
  async getInvoices(@CurrentUser() user: User) {
    return this.billingService.getInvoices(user.id);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel current subscription' })
  async cancelSubscription(@CurrentUser() user: User) {
    return this.billingService.cancelSubscription(user.id);
  }

  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change subscription plan (upgrade or downgrade)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        priceId: { type: 'string', description: 'New Stripe price ID' },
      },
      required: ['priceId'],
    },
  })
  async changePlan(@CurrentUser() user: User, @Body() body: { priceId: string }) {
    return this.billingService.changePlan(user.id, body.priceId);
  }

  @Post('preview-plan-change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview cost of plan change before confirming' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        priceId: { type: 'string', description: 'Target Stripe price ID' },
      },
      required: ['priceId'],
    },
  })
  async previewPlanChange(@CurrentUser() user: User, @Body() body: { priceId: string }) {
    return this.billingService.previewPlanChange(user.id, body.priceId);
  }

  @Post('complete-upgrade')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete upgrade after Stripe payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Stripe checkout session ID' },
      },
      required: ['sessionId'],
    },
  })
  async completeUpgrade(@CurrentUser() user: User, @Body() body: { sessionId: string }) {
    return this.billingService.completeUpgrade(user.id, body.sessionId);
  }

  @Post('downgrade-to-free')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Downgrade to free plan' })
  async downgradeToFree(@CurrentUser() user: User) {
    return this.billingService.downgradeToFree(user.id);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans (public)' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync subscription status from Stripe' })
  async syncSubscription(@CurrentUser() user: User) {
    return this.billingService.syncSubscriptionFromStripe(user.id);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    return this.billingService.handleWebhook(rawBody, signature);
  }
}
