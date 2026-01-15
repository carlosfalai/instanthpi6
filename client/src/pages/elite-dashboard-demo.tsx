import React, { useState } from 'react';
import { EliteLayout } from '../components/elite/EliteLayout';
import { EliteResultDashboard } from '../components/elite/EliteResultDashboard';
import { EliteButton } from '../components/elite/EliteButton';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function EliteDashboardDemo() {
    const [mockReport, setMockReport] = useState("This is a demo report.");

    return (
        <EliteLayout>
            <div className="container mx-auto p-4 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/">
                        <EliteButton variant="ghost" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </EliteButton>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            InstantHPI Dashboard Protocol
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Verification: Smart Grid, AI Co-Pilot, and 1-Click "Phosphomycin" Workflow
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden bg-black/20 border border-white/5 rounded-2xl backdrop-blur-sm relative">
                    {/* 
                        We pass specific mock content to Trigger the "Phosphomycin" Logic.
                        The EliteResultDashboard takes an 'initialContent' or we let it load defaults.
                        For this demo, we'll rely on the default mock content inside the component, 
                        or we can enhance the component to accept props if needed. 
                        
                        Currently EliteResultDashboard has internal state. I'll modify the Component 
                        to ensure it has the "Phosphomycin" trigger in its default state for this demo.
                    */}
                    <EliteResultDashboard
                        onRefineSection={async (id, instruction) => {
                            console.log("Refining", id, instruction);
                            return "Refined content demo";
                        }}
                        initialSections={[
                            {
                                id: 'patient-info',
                                title: 'Patient Information',
                                content: 'PATIENT: Jean Tremblay\nDOB: 1980-01-01',
                                isVisible: true,
                                isExpanded: false
                            },
                            {
                                id: 'soap',
                                title: 'SOAP Note',
                                content: 'S: Urinary Tract Infection symptoms.\n\nO: Acute uncomplicated cystitis.\n\nA: UTI confirmed.',
                                isVisible: true,
                                isExpanded: false
                            },
                            {
                                id: 'plan',
                                title: 'Plan & Treatments',
                                content: '1. Antibiotic therapy: Phosphomycin 3g sachet once.\n2. Hydration.\n3. Follow up if symptoms persist > 3 days.',
                                isVisible: true,
                                isExpanded: true
                            }
                        ]}
                    />
                </div>
            </div>
        </EliteLayout>
    );
}
