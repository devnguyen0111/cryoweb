import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/receptionist/dashboard")({
  component: ReceptionistDashboardComponent,
});

function ReceptionistDashboardComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Invalidate all queries to refresh dashboard data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["receptionist", "appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["receptionist", "patients"] }),
      queryClient.invalidateQueries({ queryKey: ["receptionist", "service-requests"] }),
    ]);
    setIsRefreshing(false);
  };

  const { data: appointmentsData } = useQuery({
    queryKey: [
      "receptionist",
      "appointments",
      { pageNumber: 1, pageSize: 5, status: "Scheduled" },
    ],
    queryFn: () =>
      api.appointment.getAppointments({
        pageNumber: 1,
        pageSize: 5,
        status: "Scheduled",
      }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ["receptionist", "patients", { pageNumber: 1, pageSize: 5 }],
    queryFn: () => api.patient.getPatients({ pageNumber: 1, pageSize: 5 }),
  });

  const { data: pendingRequestsData } = useQuery({
    queryKey: [
      "receptionist",
      "service-requests",
      { pageNumber: 1, pageSize: 5, status: "Pending" },
    ],
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        pageNumber: 1,
        pageSize: 5,
        status: "Pending",
      }),
  });

  const pendingRequests = pendingRequestsData?.data ?? [];
  const totalPendingRequests = pendingRequestsData?.metaData?.totalCount ?? 0;

  const upcomingAppointments = appointmentsData?.data ?? [];
  const totalAppointmentsToday = appointmentsData?.metaData?.totalCount ?? 0;

  const recentPatients = patientsData?.data ?? [];
  const totalPatients = patientsData?.metaData?.totalCount ?? 0;

  const statusBadgeClass = (status?: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Confirmed":
        return "bg-emerald-100 text-emerald-700";
      case "Cancelled":
      case "Rejected":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const quickStats = useMemo(
    () => [
      {
        title: "Pending service requests",
        value: totalPendingRequests,
        action: () => navigate({ to: "/receptionist/service-requests" }),
        description: "Awaiting receptionist confirmation",
      },
      {
        title: "Upcoming scheduled appointments",
        value: totalAppointmentsToday,
        action: () => navigate({ to: "/receptionist/appointments" }),
        description: "Scheduled with upcoming start times",
      },
      {
        title: "Total patients",
        value: totalPatients,
        action: () => navigate({ to: "/receptionist/patients" }),
        description: "Managed profiles in the system",
      },
    ],
    [navigate, totalPendingRequests, totalAppointmentsToday, totalPatients]
  );

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard - Receptionist</h1>
              <p className="text-gray-600 mt-2">
                Track service requests, appointments, and new patient
                registrations.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickStats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={stat.action}>
                    View
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Appointment Schedule
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/receptionist/schedule" })}
                >
                  View
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">—</div>
                <p className="text-xs text-gray-500 mt-1">
                  Manage appointments and assign doctors
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transactions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/receptionist/transactions" })}
                >
                  View
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">—</div>
                <p className="text-xs text-gray-500 mt-1">
                  View and manage payments
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Pending service requests</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate({ to: "/receptionist/service-requests" })
                  }
                >
                  Manage
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {pendingRequests.length ? (
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          #{getLast4Chars(request.id)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Patient ID: {request.patientId || "—"} · Preferred
                          date: {request.requestedDate || "—"}
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
                          Open
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    All caught up—no pending requests.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Upcoming appointments</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/receptionist/appointments" })}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {upcomingAppointments.length ? (
                  upcomingAppointments.map((appointment, index) => (
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
                        Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">
                    No scheduled appointments in the queue. Create one to get
                    started.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent patient registrations</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/receptionist/patients" })}
              >
                Patient list
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              {recentPatients.length ? (
                recentPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.fullName ||
                          patient.patientCode ||
                          `Patient ${getLast4Chars(patient.id)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Email: {patient.email || "—"} · Phone:{" "}
                        {patient.phoneNumber || "—"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: "/receptionist/patients/$patientId",
                          params: { patientId: patient.id },
                        })
                      }
                    >
                      View
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No new patient accounts this week.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
