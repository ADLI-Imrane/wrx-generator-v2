import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * Professional Billing Service - Best Practices Implementation
 *
 * RULES:
 * 1. ONE subscription per customer - NEVER create duplicates
 * 2. Use Stripe's subscription.update() for plan changes
 * 3. Always verify current state before making changes
 * 4. Clean up duplicate subscriptions automatically
 * 5. Use Customer Portal for billing management
 */
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
        links: -1,
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

  /**
   * Get or create a Stripe customer for the user
   */
  private async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      // Verify customer exists in Stripe
      try {
        await this.stripe.customers.retrieve(profile.stripe_customer_id);
        return profile.stripe_customer_id;
      } catch {
        this.logger.warn(`Customer ${profile.stripe_customer_id} not found in Stripe`);
      }
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: { userId },
    });

    await this.supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    return customer.id;
  }

  /**
   * Get the SINGLE active subscription for a customer
   */
  private async getActiveSubscription(customerId: string): Promise<Stripe.Subscription | null> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    return subscriptions.data[0] || null;
  }

  /**
   * CRITICAL: Clean up duplicate subscriptions - keep only the most recent
   */
  private async cleanupDuplicateSubscriptions(customerId: string): Promise<void> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length <= 1) return;

    this.logger.warn(
      `Found ${subscriptions.data.length} active subscriptions for customer ${customerId}`
    );

    // Sort by created date, keep the most recent
    const sorted = subscriptions.data.sort((a, b) => b.created - a.created);

    // Cancel all but the first (most recent)
    for (let i = 1; i < sorted.length; i++) {
      const sub = sorted[i];
      if (sub) {
        this.logger.warn(`Cancelling duplicate subscription: ${sub.id}`);
        await this.stripe.subscriptions.cancel(sub.id);
      }
    }
  }

  /**
   * Get tier name from Stripe price ID
   */
  private getTierFromPriceId(priceId: string | undefined): string {
    if (!priceId) return 'free';
    if (priceId === process.env['STRIPE_PRO_PRICE_ID']) return 'pro';
    if (priceId === process.env['STRIPE_BUSINESS_PRICE_ID']) return 'business';
    return 'free';
  }

  /**
   * Check for pending checkout sessions to prevent duplicates
   */
  private async hasPendingCheckout(customerId: string): Promise<boolean> {
    const sessions = await this.stripe.checkout.sessions.list({
      customer: customerId,
      status: 'open',
      limit: 5,
    });

    // Expire old pending sessions
    for (const session of sessions.data) {
      const age = Date.now() - session.created * 1000;
      if (age > 30 * 60 * 1000) {
        // Older than 30 minutes
        try {
          await this.stripe.checkout.sessions.expire(session.id);
        } catch {
          // Ignore
        }
      }
    }

    return sessions.data.some((s) => {
      const age = Date.now() - s.created * 1000;
      return age < 30 * 60 * 1000; // Less than 30 minutes old
    });
  }

  /**
   * MAIN: Subscribe to a plan
   * Handles new subscriptions AND plan upgrades/downgrades
   */
  async subscribeToPlan(
    userId: string,
    email: string,
    priceId: string,
    successUrl?: string,
    cancelUrl?: string
  ) {
    try {
      // Validate price ID
      const plan = this.plans.find((p) => p.priceId === priceId);
      if (!plan) {
        throw new BadRequestException('Plan invalide');
      }

      const customerId = await this.getOrCreateCustomer(userId, email);

      // CRITICAL: Clean up duplicate subscriptions first
      await this.cleanupDuplicateSubscriptions(customerId);

      // Check for existing active subscription
      const existingSubscription = await this.getActiveSubscription(customerId);

      if (existingSubscription) {
        // User already has a subscription - UPDATE it, don't create new
        const currentPriceId = existingSubscription.items.data[0]?.price.id;

        if (currentPriceId === priceId) {
          throw new BadRequestException('Vous êtes déjà abonné à ce plan');
        }

        // Update existing subscription
        return this.updateExistingSubscription(userId, existingSubscription, priceId);
      }

      // Check for pending checkout sessions
      if (await this.hasPendingCheckout(customerId)) {
        throw new BadRequestException(
          'Vous avez une session de paiement en cours. Veuillez la terminer ou attendre quelques minutes.'
        );
      }

      // Create new checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url:
          successUrl ||
          `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing?success=true`,
        cancel_url:
          cancelUrl ||
          `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing?canceled=true`,
        metadata: { userId },
        subscription_data: {
          metadata: { userId },
        },
        allow_promotion_codes: true,
      });

      return { url: session.url, sessionId: session.id };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to subscribe', error);
      throw new BadRequestException('Échec de la souscription');
    }
  }

  /**
   * Update existing subscription to a new plan (upgrade/downgrade)
   * For upgrade: Creates a checkout session for the difference
   * For downgrade: New price applies from next billing cycle
   */
  private async updateExistingSubscription(
    userId: string,
    subscription: Stripe.Subscription,
    newPriceId: string
  ) {
    const currentItem = subscription.items.data[0];
    if (!currentItem) {
      throw new BadRequestException("Structure d'abonnement invalide");
    }

    const currentPriceId = currentItem.price.id;
    const newPlan = this.plans.find((p) => p.priceId === newPriceId);
    const currentPlan = this.plans.find((p) => p.priceId === currentPriceId);

    if (!newPlan) {
      throw new BadRequestException('Plan invalide');
    }

    const isUpgrade = newPlan.price > (currentPlan?.price || 0);
    const difference = newPlan.price - (currentPlan?.price || 0);

    if (isUpgrade && difference > 0) {
      // UPGRADE: Create a checkout session for the difference amount
      const customerId = subscription.customer as string;

      // Create a checkout session for one-time payment of the difference
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mad',
              product_data: {
                name: `Mise à niveau: ${currentPlan?.name || 'Pro'} → ${newPlan.name}`,
                description: `Différence de prix pour passer au plan ${newPlan.name}`,
              },
              unit_amount: difference * 100, // Convert to centimes
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        // Include session ID in success URL so frontend can complete the upgrade
        success_url: `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing?upgrade=canceled`,
        metadata: {
          userId,
          upgradeFrom: currentPlan?.id || 'pro',
          upgradeTo: newPlan.id,
          subscriptionId: subscription.id,
          newPriceId: newPriceId,
        },
      });

      this.logger.log(
        `Created upgrade checkout for ${difference} MAD: ${currentPlan?.name} → ${newPlan.name}`
      );

      return {
        success: true,
        requiresPayment: true,
        url: session.url,
        sessionId: session.id,
        difference,
        message: `Redirection vers le paiement de ${difference} MAD...`,
      };
    }

    // DOWNGRADE: Schedule the change to take effect at the end of the billing period
    // Simply mark the subscription with metadata and cancel_at_period_end
    // Then create a new subscription with the new plan when the current one ends

    this.logger.log(`Processing downgrade: ${currentPlan?.id} -> ${newPlan.id}`);

    // Store the downgrade info in metadata
    try {
      await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true, // Cancel current subscription at period end
        metadata: {
          ...subscription.metadata,
          scheduled_downgrade_to: newPriceId,
          scheduled_downgrade_tier: newPlan.id,
        },
      });
    } catch (stripeError) {
      this.logger.error('Stripe subscription update failed', stripeError);
      throw new BadRequestException("Erreur lors de la mise à jour de l'abonnement Stripe");
    }

    const newTier = this.getTierFromPriceId(newPriceId);
    const effectiveDate = new Date(subscription.current_period_end * 1000);

    this.logger.log(
      `User ${userId} scheduled downgrade to ${newTier} at period end (${effectiveDate.toISOString()})`
    );

    return {
      success: true,
      requiresPayment: false,
      message: `Votre plan passera à ${newPlan.name} le ${effectiveDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
      tier: currentPlan?.id, // Return current tier, not the new one
      scheduledTier: newTier,
      effectiveDate: effectiveDate,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: effectiveDate,
      },
    };
  }

  /**
   * Preview plan change cost - Simple difference calculation
   */
  async previewPlanChange(userId: string, newPriceId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id, tier')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new BadRequestException('Aucun compte de facturation trouvé');
      }

      const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

      if (!subscription) {
        throw new BadRequestException('Aucun abonnement actif');
      }

      const currentPriceId = subscription.items.data[0]?.price.id;
      if (currentPriceId === newPriceId) {
        throw new BadRequestException('Vous êtes déjà sur ce plan');
      }

      const newPlan = this.plans.find((p) => p.priceId === newPriceId);
      const currentPlan = this.plans.find((p) => p.priceId === currentPriceId);

      if (!newPlan || !currentPlan) {
        throw new BadRequestException('Plan invalide');
      }

      const isUpgrade = newPlan.price > currentPlan.price;
      const difference = Math.abs(newPlan.price - currentPlan.price);

      return {
        currentPlan: currentPlan.name,
        newPlan: newPlan.name,
        currentPrice: currentPlan.price,
        newPrice: newPlan.price,
        isUpgrade,
        difference,
        immediateCharge: isUpgrade ? difference : 0,
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        currency: 'MAD',
        message: isUpgrade
          ? `Vous devez payer ${difference} MAD maintenant pour passer au plan ${newPlan.name}.`
          : `Votre prochain paiement sera de ${newPlan.price} MAD/mois.`,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to preview plan change', error);
      throw new BadRequestException('Échec de la prévisualisation');
    }
  }

  /**
   * Change plan (public method)
   */
  async changePlan(userId: string, newPriceId: string) {
    this.logger.log(`changePlan called: userId=${userId}, newPriceId=${newPriceId}`);

    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id, tier')
        .eq('id', userId)
        .single();

      this.logger.log(`Profile: ${JSON.stringify(profile)}`);

      if (!profile?.stripe_customer_id) {
        throw new BadRequestException('Aucun compte de facturation trouvé');
      }

      await this.cleanupDuplicateSubscriptions(profile.stripe_customer_id);

      const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

      this.logger.log(`Active subscription: ${subscription?.id || 'none'}`);

      if (!subscription) {
        throw new BadRequestException('Aucun abonnement actif');
      }

      const currentPriceId = subscription.items.data[0]?.price.id;
      this.logger.log(`Current priceId: ${currentPriceId}, New priceId: ${newPriceId}`);

      if (currentPriceId === newPriceId) {
        throw new BadRequestException('Vous êtes déjà sur ce plan');
      }

      return this.updateExistingSubscription(userId, subscription, newPriceId);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to change plan', error);
      throw new BadRequestException('Échec du changement de plan');
    }
  }

  /**
   * Downgrade to free plan (cancel subscription at period end)
   */
  async downgradeToFree(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id, tier')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id || profile.tier === 'free') {
        return { success: true, message: 'Déjà sur le plan gratuit', tier: 'free' };
      }

      const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

      if (!subscription) {
        await this.supabase.from('profiles').update({ tier: 'free' }).eq('id', userId);
        return { success: true, message: 'Plan mis à jour', tier: 'free' };
      }

      // Cancel at period end
      await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      return {
        success: true,
        message: 'Abonnement sera annulé à la fin de la période',
        tier: 'free',
        cancelAt: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      this.logger.error('Failed to downgrade', error);
      throw new BadRequestException('Échec du passage au plan gratuit');
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new BadRequestException('Aucun compte de facturation');
      }

      const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

      if (!subscription) {
        throw new BadRequestException('Aucun abonnement actif');
      }

      await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      return {
        success: true,
        message: 'Abonnement sera annulé à la fin de la période',
        cancelAt: new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to cancel', error);
      throw new BadRequestException("Échec de l'annulation");
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new BadRequestException('Aucun compte de facturation');
      }

      const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

      if (!subscription || !subscription.cancel_at_period_end) {
        throw new BadRequestException('Aucun abonnement à réactiver');
      }

      await this.stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      return { success: true, message: 'Abonnement réactivé' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to reactivate', error);
      throw new BadRequestException('Échec de la réactivation');
    }
  }

  /**
   * Create Stripe Customer Portal session
   */
  async createPortalSession(userId: string, returnUrl?: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        throw new BadRequestException('Aucun compte de facturation');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url:
          returnUrl || `${process.env['FRONTEND_URL'] || 'http://localhost:5173'}/billing`,
      });

      return { url: session.url };
    } catch (error) {
      this.logger.error('Failed to create portal', error);
      throw new BadRequestException('Échec de création du portail');
    }
  }

  /**
   * Get current subscription details
   */
  async getSubscription(userId: string) {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('tier, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        throw new NotFoundException('Profil non trouvé');
      }

      const currentPlan = this.plans.find((p) => p.id === profile.tier) || this.plans[0];

      let subscriptionDetails = {
        currentPeriodEnd: null as Date | null,
        cancelAtPeriodEnd: false,
        status: 'active' as string,
        scheduledDowngrade: null as { tier: string; date: Date } | null,
      };

      if (profile.stripe_customer_id) {
        const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

        if (subscription) {
          subscriptionDetails = {
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            status: subscription.status,
            scheduledDowngrade: null,
          };

          // Check metadata for scheduled downgrade (when cancel_at_period_end is true with downgrade metadata)
          if (subscription.metadata?.['scheduled_downgrade_tier']) {
            subscriptionDetails.scheduledDowngrade = {
              tier: subscription.metadata['scheduled_downgrade_tier'],
              date: new Date(subscription.current_period_end * 1000),
            };
            // If there's a scheduled downgrade, it's not a full cancellation
            // The cancelAtPeriodEnd should be interpreted as "downgrade pending"
          }
        }
      }

      return {
        tier: profile.tier || 'free',
        status: subscriptionDetails.status,
        plan: currentPlan,
        currentPeriodEnd: subscriptionDetails.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionDetails.cancelAtPeriodEnd,
        scheduledDowngrade: subscriptionDetails.scheduledDowngrade,
        hasCustomer: !!profile.stripe_customer_id,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to get subscription', error);
      throw new BadRequestException('Échec de récupération');
    }
  }

  /**
   * Get usage statistics
   */
  async getUsage(userId: string) {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      const tier = profile?.tier || 'free';
      const plan = this.plans.find((p) => p.id === tier) || this.plans[0]!;

      const [linksResult, qrResult] = await Promise.all([
        this.supabase
          .from('links')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        this.supabase
          .from('qr_codes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      const linksCount = linksResult.count || 0;
      const qrCodesCount = qrResult.count || 0;

      const calcPercentage = (used: number, limit: number) =>
        limit === -1 ? 0 : Math.min((used / limit) * 100, 100);

      return {
        links: {
          used: linksCount,
          limit: plan.limits.links,
          percentage: calcPercentage(linksCount, plan.limits.links),
        },
        qrCodes: {
          used: qrCodesCount,
          limit: plan.limits.qrCodes,
          percentage: calcPercentage(qrCodesCount, plan.limits.qrCodes),
        },
        clicks: {
          used: 0,
          limit: plan.limits.clicksPerMonth,
          percentage: 0,
        },
        scans: {
          used: 0,
          limit: plan.limits.scansPerMonth,
          percentage: 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get usage', error);
      throw new BadRequestException('Échec de récupération');
    }
  }

  /**
   * Get invoices and payments (includes one-time upgrade payments)
   */
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

      // Get regular invoices (subscriptions)
      const invoices = await this.stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit: 24,
      });

      // Get checkout sessions (one-time payments like upgrades)
      const checkoutSessions = await this.stripe.checkout.sessions.list({
        customer: profile.stripe_customer_id,
        limit: 24,
      });

      // Map invoices
      const invoiceItems = invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        date: new Date(invoice.created * 1000),
        amount: (invoice.amount_paid / 100).toFixed(2),
        currency: invoice.currency.toUpperCase(),
        status: invoice.status,
        pdfUrl: invoice.invoice_pdf,
        hostedUrl: invoice.hosted_invoice_url,
        type: 'subscription' as const,
      }));

      // Map checkout sessions (one-time payments)
      const paymentItems = checkoutSessions.data
        .filter((session) => session.mode === 'payment' && session.payment_status === 'paid')
        .map((session) => ({
          id: session.id,
          number: `PAY-${session.id.slice(-8).toUpperCase()}`,
          date: new Date(session.created * 1000),
          amount: ((session.amount_total || 0) / 100).toFixed(2),
          currency: (session.currency || 'mad').toUpperCase(),
          status: 'paid',
          pdfUrl: null,
          hostedUrl: null,
          type: 'payment' as const,
          description: session.metadata?.['upgradeTo']
            ? `Mise à niveau vers ${session.metadata['upgradeTo']}`
            : 'Paiement unique',
        }));

      // Combine and sort by date (newest first)
      const allItems = [...invoiceItems, ...paymentItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return { invoices: allItems };
    } catch (error) {
      this.logger.error('Failed to get invoices', error);
      throw new BadRequestException('Échec de récupération');
    }
  }

  /**
   * Get available plans
   */
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

  /**
   * Sync subscription from Stripe
   */
  async syncSubscriptionFromStripe(userId: string) {
    this.logger.log(`Syncing subscription for user: ${userId}`);

    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (!profile?.stripe_customer_id) {
        await this.supabase.from('profiles').update({ tier: 'free' }).eq('id', userId);
        return { message: 'Aucun compte Stripe', tier: 'free' };
      }

      // CRITICAL: Clean up duplicates
      await this.cleanupDuplicateSubscriptions(profile.stripe_customer_id);

      const subscription = await this.getActiveSubscription(profile.stripe_customer_id);

      if (!subscription) {
        await this.supabase.from('profiles').update({ tier: 'free' }).eq('id', userId);
        return { message: 'Aucun abonnement actif', tier: 'free' };
      }

      const priceId = subscription.items.data[0]?.price.id;
      const tier = this.getTierFromPriceId(priceId);

      await this.supabase.from('profiles').update({ tier }).eq('id', userId);

      this.logger.log(`Synced user ${userId} to ${tier}`);
      return { message: 'Synchronisé', tier };
    } catch (error) {
      this.logger.error('Failed to sync', error);
      throw new BadRequestException('Échec de synchronisation');
    }
  }

  /**
   * Complete upgrade after payment - called from frontend after Stripe redirect
   * Verifies payment was successful and updates subscription
   */
  async completeUpgrade(userId: string, sessionId: string) {
    this.logger.log(`Completing upgrade for user ${userId}, session ${sessionId}`);

    try {
      // Retrieve the checkout session from Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      // Verify payment was successful
      if (session.payment_status !== 'paid') {
        throw new BadRequestException("Le paiement n'a pas été effectué");
      }

      // Verify this session belongs to the user
      if (session.metadata?.['userId'] !== userId) {
        throw new BadRequestException('Session invalide');
      }

      // Get upgrade details from metadata
      const upgradeTo = session.metadata?.['upgradeTo'];
      const subscriptionId = session.metadata?.['subscriptionId'];
      const newPriceId = session.metadata?.['newPriceId'];

      if (!upgradeTo || !subscriptionId || !newPriceId) {
        throw new BadRequestException('Métadonnées de session manquantes');
      }

      // Retrieve the subscription
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const currentItem = subscription.items.data[0];

      if (!currentItem) {
        throw new BadRequestException('Abonnement invalide');
      }

      // Check if already upgraded (idempotency)
      if (currentItem.price.id === newPriceId) {
        this.logger.log(`User ${userId} already upgraded to ${upgradeTo}`);
        return {
          success: true,
          message: `Vous êtes déjà sur le plan ${upgradeTo}`,
          tier: upgradeTo,
          alreadyUpgraded: true,
        };
      }

      // Update subscription to new plan
      await this.stripe.subscriptions.update(subscriptionId, {
        items: [{ id: currentItem.id, price: newPriceId }],
        proration_behavior: 'none',
      });

      // Update tier in database
      await this.supabase.from('profiles').update({ tier: upgradeTo }).eq('id', userId);

      this.logger.log(`Upgrade completed: ${userId} -> ${upgradeTo}`);

      return {
        success: true,
        message: `Mise à niveau réussie ! Vous êtes maintenant sur le plan ${upgradeTo}.`,
        tier: upgradeTo,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to complete upgrade', error);
      throw new BadRequestException('Échec de la finalisation de la mise à niveau');
    }
  }

  /**
   * Check resource limits
   */
  async checkLimit(
    userId: string,
    resourceType: 'links' | 'qrCodes'
  ): Promise<{ allowed: boolean; message?: string }> {
    const usage = await this.getUsage(userId);
    const resource = usage[resourceType];

    if (resource.limit === -1) return { allowed: true };

    if (resource.used >= resource.limit) {
      return {
        allowed: false,
        message: `Limite atteinte (${resource.limit}). Passez à un plan supérieur.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook non configuré');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Webhook signature failed', err);
      throw new BadRequestException('Signature invalide');
    }

    this.logger.log(`Webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.['userId'];
    if (!userId) return;

    // Check if this is an upgrade payment (one-time payment for difference)
    const upgradeTo = session.metadata?.['upgradeTo'];
    const subscriptionId = session.metadata?.['subscriptionId'];
    const newPriceId = session.metadata?.['newPriceId'];

    if (upgradeTo && subscriptionId && newPriceId && session.mode === 'payment') {
      // This is an upgrade payment - now update the subscription
      this.logger.log(`Upgrade payment completed for user ${userId}: upgrading to ${upgradeTo}`);

      try {
        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        const currentItem = subscription.items.data[0];

        if (currentItem) {
          // Update subscription to new plan
          await this.stripe.subscriptions.update(subscriptionId, {
            items: [{ id: currentItem.id, price: newPriceId }],
            proration_behavior: 'none',
          });

          // Update tier in database
          await this.supabase.from('profiles').update({ tier: upgradeTo }).eq('id', userId);

          this.logger.log(`Upgrade completed: ${userId} -> ${upgradeTo}`);
        }
      } catch (error) {
        this.logger.error(`Failed to complete upgrade for user ${userId}`, error);
      }
      return;
    }

    // Regular subscription checkout
    const subId = session.subscription as string;
    if (!subId) return;

    const subscription = await this.stripe.subscriptions.retrieve(subId);
    const priceId = subscription.items.data[0]?.price.id;
    const tier = this.getTierFromPriceId(priceId);

    await this.supabase
      .from('profiles')
      .update({ tier, stripe_subscription_id: subId })
      .eq('id', userId);

    this.logger.log(`Checkout completed: ${userId} -> ${tier}`);
  }

  private async handleSubscriptionChange(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) return;

    const priceId = subscription.items.data[0]?.price.id;
    let tier = this.getTierFromPriceId(priceId);

    if (!['active', 'trialing'].includes(subscription.status)) {
      tier = 'free';
    }

    await this.supabase.from('profiles').update({ tier }).eq('id', profile.id);
    this.logger.log(`Subscription updated: ${profile.id} -> ${tier}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (!profile) return;

    // Check if there's a scheduled downgrade to another paid plan
    const scheduledDowngradeTo = subscription.metadata?.['scheduled_downgrade_to'];
    const scheduledDowngradeTier = subscription.metadata?.['scheduled_downgrade_tier'];

    if (scheduledDowngradeTo && scheduledDowngradeTier && scheduledDowngradeTier !== 'free') {
      // Create a new subscription with the downgraded plan
      this.logger.log(
        `Creating new subscription for downgrade: ${profile.id} -> ${scheduledDowngradeTier}`
      );

      try {
        // Get the customer's default payment method
        const customer = (await this.stripe.customers.retrieve(customerId)) as Stripe.Customer;
        const defaultPaymentMethod = customer.invoice_settings?.default_payment_method as string;

        if (defaultPaymentMethod) {
          // Create new subscription with the lower plan
          const newSubscription = await this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: scheduledDowngradeTo }],
            default_payment_method: defaultPaymentMethod,
            metadata: { userId: profile.id },
          });

          // Update tier in database
          await this.supabase
            .from('profiles')
            .update({ tier: scheduledDowngradeTier, stripe_subscription_id: newSubscription.id })
            .eq('id', profile.id);

          this.logger.log(`Downgrade completed: ${profile.id} -> ${scheduledDowngradeTier}`);
          return;
        }
      } catch (error) {
        this.logger.error(`Failed to create downgrade subscription for ${profile.id}`, error);
      }
    }

    // No scheduled downgrade or it failed - set to free
    await this.supabase
      .from('profiles')
      .update({ tier: 'free', stripe_subscription_id: null })
      .eq('id', profile.id);

    this.logger.log(`Subscription deleted: ${profile.id} -> free`);
  }

  private handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    this.logger.warn(`Payment failed: ${customerId}`);
  }
}
