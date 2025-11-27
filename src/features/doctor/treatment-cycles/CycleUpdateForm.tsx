/**
 * Cycle Update Form Component
 * Displays treatment progress, statistics, and allows creating medical records
 * and advancing to next treatment stage
 */

import { useState, useMemo } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Textarea } from "@/components/ui/textarea";
import { HorizontalTreatmentTimeline } from "./HorizontalTreatmentTimeline";
import { CreateServiceRequestForCycleModal } from "./CreateServiceRequestForCycleModal";
import {
  normalizeTreatmentCycleStatus,
  type TreatmentCycle,
  type IVFStep,
  type IUIStep,
  type CreateMedicalRecordRequest,
} from "@/api/types";

interface CycleUpdateFormProps {
  cycle: TreatmentCycle;
  onStepAdvanced?: () => void;
}

// IVF Steps (8 steps matching backend TreatmentStepType enum)
const IVF_STEPS: IVFStep[] = [
  "step0_pre_cycle_prep", // Pre-Cycle Preparation
  "step1_stimulation", // Controlled Ovarian Stimulation
  "step2_monitoring", // Mid-Stimulation Monitoring
  "step3_trigger", // Ovulation Trigger
  "step4_opu", // Oocyte Pick-Up (OPU)
  "step5_fertilization", // Fertilization/Lab
  "step6_embryo_culture", // Embryo Culture
  "step7_embryo_transfer", // Embryo Transfer
];

