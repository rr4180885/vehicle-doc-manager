import { useVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/use-vehicles";
import { useCreateDocument, useDeleteDocument, useUpdateDocument } from "@/hooks/use-documents";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentForm } from "@/components/forms/document-form";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Trash2, Edit, ArrowLeft, Download, Plus, AlertCircle } from "lucide-react";
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
      await updateVehicle({ id: vehicleId, ...data });
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">{vehicle.registrationNumber}</h1>
            <p className="text-muted-foreground">Owner: {vehicle.ownerName}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" /> Edit Details
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="glass-card">
            <CardHeader><CardTitle>Owner Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                <p className="font-medium text-lg">{vehicle.ownerName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mobile</label>
                <p className="font-medium text-lg">{vehicle.ownerMobile}</p>
              </div>
              <div className="pt-4 border-t">
                 <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System ID</label>
                 <p className="text-xs font-mono text-muted-foreground">{vehicle.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Documents */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                  <DocumentForm 
                    vehicleId={vehicleId} 
                    onSubmit={handleAddDocument} 
                    isSubmitting={isAddingDoc}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicle.documents?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No documents uploaded yet.</p>
                  </div>
                ) : (
                  vehicle.documents?.map((doc: any) => (
                    <div key={doc.id} className="group flex items-center justify-between p-4 bg-background border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded text-primary">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={() => setEditingDoc(null)}>
        <DialogContent>
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
