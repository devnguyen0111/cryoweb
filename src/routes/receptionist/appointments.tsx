import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { CreateAppointmentForm } from "@/features/receptionist/appointments/CreateAppointmentForm";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/receptionist/appointments")({
  component: ReceptionistAppointmentsComponent,
});

function ReceptionistAppointmentsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filters = useMemo(
    () => ({ statusFilter, dateFrom, dateTo, searchTerm }),
    [statusFilter, dateFrom, dateTo, searchTerm]
  );

  const { data, isFetching } = useQuery({
    queryKey: [
      "receptionist",
      "appointments",
      {
        Page: page,
        Size: pageSize,
        Status: filters.statusFilter || undefined,
        From: filters.dateFrom || undefined,
        To: filters.dateTo || undefined,
        Search: filters.searchTerm || undefined,
      },
    ],
    queryFn: () =>
      api.appointment.getAppointments({
        Page: page,
        Size: pageSize,
        Status: filters.statusFilter || (undefined as any),
        AppointmentDateFrom: filters.dateFrom || undefined,
        AppointmentDateTo: filters.dateTo || undefined,
        SearchTerm: filters.searchTerm || undefined,
        Sort: "appointmentDate",
        Order: "asc",
      }),
  });

  const appointments = data?.data ?? [];
  const total = data?.metaData?.total ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;

  const statusBadgeClass = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "scheduled":
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-amber-100 text-amber-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
      case "no-show":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatusLabel = (status?: string) => {
    if (!status) return "Scheduled";
    return status
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "scheduled", label: "Scheduled" },
    { value: "confirmed", label: "Confirmed" },
    { value: "in-progress", label: "In progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no-show", label: "No-show" },
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
      api.appointment.updateAppointmentStatus(
        payload.appointmentId,
        payload.status as any
      ),
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

  const handleStatusChange = (appointmentId: string, status: string) => {
    updateStatusMutation.mutate({ appointmentId, status });
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold">Appointment management</h1>
            <div className="flex flex-wrap gap-2">
              <Button onClick={openCreateModal}>Create appointment</Button>
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
                      setStatusFilter(event.target.value);
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
                          {appointments.map((appointment) => (
                            <tr
                              key={appointment.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {appointment.title || "Untitled appointment"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Patient ID: {appointment.patientId || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                <div>{appointment.appointmentDate || "—"}</div>
                                <div className="text-xs">
                                  {appointment.startTime || "--"} -{" "}
                                  {appointment.endTime || "--"}
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
                                    onClick={() =>
                                      navigate({
                                        to: "/receptionist/appointments/$appointmentId",
                                        params: {
                                          appointmentId: appointment.id,
                                        },
                                      })
                                    }
                                  >
                                    Details
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
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create appointment"
        description="Convert a confirmed service request or schedule a visit directly."
        size="xl"
      >
        <CreateAppointmentForm
          layout="modal"
          onClose={closeCreateModal}
          onCreated={(appointmentId) => {
            closeCreateModal();
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
