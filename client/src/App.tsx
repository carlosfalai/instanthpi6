import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import ThreePanelLayout from '@/components/dashboard/ThreePanelLayout';
import PatientsPage from '@/pages/patients-page';
import DocumentsPage from '@/pages/documents-page';
import EducationPage from '@/pages/education-page';
import FormsPage from '@/pages/forms-page';
import FormBuilderPage from '@/pages/form-builder-page';
import FormViewPage from '@/pages/form-view-page';
import SchedulerPage from '@/pages/scheduler-page';
import FormsitePage from '@/pages/formsite-page';
import PseudonymPage from '@/pages/pseudonym-page';
import MedicationRefillsPage from '@/pages/medication-refills-page';
import InsurancePaperworkPage from '@/pages/insurance-paperwork-page';
import ChronicConditionsPage from '@/pages/chronic-conditions-page';
import KnowledgeBasePage from '@/pages/knowledge-base-page';
import PatientTreatmentPage from '@/pages/patient-treatment-page';
import AiBillingPage from '@/pages/ai-billing-page';
import UrgentCarePage from '@/pages/urgent-care-page';
import SubscriptionPage from '@/pages/subscription-page';
import LeadershipAssociationPage from '@/pages/leadership-association-page';

function Router() {
  return (
    <Switch>
      <Route path="/" component={ThreePanelLayout} />
      <Route path="/patients" component={PatientsPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/education" component={EducationPage} />
      <Route path="/forms" component={FormsPage} />
      <Route path="/forms/new" component={FormBuilderPage} />
      <Route path="/forms/edit/:id" component={FormBuilderPage} />
      <Route path="/forms/:id" component={FormViewPage} />
      <Route path="/scheduler" component={SchedulerPage} />
      <Route path="/formsite" component={FormsitePage} />
      <Route path="/pseudonym" component={PseudonymPage} />
      <Route path="/medication-refills" component={MedicationRefillsPage} />
      <Route path="/insurance-paperwork" component={InsurancePaperworkPage} />
      <Route path="/chronic-conditions" component={ChronicConditionsPage} />
      <Route path="/knowledge-base" component={KnowledgeBasePage} />
      <Route path="/ai-billing" component={AiBillingPage} />
      <Route path="/urgent-care" component={UrgentCarePage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route path="/leadership-association" component={LeadershipAssociationPage} />
      <Route path="/patient/:id/treatment" component={PatientTreatmentPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}