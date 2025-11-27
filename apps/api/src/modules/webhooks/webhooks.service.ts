import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase/supabase.service';
import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private stripe: Stripe | null = null;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-02-24.acacia',
      });
    }
  }

  async handleStripeWebhook(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout completed: ${session.id}`);

    const supabase = this.supabaseService.getAdminClient();
    const userId = session.client_reference_id;

    if (!userId) {
      this.logger.warn('No user ID in checkout session');
      return;
    }

    // Update user's subscription status
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_customer_id: session.customer as string,
        tier: this.getTierFromPriceId(session.metadata?.['price_id'] || ''),
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      this.logger.error(`Failed to update profile: ${error.message}`);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription updated: ${subscription.id}`);

    const supabase = this.supabaseService.getAdminClient();

    // Find user by Stripe customer ID
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (findError || !profile) {
      this.logger.warn(`No profile found for customer: ${subscription.customer}`);
      return;
    }

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price.id;

    const { error } = await supabase
      .from('profiles')
      .update({
        tier: this.getTierFromPriceId(priceId || ''),
        subscription_status: subscription.status,
        subscription_id: subscription.id,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    const supabase = this.supabaseService.getAdminClient();

    // Find user by Stripe customer ID
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (findError || !profile) {
      this.logger.warn(`No profile found for customer: ${subscription.customer}`);
      return;
    }

    // Downgrade to free tier
    const { error } = await supabase
      .from('profiles')
      .update({
        tier: 'free',
        subscription_status: 'canceled',
        subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    this.logger.log(`Payment succeeded: ${invoice.id}`);
    // Additional logic for successful payments (e.g., send receipt email)
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.log(`Payment failed: ${invoice.id}`);
    // Additional logic for failed payments (e.g., send notification)
  }

  private getTierFromPriceId(priceId: string): string {
    const priceTierMap: Record<string, string> = {
      [this.configService.get('STRIPE_PRICE_PRO') || '']: 'pro',
      [this.configService.get('STRIPE_PRICE_BUSINESS') || '']: 'business',
      [this.configService.get('STRIPE_PRICE_ENTERPRISE') || '']: 'enterprise',
    };

    return priceTierMap[priceId] || 'free';
  }
}
