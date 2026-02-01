import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = "md", className, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const spinner = (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizeClasses[size],
        className
      )} 
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}

export function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/20"></div>
          <Loader2 className="absolute inset-0 h-20 w-20 animate-spin text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-display font-bold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground animate-pulse">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

export function CardLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
