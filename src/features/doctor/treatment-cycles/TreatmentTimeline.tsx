/**
 * Treatment Timeline Component
 * Displays the treatment cycle progress as a visual timeline
 * Supports both IVF (7 steps) and IUI (6 steps)
 */

import { useMemo } from "react";
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

// IVF Step definitions (8 steps matching backend TreatmentStepType enum)
const IVF_STEPS: Array<{ id: IVFStep; label: string; description: string }> = [
  {
    id: "step0_pre_cycle_prep",
    label: "Pre-Cycle Preparation",
    description: "Pre-Cycle Preparation (~2 weeks before baseline)",
  },
  {
    id: "step1_stimulation",
    label: "Controlled Ovarian Stimulation",
    description: "COS - Controlled Ovarian Stimulation (Day 1)",
  },
  {
    id: "step2_monitoring",
    label: "Mid-Stimulation Monitoring",
    description: "Mid-Stimulation Monitoring (Day 4)",
  },
  {
    id: "step3_trigger",
    label: "Ovulation Trigger",
    description: "Ovulation Trigger (~Day 10)",
  },
  {
    id: "step4_opu",
    label: "Oocyte Pick-Up (OPU)",
    description: "OPU - Oocyte Pick-Up (~36h after trigger)",
  },
  {
    id: "step5_fertilization",
    label: "Fertilization/Lab",
    description: "Fertilization/ICSI at lab",
  },
  {
    id: "step6_embryo_culture",
    label: "Embryo Culture",
    description: "Embryo Culture (Day 3 checkpoint)",
  },
  {
    id: "step7_embryo_transfer",
    label: "Embryo Transfer",
    description: "Embryo Transfer (Day 5)",
  },
];

// IUI Step definitions (7 steps matching backend TreatmentStepType enum)
const IUI_STEPS: Array<{ id: IUIStep; label: string; description: string }> = [
  {
    id: "step0_pre_cycle_prep",
    label: "Pre-Cycle Preparation",
    description: "Pre-Cycle Preparation (~2 weeks before baseline)",
  },
  {
    id: "step1_day2_3_assessment",
    label: "Day 2-3 Assessment",
    description: "Baseline ultrasound/test (Day 2-3)",
  },
  {
    id: "step2_follicle_monitoring",
    label: "Day 7-10 Follicle Monitoring",
    description: "Follicle monitoring mid-cycle",
  },
  {
    id: "step3_trigger",
    label: "Day 10-12 Trigger",
    description: "Ovulation trigger planning",
  },
  {
    id: "step4_iui_procedure",
    label: "IUI Procedure",
    description: "IUI Insemination procedure",
  },
  {
    id: "step5_post_iui",
    label: "Post-IUI Monitoring",
    description: "Post-IUI care and monitoring",
  },
  {
    id: "step6_beta_hcg",
    label: "Beta HCG Test",
    description: "Pregnancy test 14 days after IUI",
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

  const currentStepIndex = useMemo(() => {
    if (!cycle.currentStep) return -1;
    return steps.findIndex((step) => step.id === cycle.currentStep);
  }, [cycle.currentStep, steps]);

  const completedStepsSet = useMemo(() => {
    return new Set(cycle.completedSteps || []);
  }, [cycle.completedSteps]);

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
            const isCurrent = cycle.currentStep === step.id;
            const isPast = currentStepIndex > index;

            const stepDate = cycle.stepDates?.[step.id];

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
