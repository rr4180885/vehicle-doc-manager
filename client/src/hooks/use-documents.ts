import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertDocument } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

// POST /api/documents
export function useCreateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertDocument) => {
      const validated = api.documents.create.input.parse(data);
      
      const res = await fetch(api.documents.create.path, {
        method: api.documents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add document");
      
      const responseData = await res.json();
      return parseWithLogging(api.documents.create.responses[201], responseData, "documents.create");
    },
    onSuccess: (data) => {
      // Invalidate the specific vehicle the document belongs to
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${data.vehicleId}`] });
      // Also invalidate vehicles list for dashboard alerts
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}

// PATCH /api/documents/:id
export function useUpdateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, vehicleId, ...data }: Partial<InsertDocument> & { id: number, vehicleId: number }) => {
      const validated = api.documents.update.input.parse(data);
      const url = buildUrl(api.documents.update.path, { id });
      
      const res = await fetch(url, {
        method: api.documents.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to update document");
      
      const responseData = await res.json();
      return parseWithLogging(api.documents.update.responses[200], responseData, "documents.update");
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific vehicle the document belongs to
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${variables.vehicleId}`] });
      // Also invalidate vehicles list for dashboard alerts
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}

// DELETE /api/documents/:id
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: number, vehicleId: number }) => {
      const url = buildUrl(api.documents.delete.path, { id });
      const res = await fetch(url, { 
        method: api.documents.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to delete document");
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific vehicle the document belongs to
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${variables.vehicleId}`] });
      // Also invalidate vehicles list for dashboard alerts
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}
