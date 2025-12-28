/**
 * Treatment Timeline Component
 * Displays the treatment cycle progress as a visual timeline
 * Supports both IVF (6 steps) and IUI (4 steps)
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import {
  normalizeTreatmentCycleStatus,
  type TreatmentCycle,
  type IVFStep,
  type IUIStep,
} from "@/api/types";

interface TreatmentTimelineProps {
  cycle: TreatmentCycle;
  onStepClick?: (step: IVFStep | IUIStep) => void;
  className?: string;
}

// IVF Step definitions (6 steps matching backend TreatmentStepType enum)
const IVF_STEPS: Array<{ id: IVFStep; label: string; description: string }> = [
  {
    id: "step0_pre_cycle_prep",
    label: "Initial Medical Examination",
    description: "Baseline visit, counseling, and protocol setup (3 days)",
  },
  {
    id: "step1_stimulation",
    label: "Ovarian Stimulation",
    description: "Controlled ovarian stimulation with monitoring (10 days)",
  },
  {
    id: "step4_opu",
    label: "Oocyte Retrieval and Sperm Collection",
    description: "OPU and partner sperm collection (1 day)",
  },
  {
    id: "step5_fertilization",
    label: "In Vitro Fertilization",
    description: "Fertilization/ICSI in the lab (1 day)",
  },
  {
    id: "step7_embryo_transfer",
    label: "Embryo Transfer",
    description: "Transfer planned per protocol (1 day)",
  },
  {
    id: "step6_beta_hcg",
    label: "Post-Transfer Follow-Up",
    description: "Monitoring and pregnancy test after transfer (14 days)",
  },
];

// IUI Step definitions (4 steps matching backend TreatmentStepType enum)
const IUI_STEPS: Array<{ id: IUIStep; label: string; description: string }> = [
  {
    id: "step0_pre_cycle_prep",
    label: "Initial Medical Examination",
    description: "Baseline visit, counseling, and protocol confirmation (3 days)",
  },
  {
    id: "step2_follicle_monitoring",
    label: "Ovarian Stimulation",
    description: "Stimulation with ultrasound/hormone monitoring (10 days)",
  },
  {
    id: "step4_iui_procedure",
    label: "Sperm Collection and Intrauterine Insemination",
    description: "Collect sample and perform insemination (1 day)",
  },
  {
    id: "step5_post_iui",
    label: "Post-Insemination Follow-Up",
    description: "Luteal support and monitoring until pregnancy test (14 days)",
  },
];

export function TreatmentTimeline({
  cycle,
  onStepClick,
  className,
}: TreatmentTimelineProps) {
  const isIVF = cycle.treatmentType === "IVF";
  const isIUI = cycle.treatmentType === "IUI";
  const steps = isIVF ? IVF_STEPS : isIUI ? IUI_STEPS : [];

  // Fetch current step from backend API (most accurate source)
  const { data: currentStepFromApi } = useQuery({
    queryKey: [
      "treatment-current-step",
      cycle.treatmentId,
      cycle.treatmentType,
    ],
    queryFn: async () => {
      if (!cycle.treatmentId || !cycle.treatmentType) return null;
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
    enabled: !!cycle.treatmentId && (isIUI || isIVF),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Helper to convert step number from API to step ID
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

  // Calculate currentStep and completedSteps
  const { currentStep, completedSteps } = useMemo(() => {
    // PRIORITY 1: Use currentStepFromApi (most accurate)
    if (currentStepFromApi !== null && currentStepFromApi !== undefined) {
      const stepFromApi = getStepIdFromNumber(currentStepFromApi);
      if (stepFromApi) {
        const currentIndex = steps.findIndex((s) => s.id === stepFromApi);
        // Mark all steps before current step as completed
        const completed = new Set<IVFStep | IUIStep>();
        if (currentIndex > 0) {
          for (let i = 0; i < currentIndex; i++) {
            completed.add(steps[i].id);
          }
        }
        // Also add any steps from cycle.completedSteps
        if (cycle.completedSteps) {
          cycle.completedSteps.forEach((step) => {
            if (step !== stepFromApi) {
              completed.add(step);
            }
          });
        }
        return {
          currentStep: stepFromApi,
          completedSteps: Array.from(completed),
        };
      }
    }

    // PRIORITY 2: Use cycle.currentStep if available
    if (cycle.currentStep) {
      const currentIndex = steps.findIndex((s) => s.id === cycle.currentStep);
      const completed = new Set<IVFStep | IUIStep>();
      // Mark all steps before current step as completed
      if (currentIndex > 0) {
        for (let i = 0; i < currentIndex; i++) {
          completed.add(steps[i].id);
        }
      }
      // Also add any steps from cycle.completedSteps
      if (cycle.completedSteps) {
        cycle.completedSteps.forEach((step) => {
          if (step !== cycle.currentStep) {
            completed.add(step);
          }
        });
      }
      return {
        currentStep: cycle.currentStep,
        completedSteps: Array.from(completed),
      };
    }

    // FALLBACK: Use cycle.completedSteps only
    return {
      currentStep: undefined,
      completedSteps: cycle.completedSteps || [],
    };
  }, [currentStepFromApi, cycle.currentStep, cycle.completedSteps, steps, isIUI, isIVF]);

  const currentStepIndex = useMemo(() => {
    if (!currentStep) return -1;
    return steps.findIndex((step) => step.id === currentStep);
  }, [currentStep, steps]);

  const completedStepsSet = useMemo(() => {
    return new Set(completedSteps);
  }, [completedSteps]);

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
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Steps */}
        <div className="relative space-y-6">
          {steps.map((step, index) => {
            const isCompleted = completedStepsSet.has(step.id);
            const isCurrent = currentStep === step.id;
            const isPast = currentStepIndex > index;

            return (
              <div
                key={step.id}
                className="relative flex items-start gap-4"
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted || isPast
                      ? "border-green-500 bg-green-500 text-white"
                      : isCurrent
                        ? "border-primary bg-primary text-white shadow-lg"
                        : "border-gray-300 bg-white text-gray-400"
                  )}
                >
                  {isCompleted || isPast ? (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step content */}
                <div
                  className={cn(
                    "flex-1 pb-6",
                    onStepClick && "cursor-pointer hover:opacity-80"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      isCurrent
                        ? "border-primary bg-primary/5 shadow-sm"
                        : isCompleted || isPast
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className={cn(
                            "font-semibold",
                            isCurrent
                              ? "text-primary"
                              : isCompleted || isPast
                                ? "text-green-700"
                                : "text-gray-600"
                          )}
                        >
                          {step.label}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {step.description}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-white">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Progress: {completedStepsSet.size}/{steps.length} steps
          </span>
          <span
            className={cn(
              "font-semibold",
              (() => {
                const status = normalizeTreatmentCycleStatus(cycle.status);
                return status === "Completed"
                  ? "text-green-600"
                  : status === "InProgress"
                    ? "text-primary"
                    : "text-gray-500";
              })()
            )}
          >
            {(() => {
              const status = normalizeTreatmentCycleStatus(cycle.status);
              return status === "Completed"
                ? "Completed"
                : status === "InProgress"
                  ? "In Progress"
                  : status === "Cancelled"
                    ? "Cancelled"
                    : "Planned";
            })()}
          </span>
        </div>
      </div>
    </div>
  );
}
