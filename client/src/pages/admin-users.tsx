import { useState, useEffect, useRef } from "react";
import {
  useOperators,
  useCreateOperator,
  useUpdateOperator,
  useResetPassword,
  useDeleteOperator,
} from "@/hooks/use-users";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import {
  Plus,
  KeyRound,
  Users,
  Edit,
  Trash2,
  Copy,
  Check,
  UploadCloud,
  Loader2,
  Car,
  IdCard,
  ShieldAlert,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLocation } from "wouter";
import type { SafeUser, CreateOperatorRequest, UpdateOperatorRequest } from "@shared/models/auth";
import { cn } from "@/lib/utils";

type OperatorFormData = {
  name: string;
  email: string;
  mobile: string;
  userId: string;
  password: string;
  profileImageUrl: string;
  canAccessVehicles: boolean;
  canAccessDrivingLicenses: boolean;
};

const emptyForm: OperatorFormData = {
  name: "",
  email: "",
  mobile: "",
  userId: "",
  password: "",
  profileImageUrl: "",
  canAccessVehicles: true,
  canAccessDrivingLicenses: false,
};

function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        className="input-modern pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="flex gap-2">
        <Input value={value} readOnly className="input-modern font-mono" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn("rounded-lg shrink-0 transition-colors", copied && "border-emerald-300 bg-emerald-50 text-emerald-600")}
          onClick={copy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function CredentialsDialog({
  open,
  onOpenChange,
  title,
  userId,
  password,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  userId: string;
  password: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Save these credentials now — the password cannot be viewed again after this dialog is closed.</p>
          </div>
          <CopyField label="User ID" value={userId} />
          <CopyField label="Password" value={password} />
          <Button className="w-full btn-primary rounded-xl" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OperatorFormFields({
  form,
  setForm,
  isUploading,
  onPhotoUpload,
  showUserId = true,
  userIdReadOnly = false,
  showPassword = false,
}: {
  form: OperatorFormData;
  setForm: React.Dispatch<React.SetStateAction<OperatorFormData>>;
  isUploading: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showUserId?: boolean;
  userIdReadOnly?: boolean;
  showPassword?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-1">
        {form.profileImageUrl ? (
          <img src={form.profileImageUrl} alt="Profile" className="h-14 w-14 rounded-2xl object-cover shadow-sm" />
        ) : (
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {form.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <UploadCloud className="h-4 w-4 mr-2" />
          )}
          {form.profileImageUrl ? "Change Photo" : "Upload Photo"}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoUpload} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Full name"
          required
          className="input-modern"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="email@example.com"
          required
          className="input-modern"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-sm font-medium">Mobile *</Label>
        <Input
          id="mobile"
          value={form.mobile}
          onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
          placeholder="10-digit mobile number"
          required
          minLength={10}
          className="input-modern"
        />
      </div>
      {showUserId && (
        <div className="space-y-2">
          <Label htmlFor="userId" className="text-sm font-medium">User ID {userIdReadOnly ? "" : "(optional)"}</Label>
          <Input
            id="userId"
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            placeholder={userIdReadOnly ? "" : "Leave blank to auto-generate"}
            readOnly={userIdReadOnly}
            disabled={userIdReadOnly}
            className={cn("input-modern", userIdReadOnly && "bg-muted/50")}
          />
        </div>
      )}
      {showPassword && (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password (optional)</Label>
          <PasswordField
            id="password"
            value={form.password}
            onChange={(password) => setForm((f) => ({ ...f, password }))}
            placeholder="Leave blank to auto-generate"
            minLength={6}
          />
          <p className="text-xs text-muted-foreground">
            If left empty, a password will be generated and shown after creation.
          </p>
        </div>
      )}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-4 w-4 text-primary" />
          Section Access *
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Choose which sections this operator can access</p>
        <label htmlFor="vehicles" className="flex items-center gap-2.5 rounded-lg p-2 -mx-2 hover:bg-background cursor-pointer transition-colors">
          <Checkbox
            id="vehicles"
            checked={form.canAccessVehicles}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, canAccessVehicles: checked === true }))
            }
          />
          <span className="text-sm font-medium flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" /> Vehicles
          </span>
        </label>
        <label htmlFor="drivingLicenses" className="flex items-center gap-2.5 rounded-lg p-2 -mx-2 hover:bg-background cursor-pointer transition-colors">
          <Checkbox
            id="drivingLicenses"
            checked={form.canAccessDrivingLicenses}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, canAccessDrivingLicenses: checked === true }))
            }
          />
          <span className="text-sm font-medium flex items-center gap-2">
            <IdCard className="h-4 w-4 text-muted-foreground" /> Driving Licenses
          </span>
        </label>
      </div>
    </div>
  );
}

