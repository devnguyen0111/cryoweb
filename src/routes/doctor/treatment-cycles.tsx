/**
 * Treatment Cycles List Page
 * Displays patients currently in treatment with their treatment type and timeline
 */

import { useMemo, useState } from "react";
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
import { PatientDetailModal } from "@/features/doctor/treatment-cycles/PatientDetailModal";
import { CycleUpdateModal } from "@/features/doctor/treatment-cycles/CycleUpdateModal";
import { cn } from "@/utils/cn";
import {
  normalizeTreatmentCycleStatus,
  type PaginatedResponse,
  type TreatmentCycle,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/doctor/treatment-cycles")({
  component: DoctorTreatmentCyclesComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

interface PatientInTreatment {
  patientId: string;
  patientName: string;
  patientCode?: string;
  treatmentType: "IUI" | "IVF" | null;
  activeCycle: TreatmentCycle | null;
  allCycles: TreatmentCycle[];
}

function DoctorTreatmentCyclesComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const search = Route.useSearch();
  const [treatmentTypeFilter, setTreatmentTypeFilter] = useState<string>("");
  const searchParams = search as { patientId?: string };
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.patientId || ""
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor", "treatment-cycles"] }),
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

  // Fetch treatments to get patientId for cycles
  const uniqueTreatmentIds = useMemo(() => {
    const cycles = cyclesData?.data || [];
    return Array.from(
      new Set(cycles.map((c) => c.treatmentId).filter(Boolean))
    );
  }, [cyclesData?.data]);

  const { data: treatmentsData } = useQuery({
    queryKey: ["treatments", "for-cycles", uniqueTreatmentIds],
    enabled: uniqueTreatmentIds.length > 0,
    queryFn: async () => {
      const treatments = await Promise.all(
        uniqueTreatmentIds.map(async (treatmentId) => {
          try {
            const response = await api.treatment.getTreatmentById(treatmentId);
            return response.data;
          } catch {
            return null;
          }
        })
      );
      return treatments.filter(Boolean);
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

  // Group cycles by patient and fetch patient details
  const patientsInTreatment = useMemo(() => {
    const cycles = cyclesData?.data || [];
    const patientMap = new Map<string, PatientInTreatment>();

    cycles.forEach((cycle) => {
      // Get patientId from cycle or from treatment map
      const patientId =
        cycle.patientId || treatmentToPatientMap.get(cycle.treatmentId);
      if (!patientId) return;

      if (!patientMap.has(patientId)) {
        patientMap.set(patientId, {
          patientId,
          patientName: "Loading...",
          patientCode: undefined,
          treatmentType: cycle.treatmentType || null,
          activeCycle: null,
          allCycles: [],
        });
      }

      const patient = patientMap.get(patientId)!;
      patient.allCycles.push(cycle);

      // Get treatment type from cycle or treatment
      let cycleTreatmentType = cycle.treatmentType;
      if (!cycleTreatmentType) {
        const treatment = treatmentsData?.find(
          (t) => t && t.id === cycle.treatmentId
        );
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
    // Priority: InProgress > Planned/Scheduled/OnHold > Most recent (by startDate or createdAt)
    patientMap.forEach((patient) => {
      if (patient.allCycles.length === 0) return;

      // Sort cycles by priority and date
      const sortedCycles = [...patient.allCycles].sort((a, b) => {
        const aStatus = normalizeTreatmentCycleStatus(a.status);
        const bStatus = normalizeTreatmentCycleStatus(b.status);

        // Priority order: InProgress > Planned/Scheduled/OnHold > Others
        const getPriority = (status: string | null | undefined): number => {
          if (!status) return 999;
          if (status === "InProgress") return 1;
          if (["Planned", "Scheduled", "OnHold"].includes(status)) return 2;
          return 3; // Completed, Cancelled, Failed
        };

        const aPriority = getPriority(aStatus);
        const bPriority = getPriority(bStatus);

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // If same priority, sort by date (most recent first)
        const aDate = a.startDate
          ? new Date(a.startDate).getTime()
          : a.createdAt
            ? new Date(a.createdAt).getTime()
            : 0;
        const bDate = b.startDate
          ? new Date(b.startDate).getTime()
          : b.createdAt
            ? new Date(b.createdAt).getTime()
            : 0;

        return bDate - aDate; // Most recent first
      });

      // Select the first (highest priority) cycle as activeCycle
      patient.activeCycle = sortedCycles[0];
    });

    return Array.from(patientMap.values());
  }, [cyclesData?.data, treatmentToPatientMap, treatmentsData]);

  // Filter patients based on search and treatment type
  const filteredPatients = useMemo(() => {
    let filtered = patientsInTreatment;

    if (treatmentTypeFilter) {
      filtered = filtered.filter(
        (p) => p.treatmentType === treatmentTypeFilter
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.patientName.toLowerCase().includes(searchLower) ||
          p.patientCode?.toLowerCase().includes(searchLower) ||
          p.patientId.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [patientsInTreatment, treatmentTypeFilter, searchTerm]);

  // Component to fetch and display patient info
  function PatientCard({ patient }: { patient: PatientInTreatment }) {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const activeCycle = patient.activeCycle;

    // Fetch treatment to ensure we have treatmentType for the cycle
    const { data: cycleTreatment } = useQuery({
      queryKey: ["treatment", activeCycle?.treatmentId],
      queryFn: async () => {
        if (!activeCycle?.treatmentId) return null;
        try {
          const response = await api.treatment.getTreatmentById(
            activeCycle.treatmentId
          );
          return response.data;
        } catch {
          return null;
        }
      },
      enabled: !!activeCycle?.treatmentId,
    });

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

    const { data: patientDetails } = useQuery({
      queryKey: ["patient-details", patient.patientId],
      queryFn: async () => {
        try {
          const response = await api.patient.getPatientDetails(
            patient.patientId
          );
          return response.data;
        } catch {
          return null;
        }
      },
      enabled: !!patient.patientId,
    });

    const { data: userDetails } = useQuery({
      queryKey: ["user-details", patient.patientId],
      queryFn: async () => {
        try {
          const response = await api.user.getUserDetails(patient.patientId);
          return response.data;
        } catch {
          return null;
        }
      },
      enabled: !!patient.patientId,
    });

    // Fetch all appointments for this patient (for the entire treatment)
    const { data: appointmentsData } = useQuery({
      queryKey: ["appointments", "patient", patient.patientId],
      queryFn: async () => {
        if (!patient.patientId) return [];
        try {
          const response = await api.appointment.getAppointments({
            patientId: patient.patientId,
            pageNumber: 1,
            pageSize: 100, // Get all appointments
          });
          const appointments = response.data || [];
          // Filter appointments to ensure they belong to this specific patient
          // This prevents counting appointments from other patients if API doesn't filter correctly
          return appointments.filter((apt) => {
            // Check multiple possible field names for patientId
            const aptPatientId =
              apt.patientId ||
              (apt as any).patientID ||
              (apt as any).PatientId ||
              (apt as any).PatientID ||
              (apt as any).patient?.id ||
              (apt as any).patient?.patientId ||
              (apt as any).patientAccountId ||
              (apt as any).patientAccountID;
            return aptPatientId === patient.patientId;
          });
        } catch {
          return [];
        }
      },
      enabled: !!patient.patientId,
    });

    // Fetch all lab samples for all cycles in this treatment
    const { data: samplesData } = useQuery({
      queryKey: ["samples", "treatment", cycleWithType?.treatmentId],
      queryFn: async () => {
        if (!cycleWithType?.treatmentId) return [];
        try {
          // Get all cycles for the treatment first
          const cyclesResponse = await api.treatmentCycle.getTreatmentCycles({
            TreatmentId: cycleWithType.treatmentId,
            Page: 1,
            Size: 100,
          });
          const cycles = cyclesResponse.data || [];

          // Fetch samples for all cycles
          // Handle 500 errors gracefully - API might not be available for all cycles
          const allSamples = await Promise.allSettled(
            cycles.map(async (cycle) => {
              try {
                const samplesResponse =
                  await api.treatmentCycle.getCycleSamples(cycle.id);
                return samplesResponse.data || [];
              } catch (error: any) {
                // If 500 error, API might not be implemented yet - return empty array
                if (error?.response?.status === 500) {
                  return [];
                }
                return [];
              }
            })
          );

          // Extract successful results
          const successfulSamples = allSamples
            .filter((result) => result.status === "fulfilled")
            .map((result) => (result as PromiseFulfilledResult<any[]>).value);

          // Flatten and return unique samples
          const flattened = successfulSamples.flat();
          return flattened;
        } catch {
          return [];
        }
      },
      enabled: !!cycleWithType?.treatmentId,
    });

    // Fetch all agreements for this treatment
    const { data: agreementsData } = useQuery({
      queryKey: ["agreements", "treatment", cycleWithType?.treatmentId],
      queryFn: async () => {
        if (!cycleWithType?.treatmentId) return [];
        try {
          const response = await api.agreement.getAgreements({
            TreatmentId: cycleWithType.treatmentId,
            Page: 1,
            Size: 100, // Get all agreements
          });
          return response.data || [];
        } catch {
          return [];
        }
      },
      enabled: !!cycleWithType?.treatmentId,
    });

    // Fetch all cycles for this treatment to determine progress
    const { data: allCyclesData } = useQuery({
      queryKey: ["treatment-cycles", "treatment", cycleWithType?.treatmentId],
      queryFn: async () => {
        if (!cycleWithType?.treatmentId) return [];
        try {
          const response = await api.treatmentCycle.getTreatmentCycles({
            TreatmentId: cycleWithType.treatmentId,
            Page: 1,
            Size: 100, // Get all cycles for the treatment
          });
          return response.data || [];
        } catch {
          return [];
        }
      },
      enabled: !!cycleWithType?.treatmentId,
    });

    const patientName =
      patientDetails?.accountInfo?.username ||
      userDetails?.fullName ||
      userDetails?.userName ||
      patient.patientName ||
      "Unknown";
    const patientCode = patientDetails?.patientCode || patient.patientCode;
    const shortId = patientCode || `P-${getLast4Chars(patient.patientId)}`;

    // Get age from userDetails
    const age = userDetails?.age;

    // Get phone number
    const phone =
      patientDetails?.accountInfo?.phone ||
      userDetails?.phone ||
      userDetails?.phoneNumber ||
      patientDetails?.phoneNumber ||
      null;

    // Format phone number
    const formattedPhone = phone
      ? phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
      : null;

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

    const appointmentsCount = appointmentsData?.length || 0;
    const samplesCount = samplesData?.length || 0;
    const agreementsCount = agreementsData?.length || 0;

    return (
      <>
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            {/* Patient Header Section */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-bold text-blue-600">
                  {patientDetails?.accountInfo?.username?.charAt(0) ||
                    patientName.charAt(0).toUpperCase()}
                </div>

                {/* Patient Info */}
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {patientName}
                      {age && (
                        <span className="ml-2 text-gray-600">, {age}</span>
                      )}
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
                  </div>
                  <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">ID: </span>
                      {shortId}
                    </div>
                    {formattedPhone && (
                      <div>
                        <span className="font-medium">Phone: </span>
                        {formattedPhone}
                      </div>
                    )}
                    {startDate && (
                      <div>
                        <span className="font-medium">Started: </span>
                        {startDate}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => setIsDetailModalOpen(true)}
                >
                  View Details
                </Button>
                <Button size="sm" onClick={() => setIsUpdateModalOpen(true)}>
                  Update Record
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mb-6 flex gap-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                <div className="text-xs text-gray-500">Appointments</div>
                <div className="text-lg font-semibold text-gray-900">
                  {appointmentsCount}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                <div className="text-xs text-gray-500">Lab Samples</div>
                <div className="text-lg font-semibold text-gray-900">
                  {samplesCount}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                <div className="text-xs text-gray-500">Agreements</div>
                <div className="text-lg font-semibold text-gray-900">
                  {agreementsCount}
                </div>
              </div>
            </div>

            {/* Horizontal Timeline */}
            <div className="mt-6">
              <HorizontalTreatmentTimeline
                cycle={cycleWithType}
                allCycles={allCyclesData || patient.allCycles}
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

        {/* Patient Detail Modal */}
        <PatientDetailModal
          patientId={patient.patientId}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />

        {/* Cycle Update Modal */}
        {cycleWithType && (
          <CycleUpdateModal
            cycle={cycleWithType}
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
          />
        )}
      </>
    );
  }

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
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
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
                    {filteredPatients.length} patients in treatment
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <Input
                    placeholder="By patient name or patient code"
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
              filteredPatients.map((patient) => (
                <PatientCard key={patient.patientId} patient={patient} />
              ))
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
