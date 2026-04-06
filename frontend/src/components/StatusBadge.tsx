import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        pending: "bg-warning/15 text-warning border border-warning/20",
        "in-progress": "bg-info/15 text-info border border-info/20",
        done: "bg-success/15 text-success border border-success/20",
        rejected: "bg-destructive/15 text-destructive border border-destructive/20",
        active: "bg-success/15 text-success border border-success/20",
        disabled: "bg-muted text-muted-foreground border border-border",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const displayLabel = label || (status ? status.replace("-", " ") : "pending");
  return (
    <span className={cn(badgeVariants({ status }), "capitalize", className)}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
