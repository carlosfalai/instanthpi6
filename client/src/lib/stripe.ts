import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Singleton pattern for Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    if (!stripePublishableKey) {
      console.error('[Stripe] VITE_STRIPE_PUBLIC_KEY is not configured');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Subscription tier definitions
export interface SubscriptionTier {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  featuresEn: string[];
  highlighted?: boolean;
  priceId?: string; // Stripe Price ID - will be set after creating products
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'starter',
    name: 'Débutant',
    nameEn: 'Starter',
    description: 'Parfait pour les praticiens individuels',
    descriptionEn: 'Perfect for individual practitioners',
    price: 49,
    currency: 'CAD',
    interval: 'month',
    features: [
      'Jusqu\'à 50 consultations/mois',
      'Anamnèse IA de base',
      'Support par email',
      '1 utilisateur',
    ],
    featuresEn: [
      'Up to 50 consultations/month',
      'Basic AI anamnesis',
      'Email support',
      '1 user',
    ],
  },
  {
    id: 'professional',
    name: 'Professionnel',
    nameEn: 'Professional',
    description: 'Pour les cliniques en croissance',
    descriptionEn: 'For growing clinics',
    price: 149,
    currency: 'CAD',
    interval: 'month',
    features: [
      'Consultations illimitées',
      'Anamnèse IA avancée',
      'Intégration Spruce',
      'Support prioritaire',
      'Jusqu\'à 5 utilisateurs',
      'Rapports SOAP automatisés',
    ],
    featuresEn: [
      'Unlimited consultations',
      'Advanced AI anamnesis',
      'Spruce integration',
      'Priority support',
      'Up to 5 users',
      'Automated SOAP reports',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    nameEn: 'Enterprise',
    description: 'Solution complète pour grandes organisations',
    descriptionEn: 'Complete solution for large organizations',
    price: 399,
    currency: 'CAD',
    interval: 'month',
    features: [
      'Tout de Professionnel',
      'Utilisateurs illimités',
      'API personnalisée',
      'Support dédié 24/7',
      'Formation sur site',
      'SLA garanti 99.9%',
      'Intégrations sur mesure',
    ],
    featuresEn: [
      'Everything in Professional',
      'Unlimited users',
      'Custom API access',
      'Dedicated 24/7 support',
      'On-site training',
      'Guaranteed 99.9% SLA',
      'Custom integrations',
    ],
  },
];

// API calls to backend for Stripe operations
const API_BASE = '/api';

export interface CreateCheckoutSessionParams {
  tierId: string;
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_BASE}/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tierId: params.tierId,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl || `${window.location.origin}/subscription/success`,
      cancelUrl: params.cancelUrl || `${window.location.origin}/pricing`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

export async function createCustomerPortalSession(customerId: string): Promise<{ url: string }> {
  const response = await fetch(`${API_BASE}/stripe/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
      returnUrl: `${window.location.origin}/doctor-dashboard`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create portal session');
  }

  return response.json();
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export async function getSubscriptionStatus(customerId: string): Promise<SubscriptionStatus> {
  const response = await fetch(`${API_BASE}/stripe/subscription-status?customerId=${customerId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get subscription status');
  }

  const data = await response.json();
  return {
    ...data,
    currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
  };
}
