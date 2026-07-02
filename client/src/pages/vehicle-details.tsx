import { useVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/use-vehicles";
import { useCreateDocument, useDeleteDocument, useUpdateDocument } from "@/hooks/use-documents";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentForm } from "@/components/forms/document-form";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Edit, ArrowLeft, Download, Plus, User, LayoutGrid, Phone } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { CardLoader } from "@/components/ui/loading-spinner";

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = parseInt(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: vehicle, isLoading } = useVehicle(vehicleId);
  const { mutateAsync: updateVehicle, isPending: isUpdating } = useUpdateVehicle();
  const { mutateAsync: deleteVehicle, isPending: isDeleting } = useDeleteVehicle();
  const { mutateAsync: createDocument, isPending: isAddingDoc } = useCreateDocument();
  const { mutateAsync: updateDocument, isPending: isUpdatingDoc } = useUpdateDocument();
  const { mutateAsync: deleteDocument, isPending: isDeletingDoc } = useDeleteDocument();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const handleDelete = async () => {
    try {
      await deleteVehicle(vehicleId);
      toast({ title: "Deleted", description: "Vehicle removed successfully" });
      setLocation("/dashboard");
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete vehicle", variant: "destructive" });
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateVehicle({ id: vehicleId, data });
      toast({ title: "Updated", description: "Vehicle details updated" });
      setIsEditOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update vehicle", variant: "destructive" });
    }
  };

  const handleAddDocument = async (data: any) => {
    try {
      await createDocument({ ...data, vehicleId });
      toast({ title: "Added", description: "Document uploaded successfully" });
      setIsAddDocOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to add document", variant: "destructive" });
    }
  };

  const handleUpdateDoc = async (data: any) => {
    try {
      await updateDocument({ id: editingDoc.id, vehicleId, ...data });
      toast({ title: "Updated", description: "Document updated successfully" });
      setEditingDoc(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    try {
      await deleteDocument({ id: docId, vehicleId });
      toast({ title: "Deleted", description: "Document removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  if (isLoading || !vehicle) {
    return (
      <DashboardLayout>
        <CardLoader />
      </DashboardLayout>
    );
  }

  const docCount = vehicle.documents?.length || 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5 transition-colors rounded-lg px-2 py-1 -ml-2 hover:bg-primary/5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vehicles
        </Link>
        <div className="surface-card-elevated p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-mono font-bold text-sm shadow-md shadow-primary/25">
              {vehicle.registrationNumber.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold page-header-title font-mono tracking-wide">
                {vehicle.registrationNumber}
              </h1>
              <p className="text-muted-foreground mt-0.5">Owner: {vehicle.ownerName}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
                <VehicleForm
                  defaultValues={vehicle}
                  onSubmit={handleUpdate}
                  isSubmitting={isUpdating}
                  submitLabel="Save Changes"
                />
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-xl">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the vehicle and all associated documents.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Vehicle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1 h-11 sm:inline-flex sm:w-auto">
          <TabsTrigger value="overview" className="min-w-0 gap-1.5 px-2 rounded-lg sm:gap-2 sm:px-4">
            <User className="h-4 w-4 shrink-0" /> <span className="truncate">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="min-w-0 gap-1.5 px-2 rounded-lg sm:gap-2 sm:px-4">
            <LayoutGrid className="h-4 w-4 shrink-0" /> <span className="truncate">Documents</span>
            <span className="badge-pill bg-primary/10 text-primary font-semibold ml-1 shrink-0">{docCount}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="surface-card-elevated p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">Owner Information</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Name</label>
                  <p className="font-medium text-lg mt-0.5">{vehicle.ownerName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Mobile
                  </label>
                  <p className="font-medium text-lg mt-0.5">{vehicle.ownerMobile}</p>
                </div>
              </div>
            </div>

            <div className="surface-card-elevated p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">Record Summary</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Documents on file</span>
                  <span className="font-semibold">{docCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last updated</span>
                  <span className="font-medium text-sm">{new Date(vehicle.updatedAt!).toLocaleDateString()}</span>
                </div>
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">System ID</span>
                  <span className="text-xs font-mono text-muted-foreground">{vehicle.id}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <div className="surface-card-elevated overflow-hidden">
            <div className="flex flex-row items-center justify-between p-6 border-b border-border/60">
              <h3 className="font-semibold">Documents</h3>
              <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="btn-primary rounded-xl">
                    <Plus className="w-4 h-4 mr-2" /> Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                  <DocumentForm
                    vehicleId={vehicleId}
                    onSubmit={handleAddDocument}
                    isSubmitting={isAddingDoc}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {vehicle.documents?.length === 0 ? (
                  <div className="empty-state py-12">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                  </div>
                ) : (
                  vehicle.documents?.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{doc.type.replace('_', ' ')}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge expiryDate={doc.expiryDate} />
                            {doc.expiryDate && (
                              <span className="text-xs text-muted-foreground">
                                Expires: {format(new Date(doc.expiryDate), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                          {doc.notes && <p className="text-xs text-muted-foreground mt-1 italic">{doc.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setEditingDoc(doc)}
                          title="Edit Document"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="View/Download">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                              <AlertDialogDescription>This file will be permanently removed.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDoc(doc.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editingDoc?.type.replace('_', ' ')} Document</DialogTitle>
          </DialogHeader>
          {editingDoc && (
            <DocumentForm 
              vehicleId={vehicleId} 
              onSubmit={handleUpdateDoc} 
              isSubmitting={isUpdatingDoc}
              defaultValues={editingDoc}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
