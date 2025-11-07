import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { TreatmentCycle } from "@/api/types";

type WorkflowStep = {
  id: string;
  label: string;
  description: string;
  fields: Array<{ name: string; label: string; placeholder: string }>;
};

export const Route = createFileRoute(
  "/doctor/treatment-cycles/$cycleId/workflow"
)({
  component: TreatmentWorkflowComponent,
});

function TreatmentWorkflowComponent() {
  const { cycleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const steps: WorkflowStep[] = useMemo(
    () => [
      {
        id: "stimulation",
        label: "Ovarian stimulation",
        description: "Track medications and ultrasound findings",
        fields: [
          {
            name: "protocol",
            label: "Protocol",
            placeholder: "Antagonist / Long / Short",
          },
          {
            name: "drugDosage",
            label: "Drug dosage",
            placeholder: "Gonal-F 225 IU",
          },
          {
            name: "follicleCount",
            label: "Dominant follicles",
            placeholder: "12 follicles >= 16 mm",
          },
        ],
      },
      {
        id: "opu",
        label: "Oocyte pickup (OPU)",
        description: "Capture OPU details",
        fields: [
          { name: "matureOocytes", label: "MII oocytes", placeholder: "8" },
          {
            name: "anesthesia",
            label: "Anesthesia",
            placeholder: "IV sedation",
          },
          {
            name: "complications",
            label: "Complications",
            placeholder: "None",
          },
        ],
      },
      {
        id: "lab",
        label: "Laboratory",
        description: "Track fertilization and culture",
        fields: [
          {
            name: "spermQuality",
            label: "Sperm quality",
            placeholder: "PR 80%, motility 4+",
          },
          { name: "fertilized", label: "Fertilized embryos", placeholder: "6" },
          {
            name: "embryoGrade",
            label: "Embryo grade",
            placeholder: "3AA, 4AB",
          },
        ],
      },
      {
        id: "transfer",
        label: "Embryo transfer",
        description: "Transfer or cryopreservation data",
        fields: [
          { name: "transferDay", label: "Transfer day", placeholder: "D5" },
          {
            name: "embryosTransferred",
            label: "Embryos transferred",
            placeholder: "1",
          },
          {
            name: "cryopreserved",
            label: "Embryos frozen",
            placeholder: "3 embryos vitrified",
          },
          {
            name: "outcome",
            label: "Outcome",
            placeholder: "Positive hCG / Negative",
          },
        ],
      },
    ],
    []
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [hasStarted, setHasStarted] = useState(false);

  const cycleQuery = useQuery<TreatmentCycle | null>({
    queryKey: ["doctor", "treatment-cycle", cycleId],
    retry: false,
    queryFn: async (): Promise<TreatmentCycle | null> => {
      try {
        const response =
          await api.treatmentCycle.getTreatmentCycleById(cycleId);
        return response.data ?? null;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          toast.warning("Treatment cycle not found or has been deleted.");
          navigate({ to: "/doctor/treatment-cycles" });
          return null;
        }
        const message =
          error?.response?.data?.message ||
          "Unable to load treatment cycle details.";
        toast.error(message);
        return null;
      }
    },
  });

  const cycleData = cycleQuery.data ?? null;

  useEffect(() => {
    if (cycleData?.status && cycleData.status !== "Planned") {
      setHasStarted(true);
    }
  }, [cycleData?.status]);

  const getStepNotes = (stepId: string) => {
    return Object.entries(formState)
      .filter(([key, value]) => key.startsWith(`${stepId}.`) && value)
      .map(([key, value]) => {
        const fieldKey = key.split(".")[1];
        return `${fieldKey}: ${value}`;
      })
      .join(" | ");
  };

  const startMutation = useMutation({
    mutationFn: (payload: { startDate?: string; notes?: string }) =>
      api.treatmentCycle.startTreatmentCycle(cycleId, payload),
    onSuccess: () => {
      setHasStarted(true);
      setCurrentStep((prev) => prev + 1);
      toast.success("Treatment cycle started.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycleId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to start the cycle. Please try again.";
      toast.error(message);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (payload: {
      endDate?: string;
      outcome: string;
      notes?: string;
    }) => api.treatmentCycle.completeTreatmentCycle(cycleId, payload),
    onSuccess: () => {
      toast.success("Treatment cycle completed.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      navigate({
        to: "/doctor/treatment-cycles/$cycleId",
        params: { cycleId },
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to complete the cycle. Please try again.";
      toast.error(message);
    },
  });

  const step = steps[currentStep];

  const handleChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [`${step.id}.${name}`]: value }));
  };

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) =>
      api.treatmentCycle.updateTreatmentCycle(cycleId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycleId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Unable to save cycle notes.";
      toast.error(message);
    },
  });

  const persistStepNotes = (stepId: string) => {
    const notes = getStepNotes(stepId);
    if (!notes?.trim()) {
      return;
    }

    const combinedNotes = [cycleData?.notes, notes].filter(Boolean).join("\n");
    updateNotesMutation.mutate(combinedNotes);
  };

  const goNext = () => {
    if (startMutation.isPending || completeMutation.isPending) {
      return;
    }

    if (
      cycleData?.status === "Completed" ||
      cycleData?.status === "Cancelled"
    ) {
      toast.error("This cycle has ended and cannot be updated.");
      return;
    }

    if (currentStep === 0 && !hasStarted) {
      startMutation.mutate({
        startDate: new Date().toISOString(),
        notes: getStepNotes("stimulation") || undefined,
      });
      return;
    }

    if (currentStep === steps.length - 1) {
      const outcome = formState["transfer.outcome"];
      if (!outcome) {
        toast.error("Enter a final outcome before completing the cycle.");
        return;
      }

      completeMutation.mutate({
        endDate: new Date().toISOString(),
        outcome,
        notes: getStepNotes("transfer") || undefined,
      });
      return;
    }

    persistStepNotes(step.id);
    setCurrentStep((prev) => prev + 1);
  };

  const goPrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">IUI/IVF workflow</h1>
            <p className="text-gray-600">
              Cycle: <span className="font-semibold">{cycleId}</span> - Step{" "}
              {currentStep + 1}/{steps.length}
            </p>
          </section>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle>{step.label}</CardTitle>
                <p className="text-sm text-gray-500">{step.description}</p>
                <div className="flex flex-wrap gap-2">
                  {steps.map((item, index) => (
                    <span
                      key={item.id}
                      className={
                        index === currentStep
                          ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                          : index < currentStep
                            ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
                      }
                    >
                      {index + 1}. {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {step.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <Input
                    placeholder={field.placeholder}
                    value={formState[`${step.id}.${field.name}`] || ""}
                    onChange={(event) =>
                      handleChange(field.name, event.target.value)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => toast.info("Current step saved temporarily.")}
                disabled={startMutation.isPending || completeMutation.isPending}
              >
                Save draft
              </Button>
              <Button
                onClick={goNext}
                disabled={startMutation.isPending || completeMutation.isPending}
              >
                {currentStep === steps.length - 1
                  ? completeMutation.isPending
                    ? "Completing..."
                    : "Finish"
                  : startMutation.isPending
                    ? "Starting..."
                    : "Continue"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Additional notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                - Each step will sync to reporting and cryobank once APIs are
                enabled.
              </p>
              <p>
                - The system will remind staff when a cryo witness double-check
                is required.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
