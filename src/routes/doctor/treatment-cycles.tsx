/**
 * Treatment Cycles List Page
 * Displays patients currently in treatment with their treatment type and timeline
 */

import { useMemo, useState, memo } from "react";
import { RefreshCw } from "lucide-react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { HorizontalTreatmentTimeline } from "@/features/doctor/treatment-cycles/HorizontalTreatmentTimeline";
import { CycleUpdateModal } from "@/features/doctor/treatment-cycles/CycleUpdateModal";
import { TreatmentCycleDetailModal } from "@/features/doctor/treatment-cycles/TreatmentCycleDetailModal";
import { cn } from "@/utils/cn";
import {
  normalizeTreatmentCycleStatus,
  type PaginatedResponse,
  type TreatmentCycle,
} from "@/api/types";
import { createEmptyPaginatedResponse } from "@/utils/api-helpers";

export const Route = createFileRoute("/doctor/treatment-cycles")({
  component: DoctorTreatmentCyclesComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

interface PatientInTreatment {
  patientId: string;
  treatmentId: string;
  patientName: string;
  treatmentType: "IUI" | "IVF" | null;
  activeCycle: TreatmentCycle | null;
  allCycles: TreatmentCycle[];
}

function DoctorTreatmentCyclesComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const search = Route.useSearch() as { patientId?: string };
  const [treatmentTypeFilter, setTreatmentTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>(search.patientId || "");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      }),
      queryClient.invalidateQueries({ queryKey: ["treatment"] }),
    ]);
    setIsRefreshing(false);
  };

  // Fetch all cycles (including cancelled/failed to show patients even after cancellation)
  const { data: cyclesData, isFetching } = useQuery<
    PaginatedResponse<TreatmentCycle>
  >({
    queryKey: ["doctor", "treatment-cycles", "all", doctorId],
    enabled: !!doctorId,
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    queryFn: async (): Promise<PaginatedResponse<TreatmentCycle>> => {
      try {
        // Fetch all cycles for doctor (API has issues with Status filter, so we filter client-side)
        const response = await api.treatmentCycle.getTreatmentCycles({
          doctorId: doctorId!,
          Page: 1,
          Size: 100, // Get more to group by patient
          // Don't use Status filter as API returns 500 error
        });

        // Get all cycles (including cancelled, failed, completed) to show patients
        // even when their cycles are cancelled or failed
        const allCycles = response.data || [];

        const uniqueCycles = Array.from(
          new Map(allCycles.map((cycle) => [cycle.id, cycle])).values()
        );

        return {
          code: 200,
          message: "",
          data: uniqueCycles,
          metaData: {
            pageNumber: 1,
            pageSize: uniqueCycles.length,
            totalCount: uniqueCycles.length,
            totalPages: 1,
            hasPrevious: false,
            hasNext: false,
          },
        };
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<TreatmentCycle>(0);
        }
        const message =
          error?.response?.data?.message || "Unable to load treatment cycles.";
        toast.error(message);
        return {
          code: 200,
          message: "",
          data: [],
          metaData: {
            pageNumber: 1,
            pageSize: 0,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
          },
        };
      }
    },
  });

  // Check if we need to fetch treatments
  // Only fetch if there are cycles missing patientId or treatmentType
  const needsTreatments = useMemo(() => {
    const cycles = cyclesData?.data || [];
    return cycles.some(
      (cycle) => !cycle.patientId || (!cycle.treatmentType && cycle.treatmentId)
    );
  }, [cyclesData?.data]);

  // Extract unique treatment IDs from cycles that need treatment data
  const uniqueTreatmentIdsFromCycles = useMemo(() => {
    if (!needsTreatments) return [];
    const cycles = cyclesData?.data || [];
    return Array.from(
      new Set(cycles.map((c) => c.treatmentId).filter(Boolean))
    );
  }, [cyclesData?.data, needsTreatments]);

  // Only fetch treatments if we actually need them (cycles missing patientId or treatmentType)
  // This significantly speeds up the page load when cycles already have all needed data
  const { data: allTreatmentsData } = useQuery({
    queryKey: ["treatments", "doctor", doctorId],
    enabled: !!doctorId && needsTreatments, // Only fetch if needed
    staleTime: 60000, // Cache for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: false, // No retry to speed up
    queryFn: async () => {
      try {
        const response = await api.treatment.getTreatments({
          doctorId: doctorId!,
          pageNumber: 1,
          pageSize: 200, // Get enough to cover all treatments
        });
        return response.data || [];
      } catch (error) {
        console.error("Failed to fetch treatments:", error);
        return [];
      }
    },
  });

  // Filter to only treatments we need (based on treatmentIds from cycles)
  const treatmentsData = useMemo(() => {
    if (!allTreatmentsData || uniqueTreatmentIdsFromCycles.length === 0) {
      return [];
    }
    const treatmentIdsSet = new Set(uniqueTreatmentIdsFromCycles);
    return allTreatmentsData.filter(
      (treatment) => treatment?.id && treatmentIdsSet.has(treatment.id)
    );
  }, [allTreatmentsData, uniqueTreatmentIdsFromCycles]);

  // Create treatmentId -> patientId map for fast lookup
  // Also create treatmentId -> treatment map for quick access
  const treatmentToPatientMap = useMemo(() => {
    const map = new Map<string, string>();
    treatmentsData?.forEach((treatment) => {
      if (treatment?.patientId && treatment?.id) {
        map.set(treatment.id, treatment.patientId);
      }
    });
    return map;
  }, [treatmentsData]);

  // Create treatment lookup map for faster access
  const treatmentMap = useMemo(() => {
    const map = new Map<string, any>();
    treatmentsData?.forEach((treatment) => {
      if (treatment?.id) {
        map.set(treatment.id, treatment);
      }
    });
    return map;
  }, [treatmentsData]);

  // Extract patientName from treatment agreements (if available)
  // This avoids needing to fetch patient details just for the name
  const treatmentToPatientNameMap = useMemo(() => {
    const map = new Map<string, string>();
    treatmentsData?.forEach((treatment) => {
      if (treatment?.id) {
        // Check if treatment has agreements array (may not be in type definition)
        const agreements = (treatment as any)?.agreements;
        if (agreements && Array.isArray(agreements) && agreements.length > 0) {
          const patientName = agreements[0]?.patientName;
          if (patientName) {
            map.set(treatment.id, patientName);
          }
        }
      }
    });
    return map;
  }, [treatmentsData]);

  // Group cycles by patient AND treatment to show each treatment separately
  // This allows showing cancelled treatments alongside new treatments
  const patientsInTreatment = useMemo(() => {
    const cycles = cyclesData?.data || [];
    // Use composite key: patientId + treatmentId to group by treatment
    const patientMap = new Map<string, PatientInTreatment>();

    cycles.forEach((cycle) => {
      // Get patientId from cycle (preferred) or from treatment map (fallback)
      // Most cycles should have patientId, so we avoid waiting for treatments
      const patientId =
        cycle.patientId || treatmentToPatientMap.get(cycle.treatmentId);
      if (!patientId || !cycle.treatmentId) return;

      // Create composite key: patientId + treatmentId
      // This ensures each treatment shows as a separate entry
      const compositeKey = `${patientId}_${cycle.treatmentId}`;

      if (!patientMap.has(compositeKey)) {
        patientMap.set(compositeKey, {
          patientId,
          treatmentId: cycle.treatmentId,
          patientName: "Loading...",
          treatmentType: cycle.treatmentType || null,
          activeCycle: null,
          allCycles: [],
        });
      }

      const patient = patientMap.get(compositeKey)!;
      patient.allCycles.push(cycle);

      // Get treatment type from cycle (preferred) or treatment (fallback)
      // Most cycles should have treatmentType, so we avoid waiting for treatments
      let cycleTreatmentType = cycle.treatmentType;
      if (!cycleTreatmentType && cycle.treatmentId && treatmentMap.size > 0) {
        const treatment = treatmentMap.get(cycle.treatmentId);
        if (treatment?.treatmentType) {
          // Only use if it's IUI or IVF
          if (
            treatment.treatmentType === "IUI" ||
            treatment.treatmentType === "IVF"
          ) {
            cycleTreatmentType = treatment.treatmentType;
            // Update cycle object with treatmentType for components
            (cycle as any).treatmentType = treatment.treatmentType;
          }
        }
      }

      // Update patient treatment type
      if (cycleTreatmentType) {
        patient.treatmentType = cycleTreatmentType;
      }
    });

    // After grouping, select the best activeCycle for each patient
    // Active cycle = cycle with LOWEST cycleNumber that is not Completed/Cancelled/Failed
    // If all cycles are cancelled/completed/failed, use the most recent cycle for display
    // This ensures we always work on cycles in order (1 → 2 → 3 → ...), regardless of status
    patientMap.forEach((patient) => {
      if (patient.allCycles.length === 0) return;

      // Pre-compute statuses to avoid repeated calls
      const cyclesWithStatus = patient.allCycles.map((c) => ({
        cycle: c,
        status: normalizeTreatmentCycleStatus(c.status),
      }));

      // Find all cycles that are not Completed, Cancelled, or Failed
      // Sort by cycleNumber (ascending) and return the first one
      const activeCycles = cyclesWithStatus
        .filter(({ status }) => {
          return (
            status !== "Completed" &&
            status !== "Cancelled" &&
            status !== "Failed"
          );
        })
        .sort((a, b) => a.cycle.cycleNumber - b.cycle.cycleNumber);

      // Select the cycle with lowest cycleNumber as activeCycle
      // If no active cycles, use the most recent cycle (including cancelled) for display
      if (activeCycles.length > 0) {
        patient.activeCycle = activeCycles[0].cycle;
      } else {
        // All cycles are cancelled/completed/failed - use the most recent one for display
        // Pre-compute dates to avoid repeated Date parsing
        const cyclesWithDates = cyclesWithStatus.map(({ cycle }) => ({
          cycle,
          date: cycle.updatedAt
            ? new Date(cycle.updatedAt).getTime()
            : cycle.createdAt
              ? new Date(cycle.createdAt).getTime()
              : 0,
        }));
        cyclesWithDates.sort((a, b) => b.date - a.date); // Most recent first
        patient.activeCycle = cyclesWithDates[0]?.cycle || null;
      }
    });

    return Array.from(patientMap.values());
  }, [cyclesData?.data, treatmentToPatientMap, treatmentMap]);

  // Update patient names from treatment agreements (no need to fetch patient details)
  const patientsWithDetails = useMemo(() => {
    return patientsInTreatment.map((patient) => {
      // Get patientName from treatment agreements (fastest, no API call needed)
      const patientNameFromAgreement = treatmentToPatientNameMap.get(
        patient.treatmentId
      );

      // Use patientName from agreement or fallback
      const actualPatientName =
        patientNameFromAgreement || patient.patientName || "Unknown";

      return {
        ...patient,
        patientName: actualPatientName,
      };
    });
  }, [patientsInTreatment, treatmentToPatientNameMap]);

  // Filter patients based on search and treatment type
  // Optimized: Pre-compute lowercase values and use early returns
  const filteredPatients = useMemo(() => {
    if (!treatmentTypeFilter && !searchTerm) {
      return patientsWithDetails;
    }

    const searchLower = searchTerm ? searchTerm.toLowerCase() : null;

    return patientsWithDetails.filter((p) => {
      // Filter by treatment type first (faster check)
      if (treatmentTypeFilter && p.treatmentType !== treatmentTypeFilter) {
        return false;
      }

      // Filter by search term (only by name and id, no patientCode)
      if (searchLower) {
        const nameMatch = p.patientName.toLowerCase().includes(searchLower);
        const idMatch = p.patientId.toLowerCase().includes(searchLower);

        if (!nameMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }, [patientsWithDetails, treatmentTypeFilter, searchTerm]);

  // Memoized component to prevent unnecessary re-renders
  const PatientCard = memo(function PatientCard({
    patient,
    treatmentToPatientNameMap,
    doctorProfile,
    user,
  }: {
    patient: PatientInTreatment;
    treatmentToPatientNameMap: Map<string, string>;
    doctorProfile?: any;
    user?: any;
  }) {
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isCycleDetailModalOpen, setIsCycleDetailModalOpen] = useState(false);
    const activeCycle = patient.activeCycle;

    // Get treatment from cache for faster lookup
    const cycleTreatment = useMemo(() => {
      if (!activeCycle?.treatmentId || treatmentMap.size === 0)
        return undefined;
      return treatmentMap.get(activeCycle.treatmentId);
    }, [treatmentMap, activeCycle?.treatmentId]);

    // Ensure activeCycle has treatmentType
    const cycleWithType = useMemo(() => {
      if (!activeCycle) return null;
      if (activeCycle.treatmentType) return activeCycle;
      if (cycleTreatment?.treatmentType) {
        return {
          ...activeCycle,
          treatmentType:
            cycleTreatment.treatmentType === "IUI" ||
            cycleTreatment.treatmentType === "IVF"
              ? cycleTreatment.treatmentType
              : undefined,
        };
      }
      return activeCycle;
    }, [activeCycle, cycleTreatment]);

    // Get all cycles for this treatment from cached data
    const allCyclesData = useMemo(() => {
      if (!cycleWithType?.treatmentId) return [];
      return (cyclesData?.data || []).filter(
        (c) => c.treatmentId === cycleWithType.treatmentId
      );
    }, [cyclesData?.data, cycleWithType?.treatmentId]);

    // Get patientName from treatment agreements
    const patientName =
      treatmentToPatientNameMap.get(patient.treatmentId) ||
      patient.patientName ||
      "Unknown";

    // Only render if we have active cycle and cycle with type
    if (!activeCycle || !cycleWithType) {
      return null;
    }

    // Format start date
    const startDate = cycleWithType.startDate
      ? new Date(cycleWithType.startDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    // Determine treatment status based on all cycles
    const treatmentStatus = useMemo(() => {
      const allCycles = patient.allCycles;
      if (allCycles.length === 0) return null;

      const statuses = allCycles.map((c) =>
        normalizeTreatmentCycleStatus(c.status)
      );

      // If all cycles are cancelled, treatment is cancelled
      if (statuses.every((s) => s === "Cancelled")) {
        return "Cancelled";
      }

      // If all cycles are completed, treatment is completed
      if (statuses.every((s) => s === "Completed")) {
        return "Completed";
      }

      // If all cycles are failed, treatment is failed
      if (statuses.every((s) => s === "Failed")) {
        return "Failed";
      }

      // Otherwise, treatment is active (has at least one non-completed/cancelled/failed cycle)
      return "Active";
    }, [patient.allCycles]);

    return (
      <>
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            {/* Patient Header Section */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Patient Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {patientName}
                    </h2>
                    {cycleWithType.treatmentType && (
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          cycleWithType.treatmentType === "IVF"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-pink-100 text-pink-700"
                        )}
                      >
                        {cycleWithType.treatmentType}
                      </span>
                    )}
                    {treatmentStatus && (
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          treatmentStatus === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : treatmentStatus === "Completed"
                              ? "bg-green-100 text-green-700"
                              : treatmentStatus === "Failed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {treatmentStatus}
                      </span>
                    )}
                  </div>
                  {startDate && (
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">Started: </span>
                      {startDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    setIsCycleDetailModalOpen(true);
                  }}
                >
                  View Details
                </Button>
                <Button size="sm" onClick={() => setIsUpdateModalOpen(true)}>
                  Update Record
                </Button>
              </div>
            </div>

            {/* Horizontal Timeline */}
            <div className="mt-6">
              <HorizontalTreatmentTimeline
                cycle={cycleWithType}
                allCycles={
                  allCyclesData.length > 0 ? allCyclesData : patient.allCycles
                }
                onStepClick={(step) => {
                  navigate({
                    to: "/doctor/treatment-cycles/$cycleId",
                    params: { cycleId: cycleWithType.id },
                    search: { step },
                  } as any);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cycle Update Modal */}
        {cycleWithType && (
          <>
            <CycleUpdateModal
              cycle={cycleWithType}
              isOpen={isUpdateModalOpen}
              onClose={() => setIsUpdateModalOpen(false)}
              // Pass cached data to avoid refetching
              treatment={treatmentMap.get(cycleWithType.treatmentId)}
              allCycles={
                allCyclesData.length > 0 ? allCyclesData : patient.allCycles
              }
              // Pass doctor profile and user to avoid refetching
              doctorProfile={doctorProfile}
              currentUser={user}
              // Pass patient name to avoid fetching
              patientName={patientName}
            />
            <TreatmentCycleDetailModal
              cycle={cycleWithType}
              isOpen={isCycleDetailModalOpen}
              onClose={() => setIsCycleDetailModalOpen(false)}
              // Pass cached data to avoid refetching
              treatment={treatmentMap.get(cycleWithType.treatmentId)}
            />
          </>
        )}
      </>
    );
  });

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {!doctorProfileLoading && !doctorProfile && doctorId ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Doctor profile information is being loaded. If this message
              persists, please contact the administrator.
            </div>
          ) : null}

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Patients in Treatment</h1>
                <p className="text-gray-600">
                  List of patients currently in IUI/IVF treatment with progress
                  timeline
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({ to: "/doctor/encounters/create" } as any)
                  }
                >
                  Create New Treatment
                </Button>
              </div>
            </div>
          </section>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    {filteredPatients.length} treatment
                    {filteredPatients.length !== 1 ? "s" : ""} in progress
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <Input
                    placeholder="By patient name"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Treatment Type
                  </label>
                  <select
                    value={treatmentTypeFilter}
                    onChange={(event) =>
                      setTreatmentTypeFilter(event.target.value)
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All</option>
                    <option value="IUI">IUI</option>
                    <option value="IVF">IVF</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Patients List */}
          <section className="space-y-6">
            {isFetching ? (
              <div className="py-12 text-center text-gray-500">
                Loading patients...
              </div>
            ) : filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => {
                return (
                  <PatientCard
                    key={`${patient.patientId}_${patient.treatmentId}`}
                    patient={patient}
                    treatmentToPatientNameMap={treatmentToPatientNameMap}
                    doctorProfile={doctorProfile}
                    user={user}
                  />
                );
              })
            ) : cyclesData?.data && cyclesData.data.length > 0 ? (
              // If we have cycles but no filtered patients, show loading state
              // This handles the case where treatments are still loading
              <div className="py-12 text-center text-gray-500">
                Loading patient information...
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto max-w-md">
                  <div className="mb-4 text-6xl">📋</div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    No patients in treatment found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || treatmentTypeFilter
                      ? "Try changing the filters to search"
                      : "Currently no patients are in treatment"}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
