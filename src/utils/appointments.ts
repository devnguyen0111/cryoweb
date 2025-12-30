import type { AppointmentStatus, Appointment } from "@/api/types";

const STATUS_NORMALIZATION_MAP: Record<string, AppointmentStatus> = {
  scheduled: "Scheduled",
  confirm: "Scheduled",
  confirmed: "Scheduled",
  checkedin: "CheckedIn",
  checkin: "CheckedIn",
  inprogress: "InProgress",
  completed: "Completed",
  complete: "Completed",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  noshow: "NoShow",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  Pending: "Pending",
  Scheduled: "Scheduled",
  Confirmed: "Confirmed",
  CheckedIn: "Checked in",
  InProgress: "In progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
  NoShow: "No show",
};

export const normalizeAppointmentStatus = (
  value?: string | null
): AppointmentStatus | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if ((trimmed as AppointmentStatus) in APPOINTMENT_STATUS_LABELS) {
    return trimmed as AppointmentStatus;
  }

  const key = trimmed.replace(/[\s_-]/g, "").toLowerCase();

  return STATUS_NORMALIZATION_MAP[key];
};

export const ensureAppointmentStatus = (
  value: AppointmentStatus | string
): AppointmentStatus => {
  return normalizeAppointmentStatus(value) ?? "Scheduled";
};

/**
 * Extracts patient ID from appointment object
 * Handles multiple field name variations for backward compatibility
 * @param apt - Appointment object
 * @returns Patient ID string or null if not found
 */
export function getAppointmentPatientId(apt: Appointment): string | null {
  const raw = apt as unknown as Record<string, any>;
  return (
    (apt.patientId || raw.patientId || raw.PatientID) ??
    raw.patient?.id ??
    raw.patient?.accountId ??
    raw.PatientAccountID ??
    null
  );
}
