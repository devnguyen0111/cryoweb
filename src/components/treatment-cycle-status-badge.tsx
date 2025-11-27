import { cn } from "@/utils/cn";
import {
  getTreatmentCycleStatusConfig,
  getTreatmentCycleStatusDisplayName,
  getTreatmentCycleStatusBadgeClass,
} from "@/utils/treatment-cycle-status";
import type { TreatmentCycleStatus } from "@/api/types";

interface TreatmentCycleStatusBadgeProps {
  status: TreatmentCycleStatus | number | string | undefined | null;
  showIcon?: boolean;
  className?: string;
}

export function TreatmentCycleStatusBadge({
  status,
  showIcon = false,
  className,
}: TreatmentCycleStatusBadgeProps) {
  const config = getTreatmentCycleStatusConfig(status);
  const displayName = getTreatmentCycleStatusDisplayName(status);
  const badgeClass = getTreatmentCycleStatusBadgeClass(status);
  const Icon = config?.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
        badgeClass,
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {displayName}
    </span>
  );
}

