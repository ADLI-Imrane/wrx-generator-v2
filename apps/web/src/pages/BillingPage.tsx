import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckIcon,
  CreditCardIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  usePlans,
  useSubscription,
  useUsage,
  useInvoices,
  useCreateCheckout,
  useCustomerPortal,
  useCancelSubscription,
  useSyncSubscription,
} from '../hooks/useBilling';
import { toast } from 'react-hot-toast';

const planIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  free: SparklesIcon,
  pro: RocketLaunchIcon,
  business: BuildingOffice2Icon,
};

const planDescriptions: Record<string, string> = {
  free: 'Pour commencer',
  pro: 'Pour les créateurs',
  business: 'Pour les équipes',
};

export function BillingPage() {
  const [searchParams] = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // API hooks
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const createCheckout = useCreateCheckout();
  const customerPortal = useCustomerPortal();
  const cancelSubscription = useCancelSubscription();
  const syncSubscription = useSyncSubscription();

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Sync subscription from Stripe
      syncSubscription.mutate(undefined, {
        onSuccess: (data) => {
          toast.success(`Paiement réussi ! Votre plan ${data.tier} est maintenant actif.`);
        },
        onError: () => {
          toast.success('Paiement réussi ! Votre abonnement est maintenant actif.');
        },
      });
    } else if (searchParams.get('canceled') === 'true') {
      toast.error('Paiement annulé.');
    }
  }, [searchParams]);

  // Manual sync handler
  const handleSyncSubscription = () => {
    syncSubscription.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`Plan synchronisé : ${data.tier}`);
      },
      onError: () => {
        toast.error('Erreur lors de la synchronisation');
      },
    });
  };

  const currentPlan = subscription?.plan;

  const _getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.round((used / limit) * 100);
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return '∞';
    return limit.toString();
  };

  const handleSelectPlan = (priceId: string | null) => {
    if (!priceId) {
      toast.error('Ce plan ne nécessite pas de paiement.');
      return;
    }
    createCheckout.mutate(priceId);
  };

  const handleManageBilling = () => {
    customerPortal.mutate();
  };

  const handleCancelSubscription = () => {
    cancelSubscription.mutate(undefined, {
      onSuccess: () => {
        toast.success('Votre abonnement sera annulé à la fin de la période de facturation.');
        setShowCancelModal(false);
      },
      onError: () => {
        toast.error("Erreur lors de l'annulation.");
      },
    });
  };

  const isLoading = plansLoading || subscriptionLoading || usageLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <ArrowPathIcon className="text-primary-600 h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <p className="text-gray-600">Gérez votre abonnement et votre facturation</p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Plan actuel</h2>
            <span className="bg-primary-100 text-primary-700 rounded-full px-3 py-1 text-sm font-medium">
              {currentPlan?.name || 'Gratuit'}
            </span>
          </div>

          <div className="mt-4 flex items-end gap-1">
            <span className="text-4xl font-bold text-gray-900">{currentPlan?.price || 0}</span>
            <span className="mb-1 text-gray-500">MAD/mois</span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {planDescriptions[subscription?.tier || 'free']}
          </p>

          {subscription?.tier !== 'free' && subscription?.currentPeriodEnd && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-600">
                Prochaine facturation :{' '}
                <span className="font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
              {subscription.cancelAtPeriodEnd && (
                <p className="mt-1 text-sm text-red-600">
                  Annulation prévue à la fin de la période
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {subscription?.hasCustomer && (
              <button
                onClick={handleManageBilling}
                disabled={customerPortal.isPending}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {customerPortal.isPending ? 'Chargement...' : 'Gérer le paiement'}
              </button>
            )}
            <button
              onClick={handleSyncSubscription}
              disabled={syncSubscription.isPending}
              className="border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg border px-3 py-2 text-sm font-medium"
              title="Synchroniser avec Stripe"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${syncSubscription.isPending ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Utilisation</h2>

          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Liens créés</span>
                <span className="font-medium text-gray-900">
                  {usage?.links.used || 0} / {formatLimit(usage?.links.limit || 0)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    (usage?.links.percentage || 0) > 80 ? 'bg-yellow-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(usage?.links.percentage || 0, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">QR codes créés</span>
                <span className="font-medium text-gray-900">
                  {usage?.qrCodes.used || 0} / {formatLimit(usage?.qrCodes.limit || 0)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    (usage?.qrCodes.percentage || 0) > 80 ? 'bg-yellow-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(usage?.qrCodes.percentage || 0, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Clics ce mois</span>
                <span className="font-medium text-gray-900">
                  {usage?.clicks.used || 0} / {formatLimit(usage?.clicks.limit || 0)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    (usage?.clicks.percentage || 0) > 80 ? 'bg-yellow-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(usage?.clicks.percentage || 0, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">Scans QR ce mois</span>
                <span className="font-medium text-gray-900">
                  {usage?.scans.used || 0} / {formatLimit(usage?.scans.limit || 0)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    (usage?.scans.percentage || 0) > 80 ? 'bg-yellow-500' : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(usage?.scans.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-500">Compteurs renouvelés le 1er de chaque mois</p>
        </div>
      </div>

      {/* Plans */}
      <div>
        <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <h2 className="text-xl font-semibold text-gray-900">Changer de plan</h2>

          {/* Billing Period Toggle */}
          <div className="flex items-center gap-3 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annuel
              <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                -17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = planIcons[plan.id] || SparklesIcon;
            const price = billingPeriod === 'yearly' ? plan.price * 10 : plan.price; // 2 months free for yearly
            const isCurrentPlan = subscription?.tier === plan.id;
            const isPopular = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 bg-white p-6 ${
                  isPopular ? 'border-primary-500 ring-primary-500 ring-1' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <span className="bg-primary-500 absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white">
                    Populaire
                  </span>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${isPopular ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Icon
                      className={`h-6 w-6 ${isPopular ? 'text-primary-600' : 'text-gray-600'}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{planDescriptions[plan.id]}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-end gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {billingPeriod === 'yearly' && plan.price > 0
                      ? Math.round(price / 12)
                      : plan.price}
                  </span>
                  <span className="mb-1 text-gray-500">MAD/mois</span>
                </div>

                {billingPeriod === 'yearly' && plan.price > 0 && (
                  <p className="mb-4 text-sm text-gray-500">Facturé {price} MAD par an</p>
                )}

                <ul className="mb-6 space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckIcon className="h-4 w-4 flex-shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.priceId)}
                  disabled={isCurrentPlan || createCheckout.isPending}
                  className={`w-full rounded-lg py-2.5 font-medium transition-colors ${
                    isCurrentPlan
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : isPopular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan
                    ? 'Plan actuel'
                    : createCheckout.isPending
                      ? 'Chargement...'
                      : 'Choisir ce plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method - Only show if has customer */}
      {subscription?.hasCustomer && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Méthode de paiement</h2>
            <button
              onClick={handleManageBilling}
              disabled={customerPortal.isPending}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {customerPortal.isPending ? 'Chargement...' : 'Modifier'}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-lg bg-gray-100 p-3">
              <CreditCardIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Géré par Stripe</p>
              <p className="text-sm text-gray-500">
                Cliquez sur Modifier pour gérer vos méthodes de paiement
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Historique de facturation</h2>

        {invoicesLoading ? (
          <div className="mt-4 flex justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : invoices.length === 0 ? (
          <p className="mt-4 text-gray-500">Aucune facture pour le moment.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Numéro</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 text-gray-600">{invoice.number}</td>
                    <td className="py-3 font-medium text-gray-900">
                      {invoice.amount} {invoice.currency}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : invoice.status === 'open'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {invoice.status === 'paid'
                          ? 'Payée'
                          : invoice.status === 'open'
                            ? 'En attente'
                            : invoice.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Télécharger
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Subscription */}
      {subscription?.tier !== 'free' && !subscription?.cancelAtPeriodEnd && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-red-100 p-2">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Annuler l'abonnement</h3>
              <p className="mt-1 text-sm text-red-700">
                Vous perdrez l'accès aux fonctionnalités premium à la fin de votre période de
                facturation.
              </p>
              <button
                onClick={() => setShowCancelModal(true)}
                className="mt-3 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Annuler mon abonnement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Annuler votre abonnement ?</h3>
            <p className="mt-2 text-gray-600">
              Votre abonnement restera actif jusqu'à la fin de la période de facturation actuelle.
              Après cette date, vous passerez au plan gratuit.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="btn btn-outline flex-1">
                Garder mon plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelSubscription.isPending}
                className="btn flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelSubscription.isPending ? 'Annulation...' : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
