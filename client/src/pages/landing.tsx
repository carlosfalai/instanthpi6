import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { supabase } from "../lib/supabase";
import {
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Brain,
  Timer,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Users,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <Card className="glass group relative overflow-hidden transition-all duration-500 hover:amber-glow-primary hover:-translate-y-2 border-border/50">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <CardContent className="relative flex h-full flex-col gap-4 p-8">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500">
        <Icon className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h3
        className="text-xl font-bold text-foreground tracking-tight"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const features: FeatureCardProps[] = [
  {
    icon: Brain,
    title: "Anamnèse Intelligente",
    description: "Capturez des antécédents médicaux précis et complets grâce à notre IA intuitive.",
  },
  {
    icon: Timer,
    title: "Gain de Temps Précieux",
    description:
      "Automatisez la collecte d'informations pour vous concentrer sur le diagnostic et les soins.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité et Conformité",
    description:
      "Cryptage de bout en bout conforme aux réglementations de santé les plus exigeantes.",
  },
  {
    icon: TrendingUp,
    title: "Décisions Éclairées",
    description: "Accédez à des dossiers structurés pour faciliter la prise de décision clinique.",
  },
];

const stats = [
  {
    icon: Lightbulb,
    highlight: "+30%",
    label: "de temps gagné par consultation",
  },
  {
    icon: CheckCircle,
    highlight: "100%",
    label: "conforme RGPD & normes de santé",
  },
  {
    icon: Brain,
    highlight: "IA avancée",
    label: "pour des diagnostics plus précis",
  },
];

const Landing: React.FC = () => {
  const [, navigate] = useLocation();

  // Check if doctor is already authenticated and redirect to dashboard
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Check localStorage auth (demo mode)
      const isLocalAuth = localStorage.getItem("doctor_authenticated") === "true";

      if (isLocalAuth) {
        navigate("/doctor-dashboard");
        return;
      }

      // Check Supabase session
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          navigate("/doctor-dashboard");
          return;
        }
      } catch (error) {
        // If there's an error checking session, just continue to show landing page
        console.log("Auth check error:", error);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Modern Hero Section */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-12 px-4 py-20 text-center lg:py-32 overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />
        <div
          className="fixed bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-secondary/5 rounded-full blur-[180px] animate-glow-pulse pointer-events-none"
          style={{ animationDelay: "-2s" }}
        />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(245, 158, 11, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(245, 158, 11, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-card border border-border rounded-full animate-fade-in-up">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Omnichannel CRM & Consultation Platform
            </span>
          </div>

          <h1
            className="max-w-5xl text-5xl font-bold text-foreground sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-tight animate-fade-in-up"
            style={{ fontFamily: "Outfit, sans-serif", animationDelay: "0.1s" }}
          >
            <span className="text-gradient-amber">InstantConsult SaaS</span>
            <br />
            <span className="text-foreground">L&apos;avenir de la consultation automatisée</span>
          </h1>

          <p
            className="max-w-3xl mx-auto text-xl leading-relaxed text-muted-foreground sm:text-2xl mb-12 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Optimisez vos interactions et renforcez la relation client.
            <span className="text-foreground font-medium">
              {" "}
              InstantConsult simplifie la collecte d&apos;informations et accélère chaque session
              professionnelle.
            </span>
          </p>

          <div
            className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              size="lg"
              className="group flex items-center gap-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 px-8 py-6 text-lg font-semibold text-background shadow-lg amber-glow-primary hover:amber-glow-intense transition-all duration-300 hover:scale-105 rounded-xl"
              onClick={() => navigate("/doctor-login")}
            >
              <Users className="h-6 w-6 group-hover:rotate-12 transition-transform" aria-hidden />
              <span>Connexion Consultant</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex items-center gap-3 border border-border bg-card hover:bg-card/80 px-8 py-6 text-lg font-semibold text-foreground hover:border-primary/30 transition-all duration-300 hover:scale-105 rounded-xl"
              onClick={() => navigate("/patient-login")}
            >
              <HeartPulse className="h-6 w-6" aria-hidden />
              <span>Accès Client</span>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative bg-card border-t border-border px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl mb-4"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Pourquoi choisir <span className="text-gradient-amber">InstantConsult</span> ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète qui transforme votre activité de conseil
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-background border-t border-border px-4 py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[180px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-secondary/3 rounded-full blur-[180px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl text-center">
          <h2
            className="text-5xl font-bold text-foreground sm:text-6xl lg:text-7xl mb-6 tracking-tight animate-fade-in-up"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Impact <span className="text-amber-glow">Immédiat</span>.
          </h2>
          <p
            className="text-xl text-muted-foreground mb-20 max-w-2xl mx-auto font-light animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Des performances supérieures pour des professionnels exigeants.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map(({ icon: Icon, highlight, label }, index) => (
              <div
                key={highlight}
                className="group relative glass p-12 transition-all duration-500 hover:amber-glow-secondary hover:-translate-y-4 rounded-3xl border border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/10 border border-secondary/20 mb-8 group-hover:scale-125 group-hover:bg-secondary/20 group-hover:border-secondary/40 transition-all duration-500 shadow-xl">
                  <Icon className="h-10 w-10 text-secondary" aria-hidden />
                </div>
                <p
                  className="text-6xl font-bold text-foreground mb-4 tracking-tighter"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {highlight}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed uppercase tracking-widest font-semibold">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl">
          <p>&copy; {new Date().getFullYear()} InstantConsult SaaS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
