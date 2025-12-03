import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string | null;
  features: string[];
  limits: {
    links: number;
    qrCodes: number;
    clicksPerMonth: number;
    scansPerMonth: number;
  };
}

interface Subscription {
  tier: string;
  status: string;
  plan: Plan;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
}

interface UsageItem {
  used: number;
  limit: number;
  percentage: number;
}

interface Usage {
  links: UsageItem;
  qrCodes: UsageItem;
  clicks: UsageItem;
  scans: UsageItem;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: string;
  currency: string;
  status: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

// Get available plans
export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const response = await api.get<{ plans: Plan[] }>('/billing/plans');
      return response.plans;
    },
  });
}

// Get current subscription
export function useSubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const response = await api.get<Subscription>('/billing/subscription');
      return response;
    },
  });
}

// Get current usage
export function useUsage() {
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: async () => {
      const response = await api.get<Usage>('/billing/usage');
      return response;
    },
  });
}

// Get invoices
export function useInvoices() {
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: async () => {
      const response = await api.get<{ invoices: Invoice[] }>('/billing/invoices');
      return response.invoices;
    },
  });
}

// Create checkout session
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const response = await api.post<{ url: string; sessionId: string }>('/billing/checkout', {
        priceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing?canceled=true`,
      });
      return response;
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

// Create customer portal session
export function useCustomerPortal() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ url: string }>('/billing/portal', {
        returnUrl: `${window.location.origin}/billing`,
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ message: string }>('/billing/cancel', {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

// Sync subscription from Stripe
export function useSyncSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ tier: string; message: string }>('/billing/sync', {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}
