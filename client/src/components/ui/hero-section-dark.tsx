import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

interface HeroSectionProps {
  className?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  features?: Array<{
    icon: React.ReactNode;
    label: string;
  }>;
}

export function HeroSectionDark({
  className,
  title = "Next Generation Medical Platform",
  subtitle = "AI-Powered Healthcare",
  description = "Transform your medical practice with intelligent workflow automation, real-time patient communication, and advanced diagnostic support.",
  primaryAction = {
    label: "Get Started",
    onClick: () => {},
  },
  secondaryAction = {
    label: "Learn More",
    onClick: () => {},
  },
  features = [
    { icon: <Zap className="h-4 w-4" />, label: "AI-Powered" },
    { icon: <Shield className="h-4 w-4" />, label: "HIPAA Compliant" },
    { icon: <Sparkles className="h-4 w-4" />, label: "Real-time Sync" },
  ],
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "border border-slate-700/50 rounded-2xl p-8 lg:p-12",
        className
      )}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <Badge variant="outline" className="mb-6 border-slate-600 text-slate-300 bg-slate-800/50">
          <Sparkles className="h-3 w-3 mr-2" />
          {subtitle}
        </Badge>

        {/* Main Title */}
        <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
          {title}
        </h1>

        {/* Description */}
        <p className="text-lg lg:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {features.map((feature, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-slate-800/80 text-slate-300 border-slate-600/50 px-3 py-1"
            >
              {feature.icon}
              <span className="ml-1">{feature.label}</span>
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={primaryAction.onClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 group"
          >
            {primaryAction.label}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={secondaryAction.onClick}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {secondaryAction.label}
          </Button>
        </div>
      </div>
    </section>
  );
}
