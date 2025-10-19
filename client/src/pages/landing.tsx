import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Brain,
  Timer,
  Lightbulb,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <Card className="border-[--border-subtle] bg-[--bg-secondary] shadow-sm transition-colors hover:bg-[--bg-secondary]/80">
    <CardContent className="flex h-full flex-col gap-3 p-6">
      <Icon className="h-5 w-5 text-[--accent-purple]" aria-hidden />
      <h3 className="text-lg font-medium text-[--text-primary]">{title}</h3>
      <p className="text-sm leading-relaxed text-[--text-secondary]">{description}</p>
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

  return (
    <div className="min-h-screen bg-[#E6E0F2] text-gray-800">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center gap-8 px-4 py-16 text-center lg:min-h-screen lg:py-24">
        <h1 className="max-w-4xl text-3xl font-medium text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
          InstantHPI : l&apos;avenir de l&apos;anamnèse médicale instantanée
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          Optimisez les diagnostics et renforcez la relation patient-médecin. InstantHPI simplifie la
          collecte d&apos;informations et accélère chaque consultation.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            className="flex items-center gap-2 bg-[--accent-purple] px-6 py-3 text-base font-medium text-[--text-primary] shadow-md transition-colors hover:bg-[#7a4ddb]"
            onClick={() => navigate("/doctor-login")}
          >
            <Stethoscope className="h-5 w-5" aria-hidden />
            Connexion Médecin
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 border-[--border-default] bg-[--bg-secondary] px-6 py-3 text-base font-medium text-[--text-primary] shadow-md transition-colors hover:bg-[--bg-tertiary]"
            onClick={() => navigate("/patient-login")}
          >
            <HeartPulse className="h-5 w-5" aria-hidden />
            Connexion Patient
          </Button>
        </div>
      </section>

      <section className="bg-[--bg-primary] px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-medium text-[--text-primary] sm:text-4xl">
            Pourquoi choisir InstantHPI ?
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#E6E0F2] px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-medium text-gray-900 sm:text-4xl">
            Des soins améliorés, en toute confiance.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {stats.map(({ icon: Icon, highlight, label, accent }) => (
              <div key={highlight} className="flex flex-col items-center gap-3">
                <Icon className={`h-10 w-10 ${accent}`} aria-hidden />
                <p className="text-4xl font-semibold text-gray-900">{highlight}</p>
                <p className="text-lg text-gray-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[--bg-primary] px-4 py-8 text-center text-sm text-[--text-secondary]">
        <div className="mx-auto max-w-6xl">
          <p>&copy; {new Date().getFullYear()} InstantHPI. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
