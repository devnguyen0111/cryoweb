import type {
  AppointmentStatus,
  ServiceRequestStatus,
  TreatmentCycleStatus,
  SpecimenStatus,
  TransactionStatus,
} from "@/api/types";
import { normalizeAppointmentStatus } from "./appointments";
import { normalizeTreatmentCycleStatus } from "@/api/types";

/**
 * Centralized status color utilities for consistent styling across the application
 */

// ============================================================================
// APPOINTMENT STATUS COLORS
// ============================================================================

export interface StatusColorClasses {
  bg: string;
  text: string;
  border?: string;
  dot?: string;
}

/**
 * Get color classes for appointment status
 * Standardized colors:
 * - Pending: Amber (waiting)
 * - Scheduled: Blue (scheduled/planned)
 * - Confirmed: Blue (confirmed)
 * - CheckedIn: Cyan (checked in)
 * - InProgress: Amber (in progress)
 * - Completed: Emerald/Green (success)
 * - Cancelled: Rose/Red (cancelled)
 * - NoShow: Gray (no show)
 */
export function getAppointmentStatusColor(
  status: AppointmentStatus | string | number | undefined | null
): StatusColorClasses {
  const normalized = normalizeAppointmentStatus(status?.toString());

  switch (normalized) {
    case "Pending":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "Scheduled":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      };
    case "Confirmed":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      };
    case "CheckedIn":
      return {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
        dot: "bg-cyan-500",
      };
    case "InProgress":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "Completed":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Cancelled":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case "NoShow":
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Get Tailwind classes string for appointment status badge
 */
export function getAppointmentStatusBadgeClass(
  status: AppointmentStatus | string | number | undefined | null
): string {
  const colors = getAppointmentStatusColor(status);
  return `${colors.bg} ${colors.text} ${colors.border || ""}`.trim();
}

// ============================================================================
// SERVICE REQUEST STATUS COLORS
// ============================================================================

/**
 * Get color classes for service request status
 * Standardized colors:
 * - Pending: Amber (waiting for approval)
 * - Approved: Emerald/Green (approved)
 * - Rejected: Rose/Red (rejected)
 * - Completed: Emerald/Green (completed)
 * - Cancelled: Rose/Red (cancelled)
 */
