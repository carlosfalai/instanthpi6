# Goal
Generate an updated `Landing` page component for the InstantHPI application. The page must welcome both doctors and patients, communicate the platform's value quickly, and route visitors to the correct login portals.

# Output format
- Return a single React component named `Landing`.
- Code must be valid TypeScript and JSX that fits into `client/src/pages/landing.tsx`.
- Use Tailwind utility classes plus the existing shadcn/ui primitives already used in the project (`Button`, `Card`, etc.).
- Do not wrap the answer in Markdown fences; emit pure source code only.

# Visual direction
- Patient-facing sections use the light theme background (`#E6E0F2`). Doctor-specific panels can lean on darker neutrals from the design system.
- Follow the spacing rhythm and typography from the design system (baseline 4px grid, headings in `font-medium`, body copy in `text-sm`).
- Add an above-the-fold hero with a concise headline, supporting copy, and two prominent calls-to-action (doctor, patient).
- Include a secondary section that highlights 3–4 differentiating features with iconography aligned to the design system.
- Close with a credibility or stats row (e.g., compliance, AI assistance, time saved).

# Interaction logic
- Continue to use the existing `useLocation` hook from wouter for navigation (`navigate("/doctor-login")`, `navigate("/patient-login")`).
- Buttons should carry consistent iconography (lucide-react icons already imported in the current page).
- Keep copy in French where it already exists (e.g., “Connexion Médecin”, “Connexion Patient”).

# Additional guidance
- Wherever practical, break long sections into composable helper components inside the same file (e.g., `FeatureCard`).
- Ensure the layout adapts gracefully on mobile (stacked cards) and expands with a responsive grid on larger viewports.
- Emphasize accessibility: provide informative alt text when using decorative imagery placeholders, enforce readable contrast per the design palette.

# Deliverable
Return the complete React component ready to replace the existing landing page implementation.
