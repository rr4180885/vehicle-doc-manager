import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";

const DOCUMENT_TYPES = [
  { value: "insurance", label: "Insurance" },
  { value: "pollution", label: "Pollution Certificate" },
  { value: "tax", label: "Tax" },
  { value: "fitness", label: "Fitness Certificate" },
  { value: "permit", label: "Permit" },
  { value: "aadhar", label: "Aadhar" },
  { value: "owner_book", label: "Owner Book (RC)" },
  { value: "other", label: "Other" },
] as const;

// Simplified schema without make, model, vehicleClass
const vehicleWithDocumentsSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerMobile: z.string().min(10, "Valid mobile number is required"),
  documents: z.array(z.object({
    type: z.enum(["insurance", "pollution", "tax", "fitness", "permit", "aadhar", "owner_book", "other"]),
    expiryDate: z.string().min(1, "Expiry date is required"),
    file: z.any().optional(), // File object
    fileUrl: z.string().min(1, "Document file is required"),
    notes: z.string().optional(),
  })).optional(),
});

type VehicleWithDocumentsFormData = z.infer<typeof vehicleWithDocumentsSchema>;

interface VehicleWithDocumentsFormProps {
  onSubmit: (data: any) => Promise<unknown>;
  isSubmitting: boolean;
}

export function VehicleWithDocumentsForm({ onSubmit, isSubmitting }: VehicleWithDocumentsFormProps) {
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File>>({});

  const form = useForm<VehicleWithDocumentsFormData>({
    resolver: zodResolver(vehicleWithDocumentsSchema),
    defaultValues: {
      registrationNumber: "",
      ownerName: "",
      ownerMobile: "",
      documents: [],
    },
  });

  const toggleDocumentType = (type: string) => {
    setSelectedDocTypes((prev) => {
      if (prev.includes(type)) {
        // Remove this document type
        const currentDocs = form.getValues("documents") || [];
        form.setValue(
          "documents",
          currentDocs.filter((doc) => doc.type !== type)
        );
        // Remove file
        const newFiles = { ...documentFiles };
        delete newFiles[type];
        setDocumentFiles(newFiles);
        return prev.filter((t) => t !== type);
      } else {
        // Add this document type
        const currentDocs = form.getValues("documents") || [];
        form.setValue("documents", [
          ...currentDocs,
          {
            type: type as any,
            expiryDate: "",
            fileUrl: "",
            notes: "",
          },
        ]);
        return [...prev, type];
      }
    });
  };

  const updateDocumentField = (type: string, field: string, value: string) => {
    const currentDocs = form.getValues("documents") || [];
    const docIndex = currentDocs.findIndex((doc) => doc.type === type);
    if (docIndex >= 0) {
      const updatedDocs = [...currentDocs];
      updatedDocs[docIndex] = {
        ...updatedDocs[docIndex],
        [field]: value,
      };
      form.setValue("documents", updatedDocs);
    }
  };

  const handleFileChange = (type: string, file: File | null) => {
    if (file) {
      // Store the file
      setDocumentFiles(prev => ({ ...prev, [type]: file }));
      
      // Create a temporary URL for the fileUrl field
      const tempUrl = `file://${file.name}`;
      updateDocumentField(type, "fileUrl", tempUrl);
    }
  };

  const getDocumentValue = (type: string, field: string): string => {
    const currentDocs = form.getValues("documents") || [];
    const doc = currentDocs.find((d) => d.type === type);
    return (doc as any)?.[field] || "";
  };

  const getFileName = (type: string): string => {
    return documentFiles[type]?.name || "";
  };

  const handleFormSubmit = async (data: VehicleWithDocumentsFormData) => {
    // Here you would typically upload files to your storage
    // For now, we'll create file URLs from the file names
    const documentsWithFiles = data.documents?.map(doc => ({
      ...doc,
      fileUrl: documentFiles[doc.type]?.name || doc.fileUrl,
    }));

    await onSubmit({
      ...data,
      documents: documentsWithFiles,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="KA-01-AB-1234" {...field} className="uppercase font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerMobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Documents Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select document types and upload files
            </p>
          </div>

          {/* Document Type Selector */}
          <div className="flex flex-wrap gap-2">
            {DOCUMENT_TYPES.map((docType) => (
              <Button
                key={docType.value}
                type="button"
                variant={selectedDocTypes.includes(docType.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDocumentType(docType.value)}
              >
                {selectedDocTypes.includes(docType.value) && (
                  <X className="mr-1 h-3 w-3" />
                )}
                {docType.label}
              </Button>
            ))}
          </div>

          {/* Document Forms */}
          {selectedDocTypes.length > 0 && (
            <div className="space-y-4">
              {selectedDocTypes.map((type) => {
                const docLabel = DOCUMENT_TYPES.find((d) => d.value === type)?.label || type;
                const fileName = getFileName(type);
                
                return (
                  <Card key={type}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {docLabel}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDocumentType(type)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Expiry Date *
                          </label>
                          <DatePicker
                            value={getDocumentValue(type, "expiryDate")}
                            onChange={(date) =>
                              updateDocumentField(type, "expiryDate", date)
                            }
                            placeholder="Select expiry date"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Upload Document *
                          </label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pdf,.jpg,.jpeg,.png';
                                input.onchange = (e: any) => {
                                  const file = e.target?.files?.[0];
                                  if (file) handleFileChange(type, file);
                                };
                                input.click();
                              }}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {fileName ? "Change File" : "Choose File"}
                            </Button>
                          </div>
                          {fileName && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              <FileText className="h-3 w-3" />
                              <span className="truncate">{fileName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Notes (Optional)</label>
                        <Textarea
                          placeholder="Additional notes about this document..."
                          value={getDocumentValue(type, "notes")}
                          onChange={(e) =>
                            updateDocumentField(type, "notes", e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedDocTypes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No documents selected</p>
                <p className="text-sm">Click on document types above to add them</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background pb-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Vehicle & Documents"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
