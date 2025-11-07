import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import type { AppointmentStatus, AppointmentType } from "@/api/types";

export const Route = createFileRoute("/doctor/appointments")({
  component: DoctorAppointmentsComponent,
});

function DoctorAppointmentsComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();
  const doctorId = doctorProfile?.id;

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filters = useMemo(
    () => ({ statusFilter, typeFilter, dateFrom, dateTo, searchTerm }),
    [statusFilter, typeFilter, dateFrom, dateTo, searchTerm]
  );

  const statusParam = (statusFilter || undefined) as
    | AppointmentStatus
    | undefined;
  const typeParam = (typeFilter || undefined) as AppointmentType | undefined;

  const { data, isFetching } = useQuery({
    queryKey: [
      "doctor",
      "appointments",
      {
        DoctorId: doctorId,
        page,
        pageSize,
        ...filters,
      },
    ],
    enabled: !!doctorId,
    retry: false,
    queryFn: () =>
      api.appointment.getAppointments({
        DoctorId: doctorId!,
        Page: page,
        Size: pageSize,
        Status: statusParam,
        Type: typeParam,
        AppointmentDateFrom: dateFrom || undefined,
        AppointmentDateTo: dateTo || undefined,
        SearchTerm: searchTerm || undefined,
        Sort: "appointmentDate",
        Order: "asc",
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: string;
    }) => api.appointment.updateAppointmentStatus(appointmentId, status as any),
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

  const total = data?.metaData?.total ?? 0;
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
          {!doctorProfileLoading && !doctorId ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No doctor profile found for this account. Please contact the
              administrator for access.
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
                      {data.data.map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {appointment.title || "Not updated"}
                            <p className="text-xs text-gray-500">
                              ID: {appointment.id}
                            </p>
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-600">
                            {appointment.type || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div>{appointment.appointmentDate}</div>
                            <div className="text-xs">
                              {appointment.startTime} - {appointment.endTime}
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
                                onClick={() =>
                                  navigate({
                                    to: "/doctor/appointments/$appointmentId",
                                    params: { appointmentId: appointment.id },
                                  })
                                }
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
                      ))}
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
                  Showing {data?.data?.length ?? 0} / {total} appointments
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