// IUI Steps (7 steps matching backend TreatmentStepType enum)
const IUI_STEPS: IUIStep[] = [
  "step0_pre_cycle_prep", // Pre-Cycle Preparation
  "step1_day2_3_assessment", // Day 2-3 Assessment
  "step2_follicle_monitoring", // Day 7-10 Follicle Monitoring
  "step3_trigger", // Day 10-12 Trigger
  "step4_iui_procedure", // IUI Procedure
  "step5_post_iui", // Post-IUI Monitoring
  "step6_beta_hcg", // Beta HCG Test
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

  // Ensure currentCycle has treatmentType
  const currentCycle = useMemo(() => {
    let treatmentType: "IUI" | "IVF" | undefined = undefined;

    // First, try cycle.treatmentType
    if (
      rawCurrentCycle.treatmentType === "IUI" ||
      rawCurrentCycle.treatmentType === "IVF"
    ) {
      treatmentType = rawCurrentCycle.treatmentType;
    }
    // Then try treatmentData?.treatmentType
    else if (treatmentData?.treatmentType) {
      const type = String(treatmentData.treatmentType).toUpperCase();
      if (type === "IUI") treatmentType = "IUI";
      else if (type === "IVF") treatmentType = "IVF";
    }
    // Try to infer from cycleName if available (e.g., "IVF Treatment Plan 2025 - Pre-Cycle Preparation")
    else if (rawCurrentCycle.cycleName) {
      const cycleNameUpper = rawCurrentCycle.cycleName.toUpperCase();
      if (cycleNameUpper.includes("IVF")) {
        treatmentType = "IVF";
      } else if (cycleNameUpper.includes("IUI")) {
        treatmentType = "IUI";
      }
    }
    // Try to infer from allCyclesData if available
    else if (allCyclesDataForType && allCyclesDataForType.length > 0) {
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
  }, [rawCurrentCycle, treatmentData, allCyclesDataForType]);

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

  // Fetch appointments for this patient (to allow selecting any appointment for medical record)
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

  // Fetch service requests for this patient
  const { data: serviceRequestsData } = useQuery({
    queryKey: ["service-requests", "patient", currentCycle.patientId],
    queryFn: async () => {
      if (!currentCycle.patientId) return [];
      try {
        const response = await api.serviceRequest.getServiceRequests({
          patientId: currentCycle.patientId,
          pageNumber: 1,
          pageSize: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentCycle.patientId,
  });

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
  const finalAllCyclesData = allCyclesDataForType || allCyclesData || [];

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
        stepTypeStr.includes("POSTIUI") ||
        stepTypeStr.includes("POST_IUI")
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
        return "step2_monitoring";
      }
      if (stepTypeStr === "IVF_TRIGGER" || stepTypeStr.includes("TRIGGER")) {
        return "step3_trigger";
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
        stepTypeStr.includes("FERTILIZATION") ||
        stepTypeStr.includes("ICSI")
      ) {
        return "step5_fertilization";
      }
      if (
        stepTypeStr === "IVF_EMBRYOCULTURE" ||
        stepTypeStr.includes("EMBRYOCULTURE") ||
        stepTypeStr.includes("CULTURE")
      ) {
        return "step6_embryo_culture";
      }
      if (
        stepTypeStr === "IVF_EMBRYOTRANSFER" ||
        stepTypeStr.includes("EMBRYOTRANSFER") ||
        stepTypeStr.includes("TRANSFER")
      ) {
        return "step7_embryo_transfer";
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
      // Step 7: Beta HCG Test (IUI_BetaHCGTest) - check first to avoid conflicts
      if (
        nameLower.includes("beta") ||
        nameLower.includes("hcg") ||
        (nameLower.includes("pregnancy") && nameLower.includes("test")) ||
        nameLower.includes("14 days")
      ) {
        return "step6_beta_hcg";
      }
      // Step 6: Post-IUI Monitoring (IUI_PostIUI)
      if (
        nameLower.includes("post-iui") ||
        (nameLower.includes("post") && nameLower.includes("monitoring")) ||
        (nameLower.includes("post") && nameLower.includes("iui"))
      ) {
        return "step5_post_iui";
      }
      // Step 5: IUI Procedure (IUI_Procedure)
      if (
        (nameLower.includes("iui") && nameLower.includes("procedure")) ||
        nameLower.includes("insemination") ||
        (nameLower.includes("iui") && !nameLower.includes("post"))
      ) {
        return "step4_iui_procedure";
      }
      // Step 4: Day 10-12 Trigger (IUI_Day10_12_Trigger)
      if (
        nameLower.includes("day 10-12") ||
        (nameLower.includes("trigger") && !nameLower.includes("pregnancy"))
      ) {
        return "step3_trigger";
      }
      // Step 3: Day 7-10 Follicle Monitoring (IUI_Day7_10_FollicleMonitoring)
      if (
        nameLower.includes("day 7-10") ||
        (nameLower.includes("follicle") && nameLower.includes("monitoring")) ||
        (nameLower.includes("monitoring") && !nameLower.includes("post"))
      ) {
        return "step2_follicle_monitoring";
      }
      // Step 2: Day 2-3 Assessment (IUI_Day2_3_Assessment)
      if (
        nameLower.includes("day 2-3") ||
        nameLower.includes("assessment") ||
        nameLower.includes("baseline")
      ) {
        return "step1_day2_3_assessment";
      }
      // Step 1: Pre-Cycle Preparation (IUI_PreCyclePreparation)
      if (
        nameLower.includes("pre-cycle") ||
        (nameLower.includes("preparation") && nameLower.includes("pre-cycle"))
      ) {
        return "step0_pre_cycle_prep";
      }
    } else if (treatmentType === "IVF") {
      // Step 8: Embryo Transfer (IVF_EmbryoTransfer)
      if (
        nameLower.includes("embryo transfer") ||
        nameLower.includes("transfer") ||
        nameLower.includes("et")
      ) {
        return "step7_embryo_transfer";
      }
      // Step 7: Embryo Culture (IVF_EmbryoCulture)
      if (
        nameLower.includes("embryo culture") ||
        nameLower.includes("culture") ||
        nameLower.includes("blastocyst")
      ) {
        return "step6_embryo_culture";
      }
      // Step 6: Fertilization/Lab (IVF_Fertilization)
      if (
        nameLower.includes("fertilization") ||
        nameLower.includes("fertilization/lab") ||
        nameLower.includes("icsi") ||
        (nameLower.includes("lab") && !nameLower.includes("culture"))
      ) {
        return "step5_fertilization";
      }
      // Step 5: Oocyte Pick-Up (OPU) (IVF_OPU)
      if (
        nameLower.includes("retrieval") ||
        nameLower.includes("opu") ||
        nameLower.includes("oocyte") ||
        nameLower.includes("pick-up")
      ) {
        return "step4_opu";
      }
      // Step 4: Ovulation Trigger (IVF_Trigger)
      if (
        nameLower.includes("trigger") ||
        nameLower.includes("ovulation trigger")
      ) {
        return "step3_trigger";
      }
      // Step 3: Mid-Stimulation Monitoring (IVF_Monitoring)
      if (
        nameLower.includes("mid-stimulation") ||
        nameLower.includes("monitoring") ||
        (nameLower.includes("mid") && nameLower.includes("stimulation"))
      ) {
        return "step2_monitoring";
      }
      // Step 2: Controlled Ovarian Stimulation (IVF_StimulationStart)
      if (
        nameLower.includes("controlled ovarian stimulation") ||
        nameLower.includes("stimulation") ||
        nameLower.includes("cos") ||
        nameLower.includes("ovarian")
      ) {
        return "step1_stimulation";
      }
      // Step 1: Pre-Cycle Preparation (IVF_PreCyclePreparation)
      if (
        nameLower.includes("pre-cycle") ||
        (nameLower.includes("preparation") && nameLower.includes("pre-cycle"))
      ) {
        return "step0_pre_cycle_prep";
      }
    }

    return null;
  };

  // Get current step and next step - use same logic as HorizontalTreatmentTimeline
  const { currentStep, nextStep } = useMemo(() => {
    const isIVF = currentCycle.treatmentType === "IVF";
    const isIUI = currentCycle.treatmentType === "IUI";
    const stepList = isIVF ? IVF_STEPS : isIUI ? IUI_STEPS : [];

    if (stepList.length === 0) {
      return { currentStep: null, nextStep: null };
    }

    // First, try to get step from cycleName (same as HorizontalTreatmentTimeline)
    let currentStepValue: IVFStep | IUIStep | null = null;
    const completedStepsSet = new Set<IVFStep | IUIStep>();

    // Collect completedSteps from ALL cycles first (including currentCycle)
    // This is critical to understand which steps are already done across all cycles
    const allCyclesToCheck =
      finalAllCyclesData.length > 0
        ? [...finalAllCyclesData, currentCycle]
        : [currentCycle];

    // Process all cycles to build completedStepsSet
    for (const cycle of allCyclesToCheck) {
      // Add completedSteps from cycle.completedSteps field (this is the most reliable source)
      if (cycle.completedSteps) {
        cycle.completedSteps.forEach((step) => completedStepsSet.add(step));
      }

      // If cycle status is "Completed", map its stepType or cycleName to step and mark as completed
      const cycleStatus = normalizeTreatmentCycleStatus(cycle.status);
      if (cycleStatus === "Completed") {
        // PRIORITY: Use stepType if available (most accurate)
        let stepId: IVFStep | IUIStep | null = null;
        if (cycle.stepType) {
          stepId = mapStepTypeToStepId(
            cycle.stepType,
            cycle.treatmentType as "IUI" | "IVF" | undefined
          );
        }
        // Fallback to cycleName if stepType not available
        if (!stepId) {
          stepId = mapCycleNameToStep(
            cycle.cycleName,
            cycle.treatmentType as "IUI" | "IVF" | undefined
          );
        }
        if (stepId) {
          completedStepsSet.add(stepId);
        }
      }
    }

    // PRIORITY 1: Check cycles with Scheduled or InProgress status first (these are the most active)
    // Sort cycles by orderIndex or cycleNumber to process in order
    const sortedCyclesForCurrent = [...allCyclesToCheck].sort((a, b) => {
      const orderA = a.orderIndex ?? a.cycleNumber ?? 0;
      const orderB = b.orderIndex ?? b.cycleNumber ?? 0;
      return orderA - orderB;
    });

    // First, prioritize Scheduled cycles (status 7) - these are the immediate next steps
    const scheduledCycles = sortedCyclesForCurrent.filter((c) => {
      const status = normalizeTreatmentCycleStatus(c.status);
      return status === "Scheduled";
    });

    if (scheduledCycles.length > 0) {
      // Find the step for the most advanced scheduled cycle (highest step index)
      let maxStepIndex = -1;
      for (const scheduledCycle of scheduledCycles) {
        // PRIORITY: Use stepType if available
        let stepId: IVFStep | IUIStep | null = null;
        if (scheduledCycle.stepType) {
          stepId = mapStepTypeToStepId(
            scheduledCycle.stepType,
            scheduledCycle.treatmentType as "IUI" | "IVF" | undefined
          );
        }
        // Fallback to cycleName
        if (!stepId) {
          stepId = mapCycleNameToStep(
            scheduledCycle.cycleName,
            scheduledCycle.treatmentType as "IUI" | "IVF" | undefined
          );
        }
        if (stepId) {
          const stepIndex = stepList.findIndex((s) => s === stepId);
          // Only consider if step is not already completed
          if (stepIndex > maxStepIndex && !completedStepsSet.has(stepId)) {
            maxStepIndex = stepIndex;
            currentStepValue = stepId;
          }
        }
      }
    }

    // PRIORITY 2: If no Scheduled cycles, check InProgress cycles
    if (!currentStepValue) {
      const inProgressCycles = sortedCyclesForCurrent.filter((c) => {
        const status = normalizeTreatmentCycleStatus(c.status);
        return status === "InProgress";
      });

      if (inProgressCycles.length > 0) {
        let maxStepIndex = -1;
        for (const inProgressCycle of inProgressCycles) {
          const stepId = mapCycleNameToStep(
            inProgressCycle.cycleName,
            inProgressCycle.treatmentType as "IUI" | "IVF" | undefined
          );
          if (stepId) {
            const stepIndex = stepList.findIndex((s) => s === stepId);
            if (stepIndex > maxStepIndex && !completedStepsSet.has(stepId)) {
              maxStepIndex = stepIndex;
              currentStepValue = stepId;
            }
          }
        }
      }
    }

    // PRIORITY 3: If we haven't found currentStep from active cycles, use completedSteps to find next step
    // This ensures that if step 4 is completed, we show step 5 as current, not step 2
    if (!currentStepValue && completedStepsSet.size > 0) {
      const completedStepsArray = Array.from(completedStepsSet);
      let maxCompletedIndex = -1;
      for (const completedStep of completedStepsArray) {
        const stepIndex = stepList.findIndex((s) => s === completedStep);
        if (stepIndex > maxCompletedIndex) {
          maxCompletedIndex = stepIndex;
        }
      }
      // Move to next step after the last completed one
      if (maxCompletedIndex >= 0 && maxCompletedIndex < stepList.length - 1) {
        const nextStepAfterCompleted = stepList[maxCompletedIndex + 1];
        // Only use this if the next step is not already completed
        if (!completedStepsSet.has(nextStepAfterCompleted)) {
          currentStepValue = nextStepAfterCompleted;
        }
      }
    }

    // PRIORITY 4: If still not found, check Planned cycles
    if (!currentStepValue) {
      const plannedCycles = sortedCyclesForCurrent.filter((c) => {
        const status = normalizeTreatmentCycleStatus(c.status);
        return status === "Planned";
      });

      if (plannedCycles.length > 0) {
        let maxStepIndex = -1;
        for (const plannedCycle of plannedCycles) {
          const stepId = mapCycleNameToStep(
            plannedCycle.cycleName,
            plannedCycle.treatmentType as "IUI" | "IVF" | undefined
          );
          if (stepId && !completedStepsSet.has(stepId)) {
            const stepIndex = stepList.findIndex((s) => s === stepId);
            if (stepIndex > maxStepIndex) {
              maxStepIndex = stepIndex;
              currentStepValue = stepId;
            }
          }
        }
      }
    }

    // If not found from active cycles, check all non-completed cycles (same logic as timeline)
    if (!currentStepValue && finalAllCyclesData.length > 0) {
      const sortedCycles = [...finalAllCyclesData].sort((a, b) => {
        if (a.cycleNumber !== undefined && b.cycleNumber !== undefined) {
          return a.cycleNumber - b.cycleNumber;
        }
        if (a.startDate && b.startDate) {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        }
        return 0;
      });

      // Find cycles that are not completed, cancelled, or failed
      const nonCompletedCycles = sortedCycles.filter((c) => {
        const status = normalizeTreatmentCycleStatus(c.status);
        return (
          status !== "Completed" &&
          status !== "Cancelled" &&
          status !== "Failed"
        );
      });

      // Find the step for the most advanced non-completed cycle
      if (nonCompletedCycles.length > 0) {
        let maxStepIndex = -1;
        for (const nonCompletedCycle of nonCompletedCycles) {
          const stepId = mapCycleNameToStep(
            nonCompletedCycle.cycleName,
            nonCompletedCycle.treatmentType as "IUI" | "IVF" | undefined
          );
          if (stepId && !completedStepsSet.has(stepId)) {
            const stepIndex = stepList.findIndex((s) => s === stepId);
            if (stepIndex > maxStepIndex) {
              maxStepIndex = stepIndex;
              currentStepValue = stepId;
            }
          }
        }
      }

      // Collect completedSteps from all cycles
      for (const cycle of sortedCycles) {
        if (cycle.completedSteps) {
          cycle.completedSteps.forEach((step) => completedStepsSet.add(step));
        }
        // Also mark completed cycles as completed steps
        const cycleStatus = normalizeTreatmentCycleStatus(cycle.status);
        if (cycleStatus === "Completed") {
          // PRIORITY: Use stepType if available
          let stepId: IVFStep | IUIStep | null = null;
          if (cycle.stepType) {
            stepId = mapStepTypeToStepId(
              cycle.stepType,
              cycle.treatmentType as "IUI" | "IVF" | undefined
            );
          }
          // Fallback to cycleName
          if (!stepId) {
            stepId = mapCycleNameToStep(
              cycle.cycleName,
              cycle.treatmentType as "IUI" | "IVF" | undefined
            );
          }
          if (stepId) {
            completedStepsSet.add(stepId);
          }
        }
      }

      // If still not found, check completedSteps to determine next step
      if (!currentStepValue && completedStepsSet.size > 0) {
        const completedStepsArray = Array.from(completedStepsSet);
        let maxCompletedIndex = -1;
        for (const completedStep of completedStepsArray) {
          const stepIndex = stepList.findIndex((s) => s === completedStep);
          if (stepIndex > maxCompletedIndex) {
            maxCompletedIndex = stepIndex;
          }
        }
        // Move to next step after the last completed one
        if (maxCompletedIndex >= 0 && maxCompletedIndex < stepList.length - 1) {
          currentStepValue = stepList[maxCompletedIndex + 1];
        }
      }
    }

    // Fallback to cycle.currentStep if available, but only if it's not already completed
    if (!currentStepValue && currentCycle.currentStep) {
      // Check if currentStep is already completed
      if (!completedStepsSet.has(currentCycle.currentStep)) {
        currentStepValue = currentCycle.currentStep;
      } else {
        // If currentStep is completed, use completedSteps to find next step
        if (completedStepsSet.size > 0) {
          const completedStepsArray = Array.from(completedStepsSet);
          let maxCompletedIndex = -1;
          for (const completedStep of completedStepsArray) {
            const stepIndex = stepList.findIndex((s) => s === completedStep);
            if (stepIndex > maxCompletedIndex) {
              maxCompletedIndex = stepIndex;
            }
          }
          // Move to next step after the last completed one
          if (
            maxCompletedIndex >= 0 &&
            maxCompletedIndex < stepList.length - 1
          ) {
            currentStepValue = stepList[maxCompletedIndex + 1];
          }
        }
      }
    }

    // Final fallback to first step (only if no completed steps and no currentStep)
    if (!currentStepValue && completedStepsSet.size === 0) {
      currentStepValue = stepList[0];
    }

    const currentIndex = stepList.findIndex((s) => s === currentStepValue);
    const next =
      currentIndex >= 0 && currentIndex < stepList.length - 1
        ? stepList[currentIndex + 1]
        : null;

    return {
      currentStep: currentStepValue,
      nextStep: next,
    };
  }, [currentCycle, finalAllCyclesData]);

  // Mutation to advance to next step or next cycle
  const advanceStepMutation = useMutation({
    mutationFn: async (nextStepId: IVFStep | IUIStep | null) => {
      // Check if we're at the last step of current cycle
      const isLastStep = !nextStepId;

      if (isLastStep) {
        // Complete current cycle and move to next cycle
        const now = new Date().toISOString();

        // 1. Complete current cycle
        await api.treatmentCycle.updateTreatmentCycle(currentCycle.id, {
          status: "Completed",
          endDate: now,
          cycleName: currentCycle.cycleName,
          cycleNumber: currentCycle.cycleNumber,
          protocol: currentCycle.protocol,
          notes: currentCycle.notes,
          cost: currentCycle.cost ?? undefined,
        });

        // 2. Find and activate next cycle
        const allCycles = finalAllCyclesData || [];
        const sortedCycles = [...allCycles].sort((a, b) => {
          const orderA = a.orderIndex ?? a.cycleNumber ?? 0;
          const orderB = b.orderIndex ?? b.cycleNumber ?? 0;
          return orderA - orderB;
        });

        const currentCycleIndex = sortedCycles.findIndex(
          (c) => c.id === currentCycle.id
        );

        if (
          currentCycleIndex >= 0 &&
          currentCycleIndex < sortedCycles.length - 1
        ) {
          const nextCycle = sortedCycles[currentCycleIndex + 1];
          const nextCycleStatus = normalizeTreatmentCycleStatus(
            nextCycle.status
          );

          // Activate next cycle if it's Planned or Scheduled
          if (
            nextCycleStatus === "Planned" ||
            nextCycleStatus === "Scheduled"
          ) {
            await api.treatmentCycle.updateTreatmentCycle(nextCycle.id, {
              status: "InProgress",
              startDate: now,
              cycleName: nextCycle.cycleName,
              cycleNumber: nextCycle.cycleNumber,
              protocol: nextCycle.protocol,
              notes: nextCycle.notes,
              cost: nextCycle.cost ?? undefined,
            });
          }
        }

        return {
          completed: true,
          nextCycle: currentCycleIndex < sortedCycles.length - 1,
        };
      } else {
        // Advance to next step in current cycle
        const currentCompleted = currentCycle.completedSteps || [];
        const newCompleted = [
          ...new Set([...currentCompleted, currentCycle.currentStep!]),
        ];

        // Use updateTreatmentCycle API (PUT /api/treatment-cycles/{id})
        return api.treatmentCycle.updateTreatmentCycle(currentCycle.id, {
          status: "InProgress",
          cycleName: currentCycle.cycleName,
          cycleNumber: currentCycle.cycleNumber,
          protocol: currentCycle.protocol,
          notes: currentCycle.notes,
          cost: currentCycle.cost ?? undefined,
          // Legacy fields for backward compatibility
          currentStep: nextStepId,
          completedSteps: newCompleted,
          stepDates: {
            ...(currentCycle.stepDates || {}),
            [currentCycle.currentStep!]: new Date().toISOString(),
            [nextStepId]: new Date().toISOString(),
          },
        });
      }
    },
    onSuccess: (result) => {
      if (result && typeof result === "object" && "completed" in result) {
        if (result.completed && result.nextCycle) {
          toast.success("Cycle completed and moved to next cycle");
        } else if (result.completed) {
          toast.success("Cycle completed");
        }
      } else {
        toast.success("Advanced to next treatment stage");
      }
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", currentCycle.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["treatment-cycles", "treatment", currentCycle.treatmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments", "patient", currentCycle.patientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["samples", "cycle", currentCycle.id],
      });
      onStepAdvanced?.();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to advance to next stage"
      );
    },
  });

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

  const handleAdvanceStep = () => {
    if (!nextStep) {
      // At the last step - complete current cycle and move to next cycle
      advanceStepMutation.mutate(null);
    } else {
      // Advance to next step in current cycle
      advanceStepMutation.mutate(nextStep);
    }
  };

  const handleCreateMedicalRecord = (data: MedicalRecordFormData) => {
    createMedicalRecordMutation.mutate(data);
  };

  // Helper function to get step label (matching backend TreatmentStepType enum)
  const getStepLabel = (step: IVFStep | IUIStep | null): string => {
    if (!step) return "Unknown";

    const stepLabels: Record<string, string> = {
      // IVF steps (8 steps)
      step0_pre_cycle_prep: "Pre-Cycle Preparation",
      step1_stimulation: "Controlled Ovarian Stimulation",
      step2_monitoring: "Mid-Stimulation Monitoring",
      step3_trigger: "Ovulation Trigger",
      step4_opu: "Oocyte Pick-Up (OPU)",
      step5_fertilization: "Fertilization/Lab",
      step6_embryo_culture: "Embryo Culture",
      step7_embryo_transfer: "Embryo Transfer",
      // IUI steps (7 steps)
      step1_day2_3_assessment: "Day 2-3 Assessment",
      step2_follicle_monitoring: "Day 7-10 Follicle Monitoring",
      step4_iui_procedure: "IUI Procedure",
      step5_post_iui: "Post-IUI Monitoring",
      step6_beta_hcg: "Beta HCG Test",
    };

    return stepLabels[step] || step;
  };

  const appointmentsCount = appointmentsData?.length || 0;
  const samplesCount = samplesData?.length || 0;
  const agreementsCount = agreementsData?.length || 0;

  return (
    <div className="space-y-6">
      {/* Treatment Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Current Treatment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <HorizontalTreatmentTimeline
            cycle={currentCycle}
            allCycles={finalAllCyclesData}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
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
          {(() => {
            const normalizedStatus = normalizeTreatmentCycleStatus(
              currentCycle.status
            );
            // Check if there's a next cycle available
            const allCycles = finalAllCyclesData || [];
            const sortedCycles = [...allCycles].sort((a, b) => {
              const orderA = a.orderIndex ?? a.cycleNumber ?? 0;
              const orderB = b.orderIndex ?? b.cycleNumber ?? 0;
              return orderA - orderB;
            });
            const currentCycleIndex = sortedCycles.findIndex(
              (c) => c.id === currentCycle.id
            );
            const hasNextCycle =
              currentCycleIndex >= 0 &&
              currentCycleIndex < sortedCycles.length - 1;

            return (
              normalizedStatus !== "Completed" &&
              normalizedStatus !== "Cancelled" && (
                <div className="flex flex-wrap gap-2">
                  {nextStep ? (
                    <Button
                      onClick={handleAdvanceStep}
                      disabled={advanceStepMutation.isPending}
                    >
                      {advanceStepMutation.isPending
                        ? "Advancing..."
                        : "Advance to Next Stage"}
                    </Button>
                  ) : hasNextCycle ? (
                    <Button
                      onClick={handleAdvanceStep}
                      disabled={advanceStepMutation.isPending}
                    >
                      {advanceStepMutation.isPending
                        ? "Completing..."
                        : "Complete Cycle & Move to Next"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAdvanceStep}
                      disabled={advanceStepMutation.isPending}
                    >
                      {advanceStepMutation.isPending
                        ? "Completing..."
                        : "Complete Cycle"}
                    </Button>
                  )}
                  {(normalizedStatus === "Planned" ||
                    normalizedStatus === "Scheduled") &&
                    !currentCycle.currentStep && (
                      <Button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          try {
                            // Use POST /api/treatment-cycles/{id}/start
                            const response =
                              await api.treatmentCycle.startTreatmentCycle(
                                currentCycle.id,
                                {
                                  startDate: new Date().toISOString(),
                                }
                              );

                            // Update query data immediately with response data
                            if (response.data) {
                              queryClient.setQueryData(
                                ["doctor", "treatment-cycle", currentCycle.id],
                                response.data
                              );
                            }

                            toast.success("Cycle started successfully");

                            // Invalidate queries without immediate refetch to avoid page reload
                            // Use refetchType: 'none' to prevent automatic refetch
                            queryClient.invalidateQueries({
                              queryKey: [
                                "doctor",
                                "treatment-cycle",
                                currentCycle.id,
                              ],
                              refetchType: "none", // Don't refetch immediately
                            });

                            // Invalidate other queries in background (non-blocking)
                            setTimeout(() => {
                              queryClient.invalidateQueries({
                                queryKey: ["doctor", "treatment-cycles"],
                                refetchType: "none",
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "treatment-cycles",
                                  "treatment",
                                  currentCycle.treatmentId,
                                ],
                                refetchType: "none",
                              });
                            }, 100);

                            // Don't call onStepAdvanced when starting cycle
                            // Only call it when actually advancing a step
                            // onStepAdvanced?.();
                          } catch (error: any) {
                            toast.error(
                              error?.response?.data?.message ||
                                "Failed to start cycle"
                            );
                          }
                        }}
                      >
                        Start Cycle
                      </Button>
                    )}
                  {normalizedStatus === "InProgress" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setShowCompleteConfirm(true)}
                      >
                        Complete Cycle
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        Cancel Cycle
                      </Button>
                    </>
                  )}
                  {/* Only show Create Medical Record button if cycle has been started */}
                  {(() => {
                    const cycleStatus = normalizeTreatmentCycleStatus(
                      currentCycle.status
                    );
                    // Cycle is considered started if:
                    // 1. Status is "InProgress" (actively running)
                    // 2. Has currentStep (cycle has progressed to a step)
                    // 3. Has startDate (cycle has been started)
                    // Note: "Scheduled" and "Planned" are not considered started
                    const hasStarted =
                      cycleStatus === "InProgress" ||
                      !!currentCycle.currentStep ||
                      !!currentCycle.startDate;

                    if (!hasStarted) {
                      return null;
                    }

                    return (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setShowMedicalRecordForm(!showMedicalRecordForm)
                        }
                      >
                        {showMedicalRecordForm
                          ? "Cancel Medical Record"
                          : "Create Medical Record"}
                      </Button>
                    );
                  })()}
                  {/* Only show Create Service Request button if cycle has been started */}
                  {(() => {
                    const cycleStatus = normalizeTreatmentCycleStatus(
                      currentCycle.status
                    );
                    const hasStarted =
                      cycleStatus === "InProgress" ||
                      !!currentCycle.currentStep ||
                      !!currentCycle.startDate;

                    if (!hasStarted) {
                      return null;
                    }

                    return (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowServiceRequestModal(true)}
                      >
                        Create Service Request
                      </Button>
                    );
                  })()}
                </div>
              )
            );
          })()}
        </CardContent>
      </Card>

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
                  switch (status) {
                    case "Pending":
                      return "bg-amber-100 text-amber-800";
                    case "Approved":
                      return "bg-blue-100 text-blue-700";
                    case "Completed":
                      return "bg-emerald-100 text-emerald-700";
                    case "Cancelled":
                    case "Rejected":
                      return "bg-rose-100 text-rose-700";
                    default:
                      return "bg-gray-100 text-gray-700";
                  }
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
                  return new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value);
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
                            {request.requestCode || request.id.slice(0, 8)}
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
    </div>
  );
}
