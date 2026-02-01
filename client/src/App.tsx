import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import VehicleDetails from "@/pages/vehicle-details";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Let the dashboard layout or specific pages handle granular loading if needed, or global spinner here
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vehicles" component={Dashboard} />
      <Route path="/vehicles/:id" component={VehicleDetails} />
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
