import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useDrivingLicenses, useCreateDrivingLicense } from "@/hooks/use-driving-licenses";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader, SearchBar, ViewToggle, type ListView } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DrivingLicenseForm } from "@/components/forms/driving-license-form";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, ArrowUpRight, IdCard, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getDrivingLicenseAlerts } from "@shared/driving-license-utils";
import { cn } from "@/lib/utils";

export default function DrivingLicenses() {
  const [, navigate] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [view, setView] = useState<ListView>("grid");
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: licenses, isLoading } = useDrivingLicenses(debouncedSearch);
  const { mutateAsync: createLicense, isPending: isCreating } = useCreateDrivingLicense();

  const alertCountByLicense = useMemo(() => {
    const map = new Map<number, number>();
    licenses?.forEach((l) => map.set(l.id, getDrivingLicenseAlerts(l).length));
    return map;
  }, [licenses]);

  const handleCreate = async (data: any) => {
    try {
      await createLicense(data);
      toast({ title: "Success", description: "Driving license record created" });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="h-20 rounded-2xl bg-muted/50 animate-pulse mb-8" />
        <div className="h-14 rounded-2xl bg-muted/50 animate-pulse mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Driving Licenses"
        description="Track learner licenses, issue/expiry dates, and payment documents."
        icon={IdCard}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl btn-primary h-10">
                <Plus className="w-4 h-4 mr-2" /> Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Driving License Record</DialogTitle>
              </DialogHeader>
              <DrivingLicenseForm onSubmit={handleCreate} isSubmitting={isCreating} submitLabel="Create Record" />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by name or mobile..."
          className="flex-1"
          resultCount={licenses?.length}
        />
        <ViewToggle view={view} onChange={setView} className="self-start sm:self-auto" />
      </div>

      {licenses && licenses.length === 0 ? (
        <div className="empty-state">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No driving license records</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Add a record to start tracking learner licenses</p>
          <Button className="btn-primary" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Record
          </Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {licenses?.map((license) => {
            const alertCount = alertCountByLicense.get(license.id) || 0;
            return (
              <Link key={license.id} href={`/driving-licenses/${license.id}`}>
                <div className="surface-card-elevated-hover group p-5 h-full cursor-pointer flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <IdCard className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {alertCount > 0 && (
                        <span className="badge-soft-warning flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {alertCount}
                        </span>
                      )}
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-0.5">{license.applicantName}</h3>
                  <p className="text-sm text-muted-foreground">{license.mobile}</p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>
                      Issued:{" "}
                      <span className="font-medium text-foreground">
                        {license.issueDate ? format(parseISO(license.issueDate), "dd MMM yyyy") : "—"}
                      </span>
                    </p>
                    <p>
                      Expires:{" "}
                      <span className={cn("font-medium", alertCount > 0 && "text-amber-700")}>
                        {license.expiryDate ? format(parseISO(license.expiryDate), "dd MMM yyyy") : "—"}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="surface-card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Applicant</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Mobile</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Issued</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Expires</th>
                <th className="px-5 py-3 font-semibold hidden lg:table-cell">Alerts</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {licenses?.map((license) => {
                const alertCount = alertCountByLicense.get(license.id) || 0;
                return (
                  <tr
                    key={license.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/driving-licenses/${license.id}`)}
                  >
                    <td className="px-5 py-3.5 font-medium">{license.applicantName}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-muted-foreground">{license.mobile}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground text-xs">
                      {license.issueDate ? format(parseISO(license.issueDate), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-xs">
                      <span className={cn("font-medium", alertCount > 0 ? "text-amber-700" : "text-foreground")}>
                        {license.expiryDate ? format(parseISO(license.expiryDate), "dd MMM yyyy") : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {alertCount > 0 ? (
                        <span className="badge-soft-warning flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> {alertCount}
                        </span>
                      ) : (
                        <span className="badge-soft-success w-fit">OK</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/driving-licenses/${license.id}`}>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors inline-block" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
