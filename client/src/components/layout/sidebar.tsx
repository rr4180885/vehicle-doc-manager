import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useShopInfo } from "@/hooks/use-shop-info";
import { LayoutDashboard, Car, LogOut, Users, IdCard, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";

const allNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "always" as const },
  { name: "Vehicles", href: "/vehicles", icon: Car, section: "vehicles" as const },
  { name: "Driving Licenses", href: "/driving-licenses", icon: IdCard, section: "drivingLicenses" as const },
];

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function SidebarContent({ onNavigate, className }: SidebarProps) {
  const [location] = useLocation();
  const { logout, user, isAdmin, canAccessVehicles, canAccessDrivingLicenses } = useAuth();
  const { data: shop } = useShopInfo();

  const operatorNav = allNavItems.filter((item) => {
    if (item.section === "always") return true;
    if (item.section === "vehicles") return canAccessVehicles;
    if (item.section === "drivingLicenses") return canAccessDrivingLicenses;
    return false;
  });

  const navigation = isAdmin
    ? [...allNavItems, { name: "Operators", href: "/admin/users", icon: Users, section: "vehicles" as const }]
    : operatorNav;

  const displayName = user?.name || user?.username || "User";
  const avatarLetter = displayName[0]?.toUpperCase() || "U";

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex min-h-[72px] items-center px-4 py-3 border-b border-white/10">
        <BrandLogo
          size="md"
          variant="dark"
          className="w-full"
          name={shop?.shopName}
          logoUrl={shop?.shopLogoUrl}
        />
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">Menu</p>
        {navigation.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive ? "nav-item-active-glow" : "nav-item-inactive"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isActive ? "bg-primary/30 text-white shadow-sm" : "bg-white/5 text-white/50 group-hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </div>
                {item.name}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3 space-y-2">
        <Link href="/profile" onClick={onNavigate}>
          <div className={cn(
            "flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors",
            location === "/profile" ? "bg-primary/20" : "bg-white/5 hover:bg-white/10"
          )}>
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={displayName}
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/10 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/30 text-sm font-bold text-white ring-2 ring-white/10">
                {avatarLetter}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-white/50 capitalize">{user?.role || "operator"}</p>
            </div>
            <UserCircle className="h-4 w-4 text-white/40 shrink-0" />
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 h-10"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "h-full w-[260px] bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]",
        className
      )}
    >
      <SidebarContent />
    </aside>
  );
}
