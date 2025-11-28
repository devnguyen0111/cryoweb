/**
 * Treatment Detail Form Component
 * View detailed information for IUI/IVF treatments
 */

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { isAxiosError } from "axios";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { StructuredNote } from "@/components/StructuredNote";
import { TreatmentPlanSignature } from "@/features/doctor/treatment-cycles/TreatmentPlanSignature";
import type { IVFStep, IUIStep } from "@/api/types";
import { normalizeTreatmentCycleStatus as normalizeStatus } from "@/api/types";

interface TreatmentDetailFormProps {
  treatmentId: string;
  layout?: "page" | "modal";
  onClose?: () => void;
}

// Helper component to display field
function DetailField({
  label,
  value,
  placeholder = "—",
}: {
  label: string;
  value: string | number | null | undefined;
  placeholder?: string;
}) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? placeholder
      : typeof value === "number"
        ? value.toString()
        : value;

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{displayValue}</p>
    </div>
  );
}

// Helper component to display date field
function DateField({
  label,
  value,
  placeholder = "—",
}: {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
}) {
  const displayValue =
    value && value !== null
      ? new Date(value).toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : placeholder;

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{displayValue}</p>
    </div>
  );
}

// IUI Step definitions (7 steps matching backend TreatmentStepType enum) - same as HorizontalTreatmentTimeline
const IUI_STEPS: Array<{ id: IUIStep; label: string }> = [
  {
    id: "step0_pre_cycle_prep",
    label: "Pre-Cycle Preparation",
  },
  {
    id: "step1_day2_3_assessment",
    label: "Assessment",
  },
  {
    id: "step2_follicle_monitoring",
    label: "Follicle Monitoring",
  },
  {
    id: "step3_trigger",
    label: "Trigger",
  },
  {
    id: "step4_iui_procedure",
    label: "IUI Procedure",
  },
  {
    id: "step5_post_iui",
    label: "Post-IUI Monitoring",
  },
  {
    id: "step6_beta_hcg",
    label: "Beta HCG Test",
  },
];

// IVF Step definitions (8 steps matching backend TreatmentStepType enum) - same as HorizontalTreatmentTimeline
const IVF_STEPS: Array<{ id: IVFStep; label: string }> = [
  {
    id: "step0_pre_cycle_prep",
    label: "Pre-Cycle Preparation",
  },
  {
    id: "step1_stimulation",
    label: "Controlled Ovarian Stimulation",
  },
  {
    id: "step2_monitoring",
    label: "Mid-Stimulation Monitoring",
  },
  {
    id: "step3_trigger",
    label: "Ovulation Trigger",
  },
  {
    id: "step4_opu",
    label: "Oocyte Pick-Up (OPU)",
  },
  {
    id: "step5_fertilization",
    label: "Fertilization/Lab",
  },
  {
    id: "step6_embryo_culture",
    label: "Embryo Culture",
  },
  {
    id: "step7_embryo_transfer",
    label: "Embryo Transfer",
  },
];

