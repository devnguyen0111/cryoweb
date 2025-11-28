import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreateEncounterForm } from "@/features/doctor/encounters/CreateEncounterForm";
import { TreatmentViewModal } from "@/features/doctor/encounters/TreatmentViewModal";
import { isAxiosError } from "axios";
import { StructuredNote } from "@/components/StructuredNote";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/doctor/encounters")({
  component: DoctorEncountersComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

function DoctorEncountersComponent() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewModalTreatmentId, setViewModalTreatmentId] = useState<
    string | null
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor-treatments"] }),
    ]);
    setIsRefreshing(false);
  };

  // Fetch all treatments for this doctor
  const { data: treatmentsData, isLoading } = useQuery({
    queryKey: ["doctor-treatments", user?.id, statusFilter, searchTerm],
    queryFn: async () => {
      const response = await api.treatment.getTreatments({
        doctorId: user?.id,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        pageNumber: 1,
        pageSize: 50,
      });
      return response;
    },
    enabled: !!user?.id,
  });

  const treatments = treatmentsData?.data || [];
  const filteredTreatments = useMemo(() => {
    if (!searchTerm) return treatments;
    const term = searchTerm.toLowerCase();
    return treatments.filter(
      (treatment) =>
        treatment.treatmentCode?.toLowerCase().includes(term) ||
        treatment.notes?.toLowerCase().includes(term) ||
        treatment.treatmentType?.toLowerCase().includes(term)
    );
  }, [treatments, searchTerm]);

  const quickGuide = useMemo(
    () => [
      {
        title: "Step 1: Start the treatment",
        description:
          "Capture visit reasons, medical history, and vital signs. The system automatically links to the current appointment.",
      },
      {
        title: "Step 2: Diagnose & order",
        description:
          "After saving, continue to the diagnosis screen to add assessments and ancillary orders.",
      },
      {
        title: "Step 3: Manage treatment cycles",
        description:
          "From diagnosis you can issue prescriptions, create IUI/IVF cycles, or hand off data to the cryobank.",
      },
    ],
    []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "InProgress":
        return "bg-blue-100 text-blue-700";
      case "Planning":
        return "bg-yellow-100 text-yellow-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Component to display signature status for IUI/IVF treatments
  function SignatureStatus({
    treatmentId,
    treatmentType,
  }: {
    treatmentId: string;
    treatmentType?: string;
  }) {
    const { data: agreement } = useQuery({
      queryKey: ["agreement", treatmentId],
      queryFn: async () => {
        if (treatmentType !== "IUI" && treatmentType !== "IVF") {
          return null;
        }
        try {
          const response = await api.agreement.getAgreements({
            TreatmentId: treatmentId,
            Size: 1,
          });
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          return null;
        }
      },
      enabled:
        !!treatmentId && (treatmentType === "IUI" || treatmentType === "IVF"),
      retry: false,
    });

    if (treatmentType !== "IUI" && treatmentType !== "IVF") {
      return null;
    }

    if (!agreement) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Signature Pending
        </span>
      );
    }

    // Use new field names (signedByDoctor/signedByPatient) with fallback to legacy fields
    const doctorSigned =
      agreement.signedByDoctor ?? agreement.doctorSigned ?? false;
    const patientSigned =
      agreement.signedByPatient ?? agreement.patientSigned ?? false;
    const bothSigned = doctorSigned && patientSigned;

    if (bothSigned) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
          <svg
            className="h-3 w-3"
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
          Fully Signed
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700">
        <svg
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {doctorSigned ? "Patient Pending" : "Signatures Pending"}
      </span>
    );
  }

  // Component to display treatment notes in a readable format
  function TreatmentNotesDisplay({
    notes,
    treatmentId,
    treatmentType,
  }: {
    notes: string;
    treatmentId: string;
    treatmentType?: string;
  }) {
    // Fetch agreement to sync signature status
    const { data: agreement } = useQuery({
      queryKey: ["agreement", treatmentId],
      queryFn: async () => {
        if (treatmentType !== "IUI" && treatmentType !== "IVF") {
          return null;
        }
        try {
          const response = await api.agreement.getAgreements({
            TreatmentId: treatmentId,
            Size: 1,
          });
          if (response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          return null;
        }
      },
      enabled:
        !!treatmentId && (treatmentType === "IUI" || treatmentType === "IVF"),
      retry: false,
      refetchOnWindowFocus: true, // Refetch when window gains focus to get latest signature status
      refetchInterval: 3000, // Refetch every 3 seconds to catch signature updates
    });

    return (
      <StructuredNote
        note={notes}
        className="text-sm text-gray-700"
        agreement={agreement || undefined}
      />
    );
  }

  // Component to display patient info
  function PatientInfo({ patientId }: { patientId?: string }) {
    const { data: patientDetails } = useQuery({
      queryKey: ["patient-details", patientId],
      queryFn: async () => {
        if (!patientId) return null;
        try {
          const response = await api.patient.getPatientDetails(patientId);
          return response.data;
        } catch {
          return null;
        }
      },
      enabled: !!patientId,
    });

    const { data: userDetails } = useQuery({
      queryKey: ["user-details", patientId],
      queryFn: async () => {
        if (!patientId) return null;
        try {
          const response = await api.user.getUserDetails(patientId);
          return response.data;
        } catch {
          return null;
        }
      },
      enabled: !!patientId,
    });

    if (!patientId) return <span className="text-gray-500">N/A</span>;

    const patientName =
      patientDetails?.accountInfo?.username ||
      userDetails?.fullName ||
      userDetails?.userName ||
      "Unknown";
    const patientCode = patientDetails?.patientCode;
    // Use patientCode if available, otherwise use short ID (last 4 chars)
    const shortId = patientCode || getLast4Chars(patientId);

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 font-mono">{shortId}</span>
        <span className="text-gray-400">•</span>
        <span className="font-medium text-gray-900">{patientName}</span>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Treatments &amp; clinical visits
                </h1>
                <p className="text-gray-600">
                  Manage patient treatments, update records, and move into the
                  diagnosis workflow.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  + Create treatment
                </Button>
              </div>
            </div>
          </section>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Search treatments
                  </label>
                  <Input
                    placeholder="Search by code, type, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Filter by status
                  </label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Planning">Planning</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatments List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Recent treatments ({filteredTreatments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">
                  Loading treatments...
                </div>
              ) : filteredTreatments.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="mb-4">No treatments found.</p>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create your first treatment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTreatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="rounded-lg border p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {treatment.treatmentCode ||
                                `Treatment ${getLast4Chars(treatment.id)}`}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                treatment.status
                              )}`}
                            >
                              {treatment.status}
                            </span>
                            <span className="rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                              {treatment.treatmentType}
                            </span>
                            <SignatureStatus
                              treatmentId={treatment.id}
                              treatmentType={treatment.treatmentType}
                            />
                          </div>
                          <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                            <div>
                              <span className="font-medium">Date: </span>
                              {treatment.startDate
                                ? new Date(
                                    treatment.startDate
                                  ).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Patient: </span>
                              <PatientInfo patientId={treatment.patientId} />
                            </div>
                            {treatment.notes && (
                              <div className="md:col-span-2">
                                <span className="font-medium">Notes: </span>
                                <TreatmentNotesDisplay
                                  notes={treatment.notes}
                                  treatmentId={treatment.id}
                                  treatmentType={treatment.treatmentType}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewModalTreatmentId(treatment.id);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quickGuide.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  {item.description}
                </CardContent>
              </Card>
            ))}
          </section>
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Treatment"
          description="Start by creating a treatment plan for IUI/IVF treatments, or create an encounter for consultations."
          size="xl"
        >
          <CreateEncounterForm
            layout="modal"
            defaultPatientId={search.patientId}
            startWithPlan={true}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={() => {
              setIsCreateModalOpen(false);
            }}
          />
        </Modal>

        <TreatmentViewModal
          treatmentId={viewModalTreatmentId}
          isOpen={Boolean(viewModalTreatmentId)}
          onClose={() => setViewModalTreatmentId(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
