import { SidebarContent } from "./sidebar";
import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useShopInfo } from "@/hooks/use-shop-info";
import { Loader2, Menu, Car } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { data: shop } = useShopInfo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shopName = shop?.shopName?.trim() || "Maa Pollution Centre";

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center app-shell-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Car className="h-7 w-7 text-primary-foreground animate-pulse" />
            </div>
            <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen app-shell-bg">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col z-30">
        <div className="h-full shadow-2xl shadow-black/20">
          <aside className="h-full w-full bg-[hsl(var(--sidebar))]">
            <SidebarContent />
          </aside>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:pl-[260px] min-w-0">
        <header
          className={cn(
            "sticky top-0 z-20 flex h-16 items-center gap-4 bg-background/85 backdrop-blur-xl px-4 lg:px-8 transition-shadow duration-200",
            scrolled
              ? "shadow-[0_4px_20px_-8px_rgba(15,23,42,0.15)] border-b border-border/40"
              : "border-b border-transparent"
          )}
        >
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden rounded-xl shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-[hsl(var(--sidebar))] border-none">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
              {shop?.shopLogoUrl ? (
                <img src={shop.shopLogoUrl} alt={shopName} className="h-full w-full object-cover" />
              ) : (
                <Car className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <span className="font-semibold text-sm truncate">{shopName}</span>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-card border border-border/60 px-2.5 py-1.5 shadow-sm hover:shadow-md transition-shadow">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user?.name || user?.username || "User"}
                  className="h-7 w-7 rounded-lg object-cover"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                  {(user?.name || user?.username)?.[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium hidden sm:block max-w-[140px] truncate">{user?.name || user?.username}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
