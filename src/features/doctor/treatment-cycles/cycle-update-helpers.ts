/**
 * Helper functions for CycleUpdateModal data fetching and transformation
 * Separates data transformation logic from query hooks
 */

import type {
  TreatmentCycle,
  Relationship,
  LabSampleDetailResponse,
} from "@/api/types";

// Constants
const STALE_TIME = 30000; // 30 seconds
const QUALITY_CHECKED_STATUSES = [
  "QualityChecked",
  "Fertilized",
  "CulturedEmbryo",
  "Stored",
  "Used",
  "Frozen",
] as const;

/**
 * Infers treatment type from cycle data
 */
export function inferTreatmentType(
  cycle: TreatmentCycle,
  treatmentType?: string | null
): "IUI" | "IVF" | undefined {
  // First, try cycle.treatmentType
  if (cycle.treatmentType === "IUI" || cycle.treatmentType === "IVF") {
    return cycle.treatmentType;
  }

  // Then try treatmentType parameter
  if (treatmentType) {
    const type = String(treatmentType).toUpperCase();
    if (type === "IUI") return "IUI";
    if (type === "IVF") return "IVF";
  }

  // Try to infer from cycleName if available
  if (cycle.cycleName) {
    const cycleNameUpper = cycle.cycleName.toUpperCase();
    if (cycleNameUpper.includes("IVF")) return "IVF";
    if (cycleNameUpper.includes("IUI")) return "IUI";
  }

  return undefined;
}

/**
 * Checks if cycle is IVF cycle 3 (Oocyte Retrieval and Sperm Collection)
 */
export function isIVFCycle3(cycle: TreatmentCycle): boolean {
  if (cycle.treatmentType !== "IVF") return false;

  // Check by cycleNumber
  if (cycle.cycleNumber === 3) return true;

  // Check by stepType
  const stepTypeStr = cycle.stepType
    ? String(cycle.stepType).toUpperCase()
    : "";
  if (stepTypeStr === "IVF_OPU") return true;

  // Check by currentStep
  const currentStep = cycle.currentStep as string | undefined;
  if (currentStep === "step4_opu") return true;

  // Check by cycleName
  const cycleNameLower = cycle.cycleName?.toLowerCase() || "";
  if (
    cycleNameLower.includes("oocyte retrieval") ||
    cycleNameLower.includes("sperm collection") ||
    (cycleNameLower.includes("opu") && cycleNameLower.includes("cycle"))
  ) {
    return true;
  }

  return false;
}

/**
 * Gets partner patient ID from relationships
 */
export function getPartnerPatientId(
  relationships: Relationship[],
  currentPatientId: string
): string | null {
  const partnerRelationship = relationships.find(
    (rel) =>
      (rel.relationshipType === "Married" ||
        rel.relationshipType === "Unmarried") &&
      rel.isActive !== false
  );

  if (!partnerRelationship) return null;

  return partnerRelationship.patient1Id === currentPatientId
    ? partnerRelationship.patient2Id
    : partnerRelationship.patient1Id;
}

/**
 * Filters samples by quality checked status
 */
export function filterQualityCheckedSamples(
  samples: LabSampleDetailResponse[]
): LabSampleDetailResponse[] {
  return samples.filter((sample) =>
    QUALITY_CHECKED_STATUSES.includes(sample.status as any)
  );
}

/**
 * Safe API call wrapper with consistent error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (errorMessage && process.env.NODE_ENV === "development") {
      console.warn(errorMessage, error);
    }
    return fallback;
  }
}

/**
 * Creates empty response with consistent structure
 */
export function createEmptyDataResponse<T>(): {
  data: T[];
  metaData: { totalCount: number; totalPages: number };
} {
  return {
    data: [],
    metaData: { totalCount: 0, totalPages: 0 },
  };
}

/**
 * Query configuration constants
 */
export const QUERY_CONFIG = {
  STALE_TIME,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  RETRY: 1,
  RETRY_DELAY: 1000,
} as const;
