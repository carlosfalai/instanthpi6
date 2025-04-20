import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import ThreePanelLayout from '@/components/dashboard/ThreePanelLayout';
import PatientsPage from '@/pages/patients-page';
import DocumentsPage from '@/pages/documents-page';

function Router() {
  return (
    <Switch>
      <Route path="/" component={ThreePanelLayout} />
      <Route path="/patients" component={PatientsPage} />
      <Route path="/documents" component={DocumentsPage} />
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