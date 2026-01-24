import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { Treatment } from "@/api/types";

type DiagnosisFormState = {
  diagnosisCodes: string;
  orders: string;
  referrals: string;
  attachments: string;
};

type DiagnosisSearchState = {
  patientId?: string;
  appointmentId?: string;
  treatmentId?: string;
};

export const Route = createFileRoute(
  "/doctor/encounters/$encounterId/diagnosis"
)({
  component: DoctorDiagnosisComponent,
  validateSearch: (
    search: {
      patientId?: string;
      appointmentId?: string;
      treatmentId?: string;
    } = {}
  ) => search,
});

function DoctorDiagnosisComponent() {
  const { encounterId } = Route.useParams();
  const navigate = useNavigate();
  const search = Route.useSearch() as DiagnosisSearchState;
  const treatmentId = search?.treatmentId || encounterId;
  const patientId = search?.patientId;
  const resolvedTreatmentId =
    treatmentId && treatmentId !== "draft" ? treatmentId : undefined;
  const [formState, setFormState] = useState<DiagnosisFormState>({
    diagnosisCodes: "",
    orders: "",
    referrals: "",
    attachments: "",
  });

  const { data: treatmentData, isFetching } = useQuery<Treatment | undefined>({
    queryKey: ["treatment", resolvedTreatmentId],
    enabled: !!resolvedTreatmentId,
    retry: false,
    queryFn: async (): Promise<Treatment | undefined> => {
      if (!resolvedTreatmentId) {
        return undefined;
      }

      try {
        const response =
          await api.treatment.getTreatmentById(resolvedTreatmentId);
        return response.data;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          toast.warning("Treatment has been deleted or does not exist.");
          return undefined;
        }
        const message =
          error?.response?.data?.message ||
          "Unable to load treatment details. Please try again.";
        toast.error(message);
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (treatmentData) {
      setFormState((prev) => ({
        ...prev,
        diagnosisCodes: treatmentData.diagnosis || "",
        orders: treatmentData.notes || "",
        referrals: treatmentData.goals || "",
      }));
    }
  }, [treatmentData]);

  const handleChange = (field: keyof DiagnosisFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateTreatmentMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Treatment>;
    }) => {
      const response = await api.treatment.updateTreatment(id, data);
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update treatment. Please try again.";
      toast.error(message);
    },
  });

  const applyUpdate = (
    next: (updated: Treatment | undefined) => void = () => undefined
  ) => {
    if (!resolvedTreatmentId) {
      toast.error(
        "Treatment record not found. Please create the treatment again."
      );
      return;
    }

    updateTreatmentMutation.mutate(
      {
        id: resolvedTreatmentId,
        data: {
          diagnosis: formState.diagnosisCodes,
          notes: formState.orders,
          goals: formState.referrals,
        },
      },
      {
        onSuccess: (data) => {
          next(data);
        },
      }
    );
  };

  const handleSaveDraft = () => {
    applyUpdate(() => {
      toast.success("Draft diagnosis and orders saved.");
    });
  };

  const handleSubmit = () => {
    applyUpdate(() => {
      toast.success("Diagnosis saved. Redirecting to prescriptions.");
      navigate({
        to: "/doctor/prescriptions",
        search: patientId ? { patientId } : undefined,
      });
    });
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Diagnosis &amp; orders</h1>
            <p className="text-gray-600">
              Treatment: <span className="font-semibold">{encounterId}</span>
            </p>
          </section>

          {isFetching && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              Loading treatment data...
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis codes (ICD)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <textarea
                  className="h-40 w-full rounded-md border border-gray-200 p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: N97.0 - Female infertility due to ovulatory disorder"
                  value={formState.diagnosisCodes}
                  onChange={(event) =>
                    handleChange("diagnosisCodes", event.target.value)
                  }
                />
                <p>
                  Coming soon: automatic ICD lookup based on documented
                  symptoms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lab or imaging orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <textarea
                  className="h-40 w-full rounded-md border border-gray-200 p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Day-10 follicle scan, AMH, FSH, hormonal panel..."
                  value={formState.orders}
                  onChange={(event) =>
                    handleChange("orders", event.target.value)
                  }
                />
                <p>
                  Saved orders notify the lab and synchronize the follow-up
                  schedule.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Treatment referrals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <textarea
                  className="h-32 w-full rounded-md border border-gray-200 p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Transition to IVF cycle, prepare OPU on day 12."
                  value={formState.referrals}
                  onChange={(event) =>
                    handleChange("referrals", event.target.value)
                  }
                />
                <p>
                  This action creates tasks for the care team and updates the
                  treatment cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <Input
                  type="file"
                  multiple
                  onChange={(event) =>
                    handleChange(
                      "attachments",
                      Array.from(event.target.files || []).length.toString()
                    )
                  }
                />
                <p>Upload up to five files per session (PDF, JPG, PNG).</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={updateTreatmentMutation.isPending}
            >
              {updateTreatmentMutation.isPending ? "Saving..." : "Save draft"}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateTreatmentMutation.isPending}
            >
              {updateTreatmentMutation.isPending
                ? "Processing..."
                : "Save & go to prescriptions"}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
