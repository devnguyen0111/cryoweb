import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";

type EncounterFormValues = {
  visitDate: string;
  chiefComplaint: string;
  history: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
  };
  physicalExam: string;
  notes: string;
};

type EncounterSearchState = {
  patientId?: string;
  appointmentId?: string;
};

export const Route = createFileRoute("/doctor/encounters/create")({
  component: DoctorEncounterCreateComponent,
  validateSearch: (
    search: { patientId?: string; appointmentId?: string } = {}
  ) => search,
});

function DoctorEncounterCreateComponent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch() as EncounterSearchState;
  const patientId = search.patientId;
  const appointmentId = search.appointmentId;

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const form = useForm<EncounterFormValues>({
    defaultValues: {
      visitDate: new Date().toISOString().split("T")[0],
      chiefComplaint: "",
      history: "",
      vitals: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
      },
      physicalExam: "",
      notes: "",
    },
  });

  const createTreatmentMutation = useMutation({
    mutationFn: async ({
      values,
      doctorId: targetDoctorId,
    }: {
      values: EncounterFormValues;
      doctorId: string;
    }) => {
      // Combine all encounter data into structured format
      const encounterData = {
        visitDate: values.visitDate,
        chiefComplaint: values.chiefComplaint,
        history: values.history,
        vitals: values.vitals,
        physicalExam: values.physicalExam,
        notes: values.notes,
      };

      // Store as JSON in notes field (temporary solution until backend has dedicated encounter table)
      const notes = `Encounter Data:\n${JSON.stringify(encounterData, null, 2)}`;

      const response = await api.treatment.createTreatment({
        patientId,
        doctorId: targetDoctorId,
        treatmentType: "Other", // Use "Other" type for encounters
        startDate: new Date(`${values.visitDate}T00:00:00`).toISOString(),
        status: "InProgress",
        notes,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Encounter saved. Redirecting to diagnosis.");

      const treatmentId = data?.id;
      navigate({
        to: "/doctor/encounters/$encounterId/diagnosis",
        params: { encounterId: treatmentId || "draft" },
        search: {
          patientId,
          appointmentId,
          treatmentId,
        },
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to save encounter. Please try again.";
      toast.error(message);
    },
  });

  const onSubmit = (values: EncounterFormValues) => {
    if (!patientId) {
      toast.error("Select a patient before creating an encounter.");
      return;
    }

    if (!doctorId) {
      toast.error(
        "Unable to find doctor information. Please contact the administrator."
      );
      return;
    }

    createTreatmentMutation.mutate({ doctorId, values });
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {!doctorProfileLoading && !doctorProfile && doctorId ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Doctor profile information is being loaded. If this message persists, please contact the administrator.
            </div>
          ) : null}

          <section className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Create encounter</h1>
            <p className="text-gray-600">
              Patient:{" "}
              <span className="font-semibold">
                {patientId || "Not selected"}
              </span>
              {appointmentId && (
                <span className="ml-3 text-sm text-gray-500">
                  - Linked appointment {appointmentId}
                </span>
              )}
            </p>
          </section>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visit information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Visit date
                  </label>
                  <Input
                    type="date"
                    {...form.register("visitDate", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Chief complaint
                  </label>
                  <Input
                    placeholder="Example: Post-IVF follow-up"
                    {...form.register("chiefComplaint", { required: true })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medical history
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Summarize obstetric history, underlying conditions, prior treatments..."
                    {...form.register("history")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vital signs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Blood pressure
                  </label>
                  <Input
                    placeholder="120/80 mmHg"
                    {...form.register("vitals.bloodPressure")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Heart rate
                  </label>
                  <Input
                    placeholder="80 bpm"
                    {...form.register("vitals.heartRate")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Temperature
                  </label>
                  <Input
                    placeholder="36.5 C"
                    {...form.register("vitals.temperature")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Weight
                  </label>
                  <Input
                    placeholder="58 kg"
                    {...form.register("vitals.weight")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Physical exam &amp; notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Physical examination
                  </label>
                  <textarea
                    className="min-h-[160px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Document clinical assessments, ultrasound findings, clinic lab results..."
                    {...form.register("physicalExam")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Internal notes
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Information for the clinical team only; hidden from patients."
                    {...form.register("notes")}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/doctor/encounters" })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTreatmentMutation.isPending}
              >
                {createTreatmentMutation.isPending
                  ? "Saving..."
                  : "Save encounter"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
