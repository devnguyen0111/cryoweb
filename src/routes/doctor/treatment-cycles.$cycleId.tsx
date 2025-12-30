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
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import { TreatmentTimeline } from "@/features/doctor/treatment-cycles/TreatmentTimeline";
import { CycleUpdateForm } from "@/features/doctor/treatment-cycles/CycleUpdateForm";
import {
  normalizeTreatmentCycleStatus,
  type IVFStep,
  type IUIStep,
  type MedicalRecord,
  type LabSampleDetailResponse,
} from "@/api/types";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";
import { getStatusBadgeClass } from "@/utils/status-colors";
import { FlaskConical } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<
    "overview" | "medical-records" | "oocytes" | "sperm"
  >("overview");

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
          // Note: MedicalRecord doesn't have treatmentCycleId, so we return all records
          // Filtering by cycle would need to be done via appointment relationship
          return allRecords;
        } catch (error) {
          console.error("Error fetching medical records:", error);
          return [];
        }
      },
      enabled: !!cycle.patientId && !!cycleId,
    });

  const medicalRecords = medicalRecordsData || [];

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Fetch oocyte samples for this patient and cycle
  const { data: oocyteSamplesData, isLoading: oocyteSamplesLoading } =
    useQuery({
      queryKey: ["oocyte-samples", "cycle", cycleId, cycle.patientId],
      queryFn: async () => {
        if (!cycle.patientId) return { data: [] };
        try {
          const response = await api.sample.getAllDetailSamples({
            SampleType: "Oocyte",
            PatientId: cycle.patientId,
            Page: 1,
            Size: 100,
            Sort: "collectionDate",
            Order: "desc",
          });
          // Filter by treatmentCycleId if available
          const samples = response.data || [];
          return {
            data: samples.filter(
              (sample) =>
                !sample.treatmentCycleId || sample.treatmentCycleId === cycleId
            ),
          };
        } catch (error) {
          console.error("Error fetching oocyte samples:", error);
          return { data: [] };
        }
      },
      enabled: !!cycle.patientId && activeTab === "oocytes",
    });

  // Fetch sperm samples for this patient and cycle
  const { data: spermSamplesData, isLoading: spermSamplesLoading } =
    useQuery({
      queryKey: ["cycle-samples", "sperm", cycleId],
      queryFn: async () => {
        if (!cycleId) return { data: [] };
        try {
          const response = await api.treatmentCycle.getCycleSamples(cycleId);
          const allSamples = response.data || [];
          // Filter to only sperm samples
          const spermSamples = allSamples.filter(
            (sample) => sample.sampleType === "Sperm"
          );
          return { data: spermSamples };
        } catch (error) {
          console.error("Error fetching sperm samples:", error);
          return { data: [] };
        }
      },
      enabled: !!cycleId && activeTab === "sperm",
    });

  const oocyteSamples = oocyteSamplesData?.data || [];
  const spermSamples = spermSamplesData?.data || [];

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
              <button
                onClick={() => setActiveTab("oocytes")}
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                  activeTab === "oocytes"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Oocytes
                {oocyteSamples.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {oocyteSamples.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("sperm")}
                className={cn(
                  "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                  activeTab === "sperm"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Sperm
                {spermSamples.length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {spermSamples.length}
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
                                  Record #{record.id.slice(0, 8)}
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

          {/* Oocytes Tab */}
          {activeTab === "oocytes" && (
            <Card>
              <CardHeader>
                <CardTitle>Oocyte Samples</CardTitle>
              </CardHeader>
              <CardContent>
                {oocyteSamplesLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading oocyte samples...
                  </div>
                ) : oocyteSamples.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p>No oocyte samples found for this treatment cycle.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Sample Code</th>
                          <th className="text-left p-3">Collection Date</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Quantity</th>
                          <th className="text-left p-3">Maturity Stage</th>
                          <th className="text-left p-3">Is Mature</th>
                          <th className="text-left p-3">Quality</th>
                          <th className="text-left p-3">Is Vitrified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oocyteSamples.map((sample: LabSampleDetailResponse) => (
                          <tr
                            key={sample.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-pink-500" />
                                <span className="font-mono text-sm">
                                  {sample.sampleCode ||
                                    getLast4Chars(sample.id)}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {formatDate(sample.collectionDate)}
                            </td>
                            <td className="p-3">
                              <Badge
                                className={cn(
                                  "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                  getStatusBadgeClass(sample.status)
                                )}
                              >
                                {sample.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              {sample.oocyte?.quantity !== undefined &&
                              sample.oocyte.quantity !== null
                                ? sample.oocyte.quantity
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.oocyte?.maturityStage || "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.oocyte?.isMature !== undefined &&
                              sample.oocyte.isMature !== null
                                ? sample.oocyte.isMature
                                  ? "Yes"
                                  : "No"
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.oocyte?.quality || sample.quality || "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.oocyte?.isVitrified !== undefined &&
                              sample.oocyte.isVitrified !== null
                                ? sample.oocyte.isVitrified
                                  ? "Yes"
                                  : "No"
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sperm Tab */}
          {activeTab === "sperm" && (
            <Card>
              <CardHeader>
                <CardTitle>Sperm Samples</CardTitle>
              </CardHeader>
              <CardContent>
                {spermSamplesLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading sperm samples...
                  </div>
                ) : spermSamples.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p>No sperm samples found for this treatment cycle.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Sample Code</th>
                          <th className="text-left p-3">Collection Date</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Volume</th>
                          <th className="text-left p-3">Concentration</th>
                          <th className="text-left p-3">Motility</th>
                          <th className="text-left p-3">Progressive Motility</th>
                          <th className="text-left p-3">Morphology</th>
                          <th className="text-left p-3">Quality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spermSamples.map((sample: LabSampleDetailResponse) => (
                          <tr
                            key={sample.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-blue-500" />
                                <span className="font-mono text-sm">
                                  {sample.sampleCode ||
                                    getLast4Chars(sample.id)}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {formatDate(sample.collectionDate)}
                            </td>
                            <td className="p-3">
                              <Badge
                                className={cn(
                                  "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                  getStatusBadgeClass(sample.status)
                                )}
                              >
                                {sample.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              {sample.sperm?.volume !== undefined &&
                              sample.sperm.volume !== null
                                ? `${sample.sperm.volume} mL`
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.sperm?.concentration !== undefined &&
                              sample.sperm.concentration !== null
                                ? `${sample.sperm.concentration} million/mL`
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.sperm?.motility !== undefined &&
                              sample.sperm.motility !== null
                                ? `${sample.sperm.motility}%`
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.sperm?.progressiveMotility !== undefined &&
                              sample.sperm.progressiveMotility !== null
                                ? `${sample.sperm.progressiveMotility}%`
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.sperm?.morphology !== undefined &&
                              sample.sperm.morphology !== null
                                ? `${sample.sperm.morphology}%`
                                : "—"}
                            </td>
                            <td className="p-3 text-sm">
                              {sample.sperm?.quality || sample.quality || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
