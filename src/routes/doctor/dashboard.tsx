import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/utils/cn";
import type {
  Appointment,
  DoctorSchedule,
  PaginatedResponse,
  PatientDetailResponse,
  ServiceRequest,
  TreatmentCycle,
} from "@/api/types";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";

const createEmptyResponse = <T,>(): PaginatedResponse<T> => ({
  code: 200,
  message: "",
  data: [],
  metaData: {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  },
});

const fetchWith404Fallback = async <T,>(
  request: () => Promise<PaginatedResponse<T>>
): Promise<PaginatedResponse<T>> => {
  try {
    return await request();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return createEmptyResponse<T>();
    }
    throw error;
  }
};

export const Route = createFileRoute("/doctor/dashboard")({
  component: DoctorDashboardComponent,
});

function DoctorDashboardComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Invalidate all queries to refresh dashboard data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor", "statistics"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor", "patients"] }),
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["doctor", "medical-records"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "service-requests"],
      }),
    ]);
    setIsRefreshing(false);
  };

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: upcomingAppointments, isFetching: appointmentsLoading } =
    useQuery<PaginatedResponse<Appointment>>({
      queryKey: [
        "doctor",
        "appointments",
        {
          doctorId: doctorId,
          dateFrom: today,
        },
      ],
      enabled: !!doctorId,
      retry: false,
      queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
        if (!doctorId) {
          return createEmptyResponse<Appointment>();
        }

        try {
          return await api.appointment.getAppointments({
            doctorId,
            dateFrom: today,
            pageNumber: 1,
            pageSize: 3,
          });
        } catch (error: any) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return createEmptyResponse<Appointment>();
          }
          const message =
            error?.response?.data?.message ||
            "Unable to load today's appointments.";
          toast.error(message);
          return createEmptyResponse<Appointment>();
        }
      },
    });

  // Get recent appointments to extract unique patients
  const { data: recentAppointments } = useQuery<PaginatedResponse<Appointment>>(
    {
      queryKey: ["doctor", "appointments", "recent", doctorId],
      enabled: !!doctorId,
      retry: false,
      queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
        if (!doctorId) {
          return createEmptyResponse<Appointment>();
        }

        try {
          return await api.appointment.getAppointments({
            doctorId,
            pageNumber: 1,
            pageSize: 20, // Get more to extract unique patients
          });
        } catch (error: any) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return createEmptyResponse<Appointment>();
          }
          return createEmptyResponse<Appointment>();
        }
      },
    }
  );

  // Extract unique patient IDs from appointments
  const patientIds = useMemo(() => {
    if (!recentAppointments?.data) return [];
    const ids = recentAppointments.data
      .map((apt) => {
        const raw = apt as unknown as Record<string, any>;
        return (
          apt.patientId ??
          raw.patientID ??
          raw.PatientId ??
          raw.PatientID ??
          raw.patient?.id ??
          raw.patient?.patientId ??
          raw.patient?.accountId ??
          raw.patientAccountId ??
          raw.patientAccountID ??
          raw.PatientAccountId ??
          raw.PatientAccountID ??
          null
        );
      })
      .filter((id): id is string => Boolean(id));
    // Remove duplicates and limit to 5
    return Array.from(new Set(ids)).slice(0, 5);
  }, [recentAppointments?.data]);

  const { data: patientDetailsMap } = useQuery<
    Record<string, PatientDetailResponse | null>
  >({
    queryKey: ["doctor-dashboard", "patient-details", patientIds],
    enabled: patientIds.length > 0,
    retry: false,
    queryFn: async () => {
      const entries = await Promise.all(
        patientIds.map(async (id) => {
          try {
            const response = await api.patient.getPatientDetails(id);
            return [id, response.data] as const;
          } catch (error: any) {
            if (isAxiosError(error) && error.response?.status === 404) {
              return [id, null] as const;
            }
            console.warn(
              "[DoctorDashboard] Unable to load patient detail",
              id,
              error
            );
            return [id, null] as const;
          }
        })
      );

      return Object.fromEntries(entries) as Record<
        string,
        PatientDetailResponse | null
      >;
    },
  });

  const enrichedPatients = useMemo(() => {
    const details = patientDetailsMap ?? {};
    return patientIds.map((patientId, index) => {
      const detail = details[patientId];
      const displayName =
        detail?.fullName ||
        detail?.accountInfo?.username ||
        detail?.patientCode ||
        `Patient #${index + 1}`;
      const email = detail?.accountInfo?.email || detail?.email || "—";
      const phone = detail?.accountInfo?.phone || detail?.phoneNumber || "—";

      return {
        id: patientId,
        detail,
        displayName,
        email,
        phone,
      };
    });
  }, [patientIds, patientDetailsMap]);

  // Get treatment cycles filtered by doctorId directly (Backend supports this)
  const { data: treatmentCycles } = useQuery<PaginatedResponse<TreatmentCycle>>(
    {
      queryKey: ["treatment-cycles", "doctor-dashboard", doctorId],
      enabled: !!doctorId,
      retry: false,
      queryFn: async (): Promise<PaginatedResponse<TreatmentCycle>> => {
        try {
          // Backend API supports filtering by doctorId directly
          return await fetchWith404Fallback(() =>
            api.treatmentCycle.getTreatmentCycles({
              doctorId: doctorId!,
              pageNumber: 1,
              pageSize: 5,
            })
          );
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            "Unable to load treatment cycles.";
          toast.error(message);
          return createEmptyResponse<TreatmentCycle>();
        }
      },
    }
  );

  const { data: scheduleData } = useQuery<PaginatedResponse<DoctorSchedule>>({
    queryKey: ["schedule", doctorId, today],
    enabled: !!doctorId,
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<DoctorSchedule>> => {
      if (!doctorId) {
        return createEmptyResponse<DoctorSchedule>();
      }

      try {
        return await fetchWith404Fallback(() =>
          api.doctorSchedule.getSchedulesByDoctor(doctorId, {
            pageNumber: 1,
            pageSize: 25,
          })
        );
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Unable to load work schedule.";
        toast.error(message);
        return createEmptyResponse<DoctorSchedule>();
      }
    },
  });

  // Get appointment IDs for this doctor to filter service requests
  const appointmentIds = useMemo(() => {
    if (!recentAppointments?.data) return [];
    return recentAppointments.data
      .map((apt) => apt.id)
      .filter((id): id is string => Boolean(id));
  }, [recentAppointments?.data]);

  // Get service requests for doctor's appointments
  const { data: pendingServiceRequests } = useQuery<
    PaginatedResponse<ServiceRequest>
  >({
    queryKey: [
      "service-requests",
      "doctor-dashboard",
      doctorId,
      appointmentIds,
    ],
    enabled: !!doctorId && appointmentIds.length > 0,
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<ServiceRequest>> => {
      if (!doctorId || appointmentIds.length === 0) {
        return createEmptyResponse<ServiceRequest>();
      }

      try {
        // Fetch service requests for each appointment and combine
        const allRequests: ServiceRequest[] = [];
        await Promise.all(
          appointmentIds.slice(0, 10).map(async (appointmentId) => {
            try {
              const response =
                await api.serviceRequest.getServiceRequestsByAppointment(
                  appointmentId
                );
              if (response.data) {
                allRequests.push(
                  ...response.data.filter((req) => req.status === "Pending")
                );
              }
            } catch (error) {
              // Silently fail for individual appointments
            }
          })
        );

        // Return paginated response format
        return {
          code: 200,
          message: "",
          data: allRequests.slice(0, 5),
          metaData: {
            pageNumber: 1,
            pageSize: 5,
            totalCount: allRequests.length,
            totalPages: Math.ceil(allRequests.length / 5),
            hasPrevious: false,
            hasNext: allRequests.length > 5,
          },
        };
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "Unable to load pending prescriptions or requests.";
        toast.error(message);
        return createEmptyResponse<ServiceRequest>();
      }
    },
  });

  const quickStats = [
    {
      title: "Today's appointments",
      value: upcomingAppointments?.metaData?.totalCount ?? 0,
      description: "Includes follow-ups and procedures",
    },
    {
      title: "My patients",
      value: patientIds.length,
      description: "Recent patients from appointments",
    },
    {
      title: "Treatment cycles",
      value: treatmentCycles?.metaData?.totalCount ?? 0,
      description: "Active IUI/IVF cases",
    },
    {
      title: "Pending requests",
      value: pendingServiceRequests?.metaData?.totalCount ?? 0,
      description: "Service requests awaiting action",
    },
  ];

  const notificationItems = useMemo(() => {
    const items: Array<{
      id: string;
      message: string;
      tone: "info" | "warning" | "success";
    }> = [];

    const todayAppointmentsCount =
      upcomingAppointments?.metaData?.totalCount ?? 0;
    if (todayAppointmentsCount > 0) {
      items.push({
        id: "appointments",
        tone: "info",
        message: `You have ${todayAppointmentsCount} appointment${todayAppointmentsCount > 1 ? "s" : ""} scheduled for today.`,
      });
    }

    const pendingCount = pendingServiceRequests?.metaData?.totalCount ?? 0;
    if (pendingCount > 0) {
      items.push({
        id: "prescription",
        tone: "warning",
        message: `${pendingCount} service request${pendingCount > 1 ? "s" : ""} awaiting your action.`,
      });
    }

    const activeCyclesCount = treatmentCycles?.metaData?.totalCount ?? 0;
    if (activeCyclesCount > 0) {
      items.push({
        id: "cycles",
        tone: "success",
        message: `${activeCyclesCount} active treatment cycle${activeCyclesCount > 1 ? "s" : ""} in progress.`,
      });
    }

    return items;
  }, [
    upcomingAppointments?.metaData?.totalCount,
    pendingServiceRequests?.metaData?.totalCount,
    treatmentCycles?.metaData?.totalCount,
  ]);

  const toneStyles = useMemo(
    () => ({
      info: "border-blue-100 bg-blue-50 text-blue-800",
      warning: "border-amber-100 bg-amber-50 text-amber-800",
      success: "border-green-100 bg-green-50 text-green-800",
    }),
    []
  );

  const todaysSchedule = useMemo(
    () => (scheduleData?.data ?? []).filter((slot) => slot.workDate === today),
    [scheduleData, today]
  );

  const displayName = doctorProfile?.fullName || user?.fullName || user?.email;

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;

    navigate({
      to: "/doctor/patients",
      search: { q: searchTerm.trim() },
    });
  };

  const statusClass = (status?: string) => {
    switch (status) {
      case "confirmed":
      case "scheduled":
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

          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {displayName}</h1>
              <p className="text-gray-600 mt-2">
                Here's a quick overview of your schedule and patients.
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
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
              <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
                <Input
                  placeholder="Search patients or appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-0"
                />
                <Button type="submit">Search</Button>
              </form>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((item) => (
              <Card key={item.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{item.value}</div>
                  <p className="mt-2 text-sm text-gray-500">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Today's appointments</CardTitle>
                  <p className="text-sm text-gray-500">
                    {today.split("-").reverse().join("/")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/doctor/appointments" })}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading...
                  </div>
                ) : upcomingAppointments?.data?.length ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {upcomingAppointments.data
                      .slice(0, 5)
                      .map((appointment) => {
                        // Format date and time
                        const appointmentDate = appointment.appointmentDate
                          ? new Date(appointment.appointmentDate)
                          : null;

                        const appointmentTime = appointmentDate
                          ? appointmentDate.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })
                          : "—";

                        const appointmentDateStr = appointmentDate
                          ? appointmentDate.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : null;

                        // Get patient info if available
                        const appointmentData = appointment as any;
                        const patientName =
                          appointmentData?.patient?.fullName ||
                          appointmentData?.patientName ||
                          null;

                        const patientCode =
                          appointmentData?.patient?.patientCode || null;

                        return (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() =>
                              navigate({
                                to: "/doctor/appointments/$appointmentId",
                                params: { appointmentId: appointment.id },
                              })
                            }
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {appointmentDateStr && (
                                  <span className="text-xs font-medium text-gray-700">
                                    {appointmentDateStr}
                                  </span>
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {appointmentTime}
                                </span>
                                {appointment.appointmentType && (
                                  <span className="text-xs text-gray-500">
                                    • {appointment.appointmentType}
                                  </span>
                                )}
                              </div>
                              {patientName && (
                                <p className="mt-0.5 text-xs text-gray-600 truncate">
                                  {patientName}
                                </p>
                              )}
                              <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                                {patientCode && (
                                  <p className="text-xs text-gray-500 font-mono">
                                    Code: {patientCode}
                                  </p>
                                )}
                                {appointment.appointmentCode && (
                                  <p className="text-xs text-gray-400">
                                    {patientCode && "• "}
                                    {appointment.appointmentCode}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                                  statusClass(appointment.status)
                                )}
                              >
                                {appointment.status || "pending"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {upcomingAppointments.data.length > 5 && (
                      <div className="pt-2 border-t border-gray-100 sticky bottom-0 bg-white">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() =>
                            navigate({ to: "/doctor/appointments" })
                          }
                        >
                          View all {upcomingAppointments.metaData.totalCount}{" "}
                          appointments
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No appointments today.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationItems.length > 0 ? (
                  notificationItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-4 text-sm ${toneStyles[item.tone]}`}
                    >
                      {item.message}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                    No new notifications.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent patients</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/doctor/patients" })}
                >
                  Manage patients
                </Button>
              </CardHeader>
              <CardContent>
                {enrichedPatients.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-4 py-2 font-medium">Patient</th>
                          <th className="px-4 py-2 font-medium">Email</th>
                          <th className="px-4 py-2 font-medium">Phone</th>
                          <th className="px-4 py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {enrichedPatients.map(
                          ({ id, displayName, email, phone }) => (
                            <tr key={id}>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {displayName}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {email}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {phone}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  type="button"
                                  onClick={() =>
                                    navigate({
                                      to: "/doctor/patients/$patientId",
                                      params: { patientId: id },
                                    })
                                  }
                                >
                                  View profile
                                </Button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    No patient data available.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Work schedule</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/doctor/schedule" })}
                >
                  Update schedule
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysSchedule.length ? (
                  todaysSchedule.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-lg border border-gray-100 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {slot.workDate} - {slot.startTime} - {slot.endTime}
                      </p>
                      <p className="text-sm text-gray-500">
                        {slot.notes || "Scheduled"}
                      </p>
                      {slot.notes && (
                        <p className="mt-2 text-xs text-gray-500">
                          {slot.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    You don't have a schedule for today.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
