import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Appointment,
  AppointmentExtendedDetailResponse,
  PatientDetailResponse,
  TreatmentCycle,
  TreatmentCycleStatus,
  Treatment,
  UserDetailResponse,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { StructuredNote } from "@/components/StructuredNote";
import { HorizontalTreatmentTimeline } from "@/features/doctor/treatment-cycles/HorizontalTreatmentTimeline";
import { normalizeTreatmentCycleStatus } from "@/api/types";

interface DoctorAppointmentDetailModalProps {
  appointmentId: string | null;
  patientId?: string | null; // Optional: can be provided to avoid dependency on appointment API returning it
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      // If not a valid date, try to parse as time string
      return value.slice(0, 5); // HH:mm
    }
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value.slice(0, 5); // HH:mm
  }
};

type TimelinePhase = {
  label: string;
  description: string;
  matchStatuses: string[];
};

const IVF_TIMELINE: TimelinePhase[] = [
  {
    label: "Pre-cycle workup",
    description: "Baseline assessment, consent, and stimulation planning.",
    matchStatuses: ["planned", "pre-cycle", "workup"],
  },
  {
    label: "Stimulation (COS)",
    description: "Controlled ovarian stimulation and monitoring.",
    matchStatuses: ["cos", "stimulation", "inprogress"],
  },
  {
    label: "Oocyte pick-up (OPU)",
    description: "Trigger, retrieval day logistics, and anaesthesia prep.",
    matchStatuses: ["opu", "retrieval"],
  },
  {
    label: "Fertilisation & culture",
    description: "IVF procedure, fertilisation check, embryo culture.",
    matchStatuses: ["fertilization", "culture"],
  },
  {
    label: "Embryo transfer (ET)",
    description: "Transfer or freezing plan confirmation with the patient.",
    matchStatuses: ["et", "transfer"],
  },
  {
    label: "Post-transfer follow-up",
    description: "Luteal support, pregnancy test, and clinical outcome.",
    matchStatuses: ["completed", "follow-up", "closed"],
  },
];

const IUI_TIMELINE: TimelinePhase[] = [
  {
    label: "Baseline & planning",
    description: "Cycle counseling, consent, and medication schedule.",
    matchStatuses: ["planned", "baseline"],
  },
  {
    label: "Ovarian stimulation",
    description: "Monitoring follicular growth and estradiol levels.",
    matchStatuses: ["cos", "stimulation", "inprogress"],
  },
  {
    label: "Trigger & preparation",
    description: "Ovulation trigger timing and sample preparation.",
    matchStatuses: ["trigger", "preparation"],
  },
  {
    label: "Insemination procedure",
    description: "IUI procedure, post-procedure counseling, rest.",
    matchStatuses: ["procedure", "insemination"],
  },
  {
    label: "Luteal phase support",
    description: "Progesterone support and symptom checks.",
    matchStatuses: ["luteal", "support"],
  },
  {
    label: "Outcome review",
    description: "Pregnancy test result and next-step planning.",
    matchStatuses: ["completed", "follow-up", "closed"],
  },
];

const normalize = (value?: string | null) => value?.toLowerCase().trim() ?? "";

const normalizeStatus = (status?: TreatmentCycleStatus | null): string => {
  const normalized = normalizeTreatmentCycleStatus(status);
  return normalized?.toLowerCase() ?? "";
};

const resolveTimelinePhases = (
  cycle?: (TreatmentCycle & { treatment?: Treatment }) | null,
  treatment?: Treatment | null
) => {
  const treatmentType =
    treatment?.treatmentType || cycle?.treatment?.treatmentType;
  if (!treatmentType) {
    return [];
  }
  const type = treatmentType.toUpperCase();
  if (type === "IVF") {
    return IVF_TIMELINE;
  }
  if (type === "IUI") {
    return IUI_TIMELINE;
  }
  return [];
};

