import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import PatientConsultation from "@/pages/PatientConsultation";
import SpruceChatPage from "@/pages/SpruceChatPage";
import PatientDashboardPage from "@/pages/PatientDashboardPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PatientDashboardPage}/>
      <Route path="/chat" component={SpruceChatPage}/>
      <Route path="/dashboard" component={Dashboard}/>
      <Route path="/patient/:id" component={PatientConsultation}/>
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
