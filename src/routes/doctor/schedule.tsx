import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import type {
  PaginatedResponse,
  Appointment,
  Slot,
  AppointmentStatus,
} from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { cn } from "@/utils/cn";
import {
  APPOINTMENT_STATUS_LABELS,
  normalizeAppointmentStatus,
  ensureAppointmentStatus,
} from "@/utils/appointments";
import { getAppointmentStatusBadgeClass } from "@/utils/status-colors";
import { DoctorAppointmentDetailModal } from "@/features/doctor/appointments/DoctorAppointmentDetailModal";
import { Modal } from "@/components/ui/modal";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { DoctorCreateAppointmentForm } from "@/features/doctor/appointments/DoctorCreateAppointmentForm";
import { createEmptyPaginatedResponse } from "@/utils/api-helpers";

const DEFAULT_SLOTS: (Slot & { notes?: string })[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    doctorScheduleId: "",
    startTime: "08:00:00",
    endTime: "10:00:00",
    isBooked: false,
    notes: "Morning Slot 1",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    doctorScheduleId: "",
    startTime: "10:00:00",
    endTime: "12:00:00",
    isBooked: false,
    notes: "Morning Slot 2",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    doctorScheduleId: "",
    startTime: "13:00:00",
    endTime: "15:00:00",
    isBooked: false,
    notes: "Afternoon Slot 1",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    doctorScheduleId: "",
    startTime: "15:00:00",
    endTime: "17:00:00",
    isBooked: false,
    notes: "Afternoon Slot 2",
  },
];

export const Route = createFileRoute("/doctor/schedule")({
  component: DoctorScheduleComponent,
});

function DoctorScheduleComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const humanDateLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${formattedWeekday} - ${selectedDate
      .split("-")
      .reverse()
      .join("/")}`;
  }, [selectedDate]);

  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  const isWeekend = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, [selectedDate]);

  const { data: appointmentsData, isFetching: isLoadingAppointments } =
    useQuery<PaginatedResponse<Appointment>>({
      queryKey: ["doctor", "appointments", doctorId, selectedDate],
      enabled: !!doctorId && !isWeekend,
      retry: false,
      queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
        if (!doctorId) {
          return {
            code: 200,
            message: "",
            data: [],
            metaData: {
              pageNumber: 1,
              pageSize: 100,
              totalCount: 0,
              totalPages: 0,
              hasPrevious: false,
              hasNext: false,
            },
          };
        }

        try {
          const response = await api.appointment.getAppointmentsByDoctor(
            doctorId,
            {
              dateFrom: `${selectedDate}T00:00:00`,
              dateTo: `${selectedDate}T23:59:59`,
              pageNumber: 1,
              pageSize: 100,
            }
          );
          return response;
        } catch (error: any) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return createEmptyPaginatedResponse<Appointment>(100);
          }
          return {
            code: 200,
            message: "",
            data: [],
            metaData: {
              pageNumber: 1,
              pageSize: 100,
              totalCount: 0,
              totalPages: 0,
              hasPrevious: false,
              hasNext: false,
            },
          };
        }
      },
    });

  const appointments = useMemo(() => {
    if (!appointmentsData?.data) return [];

    return appointmentsData.data.filter((appointment) => {
      if (!appointment.appointmentDate) return false;

      try {
        const appointmentDateStr = appointment.appointmentDate;

        if (appointmentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return appointmentDateStr === selectedDate;
        }

        if (appointmentDateStr.includes("T")) {
          const datePart = appointmentDateStr.split("T")[0];
          return datePart === selectedDate;
        }

        const appointmentDate = new Date(appointmentDateStr);
        if (isNaN(appointmentDate.getTime())) {
          return false;
        }

        const year = appointmentDate.getFullYear();
        const month = String(appointmentDate.getMonth() + 1).padStart(2, "0");
        const day = String(appointmentDate.getDate()).padStart(2, "0");
        const appointmentDateOnly = `${year}-${month}-${day}`;

        return appointmentDateOnly === selectedDate;
      } catch (error) {
        console.error(
          "Error parsing appointment date:",
          appointment.appointmentDate,
          error
        );
        return false;
      }
    });
  }, [appointmentsData?.data, selectedDate]);

  const appointmentsBySlotId = useMemo(() => {
    const map: Record<string, Appointment> = {};
    appointments.forEach((appointment) => {
      if (appointment.slotId) {
        map[appointment.slotId] = appointment;
      } else {
        if (appointment.appointmentDate) {
          try {
            const appointmentDate = new Date(appointment.appointmentDate);
            const appointmentHour = appointmentDate.getHours();
            const appointmentMinute = appointmentDate.getMinutes();
            const appointmentTime = `${String(appointmentHour).padStart(2, "0")}:${String(appointmentMinute).padStart(2, "0")}:00`;

            const matchedSlot = DEFAULT_SLOTS.find((slot) => {
              const slotStart = slot.startTime.slice(0, 5); // HH:mm
              const appointmentTimeShort = appointmentTime.slice(0, 5); // HH:mm
              return slotStart === appointmentTimeShort;
            });

            if (matchedSlot) {
              map[matchedSlot.id] = appointment;
            }
          } catch (error) {
            console.error(
              "Error matching appointment to slot:",
              appointment,
              error
            );
          }
        }
      }
    });
    return map;
  }, [appointments]);

  const slotsWithStatus = useMemo(() => {
    if (isWeekend) return [];
    return DEFAULT_SLOTS.map((slot) => {
      const appointment = appointmentsBySlotId[slot.id] || null;
      return {
        ...slot,
        isBooked: !!appointment,
        appointment: appointment as Appointment | null,
      };
    });
  }, [appointmentsBySlotId, isWeekend]);

  const checkInMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      api.appointment.checkIn(appointmentId),
    onSuccess: () => {
      toast.success("Patient checked in.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", doctorId, selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to check in patient. Please try again."
      );
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      api.appointment.checkOut(appointmentId),
    onSuccess: () => {
      toast.success("Patient checked out.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", doctorId, selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to check out patient. Please try again."
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: AppointmentStatus;
    }) =>
      api.appointment.updateAppointmentStatus(appointmentId, {
        status: ensureAppointmentStatus(status),
      }),
    onSuccess: () => {
      toast.success("Appointment status updated.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", doctorId, selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update status. Please try again."
      );
    },
  });

  const handleShiftDay = (offset: number) => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, "0");
    const newDay = String(date.getDate()).padStart(2, "0");
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const handleResetToday = () => {
    if (selectedDate !== today) {
      setSelectedDate(today);
    }
  };

  const handleRefresh = async () => {
    if (!doctorId) {
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", doctorId, selectedDate],
      }),
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "calendar", doctorId],
      }),
    ]);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    const raw = appointment as unknown as Record<string, any>;
    const patientId =
      appointment.patientId ??
      raw.patientID ??
      raw.PatientId ??
      raw.PatientID ??
      raw.patient?.id ??
      null;
    setSelectedAppointmentId(appointment.id);
    setSelectedPatientId(patientId);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "N/A";
    try {
      if (timeStr.includes("T")) {
        return new Date(timeStr).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return timeStr.slice(0, 5);
    } catch {
      return timeStr;
    }
  };

  const getStatusBadgeClass = (status?: string | null) => {
    return getAppointmentStatusBadgeClass(status);
  };

  const canCheckIn = (status?: string | null) => {
    const normalized = normalizeAppointmentStatus(status) ?? "Scheduled";
    return normalized === "Scheduled";
  };

  const canCheckOut = (status?: string | null) => {
    const normalized = normalizeAppointmentStatus(status) ?? "Scheduled";
    return normalized === "CheckedIn" || normalized === "InProgress";
  };

  const canComplete = (status?: string | null) => {
    const normalized = normalizeAppointmentStatus(status) ?? "Scheduled";
    return normalized === "CheckedIn" || normalized === "InProgress";
  };

  const totalSlots = DEFAULT_SLOTS.length; // 4 fixed slots
  const bookedSlots = useMemo(() => {
    return slotsWithStatus.filter((slot) => slot.isBooked).length;
  }, [slotsWithStatus]);

  const availableSlots = totalSlots - bookedSlots;

  // Query appointments for calendar view (current month)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const calendarStartDate = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }, [calendarMonth]);

  const calendarEndDate = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);
    return new Date(year, month, 0); // Last day of month
  }, [calendarMonth]);

  // Query appointments for the calendar month
  const { data: calendarAppointmentsData } = useQuery<
    PaginatedResponse<Appointment>
  >({
    queryKey: ["doctor", "appointments", "calendar", doctorId, calendarMonth],
    enabled: !!doctorId,
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
      if (!doctorId) {
        return {
          code: 200,
          message: "",
          data: [],
          metaData: {
            pageNumber: 1,
            pageSize: 100,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
          },
        };
      }

      try {
        const startDateStr = calendarStartDate.toISOString().split("T")[0];
        const endDateStr = calendarEndDate.toISOString().split("T")[0];
        const response = await api.appointment.getAppointmentsByDoctor(
          doctorId,
          {
            dateFrom: `${startDateStr}T00:00:00`,
            dateTo: `${endDateStr}T23:59:59`,
            pageNumber: 1,
            pageSize: 1000, // Get all appointments for the month
          }
        );
        return response;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return {
            code: 200,
            message: "",
            data: [],
            metaData: {
              pageNumber: 1,
              pageSize: 100,
              totalCount: 0,
              totalPages: 0,
              hasPrevious: false,
              hasNext: false,
            },
          };
        }
        return {
          code: 200,
          message: "",
          data: [],
          metaData: {
            pageNumber: 1,
            pageSize: 100,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
          },
        };
      }
    },
  });

  // Map appointments by date for calendar
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    if (calendarAppointmentsData?.data) {
      calendarAppointmentsData.data.forEach((appointment) => {
        if (!appointment.appointmentDate) return;

        try {
          const appointmentDateStr = appointment.appointmentDate;
          let dateKey: string;

          if (appointmentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateKey = appointmentDateStr;
          } else if (appointmentDateStr.includes("T")) {
            dateKey = appointmentDateStr.split("T")[0];
          } else {
            const appointmentDate = new Date(appointmentDateStr);
            const year = appointmentDate.getFullYear();
            const month = String(appointmentDate.getMonth() + 1).padStart(
              2,
              "0"
            );
            const day = String(appointmentDate.getDate()).padStart(2, "0");
            dateKey = `${year}-${month}-${day}`;
          }

          if (!map[dateKey]) {
            map[dateKey] = [];
          }
          map[dateKey].push(appointment);
        } catch (error) {
          console.error(
            "Error parsing appointment date for calendar:",
            appointment.appointmentDate,
            error
          );
        }
      });
    }
    return map;
  }, [calendarAppointmentsData?.data]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const days: Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      hasAppointments: boolean;
      appointmentCount: number;
      isFull: boolean; // True if all 4 slots are booked
    }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: "",
        day: 0,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: false,
        hasAppointments: false,
        appointmentCount: 0,
        isFull: false,
      });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === today;
      const appointments = appointmentsByDate[dateStr] || [];
      const hasAppointments = appointments.length > 0 && !isWeekend;
      const isFull = appointments.length >= 4 && !isWeekend; // Full if 4 or more appointments

      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday,
        isWeekend,
        hasAppointments,
        appointmentCount: appointments.length,
        isFull,
      });
    }

    return days;
  }, [calendarMonth, appointmentsByDate, today]);

  const handleCalendarMonthChange = (offset: number) => {
    const [year, month] = calendarMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1 + offset, 1);
    const newYear = newDate.getFullYear();
    const newMonth = String(newDate.getMonth() + 1).padStart(2, "0");
    setCalendarMonth(`${newYear}-${newMonth}`);
  };

  const handleCalendarDateClick = (date: string) => {
    if (date) {
      setSelectedDate(date);
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

          <section className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">My Schedule</h1>
                <p className="text-gray-600 mt-1">
                  Manage your daily schedule, view appointments, and handle patient
                  check-ins and check-outs.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoadingAppointments}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAppointments ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </section>

          {/* Date Selection and Summary - Improved UX/UI */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Selected Date</CardTitle>
                  {selectedDate === today && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-lg font-bold text-primary">{humanDateLabel}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isWeekend ? "Weekend - No schedules" : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} scheduled`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Navigation Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShiftDay(-1)}
                    className="flex-1 h-9 font-medium"
                    title="Previous day"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShiftDay(1)}
                    className="flex-1 h-9 font-medium"
                    title="Next day"
                  >
                    Next
                    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                  <Button
                    variant={selectedDate === today ? "default" : "ghost"}
                    size="sm"
                    onClick={handleResetToday}
                    disabled={selectedDate === today}
                    className="h-9 px-3"
                    title="Go to today"
                  >
                    Today
                  </Button>
                </div>
                
                {/* Date Picker */}
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                    }}
                    className="w-full h-10 cursor-pointer pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {!isWeekend && !isLoadingAppointments && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Today's Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Slots</p>
                      <p className="text-xl font-bold text-gray-900">
                        {totalSlots}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="text-xl font-bold text-green-600">
                        {availableSlots}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Booked</p>
                      <p className="text-xl font-bold text-red-600">
                        {bookedSlots}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Appointments</p>
                      <p className="text-xl font-bold text-gray-900">
                        {appointments.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingAppointments}
                  className="w-full"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAppointments ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full"
                  disabled={!doctorId || isWeekend}
                >
                  Create Appointment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/doctor/appointments" })}
                  className="w-full"
                >
                  View All Appointments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Daily Schedule - Side by Side Layout */}
          <div className="grid gap-6 lg:grid-cols-[600px,1fr]">
            {/* Calendar View - Left Side */}
            <Card>
              <CardHeader className="pb-3 pt-4">
                <div className="flex flex-col gap-3">
                  <CardTitle className="text-lg font-semibold">Schedule Calendar</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={() => handleCalendarMonthChange(-1)}
                    >
                      ←
                    </Button>
                    <span className="flex-1 text-center text-sm font-semibold text-gray-900">
                      {new Date(calendarStartDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={() => handleCalendarMonthChange(1)}
                    >
                      →
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-sm"
                      onClick={() => {
                        const now = new Date();
                        setCalendarMonth(
                          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
                        );
                        setSelectedDate(today);
                      }}
                    >
                      Today
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <div className="space-y-3">
                  {/* Calendar Legend */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-green-400 bg-green-100"></div>
                      <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-blue-400 bg-blue-100"></div>
                      <span className="text-gray-600">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-purple-400 bg-purple-100"></div>
                      <span className="text-gray-600">Full (4 slots)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-gray-300 bg-gray-100"></div>
                      <span className="text-gray-600">Weekend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded border border-primary bg-primary/20"></div>
                      <span className="text-gray-600">Selected</span>
                    </div>
                  </div>

                  {/* Calendar Grid - Larger */}
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                        <div
                          key={`${day}-${idx}`}
                          className="p-1 text-center text-xs font-semibold text-gray-600"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => {
                        if (!day.isCurrentMonth) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="aspect-square rounded border border-transparent"
                            />
                          );
                        }

                        return (
                          <button
                            key={day.date}
                            type="button"
                            onClick={() => handleCalendarDateClick(day.date)}
                            disabled={day.isWeekend}
                            className={cn(
                              "aspect-square rounded-md border text-sm transition-all duration-200 flex flex-col items-center justify-center",
                              "hover:scale-105 hover:shadow-md",
                              day.isWeekend
                                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 hover:scale-100 hover:shadow-none"
                                : day.date === selectedDate
                                  ? day.isFull
                                    ? "border-purple-600 bg-purple-200 font-semibold text-purple-900 shadow-md ring-2 ring-purple-400"
                                    : "border-primary bg-primary/20 font-semibold text-primary shadow-md ring-2 ring-primary/30"
                                  : day.isFull
                                    ? "border-purple-500 bg-purple-100 text-purple-900 hover:border-purple-600 hover:bg-purple-200 font-semibold"
                                    : day.hasAppointments
                                      ? "border-blue-400 bg-blue-100 text-blue-900 hover:border-blue-500 hover:bg-blue-200 font-medium"
                                      : "border-green-300 bg-green-50 text-gray-800 hover:border-green-400 hover:bg-green-100",
                              day.isToday && !day.isWeekend && day.date !== selectedDate && "ring-2 ring-primary/50"
                            )}
                          >
                            <span
                              className={cn(
                                "text-base",
                                day.isToday && "font-bold",
                                day.date === selectedDate && day.isFull && "text-purple-900 text-lg",
                                day.date === selectedDate && !day.isFull && "text-primary text-lg"
                              )}
                            >
                              {day.day}
                            </span>
                            {day.hasAppointments && (
                              <span className={cn(
                                "mt-1 text-[10px] font-semibold leading-tight px-1.5 py-0.5 rounded-full",
                                day.date === selectedDate && day.isFull
                                  ? "bg-purple-700 text-white"
                                  : day.date === selectedDate
                                    ? "bg-primary text-white"
                                    : day.isFull
                                      ? "bg-purple-600 text-white"
                                      : "bg-blue-600 text-white"
                              )}>
                                {day.appointmentCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Schedule - Right Side - Compact */}
            <div className="space-y-4">
              {!isWeekend && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Daily Schedule</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {isLoadingAppointments
                        ? "Loading..."
                        : `${totalSlots} slots • ${bookedSlots} booked, ${availableSlots} available`}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {isLoadingAppointments ? (
                      <div className="py-6 text-center text-gray-500 text-sm">
                        <p>Loading...</p>
                      </div>
                    ) : slotsWithStatus.length === 0 ? (
                      <div className="py-6 text-center text-gray-500 text-sm">
                        <p className="font-medium text-gray-900 mb-1">
                          No slots available
                        </p>
                        <p className="text-xs text-gray-500">
                          Monday through Friday only.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {slotsWithStatus.map((slot) => {
                          const appointment = slot.appointment;
                          const isBooked = slot.isBooked || !!appointment;

                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                "rounded-md border p-3 transition-all",
                                isBooked
                                  ? "border-red-300 bg-red-50/80"
                                  : "border-green-200 bg-green-50/50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div
                                      className={cn(
                                        "h-2 w-2 rounded-full flex-shrink-0",
                                        isBooked
                                          ? "bg-red-500"
                                          : "bg-green-500"
                                      )}
                                    />
                                    <p className="font-semibold text-sm text-gray-900">
                                      {formatTime(slot.startTime)} -{" "}
                                      {formatTime(slot.endTime)}
                                    </p>
                                    <Badge
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 border",
                                        isBooked
                                          ? "bg-red-100 text-red-700 border-red-300"
                                          : "bg-green-100 text-green-700 border-green-300"
                                      )}
                                    >
                                      {isBooked ? "Booked" : "Available"}
                                    </Badge>
                                  </div>

                                  {slot.notes && (
                                    <p className="text-xs text-gray-500 mb-1.5">
                                      {slot.notes}
                                    </p>
                                  )}

                                  {appointment ? (
                                    <div className="mt-2 space-y-1.5 rounded bg-white p-2 border border-gray-200">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-xs text-gray-900 truncate">
                                            {appointment.appointmentCode ||
                                              appointment.id.slice(0, 8)}
                                          </p>
                                          {(appointment as any).type && (
                                            <p className="text-[10px] text-gray-600">
                                              {(appointment as any).type}
                                            </p>
                                          )}
                                        </div>
                                        <Badge
                                          className={cn(
                                            "text-[10px] px-1.5 py-0 border flex-shrink-0",
                                            getStatusBadgeClass(
                                              appointment.status
                                            )
                                          )}
                                        >
                                          {(
                                            APPOINTMENT_STATUS_LABELS as Record<
                                              string,
                                              string
                                            >
                                          )[
                                            normalizeAppointmentStatus(
                                              appointment.status
                                            ) ?? "Scheduled"
                                          ] ?? appointment.status}
                                        </Badge>
                                      </div>
                                      {appointment.notes && (
                                        <p className="text-xs text-gray-600 line-clamp-1">
                                          {appointment.notes}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-1.5 pt-1.5 border-t">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-xs"
                                          onClick={() =>
                                            handleAppointmentClick(appointment)
                                          }
                                        >
                                          Details
                                        </Button>
                                        {canCheckIn(appointment.status) && (
                                          <Button
                                            size="sm"
                                            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                                            disabled={checkInMutation.isPending}
                                            onClick={() =>
                                              checkInMutation.mutate(
                                                appointment.id
                                              )
                                            }
                                          >
                                            Check In
                                          </Button>
                                        )}
                                        {canCheckOut(appointment.status) && (
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            className="h-7 px-2 text-xs"
                                            disabled={
                                              checkOutMutation.isPending
                                            }
                                            onClick={() =>
                                              checkOutMutation.mutate(
                                                appointment.id
                                              )
                                            }
                                          >
                                            Check Out
                                          </Button>
                                        )}
                                        {canComplete(appointment.status) && (
                                          <Button
                                            size="sm"
                                            className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                            disabled={
                                              updateStatusMutation.isPending
                                            }
                                            onClick={() =>
                                              updateStatusMutation.mutate({
                                                appointmentId: appointment.id,
                                                status: "Completed",
                                              })
                                            }
                                          >
                                            Complete
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500 italic">
                                      No appointment
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {isWeekend && (
                <Card>
                  <CardContent className="py-6 text-center text-gray-500">
                    <p className="font-medium text-sm text-gray-900 mb-1">
                      Weekend - No schedules
                    </p>
                    <p className="text-xs">
                      Available Monday through Friday.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Detail Modal */}
        <DoctorAppointmentDetailModal
          appointmentId={selectedAppointmentId}
          patientId={selectedPatientId}
          isOpen={!!selectedAppointmentId}
          onClose={() => {
            setSelectedAppointmentId(null);
            setSelectedPatientId(null);
          }}
        />

        {/* Create Appointment Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Appointment"
          description="Schedule a new appointment for a patient."
          size="xl"
        >
          <DoctorCreateAppointmentForm
            doctorId={doctorId ?? ""}
            doctorName={getFullNameFromObject(doctorProfile)}
            layout="modal"
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={() => {
              setIsCreateModalOpen(false);
              toast.success("Appointment created successfully.");
              queryClient.invalidateQueries({
                queryKey: ["doctor", "appointments", doctorId, selectedDate],
              });
              queryClient.invalidateQueries({
                queryKey: ["doctor", "appointments"],
              });
              queryClient.invalidateQueries({
                queryKey: ["doctor", "schedules", doctorId, selectedDate],
              });
              queryClient.invalidateQueries({
                queryKey: ["doctor", "slots", "schedules"],
              });
            }}
          />
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
