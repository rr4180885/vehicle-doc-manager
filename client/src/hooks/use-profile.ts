import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProfileData {
  id: string;
  username: string | null;
  role: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  profileImageUrl: string | null;
  shopName: string | null;
  shopLocation: string | null;
  shopLogoUrl: string | null;
  canAccessVehicles: boolean;
  canAccessDrivingLicenses: boolean;
  createdAt: string | null;
}

async function fetchProfile(): Promise<ProfileData> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to update profile");
  }
  return res.json();
}

async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
  const res = await fetch("/api/profile/change-password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to change password");
  }
}

async function changeUsername(data: { username: string }): Promise<ProfileData> {
  const res = await fetch("/api/profile/change-username", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to change username");
  }
  return res.json();
}

export function useProfile() {
  return useQuery<ProfileData>({
    queryKey: ["/api/profile"],
    queryFn: fetchProfile,
    retry: 1,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}

export function useChangeUsername() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: changeUsername,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      qc.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}
