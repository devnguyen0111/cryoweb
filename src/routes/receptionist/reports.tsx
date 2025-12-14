import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";

export const Route = createFileRoute("/receptionist/reports")({
  component: ReceptionistReportsRoute,
});

function ReceptionistReportsRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["receptionist", "reports"] }),
    ]);
    setIsRefreshing(false);
  };

  const { data: appointmentSnapshot } = useQuery({
    queryKey: ["receptionist", "reports", "appointments-summary"],
    queryFn: () =>
      api.appointment.getAppointments({
        pageNumber: 1,
        pageSize: 200,
      }),
  });

  const { data: serviceRequestSnapshot } = useQuery({
    queryKey: ["receptionist", "reports", "service-requests"],
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        pageNumber: 1,
        pageSize: 200,
      }),
  });

  const appointments = appointmentSnapshot?.data ?? [];
  const serviceRequests = serviceRequestSnapshot?.data ?? [];

  const appointmentStats = useMemo(() => {
    const statusCount: Record<string, number> = {};
    let upcoming = 0;
    let noShows = 0;

    appointments.forEach((appointment) => {
      if (!appointment.status) return;
      statusCount[appointment.status] =
        (statusCount[appointment.status] || 0) + 1;
      if (
        appointment.status === "Scheduled" ||
        appointment.status === "Confirmed"
      ) {
        upcoming += 1;
      }
      if (appointment.status === "NoShow") {
        noShows += 1;
      }
    });

    return {
      total: appointments.length,
      upcoming,
      noShows,
      statusCount,
    };
  }, [appointments]);

  const requestStats = useMemo(() => {
    const statusCount: Record<string, number> = {};
    let cryoRelated = 0;

    serviceRequests.forEach((request) => {
      if (request.status) {
        statusCount[request.status] = (statusCount[request.status] || 0) + 1;
      }
      const notes = request.notes?.toLowerCase() || "";
      if (
        notes.includes("cryo") ||
        (request.requestCode &&
          request.requestCode.toLowerCase().includes("cryo"))
      ) {
        cryoRelated += 1;
      }
    });

    return {
      total: serviceRequests.length,
      statusCount,
      cryoRelated,
    };
  }, [serviceRequests]);

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reception reports</h1>
              <p className="text-gray-600">
                Lightweight insights focused on service intake and scheduling.
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
                variant="outline"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Back to dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Appointment health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <QuickMetric
                    label="Total reviewed"
                    value={appointmentStats.total}
                  />
                  <QuickMetric
                    label="Upcoming"
                    value={appointmentStats.upcoming}
                  />
                  <QuickMetric
                    label="No-show cases"
                    value={appointmentStats.noShows}
                  />
                  <QuickMetric
                    label="Completion rate"
                    value={
                      appointmentStats.total
                        ? `${Math.round(
                            ((appointmentStats.statusCount["completed"] || 0) /
                              appointmentStats.total) *
                              100
                          )}%`
                        : "0%"
                    }
                  />
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-2">By status</p>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(appointmentStats.statusCount).map(
                      ([status, count]) => (
                        <li key={status} className="flex justify-between">
                          <span className="capitalize">{status}</span>
                          <span>{count}</span>
                        </li>
                      )
                    )}
                    {!Object.keys(appointmentStats.statusCount).length ? (
                      <li className="text-gray-500">
                        No appointment data captured.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service intake</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <QuickMetric
                    label="Total requests"
                    value={requestStats.total}
                  />
                  <QuickMetric
                    label="Cryo-related"
                    value={requestStats.cryoRelated}
                  />
                  <QuickMetric
                    label="Conversion rate"
                    value={
                      requestStats.total
                        ? `${Math.round(
                            ((requestStats.statusCount["Confirmed"] || 0) /
                              requestStats.total) *
                              100
                          )}%`
                        : "0%"
                    }
                  />
                  <QuickMetric
                    label="Pending follow-up"
                    value={requestStats.statusCount["Pending"] || 0}
                  />
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-2">
                    Request pipeline
                  </p>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(requestStats.statusCount).map(
                      ([status, count]) => (
                        <li key={status} className="flex justify-between">
                          <span className="capitalize">{status}</span>
                          <span>{count}</span>
                        </li>
                      )
                    )}
                    {!Object.keys(requestStats.statusCount).length ? (
                      <li className="text-gray-500">
                        No service requests captured yet.
                      </li>
                    ) : null}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p>
                Use these quick links to act on the data above without leaving
                the report.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    navigate({ to: "/receptionist/service-requests" })
                  }
                >
                  Review pending requests
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/receptionist/appointments" })}
                >
                  Manage appointments
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate({
                      to: "/receptionist/appointments/create",
                      search: {
                        patientId: "",
                        serviceRequestId: "",
                        serviceId: "",
                      },
                    })
                  }
                >
                  Create new appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

interface QuickMetricProps {
  label: string;
  value: number | string;
}

function QuickMetric({ label, value }: QuickMetricProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
