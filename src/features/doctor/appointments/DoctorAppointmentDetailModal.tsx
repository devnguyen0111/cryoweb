import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import type {
  Appointment,
  AppointmentExtendedDetailResponse,
  PatientDetailResponse,
  TreatmentCycle,
  Treatment,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

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
    description: "ICSI/IVF procedure, fertilisation check, embryo culture.",
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
  const patientId =
    propPatientId || appointment?.patientId || appointment?.patient?.id;

  console.log("PatientId sources:", {
    propPatientId,
    appointmentPatientId: appointment?.patientId,
    appointmentPatient: appointment?.patient,
    finalPatientId: patientId,
  });

  // Fetch basic patient info (has fullName, dob, gender)
  const {
    data: basicPatient,
    isLoading: basicPatientLoading,
    isFetching: basicPatientFetching,
  } = useQuery({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "patients", patientId, "basic"],
    retry: false,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientById(patientId);
        return response.data ?? null;
      } catch (error) {
        console.error("Failed to fetch basic patient:", error);
        return null;
      }
    },
  });

  // Fetch detailed patient info (has emergency contact, treatments, etc)
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

  // Merge basic patient info with detailed info
  const patient = useMemo(() => {
    if (!basicPatient && !patientDetails) {
      console.log("No patient data available");
      return null;
    }

    console.log("Basic patient:", basicPatient);
    console.log("Patient details:", patientDetails);

    // Merge: basic patient has fullName, dob, gender; details has additional info
    const merged = {
      ...(basicPatient || {}),
      ...(patientDetails || {}),
      // Ensure critical fields from basic patient are preserved
      fullName: basicPatient?.fullName || patientDetails?.fullName,
      dateOfBirth: basicPatient?.dateOfBirth || patientDetails?.dateOfBirth,
      gender: basicPatient?.gender || patientDetails?.gender,
      phoneNumber:
        basicPatient?.phoneNumber || patientDetails?.accountInfo?.phone,
      email: basicPatient?.email || patientDetails?.accountInfo?.email,
      address: basicPatient?.address || patientDetails?.accountInfo?.address,
    } as PatientDetailResponse;

    console.log("Merged patient:", merged);
    return merged;
  }, [basicPatient, patientDetails]);

  const patientLoading = basicPatientLoading || detailsLoading;
  const patientFetching = basicPatientFetching || detailsFetching;

  const {
    data: treatmentCycles = [],
    isLoading: cyclesLoading,
    isFetching: cyclesFetching,
  } = useQuery<Array<TreatmentCycle & { treatment?: Treatment }>>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "patients", patientId, "cycles", "appointment-modal"],
    retry: false,
    queryFn: async () => {
      if (!patientId) {
        return [];
      }
      const response = await api.treatmentCycle.getTreatmentCycles({
        patientId: patientId,
        pageSize: 25,
      });
      const cycles = (response.data as TreatmentCycle[]) ?? [];
      // Fetch treatment details for each cycle to get treatmentType
      const cyclesWithTreatment = await Promise.all(
        cycles.map(async (cycle) => {
          if (!cycle.treatmentId) return cycle;
          try {
            const treatmentResponse = await api.treatment.getTreatmentById(
              cycle.treatmentId
            );
            return { ...cycle, treatment: treatmentResponse.data };
          } catch {
            return cycle;
          }
        })
      );
      return cyclesWithTreatment;
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

  const {
    activeCycle,
    timelinePhases,
    currentPhaseIndex,
  }: {
    activeCycle: (TreatmentCycle & { treatment?: Treatment }) | null;
    timelinePhases: TimelinePhase[];
    currentPhaseIndex: number;
  } = useMemo(() => {
    if (!treatmentCycles.length) {
      return {
        activeCycle: null,
        timelinePhases: [],
        currentPhaseIndex: -1,
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

    const cycle =
      sortedCycles.find((item) => {
        const type = (
          item as TreatmentCycle & { treatment?: Treatment }
        ).treatment?.treatmentType?.toUpperCase();
        if (!type || (type !== "IVF" && type !== "IUI")) {
          return false;
        }
        const status = normalize(item.status);
        if (!status) {
          return true;
        }
        return !["completed", "cancelled", "failed"].includes(status);
      }) ??
      sortedCycles.find((item) => {
        const type = (
          item as TreatmentCycle & { treatment?: Treatment }
        ).treatment?.treatmentType?.toUpperCase();
        return type === "IVF" || type === "IUI";
      }) ??
      null;

    const cycleWithTreatment = cycle as TreatmentCycle & {
      treatment?: Treatment;
    };
    const phases = resolveTimelinePhases(
      cycleWithTreatment,
      cycleWithTreatment?.treatment
    );
    const status = normalize(cycle?.status);
    const phaseIndex = phases.findIndex((phase) =>
      phase.matchStatuses.some(
        (value) => status.includes(value) || value.includes(status)
      )
    );

    return {
      activeCycle: cycle,
      timelinePhases: phases,
      currentPhaseIndex: phaseIndex,
    };
  }, [treatmentCycles]);

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
                      {patient?.fullName || patient?.patientCode || "Patient"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {patient?.patientCode &&
                        `Patient ID: ${patient.patientCode}`}
                      {patient?.gender && ` • ${patient.gender}`}
                      {patient?.bloodType && ` • Blood: ${patient.bloodType}`}
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
                      <p className="mt-1 text-sm text-gray-900">
                        {appointment.notes}
                      </p>
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
              ) : !timelinePhases.length || !activeCycle ? (
                <p className="text-sm text-gray-500">
                  No active IVF/IUI treatment cycle is currently linked to this
                  patient.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">
                        Current cycle
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {activeCycle.treatment?.treatmentType || "Treatment"} —{" "}
                        {activeCycle.status || "In progress"}
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
                      <p className="max-w-md rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                        {activeCycle.notes}
                      </p>
                    ) : null}
                  </div>

                  <ol className="space-y-3">
                    {timelinePhases.map((phase, index) => {
                      const isReached =
                        currentPhaseIndex === -1
                          ? index === 0
                          : index <= currentPhaseIndex;
                      return (
                        <li
                          key={phase.label}
                          className={cn(
                            "rounded-lg border p-4 transition",
                            isReached
                              ? "border-primary bg-primary/5"
                              : "border-gray-200"
                          )}
                        >
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-base font-semibold text-gray-900">
                              {phase.label}
                            </p>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                isReached
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {isReached ? "Reached" : "Pending"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {phase.description}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
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
                  <p className="text-xs font-medium text-gray-500">Gender</p>
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
                  <p className="text-xs font-medium text-gray-500">Insurance</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {patient?.insurance || "None"}
                  </p>
                </div>
              </div>
              {patient?.address && (
                <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Address</p>
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
                  <p className="text-xs font-medium text-gray-500">Height</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {patient?.height ? `${patient.height} cm` : "Not recorded"}
                  </p>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">Weight</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {patient?.weight ? `${patient.weight} kg` : "Not recorded"}
                  </p>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">BMI</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {patient?.bmi ? patient.bmi.toFixed(1) : "Not calculated"}
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
                  <p className="mt-1 text-sm text-blue-900">{patient.notes}</p>
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
      )}
    </Modal>
  );
}
