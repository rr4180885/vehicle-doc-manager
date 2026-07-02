import { useVehicles } from "@/hooks/use-vehicles";
import { useDrivingLicenses } from "@/hooks/use-driving-licenses";
import { useAuth } from "@/hooks/use-auth";
import { useShopInfo } from "@/hooks/use-shop-info";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/layout/page-header";
import {
  AlertTriangle,
  Car as CarIcon,
  IdCard,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { getAllDrivingLicenseAlerts, type DrivingLicenseAlert } from "@shared/driving-license-utils";
import { Button } from "@/components/ui/button";

type VehicleAlert = {
  kind: "vehicle";
  vehicle: { id: number; registrationNumber: string; ownerName: string };
  doc: { type: string };
  daysUntilExpiry: number;
  status: "expired" | "expiring";
};

type LicenseAlert = DrivingLicenseAlert;

const ALERT_STYLES: Record<
  LicenseAlert["type"],
  { dot: string; text: string; icon: string }
> = {
  learner_expired: {
    dot: "bg-red-500",
    text: "text-red-600",
    icon: "text-red-600",
  },
  apply_final: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    icon: "text-amber-600",
  },
  missing_learner_pdf: {
    dot: "bg-primary",
    text: "text-primary",
    icon: "text-primary",
  },
};

