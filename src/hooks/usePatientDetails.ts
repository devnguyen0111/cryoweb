/**
 * Custom hook for fetching patient details with automatic fallback
 * Handles both getPatientById and getPatientDetails API calls
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

/**
 * Fetches patient details with automatic fallback between different API endpoints
 * @param patientId - Patient ID to fetch details for
 * @param enabled - Whether the query should be enabled (default: true if patientId exists)
 * @returns React Query result with patient details
 */
export function usePatientDetails(
  patientId: string | null | undefined,
  enabled?: boolean
) {
  return useQuery({
    queryKey: ["patient-details", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientById(patientId);
        return response.data ?? null;
      } catch (error) {
        // Try patient details as fallback
        try {
          const fallback = await api.patient.getPatientDetails(patientId);
          return fallback.data ?? null;
        } catch {
          return null;
        }
      }
    },
    enabled: enabled !== undefined ? enabled : !!patientId,
  });
}
