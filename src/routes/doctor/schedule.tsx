import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
  DoctorSchedule,
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
import { DoctorAppointmentDetailModal } from "@/features/doctor/appointments/DoctorAppointmentDetailModal";
import { Modal } from "@/components/ui/modal";
import { DoctorCreateAppointmentForm } from "@/features/doctor/appointments/DoctorCreateAppointmentForm";

// Default slots - 4 fixed slots (2 morning, 2 afternoon)
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

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  // Check if selected date is a weekend (Saturday = 6, Sunday = 0)
  const isWeekend = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }, [selectedDate]);

  // Query appointments for the selected date and doctor (filter by date here)
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

  // Filter appointments by selected date (client-side to ensure accuracy)
  const appointments = useMemo(() => {
    if (!appointmentsData?.data) return [];

    return appointmentsData.data.filter((appointment) => {
      if (!appointment.appointmentDate) return false;

      try {
        // Parse appointmentDate (can be ISO datetime or date only)
        const appointmentDateStr = appointment.appointmentDate;

        // If already in YYYY-MM-DD format, use directly
        if (appointmentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return appointmentDateStr === selectedDate;
        }

        // If ISO datetime, extract date part
        if (appointmentDateStr.includes("T")) {
          const datePart = appointmentDateStr.split("T")[0];
          return datePart === selectedDate;
        }

        // Fallback: parse with Date and compare
        const appointmentDate = new Date(appointmentDateStr);
        if (isNaN(appointmentDate.getTime())) {
          return false;
        }

        // Get date in local timezone to avoid timezone errors
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

  // Map appointments to slots
  const appointmentsBySlotId = useMemo(() => {
    const map: Record<string, Appointment> = {};
    appointments.forEach((appointment) => {
      if (appointment.slotId) {
        map[appointment.slotId] = appointment;
      } else {
        // If no slotId, try to match by time
        if (appointment.appointmentDate) {
          try {
            const appointmentDate = new Date(appointment.appointmentDate);
            const appointmentHour = appointmentDate.getHours();
            const appointmentMinute = appointmentDate.getMinutes();
            const appointmentTime = `${String(appointmentHour).padStart(2, "0")}:${String(appointmentMinute).padStart(2, "0")}:00`;

            // Match with slot based on time
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

  // Create slots with booked status based on appointments for the day
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

  // Check-in mutation
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

  // Check-out mutation
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

  // Update status mutation
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

  // Toggle schedule availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({
      scheduleId,
      isAvailable,
    }: {
      scheduleId: string;
      isAvailable: boolean;
    }) =>
      api.doctorSchedule.updateScheduleAvailability(scheduleId, isAvailable),
    onSuccess: () => {
      toast.success("Schedule availability updated.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "schedules", doctorId, selectedDate],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update schedule availability. Please try again."
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

  const handleRefresh = () => {
    if (!doctorId) {
      return;
    }
    queryClient.invalidateQueries({
      queryKey: ["doctor", "appointments", doctorId, selectedDate],
    });
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
    const normalized = normalizeAppointmentStatus(status) ?? "Scheduled";
    switch (normalized) {
      case "Scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "CheckedIn":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "InProgress":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "NoShow":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
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

      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday,
        isWeekend,
        hasAppointments,
        appointmentCount: appointments.length,
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
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <p className="text-gray-600">
              Manage your daily schedule, view appointments, and handle patient
              check-ins and check-outs.
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>Select Date</CardTitle>
                <p className="text-sm text-gray-500">{humanDateLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShiftDay(-1)}
                >
                  Previous Day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShiftDay(1)}
                >
                  Next Day
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToday}
                  disabled={selectedDate === today}
                >
                  Today
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                  }}
                  className="w-[160px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingAppointments}
                >
                  {isLoadingAppointments ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              {isWeekend ? (
                <div className="py-6 text-center text-gray-500">
                  <p className="font-medium text-gray-900 mb-2">
                    Weekend - No schedules available
                  </p>
                  <p className="text-sm">
                    Schedules are typically available Monday through Friday.
                  </p>
                </div>
              ) : isLoadingAppointments ? (
                <div className="py-6 text-center text-gray-500">
                  Loading appointments...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div>
                      <p className="font-medium text-gray-900">Total Slots</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totalSlots}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700">Available</p>
                      <p className="text-2xl font-bold text-green-600">
                        {availableSlots}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-red-700">Booked</p>
                      <p className="text-2xl font-bold text-red-600">
                        {bookedSlots}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Appointments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {appointments.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Schedule Calendar</CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => handleCalendarMonthChange(-1)}
                  >
                    ←
                  </Button>
                  <span className="min-w-[100px] text-center text-xs font-medium">
                    {new Date(calendarStartDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => handleCalendarMonthChange(1)}
                  >
                    →
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px]"
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
            <CardContent className="pt-0 pb-3">
              <div className="space-y-2">
                {/* Calendar Legend - Very Compact */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded border border-green-300 bg-green-100"></div>
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded border border-blue-300 bg-blue-100"></div>
                    <span className="text-gray-600">Booked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded border border-gray-300 bg-gray-100"></div>
                    <span className="text-gray-600">Weekend</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded border border-primary bg-primary/20"></div>
                    <span className="text-gray-600">Selected</span>
                  </div>
                </div>

                {/* Calendar Grid - Very Compact */}
                <div className="rounded border border-gray-200 bg-white p-1.5">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                      <div
                        key={`${day}-${idx}`}
                        className="p-0.5 text-center text-[9px] font-semibold text-gray-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((day, index) => {
                      if (!day.isCurrentMonth) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="aspect-square"
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
                            "aspect-square rounded border text-[10px] transition-all hover:scale-105",
                            day.isWeekend
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                              : day.date === selectedDate
                                ? "border-primary bg-primary/20 font-semibold text-primary shadow-sm"
                                : day.hasAppointments
                                  ? "border-blue-300 bg-blue-100 text-blue-900 hover:border-blue-400 hover:bg-blue-200"
                                  : "border-green-200 bg-green-50 text-gray-700 hover:border-green-300 hover:bg-green-100",
                            day.isToday && "ring-1 ring-primary/50"
                          )}
                        >
                          <div className="flex h-full flex-col items-center justify-center">
                            <span
                              className={cn(
                                day.isToday && "font-bold text-[11px]",
                                day.date === selectedDate && "text-primary"
                              )}
                            >
                              {day.day}
                            </span>
                            {day.hasAppointments && (
                              <span className="mt-0.5 text-[8px] font-medium text-blue-700 leading-none">
                                {day.appointmentCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <div className="space-y-6">
              {/* Daily Schedule Timeline */}
              {!isWeekend && (
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Schedule - {humanDateLabel}</CardTitle>
                    <p className="text-sm text-gray-500">
                      {isWeekend
                        ? "Slots are only available Monday through Friday."
                        : `Viewing ${totalSlots} time slot(s) for ${humanDateLabel}. ${bookedSlots} booked, ${availableSlots} available.`}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingAppointments ? (
                      <div className="py-12 text-center text-gray-500">
                        <p className="mb-2">Loading appointments...</p>
                        <p className="text-sm">
                          Please wait while we fetch your appointments for this
                          day.
                        </p>
                      </div>
                    ) : slotsWithStatus.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                          <svg
                            className="h-8 w-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="mb-2 text-lg font-semibold text-gray-900">
                          Weekend - No Slots Available
                        </p>
                        <p className="mb-4 text-sm text-gray-500">
                          Slots are only available Monday through Friday.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {slotsWithStatus.map((slot) => {
                          const appointment = slot.appointment;
                          const isBooked = slot.isBooked || !!appointment;

                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                "rounded-lg border-2 p-4 transition-all",
                                isBooked
                                  ? "border-red-300 bg-red-50/80 shadow-sm"
                                  : "border-green-200 bg-green-50/50 hover:border-green-300"
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "h-3 w-3 rounded-full",
                                          isBooked
                                            ? "bg-red-500"
                                            : "bg-green-500"
                                        )}
                                      />
                                      <p className="font-semibold text-lg text-gray-900">
                                        {formatTime(slot.startTime)} -{" "}
                                        {formatTime(slot.endTime)}
                                      </p>
                                    </div>
                                    <Badge
                                      className={cn(
                                        "border font-medium",
                                        isBooked
                                          ? "bg-red-100 text-red-700 border-red-300"
                                          : "bg-green-100 text-green-700 border-green-300"
                                      )}
                                    >
                                      {isBooked ? "Booked" : "Available"}
                                    </Badge>
                                  </div>

                                  {slot.notes && (
                                    <div className="mb-2 text-sm text-gray-600">
                                      <span className="text-gray-500">
                                        {slot.notes}
                                      </span>
                                    </div>
                                  )}

                                  {appointment ? (
                                    <div className="mt-3 space-y-2 rounded-md bg-white p-3 border border-gray-200">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-semibold text-gray-900">
                                            Appointment:{" "}
                                            {appointment.appointmentCode ||
                                              appointment.id.slice(0, 8)}
                                          </p>
                                          {(appointment as any).type && (
                                            <p className="text-sm text-gray-600">
                                              Type: {(appointment as any).type}
                                            </p>
                                          )}
                                        </div>
                                        <Badge
                                          className={cn(
                                            "border",
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
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                          {appointment.notes}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleAppointmentClick(appointment)
                                          }
                                        >
                                          View Details
                                        </Button>
                                        {canCheckIn(appointment.status) && (
                                          <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
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
                                            className="bg-emerald-600 hover:bg-emerald-700"
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
                                    <div className="mt-2 text-sm text-gray-500 italic">
                                      Slot available - No appointment scheduled
                                    </div>
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
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate({ to: "/doctor/appointments" })}
                  >
                    View All Appointments
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create New Appointment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="font-medium text-gray-900">
                      Total Slots
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {totalSlots}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                    <span className="font-medium text-gray-900">
                      Available Slots
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {availableSlots}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2">
                    <span className="font-medium text-gray-900">
                      Booked Slots
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {bookedSlots}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                    <span className="font-medium text-gray-900">
                      Appointments
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {appointments.length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
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
            doctorName={doctorProfile?.fullName}
            layout="modal"
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={(appointmentId) => {
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
