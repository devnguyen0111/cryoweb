import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import type { PaginatedResponse, Appointment, Slot, Doctor } from "@/api/types";
import { cn } from "@/utils/cn";
import {
  APPOINTMENT_STATUS_LABELS,
  normalizeAppointmentStatus,
} from "@/utils/appointments";
import { getAppointmentStatusBadgeClass } from "@/utils/status-colors";
import { AppointmentDetailForm } from "@/features/receptionist/appointments/AppointmentDetailForm";
import { getFullNameFromObject } from "@/utils/name-helpers";

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

export const Route = createFileRoute("/receptionist/schedule")({
  component: ReceptionistScheduleComponent,
});

function ReceptionistScheduleComponent() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

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

  const isWeekend = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }, [selectedDate]);

  // Query all appointments for the selected date
  const { data: appointmentsData, isFetching: isAppointmentsLoading } =
    useQuery<PaginatedResponse<Appointment>>({
      queryKey: ["receptionist", "appointments", "schedule", selectedDate],
      queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
        const response = await api.appointment.getAppointments({
          pageNumber: 1,
          pageSize: 100,
          dateFrom: selectedDate,
          dateTo: selectedDate,
        });
        return response;
      },
    });

  // Query all doctors for assignment
  const { data: doctorsData } = useQuery<PaginatedResponse<Doctor>>({
    queryKey: ["receptionist", "doctors", "all"],
    queryFn: async (): Promise<PaginatedResponse<Doctor>> => {
      const response = await api.doctor.getDoctors({
        pageNumber: 1,
        pageSize: 100,
      });
      return response;
    },
  });

  const doctors = doctorsData?.data ?? [];
  const doctorMap = useMemo(() => {
    const map = new Map<string, Doctor>();
    doctors.forEach((doctor) => {
      map.set(doctor.id, doctor);
    });
    return map;
  }, [doctors]);

  // Fetch doctor assignments for all appointments
  const appointmentIds = useMemo(() => {
    if (!appointmentsData?.data) return [];
    return appointmentsData.data
      .filter((appointment) => {
        try {
          const appointmentDateStr = appointment.appointmentDate;
          if (!appointmentDateStr) return false;
          if (appointmentDateStr.includes("T")) {
            const datePart = appointmentDateStr.split("T")[0];
            return datePart === selectedDate;
          }
          return appointmentDateStr.startsWith(selectedDate);
        } catch {
          return false;
        }
      })
      .map((apt) => apt.id);
  }, [appointmentsData?.data, selectedDate]);

  // Fetch doctor assignments for appointments
  const { data: doctorAssignmentsData } = useQuery({
    queryKey: ["receptionist", "appointment-doctors", appointmentIds],
    enabled: appointmentIds.length > 0,
    queryFn: async () => {
      const assignmentsMap = new Map<string, any[]>();
      await Promise.all(
        appointmentIds.map(async (appointmentId) => {
          try {
            const response =
              await api.appointmentDoctor.getAssignmentsByAppointment(
                appointmentId,
                { pageNumber: 1, pageSize: 10 }
              );
            const assignments = response.data || [];
            if (assignments.length > 0) {
              assignmentsMap.set(appointmentId, assignments);
            }
          } catch (error) {
            // Ignore errors for individual appointments
            console.warn(
              `Failed to fetch doctor assignments for appointment ${appointmentId}:`,
              error
            );
          }
        })
      );
      return assignmentsMap;
    },
  });

  const doctorAssignmentsMap = doctorAssignmentsData ?? new Map();

  // Filter appointments for selected date
  const appointments = useMemo(() => {
    if (!appointmentsData?.data) return [];
    return appointmentsData.data.filter((appointment) => {
      try {
        const appointmentDateStr = appointment.appointmentDate;
        if (!appointmentDateStr) return false;

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

  // Map appointments to slots
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
              const slotStart = slot.startTime.slice(0, 5);
              const appointmentTimeShort = appointmentTime.slice(0, 5);
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

  // Create slots with booked status
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
        queryKey: ["receptionist", "appointments", "schedule", selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
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
        queryKey: ["receptionist", "appointments", "schedule", selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to check out patient. Please try again."
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
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "schedule", selectedDate],
      }),
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointment-doctors"],
      }),
    ]);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setSelectedAppointment(appointment);
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

  const resolvePatientLabel = (appointment: Appointment) => {
    const raw = appointment as unknown as Record<string, any>;
    return (
      raw.patient?.accountInfo?.username ??
      getFullNameFromObject(raw.patient) ??
      raw.patientName ??
      raw.patientCode ??
      raw.patient?.patientCode ??
      appointment.patientId ??
      raw.patientID ??
      raw.PatientId ??
      "—"
    );
  };

  const resolveDoctorLabel = (appointment: Appointment) => {
    const raw = appointment as unknown as Record<string, any>;

    // First, try to get doctor from fetched doctor assignments
    const assignments = doctorAssignmentsMap.get(appointment.id);
    if (assignments && assignments.length > 0) {
      const firstAssignment = assignments[0];
      const doctorId = firstAssignment.doctorId || firstAssignment.doctor?.id;
      if (doctorId) {
        const doctor = doctorMap.get(doctorId);
        if (doctor) {
          const name = getFullNameFromObject(doctor);
          if (name) return name;
        }
      }
    }

    // Second, try to get doctor from doctors array
    if (raw.doctors && Array.isArray(raw.doctors) && raw.doctors.length > 0) {
      const firstDoctor = raw.doctors[0];
      if (firstDoctor.firstName || firstDoctor.lastName) {
        const name = getFullNameFromObject(firstDoctor);
        if (name) return name;
      }
      const doctorIdToFind =
        firstDoctor.doctorId || firstDoctor.id || firstDoctor.doctor?.id;
      if (doctorIdToFind) {
        const doctor = doctorMap.get(doctorIdToFind);
        if (doctor) {
          const name = getFullNameFromObject(doctor);
          if (name) return name;
        }
      }
    }

    // Third, try to get doctor from slot.schedule.doctor
    if (raw.slot?.schedule?.doctor) {
      const scheduleDoctor = raw.slot.schedule.doctor;
      if (scheduleDoctor.firstName || scheduleDoctor.lastName) {
        const name = getFullNameFromObject(scheduleDoctor);
        if (name) return name;
      }
      const scheduleDoctorId = scheduleDoctor.id || scheduleDoctor.doctorId;
      if (scheduleDoctorId) {
        const doctor = doctorMap.get(scheduleDoctorId);
        if (doctor) {
          const name = getFullNameFromObject(doctor);
          if (name) return name;
        }
      }
    }

    // Fourth, try to get doctor from various ID fields
    const doctorIds: string[] = [];
    if (raw.doctorIds && Array.isArray(raw.doctorIds)) {
      doctorIds.push(...raw.doctorIds.filter(Boolean));
    }
    if (raw.DoctorIds && Array.isArray(raw.DoctorIds)) {
      doctorIds.push(...raw.DoctorIds.filter(Boolean));
    }
    if (raw.doctorIDs && Array.isArray(raw.doctorIDs)) {
      doctorIds.push(...raw.doctorIDs.filter(Boolean));
    }
    if (raw.doctorId && typeof raw.doctorId === "string") {
      doctorIds.push(raw.doctorId);
    }
    if (raw.DoctorId && typeof raw.DoctorId === "string") {
      doctorIds.push(raw.DoctorId);
    }
    if (raw.doctors && Array.isArray(raw.doctors)) {
      raw.doctors.forEach((item: any) => {
        const id = item?.doctorId || item?.id || item?.doctor?.id;
        if (id && !doctorIds.includes(id)) {
          doctorIds.push(id);
        }
      });
    }
    if (raw.doctorAssignments && Array.isArray(raw.doctorAssignments)) {
      raw.doctorAssignments.forEach((item: any) => {
        const id = item?.doctorId || item?.id || item?.doctor?.id;
        if (id && !doctorIds.includes(id)) {
          doctorIds.push(id);
        }
      });
    }

    for (const doctorId of doctorIds) {
      if (doctorId) {
        const doctor = doctorMap.get(doctorId);
        if (doctor) {
          const name = getFullNameFromObject(doctor);
          if (name) return name;
        }
      }
    }

    return "No doctor assigned";
  };

  const totalSlots = DEFAULT_SLOTS.length;
  const bookedSlots = useMemo(() => {
    return slotsWithStatus.filter((slot) => slot.isBooked).length;
  }, [slotsWithStatus]);

  const availableSlots = totalSlots - bookedSlots;

  // Calendar month state
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
    return new Date(year, month, 0);
  }, [calendarMonth]);

  // Query appointments for calendar
  const { data: calendarAppointmentsData } = useQuery<
    PaginatedResponse<Appointment>
  >({
    queryKey: ["receptionist", "appointments", "calendar", calendarMonth],
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
      try {
        const startDateStr = calendarStartDate.toISOString().split("T")[0];
        const endDateStr = calendarEndDate.toISOString().split("T")[0];
        const response = await api.appointment.getAppointments({
          dateFrom: startDateStr,
          dateTo: endDateStr,
          pageNumber: 1,
          pageSize: 1000,
        });
        return response;
      } catch (error: any) {
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
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      hasAppointments: boolean;
      appointmentCount: number;
      isFull: boolean;
    }> = [];

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

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = dateStr === today;
      const appointments = appointmentsByDate[dateStr] || [];
      const hasAppointments = appointments.length > 0 && !isWeekend;
      const isFull = appointments.length >= 4 && !isWeekend;

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
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">Appointment Schedule</h1>
                <p className="text-gray-600 mt-1">
                  Manage appointments, assign doctors, and handle patient
                  check-ins and check-outs.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isAppointmentsLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isAppointmentsLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </section>

          {/* Date Selection and Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-primary/20 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Selected Date
                  </CardTitle>
                  {selectedDate === today && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-lg font-bold text-primary">
                    {humanDateLabel}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isWeekend
                      ? "Weekend - No schedules"
                      : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} scheduled`}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShiftDay(-1)}
                    className="flex-1 h-9 font-medium"
                  >
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShiftDay(1)}
                    className="flex-1 h-9 font-medium"
                  >
                    Next
                    <svg
                      className="h-4 w-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant={selectedDate === today ? "default" : "ghost"}
                    size="sm"
                    onClick={handleResetToday}
                    disabled={selectedDate === today}
                    className="h-9 px-3"
                  >
                    Today
                  </Button>
                </div>
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
                    <svg
                      className="h-4 w-4 text-gray-400"
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
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {!isWeekend && !isAppointmentsLoading && (
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
                  disabled={isAppointmentsLoading}
                  className="w-full"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isAppointmentsLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/receptionist/appointments" })}
                  className="w-full"
                >
                  View All Appointments
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/receptionist/dashboard" })}
                  className="w-full"
                >
                  Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Calendar and Daily Schedule */}
          <div className="grid gap-6 lg:grid-cols-[600px,1fr]">
            {/* Calendar View */}
            <Card>
              <CardHeader className="pb-3 pt-4">
                <div className="flex flex-col gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Schedule Calendar
                  </CardTitle>
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

                  <div className="rounded-lg border border-gray-200 bg-white p-3">
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
                              day.isToday &&
                                !day.isWeekend &&
                                day.date !== selectedDate &&
                                "ring-2 ring-primary/50"
                            )}
                          >
                            <span
                              className={cn(
                                "text-base",
                                day.isToday && "font-bold",
                                day.date === selectedDate &&
                                  day.isFull &&
                                  "text-purple-900 text-lg",
                                day.date === selectedDate &&
                                  !day.isFull &&
                                  "text-primary text-lg"
                              )}
                            >
                              {day.day}
                            </span>
                            {day.hasAppointments && (
                              <span
                                className={cn(
                                  "mt-1 text-[10px] font-semibold leading-tight px-1.5 py-0.5 rounded-full",
                                  day.date === selectedDate && day.isFull
                                    ? "bg-purple-700 text-white"
                                    : day.date === selectedDate
                                      ? "bg-primary text-white"
                                      : day.isFull
                                        ? "bg-purple-600 text-white"
                                        : "bg-blue-600 text-white"
                                )}
                              >
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

            {/* Daily Schedule */}
            <div className="space-y-4">
              {!isWeekend && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Daily Schedule</CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {isAppointmentsLoading
                        ? "Loading..."
                        : `${totalSlots} slots • ${bookedSlots} booked, ${availableSlots} available`}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {isAppointmentsLoading ? (
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
                          const status = appointment?.status;
                          const normalizedStatus =
                            normalizeAppointmentStatus(status);
                          const patientLabel = appointment
                            ? resolvePatientLabel(appointment)
                            : null;
                          const doctorLabel = appointment
                            ? resolveDoctorLabel(appointment)
                            : null;

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
                                        isBooked ? "bg-red-500" : "bg-green-500"
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
                                          <p className="text-[10px] text-gray-600">
                                            Patient: {patientLabel}
                                          </p>
                                          {doctorLabel !==
                                            "No doctor assigned" && (
                                            <p className="text-[10px] text-gray-600">
                                              Doctor: {doctorLabel}
                                            </p>
                                          )}
                                          {appointment.appointmentType && (
                                            <p className="text-[10px] text-gray-600">
                                              Type:{" "}
                                              {appointment.appointmentType}
                                            </p>
                                          )}
                                        </div>
                                        {normalizedStatus && (
                                          <Badge
                                            className={cn(
                                              "text-[10px] px-1.5 py-0 border flex-shrink-0",
                                              getStatusBadgeClass(
                                                normalizedStatus
                                              )
                                            )}
                                          >
                                            {(
                                              APPOINTMENT_STATUS_LABELS as Record<
                                                string,
                                                string
                                              >
                                            )[normalizedStatus] ??
                                              appointment.status}
                                          </Badge>
                                        )}
                                      </div>
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
                    <p className="text-xs">Available Monday through Friday.</p>
                  </CardContent>
                </Card>
              )}

              {/* Appointments without slots */}
              {!isWeekend &&
                appointments.filter(
                  (appt) => !appointmentsBySlotId[appt.slotId || ""]
                ).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Other Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {appointments
                          .filter(
                            (appt) => !appointmentsBySlotId[appt.slotId || ""]
                          )
                          .map((appointment) => {
                            const doctorLabel = resolveDoctorLabel(appointment);
                            return (
                              <div
                                key={appointment.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {resolvePatientLabel(appointment)}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatTime(appointment.appointmentDate)} ·{" "}
                                    {appointment.appointmentType ||
                                      "Appointment"}
                                  </div>
                                  {doctorLabel !== "No doctor assigned" && (
                                    <div className="text-xs text-gray-500">
                                      Doctor: {doctorLabel}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() =>
                                      handleAppointmentClick(appointment)
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        </div>

        {/* Appointment Detail Modal */}
        <Modal
          isOpen={Boolean(selectedAppointmentId)}
          onClose={() => {
            setSelectedAppointmentId(null);
            setSelectedAppointment(null);
          }}
          title="Appointment Details"
          description="View and manage appointment details"
          size="xl"
        >
          {selectedAppointmentId ? (
            <AppointmentDetailForm
              appointmentId={selectedAppointmentId}
              layout="modal"
              initialAppointment={selectedAppointment}
              onClose={() => {
                setSelectedAppointmentId(null);
                setSelectedAppointment(null);
              }}
              onOpenPatientProfile={(patientId) => {
                navigate({
                  to: "/receptionist/patients/$patientId",
                  params: { patientId },
                });
              }}
            />
          ) : null}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
