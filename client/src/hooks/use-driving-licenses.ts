import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DrivingLicense, InsertDrivingLicense } from "@shared/schema";

async function fetchDrivingLicenses(search?: string): Promise<DrivingLicense[]> {
  const url = search
    ? `/api/driving-licenses?search=${encodeURIComponent(search)}`
    : "/api/driving-licenses";
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch driving licenses");
  return response.json();
}

async function fetchDrivingLicense(id: number): Promise<DrivingLicense> {
  const response = await fetch(`/api/driving-licenses/${id}`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch driving license");
  return response.json();
}

async function createDrivingLicense(data: InsertDrivingLicense): Promise<DrivingLicense> {
  const response = await fetch("/api/driving-licenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create driving license");
  }
  return response.json();
}

async function updateDrivingLicense(id: number, data: Partial<InsertDrivingLicense>): Promise<DrivingLicense> {
  const response = await fetch(`/api/driving-licenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update driving license");
  }
  return response.json();
}

async function deleteDrivingLicense(id: number): Promise<void> {
  const response = await fetch(`/api/driving-licenses/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete driving license");
}

export function useDrivingLicenses(search?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["/api/driving-licenses", search],
    queryFn: () => fetchDrivingLicenses(search),
    enabled: options?.enabled ?? true,
  });
}

export function useDrivingLicense(id: number) {
  return useQuery({
    queryKey: [`/api/driving-licenses/${id}`],
    queryFn: () => fetchDrivingLicense(id),
    enabled: !!id,
  });
}

export function useCreateDrivingLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDrivingLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driving-licenses"] });
    },
  });
}

export function useUpdateDrivingLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertDrivingLicense> }) =>
      updateDrivingLicense(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/driving-licenses/${variables.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/driving-licenses"] });
    },
  });
}

export function useDeleteDrivingLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDrivingLicense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driving-licenses"] });
    },
  });
}
