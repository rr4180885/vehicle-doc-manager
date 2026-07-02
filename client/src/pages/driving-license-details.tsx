import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useDrivingLicense,
  useUpdateDrivingLicense,
  useDeleteDrivingLicense,
} from "@/hooks/use-driving-licenses";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DrivingLicenseForm } from "@/components/forms/driving-license-form";
import { useToast } from "@/hooks/use-toast";
import { CardLoader } from "@/components/ui/loading-spinner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { getDrivingLicenseAlerts } from "@shared/driving-license-utils";

type PdfField = "learnerPdfUrl" | "duesPdfUrl" | "paidPdfUrl";

const PDF_SECTIONS: { field: PdfField; label: string; description: string }[] = [
  { field: "learnerPdfUrl", label: "Learner", description: "Learner license PDF" },
];

function PdfSection({
  label,
  description,
  fileUrl,
  onUpload,
  isUploading,
}: {
  label: string;
  description: string;
  fileUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}) {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background p-5 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold">{label}</h4>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Download className="w-4 h-4 mr-1" /> View
            </Button>
          </a>
        )}
      </div>
      <div className="mt-4">
        {fileUrl ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600 mb-3">
            <CheckCircle className="w-4 h-4" />
            PDF uploaded
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <FileText className="w-4 h-4" />
            No PDF uploaded yet
          </div>
        )}
        <label
          className={cn(
            "flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all",
            "hover:border-primary/40 hover:bg-primary/5",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <UploadCloud className="w-5 h-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isUploading ? "Uploading..." : fileUrl ? "Replace PDF" : "Upload PDF"}
          </span>
          <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleChange} />
        </label>
      </div>
    </div>
  );
}

export default function DrivingLicenseDetails() {
  const { id } = useParams<{ id: string }>();
  const licenseId = parseInt(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: license, isLoading } = useDrivingLicense(licenseId);
  const { mutateAsync: updateLicense, isPending: isUpdating } = useUpdateDrivingLicense();
  const { mutateAsync: deleteLicense, isPending: isDeleting } = useDeleteDrivingLicense();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploadingField, setUploadingField] = useState<PdfField | null>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.fileUrl;
  };

  const handlePdfUpload = async (field: PdfField, file: File) => {
    setUploadingField(field);
    try {
      const fileUrl = await uploadFile(file);
      await updateLicense({ id: licenseId, data: { [field]: fileUrl } });
      toast({ title: "Uploaded", description: "PDF saved successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to upload PDF", variant: "destructive" });
    } finally {
      setUploadingField(null);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateLicense({ id: licenseId, data });
      toast({ title: "Updated", description: "Record updated successfully" });
      setIsEditOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to update record", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLicense(licenseId);
      toast({ title: "Deleted", description: "Record removed" });
      setLocation("/driving-licenses");
    } catch {
      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
    }
  };

  if (isLoading || !license) {
    return (
      <DashboardLayout>
        <CardLoader />
      </DashboardLayout>
    );
  }

  const alerts = getDrivingLicenseAlerts(license);
  const hasPayment = license.totalAmount != null || license.paidAmount != null;
  const total = license.totalAmount ?? 0;
  const paid = license.paidAmount ?? 0;
  const due = total - paid;
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link
          href="/driving-licenses"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5 transition-colors rounded-lg px-2 py-1 -ml-2 hover:bg-primary/5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Driving Licenses
        </Link>
        <div className="surface-card-elevated p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold page-header-title">{license.applicantName}</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">{license.mobile}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Issued {format(parseISO(license.issueDate), "dd MMM yyyy")} · Expires{" "}
                {format(parseISO(license.expiryDate), "dd MMM yyyy")}
              </p>
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
                <DialogHeader>
                  <DialogTitle>Edit Driving License Record</DialogTitle>
                </DialogHeader>
                <DrivingLicenseForm
                  defaultValues={license}
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
                  <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the driving license record and all associated PDFs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.type}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-sm",
                alert.type === "learner_expired" && "border-red-200 bg-red-50 text-red-800",
                alert.type === "apply_final" && "border-amber-200 bg-amber-50 text-amber-900",
                alert.type === "missing_learner_pdf" && "border-primary/20 bg-primary/5 text-primary"
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 rounded-xl bg-muted/60 p-1 h-11">
          <TabsTrigger value="overview" className="rounded-lg gap-2 px-4">
            <User className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg gap-2 px-4">
            <FileText className="h-4 w-4" /> Documents
          </TabsTrigger>
          {hasPayment && (
            <TabsTrigger value="payments" className="rounded-lg gap-2 px-4">
              <IndianRupee className="h-4 w-4" /> Payments
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="surface-card-elevated p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">Applicant Details</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Name</label>
                  <p className="font-medium text-lg mt-0.5">{license.applicantName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Mobile
                  </label>
                  <p className="font-medium text-lg mt-0.5">{license.mobile || "—"}</p>
                </div>
              </div>
            </div>

            <div className="surface-card-elevated p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">License Validity</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                  <span className="font-medium text-sm">{format(parseISO(license.issueDate), "dd MMM yyyy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expiry Date</span>
                  <span className={cn("font-medium text-sm", alerts.some(a => a.type === "learner_expired") && "text-red-600")}>
                    {format(parseISO(license.expiryDate), "dd MMM yyyy")}
                  </span>
                </div>
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {alerts.length === 0 ? (
                    <span className="badge-soft-success">Up to date</span>
                  ) : (
                    <span className="badge-soft-warning">{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-0">
          <div className="surface-card-elevated overflow-hidden">
            <div className="p-6 border-b border-border/60">
              <h3 className="font-semibold">Documents</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Upload learner, dues, and payment PDFs</p>
            </div>
            <div className="p-6 space-y-4">
              {PDF_SECTIONS.map((section) => (
                <PdfSection
                  key={section.field}
                  label={section.label}
                  description={section.description}
                  fileUrl={license[section.field]}
                  onUpload={(file) => handlePdfUpload(section.field, file)}
                  isUploading={uploadingField === section.field}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {hasPayment && (
          <TabsContent value="payments" className="mt-0">
            <div className="surface-card-elevated p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <h3 className="font-semibold">Payment Summary</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{paidPct}% paid</span>
                  <span>₹{paid.toLocaleString("en-IN")} of ₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      due > 0 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-lg font-bold">₹{total.toLocaleString("en-IN")}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-xs text-emerald-700 mb-1">Paid</p>
                  <p className="text-lg font-bold text-emerald-800">₹{paid.toLocaleString("en-IN")}</p>
                </div>
                <div className={cn(
                  "rounded-xl p-4",
                  due > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"
                )}>
                  <p className={cn("text-xs mb-1", due > 0 ? "text-amber-700" : "text-emerald-700")}>Due</p>
                  <p className={cn("text-lg font-bold", due > 0 ? "text-amber-800" : "text-emerald-800")}>
                    ₹{due.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
}
