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
import { api } from "@/api/client";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [createdTransactionId, setCreatedTransactionId] = useState<
    string | null
  >(null);

  const { data: request, isLoading } = useQuery({
    queryKey: ["receptionist", "service-request", { serviceRequestId }],
    queryFn: async () => {
      const response =
        await api.serviceRequest.getServiceRequestById(serviceRequestId);
      return response.data;
    },
  });

  const patientId = request?.patientId;

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

  // Calculate total amount from service request details
  const totalAmount = useMemo(() => {
    return details.reduce((sum, detail) => {
      return sum + (detail.totalPrice ?? 0);
    }, 0);
  }, [details]);

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
        ...("status" in payload && payload.status
          ? { status: payload.status as any }
          : {}),
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
      status: "Approved" as any,
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

  // Create payment transaction with QR code
  const createPaymentQRMutation = useMutation({
    mutationFn: () => {
      return api.transaction.createPaymentQR({
        relatedEntityType: "ServiceRequest",
        relatedEntityId: serviceRequestId,
      });
    },
    onSuccess: (response) => {
      if (response.data) {
        // Use paymentUrl from the transaction response
        setPaymentUrl(
          response.data.paymentUrl || response.data.vnPayUrl || null
        );
        setCreatedTransactionId(response.data.id);
        setShowPaymentModal(true);
        toast.success("Payment transaction created successfully");
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "transactions"],
        });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create payment transaction. Please try again."
      );
    },
  });

  const handleCreatePaymentQR = () => {
    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }
    createPaymentQRMutation.mutate();
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
                  {request?.requestedDate || "—"}
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
                  {request?.requestCode || "—"}
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
                  <div className="text-xs text-gray-500">
                    Appointment creation is managed by doctors. After
                    confirming, please coordinate with the responsible doctor to
                    schedule the visit.
                  </div>
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
                        {(isPatientDetailResponse(patient)
                          ? patient.accountInfo?.username
                          : null) ||
                          patient?.fullName ||
                          patient?.patientCode ||
                          "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Email:
                        </span>{" "}
                        {(isPatientDetailResponse(patient)
                          ? patient.accountInfo?.email
                          : null) ||
                          patient?.email ||
                          "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Phone:
                        </span>{" "}
                        {(isPatientDetailResponse(patient)
                          ? patient.accountInfo?.phone
                          : null) ||
                          patient?.phoneNumber ||
                          "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">
                          Verification:
                        </span>{" "}
                        {isPatientDetailResponse(patient) &&
                        patient.accountInfo?.isVerified
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
                      <div className="mt-4 rounded-lg border-2 border-primary bg-primary/5 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">
                            Total Amount:
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {totalAmount > 0
                              ? new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(totalAmount)
                              : "—"}
                          </span>
                        </div>
                        {totalAmount > 0 && (
                          <Button
                            className="mt-3 w-full"
                            onClick={handleCreatePaymentQR}
                            disabled={createPaymentQRMutation.isPending}
                          >
                            {createPaymentQRMutation.isPending
                              ? "Creating Transaction..."
                              : "Create Payment Transaction"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p>No line items recorded for this request.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Payment URL Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentUrl(null);
            setCreatedTransactionId(null);
          }}
          title="Payment Transaction Created"
          description="Click the link below to complete payment for this service request"
          size="md"
        >
          <div className="space-y-4">
            {paymentUrl ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Click the button below to open the payment page.
                  </p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      <span className="font-medium">Total Amount:</span>{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(totalAmount)}
                    </p>
                    {createdTransactionId && (
                      <p>
                        <span className="font-medium">Transaction ID:</span>{" "}
                        {createdTransactionId.slice(0, 8)}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Service Request ID:</span>{" "}
                      {serviceRequestId.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      window.open(paymentUrl, "_blank");
                    }}
                  >
                    Open Payment Page
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigate({
                          to: "/receptionist/transactions",
                        });
                      }}
                    >
                      View All Transactions
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setPaymentUrl(null);
                        setCreatedTransactionId(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Unable to get payment URL. Please try again.
              </div>
            )}
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
