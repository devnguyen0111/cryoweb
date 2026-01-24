import { useState, useMemo, useCallback } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { HorizontalTreatmentTimeline } from "./HorizontalTreatmentTimeline";
import { CreateServiceRequestForCycleModal } from "./CreateServiceRequestForCycleModal";
import { DoctorCreateAppointmentForm } from "@/features/doctor/appointments/DoctorCreateAppointmentForm";
import { FertilizationModal } from "@/features/doctor/fertilization/FertilizationModal";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import {
  normalizeTreatmentCycleStatus,
  type TreatmentCycle,
  type IVFStep,
  type IUIStep,
  type CreateMedicalRecordRequest,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";
import { getServiceRequestStatusBadgeClass } from "@/utils/status-colors";
import { formatCurrency as formatCurrencyUtil } from "@/utils/format";

interface CycleUpdateFormProps {
  cycle: TreatmentCycle;
  onStepAdvanced?: () => void;
}

// IVF Steps (6 steps matching backend TreatmentStepType enum)
const IVF_STEPS: IVFStep[] = [
  "step0_pre_cycle_prep", // Initial Medical Examination
  "step1_stimulation", // Ovarian Stimulation
  "step4_opu", // Oocyte Retrieval and Sperm Collection
  "step5_fertilization", // In Vitro Fertilization
  "step7_embryo_transfer", // Embryo Transfer
  "step6_beta_hcg", // Post-Transfer Follow-Up
];

// IUI Steps (4 steps matching backend TreatmentStepType enum)
const IUI_STEPS: IUIStep[] = [
  "step0_pre_cycle_prep", // Initial Medical Examination
  "step2_follicle_monitoring", // Ovarian Stimulation
  "step4_iui_procedure", // Sperm Collection and Intrauterine Insemination
  "step5_post_iui", // Post-Insemination Follow-Up
];

type MedicalRecordFormData = {
  chiefComplaint: string;
  history: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpInstructions: string;
  vitalSigns: string;
  labResults: string;
  imagingResults: string;
  notes: string;
};

export function CycleUpdateForm({
  cycle,
  onStepAdvanced,
}: CycleUpdateFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: doctorProfile } = useDoctorProfile();
  const doctorId = user?.id ?? null;

  // Log cycle information when component mounts or cycle changes
  console.log(`[CycleUpdateForm] Component rendered with cycle:`, {
    cycleId: cycle.id,
    cycleNumber: cycle.cycleNumber,
    cycleName: cycle.cycleName,
    currentStep: cycle.currentStep,
    status: cycle.status,
  });
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string>("");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [completeOutcome, setCompleteOutcome] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] =
    useState(false);
  const [showFertilizationModal, setShowFertilizationModal] = useState(false);

  // Fetch cycle details to ensure we have latest data
  const { data: cycleDetails } = useQuery({
    queryKey: ["doctor", "treatment-cycle", cycle.id],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycle.id);
      return response.data;
    },
    enabled: !!cycle.id,
  });

  // Use cycleDetails if available, otherwise use cycle prop
  const rawCurrentCycle = cycleDetails || cycle;

  // Fetch treatment to ensure we have treatmentType
  const { data: treatmentData } = useQuery({
    queryKey: ["treatment", rawCurrentCycle.treatmentId],
    queryFn: async () => {
      if (!rawCurrentCycle.treatmentId) return null;
      try {
        const response = await api.treatment.getTreatmentById(
          rawCurrentCycle.treatmentId
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!rawCurrentCycle.treatmentId,
  });

  // Fetch current step from backend API (most accurate source) - same as HorizontalTreatmentTimeline
  const normalizedTreatmentType = useMemo(() => {
    const type = rawCurrentCycle.treatmentType;
    if (!type) return null;
    const typeUpper = String(type).toUpperCase();
    if (typeUpper === "IVF") return "IVF";
    if (typeUpper === "IUI") return "IUI";
    return null;
  }, [rawCurrentCycle.treatmentType]);

  const { data: currentStepFromApi } = useQuery({
    queryKey: [
      "treatment-current-step",
      rawCurrentCycle.treatmentId,
      normalizedTreatmentType,
    ],
    queryFn: async () => {
      if (!rawCurrentCycle.treatmentId || !normalizedTreatmentType) return null;
      try {
        if (normalizedTreatmentType === "IUI") {
          const response = await api.treatmentIUI.getCurrentStep(
            rawCurrentCycle.treatmentId
          );
          return response.data ?? null;
        } else if (normalizedTreatmentType === "IVF") {
          const response = await api.treatmentIVF.getCurrentStep(
            rawCurrentCycle.treatmentId
          );
          return response.data ?? null;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!rawCurrentCycle.treatmentId && !!normalizedTreatmentType,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch all cycles for this treatment to show progress (needed for treatmentType inference)
  const { data: allCyclesDataForType } = useQuery({
    queryKey: ["treatment-cycles", "treatment", rawCurrentCycle.treatmentId],
    queryFn: async () => {
      if (!rawCurrentCycle.treatmentId) return [];
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: rawCurrentCycle.treatmentId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!rawCurrentCycle.treatmentId,
  });

  // Helper: Get active cycle from all cycles
  // Active cycle = cycle with LOWEST cycleNumber that is not Completed/Cancelled/Failed
  // This ensures we always work on cycles in order (1 → 2 → 3 → ...), regardless of status
  const getActiveCycle = (cycles: TreatmentCycle[]): TreatmentCycle | null => {
    if (!cycles || cycles.length === 0) return null;

    // Find all cycles that are not Completed, Cancelled, or Failed
    // Sort by cycleNumber (ascending) and return the first one
    const activeCycles = cycles
      .filter((c) => {
        const status = normalizeTreatmentCycleStatus(c.status);
        return (
          status !== "Completed" &&
          status !== "Cancelled" &&
          status !== "Failed"
        );
      })
      .sort((a, b) => a.cycleNumber - b.cycleNumber);

    return activeCycles[0] || null;
  };

  // Helper function to infer treatmentType for a cycle
  const inferTreatmentType = useCallback(
    (cycle: TreatmentCycle): "IUI" | "IVF" | undefined => {
      // First, try cycle.treatmentType
      if (cycle.treatmentType === "IUI" || cycle.treatmentType === "IVF") {
        return cycle.treatmentType;
      }
      // Then try treatmentData?.treatmentType
      if (treatmentData?.treatmentType) {
        const type = String(treatmentData.treatmentType).toUpperCase();
        if (type === "IUI") return "IUI";
        if (type === "IVF") return "IVF";
      }
      // Try to infer from cycleName if available
      if (cycle.cycleName) {
        const cycleNameUpper = cycle.cycleName.toUpperCase();
        if (cycleNameUpper.includes("IVF")) {
          return "IVF";
        } else if (cycleNameUpper.includes("IUI")) {
          return "IUI";
        }
      }
      return undefined;
    },
    [treatmentData]
  );

  // Ensure currentCycle has treatmentType
  const currentCycle = useMemo(() => {
    let treatmentType = inferTreatmentType(rawCurrentCycle);

    // Try to infer from allCyclesData if still not found
    if (
      !treatmentType &&
      allCyclesDataForType &&
      allCyclesDataForType.length > 0
    ) {
      const cycleWithType = allCyclesDataForType.find(
        (c) => c.treatmentType === "IUI" || c.treatmentType === "IVF"
      );
      if (cycleWithType) {
        if (
          cycleWithType.treatmentType === "IUI" ||
          cycleWithType.treatmentType === "IVF"
        ) {
          treatmentType = cycleWithType.treatmentType;
        }
      }
    }

    return {
      ...rawCurrentCycle,
      treatmentType: treatmentType,
    };
  }, [
    rawCurrentCycle,
    treatmentData,
    allCyclesDataForType,
    inferTreatmentType,
  ]);

  const form = useForm<MedicalRecordFormData>({
    defaultValues: {
      chiefComplaint: "",
      history: "",
      physicalExamination: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpInstructions: "",
      vitalSigns: "",
      labResults: "",
      imagingResults: "",
      notes: "",
    },
  });

  // Fetch appointments for this cycle (for statistics)
  const { data: cycleAppointmentsData } = useQuery({
    queryKey: ["cycle-appointments", currentCycle.id],
    queryFn: async () => {
      if (!currentCycle.id) return [];
      try {
        const response = await api.treatmentCycle.getCycleAppointments(
          currentCycle.id
        );
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentCycle.id,
  });

  // Fetch appointments for this patient (to allow selecting any appointment for medical record)
  // This is separate from cycle appointments for the form dropdown
  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments", "patient", currentCycle.patientId],
    queryFn: async () => {
      if (!currentCycle.patientId) return [];
      try {
        const response = await api.appointment.getAppointments({
          patientId: currentCycle.patientId,
          pageNumber: 1,
          pageSize: 100,
        });
        const appointments = response.data || [];
        // Filter appointments to ensure they belong to this specific patient
        const filteredAppointments = appointments.filter((apt) => {
          const aptPatientId =
            apt.patientId ||
            (apt as any).patientID ||
            (apt as any).PatientId ||
            (apt as any).PatientID ||
            (apt as any).patient?.id ||
            (apt as any).patient?.patientId ||
            (apt as any).patientAccountId ||
            (apt as any).patientAccountID;
          return aptPatientId === currentCycle.patientId;
        });
        // Sort by date (newest first)
        return filteredAppointments.sort((a, b) => {
          const aDate = new Date(a.appointmentDate || "").getTime();
          const bDate = new Date(b.appointmentDate || "").getTime();
          return bDate - aDate;
        });
      } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
    },
    enabled: !!currentCycle.patientId,
  });

  // Fetch lab samples for this cycle using API
  // Handle 500 errors gracefully - API might not be available
  const { data: samplesData } = useQuery({
    queryKey: ["samples", "cycle", currentCycle.id],
    queryFn: async () => {
      try {
        const response = await api.treatmentCycle.getCycleSamples(
          currentCycle.id
        );
        return response.data || [];
      } catch (error: any) {
        // If 500 error, API might not be implemented yet - return empty array
        if (error?.response?.status === 500) {
          console.warn(
            `[CycleUpdateForm] Samples API returned 500 for cycle ${currentCycle.id}`
          );
          return [];
        }
        return [];
      }
    },
    enabled: !!currentCycle.id,
    retry: false, // Don't retry on 500 errors
  });

  // Fetch agreements for this treatment
  const { data: agreementsData } = useQuery({
    queryKey: ["agreements", "treatment", currentCycle.treatmentId],
    queryFn: async () => {
      if (!currentCycle.treatmentId) return [];
      try {
        const response = await api.agreement.getAgreements({
          TreatmentId: currentCycle.treatmentId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentCycle.treatmentId,
  });

  // Fetch service requests for this treatment/cycle
  // Filter to only show service requests related to this treatment cycle
  const { data: serviceRequestsData } = useQuery({
    queryKey: [
      "service-requests",
      "treatment",
      currentCycle.treatmentId,
      currentCycle.id,
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return [];
      try {
        // Fetch all service requests for this patient
        const response = await api.serviceRequest.getServiceRequests({
          patientId: currentCycle.patientId,
          pageNumber: 1,
          pageSize: 100,
        });
        const allRequests = response.data || [];

        // Filter service requests that belong to this treatment cycle
        // Service requests created from cycle have notes like:
        // "Service request for treatment cycle: {cycleName}" or "Service request for treatment cycle: {cycleId}"
        const cycleName = currentCycle.cycleName || "";
        const cycleId = currentCycle.id;

        // Use cycle appointments to filter by appointmentId
        const cycleAppointmentIds =
          cycleAppointmentsData?.map((apt) => apt.id) || [];

        // Filter service requests that match this cycle
        const filteredRequests = allRequests.filter((request) => {
          // Check if notes contain cycle name or cycle ID
          const notes = request.notes || "";
          const hasCycleNameInNotes =
            cycleName && notes.toLowerCase().includes(cycleName.toLowerCase());
          const hasCycleIdInNotes = cycleId && notes.includes(cycleId);

          // Check if appointmentId matches any appointment in this cycle
          const hasMatchingAppointment =
            request.appointmentId &&
            cycleAppointmentIds.includes(request.appointmentId);

          // Include if any condition matches
          return (
            hasCycleNameInNotes || hasCycleIdInNotes || hasMatchingAppointment
          );
        });

        return filteredRequests;
      } catch {
        return [];
      }
    },
    enabled:
      !!currentCycle.patientId &&
      !!currentCycle.id &&
      cycleAppointmentsData !== undefined,
  });

  // Fetch medical records for this patient and filter by cycle appointments
  const { data: medicalRecordsData } = useQuery({
    queryKey: [
      "medical-records",
      "patient",
      currentCycle.patientId,
      "cycle",
      currentCycle.id,
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return [];
      try {
        // Fetch all medical records for this patient
        const response = await api.medicalRecord.getMedicalRecords({
          PatientId: currentCycle.patientId,
          Page: 1,
          Size: 100,
        });
        const allRecords = response.data || [];

        // Use cycle appointments to filter medical records
        const cycleAppointmentIds =
          cycleAppointmentsData?.map((apt) => apt.id) || [];

        // Filter medical records that belong to this cycle's appointments
        if (cycleAppointmentIds.length === 0) {
          return []; // If no appointments in cycle, return empty array
        }

        return allRecords.filter((record) => {
          return (
            record.appointmentId &&
            cycleAppointmentIds.includes(record.appointmentId)
          );
        });
      } catch {
        return [];
      }
    },
    enabled:
      !!currentCycle.patientId &&
      !!currentCycle.id &&
      cycleAppointmentsData !== undefined,
  });

  // Fetch documents for this cycle
  const { data: documentsData } = useQuery({
    queryKey: ["cycle-documents", currentCycle.id],
    queryFn: async () => {
      if (!currentCycle.id) return [];
      try {
        const response = await api.treatmentCycle.getCycleDocuments(
          currentCycle.id
        );
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentCycle.id,
  });

  // Fetch ALL sperm samples of patient that have been quality checked (for validation)
  const { data: spermSamplesData } = useQuery({
    queryKey: [
      "sperm-samples",
      "patient",
      currentCycle.patientId,
      "quality-checked",
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return { data: [] };
      try {
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Sperm",
          PatientId: currentCycle.patientId,
          Page: 1,
          Size: 100,
          Sort: "collectionDate",
          Order: "desc",
        });
        const samples = response.data || [];
        // Get ALL samples of patient that have been quality checked
        // Statuses considered as quality checked: QualityChecked, Fertilized, CulturedEmbryo, Stored, Used, Frozen
        const qualityCheckedStatuses = [
          "QualityChecked",
          "Fertilized",
          "CulturedEmbryo",
          "Stored",
          "Used",
          "Frozen",
        ];
        return {
          data: samples.filter((sample) =>
            qualityCheckedStatuses.includes(sample.status)
          ),
        };
      } catch (error) {
        console.error("Error fetching sperm samples:", error);
        return { data: [] };
      }
    },
    enabled: !!currentCycle.patientId,
  });

  // Fetch ALL oocyte samples of patient that have been quality checked (for validation)
  const { data: oocyteSamplesData } = useQuery({
    queryKey: [
      "oocyte-samples",
      "patient",
      currentCycle.patientId,
      "quality-checked",
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return { data: [] };
      try {
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Oocyte",
          PatientId: currentCycle.patientId,
          Page: 1,
          Size: 100,
          Sort: "collectionDate",
          Order: "desc",
        });
        const samples = response.data || [];
        // Get ALL samples of patient that have been quality checked
        // Statuses considered as quality checked: QualityChecked, Fertilized, CulturedEmbryo, Stored, Used, Frozen
        const qualityCheckedStatuses = [
          "QualityChecked",
          "Fertilized",
          "CulturedEmbryo",
          "Stored",
          "Used",
          "Frozen",
        ];
        return {
          data: samples.filter((sample) =>
            qualityCheckedStatuses.includes(sample.status)
          ),
        };
      } catch (error) {
        console.error("Error fetching oocyte samples:", error);
        return { data: [] };
      }
    },
    enabled: !!currentCycle.patientId,
  });

  const spermSamples = spermSamplesData?.data || [];
  const oocyteSamples = oocyteSamplesData?.data || [];

  // Fetch all cycles for this treatment to show progress
  // Use allCyclesDataForType if available, otherwise fetch separately
  const { data: allCyclesData } = useQuery({
    queryKey: ["treatment-cycles", "treatment", currentCycle.treatmentId],
    queryFn: async () => {
      if (!currentCycle.treatmentId) return [];
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: currentCycle.treatmentId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentCycle.treatmentId,
  });

  // Use allCyclesDataForType if available, otherwise use allCyclesData
  const rawFinalAllCyclesData = allCyclesDataForType || allCyclesData || [];

  // Enhance allCyclesData with treatmentType to prevent "Treatment type not specified" error
  const finalAllCyclesData = useMemo(() => {
    if (!rawFinalAllCyclesData || rawFinalAllCyclesData.length === 0) {
      return [currentCycle];
    }
    return rawFinalAllCyclesData.map((cycle) => {
      const treatmentType = inferTreatmentType(cycle);
      return {
        ...cycle,
        treatmentType: treatmentType || currentCycle.treatmentType,
      };
    });
  }, [rawFinalAllCyclesData, currentCycle, inferTreatmentType]);

  // Type assertion helpers to ensure legacy steps are recognized
  const asIVFStep = (step: string): IVFStep => step as IVFStep;

  // Helper function to map stepType enum from backend to frontend step IDs
  const mapStepTypeToStepId = (
    stepType: string | number | undefined,
    treatmentType: "IUI" | "IVF" | undefined
  ): IVFStep | IUIStep | null => {
    if (!stepType || !treatmentType) return null;

    const stepTypeStr = String(stepType).toUpperCase();

    if (treatmentType === "IUI") {
      if (
        stepTypeStr === "IUI_PRECYCLEPREPARATION" ||
        stepTypeStr.includes("PRECYCLE")
      ) {
        return "step0_pre_cycle_prep";
      }
      if (
        stepTypeStr === "IUI_DAY2_3_ASSESSMENT" ||
        stepTypeStr.includes("DAY2_3") ||
        stepTypeStr.includes("ASSESSMENT")
      ) {
        return "step1_day2_3_assessment";
      }
      if (
        stepTypeStr === "IUI_DAY7_10_FOLLICLEMONITORING" ||
        stepTypeStr.includes("DAY7_10") ||
        stepTypeStr.includes("FOLLICLE")
      ) {
        return "step2_follicle_monitoring";
      }
      if (
        stepTypeStr === "IUI_DAY10_12_TRIGGER" ||
        stepTypeStr.includes("DAY10_12") ||
        (stepTypeStr.includes("TRIGGER") && !stepTypeStr.includes("PREGNANCY"))
      ) {
        return "step3_trigger";
      }
      if (
        stepTypeStr === "IUI_PROCEDURE" ||
        stepTypeStr.includes("PROCEDURE")
      ) {
        return "step4_iui_procedure";
      }
      if (
        stepTypeStr === "IUI_POSTIUI" ||
        stepTypeStr === "IUI_POST_IUI" ||
        stepTypeStr.includes("POSTIUI") ||
        stepTypeStr.includes("POST_IUI") ||
        stepTypeStr.includes("POSTIUI")
      ) {
        return "step5_post_iui";
      }
      if (
        stepTypeStr === "IUI_BETAHCGTEST" ||
        stepTypeStr.includes("BETAHCG") ||
        stepTypeStr.includes("BETA_HCG")
      ) {
        return "step6_beta_hcg";
      }
    } else if (treatmentType === "IVF") {
      if (
        stepTypeStr === "IVF_PRECYCLEPREPARATION" ||
        stepTypeStr.includes("PRECYCLE")
      ) {
        return "step0_pre_cycle_prep";
      }
      if (
        stepTypeStr === "IVF_STIMULATIONSTART" ||
        stepTypeStr.includes("STIMULATION") ||
        stepTypeStr.includes("COS")
      ) {
        return "step1_stimulation";
      }
      if (
        stepTypeStr === "IVF_MONITORING" ||
        (stepTypeStr.includes("MONITORING") && !stepTypeStr.includes("POST"))
      ) {
        return asIVFStep("step2_monitoring");
      }
      if (stepTypeStr === "IVF_TRIGGER" || stepTypeStr.includes("TRIGGER")) {
        return asIVFStep("step3_trigger");
      }
      if (
        stepTypeStr === "IVF_OPU" ||
        stepTypeStr.includes("OPU") ||
        stepTypeStr.includes("OOCYTE")
      ) {
        return "step4_opu";
      }
      if (
        stepTypeStr === "IVF_FERTILIZATION" ||
        stepTypeStr.includes("FERTILIZATION")
      ) {
        return "step5_fertilization";
      }
      if (
        stepTypeStr === "IVF_EMBRYOCULTURE" ||
        stepTypeStr.includes("EMBRYOCULTURE") ||
        stepTypeStr.includes("CULTURE")
      ) {
        return asIVFStep("step6_embryo_culture");
      }
      if (
        stepTypeStr === "IVF_EMBRYOTRANSFER" ||
        stepTypeStr.includes("EMBRYOTRANSFER") ||
        stepTypeStr.includes("TRANSFER")
      ) {
        return "step7_embryo_transfer";
      }
      if (
        stepTypeStr === "IVF_BETAHCGTEST" ||
        (stepTypeStr.includes("BETAHCG") && stepTypeStr.includes("IVF")) ||
        (stepTypeStr.includes("BETA_HCG") && stepTypeStr.includes("IVF"))
      ) {
        return "step6_beta_hcg";
      }
    }

    return null;
  };

  // Helper function to map cycle name to step (fallback when stepType is not available)
  const mapCycleNameToStep = (
    cycleName: string | undefined,
    treatmentType: "IUI" | "IVF" | undefined
  ): IVFStep | IUIStep | null => {
    if (!cycleName || !treatmentType) return null;

    const nameLower = cycleName.toLowerCase();

    if (treatmentType === "IUI") {
      // Step 4: Post-Insemination Follow-Up (IUI_PostIUI)
      if (
        nameLower.includes("post-insemination") ||
        nameLower.includes("post-iui") ||
        (nameLower.includes("post") && nameLower.includes("follow-up")) ||
        (nameLower.includes("post") && nameLower.includes("monitoring"))
      ) {
        return "step5_post_iui";
      }
      // Step 3: Sperm Collection and Intrauterine Insemination (IUI_Procedure)
      if (
        nameLower.includes("sperm collection") ||
        nameLower.includes("intrauterine insemination") ||
        (nameLower.includes("iui") && nameLower.includes("procedure")) ||
        nameLower.includes("insemination")
      ) {
        return "step4_iui_procedure";
      }
      // Step 2: Ovarian Stimulation (IUI_Day7_10_FollicleMonitoring)
      if (
        nameLower.includes("ovarian stimulation") ||
        (nameLower.includes("stimulation") && nameLower.includes("ovarian")) ||
        nameLower.includes("follicle monitoring") ||
        nameLower.includes("day 7-10")
      ) {
        return "step2_follicle_monitoring";
      }
      // Step 1: Initial Medical Examination (IUI_PreCyclePreparation)
      if (
        nameLower.includes("initial medical examination") ||
        nameLower.includes("medical examination") ||
        nameLower.includes("baseline visit") ||
        nameLower.includes("pre-cycle preparation")
      ) {
        return "step0_pre_cycle_prep";
      }
      // Legacy mappings (for backward compatibility)
      if (
        nameLower.includes("beta") ||
        nameLower.includes("hcg") ||
        (nameLower.includes("pregnancy") && nameLower.includes("test"))
      ) {
        return "step6_beta_hcg";
      }
      if (nameLower.includes("day 10-12") || nameLower.includes("trigger")) {
        return "step3_trigger";
      }
      if (nameLower.includes("day 2-3") || nameLower.includes("assessment")) {
        return "step1_day2_3_assessment";
      }
    } else if (treatmentType === "IVF") {
      // Step 6: Post-Transfer Follow-Up (IVF_BetaHCGTest)
      if (
        nameLower.includes("post-transfer follow-up") ||
        nameLower.includes("post-transfer") ||
        (nameLower.includes("post") && nameLower.includes("transfer")) ||
        (nameLower.includes("pregnancy") && nameLower.includes("test"))
      ) {
        return "step6_beta_hcg";
      }
      // Step 5: Embryo Transfer (IVF_EmbryoTransfer)
      if (
        nameLower.includes("embryo transfer") ||
        nameLower.includes("transfer") ||
        nameLower.includes("et")
      ) {
        return "step7_embryo_transfer";
      }
      // Step 4: In Vitro Fertilization (IVF_Fertilization)
      if (
        nameLower.includes("in vitro fertilization") ||
        nameLower.includes("fertilization") ||
        nameLower.includes("icsi")
      ) {
        return "step5_fertilization";
      }
      // Step 3: Oocyte Retrieval and Sperm Collection (IVF_OPU)
      if (
        nameLower.includes("oocyte retrieval") ||
        nameLower.includes("sperm collection") ||
        nameLower.includes("retrieval") ||
        nameLower.includes("opu") ||
        nameLower.includes("oocyte") ||
        nameLower.includes("pick-up")
      ) {
        return "step4_opu";
      }
      // Step 2: Ovarian Stimulation (IVF_StimulationStart)
      if (
        nameLower.includes("ovarian stimulation") ||
        nameLower.includes("controlled ovarian stimulation") ||
        nameLower.includes("stimulation") ||
        nameLower.includes("cos")
      ) {
        return "step1_stimulation";
      }
      // Step 1: Initial Medical Examination (IVF_PreCyclePreparation)
      if (
        nameLower.includes("initial medical examination") ||
        nameLower.includes("medical examination") ||
        nameLower.includes("baseline evaluation") ||
        nameLower.includes("pre-cycle preparation")
      ) {
        return "step0_pre_cycle_prep";
      }
      // Legacy mappings (for backward compatibility)
      if (
        nameLower.includes("embryo culture") ||
        nameLower.includes("culture")
      ) {
        return asIVFStep("step6_embryo_culture");
      }
      if (
        nameLower.includes("trigger") ||
        nameLower.includes("ovulation trigger")
      ) {
        return asIVFStep("step3_trigger");
      }
      if (
        nameLower.includes("mid-stimulation") ||
        nameLower.includes("monitoring")
      ) {
        return asIVFStep("step2_monitoring");
      }
    }

    return null;
  };

  // Helper to convert step number from API to step ID
  const getStepIdFromNumber = (
    stepNumber: number | null | undefined,
    stepList: Array<IVFStep | IUIStep>
  ): IVFStep | IUIStep | undefined => {
    if (stepNumber === null || stepNumber === undefined) return undefined;
    // API returns 0-based index: 0 = step0, 1 = step1, 2 = step2, etc.
    if (stepNumber >= 0 && stepNumber < stepList.length) {
      return stepList[stepNumber];
    }
    return undefined;
  };

  // Get ACTIVE cycle (not the cycle being viewed)
  // This is critical to show correct treatment progress
  const activeCycle = useMemo(() => {
    const active = getActiveCycle(finalAllCyclesData);
    console.log(`[CycleUpdateForm] getActiveCycle result:`, {
      totalCycles: finalAllCyclesData.length,
      activeCycleId: active?.id,
      activeCycleNumber: active?.cycleNumber,
      activeCycleName: active?.cycleName,
      activeCycleStatus: active?.status,
      allCyclesInfo: finalAllCyclesData.map((c) => ({
        id: c.id,
        number: c.cycleNumber,
        name: c.cycleName,
        status: c.status,
        normalized: normalizeTreatmentCycleStatus(c.status),
      })),
    });
    // Ensure activeCycle has treatmentType from currentCycle if not set
    if (active && !active.treatmentType && currentCycle.treatmentType) {
      return {
        ...active,
        treatmentType: currentCycle.treatmentType,
      };
    }
    return active;
  }, [finalAllCyclesData, currentCycle.id, currentCycle.treatmentType]);

  // Get current step and next step - ALWAYS use active cycle, not viewing cycle
  const { currentStep, nextStep } = useMemo(() => {
    const isIVF = currentCycle.treatmentType === "IVF";
    const isIUI = currentCycle.treatmentType === "IUI";
    const stepList = isIVF ? IVF_STEPS : isIUI ? IUI_STEPS : [];

    if (stepList.length === 0) {
      return { currentStep: null, nextStep: null };
    }

    // CRITICAL: Always use active cycle to determine currentStep
    // This ensures we show the actual treatment progress, not the cycle being viewed
    const cycleForStep = activeCycle || currentCycle;

    console.log(`[CycleUpdateForm] Determining currentStep:`, {
      viewingCycle: currentCycle.cycleNumber,
      viewingCycleName: currentCycle.cycleName,
      activeCycle: activeCycle?.cycleNumber,
      activeCycleName: activeCycle?.cycleName,
      activeCycleStepType: activeCycle?.stepType,
      activeCycleCycleName: activeCycle?.cycleName,
      usingCycle: cycleForStep.cycleNumber,
      usingCycleStepType: cycleForStep.stepType,
      usingCycleCycleName: cycleForStep.cycleName,
      currentStepFromApi: currentStepFromApi,
    });

    // CRITICAL: If activeCycle exists, we MUST use it to determine step
    // Do NOT fallback to currentStepFromApi if activeCycle exists (even if it doesn't have step info)
    // This ensures consistency: active cycle = current step source
    if (activeCycle) {
      // PRIORITY 1: Use active cycle's currentStep if available (most reliable for active cycle)
      if (activeCycle.currentStep) {
        const currentIndex = stepList.findIndex(
          (s) => s === activeCycle.currentStep
        );
        if (currentIndex >= 0) {
          const next =
            currentIndex < stepList.length - 1
              ? stepList[currentIndex + 1]
              : null;
          console.log(
            `[CycleUpdateForm] Using active cycle's currentStep:`,
            activeCycle.currentStep
          );
          return {
            currentStep: activeCycle.currentStep,
            nextStep: next,
          };
        }
      }

      // PRIORITY 2: Use active cycle's stepType (reliable source from active cycle)
      // Fallback to currentCycle.treatmentType if activeCycle doesn't have it
      const treatmentTypeForMapping =
        (activeCycle.treatmentType as "IUI" | "IVF" | undefined) ||
        (currentCycle.treatmentType as "IUI" | "IVF" | undefined);

      if (activeCycle.stepType) {
        const stepId = mapStepTypeToStepId(
          activeCycle.stepType,
          treatmentTypeForMapping
        );
        if (stepId) {
          const currentIndex = stepList.findIndex((s) => s === stepId);
          const next =
            currentIndex >= 0 && currentIndex < stepList.length - 1
              ? stepList[currentIndex + 1]
              : null;
          console.log(
            `[CycleUpdateForm] Using active cycle's stepType:`,
            stepId,
            `(from stepType: ${activeCycle.stepType}, treatmentType: ${treatmentTypeForMapping})`
          );
          return {
            currentStep: stepId,
            nextStep: next,
          };
        } else {
          console.warn(
            `[CycleUpdateForm] Failed to map stepType "${activeCycle.stepType}" with treatmentType "${treatmentTypeForMapping}"`
          );
        }
      }

      // PRIORITY 3: Use active cycle's cycleName (reliable source from active cycle)
      if (activeCycle.cycleName) {
        const stepId = mapCycleNameToStep(
          activeCycle.cycleName,
          treatmentTypeForMapping
        );
        if (stepId) {
          const currentIndex = stepList.findIndex((s) => s === stepId);
          const next =
            currentIndex >= 0 && currentIndex < stepList.length - 1
              ? stepList[currentIndex + 1]
              : null;
          console.log(
            `[CycleUpdateForm] Using active cycle's cycleName:`,
            stepId,
            `(from cycleName: ${activeCycle.cycleName}, treatmentType: ${treatmentTypeForMapping})`
          );
          return {
            currentStep: stepId,
            nextStep: next,
          };
        } else {
          console.warn(
            `[CycleUpdateForm] Failed to map cycleName "${activeCycle.cycleName}" with treatmentType "${treatmentTypeForMapping}"`
          );
        }
      }

      // If activeCycle exists but has no step info, try currentStepFromApi before falling back to first step
      console.warn(
        `[CycleUpdateForm] Active cycle (${activeCycle.cycleNumber}: ${activeCycle.cycleName}) exists but has no step info. Trying currentStepFromApi...`
      );

      // Try currentStepFromApi as fallback if active cycle has no step info
      if (currentStepFromApi !== null && currentStepFromApi !== undefined) {
        const stepFromApi = getStepIdFromNumber(currentStepFromApi, stepList);
        if (stepFromApi) {
          const currentIndex = stepList.findIndex((s) => s === stepFromApi);
          const next =
            currentIndex >= 0 && currentIndex < stepList.length - 1
              ? stepList[currentIndex + 1]
              : null;
          console.log(
            `[CycleUpdateForm] Using currentStepFromApi (active cycle has no step info):`,
            stepFromApi
          );
          return {
            currentStep: stepFromApi,
            nextStep: next,
          };
        }
      }

      // Final fallback: use first step
      const firstStep = stepList[0] || null;
      console.warn(
        `[CycleUpdateForm] No step found from active cycle or API. Using first step:`,
        firstStep
      );
      return {
        currentStep: firstStep,
        nextStep: stepList.length > 1 ? stepList[1] : null,
      };
    }

    // PRIORITY 4: Use currentStepFromApi as fallback (only if NO active cycle exists)
    // This handles cases where there's no active cycle yet
    if (
      !activeCycle &&
      currentStepFromApi !== null &&
      currentStepFromApi !== undefined
    ) {
      const stepFromApi = getStepIdFromNumber(currentStepFromApi, stepList);
      if (stepFromApi) {
        const currentIndex = stepList.findIndex((s) => s === stepFromApi);
        const next =
          currentIndex >= 0 && currentIndex < stepList.length - 1
            ? stepList[currentIndex + 1]
            : null;
        console.log(
          `[CycleUpdateForm] Using currentStepFromApi (no active cycle):`,
          stepFromApi
        );
        return {
          currentStep: stepFromApi,
          nextStep: next,
        };
      }
    }

    // FALLBACK: If no step found and no active cycle, use first step
    const firstStep = stepList[0] || null;
    console.log(
      `[CycleUpdateForm] No step found, using first step:`,
      firstStep
    );
    return {
      currentStep: firstStep,
      nextStep: stepList.length > 1 ? stepList[1] : null,
    };
  }, [
    currentCycle.treatmentType,
    activeCycle,
    currentCycle,
    currentStepFromApi,
    finalAllCyclesData,
  ]);

  // Mutation to create medical record
  const createMedicalRecordMutation = useMutation({
    mutationFn: async (data: MedicalRecordFormData) => {
      if (!selectedAppointmentId) {
        throw new Error("Please select an appointment");
      }

      const medicalRecordData: CreateMedicalRecordRequest = {
        appointmentId: selectedAppointmentId,
        chiefComplaint: data.chiefComplaint || undefined,
        history: data.history || undefined,
        physicalExamination: data.physicalExamination || undefined,
        diagnosis: data.diagnosis || undefined,
        treatmentPlan: data.treatmentPlan || undefined,
        followUpInstructions: data.followUpInstructions || undefined,
        vitalSigns: data.vitalSigns || undefined,
        labResults: data.labResults || undefined,
        imagingResults: data.imagingResults || undefined,
        notes: data.notes || undefined,
      };

      return api.medicalRecord.createMedicalRecord(medicalRecordData);
    },
    onSuccess: () => {
      toast.success("Medical record created successfully");
      form.reset();
      setShowMedicalRecordForm(false);
      queryClient.invalidateQueries({
        queryKey: ["medical-records"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create medical record"
      );
    },
  });

  const handleCreateMedicalRecord = (data: MedicalRecordFormData) => {
    createMedicalRecordMutation.mutate(data);
  };

  // Helper function to get step label (matching backend TreatmentStepType enum)
  const getStepLabel = (step: IVFStep | IUIStep | null): string => {
    if (!step) return "Unknown";

    const stepLabels: Record<string, string> = {
      // IVF steps (6 steps)
      step0_pre_cycle_prep: "Initial Medical Examination",
      step1_stimulation: "Ovarian Stimulation",
      step4_opu: "Oocyte Retrieval and Sperm Collection",
      step5_fertilization: "In Vitro Fertilization",
      step7_embryo_transfer: "Embryo Transfer",
      step6_beta_hcg: "Post-Transfer Follow-Up",
      // IUI steps (4 steps)
      step2_follicle_monitoring: "Ovarian Stimulation",
      step4_iui_procedure: "Sperm Collection and Intrauterine Insemination",
      step5_post_iui: "Post-Insemination Follow-Up",
      // Legacy steps (for backward compatibility)
      step2_monitoring: "Mid-Stimulation Monitoring",
      step3_trigger: "Ovulation Trigger",
      step6_embryo_culture: "Embryo Culture",
      step1_day2_3_assessment: "Day 2-3 Assessment",
    };

    return stepLabels[step] || step;
  };

  const appointmentsCount = cycleAppointmentsData?.length || 0;
  const samplesCount = samplesData?.length || 0;
  const agreementsCount = agreementsData?.length || 0;
  const serviceRequestsCount = serviceRequestsData?.length || 0;
  const medicalRecordsCount = medicalRecordsData?.length || 0;
  const documentsCount = documentsData?.length || 0;

  // Check if viewing cycle is the active cycle
  // Compare by both id and cycleNumber to ensure accuracy
  const isViewingActiveCycle =
    activeCycle &&
    (activeCycle.id === currentCycle.id ||
      activeCycle.cycleNumber === currentCycle.cycleNumber);
  const isViewingFutureCycle =
    activeCycle && currentCycle.cycleNumber > activeCycle.cycleNumber;

  return (
    <div className="space-y-6">
      {/* Warning if viewing non-active cycle */}
      {!isViewingActiveCycle && activeCycle && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-yellow-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {isViewingFutureCycle
                  ? "Viewing Future Cycle"
                  : "Viewing Previous Cycle"}
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                This is{" "}
                {isViewingFutureCycle
                  ? "a planned future cycle"
                  : "a completed/inactive cycle"}
                . The current active cycle is{" "}
                <strong>
                  Cycle {activeCycle.cycleNumber}: {activeCycle.cycleName}
                </strong>
                .
                {isViewingFutureCycle &&
                  " You must complete the active cycle first before starting this one."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Current Treatment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <HorizontalTreatmentTimeline
            cycle={{
              ...currentCycle,
              treatmentType:
                currentCycle.treatmentType === "IUI" ||
                currentCycle.treatmentType === "IVF"
                  ? currentCycle.treatmentType
                  : undefined,
            }}
            allCycles={finalAllCyclesData}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {appointmentsCount}
              </p>
              <p className="text-sm text-gray-500">Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{samplesCount}</p>
              <p className="text-sm text-gray-500">Lab Samples</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {agreementsCount}
              </p>
              <p className="text-sm text-gray-500">Agreements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {serviceRequestsCount}
              </p>
              <p className="text-sm text-gray-500">Service Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {medicalRecordsCount}
              </p>
              <p className="text-sm text-gray-500">Medical Records</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {documentsCount}
              </p>
              <p className="text-sm text-gray-500">Documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Step Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Treatment Stage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Current Step</p>
            <p className="font-semibold">{getStepLabel(currentStep)}</p>
            {currentStep && (
              <p className="text-xs text-gray-400 mt-1">{currentStep}</p>
            )}
          </div>
          {nextStep && (
            <div>
              <p className="text-sm text-gray-500">Next Step</p>
              <p className="font-semibold">{getStepLabel(nextStep)}</p>
              <p className="text-xs text-gray-400 mt-1">{nextStep}</p>
            </div>
          )}
          {/* Buttons removed per user request */}
        </CardContent>
      </Card>

      {/* In Vitro Fertilization Section - only show for step5_fertilization */}
      {currentStep === "step5_fertilization" &&
        currentCycle.treatmentType === "IVF" &&
        normalizeTreatmentCycleStatus(currentCycle.status) !== "Completed" &&
        normalizeTreatmentCycleStatus(currentCycle.status) !== "Cancelled" && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    In Vitro Fertilization (IVF)
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Select sperm and oocyte samples to send to the lab for
                    fertilization
                  </p>
                </div>
                <Button
                  onClick={() => setShowFertilizationModal(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Select Samples for Fertilization
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Sperm Samples
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {spermSamples?.filter((s) => s.canFertilize).length || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    marked for fertilization
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Oocyte Samples
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {oocyteSamples?.filter((s) => s.canFertilize).length || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    marked for fertilization
                  </p>
                </div>
              </div>
              {((spermSamples?.filter((s) => s.canFertilize).length || 0) > 0 ||
                (oocyteSamples?.filter((s) => s.canFertilize).length || 0) >
                  0) && (
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-blue-900">
                    ✓ Samples have been marked and are ready for lab
                    fertilization. The lab will create embryos upon receiving
                    the samples.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Service Requests List */}
      {serviceRequestsData && serviceRequestsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviceRequestsData.slice(0, 5).map((request) => {
                const statusBadgeClass = (status?: string) => {
                  return getServiceRequestStatusBadgeClass(status);
                };

                const formatDate = (dateString?: string | null) => {
                  if (!dateString) return "N/A";
                  try {
                    return new Date(dateString).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                  } catch {
                    return dateString;
                  }
                };

                const formatCurrency = (value?: number | null) => {
                  if (value === null || value === undefined) return "—";
                  return formatCurrencyUtil(value);
                };

                return (
                  <div
                    key={request.id}
                    className="rounded-md border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-sm">
                            {request.requestCode || getLast4Chars(request.id)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(request.status)}`}
                          >
                            {request.status || "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          Request Date:{" "}
                          {formatDate(
                            request.requestDate || request.requestedDate
                          )}
                        </p>
                        {request.serviceDetails &&
                          request.serviceDetails.length > 0 && (
                            <p className="text-xs text-gray-500 mb-1">
                              Services: {request.serviceDetails.length} item(s)
                            </p>
                          )}
                        {request.totalAmount !== undefined && (
                          <p className="text-sm font-semibold text-gray-900">
                            Total: {formatCurrency(request.totalAmount)}
                          </p>
                        )}
                        {request.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {request.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {serviceRequestsData.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  Showing 5 of {serviceRequestsData.length} service requests
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Request Modal */}
      {showServiceRequestModal && (
        <CreateServiceRequestForCycleModal
          cycle={currentCycle}
          isOpen={showServiceRequestModal}
          onClose={() => setShowServiceRequestModal(false)}
          onSuccess={() => {
            setShowServiceRequestModal(false);
            queryClient.invalidateQueries({
              queryKey: ["doctor", "service-requests"],
            });
          }}
        />
      )}

      {/* Medical Record Form */}
      {showMedicalRecordForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Medical Record</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleCreateMedicalRecord)}
              className="space-y-4"
            >
              {/* Select Appointment */}
              <div className="space-y-2">
                <Label htmlFor="appointmentId">Appointment *</Label>
                <select
                  id="appointmentId"
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Select an appointment</option>
                  {appointmentsData?.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {new Date(apt.appointmentDate || "").toLocaleDateString(
                        "en-US"
                      )}{" "}
                      - {apt.appointmentCode || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                  <Textarea
                    id="chiefComplaint"
                    {...form.register("chiefComplaint")}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history">History</Label>
                  <Textarea
                    id="history"
                    {...form.register("history")}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="physicalExamination">
                  Physical Examination
                </Label>
                <Textarea
                  id="physicalExamination"
                  {...form.register("physicalExamination")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  {...form.register("diagnosis")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                <Textarea
                  id="treatmentPlan"
                  {...form.register("treatmentPlan")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpInstructions">
                  Follow-up Instructions
                </Label>
                <Textarea
                  id="followUpInstructions"
                  {...form.register("followUpInstructions")}
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vitalSigns">Vital Signs</Label>
                  <Input id="vitalSigns" {...form.register("vitalSigns")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labResults">Lab Results</Label>
                  <Input id="labResults" {...form.register("labResults")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagingResults">Imaging Results</Label>
                <Textarea
                  id="imagingResults"
                  {...form.register("imagingResults")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...form.register("notes")} rows={3} />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMedicalRecordMutation.isPending}
                >
                  {createMedicalRecordMutation.isPending
                    ? "Creating..."
                    : "Create Medical Record"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowMedicalRecordForm(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Complete Cycle Form Dialog */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Complete Treatment Cycle
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Please provide completion details. All fields are optional.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCompleteConfirm(false);
                  setCompleteOutcome("");
                  setCompleteNotes("");
                }}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                disabled={isCompleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="complete-outcome">Outcome</Label>
                <Input
                  id="complete-outcome"
                  value={completeOutcome}
                  onChange={(e) => setCompleteOutcome(e.target.value)}
                  placeholder="e.g., Successful, Positive, etc."
                  disabled={isCompleting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-notes">Notes</Label>
                <Textarea
                  id="complete-notes"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Additional notes about the cycle completion..."
                  rows={4}
                  disabled={isCompleting}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteConfirm(false);
                  setCompleteOutcome("");
                  setCompleteNotes("");
                }}
                disabled={isCompleting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setIsCompleting(true);
                  try {
                    // Use POST /api/treatment-cycles/{id}/complete
                    // Ensure we use the cycle ID (not treatment ID)
                    const cycleId = currentCycle.id;
                    if (!cycleId) {
                      throw new Error("Cycle ID is missing");
                    }

                    // Check if cycle has started before allowing completion
                    const cycleStatus = normalizeTreatmentCycleStatus(
                      currentCycle.status
                    );
                    const hasStarted = cycleStatus === "InProgress";
                    const isCompleted = cycleStatus === "Completed";
                    const isCancelled = cycleStatus === "Cancelled";

                    if (!hasStarted) {
                      throw new Error(
                        "Cannot complete cycle: Cycle has not been started yet."
                      );
                    }

                    if (isCompleted) {
                      throw new Error(
                        "Cannot complete cycle: Cycle is already completed."
                      );
                    }

                    if (isCancelled) {
                      throw new Error(
                        "Cannot complete cycle: Cycle has been cancelled."
                      );
                    }

                    // Validate IVF cycle 3 before completing
                    const isIVFCycle3 = (() => {
                      if (currentCycle.treatmentType !== "IVF") return false;
                      if (currentCycle.cycleNumber === 3) return true;
                      const stepTypeStr = currentCycle.stepType
                        ? String(currentCycle.stepType).toUpperCase()
                        : "";
                      if (stepTypeStr === "IVF_OPU") return true;
                      const currentStep = currentCycle.currentStep as
                        | string
                        | undefined;
                      if (currentStep === "step4_opu") return true;
                      const cycleNameLower =
                        currentCycle.cycleName?.toLowerCase() || "";
                      if (
                        cycleNameLower.includes("oocyte retrieval") ||
                        cycleNameLower.includes("sperm collection") ||
                        (cycleNameLower.includes("opu") &&
                          cycleNameLower.includes("cycle"))
                      ) {
                        return true;
                      }
                      return false;
                    })();

                    if (isIVFCycle3) {
                      // Only validate if samples exist - if no samples exist, allow completion
                      const hasAnySpermSamples = spermSamples.length > 0;
                      const hasAnyOocyteSamples = oocyteSamples.length > 0;

                      // If no samples exist at all, allow completion (samples might not be collected yet)
                      if (!hasAnySpermSamples && !hasAnyOocyteSamples) {
                        // Allow completion - no samples to validate
                      } else {
                        // We have some samples, check that we have quality-checked samples for both types
                        // We already filtered for quality-checked samples in the query, so if they exist, they're quality-checked
                        if (hasAnySpermSamples && hasAnyOocyteSamples) {
                          // Both types exist and are quality-checked - allow completion
                        } else {
                          // Only one type exists, we still need both for cycle 3
                          const missingSamples: string[] = [];
                          if (!hasAnySpermSamples) {
                            missingSamples.push("sperm quality check");
                          }
                          if (!hasAnyOocyteSamples) {
                            missingSamples.push("oocyte quality check");
                          }
                          throw new Error(
                            `Cannot complete cycle: Lab has not returned ${missingSamples.join(" and ")} data. Please wait for lab to complete quality checks.`
                          );
                        }
                      }
                    }

                    // Build request body with all fields
                    const completeRequest: {
                      endDate: string;
                      outcome?: string;
                      notes?: string;
                    } = {
                      endDate: new Date().toISOString(),
                    };

                    // Only include outcome and notes if they have values
                    if (completeOutcome.trim()) {
                      completeRequest.outcome = completeOutcome.trim();
                    }
                    if (completeNotes.trim()) {
                      completeRequest.notes = completeNotes.trim();
                    }

                    await api.treatmentCycle.completeTreatmentCycle(
                      cycleId,
                      completeRequest
                    );

                    // After completing cycle, automatically start the next cycle
                    const allCycles = finalAllCyclesData || [];
                    const sortedCycles = [...allCycles, currentCycle].sort(
                      (a, b) => {
                        const orderA = a.orderIndex ?? a.cycleNumber ?? 0;
                        const orderB = b.orderIndex ?? b.cycleNumber ?? 0;
                        return orderA - orderB;
                      }
                    );

                    const currentCycleIndex = sortedCycles.findIndex(
                      (c) => c.id === cycleId
                    );

                    // Find and start the next cycle
                    if (
                      currentCycleIndex >= 0 &&
                      currentCycleIndex < sortedCycles.length - 1
                    ) {
                      const nextCycle = sortedCycles[currentCycleIndex + 1];
                      const nextCycleStatus = normalizeTreatmentCycleStatus(
                        nextCycle.status
                      );

                      // Start next cycle if it's Planned or Scheduled
                      if (
                        nextCycleStatus === "Planned" ||
                        nextCycleStatus === "Scheduled"
                      ) {
                        try {
                          const now = new Date().toISOString();
                          await api.treatmentCycle.updateTreatmentCycle(
                            nextCycle.id,
                            {
                              status: "InProgress",
                              startDate: now,
                              cycleName: nextCycle.cycleName,
                              cycleNumber: nextCycle.cycleNumber,
                              protocol: nextCycle.protocol,
                              notes: nextCycle.notes,
                              cost: nextCycle.cost ?? undefined,
                            }
                          );
                          toast.success(
                            `Cycle completed. Next cycle "${nextCycle.cycleName}" has been started.`
                          );
                        } catch (error: any) {
                          // If starting next cycle fails, still show success for completing current cycle
                          console.error("Failed to start next cycle:", error);
                          toast.success(
                            "Cycle completed successfully, but failed to start next cycle"
                          );
                        }
                      } else {
                        toast.success("Cycle completed successfully");
                      }
                    } else {
                      toast.success("Cycle completed successfully");
                    }

                    queryClient.invalidateQueries({
                      queryKey: ["doctor", "treatment-cycle", cycleId],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["doctor", "treatment-cycles"],
                    });
                    queryClient.invalidateQueries({
                      queryKey: [
                        "treatment-cycles",
                        "treatment",
                        currentCycle.treatmentId,
                      ],
                    });
                    queryClient.invalidateQueries({
                      queryKey: ["treatment-cycles", "patient"],
                    });
                    // Invalidate current step query to refresh timeline
                    if (currentCycle.treatmentId) {
                      queryClient.invalidateQueries({
                        queryKey: ["treatment-current-step", currentCycle.treatmentId],
                      });
                    }

                    // Send notification to patient
                    if (currentCycle.patientId) {
                      const { sendTreatmentCycleNotification } = await import(
                        "@/utils/notifications"
                      );
                      await sendTreatmentCycleNotification(
                        currentCycle.patientId,
                        "completed",
                        {
                          cycleId: currentCycle.id,
                          cycleName: currentCycle.cycleName,
                          cycleNumber: currentCycle.cycleNumber,
                          treatmentType: currentCycle.treatmentType,
                        },
                        doctorId || undefined
                      );
                    }

                    setShowCompleteConfirm(false);
                    setCompleteOutcome("");
                    setCompleteNotes("");
                    onStepAdvanced?.();
                  } catch (error: any) {
                    toast.error(
                      error?.response?.data?.message ||
                        "Failed to complete cycle"
                    );
                  } finally {
                    setIsCompleting(false);
                  }
                }}
                disabled={isCompleting}
                className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCompleting ? "Completing..." : "Complete Cycle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Cycle Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={async () => {
          setIsCancelling(true);
          try {
            // Use POST /api/treatment-cycles/{id}/cancel
            await api.treatmentCycle.cancelTreatmentCycle(currentCycle.id, {
              reason: "Cancelled by doctor",
              notes: "Cancelled by doctor",
            });
            toast.success("Cycle cancelled successfully");
            queryClient.invalidateQueries({
              queryKey: ["doctor", "treatment-cycle", currentCycle.id],
            });
            queryClient.invalidateQueries({
              queryKey: ["doctor", "treatment-cycles"],
            });
            queryClient.invalidateQueries({
              queryKey: [
                "treatment-cycles",
                "treatment",
                currentCycle.treatmentId,
              ],
            });

            // Send notification to patient
            if (currentCycle.patientId) {
              const { sendTreatmentCycleNotification } = await import(
                "@/utils/notifications"
              );
              await sendTreatmentCycleNotification(
                currentCycle.patientId,
                "cancelled",
                {
                  cycleId: currentCycle.id,
                  cycleName: currentCycle.cycleName,
                  cycleNumber: currentCycle.cycleNumber,
                  treatmentType: currentCycle.treatmentType,
                },
                doctorId || undefined
              );
            }

            setShowCancelConfirm(false);
          } catch (error: any) {
            toast.error(
              error?.response?.data?.message || "Failed to cancel cycle"
            );
          } finally {
            setIsCancelling(false);
          }
        }}
        title="Cancel Treatment Cycle"
        message="Are you sure you want to cancel this cycle? This action cannot be undone."
        confirmText="Cancel Cycle"
        cancelText="Keep Cycle"
        variant="destructive"
        isLoading={isCancelling}
      />

      {/* Fertilization Modal */}
      {showFertilizationModal && currentCycle.patientId && (
        <FertilizationModal
          cycleId={currentCycle.id}
          patientId={currentCycle.patientId}
          isOpen={showFertilizationModal}
          onClose={() => setShowFertilizationModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["sperm-samples"],
            });
            queryClient.invalidateQueries({
              queryKey: ["oocyte-samples"],
            });
            queryClient.invalidateQueries({
              queryKey: ["doctor", "treatment-cycle", currentCycle.id],
            });
          }}
        />
      )}

      {/* Create Appointment Modal - shown after starting cycle */}
      {doctorId &&
        currentCycle.patientId &&
        (() => {
          // Calculate next appointment date (7 days from today or based on cycle)
          const calculateNextAppointmentDate = (): string => {
            const today = new Date();

            // If cycle has stepDates and currentStep, try to calculate based on step progression
            if (currentCycle.stepDates && currentStep) {
              const currentStepDate = currentCycle.stepDates[currentStep];
              if (currentStepDate) {
                const stepDate = new Date(currentStepDate);
                // Add 3-7 days for next appointment (typical for treatment monitoring)
                const daysToAdd = currentCycle.treatmentType === "IVF" ? 7 : 5;
                stepDate.setDate(stepDate.getDate() + daysToAdd);

                // Ensure date is at least tomorrow
                if (stepDate > today) {
                  return stepDate.toISOString().split("T")[0];
                }
              }
            }

            // If cycle has startDate, calculate from start date
            if (currentCycle.startDate) {
              const startDate = new Date(currentCycle.startDate);
              const daysToAdd = currentCycle.treatmentType === "IVF" ? 7 : 5;
              startDate.setDate(startDate.getDate() + daysToAdd);

              // Ensure date is at least tomorrow
              if (startDate > today) {
                return startDate.toISOString().split("T")[0];
              }
            }

            // Default: 7 days from today
            const nextDate = new Date(today);
            nextDate.setDate(nextDate.getDate() + 7);
            return nextDate.toISOString().split("T")[0];
          };

          return (
            <Modal
              isOpen={showCreateAppointmentModal}
              onClose={() => setShowCreateAppointmentModal(false)}
              title="Create Appointment"
              description={`Create an appointment for this treatment cycle (${currentCycle.treatmentType || "Treatment"} - Cycle ${currentCycle.cycleNumber || ""})`}
              size="2xl"
            >
              <DoctorCreateAppointmentForm
                doctorId={doctorId}
                doctorName={
                  doctorProfile
                    ? `${doctorProfile.firstName} ${doctorProfile.lastName}`.trim()
                    : undefined
                }
                layout="modal"
                defaultPatientId={currentCycle.patientId}
                disablePatientSelection={true}
                defaultAppointmentDate={calculateNextAppointmentDate()}
                defaultAppointmentType="Consultation"
                treatmentCycleId={currentCycle.id}
                onClose={() => setShowCreateAppointmentModal(false)}
                onCreated={() => {
                  toast.success("Appointment created successfully");
                  setShowCreateAppointmentModal(false);
                  queryClient.invalidateQueries({
                    queryKey: ["doctor", "appointments"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["appointments", "cycle", currentCycle.id],
                  });
                }}
              />
            </Modal>
          );
        })()}
    </div>
  );
}
