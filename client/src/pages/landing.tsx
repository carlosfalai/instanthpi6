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
  <Card className="glass group relative overflow-hidden transition-all duration-500 hover:neon-glow-primary hover:-translate-y-2">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <CardContent className="relative flex h-full flex-col gap-4 p-8">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500">
        <Icon className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground/90">{description}</p>
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
    description: "Automatisez la collecte d'informations pour vous concentrer sur le diagnostic et les soins.",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité et Conformité",
    description: "Cryptage de bout en bout conforme aux réglementations de santé les plus exigeantes.",
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
    accent: "text-[--accent-blue]",
  },
  {
    icon: CheckCircle,
    highlight: "100%",
    label: "conforme RGPD & normes de santé",
    accent: "text-[--accent-green]",
  },
  {
    icon: Brain,
    highlight: "IA avancée",
    label: "pour des diagnostics plus précis",
    accent: "text-[--accent-purple]",
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
        const { data: { session } } = await supabase.auth.getSession();
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Modern Hero Section */}
      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-12 px-4 py-20 text-center lg:py-32 overflow-hidden">
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-[#141414] border border-[#262626] rounded-full">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-[#a0a0a0]">Omnichannel CRM & Consultation Platform</span>
          </div>

          <h1 className="max-w-5xl text-5xl font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-tight">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
              InstantConsult SaaS
            </span>
            <br />
            <span className="text-white">L&apos;avenir de la consultation automatisée</span>
          </h1>

          <p className="max-w-3xl mx-auto text-xl leading-relaxed text-[#a0a0a0] sm:text-2xl mb-12">
            Optimisez vos interactions et renforcez la relation client.
            <span className="text-white font-medium"> InstantConsult simplifie la collecte d&apos;informations et accélère chaque session professionnelle.</span>
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center">
            <Button
              size="lg"
              className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 px-8 py-6 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 rounded-lg"
              onClick={() => navigate("/doctor-login")}
            >
              <Users className="h-6 w-6 group-hover:rotate-12 transition-transform" aria-hidden />
              <span>Connexion Consultant</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex items-center gap-3 border border-[#262626] bg-[#141414] hover:bg-[#1a1a1a] px-8 py-6 text-lg font-semibold text-white hover:border-[#3a3a3a] transition-all duration-300 hover:scale-105 rounded-lg"
              onClick={() => navigate("/patient-login")}
            >
              <HeartPulse className="h-6 w-6" aria-hidden />
              <span>Accès Client</span>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative bg-[#141414] border-t border-[#262626] px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl mb-4">
              Pourquoi choisir <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">InstantConsult</span> ?
            </h2>
            <p className="text-lg text-[#a0a0a0] max-w-2xl mx-auto">
              Une plateforme complète qui transforme votre activité de conseil
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-black/40 border-t border-border px-4 py-20 lg:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[150px]" />

        <div className="relative mx-auto max-w-7xl text-center">
          <h2 className="text-5xl font-extrabold text-white sm:text-6xl lg:text-7xl mb-6 tracking-tight">
            Impact <span className="text-neon-cyan">Immédiat</span>.
          </h2>
          <p className="text-xl text-muted-foreground mb-20 max-w-2xl mx-auto font-light">
            Des performances supérieures pour des professionnels exigeants.
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map(({ icon: Icon, highlight, label, accent }) => (
              <div
                key={highlight}
                className="group relative glass p-12 transition-all duration-500 hover:neon-glow-secondary hover:-translate-y-4 rounded-3xl"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary/10 border border-secondary/20 mb-8 group-hover:scale-125 group-hover:bg-secondary/20 group-hover:border-secondary/40 transition-all duration-500 shadow-xl shadow-secondary/5">
                  <Icon className="h-10 w-10 text-secondary" aria-hidden />
                </div>
                <p className="text-6xl font-black text-white mb-4 tracking-tighter">{highlight}</p>
                <p className="text-lg text-muted-foreground leading-relaxed uppercase tracking-widest font-bold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#141414] border-t border-[#262626] px-4 py-8 text-center text-sm text-[#6b6b6b]">
        <div className="mx-auto max-w-6xl">
          <p>&copy; {new Date().getFullYear()} InstantConsult SaaS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
