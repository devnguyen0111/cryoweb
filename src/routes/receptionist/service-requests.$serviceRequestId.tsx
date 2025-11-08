import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CreateAppointmentForm } from "@/features/receptionist/appointments/CreateAppointmentForm";
import { api } from "@/api/client";

type DecisionMode = "reject" | "cancel" | null;

export const Route = createFileRoute(
  "/receptionist/service-requests/$serviceRequestId"
)({
  component: ReceptionistServiceRequestDetailRoute,
});

function ReceptionistServiceRequestDetailRoute() {
  const { serviceRequestId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notesDraft, setNotesDraft] = useState("");
  const [decisionMode, setDecisionMode] = useState<DecisionMode>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ["receptionist", "service-request", { serviceRequestId }],
    queryFn: async () => {
      const response =
        await api.serviceRequest.getServiceRequestById(serviceRequestId);
      return response.data;
    },
  });

  const patientId = request?.patientId;
  const serviceId = request?.serviceId;

  const { data: patient } = useQuery({
    queryKey: ["receptionist", "patients", { patientId }],
    enabled: Boolean(patientId),
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallback = await api.patient.getPatientById(patientId);
          return fallback.data;
        }
        throw error;
      }
    },
  });

  const { data: service } = useQuery({
    queryKey: ["receptionist", "services", { serviceId }],
    enabled: Boolean(serviceId),
    queryFn: async () => {
      if (!serviceId) return null;
      const response = await api.service.getServiceById(serviceId);
      return response.data;
    },
  });

  const { data: requestDetails } = useQuery({
    queryKey: ["receptionist", "service-request-details", { serviceRequestId }],
    queryFn: () =>
      api.serviceRequestDetails.getServiceRequestDetails({
        ServiceRequestId: serviceRequestId,
        Page: 1,
        Size: 20,
      }),
  });

  const details = requestDetails?.data ?? [];

  useEffect(() => {
    if (request?.notes) {
      setNotesDraft(request.notes);
    }
  }, [request?.id, request?.notes]);

  const updateRequestMutation = useMutation({
    mutationFn: (payload: {
      status?: string;
      notes?: string;
      scheduledDate?: string;
    }) =>
      api.serviceRequest.updateServiceRequest(serviceRequestId, {
        ...("notes" in payload ? { notes: payload.notes } : {}),
        ...("scheduledDate" in payload
          ? { scheduledDate: payload.scheduledDate }
          : {}),
        ...("status" in payload ? { status: payload.status } : {}),
      }),
    onSuccess: (_, variables) => {
      toast.success("Service request updated");
      setDecisionMode(null);
      setDecisionNotes("");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "service-request"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "service-requests"],
      });
      if (variables.notes) {
        setNotesDraft("");
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update service request. Please try again.";
      toast.error(message);
    },
  });

  const loadingText = isLoading ? "Loading..." : null;

  const statusLabel = useMemo(() => {
    if (!request?.status) return "Not set";
    return request.status;
  }, [request?.status]);

  const handleUpdateNotes = () => {
    if (!notesDraft.trim()) {
      toast.error("Please enter notes before saving.");
      return;
    }
    updateRequestMutation.mutate({ notes: notesDraft.trim() });
  };

  const handleConfirm = () => {
    updateRequestMutation.mutate({
      status: "Confirmed",
      scheduledDate: request?.scheduledDate,
    });
  };

  const handleDecisionSubmit = () => {
    if (!decisionMode) {
      return;
    }
    if (!decisionNotes.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    const status = decisionMode === "reject" ? "Rejected" : "Cancelled";
    updateRequestMutation.mutate({
      status,
      notes: decisionNotes.trim(),
    });
  };

  const handleOpenAppointmentCreate = () => {
    setIsCreateAppointmentOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Service request detail</h1>
              <p className="text-gray-600">
                Request ID:{" "}
                <span className="font-medium">{serviceRequestId}</span>
              </p>
              {request?.requestedDate ? (
                <p className="text-sm text-gray-500">
                  Submitted on {request.requestedDate}
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/receptionist/service-requests",
                  })
                }
              >
                Back to list
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status & workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">
                    Current status:
                  </span>{" "}
                  <span className="capitalize">{statusLabel}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Preferred date:
                  </span>{" "}
                  {request?.scheduledDate || request?.requestedDate || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Patient ID:</span>{" "}
                  {patientId || "—"}{" "}
                  {patient ? (
                    <Button
                      size="sm"
                      variant="link"
                      className="px-1"
                      onClick={() =>
                        navigate({
                          to: "/receptionist/patients/$patientId",
                          params: { patientId: patientId! },
                        })
                      }
                    >
                      View patient
                    </Button>
                  ) : null}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Service:</span>{" "}
                  {service?.name || "—"}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Notes from patient:
                  </span>
                  <br />
                  {request?.notes || "No notes provided"}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Internal notes
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={3}
                    value={notesDraft}
                    placeholder={
                      request?.notes
                        ? "Add follow-up notes..."
                        : "Document verification steps, contact attempts, etc."
                    }
                    onChange={(event) => setNotesDraft(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateNotes}
                      disabled={updateRequestMutation.isPending}
                    >
                      Save notes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotesDraft("")}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={updateRequestMutation.isPending}
                  >
                    Confirm without scheduling
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleOpenAppointmentCreate}
                    disabled={!patientId}
                  >
                    Confirm & schedule appointment
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDecisionMode("reject");
                      setDecisionNotes("");
                    }}
                  >
                    Reject request
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDecisionMode("cancel");
                      setDecisionNotes("");
                    }}
                  >
                    Cancel after confirmation
                  </Button>
                </div>
                {decisionMode ? (
                  <div className="w-full space-y-2 rounded-md border border-dashed border-gray-300 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">
                        {decisionMode === "reject"
                          ? "Reject request"
                          : "Cancel request"}{" "}
                        – please provide a reason.
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDecisionMode(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                    <textarea
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      rows={3}
                      value={decisionNotes}
                      onChange={(event) => setDecisionNotes(event.target.value)}
                    />
                    <Button
                      size="sm"
                      variant={
                        decisionMode === "reject" ? "outline" : "destructive"
                      }
                      onClick={handleDecisionSubmit}
                      disabled={updateRequestMutation.isPending}
                    >
                      Submit decision
                    </Button>
                  </div>
                ) : null}
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  {loadingText ? (
                    <p>{loadingText}</p>
                  ) : patient ? (
                    <>
                      <p>
                        <span className="font-medium text-gray-900">Name:</span>{" "}
                        {patient.accountInfo?.username ||
                          patient.patientCode ||
                          "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Email:
                        </span>{" "}
                        {patient.accountInfo?.email || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Phone:
                        </span>{" "}
                        {patient.accountInfo?.phone || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Verification:
                        </span>{" "}
                        {patient.accountInfo?.isVerified
                          ? "Verified"
                          : "Pending"}
                      </p>
                    </>
                  ) : (
                    <p>No patient profile linked yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requested services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  {details.length ? (
                    <div className="space-y-3">
                      {details.map((detail) => (
                        <div
                          key={detail.id}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <p className="font-medium text-gray-900">
                            Service detail #{detail.id.slice(0, 8)}
                          </p>
                          <p>Service ID: {detail.serviceId || "—"}</p>
                          <p>Quantity: {detail.quantity ?? 1}</p>
                          <p>
                            Total price:{" "}
                            {detail.totalPrice != null
                              ? `${detail.totalPrice}₫`
                              : "—"}
                          </p>
                          {detail.notes ? (
                            <p className="text-xs text-gray-500">
                              Notes: {detail.notes}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No line items recorded for this request.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <Modal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
        title="Create appointment"
        description="Schedule an appointment linked to this service request."
        size="xl"
      >
        <CreateAppointmentForm
          layout="modal"
          defaultPatientId={patientId}
          defaultServiceRequestId={serviceRequestId}
          defaultServiceId={serviceId}
          onClose={() => setIsCreateAppointmentOpen(false)}
          onCreated={(appointmentId) => {
            setIsCreateAppointmentOpen(false);
            navigate({
              to: "/receptionist/appointments/$appointmentId",
              params: { appointmentId },
            });
          }}
        />
      </Modal>
    </ProtectedRoute>
  );
}
