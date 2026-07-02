import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  SafeUser,
  CreateOperatorRequest,
  UpdateOperatorRequest,
  CreateOperatorResponse,
  ResetPasswordResponse,
} from "@shared/models/auth";

async function fetchOperators(): Promise<SafeUser[]> {
  const response = await fetch("/api/users", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }
  return response.json();
}

async function createOperator(data: CreateOperatorRequest): Promise<CreateOperatorResponse> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    const err: any = new Error(error.message || "Failed to create operator");
    err.field = error.field;
    throw err;
  }
  return response.json();
}

async function updateOperator(userId: string, data: UpdateOperatorRequest): Promise<SafeUser> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update operator");
  }
  return response.json();
}

async function resetPassword(
  userId: string,
  password?: string
): Promise<ResetPasswordResponse> {
  const response = await fetch(`/api/users/${userId}/reset-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(password?.trim() ? { password: password.trim() } : {}),
    credentials: "include",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reset password");
  }
  return response.json();
}

export function useOperators() {
  return useQuery({
    queryKey: ["/api/users"],
    queryFn: fetchOperators,
  });
}

export function useCreateOperator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useUpdateOperator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateOperatorRequest }) =>
      updateOperator(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useResetPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password?: string }) =>
      resetPassword(userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}
