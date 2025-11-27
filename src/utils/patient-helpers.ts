import type { Patient, PatientDetailResponse } from "@/api/types";

/**
 * Type guard to check if a patient is a PatientDetailResponse
 */
export function isPatientDetailResponse(
  patient: Patient | PatientDetailResponse | null | undefined
): patient is PatientDetailResponse {
  return patient !== null && patient !== undefined && "accountInfo" in patient;
}

/**
 * Get patient detail response or null
 */
export function getPatientDetail(
  patient: Patient | PatientDetailResponse | null | undefined
): PatientDetailResponse | null {
  return isPatientDetailResponse(patient) ? patient : null;
}

/**
 * Safe accessor for PatientDetailResponse properties
 */
export function getPatientProperty<T>(
  patient: Patient | PatientDetailResponse | null | undefined,
  property: keyof PatientDetailResponse,
  defaultValue: T
): T {
  if (isPatientDetailResponse(patient)) {
    const value = patient[property];
    return (value !== null && value !== undefined ? value : defaultValue) as T;
  }
  return defaultValue;
}
