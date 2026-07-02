import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark";
  className?: string;
  name?: string | null;
  subtitle?: string | null;
  logoUrl?: string | null;
}

const sizes = {
  sm: { box: "h-9 w-9", icon: "h-5 w-5", title: "text-sm", sub: "text-[10px]" },
  md: { box: "h-11 w-11", icon: "h-6 w-6", title: "text-base", sub: "text-[11px]" },
  lg: { box: "h-14 w-14", icon: "h-7 w-7", title: "text-xl", sub: "text-xs" },
};

export function BrandLogo({
  size = "md",
  showText = true,
  variant = "dark",
  className,
  name,
  subtitle,
  logoUrl,
}: BrandLogoProps) {
  const s = sizes[size];
  const isLight = variant === "light";
  const displayName = name?.trim() || "Maa Pollution Centre";
  const displaySubtitle = subtitle?.trim() || "Vehicle Documents";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          s.box,
          "flex shrink-0 items-center justify-center rounded-lg overflow-hidden",
          !logoUrl && "bg-primary text-primary-foreground"
        )}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <Car className={s.icon} strokeWidth={2.25} />
        )}
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={cn(s.title, "font-bold leading-tight truncate", isLight ? "text-foreground" : "text-white")}>
            {displayName}
          </p>
          <p
            className={cn(
              s.sub,
              "font-medium tracking-wide uppercase truncate",
              isLight ? "text-muted-foreground" : "text-white/55"
            )}
          >
            {displaySubtitle}
          </p>
        </div>
      )}
    </div>
  );
}
