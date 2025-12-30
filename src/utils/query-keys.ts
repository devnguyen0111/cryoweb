/**
 * Query Keys Factory
 * Provides centralized query key generation for React Query
 * Helps prevent typos and ensures consistency across the application
 */

/**
 * Query keys factory for consistent query key generation
 */
export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    search: (term: string) => ["patients", "search", term] as const,
    detail: (id: string) => ["patient-details", id] as const,
    byId: (id: string) => ["patient", id] as const,
    lists: () => ["patients", "list"] as const,
  },
  appointments: {
    all: ["appointments"] as const,
    byPatient: (patientId: string) =>
      ["appointments", "for-service-request", patientId] as const,
    byDoctor: (doctorId: string, date?: string) =>
      ["doctor", "appointments", doctorId, date] as const,
    detail: (id: string) => ["appointment", id] as const,
  },
  services: {
    all: ["services"] as const,
    active: () => ["services", "active"] as const,
    byCategory: (categoryId: string) =>
      ["services", "category", categoryId] as const,
  },
  serviceCategories: {
    all: ["service-categories"] as const,
    active: () => ["service-categories", "active"] as const,
  },
  treatments: {
    all: ["treatments"] as const,
    byPatient: (patientId: string) =>
      ["treatments", "patient", patientId] as const,
    detail: (id: string) => ["treatment", id] as const,
  },
  treatmentCycles: {
    all: ["treatment-cycles"] as const,
    byTreatment: (treatmentId: string) =>
      ["treatment-cycles", "treatment", treatmentId] as const,
    detail: (id: string) => ["treatment-cycle", id] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (id: string) => ["user-details", id] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    profile: (id: string) => ["doctor", "profile", id] as const,
    detail: (id: string) => ["doctor", id] as const,
  },
} as const;
