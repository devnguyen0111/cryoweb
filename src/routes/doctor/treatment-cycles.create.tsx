/**
 * Create Treatment Cycle Route
 * Allows doctors to create a new treatment cycle and select the type (IUI/IVF)
 */

import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { CreateTreatmentCycleRequest, TreatmentType } from "@/api/types";

export const Route = createFileRoute("/doctor/treatment-cycles/create")({
  component: CreateTreatmentCyclePage,
});

function CreateTreatmentCyclePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<TreatmentType>("IVF");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [cycleNumber, setCycleNumber] = useState(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  // Search patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients", patientSearch],
    queryFn: async () => {
      if (!patientSearch || patientSearch.length < 2) return { data: [] };
      return await api.patient.getPatients({
        searchTerm: patientSearch,
        pageSize: 10,
      });
    },
    enabled: patientSearch.length >= 2,
  });

  const createCycleMutation = useMutation({
    mutationFn: async (data: CreateTreatmentCycleRequest) => {
      return await api.treatmentCycle.createTreatmentCycle(data);
    },
    onSuccess: (response) => {
      const newCycleId = response.data?.id;
      toast.success("Treatment cycle created successfully!");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });

      // Navigate to the appropriate workflow
      if (newCycleId) {
        if (selectedType === "IUI") {
          navigate({
            to: "/doctor/treatment-cycles/$cycleId/iui-workflow",
            params: { cycleId: newCycleId },
          });
        } else if (selectedType === "IVF") {
          navigate({
            to: "/doctor/treatment-cycles/$cycleId/ivf-workflow",
            params: { cycleId: newCycleId },
          });
        } else {
          navigate({
            to: "/doctor/treatment-cycles/$cycleId",
            params: { cycleId: newCycleId },
          });
        }
      } else {
        navigate({ to: "/doctor/treatment-cycles" });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create treatment cycle"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId) {
      toast.error("Please select a patient");
      return;
    }

    if (!treatmentId) {
      toast.error("Please enter a treatment ID");
      return;
    }

    const createData: CreateTreatmentCycleRequest = {
      treatmentId,
      cycleNumber,
      startDate,
      notes: notes || `${selectedType} cycle created`,
    };

    createCycleMutation.mutate(createData);
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Create Treatment Cycle</h1>
            <p className="text-gray-600">
              Create a new IUI or IVF treatment cycle for a patient
            </p>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Treatment Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Select Treatment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setSelectedType("IUI")}
                    className={`rounded-lg border-2 p-6 text-left transition ${
                      selectedType === "IUI"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h3 className="text-lg font-semibold">IUI</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Intrauterine Insemination treatment cycle
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-500">
                      <li>• Ovulation induction</li>
                      <li>• Sperm preparation</li>
                      <li>• IUI procedure</li>
                      <li>• Luteal support</li>
                      <li>• Pregnancy test</li>
                    </ul>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType("IVF")}
                    className={`rounded-lg border-2 p-6 text-left transition ${
                      selectedType === "IVF"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h3 className="text-lg font-semibold">IVF</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      In Vitro Fertilization treatment cycle
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-500">
                      <li>• Ovarian stimulation</li>
                      <li>• Oocyte pickup (OPU)</li>
                      <li>• Fertilization (ICSI/IVF)</li>
                      <li>• Embryo culture</li>
                      <li>• Embryo transfer</li>
                      <li>• Pregnancy test</li>
                    </ul>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType("Other")}
                    className={`rounded-lg border-2 p-6 text-left transition ${
                      selectedType === "Other"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h3 className="text-lg font-semibold">Other</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Other fertility treatment protocols
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-gray-500">
                      <li>• FET (Frozen Embryo Transfer)</li>
                      <li>• Egg/Sperm freezing</li>
                      <li>• Diagnostic procedures</li>
                      <li>• Custom protocols</li>
                    </ul>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle>2. Select Patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Search Patient (by name, code, or national ID)
                  </label>
                  <Input
                    placeholder="Enter at least 2 characters to search..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                </div>

                {patientsData?.data && patientsData.data.length > 0 && (
                  <div className="rounded-lg border">
                    <div className="max-h-64 overflow-y-auto">
                      {patientsData.data.map((patient: any) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setPatientSearch(
                              `${patient.fullName} (${patient.patientCode})`
                            );
                          }}
                          className={`w-full border-b p-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                            selectedPatientId === patient.id
                              ? "bg-primary/5"
                              : ""
                          }`}
                        >
                          <p className="font-medium">{patient.fullName}</p>
                          <p className="text-sm text-gray-600">
                            {patient.patientCode} • {patient.nationalId} •{" "}
                            {patient.gender}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPatientId && (
                  <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    ✓ Patient selected: {patientSearch}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cycle Details */}
            <Card>
              <CardHeader>
                <CardTitle>3. Cycle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Treatment ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Enter treatment ID"
                      value={treatmentId}
                      onChange={(e) => setTreatmentId(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      The treatment plan ID this cycle belongs to
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cycle Number</label>
                    <Input
                      type="number"
                      min={1}
                      value={cycleNumber}
                      onChange={(e) =>
                        setCycleNumber(parseInt(e.target.value) || 1)
                      }
                    />
                    <p className="text-xs text-gray-500">
                      The cycle number within this treatment (e.g., 1st, 2nd IVF
                      attempt)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Expected Duration
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., 4-6 weeks"
                      disabled
                      value={
                        selectedType === "IUI"
                          ? "14-21 days"
                          : selectedType === "IVF"
                            ? "4-6 weeks"
                            : "Varies"
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Notes</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2"
                    rows={3}
                    placeholder="Any initial notes or observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/doctor/treatment-cycles" })}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  !selectedPatientId ||
                  !treatmentId ||
                  createCycleMutation.isPending
                }
              >
                {createCycleMutation.isPending
                  ? "Creating..."
                  : `Create ${selectedType} Cycle & Start Workflow`}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
