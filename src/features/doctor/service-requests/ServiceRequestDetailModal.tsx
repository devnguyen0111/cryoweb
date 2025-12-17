import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { toast } from "sonner";
import type {
  ServiceRequest,
  ServiceRequestDetail,
  Appointment,
  Patient,
  PatientDetailResponse,
  Service,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServiceRequestStatusBadgeClass } from "@/utils/status-colors";
import { cn } from "@/utils/cn";
import { UpdateServiceRequestDetailImageForm } from "./UpdateServiceRequestDetailImageForm";
import { Image as ImageIcon } from "lucide-react";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { getLast4Chars } from "@/utils/id-helpers";
import { useAuth } from "@/contexts/AuthContext";
interface ServiceRequestDetailModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  allowImageUpload?: boolean; // Optional prop to control image upload
  allowCreateTransaction?: boolean; // Optional prop to control transaction creation
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const getStatusBadgeClass = (status: string) => {
  return getServiceRequestStatusBadgeClass(status);
};

export function ServiceRequestDetailModal({
  requestId,
  isOpen,
  onClose,
  allowImageUpload = true, // Default to true for backward compatibility
  allowCreateTransaction = false, // Default to false, enable for receptionist
}: ServiceRequestDetailModalProps) {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  // Disable image upload for Receptionist role
  const canUploadImage = allowImageUpload && userRole !== "Receptionist";

  const [selectedDetailForImage, setSelectedDetailForImage] =
    useState<ServiceRequestDetail | null>(null);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [createdTransactionId, setCreatedTransactionId] = useState<
    string | null
  >(null);
  const { data: request, isLoading: requestLoading } =
    useQuery<ServiceRequest | null>({
      enabled: isOpen && Boolean(requestId),
      queryKey: ["service-request", "detail", requestId],
      retry: false,
      queryFn: async () => {
        if (!requestId) return null;
        try {
          const response =
            await api.serviceRequest.getServiceRequestById(requestId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
    });

  // Use serviceDetails from request if available, otherwise fetch separately
  const { data: requestDetails, isLoading: detailsLoading } = useQuery<
    ServiceRequestDetail[]
  >({
    enabled: isOpen && Boolean(requestId) && !request?.serviceDetails,
    queryKey: ["service-request-details", requestId],
    retry: false,
    queryFn: async () => {
      if (!requestId) return [];
      try {
        const response =
          await api.serviceRequestDetails.getServiceRequestDetailsByServiceRequest(
            requestId
          );
        return response.data ?? [];
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
  });

  // Use serviceDetails from request if available, otherwise use fetched details
  const serviceDetails = request?.serviceDetails ?? requestDetails ?? [];

  // Fetch media for all service details to get filePath
  const detailIds = serviceDetails
    .map((detail) => detail.id)
    .filter((id): id is string => Boolean(id));

  const { data: mediaMap } = useQuery<Record<string, string>>({
    enabled: isOpen && detailIds.length > 0,
    queryKey: ["media", "service-request-details", detailIds, serviceDetails],
    queryFn: async () => {
      const results: Record<string, string> = {};
      // Fetch media for each detail
      await Promise.all(
        serviceDetails.map(async (detail) => {
          try {
            let mediaPath = "";
            // If detail has mediaId, fetch by ID first
            if (detail.mediaId) {
              try {
                const mediaResponse = await api.media.getMediaById(
                  detail.mediaId
                );
                if (mediaResponse.data) {
                  mediaPath =
                    mediaResponse.data.filePath ||
                    mediaResponse.data.fileUrl ||
                    "";
                }
              } catch (error) {
                // If fetch by ID fails, fallback to fetch by entity
              }
            }

            // If no mediaId or fetch by ID failed, fetch by RelatedEntityId
            if (!mediaPath) {
              const response = await api.media.getMedias({
                RelatedEntityType: "ServiceRequestDetails",
                RelatedEntityId: detail.id,
                Size: 1, // Get the latest one
                Sort: "uploadDate",
                Order: "desc",
              });
              // Get the first (latest) media's filePath
              if (response.data && response.data.length > 0) {
                const media = response.data[0];
                mediaPath = media.filePath || media.fileUrl || "";
              }
            }

            if (mediaPath) {
              results[detail.id] = mediaPath;
            }
          } catch (error) {
            // Ignore errors for individual media fetches
          }
        })
      );
      return results;
    },
  });

  const serviceIds = serviceDetails
    .map((detail) => detail.serviceId)
    .filter((id): id is string => Boolean(id));

  const { data: services } = useQuery<Record<string, Service>>({
    enabled: isOpen && serviceIds.length > 0,
    queryKey: ["services", "by-ids", serviceIds],
    queryFn: async () => {
      const results: Record<string, Service> = {};
      await Promise.all(
        serviceIds.map(async (id) => {
          try {
            const response = await api.service.getServiceById(id);
            if (response.data) {
              results[id] = response.data;
            }
          } catch (error) {
            // Ignore errors for individual services
          }
        })
      );
      return results;
    },
  });

  const { data: appointment } = useQuery<Appointment | null>({
    enabled: isOpen && Boolean(request?.appointmentId),
    queryKey: ["appointment", request?.appointmentId],
    retry: false,
    queryFn: async () => {
      if (!request?.appointmentId) return null;
      try {
        const response = await api.appointment.getAppointmentById(
          request.appointmentId
        );
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  // Get patientId from request or appointment (try multiple sources)
  const patientId = useMemo(() => {
    if (!request && !appointment) return null;

    // Try from request first
    if (request?.patientId) return request.patientId;

    // Try from appointment - multiple field name variations
    if (appointment) {
      const raw = appointment as unknown as Record<string, any>;
      return (
        appointment.patientId ??
        raw.patientID ??
        raw.PatientId ??
        raw.PatientID ??
        raw.patient?.id ??
        raw.patient?.patientId ??
        raw.patient?.accountId ??
        raw.patientAccountId ??
        raw.patientAccountID ??
        null
      );
    }

    return null;
  }, [request?.patientId, appointment]);

  // Try to get patient from appointment first (nested), then fetch if needed
  const patientFromAppointment = useMemo(() => {
    if (appointment) {
      const raw = appointment as unknown as Record<string, any>;
      if (raw.patient) {
        return raw.patient as Patient | PatientDetailResponse;
      }
    }
    return null;
  }, [appointment]);

  const { data: patient, isLoading: patientLoading } = useQuery<
    Patient | PatientDetailResponse | null
  >({
    enabled: isOpen && Boolean(patientId) && !patientFromAppointment,
    queryKey: ["patient", patientId, "service-request-detail"],
    retry: false,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientById(patientId);
        return response.data ?? null;
      } catch (error) {
        // Try patient details as fallback
        if (isAxiosError(error)) {
          try {
            const fallback = await api.patient.getPatientDetails(patientId);
            return fallback.data ?? null;
          } catch {
            // If both fail, return null
            return null;
          }
        }
        return null;
      }
    },
  });

  // Use patient from appointment if available, otherwise use fetched patient
  const finalPatient = patientFromAppointment || patient;

  const isLoading =
    requestLoading || (detailsLoading && !request?.serviceDetails);

  // Calculate total amount from service details if available, otherwise use request totalAmount
  const totalAmount = useMemo(() => {
    if (serviceDetails && serviceDetails.length > 0) {
      return serviceDetails.reduce((sum, detail) => {
        const detailTotal =
          detail.totalPrice ??
          (detail.unitPrice ?? detail.price ?? 0) * (detail.quantity ?? 0);
        return sum + (detailTotal || 0);
      }, 0);
    }
    return request?.totalAmount ?? 0;
  }, [serviceDetails, request?.totalAmount]);

  // Create payment transaction mutation (VNPay)
  const createPaymentQRMutation = useMutation({
    mutationFn: () => {
      return api.transaction.createPaymentQR({
        relatedEntityType: "ServiceRequest",
        relatedEntityId: requestId,
      });
    },
    onSuccess: (response) => {
      if (response.data) {
        setPaymentUrl(
          response.data.paymentUrl || response.data.vnPayUrl || null
        );
        setCreatedTransactionId(response.data.id);
        setShowPaymentMethodModal(false);
        setShowPaymentModal(true);
        toast.success("Payment transaction created successfully");
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "transactions"],
        });
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "service-requests"],
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

  // Create cash transaction mutation
  const createCashTransactionMutation = useMutation({
    mutationFn: () => {
      return api.transaction.createCashPayment({
        relatedEntityType: "ServiceRequest",
        relatedEntityId: requestId,
      });
    },
    onSuccess: (response) => {
      if (response.data) {
        setCreatedTransactionId(response.data.id);
        setShowPaymentMethodModal(false);
        toast.success("Cash transaction created successfully");
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "transactions"],
        });
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "service-requests"],
        });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create cash transaction. Please try again."
      );
    },
  });

  const handleCreatePayment = () => {
    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }
    setShowPaymentMethodModal(true);
  };

  const handleSelectPaymentMethod = (method: "cash" | "vnpay") => {
    if (method === "cash") {
      createCashTransactionMutation.mutate();
    } else {
      createPaymentQRMutation.mutate();
    }
  };

  return (
    <Modal
      title="Service Request Details"
      description="View detailed information about the service request."
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading service request details...
        </div>
      ) : !request ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Service request not found.</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Information</CardTitle>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold border",
                    getStatusBadgeClass(request.status)
                  )}
                >
                  {request.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Request Code
                  </p>
                  <p className="mt-1 text-sm">
                    {request.requestCode || `#${getLast4Chars(request.id)}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1 text-sm">{request.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Requested Date
                  </p>
                  <p className="mt-1 text-sm">
                    {formatDate(request.requestDate ?? request.requestedDate)}
                  </p>
                </div>
                {request.approvedDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Approved Date
                    </p>
                    <p className="mt-1 text-sm">
                      {formatDate(request.approvedDate)}
                    </p>
                  </div>
                )}
                {request.approvedBy && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Approved By
                    </p>
                    <p className="mt-1 text-sm">{request.approvedBy}</p>
                  </div>
                )}
              </div>
              {request.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              {patientLoading && !patientFromAppointment ? (
                <p className="text-sm text-gray-500">
                  Loading patient information...
                </p>
              ) : finalPatient ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="mt-1 text-sm">
                      {getFullNameFromObject(finalPatient as Patient) ||
                        (finalPatient as any)?.accountInfo?.username ||
                        (finalPatient as any)?.userName ||
                        "—"}
                    </p>
                  </div>
                  {((finalPatient as Patient).patientCode ||
                    (finalPatient as any)?.patientCode) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Patient Code
                      </p>
                      <p className="mt-1 text-sm">
                        {(finalPatient as Patient).patientCode ||
                          (finalPatient as any)?.patientCode ||
                          "—"}
                      </p>
                    </div>
                  )}
                  {((finalPatient as Patient).phoneNumber ||
                    (finalPatient as any)?.accountInfo?.phone ||
                    (finalPatient as any)?.phoneNumber) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1 text-sm">
                        {(finalPatient as Patient).phoneNumber ||
                          (finalPatient as any)?.accountInfo?.phone ||
                          (finalPatient as any)?.phoneNumber ||
                          "—"}
                      </p>
                    </div>
                  )}
                  {((finalPatient as Patient).email ||
                    (finalPatient as any)?.accountInfo?.email ||
                    (finalPatient as any)?.email) && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-sm">
                        {(finalPatient as Patient).email ||
                          (finalPatient as any)?.accountInfo?.email ||
                          (finalPatient as any)?.email ||
                          "—"}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Patient not found</p>
              )}
            </CardContent>
          </Card>

          {appointment && (
            <Card>
              <CardHeader>
                <CardTitle>Appointment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Appointment Code
                    </p>
                    <p className="mt-1 text-sm">
                      {appointment.appointmentCode ||
                        (appointment as any)?.appointmentCode ||
                        `#${getLast4Chars(appointment.id)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="mt-1 text-sm">
                      {formatDate(
                        appointment.appointmentDate ||
                          (appointment as any)?.appointmentDate
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="mt-1 text-sm">
                      {appointment.appointmentType ||
                        (appointment as any)?.type ||
                        (appointment as any)?.typeName ||
                        "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1 text-sm">
                      {appointment.status ||
                        (appointment as any)?.statusName ||
                        "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceDetails && serviceDetails.length > 0 ? (
                <div className="space-y-4">
                  <div className="w-full">
                    <table className="w-full min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Service
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Unit Price
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Total
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                            Image
                          </th>
                          {canUploadImage && (
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {serviceDetails.map((detail) => {
                          const service = services?.[detail.serviceId ?? ""];
                          const unitPrice =
                            detail.unitPrice ?? detail.price ?? 0;
                          const total =
                            detail.totalPrice ??
                            unitPrice * (detail.quantity ?? 0);
                          // Get image URL from media API or fallback to detail fields
                          const imageUrl =
                            mediaMap?.[detail.id] ||
                            detail.imageUrl ||
                            detail.fileUrl ||
                            "";
                          const hasImage = !!imageUrl;
                          return (
                            <tr key={detail.id} className="border-b">
                              <td className="px-4 py-2 text-sm">
                                {detail.serviceName ??
                                  service?.name ??
                                  service?.serviceName ??
                                  "—"}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {detail.quantity ?? 0}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {formatCurrency(unitPrice)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {formatCurrency(total)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {hasImage ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={imageUrl}
                                      alt={
                                        detail.serviceName || "Service image"
                                      }
                                      className="h-10 w-10 object-cover rounded border border-gray-200"
                                      onError={(e) => {
                                        (
                                          e.target as HTMLImageElement
                                        ).style.display = "none";
                                      }}
                                    />
                                    <ImageIcon className="h-4 w-4 text-green-500" />
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    No image
                                  </span>
                                )}
                              </td>
                              {canUploadImage && (
                                <td className="px-4 py-2 text-sm">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setSelectedDetailForImage(detail)
                                    }
                                  >
                                    <ImageIcon className="h-4 w-4 mr-1" />
                                    {hasImage ? "Update" : "Add"} Image
                                  </Button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end border-t pt-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">
                        Total Amount
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No service details found
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center gap-2">
            {allowCreateTransaction && totalAmount > 0 && (
              <Button
                onClick={handleCreatePayment}
                disabled={
                  createPaymentQRMutation.isPending ||
                  createCashTransactionMutation.isPending
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {createPaymentQRMutation.isPending ||
                createCashTransactionMutation.isPending
                  ? "Creating Transaction..."
                  : "Create Payment Transaction"}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedDetailForImage && canUploadImage && (
        <UpdateServiceRequestDetailImageForm
          detail={selectedDetailForImage}
          isOpen={!!selectedDetailForImage}
          onClose={() => setSelectedDetailForImage(null)}
          onSuccess={() => {
            setSelectedDetailForImage(null);
          }}
        />
      )}

      {/* Payment Method Selection Modal */}
      <Modal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          setShowPaymentMethodModal(false);
        }}
        title="Select Payment Method"
        description="Choose how you want to process this payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            <p className="font-medium mb-1">Total Amount:</p>
            <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="grid gap-3">
            <Button
              onClick={() => handleSelectPaymentMethod("cash")}
              disabled={createCashTransactionMutation.isPending}
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
            >
              <div className="text-lg">💵</div>
              <div className="text-center">
                <div className="font-semibold">Pay with Cash</div>
                <div className="text-xs text-gray-500 mt-1">
                  Direct cash payment
                </div>
              </div>
              {createCashTransactionMutation.isPending && (
                <div className="text-xs text-gray-500">Processing...</div>
              )}
            </Button>
            <Button
              onClick={() => handleSelectPaymentMethod("vnpay")}
              disabled={createPaymentQRMutation.isPending}
              variant="outline"
              className="w-full h-auto py-4 flex flex-col items-center gap-2"
            >
              <div className="text-lg">💳</div>
              <div className="text-center">
                <div className="font-semibold">Use VNPay</div>
                <div className="text-xs text-gray-500 mt-1">
                  Online payment via VNPay
                </div>
              </div>
              {createPaymentQRMutation.isPending && (
                <div className="text-xs text-gray-500">Processing...</div>
              )}
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowPaymentMethodModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment URL Modal (VNPay) */}
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
                    {formatCurrency(totalAmount)}
                  </p>
                  {createdTransactionId && (
                    <p>
                      <span className="font-medium">Transaction ID:</span>{" "}
                      {getLast4Chars(createdTransactionId)}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Service Request ID:</span>{" "}
                    {getLast4Chars(requestId)}
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
                <Button
                  variant="outline"
                  className="w-full"
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
          ) : (
            <div className="text-center text-sm text-gray-500">
              <p>No payment URL available.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentUrl(null);
                  setCreatedTransactionId(null);
                }}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </Modal>
  );
}
