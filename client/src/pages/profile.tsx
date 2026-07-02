import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useProfile, useUpdateProfile, useChangePassword, useChangeUsername } from "@/hooks/use-profile";
import { CardLoader } from "@/components/ui/loading-spinner";
import { User, KeyRound, AtSign, Camera, Loader2, Copy, Check, ShieldCheck, Store, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  mobile: z.string().refine((v) => !v || v.length >= 10, "Must be at least 10 digits").optional(),
});

const shopSchema = z.object({
  shopName: z.string().optional(),
  shopLocation: z.string().optional(),
});

const usernameSchema = z.object({
  username: z.string().min(3, "At least 3 characters"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues  = z.infer<typeof profileSchema>;
type UsernameFormValues = z.infer<typeof usernameSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type ShopFormValues     = z.infer<typeof shopSchema>;

// ─────────────────────────────────────────────
// Copied-ID badge
// ─────────────────────────────────────────────
function CopyBadge({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm font-mono text-muted-foreground hover:bg-muted/80 transition-colors"
    >
      {value}
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─────────────────────────────────────────────
// Section card
// ─────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-border/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold leading-none">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Profile photo
// ─────────────────────────────────────────────
function AvatarSection({
  profileImageUrl,
  displayName,
  onUpload,
  isUploading,
}: {
  profileImageUrl?: string | null;
  displayName: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const letter = displayName[0]?.toUpperCase() || "U";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={displayName}
            className="h-24 w-24 rounded-2xl object-cover ring-4 ring-primary/20"
          />
        ) : (
          <div className="h-24 w-24 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl ring-4 ring-primary/20">
            {letter}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "absolute inset-0 rounded-2xl flex items-center justify-center",
            "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
            isUploading && "opacity-100"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">Click photo to change</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function ProfilePage() {
  const { toast } = useToast();
  const { data: profile, isLoading, isError } = useProfile();
  const { mutateAsync: updateProfile, isPending: isSavingProfile } = useUpdateProfile();
  const { mutateAsync: changePassword, isPending: isChangingPwd } = useChangePassword();
  const { mutateAsync: changeUsername, isPending: isChangingUsername } = useChangeUsername();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name || "",
      email: profile?.email || "",
      mobile: profile?.mobile || "",
    },
  });

  // Username form
  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    values: { username: profile?.username || "" },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  // Shop form
  const shopForm = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    values: {
      shopName: profile?.shopName || "",
      shopLocation: profile?.shopLocation || "",
    },
  });

  const handleProfileSave = async (data: ProfileFormValues) => {
    try {
      await updateProfile(data);
      toast({ title: "Profile saved", description: "Your details have been updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUsernameSave = async (data: UsernameFormValues) => {
    try {
      await changeUsername(data);
      toast({ title: "Username updated", description: `New username: ${data.username}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePasswordSave = async (data: PasswordFormValues) => {
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast({ title: "Password changed", description: "Please use your new password next time you log in." });
      passwordForm.reset();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { fileUrl } = await res.json();
      await updateProfile({ profileImageUrl: fileUrl });
      toast({ title: "Photo updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { fileUrl } = await res.json();
      await updateProfile({ shopLogoUrl: fileUrl });
      toast({ title: "Shop logo updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleShopSave = async (data: ShopFormValues) => {
    try {
      await updateProfile(data);
      toast({ title: "Shop details saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardLoader />
      </DashboardLayout>
    );
  }

  if (isError || !profile) {
    return (
      <DashboardLayout>
        <PageHeader icon={User} title="My Profile" description="Manage your account details and security" />
        <div className="mt-10 flex flex-col items-center gap-3 text-muted-foreground">
          <User className="h-10 w-10 opacity-30" />
          <p className="font-medium">Could not load profile.</p>
          <p className="text-sm">Please restart the server and refresh the page.</p>
          <Button variant="outline" className="mt-2 rounded-xl" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const displayName = profile.name || profile.username || "User";

  return (
    <DashboardLayout>
      <PageHeader icon={User} title="My Profile" description="Manage your account details and security" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Left: avatar + read-only info */}
        <div className="space-y-4">
          <div className="surface-card p-6 flex flex-col items-center gap-4">
            <AvatarSection
              profileImageUrl={profile.profileImageUrl}
              displayName={displayName}
              onUpload={handlePhotoUpload}
              isUploading={isUploadingPhoto}
            />
            <div className="w-full text-center space-y-1">
              <p className="font-semibold text-lg leading-tight">{displayName}</p>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold",
                profile.role === "admin"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                <ShieldCheck className="h-3 w-3" />
                {profile.role === "admin" ? "Administrator" : "Operator"}
              </span>
            </div>
            <div className="w-full border-t border-border/60 pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</p>
              <CopyBadge value={profile.id} />
            </div>
          </div>
        </div>

        {/* Right: edit forms */}
        <div className="space-y-6">
          {/* Basic info */}
          <SectionCard icon={User} title="Personal Information" description="Update your name, email and mobile number">
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" className="input-modern" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" className="input-modern" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit number" className="input-modern" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="btn-primary rounded-xl" disabled={isSavingProfile}>
                  {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </SectionCard>

          {/* Change username */}
          <SectionCard icon={AtSign} title="Username / Login ID" description="Change the ID used to log in">
            <Form {...usernameForm}>
              <form onSubmit={usernameForm.handleSubmit(handleUsernameSave)} className="space-y-4">
                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Username</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. admin2026" className="input-modern font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="btn-primary rounded-xl" disabled={isChangingUsername}>
                  {isChangingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Username
                </Button>
              </form>
            </Form>
          </SectionCard>

          {/* Change password */}
          <SectionCard icon={KeyRound} title="Change Password" description="Use a strong password of at least 6 characters">
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSave)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="input-modern" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="input-modern" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="input-modern" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="btn-primary rounded-xl" disabled={isChangingPwd}>
                  {isChangingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </Form>
          </SectionCard>

          {/* Shop settings — admin only */}
          {profile.role === "admin" && (
            <SectionCard icon={Store} title="Shop Settings" description="Branding details shown on documents and the app">
              {/* Logo */}
              <div className="mb-5">
                <p className="text-sm font-medium mb-3">Shop Logo</p>
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {profile.shopLogoUrl ? (
                      <img
                        src={profile.shopLogoUrl}
                        alt="Shop logo"
                        className="h-20 w-20 rounded-xl object-contain border border-border bg-muted"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                        <Store className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      {isUploadingLogo ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogoUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Upload logo</p>
                    <p>PNG or JPG, recommended 200×200 px</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg mt-1"
                      disabled={isUploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {isUploadingLogo ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1.5 h-3.5 w-3.5" />}
                      {profile.shopLogoUrl ? "Change Logo" : "Upload Logo"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Shop name + location form */}
              <Form {...shopForm}>
                <form onSubmit={shopForm.handleSubmit(handleShopSave)} className="space-y-4">
                  <FormField
                    control={shopForm.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Maa Pollution Centre" className="input-modern" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={shopForm.control}
                    name="shopLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location / Address
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Main Road, Jamui, Bihar 811307" className="input-modern" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="btn-primary rounded-xl" disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Shop Details
                  </Button>
                </form>
              </Form>
            </SectionCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
