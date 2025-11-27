/**
 * Horizontal Treatment Timeline Component
 * Displays the treatment cycle progress as a horizontal timeline
 * Supports both IVF (8 steps) and IUI (7 steps)
 * Uses backend API to get the most accurate current step
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/utils/cn";
import { api } from "@/api/client";
import {
  normalizeTreatmentCycleStatus,
  type TreatmentCycle,
  type IVFStep,
  type IUIStep,
} from "@/api/types";

interface HorizontalTreatmentTimelineProps {
  cycle: TreatmentCycle;
  allCycles?: TreatmentCycle[]; // All cycles for the treatment to determine progress
  onStepClick?: (step: IVFStep | IUIStep) => void;
  className?: string;
}

// IVF Step definitions (8 steps matching backend TreatmentStepType enum)
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

// IUI Step definitions (7 steps matching backend TreatmentStepType enum)
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

// Map stepType enum from backend to frontend step IDs
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
}

// Map cycle names to step IDs (fallback when stepType is not available)
function mapCycleNameToStep(
  cycleName: string | undefined,
  treatmentType: "IUI" | "IVF" | undefined
): IVFStep | IUIStep | null {
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
      (nameLower.includes("iui") &&
        !nameLower.includes("post") &&
        !nameLower.includes("pre"))
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
      (nameLower.includes("culture") && !nameLower.includes("embryo transfer"))
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
      (nameLower.includes("monitoring") && !nameLower.includes("post"))
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
}

export function HorizontalTreatmentTimeline({
  cycle,
  allCycles = [],
  onStepClick,
  className,
}: HorizontalTreatmentTimelineProps) {
  // Normalize treatmentType
  const normalizedTreatmentType = useMemo(() => {
    const type = cycle.treatmentType;
    if (!type) return null;
    const typeUpper = String(type).toUpperCase();
    if (typeUpper === "IVF") return "IVF";
    if (typeUpper === "IUI") return "IUI";
    return null;
  }, [cycle.treatmentType]);

  const isIVF = normalizedTreatmentType === "IVF";
  const isIUI = normalizedTreatmentType === "IUI";
  const steps = isIVF ? IVF_STEPS : isIUI ? IUI_STEPS : [];

  // Fetch current step from backend API (most accurate source)
  const { data: currentStepFromApi } = useQuery({
    queryKey: [
      "treatment-current-step",
      cycle.treatmentId,
      normalizedTreatmentType,
    ],
    queryFn: async () => {
      if (!cycle.treatmentId || !normalizedTreatmentType) return null;
      try {
        if (isIUI) {
          const response = await api.treatmentIUI.getCurrentStep(
            cycle.treatmentId
          );
          return response.data ?? null;
        } else if (isIVF) {
          const response = await api.treatmentIVF.getCurrentStep(
            cycle.treatmentId
          );
          return response.data ?? null;
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!cycle.treatmentId && !!normalizedTreatmentType,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Helper to convert step number from API to step ID
  // API returns 0-based index (0 = first step, 1 = second step, 2 = third step, etc.)
  // Based on backend: 0 = Pre-Cycle, 1 = Stimulation, 2 = Monitoring, etc.
  const getStepIdFromNumber = (
    stepNumber: number | null | undefined
  ): IVFStep | IUIStep | undefined => {
    if (stepNumber === null || stepNumber === undefined) return undefined;
    // API returns 0-based index: 0 = step0, 1 = step1, 2 = step2, etc.
    if (stepNumber >= 0 && stepNumber < steps.length) {
      return steps[stepNumber].id;
    }
    return undefined;
  };

  // Calculate current step and completed steps
  const { currentStep, completedSteps } = useMemo(() => {
    const treatmentCycles = allCycles.length > 0 ? allCycles : [cycle];

    // Determine current step FIRST (before collecting completed steps)
    let currentStepValue: IVFStep | IUIStep | undefined = undefined;

    // PRIORITY 1: Use current step from backend API (most accurate)
    if (currentStepFromApi !== null && currentStepFromApi !== undefined) {
      const stepFromApi = getStepIdFromNumber(currentStepFromApi);
      if (stepFromApi) {
        currentStepValue = stepFromApi;
      }
    }

    // Now collect completed steps, but EXCLUDE current step
    const completedStepsSet = new Set<IVFStep | IUIStep>();

    // Collect completed steps from cycles with status "Completed"
    for (const treatmentCycle of treatmentCycles) {
      const cycleStatus = normalizeTreatmentCycleStatus(treatmentCycle.status);
      if (cycleStatus === "Completed") {
        // PRIORITY: Use stepType if available (most accurate)
        let stepId: IVFStep | IUIStep | null = null;
        if (treatmentCycle.stepType) {
          stepId = mapStepTypeToStepId(
            treatmentCycle.stepType,
            treatmentCycle.treatmentType || cycle.treatmentType
          );
        }
        // Fallback to cycleName if stepType not available
        if (!stepId) {
          stepId = mapCycleNameToStep(
            treatmentCycle.cycleName,
            treatmentCycle.treatmentType || cycle.treatmentType
          );
        }
        if (stepId) {
          // Only add if it's not the current step
          if (stepId !== currentStepValue) {
            completedStepsSet.add(stepId);
          }
        }
      }
      // Also check completedSteps field if available
      if (treatmentCycle.completedSteps) {
        treatmentCycle.completedSteps.forEach((step) => {
          // Only add if it's not the current step
          if (step !== currentStepValue) {
            completedStepsSet.add(step);
          }
        });
      }
    }

    // If we have current step from API, mark all steps BEFORE it as completed
    if (currentStepValue) {
      const currentStepIndex = steps.findIndex(
        (s) => s.id === currentStepValue
      );
      if (currentStepIndex > 0) {
        // Mark all steps before current step as completed
        for (let i = 0; i < currentStepIndex; i++) {
          completedStepsSet.add(steps[i].id);
        }
      }
    }

    // PRIORITY 2: If API didn't return a step, find from cycles
    if (!currentStepValue) {
      // Sort cycles by cycleNumber or orderIndex
      const sortedCycles = [...treatmentCycles].sort((a, b) => {
        const orderA = a.orderIndex ?? a.cycleNumber ?? 0;
        const orderB = b.orderIndex ?? b.cycleNumber ?? 0;
        return orderA - orderB;
      });

      // Look for Scheduled cycles first (most immediate next step)
      const scheduledCycles = sortedCycles.filter((c) => {
        const status = normalizeTreatmentCycleStatus(c.status);
        return status === "Scheduled";
      });

      if (scheduledCycles.length > 0) {
        let maxStepIndex = -1;
        for (const scheduledCycle of scheduledCycles) {
          // PRIORITY: Use stepType if available
          let stepId: IVFStep | IUIStep | null = null;
          if (scheduledCycle.stepType) {
            stepId = mapStepTypeToStepId(
              scheduledCycle.stepType,
              scheduledCycle.treatmentType || cycle.treatmentType
            );
          }
          // Fallback to cycleName
          if (!stepId) {
            stepId = mapCycleNameToStep(
              scheduledCycle.cycleName,
              scheduledCycle.treatmentType || cycle.treatmentType
            );
          }
          if (stepId && !completedStepsSet.has(stepId)) {
            const stepIndex = steps.findIndex((s) => s.id === stepId);
            if (stepIndex > maxStepIndex) {
              maxStepIndex = stepIndex;
              currentStepValue = stepId;
            }
          }
        }
      }

      // If no Scheduled, look for InProgress cycles
      if (!currentStepValue) {
        const inProgressCycles = sortedCycles.filter((c) => {
          const status = normalizeTreatmentCycleStatus(c.status);
          return status === "InProgress";
        });

        if (inProgressCycles.length > 0) {
          let maxStepIndex = -1;
          for (const inProgressCycle of inProgressCycles) {
            // PRIORITY: Use stepType if available
            let stepId: IVFStep | IUIStep | null = null;
            if (inProgressCycle.stepType) {
              stepId = mapStepTypeToStepId(
                inProgressCycle.stepType,
                inProgressCycle.treatmentType || cycle.treatmentType
              );
            }
            // Fallback to cycleName
            if (!stepId) {
              stepId = mapCycleNameToStep(
                inProgressCycle.cycleName,
                inProgressCycle.treatmentType || cycle.treatmentType
              );
            }
            if (stepId && !completedStepsSet.has(stepId)) {
              const stepIndex = steps.findIndex((s) => s.id === stepId);
              if (stepIndex > maxStepIndex) {
                maxStepIndex = stepIndex;
                currentStepValue = stepId;
              }
            }
          }
        }
      }

      // If still no current step, find first non-completed cycle
      if (!currentStepValue) {
        for (const treatmentCycle of sortedCycles) {
          const cycleStatus = normalizeTreatmentCycleStatus(
            treatmentCycle.status
          );
          if (
            cycleStatus !== "Completed" &&
            cycleStatus !== "Cancelled" &&
            cycleStatus !== "Failed"
          ) {
            // PRIORITY: Use stepType if available
            let stepId: IVFStep | IUIStep | null = null;
            if (treatmentCycle.stepType) {
              stepId = mapStepTypeToStepId(
                treatmentCycle.stepType,
                treatmentCycle.treatmentType || cycle.treatmentType
              );
            }
            // Fallback to cycleName
            if (!stepId) {
              stepId = mapCycleNameToStep(
                treatmentCycle.cycleName,
                treatmentCycle.treatmentType || cycle.treatmentType
              );
            }
            if (stepId && !completedStepsSet.has(stepId)) {
              currentStepValue = stepId;
              break;
            }
          }
        }
      }

      // If still no current step, calculate from completed steps
      if (!currentStepValue && completedStepsSet.size > 0) {
        const completedStepsArray = Array.from(completedStepsSet);
        let maxCompletedIndex = -1;
        for (const completedStep of completedStepsArray) {
          const stepIndex = steps.findIndex((s) => s.id === completedStep);
          if (stepIndex > maxCompletedIndex) {
            maxCompletedIndex = stepIndex;
          }
        }
        // Move to next step after the last completed one
        if (maxCompletedIndex >= 0 && maxCompletedIndex < steps.length - 1) {
          currentStepValue = steps[maxCompletedIndex + 1].id;
        }
      }

      // Final fallback: use cycle.currentStep if available
      if (!currentStepValue && cycle.currentStep) {
        currentStepValue = cycle.currentStep;
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
  }, [allCycles, cycle, steps, currentStepFromApi, isIUI, isIVF]);

  const currentStepIndex = useMemo(() => {
    if (!currentStep) return -1;
    return steps.findIndex((step) => step.id === currentStep);
  }, [currentStep, steps]);

  const completedStepsSet = useMemo(() => {
    return new Set(completedSteps);
  }, [completedSteps]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (steps.length === 0) return 0;
    if (currentStepIndex < 0) {
      // If no current step, show progress based on completed steps only
      return (completedStepsSet.size / steps.length) * 100;
    }
    // Calculate based on completed steps + current step
    const totalProgress = ((completedStepsSet.size + 1) / steps.length) * 100;
    return Math.min(100, totalProgress);
  }, [steps.length, completedStepsSet.size, currentStepIndex]);

  // Early return if treatment type not specified
  if (!isIVF && !isIUI) {
    return (
      <div className={cn("text-sm text-gray-500", className)}>
        Treatment type not specified
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Background timeline line */}
        <div className="absolute left-0 right-0 top-6 h-1 bg-gray-200" />
        {/* Progress line */}
        <div
          className="absolute left-0 top-6 h-1 bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Steps container */}
        <div className="relative flex items-start">
          {steps.map((step, index) => {
            const isCompleted = completedStepsSet.has(step.id);
            const isCurrent = currentStep === step.id;
            const isPast =
              currentStepIndex >= 0 && index < currentStepIndex && !isCompleted;

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
                onClick={() => onStepClick?.(step.id)}
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
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div
                  className={cn(
                    "mt-1 text-center",
                    onStepClick && "cursor-pointer hover:opacity-80"
                  )}
                >
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
    </div>
  );
}