// Map stepType enum from backend to frontend step IDs (same as HorizontalTreatmentTimeline)
function mapStepTypeToStepId(
  stepType: string | number | undefined,
  treatmentType: "IUI" | "IVF" | undefined
): IVFStep | IUIStep | null {
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
    if (stepTypeStr === "IUI_PROCEDURE" || stepTypeStr.includes("PROCEDURE")) {
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
      stepTypeStr.includes("FERTILIZATION")
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
}

export function TreatmentDetailForm({
  treatmentId,
  layout = "modal",
  onClose,
}: TreatmentDetailFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "workflow">(
    "overview"
  );
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Fetch treatment basic info
  const { data: treatmentData, isLoading: treatmentLoading } = useQuery({
    queryKey: ["treatment", treatmentId],
    queryFn: async () => {
      const response = await api.treatment.getTreatmentById(treatmentId);
      return response.data;
    },
    retry: false,
  });

  // Fetch IUI details if treatment type is IUI
  const { data: iuiData, isLoading: iuiLoading } = useQuery({
    queryKey: ["treatment-iui", treatmentId],
    queryFn: async () => {
      try {
        const response =
          await api.treatmentIUI.getIUIByTreatmentId(treatmentId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: treatmentData?.treatmentType === "IUI",
    retry: false,
  });

  // Fetch IVF details if treatment type is IVF
  const { data: ivfData, isLoading: ivfLoading } = useQuery({
    queryKey: ["treatment-ivf", treatmentId],
    queryFn: async () => {
      try {
        const response =
          await api.treatmentIVF.getIVFByTreatmentId(treatmentId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: treatmentData?.treatmentType === "IVF",
    retry: false,
  });

  // Fetch patient details
  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", treatmentData?.patientId],
    queryFn: async () => {
      if (!treatmentData?.patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(
          treatmentData.patientId
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!treatmentData?.patientId,
  });

  const isLoading = treatmentLoading || iuiLoading || ivfLoading;
  const treatmentType = treatmentData?.treatmentType;

  // Fetch all cycles for this treatment to show progress (same as HorizontalTreatmentTimeline)
  const { data: allCycles } = useQuery({
    queryKey: ["treatment-cycles", "treatment", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: treatmentId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled:
      !!treatmentId && (treatmentType === "IUI" || treatmentType === "IVF"),
    retry: false,
  });

  // Fetch current step from backend API (most accurate source) - same as HorizontalTreatmentTimeline
  const { data: currentStepFromApi } = useQuery({
    queryKey: ["treatment-current-step", treatmentId, treatmentType],
    queryFn: async () => {
      if (!treatmentId || !treatmentType) return null;
      try {
        if (treatmentType === "IUI") {
          const response = await api.treatmentIUI.getCurrentStep(treatmentId);
          return response.data ?? null;
        } else if (treatmentType === "IVF") {
          const response = await api.treatmentIVF.getCurrentStep(treatmentId);
          return response.data ?? null;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled:
      !!treatmentId && (treatmentType === "IUI" || treatmentType === "IVF"),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch agreement for treatment plan signature status (for IUI/IVF)
  const { data: agreement, isLoading: agreementLoading } = useQuery({
    queryKey: ["agreement", treatmentId],
    queryFn: async () => {
      if (
        !treatmentId ||
        (treatmentType !== "IUI" && treatmentType !== "IVF")
      ) {
        return null;
      }
      try {
        const response = await api.agreement.getAgreements({
          TreatmentId: treatmentId,
          Size: 1,
        });
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
    enabled:
      !!treatmentId && (treatmentType === "IUI" || treatmentType === "IVF"),
    retry: false,
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 3000, // Refetch every 3 seconds to catch signature updates
  });

  // Check if treatment plan is signed (for IUI/IVF)
  const isTreatmentPlanSigned = () => {
    if (treatmentType !== "IUI" && treatmentType !== "IVF") {
      return true; // Non-IUI/IVF treatments don't need signature
    }
    if (!agreement) {
      return false;
    }
    // Use new field names (signedByDoctor/signedByPatient) with fallback to legacy fields
    const doctorSigned =
      agreement.signedByDoctor ?? agreement.doctorSigned ?? false;
    const patientSigned =
      agreement.signedByPatient ?? agreement.patientSigned ?? false;
    return doctorSigned === true && patientSigned === true;
  };

  const treatmentPlanSigned = isTreatmentPlanSigned();
  const finalIsLoading = isLoading || agreementLoading;

  // Helper variables for agreement signature status
  // Use new field names (signedByDoctor/signedByPatient) with fallback to legacy fields
  const agreementDoctorSigned =
    agreement?.signedByDoctor ?? agreement?.doctorSigned ?? false;
  const agreementPatientSigned =
    agreement?.signedByPatient ?? agreement?.patientSigned ?? false;

  const workflowSteps =
    treatmentType === "IUI"
      ? IUI_STEPS
      : treatmentType === "IVF"
        ? IVF_STEPS
        : [];

  // Helper to convert step number from API to step ID (same as HorizontalTreatmentTimeline)
  const getStepIdFromNumber = (
    stepNumber: number | null | undefined,
    steps: Array<{ id: IVFStep | IUIStep; label: string }>
  ): IVFStep | IUIStep | undefined => {
    if (stepNumber === null || stepNumber === undefined) return undefined;
    // API returns 0-based index: 0 = step0, 1 = step1, 2 = step2, etc.
    if (stepNumber >= 0 && stepNumber < steps.length) {
      return steps[stepNumber].id;
    }
    return undefined;
  };

  // Calculate current step and completed steps (same logic as HorizontalTreatmentTimeline)
  const { currentStep, completedSteps } = useMemo(() => {
    const steps = workflowSteps;
    if (steps.length === 0) {
      return { currentStep: undefined, completedSteps: [] };
    }

    const treatmentCycles = allCycles || [];

    // Determine current step FIRST (before collecting completed steps)
    let currentStepValue: IVFStep | IUIStep | undefined = undefined;

    // PRIORITY 1: Use current step from backend API (most accurate)
    if (currentStepFromApi !== null && currentStepFromApi !== undefined) {
      const stepFromApi = getStepIdFromNumber(currentStepFromApi, steps);
      if (stepFromApi) {
        currentStepValue = stepFromApi;
      }
    }

    // Now collect completed steps, but EXCLUDE current step
    const completedStepsSet = new Set<IVFStep | IUIStep>();

    // Collect completed steps from cycles with status "Completed"
    for (const treatmentCycle of treatmentCycles) {
      const cycleStatus = normalizeStatus(treatmentCycle.status);
      if (cycleStatus === "Completed") {
        // PRIORITY: Use stepType if available (most accurate)
        let stepId: IVFStep | IUIStep | null = null;
        if (treatmentCycle.stepType) {
          const cycleTreatmentType = treatmentCycle.treatmentType;
          if (cycleTreatmentType === "IUI" || cycleTreatmentType === "IVF") {
            stepId = mapStepTypeToStepId(
              treatmentCycle.stepType,
              cycleTreatmentType
            );
          } else if (treatmentType === "IUI" || treatmentType === "IVF") {
            stepId = mapStepTypeToStepId(
              treatmentCycle.stepType,
              treatmentType
            );
          }
        }
        if (stepId) {
          completedStepsSet.add(stepId);
        }
      }
    }

    // PRIORITY 2: Check cycles with Scheduled or InProgress status for current step
    if (!currentStepValue) {
      const sortedCycles = [...treatmentCycles].sort((a, b) => {
        const aOrder = a.orderIndex ?? a.cycleNumber ?? 0;
        const bOrder = b.orderIndex ?? b.cycleNumber ?? 0;
        return bOrder - aOrder;
      });

      // First, look for Scheduled cycles
      const scheduledCycles = sortedCycles.filter((c) => {
        const status = normalizeStatus(c.status);
        return status === "Scheduled";
      });

      if (scheduledCycles.length > 0) {
        for (const scheduledCycle of scheduledCycles) {
          if (scheduledCycle.stepType) {
            const cycleTreatmentType = scheduledCycle.treatmentType;
            let stepId: IVFStep | IUIStep | null = null;
            if (cycleTreatmentType === "IUI" || cycleTreatmentType === "IVF") {
              stepId = mapStepTypeToStepId(
                scheduledCycle.stepType,
                cycleTreatmentType
              );
            } else if (treatmentType === "IUI" || treatmentType === "IVF") {
              stepId = mapStepTypeToStepId(
                scheduledCycle.stepType,
                treatmentType
              );
            }
            if (stepId) {
              currentStepValue = stepId;
              break;
            }
          }
        }
      }

      // If no Scheduled, look for InProgress cycles
      if (!currentStepValue) {
        const inProgressCycles = sortedCycles.filter((c) => {
          const status = normalizeStatus(c.status);
          return status === "InProgress";
        });

        if (inProgressCycles.length > 0) {
          for (const inProgressCycle of inProgressCycles) {
            if (inProgressCycle.stepType) {
              const cycleTreatmentType = inProgressCycle.treatmentType;
              let stepId: IVFStep | IUIStep | null = null;
              if (
                cycleTreatmentType === "IUI" ||
                cycleTreatmentType === "IVF"
              ) {
                stepId = mapStepTypeToStepId(
                  inProgressCycle.stepType,
                  cycleTreatmentType
                );
              } else if (treatmentType === "IUI" || treatmentType === "IVF") {
                stepId = mapStepTypeToStepId(
                  inProgressCycle.stepType,
                  treatmentType
                );
              }
              if (stepId) {
                currentStepValue = stepId;
                break;
              }
            }
          }
        }
      }

      // PRIORITY 3: Use cycle.currentStep if available
      if (!currentStepValue) {
        for (const cycle of sortedCycles) {
          if (cycle.currentStep) {
            currentStepValue = cycle.currentStep;
            break;
          }
        }
      }
    }

    // Ensure current step is not marked as completed
    if (currentStepValue) {
      completedStepsSet.delete(currentStepValue);
    }

    return {
      currentStep: currentStepValue,
      completedSteps: Array.from(completedStepsSet),
    };
  }, [allCycles, treatmentType, currentStepFromApi, workflowSteps]);

  const currentStepIndex = useMemo(() => {
    if (!currentStep) return -1;
    return workflowSteps.findIndex((step) => step.id === currentStep);
  }, [currentStep, workflowSteps]);

  const completedStepsSet = useMemo(() => {
    return new Set(completedSteps);
  }, [completedSteps]);

  // Mutation to update treatment status - currently unused
  /* const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      // Update IUI/IVF specific status if applicable
      if (treatmentType === "IUI" && iuiData) {
        // Get IUI ID - ensure it exists
        const iuiId = (iuiData as any).id;
        if (!iuiId) {
          throw new Error("IUI treatment ID is missing");
        }

        // Build full IUI payload with ALL required fields as per API spec
        // API requires all fields to be present, even if empty
        // Use nullish coalescing (??) to ensure we always have values
        const iuiPayload: TreatmentIUICreateUpdateRequest = {
          treatmentId: treatmentId,
          protocol: String((iuiData as any).protocol ?? ""),
          medications: String((iuiData as any).medications ?? ""),
          monitoring: String((iuiData as any).monitoring ?? ""),
          motileSpermCount: Number((iuiData as any).motileSpermCount ?? 0),
          numberOfAttempts: Number((iuiData as any).numberOfAttempts ?? 0),
          outcome: String((iuiData as any).outcome ?? ""),
          notes: String(iuiData?.notes ?? (iuiData as any).notes ?? ""),
          status: newStatus as IUICycleStatus, // Use IUICycleStatus enum value
        };

        // Always include date fields - API expects them in the payload
        // Format dates as ISO strings if they exist
        const ovulationDate = (iuiData as any).ovulationTriggerDate;
        if (ovulationDate) {
          // Ensure it's formatted as ISO string
          iuiPayload.ovulationTriggerDate =
            ovulationDate instanceof Date
              ? ovulationDate.toISOString()
              : String(ovulationDate);
        } else {
          // Include as null if not present - API may require the field to be present
          (iuiPayload as any).ovulationTriggerDate = null;
        }

        const inseminationDate =
          (iuiData as any).inseminationDate ?? iuiData.inseminationDate;
        if (inseminationDate) {
          // Ensure it's formatted as ISO string
          iuiPayload.inseminationDate =
            inseminationDate instanceof Date
              ? inseminationDate.toISOString()
              : String(inseminationDate);
        } else {
          // Include as null if not present - API may require the field to be present
          (iuiPayload as any).inseminationDate = null;
        }

        // Ensure all required fields are present
        console.log("Updating IUI with payload:", {
          iuiId,
          payload: iuiPayload,
        });

        // Call API with full payload
        await api.treatmentIUI.updateIUI(iuiId, iuiPayload);
      } else if (treatmentType === "IVF" && ivfData) {
        // Build full IVF payload with all required fields
        const ivfPayload: any = {
          treatmentId: treatmentId,
          protocol: (ivfData as any).protocol || "",
          notes: (ivfData as any).notes || "",
          status: newStatus,
        };

        // Include all IVF fields
        if ((ivfData as any).stimulationStartDate) {
          ivfPayload.stimulationStartDate = (
            ivfData as any
          ).stimulationStartDate;
        }
        if ((ivfData as any).oocyteRetrievalDate) {
          ivfPayload.oocyteRetrievalDate = (ivfData as any).oocyteRetrievalDate;
        }
        if ((ivfData as any).fertilizationDate) {
          ivfPayload.fertilizationDate = (ivfData as any).fertilizationDate;
        }
        if ((ivfData as any).transferDate) {
          ivfPayload.transferDate = (ivfData as any).transferDate;
        }
        if ((ivfData as any).oocytesRetrieved !== undefined) {
          ivfPayload.oocytesRetrieved = (ivfData as any).oocytesRetrieved;
        }
        if ((ivfData as any).oocytesMature !== undefined) {
          ivfPayload.oocytesMature = (ivfData as any).oocytesMature;
        }
        if ((ivfData as any).oocytesFertilized !== undefined) {
          ivfPayload.oocytesFertilized = (ivfData as any).oocytesFertilized;
        }
        if ((ivfData as any).embryosCultured !== undefined) {
          ivfPayload.embryosCultured = (ivfData as any).embryosCultured;
        }
        if ((ivfData as any).embryosTransferred !== undefined) {
          ivfPayload.embryosTransferred = (ivfData as any).embryosTransferred;
        }
        if ((ivfData as any).embryosCryopreserved !== undefined) {
          ivfPayload.embryosCryopreserved = (
            ivfData as any
          ).embryosCryopreserved;
        }
        if ((ivfData as any).embryosFrozen !== undefined) {
          ivfPayload.embryosFrozen = (ivfData as any).embryosFrozen;
        }
        if ((ivfData as any).outcome) {
          ivfPayload.outcome = (ivfData as any).outcome;
        }
        if ((ivfData as any).complications) {
          ivfPayload.complications = (ivfData as any).complications;
        }

        await api.treatmentIVF.updateIVF((ivfData as any).id, ivfPayload);
      }

      // For IUI/IVF, we don't update main treatment status via /status endpoint
      // because the status values are different (IUICycleStatus vs TreatmentStatus)
      // The IUI/IVF specific status update is sufficient
      // If needed, we can update treatment status separately using TreatmentStatus enum values
      // For now, we only update IUI/IVF specific status
    },
    onSuccess: () => {
      toast.success("Treatment status has been updated!");
      queryClient.invalidateQueries({
        queryKey: ["treatment", treatmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["treatment-iui", treatmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["treatment-ivf", treatmentId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Unable to update status");
    },
  }); */

  // Note: Step progression should be handled through treatment cycles, not directly through treatment status
  // This form is for viewing only. To update steps, use the treatment cycles page.

  // Early returns AFTER all hooks have been called
  if (finalIsLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading treatment details...
      </div>
    );
  }

  if (!treatmentData) {
    return (
      <div className="py-12 text-center text-red-500">
        Treatment not found or failed to load.
      </div>
    );
  }

  const patientName =
    patientDetails?.accountInfo?.username ||
    patientDetails?.patientCode ||
    treatmentData.patientId;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      {treatmentType === "IUI" || treatmentType === "IVF" ? (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("workflow")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "workflow"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Treatment Workflow
            </button>
          </nav>
        </div>
      ) : null}

      {/* Workflow Tab Content */}
      {activeTab === "workflow" &&
        (treatmentType === "IUI" || treatmentType === "IVF") && (
          <Card>
            <CardHeader>
              <CardTitle>Treatment Workflow {treatmentType}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Track the current treatment progress of the patient
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Signature Status Warning */}
              {!treatmentPlanSigned && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-amber-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900">
                        Treatment Plan Signature Required
                      </h3>
                      <p className="text-sm text-amber-800 mt-1">
                        This treatment plan must be signed by both the doctor
                        and patient before you can proceed with the treatment
                        workflow. Please complete the signature process in the
                        Overview tab.
                      </p>
                      {agreement && (
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                agreementDoctorSigned
                                  ? "text-green-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {agreementDoctorSigned ? (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              Doctor:{" "}
                              {agreementDoctorSigned ? "Signed" : "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                agreementPatientSigned
                                  ? "text-green-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {agreementPatientSigned ? (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              )}
                              Patient:{" "}
                              {agreementPatientSigned ? "Signed" : "Pending"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Progress Indicator - same style as HorizontalTreatmentTimeline */}
              <div className="relative">
                {/* Background timeline line */}
                <div className="absolute left-0 right-0 top-6 h-1 bg-gray-200" />
                {/* Progress line */}
                {currentStepIndex >= 0 && (
                  <div
                    className="absolute left-0 top-6 h-1 bg-blue-500 transition-all duration-500 ease-out"
                    style={{
                      width: `${((completedStepsSet.size + 1) / workflowSteps.length) * 100}%`,
                    }}
                  />
                )}

                {/* Steps container */}
                <div className="relative flex items-start">
                  {workflowSteps.map((step, index) => {
                    const isCompleted = completedStepsSet.has(step.id);
                    const isCurrent = currentStep === step.id;
                    const isPast =
                      currentStepIndex >= 0 &&
                      index < currentStepIndex &&
                      !isCompleted;

                    // Determine step state
                    const stepState = isCompleted
                      ? "completed"
                      : isCurrent
                        ? "current"
                        : isPast
                          ? "past"
                          : "pending";

                    return (
                      <div
                        key={step.id}
                        className="relative z-10 flex flex-1 flex-col items-center"
                      >
                        {/* Step circle */}
                        <div
                          className={cn(
                            "relative mb-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            stepState === "completed"
                              ? "border-green-500 bg-green-500 text-white shadow-md"
                              : stepState === "current"
                                ? "border-blue-500 bg-blue-500 text-white shadow-lg ring-2 ring-blue-200"
                                : stepState === "past"
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-gray-300 bg-white text-gray-400"
                          )}
                        >
                          {stepState === "completed" || stepState === "past" ? (
                            <svg
                              className="h-6 w-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-sm font-semibold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Step label */}
                        <div className="mt-1 text-center">
                          <p
                            className={cn(
                              "text-xs font-medium leading-tight",
                              stepState === "completed" || stepState === "past"
                                ? "text-green-700"
                                : stepState === "current"
                                  ? "text-blue-700 font-semibold"
                                  : "text-gray-500"
                            )}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Step Info */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Current Stage:{" "}
                      {currentStepIndex >= 0
                        ? workflowSteps[currentStepIndex]?.label
                        : "Not Started"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentStepIndex >= 0
                        ? `Step ${currentStepIndex + 1} of ${workflowSteps.length}`
                        : "Treatment workflow not started"}
                    </p>
                  </div>
                  {/* Step progression should be handled through treatment cycles page */}
                  {!treatmentPlanSigned && (
                    <Button
                      onClick={() => setActiveTab("overview")}
                      variant="outline"
                      className="ml-4"
                    >
                      Go to Overview to Sign
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Signature Modal */}
      {showSignatureModal &&
        treatmentData &&
        (treatmentType === "IUI" || treatmentType === "IVF") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <TreatmentPlanSignature
                treatmentId={treatmentId}
                patientId={treatmentData.patientId}
                treatmentType={treatmentType as "IUI" | "IVF"}
                agreementId={agreement?.id}
                onSigned={() => {
                  setShowSignatureModal(false);
                  // Invalidate all agreement queries to refresh UI everywhere
                  queryClient.invalidateQueries({
                    queryKey: ["agreement"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["agreement", treatmentId],
                  });
                  toast.success("Treatment plan signed successfully!");
                }}
                onClose={() => setShowSignatureModal(false)}
                layout="modal"
              />
            </div>
          </div>
        )}

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Treatment Plan Signature Status (for IUI/IVF) */}
          {(treatmentType === "IUI" || treatmentType === "IVF") && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Treatment Plan Signature Status</CardTitle>
                {!treatmentPlanSigned && (
                  <Button onClick={() => setShowSignatureModal(true)} size="sm">
                    Complete Signature
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {agreementLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading signature status...
                  </p>
                ) : agreement ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div
                        className={cn(
                          "rounded-lg border p-4",
                          agreementDoctorSigned
                            ? "border-green-200 bg-green-50"
                            : "border-amber-200 bg-amber-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Doctor Signature
                            </p>
                            <p className="text-sm text-gray-600">
                              {agreementDoctorSigned ? "Signed" : "Pending"}
                            </p>
                          </div>
                          {agreementDoctorSigned ? (
                            <svg
                              className="h-6 w-6 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-6 w-6 text-amber-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "rounded-lg border p-4",
                          agreementPatientSigned
                            ? "border-green-200 bg-green-50"
                            : "border-amber-200 bg-amber-50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Patient Signature
                            </p>
                            <p className="text-sm text-gray-600">
                              {agreementPatientSigned ? "Signed" : "Pending"}
                            </p>
                          </div>
                          {agreementPatientSigned ? (
                            <svg
                              className="h-6 w-6 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-6 w-6 text-amber-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    {treatmentPlanSigned && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">
                            Treatment plan is fully signed and approved. You can
                            now proceed with the treatment workflow.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">
                      No agreement found for this treatment plan. Please create
                      a treatment plan first.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Basic Treatment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailField
                  label="Treatment Code"
                  value={(() => {
                    const code =
                      treatmentData.treatmentCode || treatmentData.id;
                    if (!code) return null;
                    // Get last 4 characters
                    return code.length >= 4 ? code.slice(-4) : code;
                  })()}
                />
                <DetailField
                  label="Treatment Name"
                  value={treatmentData.treatmentName}
                />
                <DetailField label="Treatment Type" value={treatmentType} />
                <DetailField label="Status" value={treatmentData.status} />
                <DateField label="Start Date" value={treatmentData.startDate} />
                <DateField label="End Date" value={treatmentData.endDate} />
                <DetailField label="Patient" value={patientName} />
                <DetailField
                  label="Diagnosis"
                  value={treatmentData.diagnosis}
                />
                <DetailField label="Goals" value={treatmentData.goals} />
                {treatmentData.estimatedCost !== undefined && (
                  <DetailField
                    label="Estimated Cost"
                    value={`${treatmentData.estimatedCost?.toLocaleString()} VND`}
                  />
                )}
                {treatmentData.actualCost !== undefined && (
                  <DetailField
                    label="Actual Cost"
                    value={`${treatmentData.actualCost?.toLocaleString()} VND`}
                  />
                )}
                {treatmentData.notes && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Notes
                    </p>
                    <StructuredNote
                      note={treatmentData.notes}
                      agreement={agreement || undefined}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* IUI Specific Details */}
          {treatmentType === "IUI" && (
            <Card>
              <CardHeader>
                <CardTitle>IUI Treatment Details</CardTitle>
              </CardHeader>
              <CardContent>
                {iuiLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading IUI details...
                  </div>
                ) : iuiData ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label="Protocol"
                      value={(iuiData as any).protocol}
                    />
                    <DetailField
                      label="Medications"
                      value={(iuiData as any).medications}
                    />
                    <DetailField
                      label="Status"
                      value={(iuiData as any).status || iuiData.cycleStatus}
                    />
                    <DateField
                      label="Ovulation Trigger Date"
                      value={(iuiData as any).ovulationTriggerDate}
                    />
                    <DateField
                      label="Insemination Date"
                      value={
                        (iuiData as any).inseminationDate ||
                        iuiData.inseminationDate
                      }
                    />
                    <DetailField
                      label="Motile Sperm Count"
                      value={(iuiData as any).motileSpermCount}
                    />
                    <DetailField
                      label="Number of Attempts"
                      value={(iuiData as any).numberOfAttempts}
                    />
                    <DetailField
                      label="Outcome"
                      value={(iuiData as any).outcome}
                    />
                    {(iuiData as any).monitoring && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Monitoring Plan
                        </p>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {(iuiData as any).monitoring}
                        </p>
                      </div>
                    )}
                    {iuiData.notes && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Notes
                        </p>
                        <StructuredNote
                          note={iuiData.notes}
                          agreement={agreement || undefined}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No IUI details available. This treatment may not have
                    IUI-specific data yet.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* IVF Specific Details */}
          {treatmentType === "IVF" && (
            <Card>
              <CardHeader>
                <CardTitle>IVF Treatment Details</CardTitle>
              </CardHeader>
              <CardContent>
                {ivfLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading IVF details...
                  </div>
                ) : ivfData ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <DetailField
                      label="Protocol"
                      value={
                        (ivfData as any).protocol || ivfData.stimulationProtocol
                      }
                    />
                    <DetailField
                      label="Status"
                      value={(ivfData as any).status || ivfData.cycleStatus}
                    />
                    <DateField
                      label="Stimulation Start Date"
                      value={(ivfData as any).stimulationStartDate}
                    />
                    <DateField
                      label="Oocyte Retrieval Date"
                      value={
                        (ivfData as any).oocyteRetrievalDate ||
                        ivfData.retrievalDate
                      }
                    />
                    <DateField
                      label="Fertilization Date"
                      value={
                        (ivfData as any).fertilizationDate ||
                        ivfData.fertilizationDate
                      }
                    />
                    <DateField
                      label="Transfer Date"
                      value={
                        (ivfData as any).transferDate || ivfData.transferDate
                      }
                    />
                    <DetailField
                      label="Oocytes Retrieved"
                      value={(ivfData as any).oocytesRetrieved}
                    />
                    <DetailField
                      label="Oocytes Mature"
                      value={(ivfData as any).oocytesMature}
                    />
                    <DetailField
                      label="Oocytes Fertilized"
                      value={(ivfData as any).oocytesFertilized}
                    />
                    <DetailField
                      label="Embryos Cultured"
                      value={(ivfData as any).embryosCultured}
                    />
                    <DetailField
                      label="Embryos Transferred"
                      value={(ivfData as any).embryosTransferred}
                    />
                    <DetailField
                      label="Embryos Cryopreserved"
                      value={(ivfData as any).embryosCryopreserved}
                    />
                    <DetailField
                      label="Embryos Frozen"
                      value={(ivfData as any).embryosFrozen}
                    />
                    <DetailField
                      label="Outcome"
                      value={(ivfData as any).outcome}
                    />
                    <DetailField
                      label="Complications"
                      value={(ivfData as any).complications}
                    />
                    {ivfData.notes && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Notes
                        </p>
                        <StructuredNote
                          note={ivfData.notes}
                          agreement={agreement || undefined}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No IVF details available. This treatment may not have
                    IVF-specific data yet.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        {layout === "modal" ? (
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/doctor/encounters" })}
          >
            Back to Encounters
          </Button>
        )}
        {treatmentType === "IUI" && (
          <Button
            onClick={() =>
              navigate({
                to: "/doctor/treatment-cycles",
                search: { patientId: treatmentData.patientId },
              })
            }
          >
            View IUI Cycles
          </Button>
        )}
        {treatmentType === "IVF" && (
          <Button
            onClick={() =>
              navigate({
                to: "/doctor/treatment-cycles",
                search: { patientId: treatmentData.patientId },
              })
            }
          >
            View IVF Cycles
          </Button>
        )}
      </div>
    </div>
  );
}
