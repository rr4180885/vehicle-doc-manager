import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDrivingLicenseSchema, type InsertDrivingLicense } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2, UploadCloud, Sparkles, FileText, CheckCircle, Download, IndianRupee } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ParsedLearnerPdf } from "@shared/driving-license-utils";

interface DrivingLicenseFormProps {
  onSubmit: (data: InsertDrivingLicense) => Promise<unknown>;
  isSubmitting: boolean;
  defaultValues?: Partial<InsertDrivingLicense>;
  submitLabel?: string;
  showLearnerUpload?: boolean;
}

function PaymentFields({ form }: { form: ReturnType<typeof useForm<InsertDrivingLicense>> }) {
  const totalAmount = useWatch({ control: form.control, name: "totalAmount" });
  const paidAmount  = useWatch({ control: form.control, name: "paidAmount" });

  const total = Number(totalAmount) || 0;
  const paid  = Number(paidAmount)  || 0;
  const due   = total - paid;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <IndianRupee className="h-4 w-4 text-primary" />
        Payment
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="totalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="input-modern"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paidAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid Amount (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="input-modern"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {total > 0 && (
        <div className={cn(
          "flex items-center justify-between rounded-lg px-4 py-2 text-sm font-medium",
          due > 0
            ? "bg-amber-50 border border-amber-200 text-amber-800"
            : "bg-emerald-50 border border-emerald-200 text-emerald-800"
        )}>
          <span>Due Amount</span>
          <span className="font-bold">₹{due.toLocaleString("en-IN")}</span>
        </div>
      )}
    </div>
  );
}

export function DrivingLicenseForm({
  onSubmit,
  isSubmitting,
  defaultValues,
  submitLabel = "Save",
  showLearnerUpload = true,
}: DrivingLicenseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedPdfName, setUploadedPdfName] = useState<string | null>(
    defaultValues?.learnerPdfUrl ? "Learner PDF attached" : null
  );

  const form = useForm<InsertDrivingLicense>({
    resolver: zodResolver(insertDrivingLicenseSchema),
    defaultValues: {
      applicantName: defaultValues?.applicantName || "",
      mobile: defaultValues?.mobile || "",
      issueDate: defaultValues?.issueDate || "",
      expiryDate: defaultValues?.expiryDate || "",
      licenseNumber: defaultValues?.licenseNumber || "",
      learnerPdfUrl: defaultValues?.learnerPdfUrl || "",
      duesPdfUrl: defaultValues?.duesPdfUrl || "",
      paidPdfUrl: defaultValues?.paidPdfUrl || "",
      totalAmount: defaultValues?.totalAmount ?? undefined,
      paidAmount: defaultValues?.paidAmount ?? undefined,
    },
  });

  const applyExtracted = (extracted: ParsedLearnerPdf, fileUrl: string) => {
    form.setValue("learnerPdfUrl", fileUrl);
    if (extracted.applicantName) form.setValue("applicantName", extracted.applicantName);
    if (extracted.mobile) form.setValue("mobile", extracted.mobile);
    if (extracted.issueDate) form.setValue("issueDate", extracted.issueDate);
    if (extracted.expiryDate) form.setValue("expiryDate", extracted.expiryDate);
    if (extracted.licenseNumber) form.setValue("licenseNumber", extracted.licenseNumber);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/driving-licenses/parse-pdf", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to process PDF");
      }

      const data = await res.json();
      applyExtracted(data.extracted || {}, data.fileUrl);
      setUploadedPdfName(file.name);

      toast({
        title: data.extracted && Object.keys(data.extracted).length > 0 ? "Details detected" : "PDF uploaded",
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload PDF",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
      e.target.value = "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {showLearnerUpload && (
          <div className="space-y-2">
            <FormLabel>Learner PDF</FormLabel>
            <div
              className={cn(
                "rounded-xl border-2 border-dashed p-4 transition-colors",
                uploadedPdfName ? "border-emerald-500/40 bg-emerald-50/40" : "border-border hover:border-primary/40"
              )}
            >
              {uploadedPdfName ? (
                <div className="flex items-center justify-between gap-2 text-sm text-emerald-700 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span className="truncate">{uploadedPdfName}</span>
                  </div>
                  {form.watch("learnerPdfUrl") && (
                    <a
                      href={form.watch("learnerPdfUrl")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
                    >
                      <Download className="h-3.5 w-3.5" />
                      View
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <FileText className="h-4 w-4" />
                  Optional — upload to auto-fill details
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                disabled={isParsing}
                onClick={() => fileInputRef.current?.click()}
              >
                {isParsing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {isParsing ? "Reading PDF..." : uploadedPdfName ? "Replace Learner PDF" : "Upload Learner PDF"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
            </div>
            {form.watch("learnerPdfUrl") && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Auto-fill works with text-based PDFs. Scanned images may need manual entry.
              </p>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="learnerPdfUrl"
          render={({ field }) => <input type="hidden" {...field} value={field.value || ""} />}
        />

        <FormField
          control={form.control}
          name="applicantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Full name" className="input-modern" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile No</FormLabel>
              <FormControl>
                <Input placeholder="10-digit mobile (optional)" className="input-modern" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date *</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Select issue date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date *</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Select expiry date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <PaymentFields form={form} />

        <Button type="submit" className="w-full btn-primary rounded-xl" disabled={isSubmitting || isParsing}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
