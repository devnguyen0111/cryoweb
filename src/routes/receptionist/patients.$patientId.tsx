import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import {
  isPatientDetailResponse,
  getPatientProperty,
} from "@/utils/patient-helpers";

export const Route = createFileRoute("/receptionist/patients/$patientId")({
  component: ReceptionistPatientDetail,
});

function ReceptionistPatientDetail() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const debug = (...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[ReceptionistPatientDetail]", ...args);
    }
  };

  useEffect(() => {
    debug("Route params change", { patientId });
  }, [patientId]);

  const { data: patientResponse, isLoading } = useQuery({
    queryKey: ["receptionist", "patient", patientId],
    queryFn: async () => {
      try {
        return await api.patient.getPatientDetails(patientId);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallbackResponse = await api.patient.getPatientById(patientId);
          return fallbackResponse;
        }
        throw error;
      }
    },
  });

  const { data: patientServiceRequests } = useQuery({
    queryKey: ["receptionist", "service-requests", { patientId: patientId }],
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        patientId: patientId,
        pageNumber: 1,
        pageSize: 10,
      }),
  });

  const { data: patientAppointments } = useQuery({
    queryKey: ["receptionist", "appointments", { patientId }],
    queryFn: () =>
      api.appointment.getAppointments({
        pageNumber: 1,
        pageSize: 10,
        ...(patientId ? { patientId: patientId } : {}),
      }),
  });

  useEffect(() => {
    if (!patientServiceRequests) return;
    debug("Service requests query resolved", {
      count: patientServiceRequests.data?.length ?? 0,
    });
  }, [patientServiceRequests]);

  useEffect(() => {
    if (!patientAppointments) return;
    debug("Appointments query resolved", {
      count: patientAppointments.data?.length ?? 0,
    });
  }, [patientAppointments]);

  const patient = patientResponse?.data;
  const displayName =
    (patient && isPatientDetailResponse(patient)
      ? patient.accountInfo?.username
      : null) ||
    patient?.fullName ||
    patient?.patientCode ||
    "Patient detail";

  useEffect(() => {
    debug("Patient query state", { isLoading, hasPatient: Boolean(patient) });
  }, [isLoading, patient]);

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    patientCode: "",
    nationalId: "",
    emergencyContact: "",
    emergencyPhone: "",
    address: "",
    phone: "",
    email: "",
  });
  const [showCreateTransactionModal, setShowCreateTransactionModal] =
    useState(false);
  const [createTransactionFormData, setCreateTransactionFormData] = useState({
    relatedEntityType: "ServiceRequest" as "ServiceRequest" | "Appointment" | "CryoStorageContract",
    relatedEntityId: "",
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [createdTransactionId, setCreatedTransactionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!patient) return;
    setFormState({
      patientCode: patient.patientCode || "",
      nationalId: patient.nationalId || "",
      emergencyContact: getPatientProperty(patient, "emergencyContact", ""),
      emergencyPhone: getPatientProperty(patient, "emergencyPhone", ""),
      address:
        (isPatientDetailResponse(patient)
          ? patient.accountInfo?.address
          : null) ||
        patient.address ||
        "",
      phone:
        (isPatientDetailResponse(patient)
          ? patient.accountInfo?.phone
          : null) ||
        patient.phoneNumber ||
        "",
      email:
        (isPatientDetailResponse(patient)
          ? patient.accountInfo?.email
          : null) ||
        patient.email ||
        "",
    });
    debug("Form state initialised", { patientCode: patient.patientCode });
  }, [patient]);

  const updatePatientMutation = useMutation({
    mutationFn: () =>
      api.patient.updatePatient(patientId, {
        nationalId: formState.nationalId || undefined,
        fullName: patient?.fullName || undefined,
        dateOfBirth: patient?.dateOfBirth || undefined,
        gender: patient?.gender as any,
        phoneNumber: formState.phone || undefined,
        email: formState.email || undefined,
        address: formState.address || undefined,
        bloodType: patient?.bloodType || undefined,
      }),
    onSuccess: () => {
      toast.success("Patient profile updated");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "patient", patientId],
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      debug("Update patient failed", error);
      const message =
        error?.response?.data?.message ||
        "Unable to update patient. Please try again.";
      toast.error(message);
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: () =>
      api.transaction.createPaymentQR({
        relatedEntityType: createTransactionFormData.relatedEntityType,
        relatedEntityId: createTransactionFormData.relatedEntityId,
      }),
    onSuccess: (response) => {
      if (response.data) {
        setQrCodeUrl(response.data.paymentUrl || null);
        setCreatedTransactionId(response.data.id);
        setShowCreateTransactionModal(false);
        setShowQRCode(true);
        toast.success("Transaction created successfully");
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "transactions"],
        });
        // Reset form
        setCreateTransactionFormData({
          relatedEntityType: "ServiceRequest",
          relatedEntityId: "",
        });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create transaction. Please try again."
      );
    },
  });

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800";
      case "Confirmed":
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "Completed":
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "Cancelled":
      case "cancelled":
      case "Rejected":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const recentRequests = patientServiceRequests?.data ?? [];
  const recentAppointments = patientAppointments?.data ?? [];

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Patient detail</h1>
              <p className="text-gray-600">
                Patient ID: <span className="font-semibold">{patientId}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/receptionist/patients" })}
            >
              Back to list
            </Button>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {isLoading ? "Loading..." : displayName}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Account ID: {patient?.accountId || "—"} · Blood type:{" "}
                  {patient?.bloodType || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  Email:{" "}
                  {(patient && isPatientDetailResponse(patient)
                    ? patient.accountInfo?.email
                    : null) ||
                    patient?.email ||
                    "-"}{" "}
                  · Phone:{" "}
                  {(patient && isPatientDetailResponse(patient)
                    ? patient.accountInfo?.phone
                    : null) ||
                    patient?.phoneNumber ||
                    "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowCreateTransactionModal(true)}
                >
                  Create Transaction
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/doctor/encounters/create",
                      search: { patientId },
                    })
                  }
                >
                  Create encounter
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: "/doctor/patients/$patientId",
                      params: { patientId },
                    })
                  }
                >
                  Open doctor view
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  Basic profile{" "}
                  <Button
                    size="sm"
                    variant="link"
                    className="ml-2"
                    onClick={() => setIsEditing((prev) => !prev)}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Patient code
                      </label>
                      <Input
                        value={formState.patientCode}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            patientCode: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        National ID
                      </label>
                      <Input
                        value={formState.nationalId}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            nationalId: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Emergency contact
                      </label>
                      <Input
                        value={formState.emergencyContact}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            emergencyContact: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Emergency phone
                      </label>
                      <Input
                        value={formState.emergencyPhone}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            emergencyPhone: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updatePatientMutation.mutate()}
                        disabled={updatePatientMutation.isPending}
                      >
                        Save changes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          if (patient) {
                            setFormState({
                              patientCode: patient.patientCode || "",
                              nationalId: patient.nationalId || "",
                              emergencyContact: getPatientProperty(
                                patient,
                                "emergencyContact",
                                ""
                              ),
                              emergencyPhone: getPatientProperty(
                                patient,
                                "emergencyPhone",
                                ""
                              ),
                              address:
                                (isPatientDetailResponse(patient)
                                  ? patient.accountInfo?.address
                                  : null) ||
                                patient.address ||
                                "",
                              phone:
                                (isPatientDetailResponse(patient)
                                  ? patient.accountInfo?.phone
                                  : null) ||
                                patient.phoneNumber ||
                                "",
                              email:
                                (isPatientDetailResponse(patient)
                                  ? patient.accountInfo?.email
                                  : null) ||
                                patient.email ||
                                "",
                            });
                          }
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p>
                      <span className="font-medium text-gray-900">
                        Patient code:
                      </span>{" "}
                      {patient?.patientCode || "Not assigned"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        National ID:
                      </span>{" "}
                      {patient?.nationalId || "Not recorded"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Emergency contact:
                      </span>{" "}
                      {getPatientProperty(
                        patient,
                        "emergencyContact",
                        "Not provided"
                      )}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Emergency phone:
                      </span>{" "}
                      {getPatientProperty(patient, "emergencyPhone", "-")}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Insurance:
                      </span>{" "}
                      {getPatientProperty(
                        patient,
                        "insurance",
                        "No insurance info"
                      )}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">
                        Created at:
                      </span>{" "}
                      {patient?.createdAt || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-gray-900">Status:</span>{" "}
                      {patient?.isActive ? "Active" : "Inactive"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-medium text-gray-900">
                    Medical history:
                  </span>{" "}
                  {getPatientProperty(
                    patient,
                    "medicalHistory",
                    "Not recorded"
                  )}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Allergies:</span>{" "}
                  {getPatientProperty(patient, "allergies", "None reported")}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Occupation:</span>{" "}
                  {getPatientProperty(patient, "occupation", "Not available")}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Notes:</span>{" "}
                  {getPatientProperty(patient, "notes", "No notes")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Recent service requests</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate({ to: "/receptionist/service-requests" })
                  }
                >
                  Manage
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {recentRequests.length ? (
                  recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.requestCode || "General enquiry"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested: {request.requestedDate || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            statusBadgeClass(request.status)
                          )}
                        >
                          {request.status || "pending"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: "/receptionist/service-requests/$serviceRequestId",
                              params: { serviceRequestId: request.id },
                            })
                          }
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No service requests logged for this patient yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Appointments history</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ to: "/receptionist/appointments" })}
                >
                  Schedule
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {recentAppointments.length ? (
                  recentAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.appointmentCode ||
                            `appointment #${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.appointmentDate || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            statusBadgeClass(appointment.status)
                          )}
                        >
                          {appointment.status || "scheduled"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: "/receptionist/appointments/$appointmentId",
                              params: { appointmentId: appointment.id },
                            })
                          }
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No appointments on record. Create one to begin scheduling.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Transaction Modal */}
        <Modal
          isOpen={showCreateTransactionModal}
          onClose={() => {
            setShowCreateTransactionModal(false);
            setCreateTransactionFormData({
              relatedEntityType: "ServiceRequest",
              relatedEntityId: "",
            });
          }}
          title="Create Payment Transaction"
          description={`Create a new payment transaction for ${displayName}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Entity Type <span className="text-red-500">*</span>
              </label>
              <select
                value={createTransactionFormData.relatedEntityType}
                onChange={(e) => {
                  setCreateTransactionFormData((prev) => ({
                    ...prev,
                    relatedEntityType: e.target.value as
                      | "ServiceRequest"
                      | "Appointment"
                      | "CryoStorageContract",
                    relatedEntityId: "", // Reset when type changes
                  }));
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ServiceRequest">Service Request</option>
                <option value="Appointment">Appointment</option>
                <option value="CryoStorageContract">
                  Cryo Storage Contract
                </option>
              </select>
            </div>

            {createTransactionFormData.relatedEntityType ===
              "ServiceRequest" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Service Request <span className="text-red-500">*</span>
                </label>
                <select
                  value={createTransactionFormData.relatedEntityId}
                  onChange={(e) =>
                    setCreateTransactionFormData((prev) => ({
                      ...prev,
                      relatedEntityId: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    {patientServiceRequests?.data?.length
                      ? "Select a service request"
                      : "No service requests found"}
                  </option>
                  {patientServiceRequests?.data?.map((request) => (
                    <option key={request.id} value={request.id}>
                      {request.requestCode || request.id.slice(0, 8)} -{" "}
                      {request.status || "Pending"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {createTransactionFormData.relatedEntityType === "Appointment" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment <span className="text-red-500">*</span>
                </label>
                <select
                  value={createTransactionFormData.relatedEntityId}
                  onChange={(e) =>
                    setCreateTransactionFormData((prev) => ({
                      ...prev,
                      relatedEntityId: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    {patientAppointments?.data?.length
                      ? "Select an appointment"
                      : "No appointments found"}
                  </option>
                  {patientAppointments?.data?.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {appointment.appointmentDate
                        ? new Date(appointment.appointmentDate).toLocaleDateString(
                            "vi-VN"
                          )
                        : "No date"}{" "}
                      - {appointment.status || "Pending"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {createTransactionFormData.relatedEntityType ===
              "CryoStorageContract" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Cryo Storage Contract <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={createTransactionFormData.relatedEntityId}
                  onChange={(e) =>
                    setCreateTransactionFormData((prev) => ({
                      ...prev,
                      relatedEntityId: e.target.value,
                    }))
                  }
                  placeholder="Enter contract ID (UUID)"
                />
                <p className="text-xs text-gray-500">
                  Note: CryoStorageContract API integration pending. Please
                  enter the contract ID manually.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => createTransactionMutation.mutate()}
                disabled={
                  !createTransactionFormData.relatedEntityId ||
                  createTransactionMutation.isPending
                }
                className="flex-1"
              >
                {createTransactionMutation.isPending
                  ? "Creating..."
                  : "Create Transaction"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTransactionModal(false);
                  setCreateTransactionFormData({
                    relatedEntityType: "ServiceRequest",
                    relatedEntityId: "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* QR Code Modal for Created Transaction */}
        <Modal
          isOpen={showQRCode && Boolean(createdTransactionId)}
          onClose={() => {
            setShowQRCode(false);
            setQrCodeUrl(null);
            setCreatedTransactionId(null);
          }}
          title="Payment QR Code"
          description="Scan this QR code to complete payment"
          size="md"
        >
          <div className="space-y-4">
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="max-w-full h-auto border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Scan this QR code with your payment app to complete the
                    transaction.
                  </p>
                  {createdTransactionId && (
                    <p className="mt-2 text-xs">
                      Transaction ID: {createdTransactionId.slice(0, 8)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      navigate({ to: "/receptionist/transactions" })
                    }
                  >
                    View All Transactions
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowQRCode(false);
                      setQrCodeUrl(null);
                      setCreatedTransactionId(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                Unable to generate QR code. Please try again.
              </div>
            )}
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