export function getServiceRequestStatusColor(
  status: ServiceRequestStatus | string | undefined | null
): StatusColorClasses {
  const statusStr = String(status || "").trim();

  switch (statusStr) {
    case "Pending":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "Approved":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Rejected":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case "Completed":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Cancelled":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Get Tailwind classes string for service request status badge
 */
export function getServiceRequestStatusBadgeClass(
  status: ServiceRequestStatus | string | undefined | null
): string {
  const colors = getServiceRequestStatusColor(status);
  return `${colors.bg} ${colors.text} ${colors.border || ""}`.trim();
}

// ============================================================================
// TREATMENT CYCLE STATUS COLORS
// ============================================================================

/**
 * Get color classes for treatment cycle status
 * Uses existing treatment-cycle-status.ts utility but ensures consistency
 * Standardized colors:
 * - Planned: Slate (planned)
 * - Scheduled: Blue (scheduled)
 * - InProgress: Amber (in progress)
 * - OnHold: Orange (on hold)
 * - Completed: Emerald/Green (completed)
 * - Cancelled: Rose/Red (cancelled)
 * - Failed: Rose/Red (failed)
 */
export function getTreatmentCycleStatusColor(
  status: TreatmentCycleStatus | number | string | undefined | null
): StatusColorClasses {
  const normalizedStatus = normalizeTreatmentCycleStatus(status);

  switch (normalizedStatus) {
    case "Planned":
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
    case "Scheduled":
      return {
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      };
    case "InProgress":
      return {
        bg: "bg-amber-100",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "OnHold":
      return {
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-200",
        dot: "bg-orange-500",
      };
    case "Completed":
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Cancelled":
      return {
        bg: "bg-rose-100",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case "Failed":
      return {
        bg: "bg-rose-100",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Get Tailwind classes string for treatment cycle status badge
 */
export function getTreatmentCycleStatusBadgeClass(
  status: TreatmentCycleStatus | number | string | undefined | null
): string {
  const colors = getTreatmentCycleStatusColor(status);
  return `${colors.bg} ${colors.text} ${colors.border || ""}`.trim();
}

// ============================================================================
// UNIFIED STATUS COLOR HELPER
// ============================================================================

// ============================================================================
// SAMPLE STATUS COLORS
// ============================================================================

/**
 * Get color classes for sample/specimen status
 * Standardized colors:
 * - Collected: Blue (collected)
 * - Processing: Amber (processing)
 * - Stored: Emerald/Green (stored)
 * - Used: Purple (used)
 * - Discarded: Rose/Red (discarded)
 * - QualityChecked: Emerald/Green (quality checked)
 * - Fertilized: Purple (fertilized)
 * - CulturedEmbryo: Purple (cultured embryo)
 * - Frozen: Cyan (frozen)
 * - Disposed: Rose/Red (disposed)
 * - Thawed: Blue (thawed)
 */
export function getSampleStatusColor(
  status: SpecimenStatus | string | undefined | null
): StatusColorClasses {
  const statusStr = String(status || "").trim();

  switch (statusStr) {
    case "Collected":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      };
    case "Processing":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "Stored":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Used":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
      };
    case "Discarded":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case "QualityChecked":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Fertilized":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
      };
    case "CulturedEmbryo":
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
        dot: "bg-purple-500",
      };
    case "Frozen":
      return {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
        dot: "bg-cyan-500",
      };
    case "Disposed":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case "Thawed":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Get Tailwind classes string for sample status badge
 */
export function getSampleStatusBadgeClass(
  status: SpecimenStatus | string | undefined | null
): string {
  const colors = getSampleStatusColor(status);
  return `${colors.bg} ${colors.text} ${colors.border || ""}`.trim();
}

// ============================================================================
// TRANSACTION STATUS COLORS
// ============================================================================

/**
 * Get color classes for transaction status
 * Standardized colors:
 * - Pending: Amber (waiting)
 * - Completed: Emerald/Green (success)
 * - Failed: Rose/Red (failed)
 * - Cancelled: Rose/Red (cancelled)
 */
export function getTransactionStatusColor(
  status: TransactionStatus | string | undefined | null
): StatusColorClasses {
  const statusStr = String(status || "").trim();

  switch (statusStr) {
    case "Pending":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      };
    case "Completed":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "Failed":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    case "Cancelled":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

/**
 * Get Tailwind classes string for transaction status badge
 */
export function getTransactionStatusBadgeClass(
  status: TransactionStatus | string | undefined | null
): string {
  const colors = getTransactionStatusColor(status);
  return `${colors.bg} ${colors.text} ${colors.border || ""}`.trim();
}

// ============================================================================
// UNIFIED STATUS COLOR HELPER
// ============================================================================

/**
 * Get status badge class automatically detecting the status type
 * This is useful when the status type is unknown or could be multiple types
 */
export function getStatusBadgeClass(
  status: string | number | undefined | null,
  type?:
    | "appointment"
    | "service-request"
    | "treatment-cycle"
    | "sample"
    | "transaction"
    | "auto"
): string {
  if (!status) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  const statusStr = String(status).trim();

  // Auto-detect type if not specified
  if (!type || type === "auto") {
    // Check for transaction-specific statuses first
    if (
      statusStr === "Pending" ||
      statusStr === "Completed" ||
      statusStr === "Failed" ||
      statusStr === "Cancelled"
    ) {
      // Check if it's a transaction status (not appointment/service-request)
      // Transaction statuses are more specific, so check context
      // For now, we'll let it fall through to other checks
      // If needed, can add more specific detection logic
    }

    // Check for sample-specific statuses
    if (
      statusStr === "Collected" ||
      statusStr === "Processing" ||
      statusStr === "Stored" ||
      statusStr === "Used" ||
      statusStr === "Discarded" ||
      statusStr === "QualityChecked" ||
      statusStr === "Fertilized" ||
      statusStr === "CulturedEmbryo" ||
      statusStr === "Frozen" ||
      statusStr === "Disposed" ||
      statusStr === "Thawed"
    ) {
      return getSampleStatusBadgeClass(status as any);
    }

    // Check for appointment-specific statuses
    if (
      statusStr === "CheckedIn" ||
      statusStr === "InProgress" ||
      statusStr === "NoShow" ||
      statusStr === "Scheduled" ||
      statusStr === "Confirmed"
    ) {
      return getAppointmentStatusBadgeClass(status as any);
    }

    // Check for service request-specific statuses
    if (
      statusStr === "Approved" ||
      statusStr === "Rejected" ||
      statusStr === "Pending"
    ) {
      // Pending could be both, but Approved/Rejected are service-request specific
      if (statusStr === "Approved" || statusStr === "Rejected") {
        return getServiceRequestStatusBadgeClass(status as any);
      }
      // For Pending, try service request first (more common)
      return getServiceRequestStatusBadgeClass(status as any);
    }

    // Check for treatment cycle-specific statuses
    if (
      statusStr === "Planned" ||
      statusStr === "OnHold" ||
      statusStr === "Failed" ||
      statusStr === "InProgress"
    ) {
      return getTreatmentCycleStatusBadgeClass(status as any);
    }

    // Common statuses - try in order: service-request, appointment, treatment-cycle
    if (statusStr === "Completed" || statusStr === "completed") {
      // Completed is common to all, use appointment as default
      return getAppointmentStatusBadgeClass(status as any);
    }
    if (statusStr === "Cancelled" || statusStr === "cancelled") {
      // Cancelled is common to all, use appointment as default
      return getAppointmentStatusBadgeClass(status as any);
    }

    // Default to appointment status
    return getAppointmentStatusBadgeClass(status as any);
  }

  // Use specified type
  switch (type) {
    case "appointment":
      return getAppointmentStatusBadgeClass(status as any);
    case "service-request":
      return getServiceRequestStatusBadgeClass(status as any);
    case "treatment-cycle":
      return getTreatmentCycleStatusBadgeClass(status as any);
    case "sample":
      return getSampleStatusBadgeClass(status as any);
    case "transaction":
      return getTransactionStatusBadgeClass(status as any);
    default:
      return getAppointmentStatusBadgeClass(status as any);
  }
}
