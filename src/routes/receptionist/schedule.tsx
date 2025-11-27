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
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import type {
  PaginatedResponse,
  Appointment,
  Slot,
  AppointmentStatus,
  Doctor,
} from "@/api/types";
import { cn } from "@/utils/cn";
import {
  APPOINTMENT_STATUS_LABELS,
  normalizeAppointmentStatus,
  ensureAppointmentStatus,
} from "@/utils/appointments";
import { AppointmentDetailForm } from "@/features/receptionist/appointments/AppointmentDetailForm";

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
  const [selectedAppointment, setSelectedAppointment] = useState<
    Appointment | null
  >(null);

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

  // Filter appointments for selected date
  const appointments = useMemo(() => {
    if (!appointmentsData?.data) return [];
    return appointmentsData.data.filter((appointment) => {
      try {
        const appointmentDateStr = appointment.appointmentDate;
        if (!appointmentDateStr) return false;

        // Try to match date part only (YYYY-MM-DD)
        if (appointmentDateStr.includes("T")) {
          const datePart = appointmentDateStr.split("T")[0];
          if (datePart === selectedDate) {
            return true;
          }
        } else if (appointmentDateStr.startsWith(selectedDate)) {
          return true;
        }

        // Fallback: parse with Date and compare
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

  // Assign doctor mutation
  const assignDoctorMutation = useMutation({
    mutationFn: async ({
      appointmentId,
      doctorId,
      slotId,
    }: {
      appointmentId: string;
      doctorId: string;
      slotId?: string;
    }) => {
      if (slotId) {
        await api.appointment.updateAppointment(appointmentId, {
          slotId,
        });
      }
      await api.appointmentDoctor.createAssignment({
        appointmentId,
        doctorId,
        role: "Primary",
      });
    },
    onSuccess: () => {
      toast.success("Doctor assigned to appointment.");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "schedule", selectedDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to assign doctor. Please try again.";
      // Ignore duplicate assignment errors
      if (
        isAxiosError(error) &&
        (error.response?.status === 409 || error.response?.status === 208)
      ) {
        toast.success("Doctor already assigned.");
        queryClient.invalidateQueries({
          queryKey: ["receptionist", "appointments", "schedule", selectedDate],
        });
        return;
      }
      toast.error(message);
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
    queryClient.invalidateQueries({
      queryKey: ["receptionist", "appointments", "schedule", selectedDate],
    });
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

  const resolvePatientLabel = (appointment: Appointment) => {
    const raw = appointment as unknown as Record<string, any>;
    return (
      raw.patient?.accountInfo?.username ??
      raw.patient?.fullName ??
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
    const doctorIds =
      raw.doctorIds ??
      raw.DoctorIds ??
      raw.doctorIDs ??
      raw.doctors?.map((item: any) => item?.doctorId ?? item?.id) ??
      raw.doctorAssignments?.map(
        (item: any) => item?.doctorId ?? item?.doctor?.id
      ) ??
      [];
    if (Array.isArray(doctorIds) && doctorIds.length > 0) {
      const doctor = doctorMap.get(doctorIds[0]);
      return doctor?.fullName ?? "Assigned";
    }
    return "No doctor assigned";
  };

  const totalSlots = DEFAULT_SLOTS.length;
  const bookedSlots = useMemo(() => {
    return slotsWithStatus.filter((slot) => slot.isBooked).length;
  }, [slotsWithStatus]);

  const availableSlots = totalSlots - bookedSlots;
  const appointmentsWithoutDoctor = useMemo(() => {
    return appointments.filter((appt) => {
      const raw = appt as unknown as Record<string, any>;
      const doctorIds =
        raw.doctorIds ??
        raw.DoctorIds ??
        raw.doctorIDs ??
        raw.doctors?.map((item: any) => item?.doctorId ?? item?.id) ??
        raw.doctorAssignments?.map(
          (item: any) => item?.doctorId ?? item?.doctor?.id
        ) ??
        [];
      return !Array.isArray(doctorIds) || doctorIds.length === 0;
    });
  }, [appointments]);

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Appointment Schedule</h1>
              <p className="text-gray-600 mt-1">
                Manage appointments and assign doctors
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/receptionist/appointments" })}
              >
                View All Appointments
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Dashboard
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>{humanDateLabel}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShiftDay(-1)}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetToday}
                    disabled={selectedDate === today}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShiftDay(1)}
                  >
                    Next →
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Total appointments:</span>{" "}
                  {appointments.length}
                </div>
                <div>
                  <span className="font-medium">Booked slots:</span>{" "}
                  {bookedSlots}/{totalSlots}
                </div>
                <div>
                  <span className="font-medium">Available slots:</span>{" "}
                  {availableSlots}
                </div>
                {appointmentsWithoutDoctor.length > 0 && (
                  <div className="text-amber-600">
                    <span className="font-medium">
                      Need doctor assignment:
                    </span>{" "}
                    {appointmentsWithoutDoctor.length}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {isWeekend ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p className="text-lg">No appointments scheduled on weekends.</p>
              </CardContent>
            </Card>
          ) : isAppointmentsLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <p>Loading appointments...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Time Slots */}
              <div className="grid gap-4 md:grid-cols-2">
                {slotsWithStatus.map((slot) => {
                  const appointment = slot.appointment;
                  const hasAppointment = !!appointment;
                  const status = appointment?.status;
                  const normalizedStatus = normalizeAppointmentStatus(status);
                  const patientLabel = appointment
                    ? resolvePatientLabel(appointment)
                    : null;
                  const doctorLabel = appointment
                    ? resolveDoctorLabel(appointment)
                    : null;
                  const needsDoctor =
                    hasAppointment && doctorLabel === "No doctor assigned";

                  return (
                    <Card
                      key={slot.id}
                      className={cn(
                        "transition-all",
                        hasAppointment
                          ? "border-2 border-primary bg-primary/5"
                          : "border border-gray-200"
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {formatTime(slot.startTime)} -{" "}
                            {formatTime(slot.endTime)}
                          </CardTitle>
                          {hasAppointment && normalizedStatus && (
                            <Badge
                              className={cn(
                                "text-xs",
                                getStatusBadgeClass(normalizedStatus)
                              )}
                            >
                              {APPOINTMENT_STATUS_LABELS[normalizedStatus]}
                            </Badge>
                          )}
                        </div>
                        {slot.notes && (
                          <p className="text-xs text-gray-500">{slot.notes}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {hasAppointment ? (
                          <>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">
                                  Patient:
                                </span>{" "}
                                <span className="text-gray-900">
                                  {patientLabel}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">
                                  Doctor:
                                </span>{" "}
                                <span
                                  className={cn(
                                    doctorLabel === "No doctor assigned"
                                      ? "text-amber-600 font-medium"
                                      : "text-gray-900"
                                  )}
                                >
                                  {doctorLabel}
                                </span>
                              </div>
                              {appointment.appointmentType && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Type:
                                  </span>{" "}
                                  <span className="text-gray-900">
                                    {appointment.appointmentType}
                                  </span>
                                </div>
                              )}
                            </div>

                            {needsDoctor && (
                              <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
                                <p className="text-xs font-medium text-amber-800 mb-2">
                                  Assign a doctor:
                                </p>
                                <select
                                  className="w-full rounded-md border border-amber-300 px-2 py-1 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  onChange={(e) => {
                                    if (e.target.value && appointment) {
                                      assignDoctorMutation.mutate({
                                        appointmentId: appointment.id,
                                        doctorId: e.target.value,
                                        slotId: slot.id,
                                      });
                                      e.target.value = "";
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="">Select doctor...</option>
                                  {doctors.map((doctor) => (
                                    <option key={doctor.id} value={doctor.id}>
                                      {doctor.fullName || doctor.id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAppointmentClick(appointment)}
                              >
                                View Details
                              </Button>
                              {canCheckIn(status) && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    checkInMutation.mutate(appointment.id)
                                  }
                                  disabled={checkInMutation.isPending}
                                >
                                  Check In
                                </Button>
                              )}
                              {canCheckOut(status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    checkOutMutation.mutate(appointment.id)
                                  }
                                  disabled={checkOutMutation.isPending}
                                >
                                  Check Out
                                </Button>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No appointment scheduled
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Appointments without slots */}
              {appointments.filter(
                (appt) => !appointmentsBySlotId[appt.slotId || ""]
              ).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Other Appointments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {appointments
                        .filter(
                          (appt) => !appointmentsBySlotId[appt.slotId || ""]
                        )
                        .map((appointment) => {
                          const doctorLabel = resolveDoctorLabel(appointment);
                          const needsDoctor = doctorLabel === "No doctor assigned";
                          return (
                            <div
                              key={appointment.id}
                              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {resolvePatientLabel(appointment)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTime(appointment.appointmentDate)} ·{" "}
                                  {appointment.appointmentType || "Appointment"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Doctor:{" "}
                                  <span
                                    className={
                                      needsDoctor
                                        ? "text-amber-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {doctorLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {needsDoctor && (
                                  <select
                                    className="rounded-md border border-amber-300 px-2 py-1 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        assignDoctorMutation.mutate({
                                          appointmentId: appointment.id,
                                          doctorId: e.target.value,
                                        });
                                        e.target.value = "";
                                      }
                                    }}
                                    defaultValue=""
                                  >
                                    <option value="">Assign doctor...</option>
                                    {doctors.map((doctor) => (
                                      <option key={doctor.id} value={doctor.id}>
                                        {doctor.fullName || doctor.id}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAppointmentClick(appointment)}
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
            </>
          )}
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

