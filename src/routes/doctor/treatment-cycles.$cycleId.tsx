/**
 * Treatment Cycle Detail Page
 * Shows detailed timeline and allows step progression
 */

import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { TreatmentTimeline } from "@/features/doctor/treatment-cycles/TreatmentTimeline";
import { CycleUpdateForm } from "@/features/doctor/treatment-cycles/CycleUpdateForm";
import {
  normalizeTreatmentCycleStatus,
  type IVFStep,
  type IUIStep,
  type MedicalRecord,
} from "@/api/types";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/doctor/treatment-cycles/$cycleId")({
  component: DoctorTreatmentCycleDetail,
  validateSearch: (search: { step?: string } = {}) => search,
});

function DoctorTreatmentCycleDetail() {
  const params = Route.useParams() as { cycleId: string };
  const cycleId = params.cycleId;
  const search = Route.useSearch() as { step?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStep, setSelectedStep] = useState<IVFStep | IUIStep | null>(
    null
  );

  const { data: cycle, isLoading } = useQuery({
    queryKey: ["doctor", "treatment-cycle", cycleId],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycleId);
      return response.data;
    },
  });

  useEffect(() => {
    if (search?.step) {
      setSelectedStep(search.step as IVFStep | IUIStep);
    }
  }, [search?.step]);

  const updateStepMutation = useMutation({
    mutationFn: async (data: {
      currentStep?: IVFStep | IUIStep;
      completedSteps?: (IVFStep | IUIStep)[];
      stepDates?: Record<string, string>;
    }) => {
      const currentCompleted = cycle?.completedSteps || [];
      const newCompleted = data.currentStep
        ? [...new Set([...currentCompleted, data.currentStep])]
        : currentCompleted;

      return api.treatmentCycle.updateTreatmentCycle(cycleId, {
        currentStep: data.currentStep,
        completedSteps: newCompleted,
        stepDates: {
          ...(cycle?.stepDates || {}),
          ...(data.stepDates || {}),
        },
      });
    },
    onSuccess: () => {
      toast.success("Step updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update step");
    },
  });

  const handleStepClick = (step: IVFStep | IUIStep) => {
    setSelectedStep(step);
    navigate({
      to: "/doctor/treatment-cycles/$cycleId",
      params: { cycleId },
      search: { step },
    } as any);
  };

  const handleMarkStepComplete = () => {
    if (!selectedStep) return;

    const stepDate = new Date().toISOString();
    updateStepMutation.mutate({
      currentStep: selectedStep,
      stepDates: { [selectedStep]: stepDate },
    });
  };

  const handleStartCycle = () => {
    if (!cycle) return;

    const firstStep: IVFStep | IUIStep =
      cycle.treatmentType === "IVF" ? "step1_stimulation" : "step1_stimulation";

    updateStepMutation.mutate({
      currentStep: firstStep,
      stepDates: { [firstStep]: new Date().toISOString() },
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading cycle details...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!cycle) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Treatment cycle not found</p>
              <Button
                className="mt-4"
                onClick={() =>
                  navigate({ to: "/doctor/treatment-cycles" } as any)
                }
              >
                Back to Cycles
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const cycleStatus = normalizeTreatmentCycleStatus(cycle.status);
  const isCompleted = cycleStatus === "Completed";
  const isCancelled = cycleStatus === "Cancelled";
  const hasStarted = cycleStatus === "InProgress" || cycle.currentStep;

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "medical-records">(
    "overview"
  );

  // Fetch medical records for this cycle
  const { data: medicalRecordsData, isLoading: medicalRecordsLoading } =
    useQuery({
      queryKey: ["medical-records", "cycle", cycleId],
      queryFn: async () => {
        try {
          // Fetch all medical records for the patient, then filter by treatmentCycleId
          const response = await api.medicalRecord.getMedicalRecords({
            PatientId: cycle.patientId,
            Page: 1,
            Size: 100,
          });
          const allRecords = response.data || [];
          // Filter by treatmentCycleId
          const cycleRecords = allRecords.filter(
            (record: MedicalRecord) => record.treatmentCycleId === cycleId
          );
          return cycleRecords;
        } catch (error) {
          console.error("Error fetching medical records:", error);
          return [];
        }
      },
      enabled: !!cycle.patientId && !!cycleId,
    });

  const medicalRecords = medicalRecordsData || [];

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Treatment Cycle Details</h1>
                <p className="text-gray-600">
                  Cycle ID: <span className="font-semibold">{cycleId}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Type: {cycle.treatmentType || "N/A"} | Status:{" "}
                  {cycle.status || "Planning"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({ to: "/doctor/treatment-cycles" } as any)
                }
              >
                Back to Cycles
              </Button>
            </div>
          </section>

          {/* Tab Navigation */}
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
                onClick={() => setActiveTab("medical-records")}
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                  activeTab === "medical-records"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Medical Records
                {medicalRecords.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {medicalRecords.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <>

          <Card>
            <CardHeader>
              <CardTitle>Cycle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Cycle Number</p>
                  <p className="font-semibold">{cycle.cycleNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold">
                    {cycle.startDate
                      ? new Date(cycle.startDate).toLocaleDateString("vi-VN")
                      : "Not started"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expected End Date</p>
                  <p className="font-semibold">
                    {cycle.expectedEndDate
                      ? new Date(cycle.expectedEndDate).toLocaleDateString(
                          "vi-VN"
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-semibold">
                    {cycle.patientId || "Not linked"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Progress and Update Form */}
          <CycleUpdateForm
            cycle={cycle}
            onStepAdvanced={() => {
              queryClient.invalidateQueries({
                queryKey: ["doctor", "treatment-cycle", cycleId],
              });
            }}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Treatment Timeline</CardTitle>
                {!hasStarted && !isCompleted && !isCancelled && (
                  <Button onClick={handleStartCycle} size="sm">
                    Start Cycle
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <TreatmentTimeline cycle={cycle} onStepClick={handleStepClick} />
            </CardContent>
          </Card>

          {selectedStep && (
            <Card>
              <CardHeader>
                <CardTitle>Step Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Selected Step: {selectedStep}
                  </p>
                  <p className="text-sm text-gray-500">
                    {cycle.stepDates?.[selectedStep]
                      ? `Completed on: ${new Date(
                          cycle.stepDates[selectedStep]
                        ).toLocaleDateString("vi-VN")}`
                      : "Not completed yet"}
                  </p>
                </div>
                {!isCompleted &&
                  !isCancelled &&
                  !cycle.completedSteps?.includes(selectedStep) && (
                    <Button
                      onClick={handleMarkStepComplete}
                      disabled={updateStepMutation.isPending}
                    >
                      {updateStepMutation.isPending
                        ? "Saving..."
                        : "Mark Step as Complete"}
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}

          {cycle.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {cycle.notes}
                </p>
              </CardContent>
            </Card>
          )}
            </>
          )}

          {activeTab === "medical-records" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Medical Records</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Navigate to create medical record with cycle pre-filled
                      navigate({
                        to: "/doctor/medical-records",
                        search: { treatmentCycleId: cycleId },
                      } as any);
                    }}
                  >
                    Create Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {medicalRecordsLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading medical records...
                  </div>
                ) : medicalRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p>No medical records found for this treatment cycle.</p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => {
                        navigate({
                          to: "/doctor/medical-records",
                          search: { treatmentCycleId: cycleId },
                        } as any);
                      }}
                    >
                      Create First Record
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalRecords.map((record: MedicalRecord) => (
                      <Card key={record.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  Record #{record.recordNumber || record.id.slice(0, 8)}
                                </p>
                                {record.createdAt && (
                                  <span className="text-sm text-gray-500">
                                    {new Date(record.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {record.chiefComplaint && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Chief Complaint:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {record.chiefComplaint}
                                  </p>
                                </div>
                              )}
                              {record.diagnosis && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Diagnosis:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {record.diagnosis}
                                  </p>
                                </div>
                              )}
                              {record.treatmentPlan && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Treatment Plan:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {record.treatmentPlan}
                                  </p>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigate({
                                  to: "/doctor/medical-records",
                                  search: { recordId: record.id },
                                } as any);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
