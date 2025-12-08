import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import type { ServiceRequestStatus, Appointment, Patient } from "@/api/types";
import { ServiceRequestDetailModal } from "@/features/doctor/service-requests/ServiceRequestDetailModal";
import { CreateServiceRequestModal } from "@/features/doctor/service-requests/CreateServiceRequestModal";
import { ServiceRequestActionModal } from "@/features/doctor/service-requests/ServiceRequestActionModal";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/doctor/service-requests")({
  component: DoctorServiceRequestsComponent,
});

function DoctorServiceRequestsComponent() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailModalRequestId, setDetailModalRequestId] = useState<
    string | null
  >(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
    action: "reject" | "complete" | null;
  }>({
    isOpen: false,
    requestId: null,
    action: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor", "service-requests"] }),
    ]);
    setIsRefreshing(false);
  };

  const statusParam = (statusFilter || undefined) as
    | ServiceRequestStatus
    | undefined;

  const { data, isFetching } = useQuery({
    queryKey: [
      "doctor",
      "service-requests",
      {
        pageNumber: page,
        pageSize,
        status: statusParam,
        searchTerm: searchTerm || undefined,
      },
    ],
    retry: false,
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        pageNumber: page,
        pageSize,
        status: statusParam,
      }),
  });

  // Extract unique appointment IDs from service requests
  const appointmentIds = useMemo(() => {
    if (!data?.data) return [];
    return Array.from(
      new Set(
        data.data
          .map((req) => req.appointmentId)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [data?.data]);

  // Fetch appointments first
  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "by-ids", appointmentIds],
    enabled: appointmentIds.length > 0,
    queryFn: async () => {
      const results: Record<string, Appointment & { patient?: Patient }> = {};
      await Promise.all(
        appointmentIds.map(async (id) => {
          try {
            const response = await api.appointment.getAppointmentById(id);
            if (response.data) {
              // AppointmentDetailResponse extends Appointment and may have nested patient
              const aptDetail = response.data as Appointment & {
                patient?: Patient;
              };

              // Ensure patientId is set if we have nested patient
              if (aptDetail.patient && !aptDetail.patientId) {
                aptDetail.patientId = aptDetail.patient.id;
              }

              results[id] = aptDetail;
            }
          } catch (error) {
            // Log error for debugging
            console.warn(`Failed to fetch appointment ${id}:`, error);
          }
        })
      );
      return results;
    },
  });

  // Extract patient IDs from service requests and appointments
  const patientIds = useMemo(() => {
    const ids: string[] = [];

    // Get patientIds directly from service requests if available
    if (data?.data) {
      data.data.forEach((req) => {
        if (req.patientId) {
          ids.push(req.patientId);
        }
      });
    }

    // Get patientIds from appointments
    const appointments = appointmentsQuery.data ?? {};
    Object.values(appointments).forEach((apt) => {
      // Try multiple ways to get patientId from appointment
      const aptPatientId =
        apt.patientId ?? apt.patient?.id ?? (apt as any)?.patientId;

      if (aptPatientId) {
        ids.push(aptPatientId);
      }

      // Also store nested patient in patients map if available
      if (apt.patient && apt.patient.id) {
        // This will be handled by patientsQuery, but we ensure it's in the list
        if (!ids.includes(apt.patient.id)) {
          ids.push(apt.patient.id);
        }
      }
    });

    return Array.from(new Set(ids));
  }, [data?.data, appointmentsQuery.data]);

  // Fetch patients after we have patientIds from both sources
  // Also include nested patients from appointments
  const patientsQuery = useQuery({
    queryKey: ["patients", "by-ids", patientIds, appointmentsQuery.data],
    enabled:
      patientIds.length > 0 ||
      Object.keys(appointmentsQuery.data ?? {}).length > 0,
    queryFn: async () => {
      const results: Record<string, Patient> = {};

      // First, extract nested patients from appointments if available
      const appointments = appointmentsQuery.data ?? {};
      Object.values(appointments).forEach((apt) => {
        if (apt.patient && apt.patient.id) {
          results[apt.patient.id] = apt.patient;
        }
      });

      // Then fetch remaining patients that weren't in appointments
      const missingPatientIds = patientIds.filter((id) => !results[id]);

      if (missingPatientIds.length > 0) {
        await Promise.all(
          missingPatientIds.map(async (id) => {
            try {
              const response = await api.patient.getPatientById(id);
              if (response.data) {
                results[id] = response.data;
              }
            } catch (error) {
              // Try to get patient details as fallback
              try {
                const fallback = await api.patient.getPatientDetails(id);
                if (fallback.data) {
                  results[id] = fallback.data as Patient;
                }
              } catch {
                // Ignore errors for individual patients
                console.warn(`Failed to fetch patient ${id}:`, error);
              }
            }
          })
        );
      }

      return results;
    },
  });

  const statusActionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "reject" | "complete";
    }) => {
      switch (action) {
        case "reject":
          return api.serviceRequest.rejectServiceRequest(id);
        case "complete":
          return api.serviceRequest.completeServiceRequest(id);
      }
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["doctor", "service-requests"],
      });
      const actionText =
        variables.action === "reject"
          ? "rejected"
          : "completed";
      toast.success(`Service request ${actionText} successfully`);
      
      // Send notification to patient
      if (response.data?.patientId) {
        const { sendServiceRequestNotification } = await import(
          "@/utils/notifications"
        );
        const action =
          variables.action === "reject"
            ? "rejected"
            : "completed";
        
        await sendServiceRequestNotification(
          response.data.patientId,
          action,
          {
            serviceRequestId: response.data.id,
            serviceName: undefined, // Could fetch service details if needed
            notes: response.data.notes || undefined,
          }
        );
      }
      
      setActionModal({ isOpen: false, requestId: null, action: null });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to update service request";
      toast.error(message);
    },
  });

  const handleStatusAction = (
    id: string,
    action: "reject" | "complete"
  ) => {
    setActionModal({ isOpen: true, requestId: id, action });
  };

  const handleConfirmAction = () => {
    if (actionModal.requestId && actionModal.action) {
      statusActionMutation.mutate({
        id: actionModal.requestId,
        action: actionModal.action,
      });
    }
  };

  const getStatusBadgeVariant = (status: ServiceRequestStatus) => {
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

  const serviceRequests = data?.data ?? [];
  const appointments = appointmentsQuery.data ?? {};
  const patients = patientsQuery.data ?? {};
  const metaData = data?.metaData;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Service Requests</h1>
              <p className="mt-2 text-gray-600">
                Manage service requests for patient appointments.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create Service Request
              </Button>
            </div>
          </section>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Service Requests</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Search by request code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-48"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isFetching ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading service requests...
                </div>
              ) : serviceRequests.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No service requests found.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Request Code
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Patient
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Appointment
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Requested Date
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceRequests.map((request) => {
                          const appointment = request.appointmentId
                            ? appointments[request.appointmentId]
                            : null;

                          // Try multiple ways to get patientId
                          // Priority: request.patientId > appointment.patientId > appointment.patient.id
                          const patientId =
                            request.patientId ??
                            appointment?.patientId ??
                            appointment?.patient?.id ??
                            null;

                          // Try to get patient from multiple sources
                          // Priority: patients map > appointment.patient (nested)
                          const patient =
                            (patientId ? patients[patientId] : null) ??
                            appointment?.patient ??
                            null;

                          return (
                            <tr
                              key={request.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3 text-sm">
                                {request.requestCode
                                  ? getLast4Chars(request.requestCode)
                                  : getLast4Chars(request.id)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {patient
                                  ? `${patient.fullName}${patient.patientCode ? ` (${patient.patientCode})` : ""}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {appointment
                                  ? appointment.appointmentCode
                                    ? getLast4Chars(appointment.appointmentCode)
                                    : getLast4Chars(appointment.id)
                                  : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    request.status
                                  )}
                                >
                                  {request.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {formatDate(
                                  request.requestDate ?? request.requestedDate
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setDetailModalRequestId(request.id)
                                    }
                                  >
                                    View
                                  </Button>
                                  {request.status === "Pending" && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusAction(
                                          request.id,
                                          "reject"
                                        )
                                      }
                                      disabled={
                                        statusActionMutation.isPending
                                      }
                                    >
                                      Reject
                                    </Button>
                                  )}
                                  {(request.status === "Approved" || request.status === "Pending") && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusAction(
                                          request.id,
                                          "complete"
                                        )
                                      }
                                      disabled={statusActionMutation.isPending}
                                    >
                                      Complete
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {metaData && metaData.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="text-sm text-gray-600">
                        Showing {metaData.pageNumber} of {metaData.totalPages}{" "}
                        pages ({metaData.totalCount} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={!metaData.hasPrevious || isFetching}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((p) => Math.min(metaData.totalPages, p + 1))
                          }
                          disabled={!metaData.hasNext || isFetching}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {detailModalRequestId && (
          <ServiceRequestDetailModal
            requestId={detailModalRequestId}
            isOpen={!!detailModalRequestId}
            onClose={() => setDetailModalRequestId(null)}
          />
        )}

        <CreateServiceRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({
              queryKey: ["doctor", "service-requests"],
            });
          }}
        />

        {actionModal.isOpen && actionModal.requestId && (
          <ServiceRequestActionModal
            isOpen={actionModal.isOpen}
            onClose={() =>
              setActionModal({ isOpen: false, requestId: null, action: null })
            }
            request={
              serviceRequests.find((r) => r.id === actionModal.requestId) ??
              null
            }
            action={actionModal.action}
            onConfirm={handleConfirmAction}
            isLoading={statusActionMutation.isPending}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
