import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Vehicle, InsertVehicle, VehicleWithDocuments, CreateVehicleWithDocuments } from "@shared/schema";

async function fetchVehicles(search?: string): Promise<VehicleWithDocuments[]> {
  const url = search
    ? `/api/vehicles?search=${encodeURIComponent(search)}`
    : "/api/vehicles";
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchVehicle(id: number): Promise<VehicleWithDocuments> {
  const response = await fetch(`/api/vehicles/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function createVehicle(data: InsertVehicle): Promise<Vehicle> {
  const response = await fetch("/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create vehicle");
  }

  return response.json();
}

async function createVehicleWithDocuments(data: CreateVehicleWithDocuments): Promise<VehicleWithDocuments> {
  const response = await fetch("/api/vehicles/with-documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    const err: any = new Error(error.message || "Failed to create vehicle with documents");
    err.field = error.field; // Pass the field name for highlighting
    throw err;
  }

  return response.json();
}

async function updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle> {
  const response = await fetch(`/api/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update vehicle");
  }

  return response.json();
}

async function deleteVehicle(id: number): Promise<void> {
  const response = await fetch(`/api/vehicles/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to delete vehicle");
  }
}

export function useVehicles(search?: string) {
  return useQuery({
    queryKey: ["/api/vehicles", search],
    queryFn: () => fetchVehicles(search),
  });
}

export function useVehicle(id: number) {
  return useQuery({
    queryKey: [`/api/vehicles/${id}`],
    queryFn: () => fetchVehicle(id),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}

export function useCreateVehicleWithDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVehicleWithDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertVehicle> }) => updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });
}
