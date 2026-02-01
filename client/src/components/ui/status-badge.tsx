import { cn } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

interface StatusBadgeProps {
  expiryDate?: string | null;
}

export function StatusBadge({ expiryDate }: StatusBadgeProps) {
  if (!expiryDate) return <span className="text-muted-foreground text-sm">-</span>;

  const daysLeft = differenceInDays(parseISO(expiryDate), new Date());
  
  let variant = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
  let text = "Valid";
  
  if (daysLeft < 0) {
    variant = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    text = "Expired";
  } else if (daysLeft <= 30) {
    variant = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    text = `Expiring in ${daysLeft} days`;
  }

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variant)}>
      {text}
    </span>
  );
}
