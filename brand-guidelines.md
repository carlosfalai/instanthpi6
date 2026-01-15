# InstantHPI Brand Guidelines

## Brand Identity

**Company**: InstantHPI (InstantConsult SaaS)
**Tagline**: "L'avenir de la consultation automatisée"
**Industry**: Medical/Healthcare Technology - AI-Powered Consultation Platform

## Visual Standards - Obsidian Precision Theme

### Color Palette

**Primary Colors (Amber Spectrum)**:
- **Amber 500**: #f59e0b (HSL: 38 92% 50%) - Primary accent, buttons, highlights
- **Amber 400**: #fbbf24 - Hover states, secondary highlights
- **Amber 600**: #d97706 (HSL: 32 95% 44%) - Secondary accent, gradients

**Background Colors (Obsidian)**:
- **Obsidian 900**: #0a0908 - Primary background
- **Obsidian 800**: #12110f - Secondary background, cards
- **Obsidian 700**: #1a1816 - Tertiary, elevated surfaces
- **Obsidian 600**: #24211d - Borders, dividers

**Neutral Warm Grays**:
- **Warm Gray 50**: #faf9f7 - Primary text
- **Warm Gray 400**: #a8a29e - Secondary text
- **Warm Gray 500**: #78716c - Tertiary text, placeholders

**Status Colors**:
- **Success**: #22c55e - Positive states
- **Warning**: #f59e0b - Cautions (matches primary)
- **Error**: #ef4444 - Negative states, alerts
- **Info**: #3b82f6 - Informational

### Typography

**Display Font**: Outfit (Google Fonts)
- Used for: Headings, hero text, brand elements
- Weights: 300-900
- Character: Modern, geometric, premium feel

**Body Font**: DM Sans (Google Fonts)
- Used for: Body text, UI elements, forms
- Weights: 400-700, italic variants
- Character: Clean, readable, professional

**Font Hierarchy**:
- **H1**: 4.5rem-7.5rem, Outfit Bold, text-gradient-amber
- **H2**: 3rem-6rem, Outfit Bold, foreground
- **H3**: 1.875rem, Outfit Semibold, foreground
- **Body**: 1rem, DM Sans Regular, muted-foreground
- **Small**: 0.875rem, DM Sans Regular, muted-foreground

### Visual Effects

**Glassmorphism**:
```css
.glass {
  background: rgba(18, 17, 15, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```

**Amber Glow Effects**:
```css
.amber-glow-primary {
  box-shadow: 0 0 40px rgba(245, 158, 11, 0.15);
}

.amber-glow-intense {
  box-shadow: 0 0 60px rgba(245, 158, 11, 0.25);
}
```

**Text Gradient**:
```css
.text-gradient-amber {
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Logo & Branding

**Logo Element**: Sparkles icon from Lucide
- Container: 36px rounded-xl with amber gradient background
- Icon: 20px, background color (dark on amber)
- Glow: amber-glow-primary effect

**Brand Name Display**:
- Font: Outfit, Bold
- Size: 1.125rem (18px)
- Tracking: tight (-0.025em)

## UI Component Standards

### Buttons

**Primary Button**:
```css
background: linear-gradient(to right, #f59e0b, #d97706);
color: #0a0908;
padding: 0.75rem 2rem;
border-radius: 0.75rem;
font-weight: 600;
box-shadow: amber-glow-primary;
```

**Secondary Button**:
```css
background: transparent;
border: 1px solid rgba(255, 255, 255, 0.06);
color: #faf9f7;
```

### Cards

**Standard Card**:
```css
background: #12110f;
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 1rem;
padding: 1.5rem;
```

**Hover State**:
- translateY(-2px)
- border-color: primary/20
- box-shadow: amber-glow-primary

### Forms

**Input Fields**:
```css
background: #1a1816;
border: 1px solid rgba(255, 255, 255, 0.06);
border-radius: 0.75rem;
color: #faf9f7;
```

**Focus State**:
```css
border-color: #f59e0b;
box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
```

## Animation Standards

**Easing**: cubic-bezier(0.16, 1, 0.3, 1) - ease-out-expo
**Default Duration**: 250ms
**Hover Transitions**: 300ms

**Page Load Animation**:
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Stagger Delays**: 0.1s increments for sequential elements

**Ambient Glow Pulse**:
```css
@keyframes glow-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
```

## Content Guidelines

### Tone of Voice

- **Professional**: Medical-grade credibility
- **Elegant**: Premium, refined language
- **Bilingual**: French primary, English secondary
- **Trustworthy**: HIPAA/RGPD compliant messaging

### Key Messaging

**Value Propositions**:
1. "Anamnèse Intelligente" - AI-powered patient history
2. "Gain de Temps Précieux" - Time efficiency
3. "Sécurité et Conformité" - Regulatory compliance
4. "Décisions Éclairées" - Data-driven decisions

**Statistics Display**:
- +30% de temps gagné par consultation
- 100% conforme RGPD & normes de santé
- IA avancée pour des diagnostics plus précis

## Accessibility

- Minimum contrast ratio: 4.5:1 for body text
- Focus states: 2px amber outline with 2px offset
- Interactive elements: minimum 44x44px touch target
- Selection highlight: rgba(245, 158, 11, 0.3)

## File Locations

- **Design System**: `client/src/styles/design-system.css`
- **Tailwind Config**: `client/src/index.css`
- **Components**: `client/src/components/`
- **Pages**: `client/src/pages/`