function AlertPanel({
  title,
  icon: Icon,
  count,
  children,
  emptyMessage,
  viewAllHref,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  children: React.ReactNode;
  emptyMessage: string;
  viewAllHref: string;
}) {
  return (
    <div className="surface-card-elevated overflow-hidden flex flex-col h-full min-h-[420px]">
      <div className="flex items-center justify-between p-5 border-b border-border/60 bg-gradient-to-r from-primary/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">{count} alert{count !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <span className="badge-pill font-semibold bg-primary/10 text-primary">{count}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin max-h-[480px]">
        {count === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[200px]">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/60 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">{children}</div>
        )}
      </div>

      {count > 0 && (
        <div className="p-4 border-t border-border/60">
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground rounded-xl">
              View all in {title}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { canAccessVehicles, canAccessDrivingLicenses, user } = useAuth();
  const { data: shop } = useShopInfo();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles(undefined, {
    enabled: canAccessVehicles,
  });
  const { data: licenses, isLoading: licensesLoading } = useDrivingLicenses(undefined, {
    enabled: canAccessDrivingLicenses,
  });

  const [showAllVehicleAlerts, setShowAllVehicleAlerts] = useState(false);
  const [showAllLicenseAlerts, setShowAllLicenseAlerts] = useState(false);

  const vehicleAlerts = useMemo(() => {
    if (!vehicles) return [] as VehicleAlert[];
    const alerts: VehicleAlert[] = [];
    const today = new Date();

    vehicles.forEach((vehicle) => {
      vehicle.documents?.forEach((doc) => {
        if (!doc.expiryDate) return;
        const daysUntilExpiry = differenceInDays(parseISO(doc.expiryDate), today);
        if (daysUntilExpiry < 0) {
          alerts.push({ kind: "vehicle", vehicle, doc, daysUntilExpiry, status: "expired" });
        } else if (daysUntilExpiry <= 30) {
          alerts.push({ kind: "vehicle", vehicle, doc, daysUntilExpiry, status: "expiring" });
        }
      });
    });

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [vehicles]);

  const licenseAlerts = useMemo(() => {
    if (!licenses) return [] as LicenseAlert[];
    return getAllDrivingLicenseAlerts(licenses);
  }, [licenses]);

  const isLoading =
    (canAccessVehicles && vehiclesLoading) || (canAccessDrivingLicenses && licensesLoading);

  const totalAlerts = vehicleAlerts.length + licenseAlerts.length;
  const visibleVehicleAlerts = showAllVehicleAlerts ? vehicleAlerts : vehicleAlerts.slice(0, 8);
  const visibleLicenseAlerts = showAllLicenseAlerts ? licenseAlerts : licenseAlerts.slice(0, 8);

  const gridCols =
    canAccessVehicles && canAccessDrivingLicenses
      ? "lg:grid-cols-2"
      : "lg:grid-cols-1 max-w-2xl";

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-24 rounded-2xl bg-muted/50 animate-pulse mb-8" />
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
        <div className={cn("grid gap-6", gridCols)}>
          {[1, 2].map((i) => (
            <div key={i} className="h-[420px] rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome strip */}
      <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--sidebar))] text-white p-6 sm:p-7 mb-8 shadow-lg shadow-slate-900/10">
        <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-1.5">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {greeting()}, {user?.name || user?.username}
            </h1>
            <p className="text-white/60 text-sm mt-1.5">
              {shop?.shopName || "Maa Pollution Centre"} · Here&apos;s what needs your attention today.
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 self-start sm:self-auto">
            {totalAlerts === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-sm font-semibold text-white leading-none">
                {totalAlerts === 0 ? "All clear" : `${totalAlerts} item${totalAlerts !== 1 ? "s" : ""} to review`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {canAccessVehicles && (
          <StatCard
            label="Vehicle Alerts"
            value={vehicleAlerts.length}
            hint={`${vehicleAlerts.filter((a) => a.status === "expired").length} expired · ${vehicleAlerts.filter((a) => a.status === "expiring").length} expiring`}
            icon={CarIcon}
            trend={vehicleAlerts.length > 0 ? "warning" : "success"}
          />
        )}
        {canAccessDrivingLicenses && (
          <StatCard
            label="License Alerts"
            value={licenseAlerts.length}
            hint="Missing document uploads"
            icon={IdCard}
            trend={licenseAlerts.length > 0 ? "warning" : "success"}
          />
        )}
        <StatCard
          label="Total Alerts"
          value={totalAlerts}
          hint={totalAlerts === 0 ? "Everything looks good" : "Needs your attention"}
          icon={totalAlerts === 0 ? CheckCircle2 : AlertTriangle}
          trend={totalAlerts === 0 ? "success" : "warning"}
        />
      </div>

      <div className={cn("grid gap-6", gridCols)}>
        {canAccessVehicles && (
          <AlertPanel
            title="Vehicle Alerts"
            icon={CarIcon}
            count={vehicleAlerts.length}
            emptyMessage="No expiring or expired vehicle documents"
            viewAllHref="/vehicles"
          >
            {visibleVehicleAlerts.map((alert, idx) => (
              <Link key={`${alert.vehicle.id}-${alert.doc.type}-${idx}`} href={`/vehicles/${alert.vehicle.id}`}>
                <div className="table-row-hover flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        alert.status === "expired" ? "bg-red-500" : "bg-amber-500"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate font-mono">{alert.vehicle.registrationNumber}</p>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {alert.doc.type.replace("_", " ")} · {alert.vehicle.ownerName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold shrink-0",
                      alert.status === "expired" ? "text-red-600" : "text-amber-600"
                    )}
                  >
                    {alert.status === "expired"
                      ? `${Math.abs(alert.daysUntilExpiry)}d overdue`
                      : `${alert.daysUntilExpiry}d left`}
                  </span>
                </div>
              </Link>
            ))}
            {vehicleAlerts.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground rounded-none"
                onClick={() => setShowAllVehicleAlerts(!showAllVehicleAlerts)}
              >
                {showAllVehicleAlerts ? "Show less" : `Show ${vehicleAlerts.length - 8} more`}
              </Button>
            )}
          </AlertPanel>
        )}

        {canAccessDrivingLicenses && (
          <AlertPanel
            title="Driving License Alerts"
            icon={IdCard}
            count={licenseAlerts.length}
            emptyMessage="All driving license documents are uploaded"
            viewAllHref="/driving-licenses"
          >
            {visibleLicenseAlerts.map((alert, idx) => {
              const styles = ALERT_STYLES[alert.type];
              return (
                <Link key={`${alert.license.id}-${alert.type}-${idx}`} href={`/driving-licenses/${alert.license.id}`}>
                  <div className="table-row-hover flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", styles.dot)} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{alert.license.applicantName}</p>
                        <p className={cn("text-xs truncate", styles.text)}>{alert.message}</p>
                      </div>
                    </div>
                    <span className={cn("text-xs font-semibold shrink-0", styles.text)}>{alert.license.mobile}</span>
                  </div>
                </Link>
              );
            })}
            {licenseAlerts.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground rounded-none"
                onClick={() => setShowAllLicenseAlerts(!showAllLicenseAlerts)}
              >
                {showAllLicenseAlerts ? "Show less" : `Show ${licenseAlerts.length - 8} more`}
              </Button>
            )}
          </AlertPanel>
        )}
      </div>
    </DashboardLayout>
  );
}
