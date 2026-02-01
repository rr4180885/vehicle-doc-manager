import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Car, LogOut, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="flex h-full min-h-screen w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Car className="h-6 w-6 text-primary mr-2" />
        <span className="font-display font-bold text-xl tracking-tight">FleetKeep</span>
      </div>
      
      <div className="flex flex-1 flex-col gap-y-4 overflow-y-auto px-4 py-6">
        <nav className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "group flex gap-x-3 rounded-lg p-2.5 text-sm font-medium leading-6 transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-6 w-6 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto border-t border-border pt-4">
          <div className="px-2 mb-4">
            <div className="flex items-center gap-x-3 rounded-lg p-2 bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{user?.firstName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
