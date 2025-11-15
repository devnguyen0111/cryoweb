import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { PaginatedResponse, Appointment, Slot } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { cn } from "@/utils/cn";

// Default slots from database (Slots table)
const DEFAULT_SLOTS: (Slot & { notes?: string })[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    doctorScheduleId: "",
    startTime: "08:00:00",
    endTime: "10:00:00",
    notes: "Morning Slot 1",
    isBooked: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    doctorScheduleId: "",
    startTime: "10:00:00",
    endTime: "12:00:00",
    notes: "Morning Slot 2",
    isBooked: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    doctorScheduleId: "",
    startTime: "13:00:00",
    endTime: "15:00:00",
    notes: "Afternoon Slot 1",
    isBooked: false,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    doctorScheduleId: "",
    startTime: "15:00:00",
    endTime: "17:00:00",
    notes: "Afternoon Slot 2",
    isBooked: false,
  },
];

export const Route = createFileRoute("/doctor/schedule")({
  component: DoctorScheduleComponent,
});

function DoctorScheduleComponent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

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

  // Query appointments for the selected date and doctor to check which slots are booked
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
          // Query appointments for the selected date
          const response = await api.appointment.getAppointments({
            doctorId,
            dateFrom: `${selectedDate}T00:00:00`,
            dateTo: `${selectedDate}T23:59:59`,
            pageNumber: 1,
            pageSize: 100,
          });
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

  // Map appointments to slots to determine which slots are booked
  const bookedSlotIds = useMemo(() => {
    const appointments = appointmentsData?.data ?? [];
    const bookedIds = new Set<string>();

    appointments.forEach((appointment) => {
      // Check if appointment has a slotId
      if (appointment.slotId) {
        bookedIds.add(appointment.slotId);
      } else {
        // If no slotId, try to match by appointment date time
        if (appointment.appointmentDate) {
          const appointmentDate = new Date(appointment.appointmentDate);
          const appointmentHour = appointmentDate.getHours();
          const appointmentMinute = appointmentDate.getMinutes();
          const appointmentTime = `${String(appointmentHour).padStart(2, "0")}:${String(appointmentMinute).padStart(2, "0")}`;

          const matchedSlot = DEFAULT_SLOTS.find((slot) => {
            // Extract time from slot.startTime (could be ISO datetime or just time string)
            let slotStart: string | undefined;
            if (slot.startTime?.includes("T")) {
              // ISO datetime format - extract HH:mm
              const slotDate = new Date(slot.startTime);
              slotStart = `${String(slotDate.getHours()).padStart(2, "0")}:${String(slotDate.getMinutes()).padStart(2, "0")}`;
            } else if (slot.startTime) {
              // Time string format (HH:mm:ss or HH:mm) - extract HH:mm
              slotStart = slot.startTime.slice(0, 5);
            }
            // Compare HH:mm format (without seconds)
            return slotStart === appointmentTime;
          });
          if (matchedSlot) {
            bookedIds.add(matchedSlot.id);
          }
        }
      }
    });

    return bookedIds;
  }, [appointmentsData]);

  // Create slots with booking status
  const slotsWithStatus = useMemo(() => {
    return DEFAULT_SLOTS.map((slot) => ({
      ...slot,
      isBooked: bookedSlotIds.has(slot.id),
      bookingStatus: bookedSlotIds.has(slot.id)
        ? ("booked" as const)
        : ("available" as const),
    }));
  }, [bookedSlotIds]);

  const slots = slotsWithStatus;

  const handleShiftDay = (offset: number) => {
    // Parse the date string to avoid timezone issues
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);

    // Format back to YYYY-MM-DD
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

  // Get appointments for the selected date
  const appointmentsForDay = useMemo(() => {
    return appointmentsData?.data ?? [];
  }, [appointmentsData]);

  // Count available and booked slots
  const availableSlotsCount = useMemo(() => {
    return slots.filter((slot) => !slot.isBooked).length;
  }, [slots]);

  const bookedSlotsCount = useMemo(() => {
    return slots.filter((slot) => slot.isBooked).length;
  }, [slots]);

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
            <h1 className="text-3xl font-bold">My schedule</h1>
            <p className="text-gray-600">
              View your daily availability. By default, you have 4 available
              slots per day (Monday-Friday). Booked slots are automatically
              marked as unavailable.
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>Select date</CardTitle>
                <p className="text-sm text-gray-500">{humanDateLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShiftDay(-1)}
                >
                  Previous day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShiftDay(1)}
                >
                  Next day
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
                    Weekend - No slots available
                  </p>
                  <p className="text-sm">
                    Slots are only available Monday through Friday.
                  </p>
                </div>
              ) : isLoadingAppointments ? (
                <div className="py-6 text-center text-gray-500">
                  Loading schedule...
                </div>
              ) : appointmentsForDay.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-900 mb-3">
                    Appointments for this day ({appointmentsForDay.length})
                  </p>
                  {appointmentsForDay.map((appointment) => {
                    const appointmentTime = appointment.appointmentDate
                      ? new Date(
                          appointment.appointmentDate
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A";
                    return (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-1 rounded-lg border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointmentTime}
                          </p>
                          <p className="text-gray-500">
                            {appointment.appointmentCode ||
                              `Appointment ${appointment.id.slice(0, 8)}`}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Status: {appointment.status || "Scheduled"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  No appointments scheduled for this day.
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Daily time slots</CardTitle>
                <p className="text-sm text-gray-500">
                  {isWeekend
                    ? "No slots available on weekends."
                    : `You have 4 default slots per day. ${availableSlotsCount} available, ${bookedSlotsCount} booked.`}
                </p>
              </CardHeader>
              <CardContent>
                {isWeekend ? (
                  <div className="py-6 text-center text-gray-500">
                    <p className="font-medium text-gray-900 mb-2">
                      Weekend - No slots available
                    </p>
                    <p className="text-sm">
                      Slots are only available Monday through Friday.
                    </p>
                  </div>
                ) : isLoadingAppointments ? (
                  <div className="py-6 text-center text-gray-500">
                    Loading slots...
                  </div>
                ) : slots.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {slots.map((slot) => {
                      // Extract time from startTime (could be ISO datetime or time string)
                      const getTimeString = (timeStr?: string) => {
                        if (!timeStr) return "N/A";
                        if (timeStr.includes("T")) {
                          // ISO datetime format
                          return new Date(timeStr).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                        }
                        // Time string format (HH:mm:ss or HH:mm)
                        return timeStr.slice(0, 5);
                      };
                      const slotLabelStart = getTimeString(slot.startTime);
                      const slotLabelEnd = getTimeString(slot.endTime);
                      const isBooked =
                        slot.isBooked || slot.bookingStatus === "booked";
                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            "rounded-lg border p-4 text-left transition",
                            isBooked
                              ? "border-red-200 bg-red-50/50"
                              : "border-green-200 bg-green-50/50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-base font-semibold text-gray-900">
                              {slotLabelStart} - {slotLabelEnd}
                            </p>
                            {isBooked ? (
                              <span className="text-xs font-medium text-red-600">
                                Booked
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-green-600">
                                Available
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {slot.notes || "Default time slot"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    Default time slot configuration not found. Please contact
                    the administrator.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily overview</CardTitle>
                  <p className="text-sm text-gray-500">
                    {isWeekend
                      ? "No slots available on weekends."
                      : `Schedule automatically updates based on appointments.`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900">
                      Slot availability
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between rounded-md border border-green-100 bg-green-50 px-3 py-2">
                        <span className="font-medium text-gray-900">
                          Available slots
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          {availableSlotsCount} / {slots.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-red-100 bg-red-50 px-3 py-2">
                        <span className="font-medium text-gray-900">
                          Booked slots
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          {bookedSlotsCount} / {slots.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isWeekend && appointmentsForDay.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900">
                        Appointments ({appointmentsForDay.length})
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {appointmentsForDay.slice(0, 5).map((appointment) => {
                          const appointmentTime = appointment.appointmentDate
                            ? new Date(
                                appointment.appointmentDate
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A";
                          return (
                            <li
                              key={appointment.id}
                              className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                            >
                              <span className="font-medium text-gray-900">
                                {appointmentTime}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {appointment.appointmentCode || "Appt"}
                              </span>
                            </li>
                          );
                        })}
                        {appointmentsForDay.length > 5 && (
                          <li className="text-xs text-gray-500 px-3 py-1">
                            +{appointmentsForDay.length - 5} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-gray-500 pt-2 border-t">
                    <p>
                      <span className="font-medium text-gray-900">Note:</span>{" "}
                      Slots are automatically available Monday through Friday.
                      When a patient books an appointment, the corresponding
                      slot becomes unavailable. No manual registration is
                      required.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
