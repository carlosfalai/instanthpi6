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