/**
 * Encounter Detail Page
 * View and edit encounter details
 */

import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { Treatment } from "@/api/types";

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
  status: string;
};

export const Route = createFileRoute("/doctor/encounters/$encounterId")({
  component: EncounterDetailPage,
});

function EncounterDetailPage() {
  const { encounterId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch encounter data
  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: async () => {
      const response = await api.treatment.getTreatmentById(encounterId);
      return response.data;
    },
    retry: false,
  });

  // Parse encounter data from notes (temporary solution)
  const parseEncounterData = (notes?: string): Partial<EncounterFormValues> => {
    if (!notes) return {};
    try {
      // Try to parse JSON from notes
      const jsonMatch = notes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If not JSON, try to extract structured data
      const lines = notes.split("\n");
      const data: Partial<EncounterFormValues> = {};
      let currentSection = "";
      let vitals: any = {};

      lines.forEach((line) => {
        if (line.includes("Chief Complaint:")) {
          data.chiefComplaint = line.split(":")[1]?.trim() || "";
        } else if (line.includes("History:")) {
          currentSection = "history";
          data.history = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Physical Exam:")) {
          currentSection = "physicalExam";
          data.physicalExam = line.split(":")[1]?.trim() || "";
        } else if (line.includes("BP:") || line.includes("Blood Pressure:")) {
          vitals.bloodPressure = line.split(":")[1]?.trim() || "";
        } else if (line.includes("HR:") || line.includes("Heart Rate:")) {
          vitals.heartRate = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Temp:") || line.includes("Temperature:")) {
          vitals.temperature = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Weight:")) {
          vitals.weight = line.split(":")[1]?.trim() || "";
        } else if (currentSection === "history" && line.trim()) {
          data.history = (data.history || "") + "\n" + line.trim();
        } else if (currentSection === "physicalExam" && line.trim()) {
          data.physicalExam = (data.physicalExam || "") + "\n" + line.trim();
        }
      });

      if (Object.keys(vitals).length > 0) {
        data.vitals = vitals as any;
      }

      return data;
    } catch (error) {
      console.error("Error parsing encounter data:", error);
      return {};
    }
  };

  const form = useForm<EncounterFormValues>({
    defaultValues: {
      visitDate: encounterData?.startDate
        ? new Date(encounterData.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
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
      status: encounterData?.status || "InProgress",
    },
  });

  // Update form when encounter data loads
  React.useEffect(() => {
    if (encounterData) {
      const parsed = parseEncounterData(encounterData.notes);
      form.reset({
        visitDate: encounterData.startDate
          ? new Date(encounterData.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        chiefComplaint: parsed.chiefComplaint || "",
        history: parsed.history || "",
        vitals: parsed.vitals || {
          bloodPressure: "",
          heartRate: "",
          temperature: "",
          weight: "",
        },
        physicalExam: parsed.physicalExam || "",
        notes: encounterData.notes || "",
        status: encounterData.status || "InProgress",
      });
    }
  }, [encounterData, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: EncounterFormValues) => {
      // Combine all data into notes (temporary solution)
      const encounterData = {
        visitDate: values.visitDate,
        chiefComplaint: values.chiefComplaint,
        history: values.history,
        vitals: values.vitals,
        physicalExam: values.physicalExam,
        notes: values.notes,
      };

      const notes = `Encounter Data:\n${JSON.stringify(encounterData, null, 2)}`;

      const response = await api.treatment.updateTreatment(encounterId, {
        startDate: new Date(`${values.visitDate}T00:00:00`).toISOString(),
        status: values.status as any,
        notes,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
      queryClient.invalidateQueries({ queryKey: ["doctor-encounters"] });
      toast.success("Encounter updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to update encounter";
      toast.error(message);
    },
  });

  const onSubmit = (values: EncounterFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading encounter...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!encounterData) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 mb-4">Encounter not found</p>
              <Button
                onClick={() => navigate({ to: "/doctor/encounters" })}
              >
                Back to Encounters
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Encounter Details</h1>
                <p className="text-gray-600">
                  Code: <span className="font-semibold">{encounterData.treatmentCode || encounterId}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Patient: {encounterData.patientId || "N/A"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/doctor/encounters" })}
                >
                  Back
                </Button>
                {encounterData.status === "InProgress" && (
                  <Button
                    onClick={() =>
                      navigate({
                        to: "/doctor/encounters/$encounterId/diagnosis",
                        params: { encounterId },
                        search: {
                          patientId: encounterData.patientId,
                          treatmentId: encounterId,
                        },
                      })
                    }
                  >
                    Go to Diagnosis
                  </Button>
                )}
              </div>
            </div>
          </section>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visit Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Visit Date
                  </label>
                  <Input
                    type="date"
                    {...form.register("visitDate", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    {...form.register("status")}
                  >
                    <option value="Planning">Planning</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Chief Complaint
                  </label>
                  <Input
                    placeholder="Example: Post-IVF follow-up"
                    {...form.register("chiefComplaint")}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medical History
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
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Blood Pressure
                  </label>
                  <Input
                    placeholder="120/80 mmHg"
                    {...form.register("vitals.bloodPressure")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Heart Rate
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
                <CardTitle>Physical Exam & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Physical Examination
                  </label>
                  <textarea
                    className="min-h-[160px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Document clinical assessments, ultrasound findings, clinic lab results..."
                    {...form.register("physicalExam")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Internal Notes
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
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
