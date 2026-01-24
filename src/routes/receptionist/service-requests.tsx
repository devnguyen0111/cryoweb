import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";
import { getServiceRequestStatusBadgeClass } from "@/utils/status-colors";
import { getFullNameFromObject } from "@/utils/name-helpers";
import type { Appointment, Patient } from "@/api/types";
import { ServiceRequestDetailModal } from "@/features/doctor/service-requests/ServiceRequestDetailModal";

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

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
];

export const Route = createFileRoute("/receptionist/service-requests")({
  component: ReceptionistServiceRequestsRoute,
});

function ReceptionistServiceRequestsRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [detailModalRequestId, setDetailModalRequestId] = useState<
    string | null
  >(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "service-requests"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "patients"],
      }),
    ]);
    setIsRefreshing(false);
  };
  const [pageSize] = useState(10);
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filters = useMemo(
    () => ({ status, serviceId, dateFrom, dateTo, searchTerm }),
    [status, serviceId, dateFrom, dateTo, searchTerm]
  );

  const { data: servicesData } = useQuery({
    queryKey: ["services", { pageNumber: 1, pageSize: 100 }],
    queryFn: () => api.service.getServices({ pageNumber: 1, pageSize: 100 }),
  });

  const serviceOptions = useMemo(() => {
    const base = [{ value: "", label: "All services" }];
    if (!servicesData?.data?.length) {
      return base;
    }
    return [
      ...base,
      ...servicesData.data.map((service) => ({
        value: service.id,
        label: service.name || `Service ${service.id}`,
      })),
    ];
  }, [servicesData]);

  const { data, isFetching } = useQuery({
    queryKey: [
      "receptionist",
      "service-requests",
      {
        pageNumber: page,
        pageSize: pageSize,
        status: filters.status || undefined,
        searchTerm: filters.searchTerm || undefined,
      },
    ],
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        pageNumber: page,
        pageSize: pageSize,
        status: filters.status ? (filters.status as any) : undefined,
      } as any),
  });

  // Sort requests by createdAt (newest first)
  const requests = useMemo(() => {
    const rawRequests = data?.data ?? [];
    return [...rawRequests].sort((a, b) => {
      const aCreatedAt = (a as any).createdAt || a.createdAt || "";
      const bCreatedAt = (b as any).createdAt || b.createdAt || "";
      if (!aCreatedAt && !bCreatedAt) return 0;
      if (!aCreatedAt) return 1;
      if (!bCreatedAt) return -1;
      return new Date(bCreatedAt).getTime() - new Date(aCreatedAt).getTime();
    });
  }, [data?.data]);

  const apiTotal = data?.metaData?.totalCount ?? 0;
  // Use requests.length as fallback if API returns 0 total but we have data
  const total = apiTotal > 0 ? apiTotal : requests.length;
  const totalPages = data?.metaData?.totalPages ?? 1;

  // Extract unique appointment IDs from service requests
  const appointmentIds = useMemo(() => {
    if (!requests.length) return [];
    return Array.from(
      new Set(
        requests
          .map((req) => req.appointmentId)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [requests]);

  // Fetch appointments first (appointments may have nested patient data)
  const appointmentsQuery = useQuery({
    queryKey: ["receptionist", "appointments", "by-ids", appointmentIds],
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
    if (requests.length) {
      requests.forEach((req) => {
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
        if (!ids.includes(apt.patient.id)) {
          ids.push(apt.patient.id);
        }
      }
    });

    return Array.from(new Set(ids));
  }, [requests, appointmentsQuery.data]);

  // Fetch patients after we have patientIds from both sources
  // Also include nested patients from appointments
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: [
      "receptionist",
      "patients",
      "by-ids",
      patientIds,
      appointmentsQuery.data,
    ],
    enabled:
      patientIds.length > 0 ||
      Object.keys(appointmentsQuery.data ?? {}).length > 0,
    queryFn: async () => {
      const results: Record<string, any> = {};

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
              // Try getPatientDetails first (has accountInfo)
              try {
                const response = await api.patient.getPatientDetails(id);
                if (response.data) {
                  results[id] = response.data;
                }
              } catch (error) {
                // Fallback to getPatientById
                const response = await api.patient.getPatientById(id);
                if (response.data) {
                  results[id] = response.data;
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch patient ${id}:`, error);
            }
          })
        );
      }

      return results;
    },
  });

  const patients = patientsData ?? {};
  const appointments = appointmentsQuery.data ?? {};

  const filteredRequests = useMemo(() => {
    if (!requests.length) {
      return [];
    }
    return requests.filter((request) => {
      if (!dateFrom && !dateTo) {
        return true;
      }
      const dateValue = request.requestDate ?? request.requestedDate;
      if (!dateValue) {
        return false;
      }
      const requestDate = new Date(dateValue);
      if (Number.isNaN(requestDate.getTime())) {
        return true;
      }
      const isAfterFrom = dateFrom ? requestDate >= new Date(dateFrom) : true;
      const isBeforeTo = dateTo
        ? requestDate <= new Date(dateTo + "T23:59:59")
        : true;
      return isAfterFrom && isBeforeTo;
    });
  }, [requests, dateFrom, dateTo]);

  const resetFilters = () => {
    setStatus("");
    setServiceId("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setPage(1);
  };

  const statusBadgeClass = (value?: string) => {
    return getServiceRequestStatusBadgeClass(value);
  };

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Service requests</h1>
              <p className="text-gray-600">
                Review incoming registrations and convert them into
                appointments.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Results: {total} requests · Page {page} / {totalPages}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Back to dashboard
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Narrow down by status, service type, dates, or keywords.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Service
                  </label>
                  <select
                    value={serviceId}
                    onChange={(event) => {
                      setServiceId(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Requested from
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Requested to
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search patient code
                  </label>
                  <Input
                    placeholder="e.g. PAT001"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                {isFetching ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading requests...
                  </div>
                ) : filteredRequests.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-600">
                          <th className="px-4 py-3 font-medium">Request</th>
                          <th className="px-4 py-3 font-medium">
                            Requested date
                          </th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredRequests.map((request) => {
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

                          const isPatientLoading =
                            (patientId || request.appointmentId) &&
                            (patientsLoading || appointmentsQuery.isLoading) &&
                            !patient;

                          // Get patient name with priority: accountInfo > patient object (like Doctor dashboard)
                          const patientName = (() => {
                            if (!patient) return "";
                            const patientWithAccount = patient as any;
                            // Try to get name from accountInfo first (if PatientDetailResponse)
                            if (patientWithAccount.accountInfo) {
                              const accountFullName = getFullNameFromObject(
                                patientWithAccount.accountInfo
                              );
                              if (accountFullName) return accountFullName;
                            }
                            // Fallback to patient object directly
                            return getFullNameFromObject(patient);
                          })();
                          const patientCode = patient?.patientCode || null;

                          return (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  #{getLast4Chars(request.id)}
                                </div>
                                {isPatientLoading ? (
                                  <>
                                    <div className="text-xs font-semibold text-gray-900">
                                      Loading...
                                    </div>
                                    {patientId && (
                                      <p className="text-xs text-gray-500">
                                        ID: {getLast4Chars(patientId)}
                                      </p>
                                    )}
                                  </>
                                ) : (patientName || patientCode) && patient ? (
                                  <>
                                    {patientName.trim() ? (
                                      <>
                                        <div className="text-xs font-semibold text-gray-900">
                                          {patientName}
                                        </div>
                                        {patientCode && (
                                          <p className="text-xs text-gray-500">
                                            {patientCode}
                                          </p>
                                        )}
                                      </>
                                    ) : (
                                      patientCode && (
                                        <div className="text-xs font-semibold text-gray-900">
                                          {patientCode}
                                        </div>
                                      )
                                    )}
                                  </>
                                ) : patientId ? (
                                  <div className="text-xs text-gray-500">
                                    Patient ID: {getLast4Chars(patientId)}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">
                                    Unassigned
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {formatDate(
                                  request.requestDate ?? request.requestedDate
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                                    statusBadgeClass(request.status)
                                  )}
                                >
                                  {request.status || "pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setDetailModalRequestId(request.id)
                                  }
                                >
                                  View details
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    No service requests match the current filters.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredRequests.length} of {total} requests (current
                  page)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Request Detail Modal */}
        {detailModalRequestId && (
          <ServiceRequestDetailModal
            requestId={detailModalRequestId}
            isOpen={!!detailModalRequestId}
            onClose={() => setDetailModalRequestId(null)}
            allowImageUpload={false}
            allowCreateTransaction={true}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
