import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import type { AppointmentStatus, AppointmentType, Patient } from "@/api/types";
import { DoctorAppointmentDetailModal } from "@/features/doctor/appointments/DoctorAppointmentDetailModal";
import { Modal } from "@/components/ui/modal";
import { DoctorCreateAppointmentForm } from "@/features/doctor/appointments/DoctorCreateAppointmentForm";

export const Route = createFileRoute("/doctor/appointments")({
  component: DoctorAppointmentsComponent,
});

function DoctorAppointmentsComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [detailModalAppointmentId, setDetailModalAppointmentId] = useState<
    string | null
  >(null);
  const [detailModalPatientId, setDetailModalPatientId] = useState<
    string | null
  >(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filters = useMemo(
    () => ({ statusFilter, typeFilter, dateFrom, dateTo, searchTerm }),
    [statusFilter, typeFilter, dateFrom, dateTo, searchTerm]
  );

  const statusParam = (statusFilter || undefined) as
    | AppointmentStatus
    | undefined;
  const typeParam = (typeFilter || undefined) as AppointmentType | undefined;

  // Note: According to ERD, Appointment → Doctor relationship is through AppointmentDoctor table
  // Backend API /api/appointment?doctorId=... should handle filtering via AppointmentDoctor
  // If backend doesn't support this, consider using api.appointmentDoctor.getAssignmentsByDoctor()
  const { data, isFetching } = useQuery({
    queryKey: [
      "doctor",
      "appointments",
      {
        doctorId,
        pageNumber: page,
        pageSize,
        ...filters,
      },
    ],
    enabled: !!doctorId,
    retry: false,
    queryFn: () =>
      api.appointment.getAppointments({
        doctorId: doctorId!,
        pageNumber: page,
        pageSize,
        status: statusParam,
        appointmentType: typeParam,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  // Extract unique patient IDs from appointments
  const patientIds = useMemo(() => {
    if (!data?.data) return [];
    const ids = data.data
      .map((apt) => apt.patientId)
      .filter((id): id is string => Boolean(id));
    // Remove duplicates
    return Array.from(new Set(ids));
  }, [data?.data]);

  // Fetch patient data for all appointments
  const patientQueries = useQueries({
    queries: patientIds.map((patientId) => ({
      queryKey: ["doctor", "patient", patientId, "appointment-list"],
      queryFn: async (): Promise<Patient | null> => {
        try {
          const response = await api.patient.getPatientById(patientId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error)) {
            if (error.response?.status === 403) {
              try {
                const fallback = await api.patient.getPatientDetails(patientId);
                return fallback.data ?? null;
              } catch {
                return null;
              }
            }
            if (error.response?.status === 404) {
              return null;
            }
          }
          return null;
        }
      },
      retry: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })),
  });

  // Create a map of patientId -> Patient for quick lookup
  const patientsMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patientQueries.forEach((query, index) => {
      if (query.data && patientIds[index]) {
        map.set(patientIds[index], query.data);
      }
    });
    return map;
  }, [patientQueries, patientIds]);

  const updateStatusMutation = useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: string;
    }) =>
      api.appointment.updateAppointmentStatus(appointmentId, {
        status: status as any,
      }),
    onSuccess: (_, variables) => {
      toast.success("Appointment status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", "today"] });
      queryClient.invalidateQueries({ queryKey: ["doctor", "statistics"] });
      queryClient.invalidateQueries({
        queryKey: [
          "doctor",
          "appointments",
          { appointmentId: variables.appointmentId },
        ],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update status. Please try again.";
      toast.error(message);
    },
  });

  const total = data?.metaData?.totalCount ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;

  const resetFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setPage(1);
  };

  const handleStatusChange = (appointmentId: string, status: string) => {
    updateStatusMutation.mutate({ appointmentId, status });
  };

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case "scheduled":
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
      case "no-show":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatAppointmentType = (
    type?: AppointmentType | string | null
  ): string => {
    if (!type) return "-";
    // Handle the enum values
    if (type === "FollowUp") return "Follow Up";
    if (type === "Treatment") return "Treatment";
    if (type === "Consultation") return "Consultation";
    // Handle lowercase or other variations
    const normalized = type.toLowerCase();
    if (normalized === "followup" || normalized === "follow-up")
      return "Follow Up";
    if (normalized === "treatment") return "Treatment";
    if (normalized === "consultation") return "Consultation";
    // Return capitalized version for any other value
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const appointmentTypes = [
    { value: "", label: "All" },
    { value: "consultation", label: "Consultation" },
    { value: "procedure", label: "Procedure" },
    { value: "follow-up", label: "Follow-up" },
    { value: "testing", label: "Lab test" },
    { value: "other", label: "Other" },
  ];

  const appointmentStatuses = [
    { value: "", label: "All" },
    { value: "scheduled", label: "Scheduled" },
    { value: "confirmed", label: "Confirmed" },
    { value: "in-progress", label: "In progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no-show", label: "No-show" },
  ];

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {!doctorProfileLoading && !doctorProfile && doctorId ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Doctor profile information is being loaded. If this message
              persists, please contact the administrator.
            </div>
          ) : null}

          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Appointment management</h1>
            <p className="text-gray-600">
              Monitor schedules, update statuses, and start patient encounters.
            </p>
          </section>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Advanced filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Results: {total} appointments - Page {page}/{totalPages}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={!doctorId}
                  >
                    Create appointment
                  </Button>
                  <Button onClick={() => navigate({ to: "/doctor/schedule" })}>
                    View personal schedule
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {appointmentStatuses.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Appointment type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {appointmentTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    From date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    To date
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
                    Search
                  </label>
                  <Input
                    placeholder="Enter patient name or description..."
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isFetching ? (
                <div className="py-12 text-center text-gray-500">
                  Loading data...
                </div>
              ) : data?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">Patient</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">
                          Date &amp; time
                        </th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.data.map((appointment) => {
                        const patient = appointment.patientId
                          ? patientsMap.get(appointment.patientId)
                          : null;
                        const patientName =
                          patient?.fullName || patient?.patientCode || null;
                        const patientIndex = appointment.patientId
                          ? patientIds.findIndex(
                              (id) => id === appointment.patientId
                            )
                          : -1;
                        const isPatientLoading =
                          patientIndex >= 0
                            ? patientQueries[patientIndex]?.isLoading
                            : false;

                        return (
                          <tr key={appointment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {patientName && patient ? (
                                <>
                                  <div className="font-semibold">
                                    {patientName}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {patient.patientCode && (
                                      <>Code: {patient.patientCode}</>
                                    )}
                                    {patient.patientCode &&
                                      appointment.patientId &&
                                      " • "}
                                    {appointment.patientId && (
                                      <>
                                        ID: {appointment.patientId.slice(0, 8)}
                                      </>
                                    )}
                                  </p>
                                </>
                              ) : isPatientLoading ? (
                                <>
                                  <div className="font-semibold">
                                    Loading...
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {appointment.patientId && (
                                      <>
                                        ID: {appointment.patientId.slice(0, 8)}
                                      </>
                                    )}
                                  </p>
                                </>
                              ) : (
                                <>
                                  {appointment.appointmentCode ||
                                    `Appt ${appointment.id?.slice(0, 8) || "N/A"}`}
                                  <p className="text-xs text-gray-500">
                                    Patient ID:{" "}
                                    {appointment.patientId
                                      ? appointment.patientId.slice(0, 8)
                                      : "N/A"}
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formatAppointmentType(
                                appointment.appointmentType
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              <div>
                                {appointment.appointmentDate
                                  ? new Date(
                                      appointment.appointmentDate
                                    ).toLocaleString("en-US", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "-"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                  statusBadgeClass(appointment.status)
                                )}
                              >
                                {appointment.status || "pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setDetailModalAppointmentId(appointment.id);
                                    setDetailModalPatientId(
                                      appointment.patientId || null
                                    );
                                  }}
                                >
                                  Details
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    navigate({
                                      to: "/doctor/encounters/create",
                                      search: {
                                        appointmentId: appointment.id,
                                        patientId: appointment.patientId,
                                      },
                                    })
                                  }
                                >
                                  Start encounter
                                </Button>
                                <select
                                  value={appointment.status || ""}
                                  onChange={(event) =>
                                    handleStatusChange(
                                      appointment.id,
                                      event.target.value
                                    )
                                  }
                                  className="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                                >
                                  {appointmentStatuses
                                    .filter((option) => option.value)
                                    .map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  No appointments match the current filters.
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {data?.data?.length ?? 0} {" / "} {total} appointments
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
        <DoctorAppointmentDetailModal
          appointmentId={detailModalAppointmentId}
          patientId={detailModalPatientId}
          isOpen={Boolean(detailModalAppointmentId)}
          onClose={() => {
            setDetailModalAppointmentId(null);
            setDetailModalPatientId(null);
          }}
        />
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create appointment"
          description="Schedule a new appointment for one of your patients."
          size="xl"
        >
          {doctorId ? (
            <DoctorCreateAppointmentForm
              doctorId={doctorId}
              doctorName={doctorProfile?.fullName}
              onClose={() => setIsCreateModalOpen(false)}
              onCreated={(appointmentId) => {
                setIsCreateModalOpen(false);
                setDetailModalAppointmentId(appointmentId);
              }}
            />
          ) : (
            <p className="text-sm text-gray-600">
              Doctor profile is required before creating appointments.
            </p>
          )}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