function operatorToForm(op: SafeUser): OperatorFormData {
  return {
    name: op.name || "",
    email: op.email || "",
    mobile: op.mobile || "",
    userId: op.username || "",
    password: "",
    profileImageUrl: op.profileImageUrl || "",
    canAccessVehicles: op.canAccessVehicles,
    canAccessDrivingLicenses: op.canAccessDrivingLicenses,
  };
}

export default function AdminUsers() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: operators, isLoading } = useOperators();
  const { mutateAsync: createOperator, isPending: isCreating } = useCreateOperator();
  const { mutateAsync: updateOperator, isPending: isUpdating } = useUpdateOperator();
  const { mutateAsync: resetPassword, isPending: isResetting } = useResetPassword();
  const { mutateAsync: deleteOperator, isPending: isDeleting } = useDeleteOperator();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editOperator, setEditOperator] = useState<SafeUser | null>(null);
  const [createForm, setCreateForm] = useState<OperatorFormData>(emptyForm);
  const [editForm, setEditForm] = useState<OperatorFormData>(emptyForm);
  const [isUploadingCreate, setIsUploadingCreate] = useState(false);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const [credentials, setCredentials] = useState<{ userId: string; password: string; title: string } | null>(null);
  const [resetOperator, setResetOperator] = useState<SafeUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SafeUser | null>(null);
  const [adminPasswordForDelete, setAdminPasswordForDelete] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      setLocation("/dashboard");
    }
  }, [authLoading, isAdmin, setLocation]);

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.fileUrl;
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "create" | "edit"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setUploading = mode === "create" ? setIsUploadingCreate : setIsUploadingEdit;
    const setForm = mode === "create" ? setCreateForm : setEditForm;
    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      setForm((f) => ({ ...f, profileImageUrl: url }));
      toast({ title: "Uploaded", description: "Photo uploaded successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.canAccessVehicles && !createForm.canAccessDrivingLicenses) {
      toast({ title: "Error", description: "Select at least one section", variant: "destructive" });
      return;
    }
    try {
      const payload: CreateOperatorRequest = {
        name: createForm.name,
        email: createForm.email,
        mobile: createForm.mobile,
        profileImageUrl: createForm.profileImageUrl || undefined,
        canAccessVehicles: createForm.canAccessVehicles,
        canAccessDrivingLicenses: createForm.canAccessDrivingLicenses,
      };
      if (createForm.userId.trim()) {
        payload.userId = createForm.userId.trim();
      }
      if (createForm.password.trim()) {
        payload.password = createForm.password.trim();
      }
      const result = await createOperator(payload);
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
      setCredentials({
        userId: result.username!,
        password: result.generatedPassword,
        title: "Operator Created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create operator",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOperator) return;
    if (!editForm.canAccessVehicles && !editForm.canAccessDrivingLicenses) {
      toast({ title: "Error", description: "Select at least one section", variant: "destructive" });
      return;
    }
    try {
      const payload: UpdateOperatorRequest = {
        name: editForm.name,
        email: editForm.email,
        mobile: editForm.mobile,
        profileImageUrl: editForm.profileImageUrl || null,
        canAccessVehicles: editForm.canAccessVehicles,
        canAccessDrivingLicenses: editForm.canAccessDrivingLicenses,
      };
      await updateOperator({ userId: editOperator.id, data: payload });
      toast({ title: "Updated", description: "Operator updated successfully" });
      setEditOperator(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update operator",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOperator) return;
    if (resetPasswordValue.trim() && resetPasswordValue.trim().length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await resetPassword({
        userId: resetOperator.id,
        password: resetPasswordValue.trim() || undefined,
      });
      setResetOperator(null);
      setResetPasswordValue("");
      setCredentials({
        userId: result.username,
        password: result.generatedPassword,
        title: `Password Reset — ${resetOperator.name || resetOperator.username}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    if (!adminPasswordForDelete.trim()) {
      toast({
        title: "Error",
        description: "Enter your admin password to confirm deletion",
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteOperator({
        userId: deleteTarget.id,
        adminPassword: adminPasswordForDelete,
      });
      toast({
        title: "Deleted",
        description: `Operator ${deleteTarget.name || deleteTarget.username} removed`,
      });
      setDeleteTarget(null);
      setAdminPasswordForDelete("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete operator",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <LoadingScreen />
      </DashboardLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <PageHeader
        title="Operator Users"
        description="Create operators, control section access, and manage credentials."
        icon={Users}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary rounded-xl h-10" onClick={() => setCreateForm(emptyForm)}>
                <Plus className="w-4 h-4 mr-2" /> Create Operator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create Operator</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <OperatorFormFields
                  form={createForm}
                  setForm={setCreateForm}
                  isUploading={isUploadingCreate}
                  onPhotoUpload={(e) => handlePhotoUpload(e, "create")}
                  showPassword
                />
                <Button type="submit" className="w-full btn-primary rounded-xl" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Operator"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {operators && operators.length === 0 ? (
        <div className="empty-state">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No operator users yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Create one to get started</p>
          <Button className="btn-primary rounded-xl" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Operator
          </Button>
        </div>
      ) : (
        <div className="surface-card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Operator</th>
                <th className="px-5 py-3 font-semibold hidden sm:table-cell">Contact</th>
                <th className="px-5 py-3 font-semibold hidden md:table-cell">Access</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {operators?.map((op) => (
                <tr key={op.id} className="table-row-hover">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {op.profileImageUrl ? (
                        <img src={op.profileImageUrl} alt={op.name || ""} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold shrink-0">
                          {(op.name || op.username)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{op.name || op.username}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{op.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="text-sm truncate max-w-[200px]">{op.email}</p>
                    <p className="text-xs text-muted-foreground">{op.mobile}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex gap-1.5 flex-wrap">
                      {op.canAccessVehicles && (
                        <span className="badge-soft-neutral flex items-center gap-1">
                          <Car className="h-3 w-3" /> Vehicles
                        </span>
                      )}
                      {op.canAccessDrivingLicenses && (
                        <span className="badge-soft-neutral flex items-center gap-1">
                          <IdCard className="h-3 w-3" /> Licenses
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setEditOperator(op);
                          setEditForm(operatorToForm(op));
                        }}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setResetOperator(op);
                          setResetPasswordValue("");
                        }}
                        title="Reset Password"
                      >
                        <KeyRound className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Reset</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setDeleteTarget(op);
                          setAdminPasswordForDelete("");
                        }}
                        title="Delete Operator"
                      >
                        <Trash2 className="w-4 h-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editOperator} onOpenChange={(open) => !open && setEditOperator(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Operator — {editOperator?.name || editOperator?.username}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <OperatorFormFields
              form={editForm}
              setForm={setEditForm}
              isUploading={isUploadingEdit}
              onPhotoUpload={(e) => handlePhotoUpload(e, "edit")}
              userIdReadOnly
            />
            <Button type="submit" className="w-full btn-primary rounded-xl" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetOperator}
        onOpenChange={(open) => {
          if (!open) {
            setResetOperator(null);
            setResetPasswordValue("");
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              Reset Password — {resetOperator?.name || resetOperator?.username}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetPassword" className="text-sm font-medium">
                New Password (optional)
              </Label>
              <PasswordField
                id="resetPassword"
                value={resetPasswordValue}
                onChange={setResetPasswordValue}
                placeholder="Leave blank to auto-generate"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                If left empty, a new password will be generated and shown after reset.
              </p>
            </div>
            <Button type="submit" className="w-full btn-primary rounded-xl" disabled={isResetting}>
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setAdminPasswordForDelete("");
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete operator — {deleteTarget?.name || deleteTarget?.username}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the operator account and all vehicle and driving license
              records they created. Enter your admin password to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleDeleteOperator} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminDeletePassword" className="text-sm font-medium">
                Your admin password *
              </Label>
              <PasswordField
                id="adminDeletePassword"
                value={adminPasswordForDelete}
                onChange={setAdminPasswordForDelete}
                placeholder="Enter your admin password"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                className="rounded-xl"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Operator"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {credentials && (
        <CredentialsDialog
          open={!!credentials}
          onOpenChange={(open) => !open && setCredentials(null)}
          title={credentials.title}
          userId={credentials.userId}
          password={credentials.password}
        />
      )}
    </DashboardLayout>
  );
}
