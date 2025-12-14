import type { TreatmentCycleStatus } from "@/api/types";
import { normalizeTreatmentCycleStatus } from "@/api/types";
import { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Activity,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getTreatmentCycleStatusBadgeClass as getBadgeClassFromUtils } from "./status-colors";

export interface TreatmentCycleStatusConfig {
  value: number;
  name: TreatmentCycleStatus;
  displayName: string;
  description: string;
  color: string;
  icon: LucideIcon;
}

export const TREATMENT_CYCLE_STATUSES: TreatmentCycleStatusConfig[] = [
  {
    value: 1,
    name: "Planned",
    displayName: "Planned",
    description: "Treatment cycle has been planned",
    color: "#94A3B8",
    icon: ClipboardList,
  },
  {
    value: 2,
    name: "InProgress",
    displayName: "In Progress",
    description: "Treatment cycle is currently in progress",
    color: "#F59E0B",
    icon: Activity,
  },
  {
    value: 3,
    name: "Completed",
    displayName: "Completed",
    description: "Treatment cycle has been completed",
    color: "#10B981",
    icon: CheckCircle,
  },
  {
    value: 4,
    name: "Cancelled",
    displayName: "Cancelled",
    description: "Treatment cycle has been cancelled",
    color: "#EF4444",
    icon: XCircle,
  },
  {
    value: 5,
    name: "OnHold",
    displayName: "On Hold",
    description: "Treatment cycle is currently on hold",
    color: "#F97316",
    icon: PauseCircle,
  },
  {
    value: 6,
    name: "Failed",
    displayName: "Failed",
    description: "Treatment cycle has failed",
    color: "#DC2626",
    icon: AlertCircle,
  },
  {
    value: 7,
    name: "Scheduled",
    displayName: "Scheduled",
    description: "Treatment cycle has been scheduled",
    color: "#3B82F6",
    icon: Calendar,
  },
];

/**
 * Get treatment cycle status config by status value or name
 */
export function getTreatmentCycleStatusConfig(
  status: TreatmentCycleStatus | number | string | undefined | null
): TreatmentCycleStatusConfig | null {
  if (status === null || status === undefined) return null;

  const normalizedStatus = normalizeTreatmentCycleStatus(status);
  if (!normalizedStatus) return null;

  return (
    TREATMENT_CYCLE_STATUSES.find((s) => s.name === normalizedStatus) || null
  );
}

/**
 * Get display name for treatment cycle status
 */
export function getTreatmentCycleStatusDisplayName(
  status: TreatmentCycleStatus | number | string | undefined | null
): string {
  const config = getTreatmentCycleStatusConfig(status);
  return (
    config?.displayName || normalizeTreatmentCycleStatus(status) || "Unknown"
  );
}

/**
 * Get color for treatment cycle status
 */
export function getTreatmentCycleStatusColor(
  status: TreatmentCycleStatus | number | string | undefined | null
): string {
  const config = getTreatmentCycleStatusConfig(status);
  return config?.color || "#94A3B8";
}

/**
 * Get icon for treatment cycle status
 */
export function getTreatmentCycleStatusIcon(
  status: TreatmentCycleStatus | number | string | undefined | null
): LucideIcon {
  const config = getTreatmentCycleStatusConfig(status);
  return config?.icon || ClipboardList;
}

/**
 * Get Tailwind CSS classes for status badge based on color
 * This function now uses the centralized status-colors utility for consistency
 */
export function getTreatmentCycleStatusBadgeClass(
  status: TreatmentCycleStatus | number | string | undefined | null
): string {
  // Use centralized utility for consistency
  return getBadgeClassFromUtils(status);
}
