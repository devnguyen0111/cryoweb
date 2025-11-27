/**
 * QueryClient Configuration
 * Optimized caching strategies for TanStack Query
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Cache times in milliseconds
 */
export const CACHE_TIMES = {
  // Patient data - frequently accessed but changes less often
  PATIENT_DETAILS: 1000 * 60 * 15, // 15 minutes
  PATIENT_LIST: 1000 * 60 * 5, // 5 minutes

  // Doctor data - changes rarely
  DOCTOR_DETAILS: 1000 * 60 * 30, // 30 minutes
  DOCTOR_LIST: 1000 * 60 * 10, // 10 minutes
  DOCTOR_PROFILE: 1000 * 60 * 30, // 30 minutes

  // Treatment data - moderate frequency
  TREATMENT_CYCLES: 1000 * 60 * 5, // 5 minutes
  TREATMENTS: 1000 * 60 * 5, // 5 minutes

  // Appointments - more frequent changes
  APPOINTMENTS: 1000 * 60 * 2, // 2 minutes

  // Statistics - moderate frequency
  STATISTICS: 1000 * 60 * 3, // 3 minutes

  // Default
  DEFAULT: 1000 * 60 * 5, // 5 minutes
} as const;

/**
 * Stale times - how long data is considered fresh
 * Data is refetched when stale, even if still in cache
 */
export const STALE_TIMES = {
  PATIENT_DETAILS: 1000 * 60 * 10, // 10 minutes
  PATIENT_LIST: 1000 * 60 * 3, // 3 minutes
  DOCTOR_DETAILS: 1000 * 60 * 20, // 20 minutes
  DOCTOR_LIST: 1000 * 60 * 8, // 8 minutes
  DOCTOR_PROFILE: 1000 * 60 * 20, // 20 minutes
  TREATMENT_CYCLES: 1000 * 60 * 3, // 3 minutes
  TREATMENTS: 1000 * 60 * 3, // 3 minutes
  APPOINTMENTS: 1000 * 60 * 1, // 1 minute
  STATISTICS: 1000 * 60 * 2, // 2 minutes
  DEFAULT: 1000 * 60 * 3, // 3 minutes
} as const;

/**
 * Get stale time based on query key
 */
function getStaleTimeForQueryKey(queryKey: readonly unknown[]): number {
  const key = queryKey[0];
  const subKey = queryKey[1];

  // Patient queries
  if (key === "patient" || key === "patients") {
    if (subKey === "details" || typeof subKey === "string") {
      return STALE_TIMES.PATIENT_DETAILS;
    }
    return STALE_TIMES.PATIENT_LIST;
  }

  // Doctor queries
  if (key === "doctor" || key === "doctors") {
    if (subKey === "profile") {
      return STALE_TIMES.DOCTOR_PROFILE;
    }
    if (subKey === "details" || typeof subKey === "string") {
      return STALE_TIMES.DOCTOR_DETAILS;
    }
    return STALE_TIMES.DOCTOR_LIST;
  }

  // Treatment queries
  if (key === "treatment-cycle" || key === "treatment-cycles") {
    return STALE_TIMES.TREATMENT_CYCLES;
  }
  if (
    key === "treatment" ||
    key === "treatments" ||
    key === "doctor-treatments"
  ) {
    return STALE_TIMES.TREATMENTS;
  }

  // Appointment queries
  if (key === "appointment" || key === "appointments") {
    return STALE_TIMES.APPOINTMENTS;
  }

  // Statistics queries
  if (key === "statistics" || key === "stats") {
    return STALE_TIMES.STATISTICS;
  }

  return STALE_TIMES.DEFAULT;
}

/**
 * Create optimized QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry failed requests once
        retry: 1,

        // Don't refetch on window focus (better UX, less API calls)
        refetchOnWindowFocus: false,

        // Don't refetch on reconnect by default (can be overridden per query)
        refetchOnReconnect: false,

        // Don't refetch on mount if data is fresh
        refetchOnMount: true,

        // Custom stale time based on query key - data freshness duration
        staleTime: (query) => {
          return getStaleTimeForQueryKey(query.queryKey);
        },

        // Default cache time - keep unused data in memory
        // Note: gcTime doesn't support functions, so we use a default value
        // Individual queries can override this if needed
        gcTime: CACHE_TIMES.DEFAULT,

        // Retry delay increases exponentially
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,

        // Retry delay for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
}

/**
 * QueryClient instance - exported for use in Providers
 */
export const queryClient = createQueryClient();