export function DoctorAppointmentDetailModal({
  appointmentId,
  patientId: propPatientId,
  isOpen,
  onClose,
}: DoctorAppointmentDetailModalProps) {
  const { user } = useAuth();
  const doctorId = user?.id ?? null;
  const [activeTab, setActiveTab] = useState<"overview" | "treatment">(
    "overview"
  );

  // Reset tab to overview when modal opens or appointment changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
    }
  }, [isOpen, appointmentId]);

  const {
    data: appointment,
    isLoading: appointmentLoading,
    isError: appointmentError,
    error: appointmentErrorData,
    isFetching: appointmentFetching,
  } = useQuery<AppointmentExtendedDetailResponse | null>({
    enabled: isOpen && Boolean(appointmentId),
    queryKey: ["doctor", "appointments", "detail-modal", appointmentId],
    retry: false,
    queryFn: async () => {
      if (!appointmentId) {
        return null;
      }
      const response =
        await api.appointment.getAppointmentDetails(appointmentId);
      return response.data ?? null;
    },
  });

  // Get patientId from props, appointment API, or patient object
  // Try multiple possible field names (case variations)
  const patientId = useMemo(() => {
    if (propPatientId) return propPatientId;
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    return (
      appointment.patientId ??
      raw.patientID ??
      raw.PatientId ??
      raw.PatientID ??
      raw.patient?.id ??
      raw.patient?.patientId ??
      raw.patient?.accountId ??
      raw.patientAccountId ??
      raw.patientAccountID ??
      raw.PatientAccountId ??
      raw.PatientAccountID ??
      null
    );
  }, [propPatientId, appointment]);

  console.log("PatientId sources:", {
    propPatientId,
    appointmentPatientId: appointment?.patientId,
    appointmentPatient: appointment?.patient,
    finalPatientId: patientId,
  });

  // Fetch user/account details (has fullName, dob, gender, email, phone)
  const {
    data: userDetails,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useQuery<UserDetailResponse | null>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "user-details", patientId, "appointment-modal"],
    retry: false,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.user.getUserDetails(patientId);
        return response.data ?? null;
      } catch (error) {
        console.error("Failed to fetch user details:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
  });

  // Fetch detailed patient info (has emergency contact, treatments, medical info, etc)
  const {
    data: patientDetails,
    isLoading: detailsLoading,
    isFetching: detailsFetching,
    isError: patientError,
    error: patientErrorData,
  } = useQuery<PatientDetailResponse | null>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "patients", patientId, "appointment-modal-details"],
    retry: false,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data ?? null;
      } catch (error) {
        console.error("Failed to fetch patient details:", error);
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  // Merge user details with patient details to get complete patient information
  const patient = useMemo(() => {
    if (!userDetails && !patientDetails) {
      console.log("No patient data available");
      return null;
    }

    console.log("User details:", userDetails);
    console.log("Patient details:", patientDetails);

    // Get name from user details (fullName or userName) or patient accountInfo
    const name =
      userDetails?.fullName ||
      userDetails?.userName ||
      patientDetails?.accountInfo?.username ||
      "Unknown";

    // Get date of birth from user details
    const dateOfBirth = userDetails?.dob
      ? new Date(userDetails.dob).toISOString()
      : patientDetails?.dateOfBirth || null;

    // Get gender from user details (boolean: true = Male, false = Female)
    const gender =
      userDetails?.gender !== undefined
        ? userDetails.gender
          ? "Male"
          : "Female"
        : patientDetails?.gender || null;

    // Get age from user details
    const age = userDetails?.age ?? null;

    // Merge all information
    const merged = {
      ...(patientDetails || {}),
      // Override with user details for name, dob, gender
      fullName: name,
      dateOfBirth: dateOfBirth,
      gender: gender,
      age: age,
      // Contact information from user or patient accountInfo
      phoneNumber:
        patientDetails?.accountInfo?.phone ||
        userDetails?.phone ||
        userDetails?.phoneNumber ||
        null,
      email: patientDetails?.accountInfo?.email || userDetails?.email || null,
      address:
        patientDetails?.accountInfo?.address || userDetails?.location || null,
    } as PatientDetailResponse & { age?: number | null };

    console.log("Merged patient:", merged);
    return merged;
  }, [userDetails, patientDetails]);

  const patientLoading = userLoading || detailsLoading;
  const patientFetching = userFetching || detailsFetching;

  // Store IUI/IVF treatments for display when no cycles are available
  const [iuiTreatmentsData, setIuiTreatmentsData] = useState<any[]>([]);
  const [ivfTreatmentsData, setIvfTreatmentsData] = useState<any[]>([]);

  const {
    data: treatmentCycles = [],
    isLoading: cyclesLoading,
    isFetching: cyclesFetching,
    isError: cyclesError,
    error: cyclesErrorData,
  } = useQuery<Array<TreatmentCycle & { treatment?: Treatment }>>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "patients", patientId, "cycles", "appointment-modal"],
    retry: false,
    queryFn: async () => {
      if (!patientId) {
        console.log("[AppointmentModal] No patientId, returning empty cycles");
        return [];
      }
      try {
        console.log(
          "[AppointmentModal] Fetching treatment cycles for patientId:",
          patientId,
          "doctorId:",
          doctorId
        );

        let cycles: TreatmentCycle[] = [];
        let treatmentsMap = new Map<string, Treatment>();

        // Strategy 1: Fetch IUI and IVF treatments directly by patientId using new APIs
        console.log(
          "[AppointmentModal] Fetching IUI and IVF treatments by patientId"
        );
        try {
          // Fetch IUI treatments
          const iuiResponse =
            await api.treatmentIUI.getIUIByPatientId(patientId);
          const iuiTreatments = Array.isArray(iuiResponse.data)
            ? iuiResponse.data
            : (iuiResponse as any).data?.data || [];

          // Store IUI treatments for later use
          setIuiTreatmentsData(iuiTreatments);

          console.log(
            "[AppointmentModal] IUI treatments raw:",
            iuiTreatments.length,
            iuiTreatments.map((t: any) => ({
              id: t.id,
              treatmentId: t.treatmentId,
              cycleStatus: t.cycleStatus,
              status: t.status,
            }))
          );

          // Fetch IVF treatments
          const ivfResponse =
            await api.treatmentIVF.getIVFByPatientId(patientId);
          const ivfTreatments = Array.isArray(ivfResponse.data)
            ? ivfResponse.data
            : (ivfResponse as any).data?.data || [];

          // Store IVF treatments for later use
          setIvfTreatmentsData(ivfTreatments);
          console.log(
            "[AppointmentModal] IVF treatments raw:",
            ivfTreatments.length,
            ivfTreatments.map((t: any) => ({
              id: t.id,
              treatmentId: t.treatmentId,
              cycleStatus: t.cycleStatus,
            }))
          );

          // Helper function to check if a GUID is empty/null
          const isEmptyGuid = (id: string | null | undefined): boolean => {
            if (!id) return true;
            return (
              id === "00000000-0000-0000-0000-000000000000" ||
              id === "" ||
              id.trim() === ""
            );
          };

          // Create a map of treatmentId -> Treatment for quick lookup
          // IMPORTANT: In the database schema, TreatmentIUIs.Id and TreatmentIVFs.Id
          // are foreign keys to Treatments.Id, so the IUI/IVF `id` IS the Treatment ID.
          // The `treatmentId` field in the API response may be empty/invalid.
          // We should use `id` as the primary source for Treatment ID.
          const allTreatmentIds = [
            ...iuiTreatments
              .map((t: any) => {
                // Use id first (it's the FK to Treatment), fallback to treatmentId if id is empty
                const treatmentId = !isEmptyGuid(t.id) ? t.id : t.treatmentId;
                return treatmentId;
              })
              .filter((id: any) => id && !isEmptyGuid(id)),
            ...ivfTreatments
              .map((t: any) => {
                // Use id first (it's the FK to Treatment), fallback to treatmentId if id is empty
                const treatmentId = !isEmptyGuid(t.id) ? t.id : t.treatmentId;
                return treatmentId;
              })
              .filter((id: any) => id && !isEmptyGuid(id)),
          ];

          console.log(
            "[AppointmentModal] All treatment IDs (filtered):",
            allTreatmentIds.length,
            allTreatmentIds
          );

          // Fetch base treatment details for each treatmentId
          const baseTreatments = await Promise.all(
            allTreatmentIds.map(async (treatmentId: string) => {
              if (isEmptyGuid(treatmentId)) {
                console.warn(
                  `[AppointmentModal] Skipping empty GUID: ${treatmentId}`
                );
                return null;
              }
              try {
                const treatmentResponse =
                  await api.treatment.getTreatmentById(treatmentId);
                console.log(
                  `[AppointmentModal] Successfully fetched base treatment ${treatmentId}:`,
                  {
                    id: treatmentResponse.data?.id,
                    treatmentType: treatmentResponse.data?.treatmentType,
                    patientId: treatmentResponse.data?.patientId,
                  }
                );
                return treatmentResponse.data;
              } catch (error) {
                console.error(
                  `[AppointmentModal] Failed to fetch base treatment ${treatmentId}:`,
                  error
                );
                return null;
              }
            })
          );

          // Map treatments
          baseTreatments.forEach((treatment) => {
            if (treatment?.id) {
              treatmentsMap.set(treatment.id, treatment);
            }
          });

          console.log(
            "[AppointmentModal] Treatments map:",
            treatmentsMap.size,
            Array.from(treatmentsMap.entries()).map(([id, t]) => ({
              id,
              treatmentType: t.treatmentType,
              patientId: t.patientId,
            }))
          );
        } catch (error) {
          console.error(
            "[AppointmentModal] Failed to fetch IUI/IVF treatments:",
            error
          );
        }

        // Strategy 2: Fetch treatment cycles
        if (doctorId) {
          console.log(
            "[AppointmentModal] Fetching cycles by doctorId and filtering by patientId"
          );
          const doctorResponse = await api.treatmentCycle.getTreatmentCycles({
            doctorId: doctorId,
            pageSize: 100, // Get more to filter client-side
          });
          const allDoctorCycles =
            (doctorResponse.data as TreatmentCycle[]) ?? [];
          console.log(
            "[AppointmentModal] All doctor cycles:",
            allDoctorCycles.length,
            allDoctorCycles.map((c) => ({
              id: c.id,
              patientId: c.patientId,
              treatmentId: c.treatmentId,
              status: c.status,
            }))
          );

          // Filter cycles by patientId (check both cycle.patientId and treatment.patientId)
          // First pass: filter cycles that we can immediately match
          const cyclesToCheck: Array<{
            cycle: TreatmentCycle;
            needsTreatmentFetch: boolean;
          }> = [];

          allDoctorCycles.forEach((cycle) => {
            const raw = cycle as unknown as Record<string, any>;
            const cyclePatientId =
              cycle.patientId ??
              raw.patientID ??
              raw.PatientId ??
              raw.PatientID ??
              null;

            // Check if cycle has matching patientId directly
            if (cyclePatientId === patientId) {
              console.log(
                `[AppointmentModal] Cycle ${cycle.id} matches by cycle.patientId: ${cyclePatientId} === ${patientId}`
              );
              cycles.push(cycle);
              return;
            }

            // Check if treatment (from map) has matching patientId
            if (cycle.treatmentId) {
              const treatment = treatmentsMap.get(cycle.treatmentId);
              if (treatment) {
                if (treatment.patientId === patientId) {
                  console.log(
                    `[AppointmentModal] Cycle ${cycle.id} matches by treatment.patientId from map: ${treatment.patientId} === ${patientId}`
                  );
                  cycles.push(cycle);
                  return;
                } else {
                  console.log(
                    `[AppointmentModal] Cycle ${cycle.id} treatment patientId mismatch: ${treatment.patientId} !== ${patientId}`
                  );
                }
              } else {
                // Treatment not in map, need to fetch it
                console.log(
                  `[AppointmentModal] Cycle ${cycle.id} treatment not found in map, will fetch: ${cycle.treatmentId}`
                );
                cyclesToCheck.push({
                  cycle,
                  needsTreatmentFetch: true,
                });
              }
            } else {
              console.log(
                `[AppointmentModal] Cycle ${cycle.id} has no treatmentId and cyclePatientId=${cyclePatientId} !== ${patientId}`
              );
            }
          });

          // Second pass: fetch treatments for cycles that weren't in the map
          if (cyclesToCheck.length > 0) {
            console.log(
              `[AppointmentModal] Fetching ${cyclesToCheck.length} treatments for cycles not in map`
            );
            const fetchedTreatments = await Promise.all(
              cyclesToCheck.map(async ({ cycle }) => {
                if (!cycle.treatmentId) return null;
                try {
                  const treatmentResponse =
                    await api.treatment.getTreatmentById(cycle.treatmentId);
                  const treatment = treatmentResponse.data;
                  console.log(
                    `[AppointmentModal] Fetched treatment ${cycle.treatmentId} for cycle ${cycle.id}:`,
                    {
                      treatmentId: treatment?.id,
                      treatmentType: treatment?.treatmentType,
                      patientId: treatment?.patientId,
                    }
                  );
                  return { cycle, treatment };
                } catch (error) {
                  console.error(
                    `[AppointmentModal] Failed to fetch treatment ${cycle.treatmentId} for cycle ${cycle.id}:`,
                    error
                  );
                  return null;
                }
              })
            );

            // Filter cycles based on fetched treatments
            fetchedTreatments.forEach((result) => {
              if (!result) return;
              const { cycle, treatment } = result;
              if (treatment?.patientId === patientId) {
                console.log(
                  `[AppointmentModal] Cycle ${cycle.id} matches by fetched treatment.patientId: ${treatment.patientId} === ${patientId}`
                );
                cycles.push(cycle);
                // Also add to treatmentsMap for later use
                if (treatment?.id) {
                  treatmentsMap.set(treatment.id, treatment);
                }
              } else {
                console.log(
                  `[AppointmentModal] Cycle ${cycle.id} fetched treatment patientId mismatch: ${treatment?.patientId} !== ${patientId}`
                );
              }
            });
          }

          console.log(
            "[AppointmentModal] Filtered cycles from doctorId query:",
            cycles.length,
            "out of",
            allDoctorCycles.length
          );
        }

        // Strategy 3: If no cycles found, try fetching by patientId only
        if (cycles.length === 0) {
          console.log(
            "[AppointmentModal] No cycles from doctorId query, trying patientId only"
          );
          const patientResponse = await api.treatmentCycle.getTreatmentCycles({
            patientId: patientId,
            pageSize: 25,
          });
          cycles = (patientResponse.data as TreatmentCycle[]) ?? [];
          console.log(
            "[AppointmentModal] Raw cycles from API (patientId only):",
            cycles.length,
            cycles
          );
        }

        // Map cycles with treatment data from treatmentsMap or fetch if needed
        const cyclesWithTreatment = await Promise.all(
          cycles.map(async (cycle) => {
            // First try to get treatment from map
            if (cycle.treatmentId && treatmentsMap.has(cycle.treatmentId)) {
              const treatment = treatmentsMap.get(cycle.treatmentId)!;
              console.log(
                `[AppointmentModal] Cycle ${cycle.id} using treatment from map:`,
                treatment.treatmentType
              );
              return {
                ...cycle,
                treatment,
              };
            }

            // If not in map, try to fetch it
            if (cycle.treatmentId) {
              try {
                const treatmentResponse = await api.treatment.getTreatmentById(
                  cycle.treatmentId
                );
                const cycleWithTreatment = {
                  ...cycle,
                  treatment: treatmentResponse.data,
                };
                console.log(
                  `[AppointmentModal] Cycle ${cycle.id} with fetched treatment:`,
                  {
                    cycleId: cycle.id,
                    status: cycle.status,
                    treatmentType: treatmentResponse.data?.treatmentType,
                  }
                );
                return cycleWithTreatment;
              } catch (error) {
                console.error(
                  `[AppointmentModal] Failed to fetch treatment for cycle ${cycle.id}:`,
                  error
                );
              }
            }

            return cycle;
          })
        );
        console.log(
          "[AppointmentModal] Final cycles with treatment:",
          cyclesWithTreatment.length,
          cyclesWithTreatment
        );
        return cyclesWithTreatment;
      } catch (error) {
        console.error(
          "[AppointmentModal] Failed to fetch treatment cycles:",
          error
        );
        if (isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

  const {
    data: patientAppointments = [],
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery<Appointment[]>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "appointments", "patient-history", patientId],
    retry: false,
    queryFn: async () => {
      if (!patientId) {
        return [];
      }
      const response = await api.appointment.getAppointments({
        patientId: patientId,
        pageSize: 25,
      });
      // Sort by appointmentDate descending
      const sorted = (response.data as Appointment[]) ?? [];
      return sorted.sort((a, b) => {
        const aDate = new Date(a.appointmentDate).getTime();
        const bDate = new Date(b.appointmentDate).getTime();
        return bDate - aDate;
      });
    },
  });

  // Helper function to map IUI cycleStatus to timeline phase
  const mapIUIStatusToPhase = (status: string): number => {
    const normalized = normalize(status);
    if (normalized.includes("planning") || normalized.includes("planned")) {
      return 0; // Baseline & planning
    }
    if (normalized.includes("monitoring")) {
      return 1; // Ovarian stimulation
    }
    if (normalized.includes("insemination")) {
      return 3; // Insemination procedure
    }
    if (normalized.includes("completed")) {
      return 5; // Outcome review
    }
    return 1; // Default to stimulation
  };

  // Helper function to map IVF cycleStatus to timeline phase
  const mapIVFStatusToPhase = (status: string): number => {
    const normalized = normalize(status);
    if (normalized.includes("planning") || normalized.includes("planned")) {
      return 0; // Baseline & planning
    }
    if (normalized.includes("stimulation") || normalized.includes("cos")) {
      return 1; // Ovarian stimulation
    }
    if (normalized.includes("retrieval") || normalized.includes("opu")) {
      return 2; // Oocyte retrieval
    }
    if (normalized.includes("fertilization")) {
      return 3; // Fertilization
    }
    if (normalized.includes("transfer") || normalized.includes("et")) {
      return 4; // Embryo transfer
    }
    if (normalized.includes("luteal") || normalized.includes("support")) {
      return 5; // Luteal support
    }
    if (normalized.includes("pregnancy") || normalized.includes("preg")) {
      return 6; // Pregnancy test
    }
    if (normalized.includes("completed")) {
      return 7; // Completed
    }
    return 1; // Default to stimulation
  };

  const {
    activeCycle,
    timelinePhases,
    activeTreatment,
  }: {
    activeCycle: (TreatmentCycle & { treatment?: Treatment }) | null;
    timelinePhases: TimelinePhase[];
    currentPhaseIndex: number;
    activeTreatment: {
      type: "IUI" | "IVF";
      data: any;
      treatment: Treatment | null;
    } | null;
  } = useMemo(() => {
    console.log(
      "[AppointmentModal] Computing activeCycle from cycles:",
      treatmentCycles.length,
      "IUI treatments:",
      iuiTreatmentsData.length,
      "IVF treatments:",
      ivfTreatmentsData.length
    );

    // If no cycles, try to use IUI/IVF treatments directly
    if (!treatmentCycles.length) {
      console.log(
        "[AppointmentModal] No treatment cycles available, checking IUI/IVF treatments"
      );

      // Find the most recent active IUI treatment
      const activeIUI = iuiTreatmentsData
        .filter((t: any) => {
          const status = normalize(t.status || t.cycleStatus);
          return !["completed", "cancelled"].includes(status);
        })
        .sort((a: any, b: any) => {
          const aDate = new Date(a.createdAt || 0).getTime();
          const bDate = new Date(b.createdAt || 0).getTime();
          return bDate - aDate;
        })[0];

      // Find the most recent active IVF treatment
      const activeIVF = ivfTreatmentsData
        .filter((t: any) => {
          const status = normalize(t.status || t.cycleStatus);
          return !["completed", "cancelled"].includes(status);
        })
        .sort((a: any, b: any) => {
          const aDate = new Date(a.createdAt || 0).getTime();
          const bDate = new Date(b.createdAt || 0).getTime();
          return bDate - aDate;
        })[0];

      // Prefer IUI over IVF if both exist
      const activeTreatmentData = activeIUI || activeIVF;
      const treatmentType = activeIUI ? "IUI" : activeIVF ? "IVF" : null;

      if (activeTreatmentData && treatmentType) {
        console.log(
          `[AppointmentModal] Found active ${treatmentType} treatment:`,
          activeTreatmentData.id,
          "status:",
          activeTreatmentData.status || activeTreatmentData.cycleStatus
        );

        // Fetch base treatment for this IUI/IVF treatment
        // IUI/IVF id is the treatment id, but we don't need to fetch it here
        const timeline = treatmentType === "IUI" ? IUI_TIMELINE : IVF_TIMELINE;
        const phaseIndex =
          treatmentType === "IUI"
            ? mapIUIStatusToPhase(
                activeTreatmentData.status ||
                  activeTreatmentData.cycleStatus ||
                  ""
              )
            : mapIVFStatusToPhase(
                activeTreatmentData.status ||
                  activeTreatmentData.cycleStatus ||
                  ""
              );

        return {
          activeCycle: null,
          timelinePhases: timeline,
          currentPhaseIndex: phaseIndex >= 0 ? phaseIndex : 0,
          activeTreatment: {
            type: treatmentType,
            data: activeTreatmentData,
            treatment: null, // Will be fetched separately if needed
          },
        };
      }

      console.log("[AppointmentModal] No active IUI/IVF treatments found");
      return {
        activeCycle: null,
        timelinePhases: [],
        currentPhaseIndex: -1,
        activeTreatment: null,
      };
    }

    const sortedCycles = [...treatmentCycles].sort((a, b) => {
      const aTime = new Date(a.startDate ?? "").getTime();
      const bTime = new Date(b.startDate ?? "").getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return (
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        );
      }
      return bTime - aTime;
    });

    console.log(
      "[AppointmentModal] Sorted cycles:",
      sortedCycles.map((c) => ({
        id: c.id,
        status: c.status,
        treatmentType: c.treatment?.treatmentType,
        treatmentId: c.treatmentId,
      }))
    );

    // First, try to find an active cycle (not completed/cancelled/failed) with IVF/IUI
    const activeCycleCandidate = sortedCycles.find((item) => {
      const type = (
        item as TreatmentCycle & { treatment?: Treatment }
      ).treatment?.treatmentType?.toUpperCase();

      // Check if it's IVF or IUI
      if (!type || (type !== "IVF" && type !== "IUI")) {
        console.log(
          `[AppointmentModal] Cycle ${item.id} skipped - type: ${type}`
        );
        return false;
      }

      const status = normalizeStatus(item.status);
      console.log(
        `[AppointmentModal] Cycle ${item.id} status: ${item.status} -> normalized: ${status}`
      );

      if (!status) {
        console.log(
          `[AppointmentModal] Cycle ${item.id} has no status, considering as active`
        );
        return true;
      }

      // Check if status indicates active/in-progress
      const isActive = !["completed", "cancelled", "failed", "closed"].includes(
        status
      );
      console.log(`[AppointmentModal] Cycle ${item.id} isActive: ${isActive}`);
      return isActive;
    });

    // If no active cycle found, try to find any IVF/IUI cycle
    const anyCycleCandidate = sortedCycles.find((item) => {
      const type = (
        item as TreatmentCycle & { treatment?: Treatment }
      ).treatment?.treatmentType?.toUpperCase();
      const hasValidType = type === "IVF" || type === "IUI";
      console.log(
        `[AppointmentModal] Cycle ${item.id} type check: ${type}, valid: ${hasValidType}`
      );
      return hasValidType;
    });

    const cycle = activeCycleCandidate ?? anyCycleCandidate ?? null;

    console.log(
      "[AppointmentModal] Selected cycle:",
      cycle
        ? {
            id: cycle.id,
            status: cycle.status,
            treatmentType: cycle.treatment?.treatmentType,
          }
        : null
    );

    const cycleWithTreatment = cycle as TreatmentCycle & {
      treatment?: Treatment;
    };
    const phases = resolveTimelinePhases(
      cycleWithTreatment,
      cycleWithTreatment?.treatment
    );
    const status = normalizeStatus(cycle?.status);
    const phaseIndex = phases.findIndex((phase) =>
      phase.matchStatuses.some(
        (value) => status.includes(value) || value.includes(status)
      )
    );

    console.log(
      "[AppointmentModal] Timeline phases:",
      phases.length,
      "Current phase index:",
      phaseIndex
    );

    return {
      activeCycle: cycle,
      timelinePhases: phases,
      currentPhaseIndex: phaseIndex,
      activeTreatment: null,
    };
  }, [treatmentCycles, iuiTreatmentsData, ivfTreatmentsData]);

  // Get cycle ID and treatment ID for fetching related data
  const cycleIdForDetails = useMemo(() => {
    return activeCycle?.id || activeTreatment?.data?.id || null;
  }, [activeCycle, activeTreatment]);

  const treatmentIdForDetails = useMemo(() => {
    return (
      activeCycle?.treatmentId || activeTreatment?.data?.treatmentId || null
    );
  }, [activeCycle, activeTreatment]);

  // Fetch appointments for the current cycle
  const { data: cycleAppointments } = useQuery({
    queryKey: ["appointments", "cycle", cycleIdForDetails],
    queryFn: async () => {
      if (!cycleIdForDetails) return [];
      try {
        const response =
          await api.treatmentCycle.getCycleAppointments(cycleIdForDetails);
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!cycleIdForDetails && isOpen,
  });

  // Fetch samples for the current cycle
  const { data: cycleSamples } = useQuery({
    queryKey: ["samples", "cycle", cycleIdForDetails],
    queryFn: async () => {
      if (!cycleIdForDetails) return [];
      try {
        const response =
          await api.treatmentCycle.getCycleSamples(cycleIdForDetails);
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!cycleIdForDetails && isOpen,
    retry: false,
  });

  // Fetch agreements for the current treatment
  const { data: treatmentAgreements } = useQuery({
    queryKey: ["agreements", "treatment", treatmentIdForDetails],
    queryFn: async () => {
      if (!treatmentIdForDetails) return [];
      try {
        const response = await api.agreement.getAgreements({
          TreatmentId: treatmentIdForDetails,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!treatmentIdForDetails && isOpen,
  });

  const appointmentHistory = useMemo(() => {
    if (!patientAppointments.length) {
      return [];
    }
    return patientAppointments
      .filter((item) => item.id !== appointmentId)
      .slice(0, 6);
  }, [patientAppointments, appointmentId]);

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case "scheduled":
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
      case "inprogress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
      case "no-show":
      case "noshow":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isLoading =
    appointmentLoading ||
    appointmentFetching ||
    patientLoading ||
    patientFetching;

  return (
    <Modal
      title="Appointment overview"
      description="Review schedule details, treatment context, and patient history."
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading appointment information...
        </div>
      ) : appointmentError ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Unable to load appointment details.</p>
          <p className="text-xs text-gray-500">
            {(appointmentErrorData as Error)?.message ??
              "An unexpected error occurred."}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : !appointment ? (
        <div className="space-y-4 py-6 text-center text-sm text-gray-500">
          <p>Appointment information is not available.</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("treatment")}
              className={cn(
                "flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === "treatment"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Treatment Details
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" ? (
            <div className="space-y-4">
              {/* Header Section with Patient Info */}
              <div className="rounded-lg border border-gray-300 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    {/* Patient Avatar */}
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl font-semibold text-gray-700">
                      {patient?.fullName?.charAt(0).toUpperCase() || "P"}
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient?.fullName ||
                            patient?.patientCode ||
                            patient?.id ||
                            "Patient"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {(patient?.patientCode || patient?.id) &&
                            `Patient ID: ${patient.patientCode || patient.id}`}
                          {patient?.gender && ` • ${patient.gender}`}
                          {patient?.bloodType &&
                            ` • Blood: ${patient.bloodType}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2.5 py-0.5 text-xs font-medium",
                            statusBadgeClass(normalize(appointment.status))
                          )}
                        >
                          {(appointment as any).statusName ||
                            appointment.status ||
                            "Pending"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="px-2.5 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {appointment.typeName ||
                            appointment.type ||
                            "Consultation"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Appointment ID
                    </p>
                    <p className="mt-0.5 text-base font-semibold text-gray-900">
                      {appointment.id || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Details Grid */}
              <div className="grid gap-3 md:grid-cols-2">
                {/* Date & Time Card */}
                <Card className="border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                        <svg
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500">
                          Date & Time
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatDate(
                            (appointment as any).appointmentDate ||
                              appointment.appointmentDate
                          )}
                        </p>
                        {appointment.slot && (
                          <p className="mt-0.5 text-xs text-gray-600">
                            {formatTime(appointment.slot.startTime)} -{" "}
                            {formatTime(appointment.slot.endTime)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info Card */}
                <Card className="border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                        <svg
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500">
                          Contact Information
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {patient?.accountInfo?.phone ||
                            patient?.phoneNumber ||
                            "No phone number"}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {patient?.accountInfo?.email ||
                            patient?.email ||
                            "No email address"}
                        </p>
                        {patient?.accountInfo?.isVerified && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                            <svg
                              className="h-3 w-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Verified
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Doctor Team Section */}
              {(appointment as any).doctors?.length > 0 && (
                <Card className="border-gray-300">
                  <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Medical Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {(appointment as any).doctors.map((doctor: any) => (
                        <div
                          key={doctor.id}
                          className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-200 text-sm font-semibold text-gray-700">
                            {doctor.fullName?.charAt(0).toUpperCase() || "D"}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {doctor.fullName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {doctor.specialty}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {doctor.badgeId}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="px-2 py-0.5 text-xs font-medium text-gray-700"
                          >
                            {doctor.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Appointment Notes */}
              {((appointment as any).reason ||
                (appointment as any).instructions ||
                appointment.notes) && (
                <Card className="border-gray-300">
                  <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      Clinical Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {(appointment as any).reason && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Reason for Visit
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {(appointment as any).reason}
                          </p>
                        </div>
                      )}
                      {(appointment as any).instructions && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Instructions
                          </p>
                          <p className="mt-1 text-sm text-gray-900">
                            {(appointment as any).instructions}
                          </p>
                        </div>
                      )}
                      {appointment.notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-500">
                            Additional Notes
                          </p>
                          <StructuredNote
                            note={appointment.notes}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Service Requests */}
              {(appointment as any).serviceRequests?.length > 0 && (
                <Card className="border-gray-300">
                  <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                      Service Requests (
                      {(appointment as any).serviceRequests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {(appointment as any).serviceRequests.map(
                        (request: any, index: number) => (
                          <div
                            key={index}
                            className="rounded border border-gray-200 bg-gray-50 p-3"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              Service Request #{index + 1}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              {JSON.stringify(request)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Treatment Timeline */}
              <Card className="border-gray-300">
                <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Treatment Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 text-sm text-gray-700">
                  {cyclesLoading || cyclesFetching ? (
                    <p className="text-sm text-gray-500">
                      Loading treatment cycles...
                    </p>
                  ) : !timelinePhases.length ||
                    (!activeCycle && !activeTreatment) ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="font-medium text-amber-900 mb-2">
                          No active treatment cycle
                        </p>
                        <p className="text-sm text-amber-800 mb-4">
                          Patient currently has no active IVF/IUI treatment
                          cycle.
                        </p>

                        {/* Treatment Cycles Summary */}
                        {treatmentCycles.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-amber-900 uppercase">
                              Treatment Cycles ({treatmentCycles.length})
                            </p>
                            <div className="space-y-2">
                              {treatmentCycles.slice(0, 3).map((cycle) => {
                                const cycleType =
                                  cycle.treatment?.treatmentType || "Unknown";
                                const normalizedStatus =
                                  normalizeTreatmentCycleStatus(cycle.status);
                                const status = normalizedStatus || "Unknown";
                                const statusLower = status.toLowerCase();
                                const startDate = cycle.startDate
                                  ? new Date(
                                      cycle.startDate
                                    ).toLocaleDateString()
                                  : "N/A";
                                return (
                                  <div
                                    key={cycle.id}
                                    className="rounded border border-amber-200 bg-white p-3 text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-900">
                                        {cycleType} Cycle
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-1 text-xs ${
                                          statusLower.includes("completed")
                                            ? "bg-green-100 text-green-700"
                                            : statusLower.includes("cancelled")
                                              ? "bg-red-100 text-red-700"
                                              : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {status}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-gray-600">
                                      Started: {startDate}
                                    </p>
                                    {cycle.treatment?.treatmentName && (
                                      <p className="mt-1 text-gray-600">
                                        {cycle.treatment.treatmentName}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                              {treatmentCycles.length > 3 && (
                                <p className="text-xs text-amber-700">
                                  + {treatmentCycles.length - 3} more cycle(s)
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* IUI/IVF Treatments Summary */}
                        {(iuiTreatmentsData.length > 0 ||
                          ivfTreatmentsData.length > 0) && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-amber-900 uppercase">
                              IUI/IVF Treatments
                            </p>
                            <div className="space-y-2">
                              {iuiTreatmentsData
                                .slice(0, 2)
                                .map((treatment: any) => {
                                  const status =
                                    treatment.status ||
                                    treatment.cycleStatus ||
                                    "Unknown";
                                  const createdAt = treatment.createdAt
                                    ? new Date(
                                        treatment.createdAt
                                      ).toLocaleDateString()
                                    : "N/A";
                                  return (
                                    <div
                                      key={treatment.id}
                                      className="rounded border border-amber-200 bg-white p-3 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900">
                                          IUI Treatment
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-1 text-xs ${
                                            status
                                              .toLowerCase()
                                              .includes("completed")
                                              ? "bg-green-100 text-green-700"
                                              : status
                                                    .toLowerCase()
                                                    .includes("cancelled")
                                                ? "bg-red-100 text-red-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {status}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-gray-600">
                                        Created: {createdAt}
                                      </p>
                                      {treatment.protocol && (
                                        <p className="mt-1 text-gray-600">
                                          Protocol: {treatment.protocol}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              {ivfTreatmentsData
                                .slice(0, 2)
                                .map((treatment: any) => {
                                  const status =
                                    treatment.status ||
                                    treatment.cycleStatus ||
                                    "Unknown";
                                  const createdAt = treatment.createdAt
                                    ? new Date(
                                        treatment.createdAt
                                      ).toLocaleDateString()
                                    : "N/A";
                                  return (
                                    <div
                                      key={treatment.id}
                                      className="rounded border border-amber-200 bg-white p-3 text-xs"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900">
                                          IVF Treatment
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-1 text-xs ${
                                            status
                                              .toLowerCase()
                                              .includes("completed")
                                              ? "bg-green-100 text-green-700"
                                              : status
                                                    .toLowerCase()
                                                    .includes("cancelled")
                                                ? "bg-red-100 text-red-700"
                                                : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {status}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-gray-600">
                                        Created: {createdAt}
                                      </p>
                                      {treatment.protocol && (
                                        <p className="mt-1 text-gray-600">
                                          Protocol: {treatment.protocol}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                            <p className="text-xs text-amber-700">
                              Total: {iuiTreatmentsData.length} IUI,{" "}
                              {ivfTreatmentsData.length} IVF
                            </p>
                          </div>
                        )}

                        {/* No treatments at all */}
                        {treatmentCycles.length === 0 &&
                          iuiTreatmentsData.length === 0 &&
                          ivfTreatmentsData.length === 0 && (
                            <p className="text-sm text-amber-700">
                              No treatment cycles or IUI/IVF treatments found
                              for this patient.
                            </p>
                          )}
                      </div>
                    </div>
                  ) : activeTreatment ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                          <p className="text-xs uppercase text-gray-500">
                            Current treatment
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {activeTreatment.type} Treatment
                          </p>
                          <p className="text-xs text-gray-500">
                            Status:{" "}
                            {normalizeTreatmentCycleStatus(
                              activeTreatment.data?.status ||
                                activeTreatment.data?.cycleStatus
                            ) || "In progress"}
                          </p>
                          {activeTreatment.data?.createdAt && (
                            <p className="text-xs text-gray-500">
                              Created:{" "}
                              {new Date(
                                activeTreatment.data.createdAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Use HorizontalTreatmentTimeline */}
                      {(() => {
                        // Create a cycle-like object from activeTreatment for the timeline
                        const treatmentType =
                          activeTreatment.type === "IUI" ? "IUI" : "IVF";
                        const cycleForTimeline: TreatmentCycle = {
                          id: activeTreatment.data?.id || "",
                          treatmentId: activeTreatment.data?.treatmentId || "",
                          cycleNumber: 1,
                          status: (activeTreatment.data?.status ||
                            activeTreatment.data?.cycleStatus ||
                            "Planned") as any,
                          treatmentType: treatmentType as "IUI" | "IVF",
                          startDate: activeTreatment.data?.startDate,
                          currentStep: activeTreatment.data?.currentStep,
                          completedSteps: activeTreatment.data?.completedSteps,
                        };

                        // Ensure treatmentType is set correctly
                        if (!cycleForTimeline.treatmentType) {
                          cycleForTimeline.treatmentType = treatmentType as
                            | "IUI"
                            | "IVF";
                        }

                        return (
                          <HorizontalTreatmentTimeline
                            cycle={cycleForTimeline}
                            allCycles={treatmentCycles}
                          />
                        );
                      })()}
                    </>
                  ) : activeCycle ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                          <p className="text-xs uppercase text-gray-500">
                            Current cycle
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {activeCycle.treatment?.treatmentType ||
                              "Treatment"}{" "}
                            —{" "}
                            {normalizeTreatmentCycleStatus(
                              activeCycle.status
                            ) || "In progress"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(activeCycle.startDate)} →{" "}
                            {formatDate(
                              activeCycle.actualEndDate ||
                                activeCycle.expectedEndDate
                            )}
                          </p>
                        </div>
                        {activeCycle.notes ? (
                          <StructuredNote
                            note={activeCycle.notes}
                            className="max-w-md rounded-md bg-blue-50 p-3 text-xs text-blue-700 [text-size:inherit]"
                          />
                        ) : null}
                      </div>

                      {/* Use HorizontalTreatmentTimeline */}
                      {(() => {
                        // Ensure treatmentType is set on the cycle
                        // Try multiple sources: cycle.treatmentType, cycle.treatment?.treatmentType
                        let treatmentType: "IUI" | "IVF" | undefined =
                          undefined;

                        // First, try cycle.treatmentType
                        if (
                          activeCycle.treatmentType === "IUI" ||
                          activeCycle.treatmentType === "IVF"
                        ) {
                          treatmentType = activeCycle.treatmentType;
                        }
                        // Then try cycle.treatment?.treatmentType
                        else if (activeCycle.treatment?.treatmentType) {
                          const type =
                            activeCycle.treatment.treatmentType.toUpperCase();
                          if (type === "IUI") treatmentType = "IUI";
                          else if (type === "IVF") treatmentType = "IVF";
                        }
                        // Finally, try to get from other cycles in the same treatment
                        else if (treatmentCycles.length > 0) {
                          const cycleWithType = treatmentCycles.find(
                            (c) =>
                              c.treatmentType === "IUI" ||
                              c.treatmentType === "IVF" ||
                              c.treatment?.treatmentType?.toUpperCase() ===
                                "IUI" ||
                              c.treatment?.treatmentType?.toUpperCase() ===
                                "IVF"
                          );
                          if (cycleWithType) {
                            if (
                              cycleWithType.treatmentType === "IUI" ||
                              cycleWithType.treatmentType === "IVF"
                            ) {
                              treatmentType = cycleWithType.treatmentType;
                            } else if (cycleWithType.treatment?.treatmentType) {
                              const type =
                                cycleWithType.treatment.treatmentType.toUpperCase();
                              if (type === "IUI") treatmentType = "IUI";
                              else if (type === "IVF") treatmentType = "IVF";
                            }
                          }
                        }

                        const cycleWithType: TreatmentCycle = {
                          ...activeCycle,
                          treatmentType: treatmentType,
                        };

                        return (
                          <HorizontalTreatmentTimeline
                            cycle={cycleWithType}
                            allCycles={treatmentCycles}
                          />
                        );
                      })()}
                    </>
                  ) : null}
                </CardContent>
              </Card>

              {/* Patient Basic Info */}
              <Card className="border-gray-300">
                <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Date of Birth
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patientError
                          ? "Unable to load"
                          : patient?.dateOfBirth
                            ? formatDate(patient.dateOfBirth)
                            : "Not provided"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Gender
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patientError
                          ? "Unable to load"
                          : patient?.gender || "Not reported"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Blood Type
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.bloodType || "Not recorded"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        National ID
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.nationalId || "—"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Occupation
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.occupation || "Not provided"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Insurance
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.insurance || "None"}
                      </p>
                    </div>
                  </div>
                  {patient?.address && (
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Address
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {patient.address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              {(patient?.emergencyContact || patient?.emergencyPhone) && (
                <Card className="border-gray-300">
                  <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {patient?.emergencyContact && (
                        <div className="rounded border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Contact Name
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {patient.emergencyContact}
                          </p>
                        </div>
                      )}
                      {patient?.emergencyPhone && (
                        <div className="rounded border border-gray-200 bg-gray-50 p-3">
                          <p className="text-xs font-medium text-gray-500">
                            Contact Phone
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {patient.emergencyPhone}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Medical Information */}
              <Card className="border-gray-300">
                <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Height
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.height
                          ? `${patient.height} cm`
                          : "Not recorded"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Weight
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.weight
                          ? `${patient.weight} kg`
                          : "Not recorded"}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">BMI</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {patient?.bmi
                          ? patient.bmi.toFixed(1)
                          : "Not calculated"}
                      </p>
                    </div>
                  </div>

                  {patient?.allergies && (
                    <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-medium text-red-700">
                        ⚠️ Allergies
                      </p>
                      <p className="mt-1 text-sm text-red-900">
                        {patient.allergies}
                      </p>
                    </div>
                  )}

                  {patient?.medicalHistory && (
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Medical History
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {patient.medicalHistory}
                      </p>
                    </div>
                  )}

                  {patient?.notes && (
                    <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-medium text-blue-700">
                        Patient Notes
                      </p>
                      <StructuredNote
                        note={patient.notes}
                        className="mt-1 text-blue-900"
                      />
                    </div>
                  )}

                  {(patient?.treatmentCount !== undefined ||
                    patient?.labSampleCount !== undefined) && (
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">
                          Total Treatments
                        </p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {patient?.treatmentCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">
                          Lab Samples
                        </p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {patient?.labSampleCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">
                          Relationships
                        </p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {patient?.relationshipCount ?? 0}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointment History */}
              <Card className="border-gray-300">
                <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Previous Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {historyLoading || historyFetching ? (
                    <div className="py-4 text-center">
                      <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                      <p className="mt-2 text-xs text-gray-500">
                        Loading history...
                      </p>
                    </div>
                  ) : appointmentHistory.length ? (
                    <div className="space-y-2">
                      {appointmentHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-2.5"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.appointmentCode ||
                                item.appointmentType ||
                                "Appointment"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(item.appointmentDate)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium",
                              statusBadgeClass(normalize(item.status))
                            )}
                          >
                            {item.status || "pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <svg
                        className="mx-auto h-10 w-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-2 text-xs text-gray-500">
                        No previous appointments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <Button variant="outline" onClick={onClose} className="px-5">
                  Close
                </Button>
                <Button className="bg-primary px-5 text-white hover:bg-primary/90">
                  Edit Appointment
                </Button>
              </div>

              {patientError && (
                <div className="rounded border border-red-300 bg-red-50 p-3">
                  <p className="text-xs text-red-700">
                    Unable to load some patient information:{" "}
                    {(patientErrorData as Error)?.message || "Unknown error"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Treatment Details Tab */}
              {!patientId ? (
                <Card className="border-gray-300">
                  <CardContent className="p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Patient ID not available
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Unable to load treatment information. Patient ID could not
                      be determined from the appointment.
                    </p>
                  </CardContent>
                </Card>
              ) : cyclesLoading || cyclesFetching ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading treatment information...
                </div>
              ) : cyclesError ? (
                <Card className="border-gray-300">
                  <CardContent className="p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      Error loading treatment cycles
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {(cyclesErrorData as Error)?.message ||
                        "Failed to load treatment information. Please try again."}
                    </p>
                  </CardContent>
                </Card>
              ) : !activeCycle && !activeTreatment ? (
                <Card className="border-gray-300">
                  <CardContent className="p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-4 text-sm font-medium text-gray-900">
                      No active treatment cycle
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Patient currently has no active IVF/IUI treatment cycle.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Active Cycle/Treatment Overview */}
                  <Card className="border-gray-300">
                    <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <svg
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {activeCycle
                          ? "Current Treatment Cycle"
                          : "Current Treatment"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500">
                              Treatment Type
                            </p>
                            <p className="mt-1 text-base font-semibold text-gray-900">
                              {activeCycle?.treatment?.treatmentType ||
                                activeTreatment?.type ||
                                "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">
                              Status
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-1 px-2.5 py-0.5 text-xs font-medium",
                                statusBadgeClass(
                                  normalize(
                                    activeCycle?.status ||
                                      activeTreatment?.data?.status ||
                                      activeTreatment?.data?.cycleStatus ||
                                      ""
                                  )
                                )
                              )}
                            >
                              {activeCycle?.status ||
                                activeTreatment?.data?.status ||
                                activeTreatment?.data?.cycleStatus ||
                                "—"}
                            </Badge>
                          </div>
                          {activeCycle && (
                            <>
                              <div>
                                <p className="text-xs font-medium text-gray-500">
                                  Cycle Code
                                </p>
                                <p className="mt-1 text-sm font-medium text-gray-900">
                                  {activeCycle.id || "—"}
                                </p>
                              </div>
                              {activeCycle.cycleNumber && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Cycle Number
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-gray-900">
                                    {activeCycle.cycleNumber}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          {activeTreatment && (
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Treatment ID
                              </p>
                              <p className="mt-1 text-sm font-medium text-gray-900">
                                {activeTreatment.data.id || "—"}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {activeCycle ? (
                            <>
                              <div>
                                <p className="text-xs font-medium text-gray-500">
                                  Start Date
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {formatDate(activeCycle.startDate)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500">
                                  Expected End Date
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {formatDate(
                                    activeCycle.expectedEndDate ||
                                      activeCycle.actualEndDate
                                  )}
                                </p>
                              </div>
                              {activeCycle.actualEndDate && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Actual End Date
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {formatDate(activeCycle.actualEndDate)}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : activeTreatment ? (
                            <>
                              {activeTreatment.data.createdAt && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Created Date
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {formatDate(activeTreatment.data.createdAt)}
                                  </p>
                                </div>
                              )}
                              {activeTreatment.data.inseminationDate && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Insemination Date
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {formatDate(
                                      activeTreatment.data.inseminationDate
                                    )}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>
                      {(activeCycle?.notes || activeTreatment?.data?.notes) && (
                        <div className="mt-4 rounded-md bg-blue-50 p-3">
                          <p className="text-xs font-medium text-blue-700">
                            Notes
                          </p>
                          <StructuredNote
                            note={
                              activeCycle?.notes || activeTreatment?.data?.notes
                            }
                            className="mt-1 text-blue-900"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Treatment Progress Timeline */}
                  <Card className="border-gray-300">
                    <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <svg
                          className="h-4 w-4 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Treatment Progress Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {(() => {
                        // Create cycle object for timeline
                        let cycleForTimeline: TreatmentCycle | null = null;

                        if (activeCycle) {
                          // Ensure treatmentType is set on the cycle
                          let treatmentType: "IUI" | "IVF" | undefined =
                            undefined;

                          if (
                            activeCycle.treatmentType === "IUI" ||
                            activeCycle.treatmentType === "IVF"
                          ) {
                            treatmentType = activeCycle.treatmentType;
                          } else if (activeCycle.treatment?.treatmentType) {
                            const type =
                              activeCycle.treatment.treatmentType.toUpperCase();
                            if (type === "IUI") treatmentType = "IUI";
                            else if (type === "IVF") treatmentType = "IVF";
                          } else if (treatmentCycles.length > 0) {
                            const cycleWithType = treatmentCycles.find(
                              (c) =>
                                c.treatmentType === "IUI" ||
                                c.treatmentType === "IVF" ||
                                c.treatment?.treatmentType?.toUpperCase() ===
                                  "IUI" ||
                                c.treatment?.treatmentType?.toUpperCase() ===
                                  "IVF"
                            );
                            if (cycleWithType) {
                              if (
                                cycleWithType.treatmentType === "IUI" ||
                                cycleWithType.treatmentType === "IVF"
                              ) {
                                treatmentType = cycleWithType.treatmentType;
                              } else if (
                                cycleWithType.treatment?.treatmentType
                              ) {
                                const type =
                                  cycleWithType.treatment.treatmentType.toUpperCase();
                                if (type === "IUI") treatmentType = "IUI";
                                else if (type === "IVF") treatmentType = "IVF";
                              }
                            }
                          }

                          cycleForTimeline = {
                            ...activeCycle,
                            treatmentType: treatmentType,
                          };
                        } else if (activeTreatment) {
                          const treatmentType =
                            activeTreatment.type === "IUI" ? "IUI" : "IVF";
                          cycleForTimeline = {
                            id: activeTreatment.data?.id || "",
                            treatmentId:
                              activeTreatment.data?.treatmentId || "",
                            cycleNumber: 1,
                            status: (activeTreatment.data?.status ||
                              activeTreatment.data?.cycleStatus ||
                              "Planned") as any,
                            treatmentType: treatmentType as "IUI" | "IVF",
                            startDate: activeTreatment.data?.startDate,
                            currentStep: activeTreatment.data?.currentStep,
                            completedSteps:
                              activeTreatment.data?.completedSteps,
                          };
                        }

                        if (!cycleForTimeline) {
                          return (
                            <p className="text-sm text-gray-500">
                              No treatment cycle information available.
                            </p>
                          );
                        }

                        return (
                          <HorizontalTreatmentTimeline
                            cycle={cycleForTimeline}
                            allCycles={treatmentCycles}
                          />
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Current Step Information */}
                  {(() => {
                    const currentCycle =
                      activeCycle ||
                      (activeTreatment
                        ? {
                            id: "",
                            treatmentId: "",
                            cycleNumber: 0,
                            status: "Planned" as TreatmentCycleStatus,
                            treatmentType:
                              activeTreatment.type === "IUI" ? "IUI" : "IVF",
                            currentStep: activeTreatment.data?.currentStep,
                            completedSteps:
                              activeTreatment.data?.completedSteps,
                          }
                        : null);

                    if (!currentCycle || !currentCycle.currentStep) return null;

                    return (
                      <Card className="border-gray-300">
                        <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <svg
                              className="h-4 w-4 text-gray-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Current Step Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-gray-500">
                                Current Step
                              </p>
                              <p className="mt-1 text-base font-semibold text-gray-900">
                                {currentCycle.currentStep}
                              </p>
                            </div>
                            {currentCycle.completedSteps &&
                              currentCycle.completedSteps.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">
                                    Completed Steps
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {currentCycle.completedSteps.map(
                                      (step: string, idx: number) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="bg-green-50 text-green-700 border-green-200"
                                        >
                                          {step}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}

                  {/* Cycle Statistics */}
                  {cycleIdForDetails || treatmentIdForDetails ? (
                    <Card className="border-gray-300">
                      <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <svg
                            className="h-4 w-4 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Related Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <div className="text-xs font-medium text-gray-500">
                              Appointments
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900">
                              {cycleAppointments?.length || 0}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <div className="text-xs font-medium text-gray-500">
                              Lab Samples
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900">
                              {cycleSamples?.length || 0}
                            </div>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <div className="text-xs font-medium text-gray-500">
                              Agreements
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900">
                              {treatmentAgreements?.length || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Treatment Information */}
                  {activeCycle?.treatment && (
                    <Card className="border-gray-300">
                      <CardHeader className="border-b border-gray-200 bg-white px-4 py-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <svg
                            className="h-4 w-4 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Treatment Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500">
                              Treatment Code
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {activeCycle.treatment.treatmentCode ||
                                activeCycle.treatmentId ||
                                "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">
                              Treatment Start Date
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {formatDate(activeCycle.treatment.startDate)}
                            </p>
                          </div>
                          {activeCycle.treatment.notes && (
                            <div className="md:col-span-2">
                              <p className="text-xs font-medium text-gray-500">
                                Treatment Notes
                              </p>
                              <StructuredNote
                                note={activeCycle.treatment.notes}
                                className="mt-1 text-gray-900"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <Button variant="outline" onClick={onClose} className="px-5">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
