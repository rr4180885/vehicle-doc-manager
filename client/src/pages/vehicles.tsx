import { useVehicles, useCreateVehicleWithDocuments } from "@/hooks/use-vehicles";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader, SearchBar, ViewToggle, type ListView } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Car as CarIcon, ArrowUpRight, FileText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VehicleWithDocumentsForm } from "@/components/forms/vehicle-with-documents-form";
import { useToast } from "@/hooks/use-toast";

export default function Vehicles() {
  const [, navigate] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: vehicles, isLoading } = useVehicles(debouncedSearch);
  const { mutateAsync: createVehicleWithDocs, isPending: isCreating } = useCreateVehicleWithDocuments();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<{ field?: string; message: string } | null>(null);
  const [view, setView] = useState<ListView>("grid");

  const handleCreate = async (data: any) => {
    try {
      setFormError(null);
      await createVehicleWithDocs(data);
      toast({ title: "Success", description: "Vehicle and documents added successfully" });
      setIsDialogOpen(false);
    } catch (error: any) {
      setFormError({ field: error.field, message: error.message || "Failed to add vehicle" });
      toast({ title: "Error", description: error.message || "Failed to add vehicle", variant: "destructive" });
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
        title="Vehicles"
        description="Manage your fleet and vehicle documents."
        icon={CarIcon}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl btn-primary h-10">
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vehicle with Documents</DialogTitle>
              </DialogHeader>
              <VehicleWithDocumentsForm onSubmit={handleCreate} isSubmitting={isCreating} error={formError} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by registration number..."
          className="flex-1"
          resultCount={vehicles?.length}
        />
        <ViewToggle view={view} onChange={setView} className="self-start sm:self-auto" />
      </div>

      {vehicles?.length === 0 ? (
        <div className="empty-state">
          <CarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No vehicles found</p>
          {!debouncedSearch && (
            <p className="text-sm text-muted-foreground/70 mt-1">Click &quot;Add Vehicle&quot; to get started</p>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles?.map((vehicle) => (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
              <div className="surface-card-elevated-hover group p-5 h-full flex flex-col cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1.5 font-mono text-sm font-bold text-primary border border-primary/20">
                    {vehicle.registrationNumber}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />
                </div>

                <div className="space-y-2.5 flex-1 mb-4">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground shrink-0">Owner</span>
                    <span className="font-medium text-right truncate">{vehicle.ownerName}</span>
                  </div>
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground shrink-0">Mobile</span>
                    <span className="font-medium text-right">{vehicle.ownerMobile}</span>
                  </div>
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground shrink-0">Documents</span>
                    <span className="font-medium">{vehicle.documents?.length || 0} files</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  Updated {new Date(vehicle.updatedAt!).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="surface-card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Registration</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Owner</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Mobile</th>
                <th className="px-5 py-3 font-semibold hidden lg:table-cell">Documents</th>
                <th className="px-5 py-3 font-semibold hidden lg:table-cell">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {vehicles?.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="table-row-hover cursor-pointer"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary border border-primary/20">
                      {vehicle.registrationNumber}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell font-medium">{vehicle.ownerName}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground">{vehicle.ownerMobile}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {vehicle.documents?.length || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-muted-foreground text-xs">
                    {new Date(vehicle.updatedAt!).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/vehicles/${vehicle.id}`}>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors inline-block" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
