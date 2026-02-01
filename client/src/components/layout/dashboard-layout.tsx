import { Sidebar } from "./sidebar";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Auth check handled in page routes or App.tsx but safety check here
  if (!isAuthenticated) {
    return null; // Will redirect via auth hook effect
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>
      <main className="flex-1 md:pl-64">
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
