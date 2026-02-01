import { useVehicles } from "@/hooks/use-vehicles";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle, CheckCircle2, Car as CarIcon, ArrowRight, Bell } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VehicleWithDocumentsForm } from "@/components/forms/vehicle-with-documents-form";
import { useCreateVehicleWithDocuments } from "@/hooks/use-vehicles";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { differenceInDays, parseISO } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const { data: vehicles, isLoading } = useVehicles(search);
  const { mutateAsync: createVehicleWithDocs, isPending: isCreating } = useCreateVehicleWithDocuments();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<{ field?: string; message: string } | null>(null);

  const handleCreate = async (data: any) => {
    try {
      setFormError(null); // Clear previous errors
      await createVehicleWithDocs(data);
      toast({ title: "Success", description: "Vehicle and documents added successfully" });
      setIsDialogOpen(false);
    } catch (error: any) {
      const errorData = {
        field: error.field,
        message: error.message || "Failed to add vehicle"
      };
      setFormError(errorData);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add vehicle", 
        variant: "destructive" 
      });
      // Don't close dialog so user can fix the error
    }
  };

  // Calculate expiring documents - must be before any conditional returns
  const expiryData = useMemo(() => {
    if (!vehicles) return { expiringSoon: 0, expired: 0, alerts: [] };
    
    const alerts: any[] = [];
    let expiringSoon = 0;
    let expired = 0;
    const today = new Date();
    
    vehicles.forEach((vehicle: any) => {
      vehicle.documents?.forEach((doc: any) => {
        if (doc.expiryDate) {
          const expiryDate = parseISO(doc.expiryDate);
          const daysUntilExpiry = differenceInDays(expiryDate, today);
          
          if (daysUntilExpiry < 0) {
            expired++;
            alerts.push({
              vehicle,
              doc,
              daysUntilExpiry,
              status: 'expired'
            });
          } else if (daysUntilExpiry <= 30) {
            expiringSoon++;
            alerts.push({
              vehicle,
              doc,
              daysUntilExpiry,
              status: 'expiring'
            });
          }
        }
      });
    });
    
    // Sort by urgency (expired first, then by days remaining)
    alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    
    return { expiringSoon, expired, alerts };
  }, [vehicles]);

  const totalVehicles = vehicles?.length || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-10 w-64 bg-muted/50 rounded animate-pulse" />
          <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet and documents.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Add New Vehicle with Documents</DialogTitle>
            </DialogHeader>
            <VehicleWithDocumentsForm onSubmit={handleCreate} isSubmitting={isCreating} error={formError} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="glass-card card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vehicles</CardTitle>
            <CarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered in system</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${expiryData.alerts.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-display ${expiryData.alerts.length > 0 ? 'text-orange-500' : ''}`}>
              {expiryData.alerts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expiryData.expired > 0 && `${expiryData.expired} expired, `}
              {expiryData.expiringSoon} expiring soon
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">Good</div>
            <p className="text-xs text-muted-foreground mt-1">System status healthy</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Expiry Alerts Section */}
        {expiryData.alerts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Document Expiry Alerts
            </h2>
            {expiryData.alerts.slice(0, 5).map((alert, idx) => (
              <Link key={idx} href={`/vehicles/${alert.vehicle.id}`}>
                <Alert className={`cursor-pointer hover:bg-muted/50 transition-colors ${alert.status === 'expired' ? 'border-red-500 bg-red-50/50' : 'border-orange-500 bg-orange-50/50'}`}>
                  <AlertTriangle className={`h-4 w-4 ${alert.status === 'expired' ? 'text-red-600' : 'text-orange-600'}`} />
                  <AlertTitle className="flex items-center justify-between">
                    <span className="font-semibold">
                      {alert.vehicle.registrationNumber} - {alert.doc.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`text-sm ${alert.status === 'expired' ? 'text-red-600' : 'text-orange-600'}`}>
                      {alert.status === 'expired' 
                        ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago` 
                        : `Expires in ${alert.daysUntilExpiry} days`}
                    </span>
                  </AlertTitle>
                  <AlertDescription>
                    Click to update document for {alert.vehicle.ownerName}
                  </AlertDescription>
                </Alert>
              </Link>
            ))}
            {expiryData.alerts.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                And {expiryData.alerts.length - 5} more alerts...
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search by Registration Number..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0 h-auto text-lg placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles?.map((vehicle) => (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
              <div className="group bg-card hover:bg-muted/50 border rounded-xl p-5 transition-all cursor-pointer shadow-sm hover:shadow-md h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-md font-mono font-bold text-sm border border-primary/20">
                    {vehicle.registrationNumber}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                </div>
                
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium text-right">{vehicle.ownerName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mobile</span>
                    <span className="font-medium text-right">{vehicle.ownerMobile}</span>
                  </div>
                </div>

                <div className="pt-4 border-t mt-auto flex justify-between items-center text-xs text-muted-foreground">
                  <span>Last updated: {new Date(vehicle.updatedAt!).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
          
          {vehicles?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              <CarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No vehicles found.</p>
              {!search && <p className="text-sm mt-1">Click "Add Vehicle" to get started.</p>}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
