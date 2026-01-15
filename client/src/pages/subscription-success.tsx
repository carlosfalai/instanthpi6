import React, { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  PartyPopper,
  Mail,
} from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Parse session_id from URL
    const params = new URLSearchParams(searchString);
    const id = params.get('session_id');
    if (id) {
      setSessionId(id);
    }
  }, [searchString]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      {/* Ambient Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-secondary/5 rounded-full blur-[180px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '-2s' }} />

      <Card className="relative max-w-lg w-full glass border-primary/20 amber-glow-primary overflow-hidden">
        {/* Top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />

        <CardContent className="pt-12 pb-8 px-8 text-center">
          {/* Success Icon */}
          <div className="relative inline-flex mb-8">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center animate-scale-in">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="absolute -top-2 -right-2 animate-bounce">
              <PartyPopper className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-4 animate-fade-in-up" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Bienvenue chez{' '}
            <span className="text-gradient-amber">InstantHPI!</span>
          </h1>

          {/* Message */}
          <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Votre abonnement a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités de votre forfait.
          </p>

          {/* Email notification */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Mail className="h-4 w-4" />
            <span>Un email de confirmation vous a été envoyé</span>
          </div>

          {/* What's Next */}
          <div className="bg-card border border-border rounded-xl p-6 mb-8 text-left animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Prochaines étapes
            </h2>
            <ul className="space-y-3 text-sm">
              {[
                'Accédez à votre tableau de bord',
                'Configurez votre profil médecin',
                'Invitez vos premiers patients',
                'Explorez les fonctionnalités IA',
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {i + 1}
                  </div>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button
              onClick={() => navigate('/doctor-dashboard')}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-background amber-glow-primary group"
            >
              Accéder au Dashboard
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/doctor-profile')}
              className="flex-1 border-border hover:border-primary/30"
            >
              Configurer mon profil
            </Button>
          </div>

          {/* Session ID (for debugging, can be removed in production) */}
          {sessionId && (
            <p className="text-xs text-muted-foreground/50 mt-8">
              Session: {sessionId.slice(0, 20)}...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
