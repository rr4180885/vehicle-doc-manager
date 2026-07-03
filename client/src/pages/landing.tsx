import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, Loader2, Car } from "lucide-react";
import { useAuth, getDefaultHomePath } from "@/hooks/use-auth";
import { useShopInfo } from "@/hooks/use-shop-info";
import { useToast } from "@/hooks/use-toast";
import heroIllustration from "@/assets/login-hero-illustration.png";

export default function Landing() {
  const [, navigate] = useLocation();
  const { login, isLoggingIn, isAuthenticated, user } = useAuth();
  const { data: shop } = useShopInfo();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const shopName = shop?.shopName?.trim() || "Maa Pollution Centre";
  const shopLocation = shop?.shopLocation?.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loggedInUser = await login({ username, password });
      toast({ title: "Welcome back!", description: `Signed in to ${shopName}` });
      navigate(getDefaultHomePath(loggedInUser));
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  if (isAuthenticated) {
    navigate(getDefaultHomePath(user));
    return null;
  }

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden bg-[hsl(var(--sidebar))]">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute -bottom-40 -right-10 h-[480px] w-[480px] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* Content — flex-1 centers vertically without huge dead gaps on tall screens */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 items-center gap-10 lg:gap-10">
          {/* Left: brand statement + illustration, grouped tight and centered against the sign-in card */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 mb-5">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              <span className="text-xs font-medium tracking-wide text-white/80 uppercase">Staff Portal</span>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-primary/30 bg-white">
                {shop?.shopLogoUrl ? (
                  <img src={shop.shopLogoUrl} alt={shopName} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <div className="h-full w-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Car className="h-7 w-7" strokeWidth={2.25} />
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-[2.2rem] sm:text-5xl lg:text-[2.8rem] font-extrabold leading-[1.05] tracking-tight text-white break-words">
              {shopName}
            </h1>
            <p className="mt-4 text-white/60 text-base sm:text-lg max-w-md">
              Vehicle documents, pollution checks & driving licenses — managed in one place.
              {shopLocation && <span className="block mt-1 text-white/40 text-sm">{shopLocation}</span>}
            </p>

            {/* Illustration sits below the copy, cropped to its left-weighted artwork */}
            <div className="relative mt-6 w-full max-w-[340px] sm:max-w-[360px] aspect-[9/8] overflow-hidden rounded-3xl hidden sm:block">
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sidebar))] via-transparent to-transparent z-10" />
              <img
                src={heroIllustration}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-auto max-w-none object-cover object-left mix-blend-screen opacity-95 select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Right: premium glass sign-in card */}
          <div className="w-full max-w-[420px] mx-auto lg:mx-0 lg:ml-auto">
            <div className="rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-[0_25px_70px_-20px_rgba(0,0,0,0.6)] p-7 sm:p-9">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-white">Sign In</h2>
                <p className="text-white/50 mt-1.5 text-sm">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/70">User ID</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your operator or admin ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-12 rounded-xl border-white/15 bg-white/10 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-white/15 bg-white/10 text-white placeholder:text-white/35 focus-visible:ring-2 focus-visible:ring-primary/50"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors mt-2"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-white/40">
                <ShieldCheck className="h-3.5 w-3.5 text-primary/80" />
                <span>Secure login · © {new Date().getFullYear()} {shopName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
