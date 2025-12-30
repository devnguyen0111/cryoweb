import { useEffect, useState } from "react";
import axios, { isAxiosError } from "axios";
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
import { getStatusBadgeClass } from "@/utils/status-colors";

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
      if (!patientId) return null;
      // usePatientDetails returns data directly, but we need the full response here
      // So we keep the query but use the same pattern
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallbackResponse = await api.patient.getPatientById(patientId);
          return fallbackResponse;
        }
        throw error;
      }
    },
    enabled: !!patientId,
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

  // Query patient appointments
  const { data: patientAppointments } = useQuery({
    queryKey: ["receptionist", "patient", "appointments", patientId],
    queryFn: async () => {
      try {
        return await api.appointment.getAppointments({
          patientId: patientId,
          pageNumber: 1,
          pageSize: 10,
        });
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
        }
        throw error;
      }
    },
    enabled: Boolean(patientId),
  });

  // Query cryo storage contracts for current patient
  const { data: patientCryoContracts } = useQuery({
    queryKey: ["receptionist", "cryo-storage-contracts", { patientId }],
    queryFn: async () => {
      // TODO: Replace with actual API call when CryoStorageContract API module is available
      // For now, using direct axios call as API integration is pending
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "https://cryofert.runasp.net/api";
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${API_BASE_URL}/CryoStorageContract`,
          {
            params: {
              patientId: patientId,
              pageNumber: 1,
              pageSize: 50,
            },
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
              "Content-Type": "application/json",
            },
          }
        );
        return {
          data: response.data?.data || [],
          metaData: response.data?.metaData || { totalCount: 0, totalPages: 0 },
        };
      } catch {
        return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
      }
    },
    enabled: Boolean(patientId),
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
    (patient?.firstName && patient?.lastName
      ? `${patient.firstName} ${patient.lastName}`.trim()
      : patient?.firstName || patient?.lastName) ||
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
    relatedEntityType: "ServiceRequest" as
      | "ServiceRequest"
      | "CryoStorageContract",
    relatedEntityId: "",
    paymentGateway: "PayOS" as "PayOS",
  });
  const [showQRCode, setShowQRCode] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
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
        firstName: patient?.firstName || undefined,
        lastName: patient?.lastName || undefined,
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
        paymentGateway: createTransactionFormData.paymentGateway,
      }),
    onSuccess: (response) => {
      if (response.data) {
        // For PayOS, check for qrCodeData or qrCodeUrl
        // For PayOS, check for qrCodeData or qrCodeUrl
        const qrCodeData = (response.data as any).qrCodeData;
        const qrCodeUrl =
          (response.data as any).qrCodeUrl ||
          response.data.paymentUrl;

        if (qrCodeData) {
          setQrCodeData(qrCodeData);
        }
        if (qrCodeUrl) {
          setPaymentUrl(qrCodeUrl);
        }

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
          paymentGateway: "PayOS",
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
    return getStatusBadgeClass(status, "auto");
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
                        Citizen ID Card
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
                        Citizen ID Card:
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
                  recentAppointments.map((appointment: any, index: number) => (
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
              paymentGateway: "PayOS",
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
                      | "CryoStorageContract",
                    relatedEntityId: "", // Reset when type changes
                  }));
                }}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="ServiceRequest">Service Request</option>
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

            {createTransactionFormData.relatedEntityType ===
              "CryoStorageContract" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Cryo Storage Contract <span className="text-red-500">*</span>
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
                    {patientCryoContracts?.data?.length
                      ? "Select a cryo storage contract"
                      : "No cryo storage contracts found"}
                  </option>
                  {patientCryoContracts?.data?.map((contract: any) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contractNumber || contract.id.slice(0, 8)} -{" "}
                      {contract.status || "Active"}
                    </option>
                  ))}
                </select>
                {patientCryoContracts?.data?.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No cryo storage contracts found for this patient. You may
                    need to enter the contract ID manually.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Payment Gateway <span className="text-red-500">*</span>
              </label>
              <select
                value={createTransactionFormData.paymentGateway}
                onChange={(e) =>
                  setCreateTransactionFormData((prev) => ({
                    ...prev,
                    paymentGateway: e.target.value as "PayOS",
                  }))
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="PayOS">PayOS</option>
              </select>
            </div>

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
                    paymentGateway: "PayOS",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Payment QR Code/URL Modal for Created Transaction */}
        <Modal
          isOpen={showQRCode && Boolean(createdTransactionId)}
          onClose={() => {
            setShowQRCode(false);
            setPaymentUrl(null);
            setQrCodeData(null);
            setCreatedTransactionId(null);
          }}
          title="Payment Transaction Created"
          description={
            qrCodeData
              ? "Scan the QR code to complete payment"
              : "Click the link below to complete payment"
          }
          size="md"
        >
          <div className="space-y-4">
            {qrCodeData ? (
              // PayOS QR Code Display
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: qrCodeData }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Scan this QR code with your payment app to complete the
                    transaction.
                  </p>
                  {createdTransactionId && (
                    <p className="mt-2 text-xs text-gray-500">
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
                      setPaymentUrl(null);
                      setQrCodeData(null);
                      setCreatedTransactionId(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : paymentUrl ? (
              // Payment URL Display
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Click the button below to open the payment page and complete
                    the transaction.
                  </p>
                  {createdTransactionId && (
                    <p className="mt-2 text-xs text-gray-500">
                      Transaction ID: {createdTransactionId.slice(0, 8)}
                    </p>
                  )}
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
                        setPaymentUrl(null);
                        setQrCodeData(null);
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
                Unable to get payment information. Please try again.
              </div>
            )}
          </div>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
