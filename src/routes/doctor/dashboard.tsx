import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import type {
  Appointment,
  DoctorSchedule,
  DoctorStatisticsResponse,
  PaginatedResponse,
  Patient,
  PatientDetailResponse,
  ServiceRequest,
  TreatmentCycle,
  MedicalRecord,
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
  const [searchTerm, setSearchTerm] = useState("");

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: doctorStatistics } = useQuery<DoctorStatisticsResponse | null>({
    queryKey: ["doctor", "statistics", doctorId],
    enabled: !!doctorId,
    retry: false,
    queryFn: async (): Promise<DoctorStatisticsResponse | null> => {
      if (!doctorId) {
        return null;
      }

      try {
        const response = await api.doctor.getDoctorStatistics();
        return response.data ?? null;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        const message =
          error?.response?.data?.message || "Unable to load system statistics.";
        toast.warning(message);
        return null;
      }
    },
  });

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
            pageSize: 5,
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

  const { data: activePatients } = useQuery<PaginatedResponse<Patient>>({
    queryKey: ["patients", "doctor-dashboard"],
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<Patient>> => {
      try {
        return await fetchWith404Fallback(() =>
          api.patient.getPatients({ pageNumber: 1, pageSize: 5 })
        );
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Unable to load patient list.";
        toast.error(message);
        return createEmptyResponse<Patient>();
      }
    },
  });

  const patientIds = useMemo(
    () =>
      (activePatients?.data ?? [])
        .map((patient) => patient.id)
        .filter((id): id is string => Boolean(id)),
    [activePatients?.data]
  );

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
    return (activePatients?.data ?? []).map((patient, index) => {
      const detail = details[patient.id];
      const displayName =
        detail?.fullName ||
        detail?.accountInfo?.username ||
        patient.fullName ||
        patient.patientCode ||
        `Patient #${index + 1}`;
      const email =
        detail?.accountInfo?.email || detail?.email || patient.email || "—";
      const phone =
        detail?.accountInfo?.phone ||
        detail?.phoneNumber ||
        patient.phoneNumber ||
        "—";

      return {
        base: patient,
        detail,
        displayName,
        email,
        phone,
      };
    });
  }, [activePatients?.data, patientDetailsMap]);

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

  const { data: pendingServiceRequests } = useQuery<
    PaginatedResponse<ServiceRequest>
  >({
    queryKey: ["service-requests", "doctor-dashboard", doctorId],
    enabled: !!doctorId,
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<ServiceRequest>> => {
      if (!doctorId) {
        return createEmptyResponse<ServiceRequest>();
      }

      try {
        return await fetchWith404Fallback(() =>
          api.serviceRequest.getServiceRequests({
            status: "Pending",
            pageNumber: 1,
            pageSize: 5,
          })
        );
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "Unable to load pending prescriptions or requests.";
        toast.error(message);
        return createEmptyResponse<ServiceRequest>();
      }
    },
  });

  const { data: recentMedicalRecords } = useQuery<
    PaginatedResponse<MedicalRecord>
  >({
    queryKey: ["medical-records", "doctor-dashboard"],
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<MedicalRecord>> => {
      try {
        return await fetchWith404Fallback(() =>
          api.medicalRecord.getMedicalRecords({
            Page: 1,
            Size: 5,
            Sort: "CreatedAt",
            Order: "desc",
          })
        );
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "Unable to load recent medical records.";
        toast.error(message);
        return createEmptyResponse<MedicalRecord>();
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
      title: "Active patients",
      value: activePatients?.metaData?.totalCount ?? 0,
      description: "Patients with active treatment cycles",
    },
    {
      title: "Treatment cycles",
      value: treatmentCycles?.metaData?.totalCount ?? 0,
      description: "Active IUI/IVF cases",
    },
    {
      title: "Prescriptions issued",
      value: pendingServiceRequests?.metaData?.totalCount ?? 0,
      description: "Awaiting confirmation or digital signature",
    },
  ];

  const notificationItems = useMemo(() => {
    const items: Array<{
      id: string;
      message: string;
      tone: "info" | "warning" | "success";
    }> = [];

    // Note: doctorStatistics from backend may have different structure
    // Commenting out for now until we verify the backend response structure
    // if (doctorStatistics) {
    //   if (
    //     doctorStatistics.totalSlotsToday !== undefined &&
    //     doctorStatistics.bookedSlotsToday !== undefined
    //   ) {
    //     items.push({
    //       id: "slots",
    //       tone: "info",
    //       message: `There are ${doctorStatistics.totalSlotsToday} slots today with ${doctorStatistics.bookedSlotsToday} already booked.`,
    //     });
    //   }
    //
    //   if (
    //     doctorStatistics.availableSlotsToday !== undefined &&
    //     doctorStatistics.availableSlotsToday > 0
    //   ) {
    //     items.push({
    //       id: "availability",
    //       tone: "success",
    //       message: `${doctorStatistics.availableSlotsToday} slots remain available; you can accept additional appointments.`,
    //     });
    //   }
    // }

    const pendingCount = pendingServiceRequests?.metaData?.totalCount ?? 0;
    if (pendingCount > 0) {
      items.push({
        id: "prescription",
        tone: "warning",
        message: `${pendingCount} prescriptions/requests awaiting digital signature.`,
      });
    }

    return items;
  }, [doctorStatistics, pendingServiceRequests?.metaData?.totalCount]);

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
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full gap-2 sm:w-auto"
            >
              <Input
                placeholder="Search patients or appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0"
              />
              <Button type="submit">Search</Button>
            </form>
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
                  <div className="py-12 text-center text-gray-500">
                    Loading data...
                  </div>
                ) : upcomingAppointments?.data?.length ? (
                  <div className="space-y-4">
                    {upcomingAppointments.data.map((appointment, index) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.appointmentCode ||
                              `appointment #${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              appointment.appointmentDate
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                              statusClass(appointment.status)
                            )}
                          >
                            {appointment.status || "pending"}
                          </span>
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
                            View details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
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
                          ({ base: patient, displayName, email, phone }) => (
                            <tr key={patient.id}>
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
                                      params: { patientId: patient.id },
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

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quick treatment workflow</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/doctor/treatment-cycles" })}
                >
                  Open cycle management
                </Button>
              </CardHeader>
              <CardContent>
                {treatmentCycles?.data?.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {treatmentCycles.data.map((cycle) => (
                      <div
                        key={cycle.id}
                        className="rounded-lg border border-gray-100 p-4"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          Cycle {cycle.treatmentType || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Start: {cycle.startDate || "Not updated"}
                        </p>
                        <span
                          className={cn(
                            "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium",
                            cycle.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : cycle.status === "InProgress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          )}
                        >
                          {cycle.status || "Pending"}
                        </span>
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate({
                                to: "/doctor/treatment-cycles/$cycleId",
                                params: { cycleId: cycle.id },
                              })
                            }
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: "/doctor/treatment-cycles/$cycleId",
                                params: { cycleId: cycle.id },
                              } as any)
                            }
                          >
                            View Timeline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    No treatment cycles assigned to you yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Medical Records</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/doctor/medical-records" })}
                >
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {recentMedicalRecords?.data?.length ? (
                  <div className="space-y-4">
                    {recentMedicalRecords.data.map((record) => (
                      <div
                        key={record.id}
                        className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {record.diagnosis
                                ? record.diagnosis.length > 50
                                  ? record.diagnosis.substring(0, 50) + "..."
                                  : record.diagnosis
                                : "No diagnosis"}
                            </p>
                            {record.chiefComplaint && (
                              <p className="mt-1 text-xs text-gray-500">
                                {record.chiefComplaint.length > 60
                                  ? record.chiefComplaint.substring(0, 60) +
                                    "..."
                                  : record.chiefComplaint}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(record.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate({
                                to: "/doctor/medical-records",
                                search: { q: record.id },
                              })
                            }
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate({
                                to: "/doctor/appointments/$appointmentId",
                                params: {
                                  appointmentId: record.appointmentId,
                                },
                              })
                            }
                          >
                            Appointment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    No recent medical records.
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
