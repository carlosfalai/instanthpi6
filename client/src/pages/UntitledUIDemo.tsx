import React from "react";
import { Button } from "@/components/base/buttons/button"; // Untitled UI Button
import { EliteLayout } from "@/components/elite";

export default function UntitledUIDemo() {
  return (
    <EliteLayout title="Untitled UI Integration Demo" description="Showcasing the new components">
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button color="primary" size="sm">
              Primary SM
            </Button>
            <Button color="primary" size="md">
              Primary MD
            </Button>
            <Button color="primary" size="lg">
              Primary LG
            </Button>
            <Button color="secondary" size="md">
              Secondary
            </Button>
            <Button color="tertiary" size="md">
              Tertiary
            </Button>
            <Button color="primary-destructive" size="md">
              Destructive
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Theme Colors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="h-16 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs">
              Brand 500
            </div>
            <div className="h-16 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs">
              Brand 600
            </div>
            <div className="h-16 rounded-lg bg-error-500 flex items-center justify-center text-white text-xs">
              Error 500
            </div>
            <div className="h-16 rounded-lg bg-warning-500 flex items-center justify-center text-white text-xs">
              Warning 500
            </div>
            <div className="h-16 rounded-lg bg-success-500 flex items-center justify-center text-white text-xs">
              Success 500
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Layout Verification
          </h2>
          <div className="p-6 rounded-xl border border-border bg-card text-card-foreground shadow-sm">
            <h3 className="font-semibold mb-2">Card Component Test</h3>
            <p className="text-muted-foreground text-sm">
              This card uses the project's 'card' tokens which should now map to the new theme
              values if configured correctly.
            </p>
          </div>
        </section>
      </div>
    </EliteLayout>
  );
}
