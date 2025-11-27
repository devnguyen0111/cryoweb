import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { AppointmentDetailForm } from "@/features/receptionist/appointments/AppointmentDetailForm";
import { api } from "@/api/client";
import type { Appointment, AppointmentStatus } from "@/api/types";
import { cn } from "@/utils/cn";
import {
  APPOINTMENT_STATUS_LABELS,
  ensureAppointmentStatus,
  normalizeAppointmentStatus,
} from "@/utils/appointments";

export const Route = createFileRoute("/receptionist/appointments")({
  component: ReceptionistAppointmentsComponent,
});

function ReceptionistAppointmentsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailAppointmentId, setDetailAppointmentId] = useState<string | null>(
    null
  );
  const isDetailModalOpen = Boolean(detailAppointmentId);
  const [detailAppointment, setDetailAppointment] =
    useState<Appointment | null>(null);

  const resolvePatientLabel = (appointment: Appointment) => {
    const raw = appointment as unknown as Record<string, any>;
    return (
      raw.patient?.accountInfo?.username ??
      raw.patient?.fullName ??
      raw.patientName ??
      raw.patientCode ??
      raw.patient?.patientCode ??
      appointment.patientId ??
      raw.patientID ??
      raw.PatientId ??
      "—"
    );
  };

  const resolveAppointmentDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString();
    }
    const datePart = value.split("T")[0];
    return datePart || value;
  };

  const formatTimeValue = (value?: string) => {
    if (!value) return "--:--";
    if (value.includes("T")) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }
    return value.slice(0, 5);
  };

  const renderTimeRange = (appointment: Appointment) => {
    // Appointment doesn't have startTime/endTime directly, they're in slot
    const start = formatTimeValue((appointment as any).startTime);
    const end = formatTimeValue((appointment as any).endTime);
    if (start === "--:--" && end === "--:--") {
      return "No time set";
    }
    return `${start} – ${end}`;
  };

  const normalizedStatusFilter = statusFilter
    ? ensureAppointmentStatus(statusFilter)
    : undefined;

  const { data, isFetching } = useQuery({
    queryKey: [
      "receptionist",
      "appointments",
      {
        page,
        size: pageSize,
        status: normalizedStatusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        searchTerm: searchTerm || undefined,
      },
    ],
    queryFn: () =>
      api.appointment.getAppointments({
        pageNumber: page,
        pageSize: pageSize,
        status: normalizedStatusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });

  const appointments = data?.data ?? [];
  const total = data?.metaData?.totalCount ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;

  const statusBadgeClass = (status?: string) => {
    const normalized = normalizeAppointmentStatus(status);
    switch (normalized) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700";
      case "CheckedIn":
        return "bg-cyan-100 text-cyan-700";
      case "InProgress":
        return "bg-amber-100 text-amber-700";
      case "Completed":
        return "bg-emerald-100 text-emerald-700";
      case "Cancelled":
        return "bg-rose-100 text-rose-700";
      case "NoShow":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatStatusLabel = (status?: string) => {
    const normalized = normalizeAppointmentStatus(status);
    if (!normalized) return "Scheduled";
    return APPOINTMENT_STATUS_LABELS[normalized];
  };

  const statusOptions: { value: AppointmentStatus | ""; label: string }[] = [
    { value: "", label: "All statuses" },
    { value: "Scheduled", label: APPOINTMENT_STATUS_LABELS.Scheduled },
    { value: "CheckedIn", label: APPOINTMENT_STATUS_LABELS.CheckedIn },
    { value: "InProgress", label: APPOINTMENT_STATUS_LABELS.InProgress },
    { value: "Completed", label: APPOINTMENT_STATUS_LABELS.Completed },
    { value: "Cancelled", label: APPOINTMENT_STATUS_LABELS.Cancelled },
    { value: "NoShow", label: APPOINTMENT_STATUS_LABELS.NoShow },
  ];

  const resetFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setPage(1);
  };

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { appointmentId: string; status: string }) =>
      api.appointment.updateAppointmentStatus(payload.appointmentId, {
        status: ensureAppointmentStatus(payload.status),
      }),
    onSuccess: () => {
      toast.success("Appointment status updated");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "service-requests"],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update appointment status. Please try again.";
      toast.error(message);
    },
  });

  const handleStatusChange = (
    appointmentId: string,
    status: AppointmentStatus
  ) => {
    updateStatusMutation.mutate({
      appointmentId,
      status,
    });
  };

  const openDetailModal = (appointment: Appointment) => {
    setDetailAppointmentId(appointment.id);
    setDetailAppointment(appointment);
  };
  const closeDetailModal = () => {
    setDetailAppointmentId(null);
    setDetailAppointment(null);
  };

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold">Appointment management</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Back to dashboard
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Results: {total} appointments · Page {page}/{totalPages}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value as AppointmentStatus | ""
                      );
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {statusOptions.map((option) => (
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
                    placeholder="Search by patient, doctor, or notes..."
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isFetching ? (
                <div className="py-12 text-center text-gray-500">
                  Loading appointments...
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left text-gray-600">
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">
                              Date &amp; time
                            </th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {appointments.map((appointment, index) => (
                            <tr
                              key={appointment.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {(appointment as any).title ||
                                    appointment.appointmentType ||
                                    appointment.appointmentCode ||
                                    `appointment #${(page - 1) * pageSize + index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Patient: {resolvePatientLabel(appointment)}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                <div>
                                  {resolveAppointmentDate(
                                    appointment.appointmentDate
                                  )}
                                </div>
                                <div className="text-xs">
                                  {renderTimeRange(appointment)}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                                    statusBadgeClass(appointment.status)
                                  )}
                                >
                                  {formatStatusLabel(appointment.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDetailModal(appointment)}
                                  >
                                    Details
                                  </Button>
                                  <select
                                    value={
                                      normalizeAppointmentStatus(
                                        appointment.status
                                      ) || ""
                                    }
                                    onChange={(event) =>
                                      handleStatusChange(
                                        appointment.id,
                                        event.target.value as AppointmentStatus
                                      )
                                    }
                                    className="rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  >
                                    {statusOptions
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      No appointments match the current filters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="flex items-center justify-between px-6 pb-6">
              <div className="text-sm text-gray-500">
                Showing {appointments.length} / {total} appointments
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
          </Card>
        </div>
      </DashboardLayout>
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title="Appointment detail"
        description="Review and update scheduling, participants, and status."
        size="xl"
      >
        {detailAppointmentId ? (
          <AppointmentDetailForm
            appointmentId={detailAppointmentId}
            layout="modal"
            initialAppointment={detailAppointment}
            onClose={closeDetailModal}
            onOpenPatientProfile={(patientId) => {
              closeDetailModal();
              navigate({
                to: "/receptionist/patients/$patientId",
                params: { patientId },
              });
            }}
          />
        ) : null}
      </Modal>
    </ProtectedRoute>
  );
}
