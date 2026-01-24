import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient, useQueries } from "@tanstack/react-query";
import { api } from "@/api/client";
import { isAxiosError } from "axios";
import type {
  LabSampleDetailResponse,
  Patient,
  PatientDetailResponse,
} from "@/api/types";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { EmbryoCultureConfirmationModal } from "@/features/doctor/embryo-culture/EmbryoCultureConfirmationModal";

export const Route = createFileRoute("/doctor/embryo-culture")({
  component: EmbryoCultureComponent,
});

function EmbryoCultureComponent() {
  const queryClient = useQueryClient();
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["embryo-culture-cycles"],
    });
    setIsRefreshing(false);
  };

  // Fetch treatment cycles that are in embryo culture stage
  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ["embryo-culture-cycles", searchTerm],
    queryFn: async () => {
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          pageNumber: 1,
          pageSize: 100,
          searchTerm: searchTerm || undefined,
        });
        return response.data ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  // Filter cycles that are in embryo culture stage
  // With new step plan: IVF_Fertilization (step 4) is when embryos are created and need culture
  // Legacy support: step6_embryo_culture for backward compatibility
  const cyclesInCulture = useMemo(() => {
    if (!cyclesData) return [];

    return cyclesData.filter((cycle) => {
      // Check if cycle is in embryo culture stage
      // Priority 1: Check currentStep directly
      if (
        cycle.currentStep === "step5_fertilization" ||
        cycle.currentStep === "step6_embryo_culture" // Legacy support
      ) {
        return true;
      }

      // Priority 2: Check stepType
      const stepType = cycle.stepType;
      if (stepType) {
        const stepTypeStr = String(stepType).toUpperCase();
        // New step plan: IVF_Fertilization (In Vitro Fertilization)
        if (
          stepTypeStr === "IVF_FERTILIZATION" ||
          stepTypeStr.includes("FERTILIZATION")
        ) {
          return true;
        }
        // Legacy support: Embryo Culture step
        if (
          stepTypeStr.includes("EMBRYO_CULTURE") ||
          stepTypeStr.includes("EMBRYOCULTURE") ||
          (stepTypeStr.includes("CULTURE") && !stepTypeStr.includes("TRANSFER"))
        ) {
          return true;
        }
      }

      // Priority 3: Check cycleName as fallback
      const cycleName = cycle.cycleName?.toLowerCase() || "";
      if (
        cycleName.includes("in vitro fertilization") ||
        cycleName.includes("fertilization") ||
        (cycleName.includes("embryo culture") &&
          !cycleName.includes("transfer")) ||
        (cycleName.includes("culture") && !cycleName.includes("transfer"))
      ) {
        return true;
      }

      return false;
    });
  }, [cyclesData]);

  // Get unique treatment IDs from cycles
  const treatmentIds = useMemo(() => {
    return Array.from(
      new Set(
        cyclesInCulture
          .map((cycle) => cycle.treatmentId)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [cyclesInCulture]);

  // Fetch treatments to get patientId for cycles that don't have patientId
  const { data: treatmentsData } = useQuery({
    queryKey: ["treatments", "embryo-culture", treatmentIds],
    enabled: treatmentIds.length > 0,
    queryFn: async () => {
      const results: any[] = [];
      await Promise.all(
        treatmentIds.map(async (treatmentId) => {
          try {
            const response = await api.treatment.getTreatmentById(treatmentId);
            if (response.data) {
              results.push(response.data);
            }
          } catch (error) {
            // Ignore errors for individual treatments
          }
        })
      );
      return results;
    },
  });

  // Create treatmentId -> patientId map
  const treatmentToPatientMap = useMemo(() => {
    const map = new Map<string, string>();
    treatmentsData?.forEach((treatment) => {
      if (treatment?.patientId) {
        map.set(treatment.id, treatment.patientId);
      }
    });
    return map;
  }, [treatmentsData]);

  // Get unique patient IDs from cycles (with fallback to treatment map)
  const patientIds = useMemo(() => {
    const ids = new Set<string>();
    cyclesInCulture.forEach((cycle) => {
      const patientId =
        cycle.patientId || treatmentToPatientMap.get(cycle.treatmentId);
      if (patientId) {
        ids.add(patientId);
      }
    });
    return Array.from(ids);
  }, [cyclesInCulture, treatmentToPatientMap]);

  // Fetch patient data for all cycles
  const patientQueries = useQueries({
    queries: patientIds.map((patientId) => ({
      queryKey: ["doctor", "patient", patientId, "embryo-culture"],
      queryFn: async (): Promise<Patient | PatientDetailResponse | null> => {
        try {
          const response = await api.patient.getPatientById(patientId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error)) {
            if (error.response?.status === 403) {
              try {
                const fallback = await api.patient.getPatientDetails(patientId);
                return fallback.data ?? null;
              } catch {
                return null;
              }
            }
            if (error.response?.status === 404) {
              return null;
            }
          }
          return null;
        }
      },
      retry: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })),
  });

  // Fetch user details for all patients to get names
  const userDetailsQueries = useQueries({
    queries: patientIds.map((patientId) => ({
      queryKey: ["doctor", "user-details", patientId, "embryo-culture"],
      enabled: Boolean(patientId),
      retry: false,
      queryFn: async () => {
        if (!patientId) return null;
        try {
          const response = await api.user.getUserDetails(patientId);
          return response.data ?? null;
        } catch (error) {
          if (
            isAxiosError(error) &&
            (error.response?.status === 404 || error.response?.status === 403)
          ) {
            return null;
          }
          return null;
        }
      },
    })),
  });

  // Create maps for quick lookup
  const patientsMap = useMemo(() => {
    const map = new Map<string, Patient | PatientDetailResponse | null>();
    patientQueries.forEach((query, index) => {
      if (patientIds[index]) {
        map.set(patientIds[index], query.data ?? null);
      }
    });
    return map;
  }, [patientQueries, patientIds]);

  const userDetailsMap = useMemo(() => {
    const map = new Map<string, any>();
    userDetailsQueries.forEach((query, index) => {
      if (patientIds[index]) {
        map.set(patientIds[index], query.data ?? null);
      }
    });
    return map;
  }, [userDetailsQueries, patientIds]);

  // Fetch embryos for cycles in culture
  // Optimized: Fetch all embryos once, then group by cycleId instead of fetching multiple times
  const { data: embryosData, isLoading: embryosLoading } = useQuery({
    queryKey: ["embryo-culture-embryos", cyclesInCulture.map((c) => c.id)],
    enabled: cyclesInCulture.length > 0,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    queryFn: async () => {
      try {
        // Fetch all embryos once instead of fetching for each cycle
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Embryo",
          Page: 1,
          Size: 1000, // Get more to cover all cycles
        });

        const allEmbryos = response.data ?? [];

        // Group embryos by cycleId
        const results: Record<string, LabSampleDetailResponse[]> = {};
        cyclesInCulture.forEach((cycle) => {
          results[cycle.id] = allEmbryos.filter(
            (embryo) => embryo.treatmentCycleId === cycle.id
          );
        });

        return results;
      } catch (error) {
        // Return empty results for all cycles on error
        const results: Record<string, LabSampleDetailResponse[]> = {};
        cyclesInCulture.forEach((cycle) => {
          results[cycle.id] = [];
        });
        return results;
      }
    },
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) {
        return "—";
      }
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const isLoading = cyclesLoading || embryosLoading;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Embryo Culture Confirmation
              </h1>
              <p className="text-gray-600 mt-2">
                Confirm the number of embryos in culture
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Treatment Cycles in Embryo Culture</CardTitle>
                <Input
                  placeholder="Search cycle code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : cyclesInCulture.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No treatment cycles in embryo culture stage
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Cycle Code</th>
                          <th className="text-left p-3">Patient</th>
                          <th className="text-left p-3">Start Date</th>
                          <th className="text-left p-3">Embryo Count</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cyclesInCulture.map((cycle) => {
                          const cycleEmbryos = embryosData?.[cycle.id] ?? [];
                          const totalEmbryos = cycleEmbryos.reduce(
                            (sum, e) => sum + (e.embryo?.quantity || 0),
                            0
                          );

                          // Get patientId from cycle or treatment map
                          const resolvedPatientId =
                            cycle.patientId ||
                            treatmentToPatientMap.get(cycle.treatmentId);

                          // Get patient data
                          const patient = resolvedPatientId
                            ? patientsMap.get(resolvedPatientId)
                            : null;
                          const userDetails = resolvedPatientId
                            ? userDetailsMap.get(resolvedPatientId)
                            : null;

                          // Get patient name
                          const patientName =
                            getFullNameFromObject(userDetails) ||
                            getFullNameFromObject(
                              (patient as any)?.accountInfo
                            ) ||
                            getFullNameFromObject(patient) ||
                            userDetails?.userName ||
                            (patient as any)?.accountInfo?.username ||
                            null;

                          const patientCode = (patient as any)?.patientCode;
                          const patientDisplay =
                            patientName ||
                            patientCode ||
                            (resolvedPatientId
                              ? getLast4Chars(resolvedPatientId)
                              : "—");

                          return (
                            <tr
                              key={cycle.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">
                                <span className="font-mono text-sm">
                                  {cycle.cycleName || getLast4Chars(cycle.id)}
                                </span>
                              </td>
                              <td className="p-3 text-sm">
                                {patientName ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {patientName}
                                    </span>
                                    {patientCode && (
                                      <span className="text-xs text-gray-500 font-mono">
                                        {patientCode}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  patientDisplay
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {formatDate(cycle.startDate)}
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-sm">
                                  {totalEmbryos} embryos
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Badge
                                  className={cn(
                                    "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                    "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  )}
                                >
                                  In Culture
                                </Badge>
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCycleId(cycle.id)}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Confirm
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedCycleId && (
          <EmbryoCultureConfirmationModal
            cycleId={selectedCycleId}
            isOpen={!!selectedCycleId}
            onClose={() => setSelectedCycleId(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["embryo-culture-cycles"],
              });
              queryClient.invalidateQueries({
                queryKey: ["embryo-culture-embryos"],
              });
              setSelectedCycleId(null);
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
