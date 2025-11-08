import { cn } from "@/utils/cn";

interface StatusBadgeProps {
  status: "active" | "inactive" | "draft" | "published" | "archived" | "pending" | "error";
  label?: string;
}

const STATUS_STYLES: Record<
  StatusBadgeProps["status"],
  { bg: string; text: string; dot: string }
> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  inactive: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  draft: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  published: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  archived: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  error: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium",
        styles.bg,
        styles.text
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", styles.dot)} aria-hidden="true" />
      {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

