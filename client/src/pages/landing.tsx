import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useShopInfo } from "@/hooks/use-shop-info";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

function PollutionServiceMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Road */}
      <path
        d="M48 198h324"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M72 198h276"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="12 16"
        opacity="0.2"
      />

      {/* Car body */}
      <path
        d="M98 168h224c14 0 26 8 30 20H68c4-12 16-20 30-20Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M88 168l28-44h88l24 18h52l28 26"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />
      <path
        d="M124 124h72l16 20h-104l16-20Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path
        d="M116 124h96c8 0 14 6 16 14l6 30H100l6-30c2-8 8-14 16-14Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Windshield */}
      <path
        d="M132 132h56l10 18H122l10-18Z"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.5"
      />

      {/* Rear wheel */}
      <g className="auth-wheel" style={{ transformOrigin: "138px 188px" }}>
        <circle cx="138" cy="188" r="36" stroke="currentColor" strokeWidth="5" opacity="0.9" />
        <circle cx="138" cy="188" r="11" fill="currentColor" opacity="0.35" />
        <path
          d="M138 156v16M138 204v16M106 188h16M154 188h16"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.55"
        />
      </g>

      {/* Front wheel */}
      <g className="auth-wheel" style={{ transformOrigin: "282px 188px", animationDuration: "14s" }}>
        <circle cx="282" cy="188" r="36" stroke="currentColor" strokeWidth="5" opacity="0.9" />
        <circle cx="282" cy="188" r="11" fill="currentColor" opacity="0.35" />
        <path
          d="M282 156v16M282 204v16M250 188h16M298 188h16"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.55"
        />
      </g>

      {/* Exhaust pipe */}
      <path
        d="M68 168h-14c-6 0-10 4-10 10v6"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* Exhaust wisps — pulsing */}
      <g className="auth-bolt">
        <path
          d="M44 152c8-6 18-8 24-4s4 14-2 20-18 6-22-2"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <path
          d="M36 138c6-4 12-5 16-2s2 10-2 14-12 4-14-2"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </g>

      {/* PUC certificate badge */}
      <g className="auth-bolt">
        <rect
          x="308"
          y="96"
          width="72"
          height="52"
          rx="6"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.85"
        />
        <path
          d="M322 118l10 10 22-22"
          stroke="#5eead4"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M318 134h52" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        <text
          x="344"
          y="148"
          textAnchor="middle"
          fill="#f59e0b"
          fontSize="11"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          PUC
        </text>
      </g>

      {/* Headlamp */}
      <circle cx="318" cy="162" r="7" fill="#f59e0b" className="auth-bolt" />
    </svg>
  );
}

export default function Landing() {
  const { login, isLoading, user } = useAuth();
  const { data: shop, isLoading: shopLoading } = useShopInfo();
  const shopName = shop?.shopName?.trim() || "Maa Pollution Centre";
  const logoUrl = shop?.shopLogoUrl?.trim() || "";
  const location = shop?.shopLocation?.trim() || "";
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ username, password });
      setLocation("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-landing min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="auth-landing min-h-screen lg:grid lg:grid-cols-[1.15fr_0.85fr] bg-background text-foreground">
      {/* Brand hero — pollution & vehicle service atmosphere */}
      <section className="auth-hero relative min-h-[42vh] lg:min-h-screen overflow-hidden text-white">
        <div className="auth-grid absolute inset-0" />
        <div className="absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-[var(--auth-amber)]/20 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-64 w-64 rounded-full bg-[var(--auth-mint)]/15 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 py-10 sm:px-10 lg:px-14 lg:py-14 xl:px-16">
          <div className="auth-rise flex items-center gap-2 text-[var(--auth-mint)]">
            <ShieldCheck className="h-4 w-4 auth-bolt" />
            <span className="text-xs font-semibold uppercase tracking-[0.28em]">
              Pollution &amp; Vehicle Service Centre
            </span>
          </div>

          <div className="my-10 lg:my-0 space-y-6 max-w-xl">
            {shopLoading ? (
              <div className="h-16 w-48 rounded-xl bg-white/10 animate-pulse" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt={shopName}
                className="auth-rise h-16 sm:h-20 w-auto max-w-[240px] object-contain rounded-lg bg-white/95 p-3"
              />
            ) : (
              <div className="auth-rise">
                <BrandLogo size="lg" showText={false} logoUrl={logoUrl} name={shopName} />
              </div>
            )}

            <h1 className="auth-brand auth-rise-delay text-[clamp(2.75rem,8vw,5.25rem)] text-white">
              {shopName}
            </h1>
            <p className="auth-rise-delay-2 text-base sm:text-lg text-white/75 max-w-md leading-relaxed">
              Track PUC certificates, vehicle documents, driving licenses, and renewal reminders — all in one place.
            </p>
            {location && (
              <p className="auth-rise-delay-2 text-sm text-white/55">{location}</p>
            )}

            <PollutionServiceMark className="auth-rise-delay-2 mt-4 w-full max-w-md text-white/90" />
          </div>

          <p className="auth-rise-delay-2 text-xs text-white/45 tracking-wide">
            PUC compliance · Document tracking · License management
          </p>
        </div>
      </section>

      {/* Sign-in */}
      <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
        <div className="w-full max-w-md space-y-8 auth-rise">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Staff access
            </p>
            <h2 className="auth-brand text-3xl sm:text-4xl text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage vehicle records, pollution certificates, and driving licenses.
            </p>
          </div>

          <div className="auth-form-shell rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  className="input-modern h-11"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="input-modern h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  data-testid="input-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" data-testid="text-error">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="auth-submit w-full h-11 text-sm font-semibold tracking-wide"
                disabled={isSubmitting}
                data-testid="button-login"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Enter dashboard"
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
