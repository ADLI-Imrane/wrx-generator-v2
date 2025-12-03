import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;
  private supabase;

  // Plan configurations (prices in MAD - Moroccan Dirhams)
  private readonly plans = [
    {
      id: 'free',
      name: 'Gratuit',
      price: 0,
      currency: 'MAD',
      priceId: null,
      features: ['10 liens raccourcis', '5 QR codes', 'Statistiques basiques', 'Support par email'],
      limits: {
        links: 10,
        qrCodes: 5,
        clicksPerMonth: 1000,
        scansPerMonth: 500,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 90,
      currency: 'MAD',
      priceId: process.env['STRIPE_PRO_PRICE_ID'] || 'price_pro',
      features: [
        '100 liens raccourcis',
        '50 QR codes',
        'Statistiques avancées',
        'Domaine personnalisé',
        'Support prioritaire',
      ],
      limits: {
        links: 100,
        qrCodes: 50,
        clicksPerMonth: 10000,
        scansPerMonth: 5000,
      },
    },
    {
      id: 'business',
      name: 'Business',
      price: 290,
      currency: 'MAD',
      priceId: process.env['STRIPE_BUSINESS_PRICE_ID'] || 'price_business',
      features: [
        'Liens illimités',
        'QR codes illimités',
        'Statistiques avancées',
        'Domaines personnalisés illimités',
        'API accès',
        'Support dédié',
        'Export de données',
      ],
      limits: {
        links: -1, // unlimited
        qrCodes: -1,
        clicksPerMonth: -1,
        scansPerMonth: -1,
      },
    },
  ];

  constructor() {
    this.stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] || '', {
      apiVersion: '2025-02-24.acacia',
    });

    this.supabase = createClient(
      process.env['SUPABASE_URL'] || '',
      process.env['SUPABASE_SERVICE_ROLE_KEY'] || ''
    );
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    priceId: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    try {
      // Get or create Stripe customer
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      let customerId = profile?.stripe_customer_id;

      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email,
          metadata: { userId },
        });
        customerId = customer.id;

        // Save customer ID to profile
        await this.supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url:
          successUrl ||
          `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing?success=true`,
        cancel_url:
          cancelUrl ||
          `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing?canceled=true`,
        metadata: { userId },
      });

      return { url: session.url, sessionId: session.id };
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  async createPortalSession(userId: string, returnUrl?: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new BadRequestException('No billing account found');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url:
          returnUrl || `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing`,
      });

      return { url: session.url };
    } catch (error) {
      this.logger.error('Failed to create portal session', error);
      throw new BadRequestException('Failed to create portal session');
    }
  }

  async getSubscription(userId: string) {
    try {
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('tier, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        this.logger.error('Failed to fetch profile', profileError);
        throw new BadRequestException('Failed to fetch profile');
      }

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      const currentPlan = this.plans.find((p) => p.id === profile.tier) || this.plans[0];

      return {
        tier: profile.tier || 'free',
        status: 'active',
        plan: currentPlan,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasCustomer: !!profile.stripe_customer_id,
      };
    } catch (error) {
      this.logger.error('Failed to get subscription', error);
      throw new BadRequestException('Failed to get subscription');
    }
  }

  async getUsage(userId: string) {
    try {
      // Get user's current tier
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      const tierValue = profile?.tier || 'free';
      const plan = this.plans.find((p) => p.id === tierValue) || this.plans[0]!;

      // Count links
      const { count: linksCount } = await this.supabase
        .from('links')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count QR codes
      const { count: qrCodesCount } = await this.supabase
        .from('qr_codes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Count clicks this month (via links table - get link IDs first)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: userLinks } = await this.supabase
        .from('links')
        .select('id')
        .eq('user_id', userId);

      const linkIds = userLinks?.map((l) => l.id) || [];
      let clicksCount = 0;

      if (linkIds.length > 0) {
        const { count } = await this.supabase
          .from('clicks')
          .select('*', { count: 'exact', head: true })
          .in('link_id', linkIds)
          .gte('created_at', startOfMonth.toISOString());
        clicksCount = count || 0;
      }

      // Count scans this month (via qr_codes table)
      const { data: userQRCodes } = await this.supabase
        .from('qr_codes')
        .select('id')
        .eq('user_id', userId);

      const qrCodeIds = userQRCodes?.map((q) => q.id) || [];
      let scansCount = 0;

      if (qrCodeIds.length > 0) {
        const { count } = await this.supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .in('qr_code_id', qrCodeIds)
          .gte('scanned_at', startOfMonth.toISOString());
        scansCount = count || 0;
      }

      return {
        links: {
          used: linksCount || 0,
          limit: plan.limits.links,
          percentage: plan.limits.links === -1 ? 0 : ((linksCount || 0) / plan.limits.links) * 100,
        },
        qrCodes: {
          used: qrCodesCount || 0,
          limit: plan.limits.qrCodes,
          percentage:
            plan.limits.qrCodes === -1 ? 0 : ((qrCodesCount || 0) / plan.limits.qrCodes) * 100,
        },
        clicks: {
          used: clicksCount || 0,
          limit: plan.limits.clicksPerMonth,
          percentage:
            plan.limits.clicksPerMonth === -1
              ? 0
              : ((clicksCount || 0) / plan.limits.clicksPerMonth) * 100,
        },
        scans: {
          used: scansCount || 0,
          limit: plan.limits.scansPerMonth,
          percentage:
            plan.limits.scansPerMonth === -1
              ? 0
              : ((scansCount || 0) / plan.limits.scansPerMonth) * 100,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get usage', error);
      throw new BadRequestException('Failed to get usage');
    }
  }

  async getInvoices(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        return { invoices: [] };
      }

      const invoices = await this.stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit: 24,
      });

      return {
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          date: new Date(invoice.created * 1000),
          amount: (invoice.amount_paid / 100).toFixed(2),
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          pdfUrl: invoice.invoice_pdf,
          hostedUrl: invoice.hosted_invoice_url,
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get invoices', error);
      throw new BadRequestException('Failed to get invoices');
    }
  }

  async cancelSubscription(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_subscription_id) {
        throw new BadRequestException('No active subscription found');
      }

      // Cancel at period end (user keeps access until end of billing period)
      const subscription = await this.stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return {
        message: 'Subscription will be canceled at the end of the billing period',
        cancelAt: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  getPlans() {
    return {
      plans: this.plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        priceId: plan.priceId,
        features: plan.features,
        limits: plan.limits,
      })),
    };
  }

  // Sync subscription from Stripe (useful for local dev without webhooks)
  async syncSubscriptionFromStripe(userId: string) {
    this.logger.log(`=== SYNC CALLED for user: ${userId} ===`);
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        this.logger.log('No Stripe customer found for this user');
        return { message: 'No Stripe customer found', tier: 'free' };
      }

      this.logger.log(`Syncing subscription for customer: ${profile.stripe_customer_id}`);

      // Get ALL active subscriptions for this customer (not just 1)
      const subscriptions = await this.stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 10,
      });

      this.logger.log(`Found ${subscriptions.data.length} active subscriptions`);

      if (subscriptions.data.length === 0) {
        // No active subscription, set to free
        await this.supabase.from('profiles').update({ tier: 'free' }).eq('id', userId);
        return { message: 'No active subscription', tier: 'free' };
      }

      // Find the highest tier among all active subscriptions
      // Priority: business > pro > free
      let highestTier = 'free';
      let _latestSubscription = subscriptions.data[0];

      for (const subscription of subscriptions.data) {
        const priceId = subscription.items.data[0]?.price.id;
        this.logger.log(`Subscription ${subscription.id} has priceId: ${priceId}`);
        this.logger.log(`STRIPE_PRO_PRICE_ID: ${process.env['STRIPE_PRO_PRICE_ID']}`);
        this.logger.log(`STRIPE_BUSINESS_PRICE_ID: ${process.env['STRIPE_BUSINESS_PRICE_ID']}`);

        if (priceId === process.env['STRIPE_BUSINESS_PRICE_ID']) {
          highestTier = 'business';
          _latestSubscription = subscription;
          break; // Business is highest, no need to continue
        } else if (priceId === process.env['STRIPE_PRO_PRICE_ID'] && highestTier !== 'business') {
          highestTier = 'pro';
          _latestSubscription = subscription;
        }
      }

      this.logger.log(`Determined highest tier: ${highestTier}`);

      // Update profile with the highest tier
      const { error } = await this.supabase
        .from('profiles')
        .update({ tier: highestTier })
        .eq('id', userId);

      if (error) {
        this.logger.error('Failed to update profile:', error);
        throw new BadRequestException(`Failed to update profile: ${error.message}`);
      }

      this.logger.log(`Synced user ${userId} to tier ${highestTier}`);
      return { message: 'Subscription synced', tier: highestTier };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to sync subscription:', errorMessage);
      throw new BadRequestException(`Failed to sync subscription: ${errorMessage}`);
    }
  }

  // Helper to check if user can create more resources
  async checkLimit(
    userId: string,
    resourceType: 'links' | 'qrCodes'
  ): Promise<{ allowed: boolean; message?: string }> {
    const usage = await this.getUsage(userId);
    const resource = usage[resourceType];

    if (resource.limit === -1) {
      return { allowed: true };
    }

    if (resource.used >= resource.limit) {
      return {
        allowed: false,
        message: `Vous avez atteint la limite de ${resource.limit} ${resourceType === 'links' ? 'liens' : 'QR codes'} pour votre plan. Passez à un plan supérieur pour en créer plus.`,
      };
    }

    return { allowed: true };
  }

  // Handle Stripe webhooks
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.handlePaymentFailed(invoice);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.['userId'];
    const subscriptionId = session.subscription as string;

    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    // Get subscription details to determine the tier
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;

    // Determine tier from priceId
    let tier = 'free';
    if (priceId === process.env['STRIPE_PRO_PRICE_ID']) {
      tier = 'pro';
    } else if (priceId === process.env['STRIPE_BUSINESS_PRICE_ID']) {
      tier = 'business';
    }

    // Update user profile
    const { error } = await this.supabase
      .from('profiles')
      .update({
        tier: tier,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', userId);

    if (error) {
      this.logger.error('Failed to update profile after checkout', error);
    } else {
      this.logger.log(`User ${userId} upgraded to ${tier}`);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      this.logger.error(`No profile found for customer ${customerId}`);
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;

    // Determine tier from priceId
    let tier = 'free';
    if (priceId === process.env['STRIPE_PRO_PRICE_ID']) {
      tier = 'pro';
    } else if (priceId === process.env['STRIPE_BUSINESS_PRICE_ID']) {
      tier = 'business';
    }

    // Check subscription status
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      tier = 'free';
    }

    await this.supabase.from('profiles').update({ tier: tier }).eq('id', profile.id);

    this.logger.log(`User ${profile.id} subscription updated to ${tier}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    // Find user by customer ID
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) {
      this.logger.error(`No profile found for customer ${customerId}`);
      return;
    }

    // Downgrade to free
    await this.supabase
      .from('profiles')
      .update({
        tier: 'free',
        stripe_subscription_id: null,
      })
      .eq('id', profile.id);

    this.logger.log(`User ${profile.id} downgraded to free`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    this.logger.warn(`Payment failed for customer ${customerId}`);
    // You could send an email notification here
  }
}
