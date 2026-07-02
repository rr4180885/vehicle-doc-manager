import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Vehicles from "@/pages/vehicles";
import VehicleDetails from "@/pages/vehicle-details";
import DrivingLicenses from "@/pages/driving-licenses";
import DrivingLicenseDetails from "@/pages/driving-license-details";
import AdminUsers from "@/pages/admin-users";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import { useAuth, getDefaultHomePath } from "@/hooks/use-auth";

function HomeRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation(getDefaultHomePath(user));
    }
  }, [isLoading, isAuthenticated, user, setLocation]);

  if (isLoading) return null;
  if (!isAuthenticated) return <Landing />;
  return null;
}

function RequireDashboard({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, canAccessVehicles, canAccessDrivingLicenses } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccessVehicles && !canAccessDrivingLicenses) {
      setLocation("/");
    }
  }, [isLoading, isAuthenticated, canAccessVehicles, canAccessDrivingLicenses, setLocation]);

  if (isLoading || (!canAccessVehicles && !canAccessDrivingLicenses)) return null;
  return <Component />;
}

function RequireVehicles({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, canAccessVehicles } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccessVehicles) {
      setLocation("/driving-licenses");
    }
  }, [isLoading, isAuthenticated, canAccessVehicles, setLocation]);

  if (isLoading || !canAccessVehicles) return null;
  return <Component />;
}

function RequireDrivingLicenses({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, canAccessDrivingLicenses } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccessDrivingLicenses) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, canAccessDrivingLicenses, setLocation]);

  if (isLoading || !canAccessDrivingLicenses) return null;
  return <Component />;
}

function Router() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/dashboard" component={() => <RequireDashboard component={Dashboard} />} />
      <Route path="/vehicles" component={() => <RequireVehicles component={Vehicles} />} />
      <Route path="/vehicles/:id" component={() => <RequireVehicles component={VehicleDetails} />} />
      <Route path="/driving-licenses" component={() => <RequireDrivingLicenses component={DrivingLicenses} />} />
      <Route path="/driving-licenses/:id" component={() => <RequireDrivingLicenses component={DrivingLicenseDetails} />} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/profile" component={Profile} />
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
