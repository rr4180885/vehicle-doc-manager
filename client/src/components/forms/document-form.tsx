import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDocumentSchema, type InsertDocument, documentTypeEnum } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, CheckCircle, File as FileIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";

interface DocumentFormProps {
  vehicleId: number;
  onSubmit: (data: InsertDocument) => Promise<unknown>;
  isSubmitting: boolean;
  defaultValues?: Partial<InsertDocument> & { id?: number };
}

export function DocumentForm({ vehicleId, onSubmit, isSubmitting, defaultValues }: DocumentFormProps) {
  const [uploadedFile, setUploadedFile] = useState<{ url: string, name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Initialize uploadedFile state when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues?.fileUrl) {
      setUploadedFile({ url: defaultValues.fileUrl, name: "Current Document" });
    } else {
      setUploadedFile(null);
    }
  }, [defaultValues?.fileUrl]);

  const form = useForm<InsertDocument>({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      vehicleId,
      type: defaultValues?.type || "insurance",
      expiryDate: defaultValues?.expiryDate || "",
      notes: defaultValues?.notes || "",
      fileUrl: defaultValues?.fileUrl || "",
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      form.setValue("fileUrl", data.fileUrl);
      setUploadedFile({ url: data.fileUrl, name: file.name });
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {documentTypeEnum.enumValues.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select expiry date"
                />
              </FormControl>
              <FormDescription>For expiration alerts</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Document File</FormLabel>
          <div className="flex flex-col gap-3">
            {uploadedFile && (
              <div className="flex items-center gap-2 text-sm p-3 bg-muted/50 rounded-lg border">
                <FileIcon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 truncate">{uploadedFile.name}</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                className="hidden"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full md:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" />
                    {defaultValues ? "Replace Document" : "Choose File"}
                  </>
                )}
              </Button>
            </div>
          </div>
          <input type="hidden" {...form.register("fileUrl")} />
          {form.formState.errors.fileUrl && (
             <p className="text-sm font-medium text-destructive">File upload is required</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Policy number, agency details..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || !uploadedFile} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              defaultValues ? "Update Document" : "Add Document"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
