import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import type {
  ServiceRequest,
  ServiceRequestDetail,
  Appointment,
  Patient,
  Service,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface ServiceRequestDetailModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
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

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Pending":
      return "secondary";
    case "Approved":
      return "default";
    case "Rejected":
      return "destructive";
    case "Completed":
      return "default";
    case "Cancelled":
      return "outline";
    default:
      return "secondary";
  }
};

export function ServiceRequestDetailModal({
  requestId,
  isOpen,
  onClose,
}: ServiceRequestDetailModalProps) {
  const { data: request, isLoading: requestLoading } = useQuery<ServiceRequest | null>({
    enabled: isOpen && Boolean(requestId),
    queryKey: ["service-request", "detail", requestId],
    retry: false,
    queryFn: async () => {
      if (!requestId) return null;
      try {
        const response = await api.serviceRequest.getServiceRequestById(requestId);
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

  // Get patientId from request or appointment
  const patientId = useMemo(() => {
    return request?.patientId ?? appointment?.patientId ?? null;
  }, [request?.patientId, appointment?.patientId]);

  const { data: patient } = useQuery<Patient | null>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["patient", patientId],
    retry: false,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientById(patientId);
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  const isLoading = requestLoading || (detailsLoading && !request?.serviceDetails);

  const totalAmount = request?.totalAmount ?? serviceDetails.reduce(
    (sum, detail) => sum + (detail.totalPrice ?? (detail.unitPrice ?? detail.price ?? 0) * (detail.quantity ?? 0)),
    0
  );

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
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Request Code
                  </p>
                  <p className="mt-1 text-sm">{request.requestCode}</p>
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
              {patient ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="mt-1 text-sm">{patient.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Patient Code
                    </p>
                    <p className="mt-1 text-sm">{patient.patientCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1 text-sm">{patient.phoneNumber}</p>
                  </div>
                  {patient.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Email
                      </p>
                      <p className="mt-1 text-sm">{patient.email}</p>
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
                      {appointment.appointmentCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="mt-1 text-sm">
                      {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="mt-1 text-sm">
                      {appointment.appointmentType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1 text-sm">{appointment.status}</p>
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
                  <div className="overflow-x-auto">
                    <table className="w-full">
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
                        </tr>
                      </thead>
                      <tbody>
                        {serviceDetails.map((detail) => {
                          const service = services?.[detail.serviceId ?? ""];
                          const unitPrice = detail.unitPrice ?? detail.price ?? 0;
                          const total = detail.totalPrice ?? unitPrice * (detail.quantity ?? 0);
                          return (
                            <tr key={detail.id} className="border-b">
                              <td className="px-4 py-2 text-sm">
                                {detail.serviceName ?? service?.name ?? service?.serviceName ?? "—"}
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
                <p className="text-sm text-gray-500">No service details found</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

