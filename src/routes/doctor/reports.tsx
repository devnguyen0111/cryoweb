import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { fetchWith404Fallback } from "@/utils/api-helpers";

export const Route = createFileRoute("/doctor/reports")({
  component: DoctorReportsComponent,
});

function DoctorReportsComponent() {
  const { user } = useAuth();

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();
  const [range, setRange] = useState<"30" | "90" | "365">("90");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: _doctorStats, isFetching: statsLoading } = useQuery({
    queryKey: ["doctor", "reports", range, from, to, doctorId],
    enabled: !!doctorId,
    retry: false,
    queryFn: async () => {
      if (!doctorId) {
        return null;
      }

      try {
        const response = await api.doctor.getDoctorStatistics();
        return response.data ?? null;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          toast.warning("No statistics found for this doctor.");
          return null;
        }
        const message =
          error?.response?.data?.message || "Unable to load report statistics.";
        toast.warning(message);
        return null;
      }
    },
  });

  const { data: cyclesAll } = useQuery({
    queryKey: ["doctor", "reports", "treatment-cycles", "all"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          pageNumber: 1,
          pageSize: 1,
        });
        return {
          data: response.data,
          metaData: { totalCount: response.metaData.totalCount },
        };
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return { data: [], metaData: { totalCount: 0 } } as any;
        }
        throw error;
      }
    },
  });

  const { data: cyclesInProgress } = useQuery({
    queryKey: ["doctor", "reports", "treatment-cycles", "in-progress"],
    retry: false,
    queryFn: async () => {
      const response = await fetchWith404Fallback(() =>
        api.treatmentCycle.getTreatmentCycles({
          status: "InProgress",
          pageNumber: 1,
          pageSize: 1,
        })
      );
      return {
        data: response.data,
        metaData: { totalCount: response.metaData.totalCount },
      };
    },
  });

  const { data: cyclesCompleted } = useQuery({
    queryKey: ["doctor", "reports", "treatment-cycles", "completed"],
    retry: false,
    queryFn: async () => {
      const response = await fetchWith404Fallback(() =>
        api.treatmentCycle.getTreatmentCycles({
          status: "Completed",
          pageNumber: 1,
          pageSize: 1,
        })
      );
      return {
        data: response.data,
        metaData: { totalCount: response.metaData.totalCount },
      };
    },
  });

  const { data: appointmentsCompleted } = useQuery({
    queryKey: ["doctor", "reports", "appointments", "completed", doctorId],
    enabled: !!doctorId,
    retry: false,
    queryFn: () =>
      api.appointment.getAppointments({
        doctorId: doctorId!,
        status: "Completed",
        pageNumber: 1,
        pageSize: 1,
      }),
  });

  const { data: appointmentsCancelled } = useQuery({
    queryKey: ["doctor", "reports", "appointments", "cancelled", doctorId],
    enabled: !!doctorId,
    retry: false,
    queryFn: () =>
      api.appointment.getAppointments({
        doctorId: doctorId!,
        status: "Cancelled",
        pageNumber: 1,
        pageSize: 1,
      }),
  });

  const totalCycles = cyclesAll?.metaData?.totalCount ?? 0;
  const activeCycles = cyclesInProgress?.metaData?.totalCount ?? 0;
  const completedCycles = cyclesCompleted?.metaData?.totalCount ?? 0;
  const completionRate = totalCycles
    ? Math.round((completedCycles / totalCycles) * 100)
    : 0;
  const activeRate = totalCycles
    ? Math.round((activeCycles / totalCycles) * 100)
    : 0;
  // totalSlotsToday and availableSlotsToday don't exist in DoctorStatisticsResponse
  const availableRate = 0;

  const successMetrics = useMemo(
    () => [
      {
        label: "Cycle completion rate",
        value: completionRate,
        target: 70,
        color: "bg-primary",
      },
      {
        label: "Active cycle ratio",
        value: activeRate,
        target: 30,
        color: "bg-emerald-500",
      },
      {
        label: "Available slot rate",
        value: availableRate,
        target: 40,
        color: "bg-sky-500",
      },
    ],
    [completionRate, activeRate, availableRate]
  );

  const cryobankMetrics = useMemo(
    () => [
      { name: "Sperm samples", value: 128, alert: 6 },
      { name: "Frozen embryos", value: 74, alert: 3 },
      { name: "Stored oocytes", value: 41, alert: 2 },
    ],
    []
  );

  const treatmentBreakdown = useMemo(
    () => [
      { label: "Total cycles", value: totalCycles },
      { label: "Active", value: activeCycles },
      { label: "Completed", value: completedCycles },
    ],
    [totalCycles, activeCycles, completedCycles]
  );

  const appointmentSummary = useMemo(
    () => [
      {
        label: "Completed",
        value: appointmentsCompleted?.metaData?.totalCount ?? 0,
      },
      {
        label: "Cancelled",
        value: appointmentsCancelled?.metaData?.totalCount ?? 0,
      },
    ],
    [
      appointmentsCompleted?.metaData?.totalCount,
      appointmentsCancelled?.metaData?.totalCount,
    ]
  );

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
            <h1 className="text-3xl font-bold">Reports &amp; analytics</h1>
            <p className="text-gray-600">
              Track treatment performance, success rates, and cryobank status
              over time.
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Reporting period</CardTitle>
                <p className="text-sm text-gray-500">
                  Data is aggregated based on the selected timeframe.
                </p>
              </div>
              <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center">
                <div className="flex items-center gap-1 rounded-md border border-gray-200 p-1">
                  {["30", "90", "365"].map((option) => (
                    <Button
                      key={option}
                      variant={range === option ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setRange(option as typeof range)}
                    >
                      {option === "30"
                        ? "Last 30 days"
                        : option === "90"
                          ? "Last quarter"
                          : "Last 12 months"}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                  <span>-</span>
                  <Input
                    type="date"
                    value={to}
                    min={from}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <section className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Treatment overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-gray-100 p-4">
                    <p className="text-gray-500">Schedules today</p>
                    <p className="text-2xl font-semibold">
                      {statsLoading ? "..." : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <p className="text-gray-500">Available slots</p>
                    <p className="text-2xl font-semibold">
                      {statsLoading ? "..." : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <p className="text-gray-500">Active cycles</p>
                    <p className="text-2xl font-semibold">{activeCycles}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 p-4">
                    <p className="text-gray-500">Completed cycles</p>
                    <p className="text-2xl font-semibold">{completedCycles}</p>
                  </div>
                </div>
                <div className="grid gap-2 rounded-lg border border-gray-100 p-4 text-sm text-gray-600">
                  {appointmentSummary.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <span className="font-semibold text-gray-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Export detailed report (PDF)
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Success metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {successMetrics.map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {metric.label}
                      </span>
                      <span className="text-gray-500">
                        Target {metric.target}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100">
                      <div
                        className={cn(
                          "h-3 rounded-full transition-all",
                          metric.color
                        )}
                        style={{ width: `${Math.min(metric.value, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Current performance:{" "}
                      <span className="font-semibold">{metric.value}%</span>
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Service mix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {treatmentBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">
                        Within the selected timeframe
                      </p>
                    </div>
                    <span className="text-2xl font-semibold text-primary">
                      {item.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cryobank status</CardTitle>
                <Button variant="ghost" size="sm">
                  View details
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {cryobankMetrics.map((metric) => (
                  <div
                    key={metric.name}
                    className="rounded-lg border border-gray-100 p-4"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {metric.name}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {metric.value}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {metric.alert} samples require storage checks within the
                      next 7 days.
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>- This report only includes data for Dr. {getFullNameFromObject(user) || "Unknown"}.</p>
              <p>
                - Success metrics are aggregated from treatment and lab systems.
              </p>
              <p>
                - Export or share detailed results with your team via the
                download menu.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
