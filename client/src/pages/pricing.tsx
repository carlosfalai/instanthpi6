import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Check,
  Sparkles,
  ArrowRight,
  Zap,
  Building2,
  User,
  Crown,
} from 'lucide-react';
import { SUBSCRIPTION_TIERS, createCheckoutSession, getStripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';

const tierIcons: Record<string, React.ElementType> = {
  starter: User,
  professional: Zap,
  enterprise: Building2,
};

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const handleSubscribe = async (tierId: string) => {
    setLoading(tierId);

    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        // Redirect to login with return URL
        navigate(`/doctor-login?redirect=/pricing&tier=${tierId}`);
        return;
      }

      // Create checkout session
      const { url } = await createCheckoutSession({
        tierId,
        customerEmail: session.user.email || undefined,
      });

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      // Show error toast or message
    } finally {
      setLoading(null);
    }
  };

  const getYearlyPrice = (monthlyPrice: number) => {
    // 20% discount for yearly
    return Math.round(monthlyPrice * 12 * 0.8);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-secondary/5 rounded-full blur-[180px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '-2s' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border glass-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary amber-glow-primary">
                <Sparkles className="h-5 w-5 text-background" />
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>InstantHPI</span>
            </button>
            <Button
              variant="outline"
              onClick={() => navigate('/doctor-login')}
              className="border-border hover:border-primary/30"
            >
              Connexion
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
            <Crown className="h-3 w-3 mr-1" />
            Tarification Simple et Transparente
          </Badge>

          <h1 className="text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Choisissez votre{' '}
            <span className="text-gradient-amber">forfait</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Des solutions adaptées à chaque taille de pratique médicale.
            Commencez gratuitement et évoluez selon vos besoins.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 bg-card border border-border rounded-xl mb-16">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                billingInterval === 'month'
                  ? 'bg-primary text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                billingInterval === 'year'
                  ? 'bg-primary text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annuel
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                -20%
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-20 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {SUBSCRIPTION_TIERS.map((tier, index) => {
              const Icon = tierIcons[tier.id] || User;
              const price = billingInterval === 'year'
                ? getYearlyPrice(tier.price)
                : tier.price;
              const isLoading = loading === tier.id;

              return (
                <Card
                  key={tier.id}
                  className={`relative overflow-hidden transition-all duration-500 hover:-translate-y-2 ${
                    tier.highlighted
                      ? 'border-primary/50 amber-glow-primary'
                      : 'border-border/50 hover:border-primary/20'
                  } ${tier.highlighted ? 'glass' : 'bg-card'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {tier.highlighted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                  )}

                  <CardHeader className="pb-4">
                    {tier.highlighted && (
                      <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border-primary/30">
                        Populaire
                      </Badge>
                    )}

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      tier.highlighted
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-muted/50 border border-border'
                    }`}>
                      <Icon className={`h-6 w-6 ${tier.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    <CardTitle className="text-2xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {tier.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        ${price}
                      </span>
                      <span className="text-muted-foreground">
                        /{billingInterval === 'year' ? 'an' : 'mois'}
                      </span>
                    </div>

                    {billingInterval === 'year' && (
                      <p className="text-sm text-muted-foreground">
                        Économisez ${tier.price * 12 - price} par an
                      </p>
                    )}

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isLoading}
                      className={`w-full group ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-background amber-glow-primary'
                          : 'bg-card border border-border hover:border-primary/30'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Chargement...
                        </span>
                      ) : (
                        <>
                          Commencer
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    {/* Features */}
                    <ul className="space-y-3 pt-4 border-t border-border">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 shrink-0 mt-0.5 ${
                            tier.highlighted ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative border-t border-border bg-card py-20 lg:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Questions Fréquentes
          </h2>
          <p className="text-muted-foreground mb-12">
            Tout ce que vous devez savoir sur nos forfaits
          </p>

          <div className="text-left space-y-6">
            {[
              {
                q: 'Puis-je changer de forfait à tout moment?',
                a: 'Oui, vous pouvez passer à un forfait supérieur ou inférieur à tout moment. Les changements prennent effet immédiatement.',
              },
              {
                q: 'Y a-t-il une période d\'essai gratuite?',
                a: 'Nous offrons une démo personnalisée et un essai de 14 jours pour le forfait Professionnel.',
              },
              {
                q: 'Comment fonctionne la facturation?',
                a: 'La facturation est automatique, mensuelle ou annuelle selon votre choix. Vous recevrez une facture par email.',
              },
              {
                q: 'Mes données sont-elles sécurisées?',
                a: 'Absolument. Nous utilisons un cryptage de bout en bout et sommes conformes aux normes RGPD et de santé.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-6 bg-background border border-border rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} InstantHPI. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
