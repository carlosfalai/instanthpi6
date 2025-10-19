```typescript
import React from 'react';
import { useLocation } from 'wouter'; // Assuming useLocation provides access to `navigate`
import {
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Brain,
  Timer,
  Lightbulb,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

// Helper component for displaying features
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  // Applying Default Card styling from the design system
  // This uses dark theme elements to create visual contrast against the light page sections.
  <div className="
    bg-[--bg-secondary] 
    border border-[--border-subtle] 
    rounded-lg 
    p-6 
    hover:bg-[--bg-secondary]/80 
    transition-colors
    flex flex-col items-start text-left
    h-full // Ensure cards in a grid have equal height
  ">
    {/* Icon: 20px (w-5 h-5), accent purple color */}
    <Icon className="w-5 h-5 text-[--accent-purple] mb-4" aria-hidden="true" />
    {/* Title: Text-lg, font-medium, primary text color */}
    <h3 className="text-lg font-medium text-[--text-primary] mb-2">{title}</h3>
    {/* Description: Text-sm, secondary text color, relaxed line height */}
    <p className="text-sm text-[--text-secondary] leading-relaxed">{description}</p>
  </div>
);

const Landing: React.FC = () => {
  const [_, navigate] = useLocation(); // `useLocation` hook for navigation

  return (
    // Main container with patient-facing light theme background
    <div className="min-h-screen bg-[#E6E0F2] text-gray-800 font-sans">

      {/* Hero Section: Above-the-fold welcome, light theme */}
      <section className="
        relative flex flex-col items-center justify-center 
        min-h-[calc(100vh-3.5rem)] lg:min-h-screen // Full viewport height minus typical top nav height
        text-center 
        px-4 py-16 lg:py-24 
        max-w-7xl mx-auto
      ">
        {/* Main Headline: Responsive font sizes, font-medium */}
        <h1 className="
          text-3xl sm:text-4xl md:text-5xl lg:text-6xl 
          font-medium text-gray-900 
          mb-6 
          leading-tight
          max-w-4xl
        ">
          InstantHPI : L'avenir de l'anamnèse médicale instantanée
        </h1>
        {/* Supporting Copy: Responsive font sizes, gray text */}
        <p className="
          text-lg sm:text-xl 
          text-gray-600 
          mb-10 
          max-w-3xl
          leading-relaxed
        ">
          Optimisez les diagnostics, améliorez les soins. Pour les médecins et les patients, InstantHPI transforme la collecte d'informations.
        </p>

        {/* Call to Actions: Doctor and Patient login buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Doctor Login Button: Accent purple background for primary action */}
          <button
            onClick={() => navigate('/doctor-login')}
            className="
              flex items-center justify-center gap-3
              px-6 py-3 
              bg-[--accent-purple] 
              text-[--text-primary] 
              rounded-md 
              hover:bg-[#7a4ddb] /* Slightly darker purple on hover */
              transition-colors 
              text-base font-medium
              shadow-md
            "
          >
            <Stethoscope className="w-5 h-5" aria-hidden="true" />
            <span className="text-base">Connexion Médecin</span>
          </button>

          {/* Patient Login Button: Secondary background from design system */}
          <button
            onClick={() => navigate('/patient-login')}
            className="
              flex items-center justify-center gap-3
              px-6 py-3 
              bg-[--bg-secondary] 
              border border-[--border-default] 
              text-[--text-primary] 
              rounded-md 
              hover:bg-[--bg-tertiary] 
              transition-colors 
              text-base font-medium
              shadow-md
            "
          >
            <HeartPulse className="w-5 h-5" aria-hidden="true" />
            <span className="text-base">Connexion Patient</span>
          </button>
        </div>
      </section>

      {/* Features Section: Differentiating features, uses dark primary background */}
      <section className="bg-[--bg-primary] py-16 lg:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading: Dark primary background, primary text color */}
          <h2 className="text-3xl sm:text-4xl font-medium text-[--text-primary] text-center mb-12">
            Pourquoi choisir InstantHPI ?
          </h2>

          {/* Grid for Feature Cards: Responsive layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={Brain}
              title="Anamnèse Intelligente"
              description="Capturez des antécédents médicaux précis et complets grâce à notre IA intuitive, réduisant le temps de saisie."
            />
            <FeatureCard
              icon={Timer}
              title="Gain de Temps Précieux"
              description="Automatisez la collecte d'informations et concentrez-vous sur ce qui compte vraiment : le diagnostic et les soins patients."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Sécurité et Conformité"
              description="Vos données sont protégées avec un cryptage de bout en bout, conforme aux réglementations de santé les plus strictes."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Amélioration du Diagnostic"
              description="Accédez à des données structurées et pertinentes pour une prise de décision clinique éclairée."
            />
          </div>
        </div>
      </section>

      {/* Credibility/Stats Section: Light theme background */}
      <section className="bg-[#E6E0F2] py-16 lg:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Section Heading: Light background, dark text */}
          <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 mb-12">
            Des soins améliorés, en toute confiance.
          </h2>
          {/* Grid for Stats: Responsive layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <Lightbulb className="w-10 h-10 text-[--accent-blue] mx-auto mb-4" aria-hidden="true" />
              <p className="text-4xl font-semibold text-gray-900 mb-2">+30%</p>
              <p className="text-lg text-gray-600">de temps gagné par consultation</p>
            </div>
            <div className="p-6">
              <CheckCircle className="w-10 h-10 text-[--accent-green] mx-auto mb-4" aria-hidden="true" />
              <p className="text-4xl font-semibold text-gray-900 mb-2">100%</p>
              <p className="text-lg text-gray-600">conforme RGPD & normes de santé</p>
            </div>
            <div className="p-6">
              <Brain className="w-10 h-10 text-[--accent-purple] mx-auto mb-4" aria-hidden="true" />
              <p className="text-4xl font-semibold text-gray-900 mb-2">IA Avancée</p>
              <p className="text-lg text-gray-600">pour des diagnostics plus précis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer: Dark primary background, secondary text color */}
      <footer className="bg-[--bg-primary] text-[--text-secondary] py-8 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} InstantHPI. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
```