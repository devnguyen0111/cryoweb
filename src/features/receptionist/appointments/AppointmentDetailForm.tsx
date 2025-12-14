import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import type {
  Appointment,
  AppointmentExtendedDetailResponse,
  Doctor,
} from "@/api/types";
import {
  APPOINTMENT_STATUS_LABELS,
  normalizeAppointmentStatus,
} from "@/utils/appointments";
import { getFullNameFromObject } from "@/utils/name-helpers";

// Appointment types as specified by user
const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "procedure", label: "Procedure" },
  { value: "following-up", label: "Following-up" },
  { value: "testing", label: "Testing" },
  { value: "other", label: "Other" },
] as const;

export interface AppointmentDetailFormProps {
  appointmentId: string;
  layout?: "page" | "modal";
  onClose?: () => void;
  onOpenPatientProfile?: (patientId: string) => void;
  initialAppointment?: Appointment | null;
}

export function AppointmentDetailForm({
  appointmentId,
  layout = "page",
  onClose,
  onOpenPatientProfile,
  initialAppointment,
}: AppointmentDetailFormProps) {
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch appointment details
  const { data: appointmentResponse, isLoading: isLoadingAppointment } =
    useQuery<AppointmentExtendedDetailResponse | null>({
      queryKey: ["receptionist", "appointments", "detail", appointmentId],
      queryFn: async () => {
        try {
          const response =
            await api.appointment.getAppointmentDetails(appointmentId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
      enabled: Boolean(appointmentId),
    });

  const appointment = useMemo(() => {
    if (appointmentResponse) {
      return appointmentResponse;
    }
    if (initialAppointment) {
      return initialAppointment as unknown as AppointmentExtendedDetailResponse;
    }
    return null;
  }, [appointmentResponse, initialAppointment]);

  // Extract appointment data
  const appointmentDate = useMemo(() => {
    if (!appointment) return null;
    const date = appointment.appointmentDate;
    if (!date) return null;
    try {
      // Handle both DateOnly (YYYY-MM-DD) and ISO datetime formats
      if (date.includes("T")) {
        return new Date(date).toISOString().split("T")[0];
      }
      return date.split("T")[0];
    } catch {
      return date.split("T")[0];
    }
  }, [appointment]);

  // Extract appointment time from slot
  const appointmentTime = useMemo(() => {
    if (!appointment?.slot) return null;
    const slot = appointment.slot;

    const getTimeDisplay = (timeStr?: string | null): string | null => {
      if (!timeStr) return null;

      try {
        // Handle ISO datetime format
        if (timeStr.includes("T")) {
          const date = new Date(timeStr);
          if (isNaN(date.getTime())) return null;
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }

        // Handle time string format (HH:mm:ss or HH:mm)
        if (timeStr.match(/^\d{2}:\d{2}/)) {
          return timeStr.slice(0, 5); // Extract HH:mm
        }

        // Try to parse as date
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } catch {
        return null;
      }
    };

    const startTime = getTimeDisplay(slot.startTime);
    const endTime = getTimeDisplay(slot.endTime);

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    return null;
  }, [appointment]);

  const appointmentType = useMemo(() => {
    if (!appointment) return null;
    const type = (
      appointment.type ||
      (appointment as any).appointmentType ||
      ""
    ).toLowerCase();
    // Map backend types to user-specified types
    if (type === "treatment") return "procedure";
    if (type === "followup" || type === "follow-up") return "following-up";
    return type || "consultation";
  }, [appointment]);

  const appointmentStatus = useMemo(() => {
    if (!appointment) return null;
    return normalizeAppointmentStatus(appointment.status) ?? "Pending";
  }, [appointment]);

  // Check if appointment has doctor
  const hasDoctor = useMemo(() => {
    if (!appointment) return false;
    const doctors = appointment.doctors ?? [];
    return doctors.length > 0;
  }, [appointment]);

  const assignedDoctor = useMemo(() => {
    if (!appointment?.doctors || appointment.doctors.length === 0) return null;
    return appointment.doctors[0];
  }, [appointment]);

  // Fetch patient details
  const { data: patient } = useQuery({
    queryKey: ["receptionist", "patient", appointment?.patientId],
    enabled: Boolean(appointment?.patientId),
    queryFn: async () => {
      if (!appointment?.patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(
          appointment.patientId
        );
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallback = await api.patient.getPatientById(
            appointment.patientId
          );
          return fallback.data;
        }
        throw error;
      }
    },
  });

  // Fetch all doctors for selection
  const { data: doctorsData } = useQuery({
    queryKey: ["receptionist", "doctors", "all"],
    queryFn: async () => {
      const response = await api.doctor.getDoctors({
        pageNumber: 1,
        pageSize: 100,
      });
      const payload = (response as unknown as Record<string, any>)?.data;
      if (Array.isArray(payload)) {
        return payload as Doctor[];
      }
      return (payload?.data as Doctor[]) ?? [];
    },
  });

  const doctors = doctorsData ?? [];

  // Get schedules for selected doctor (query all, then filter by date on client)
  const { data: doctorSchedulesData, isLoading: isLoadingSchedules } = useQuery(
    {
      queryKey: ["receptionist", "doctor-schedules", selectedDoctorId],
      enabled: Boolean(selectedDoctorId),
      queryFn: async () => {
        if (!selectedDoctorId) return [];
        try {
          // Query all schedules for the doctor (API may not support dateFrom/dateTo)
          const response = await api.doctorSchedule.getSchedulesByDoctorId(
            selectedDoctorId,
            {
              pageNumber: 1,
              pageSize: 200, // Get more schedules to ensure we have enough
            }
          );
          return response.data ?? [];
        } catch (error) {
          console.error("Error fetching doctor schedules:", error);
          return [];
        }
      },
    }
  );

  // Filter schedules by appointment date on client side
  const schedulesForDate = useMemo(() => {
    if (!doctorSchedulesData || !appointmentDate) return [];

    // Normalize appointment date to YYYY-MM-DD format
    const normalizedAppointmentDate = appointmentDate.includes("T")
      ? appointmentDate.split("T")[0]
      : appointmentDate.split(" ")[0];

    return doctorSchedulesData.filter((schedule) => {
      try {
        const scheduleDate = schedule.workDate;
        if (!scheduleDate) return false;

        // Normalize schedule date to YYYY-MM-DD format
        let scheduleDateOnly: string;
        if (scheduleDate.includes("T")) {
          scheduleDateOnly = scheduleDate.split("T")[0];
        } else if (scheduleDate.includes(" ")) {
          scheduleDateOnly = scheduleDate.split(" ")[0];
        } else {
          scheduleDateOnly = scheduleDate; // Already in YYYY-MM-DD format
        }

        // Compare dates
        return scheduleDateOnly === normalizedAppointmentDate;
      } catch (error) {
        console.error("Error filtering schedule by date:", error, schedule);
        return false;
      }
    });
  }, [doctorSchedulesData, appointmentDate]);

  // Get slots from schedules for the date
  const {
    data: availableSlots,
    isLoading: isLoadingSlots,
    error: slotsError,
  } = useQuery({
    queryKey: [
      "receptionist",
      "available-slots",
      selectedDoctorId,
      appointmentDate,
      schedulesForDate.map((s) => s.id).join(","),
    ],
    enabled: Boolean(
      selectedDoctorId && appointmentDate && schedulesForDate.length > 0
    ),
    queryFn: async () => {
      if (!schedulesForDate || schedulesForDate.length === 0) return [];

      try {
        // Get slots from all schedules for this date
        const allSlots: any[] = [];

        for (const schedule of schedulesForDate) {
          try {
            const slotsResponse = await api.slot.getSlotsBySchedule(
              schedule.id,
              {
                pageNumber: 1,
                pageSize: 100,
                isBooked: false, // Only get unbooked slots
              }
            );
            const slots = slotsResponse.data ?? [];
            if (Array.isArray(slots)) {
              allSlots.push(...slots);
            }
          } catch (error) {
            console.error(
              `Error fetching slots for schedule ${schedule.id}:`,
              error
            );
            // Continue with other schedules
          }
        }

        return allSlots;
      } catch (error) {
        console.error("Error fetching available slots:", error);
        return [];
      }
    },
  });

  // Set selected doctor and slot when appointment loads
  useEffect(() => {
    if (assignedDoctor) {
      setSelectedDoctorId(assignedDoctor.doctorId);
    }
    if (appointment?.slotId) {
      setSelectedSlotId(appointment.slotId);
    }
  }, [assignedDoctor, appointment]);

  // Assign random doctor if no doctor assigned
  const assignRandomDoctorMutation = useMutation({
    mutationFn: async () => {
      if (!appointment || doctors.length === 0) {
        throw new Error("No doctors available");
      }

      // Get random doctor
      const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];

      // Assign doctor with type "booking"
      await api.appointmentDoctor.createAssignment({
        appointmentId,
        doctorId: randomDoctor.id,
        role: "booking",
      });

      return randomDoctor;
    },
    onSuccess: (doctor) => {
      const doctorName =
        getFullNameFromObject(doctor) || doctor.badgeId || doctor.id;
      toast.success(`Assigned doctor: ${doctorName}`);
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to assign doctor. Please try again.";
      toast.error(message);
    },
  });

  // Change doctor mutation
  const changeDoctorMutation = useMutation({
    mutationFn: async ({
      doctorId,
      slotId,
    }: {
      doctorId: string;
      slotId?: string;
    }) => {
      if (!appointment || !doctorId) {
        throw new Error("Missing appointment or doctor ID");
      }

      // Update slot if provided
      if (slotId) {
        await api.appointment.updateAppointment(appointmentId, {
          slotId,
        });
      }

      // Remove existing doctor assignments
      if (assignedDoctor) {
        try {
          await api.appointmentDoctor.deleteAssignment(assignedDoctor.id);
        } catch (error) {
          // Ignore if assignment doesn't exist
        }
      }

      // Create new assignment with type "booking"
      await api.appointmentDoctor.createAssignment({
        appointmentId,
        doctorId,
        role: "booking",
      });

      return { doctorId, slotId };
    },
    onSuccess: async ({ doctorId, slotId }) => {
      const doctor = doctors.find((d) => d.id === doctorId);
      const doctorName = doctor
        ? getFullNameFromObject(doctor) || doctor.badgeId || doctorId
        : doctorId;
      const message = slotId
        ? `Changed doctor to: ${doctorName} with new slot`
        : `Changed doctor to: ${doctorName}`;
      toast.success(message);
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });

      // Send notification to patient
      if (appointment?.patientId) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        const doctorName = doctor
          ? getFullNameFromObject(doctor) || doctor.badgeId
          : undefined;
        await sendAppointmentNotification(appointment.patientId, "updated", {
          appointmentId: appointmentId,
          appointmentDate: appointment.appointmentDate,
          appointmentType: appointment.type,
          doctorName: doctorName,
        });
      }

      // Reset selections
      setSelectedSlotId("");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to change doctor. Please try again.";
      toast.error(message);
    },
  });

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: () => api.appointment.checkIn(appointmentId),
    onSuccess: async () => {
      toast.success("Patient checked in");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });

      // Send notification to patient
      if (appointment?.patientId) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        await sendAppointmentNotification(
          appointment.patientId,
          "status_changed",
          {
            appointmentId: appointmentId,
            appointmentDate: appointment.appointmentDate,
            status: "Checked In",
          }
        );
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to check in patient. Please try again.";
      toast.error(message);
    },
  });

  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: () => api.appointment.checkOut(appointmentId),
    onSuccess: async () => {
      toast.success("Patient checked out");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });

      // Send notification to patient
      if (appointment?.patientId) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        await sendAppointmentNotification(
          appointment.patientId,
          "status_changed",
          {
            appointmentId: appointmentId,
            appointmentDate: appointment.appointmentDate,
            status: "Checked Out",
          }
        );
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to check out patient. Please try again.";
      toast.error(message);
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: () =>
      api.appointment.cancelAppointment(appointmentId, {
        cancellationReason: cancelReason || undefined,
      }),
    onSuccess: async () => {
      toast.success("Appointment cancelled");
      setCancelReason("");
      setShowCancelDialog(false);
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });

      // Send notification to patient
      if (appointment?.patientId) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        await sendAppointmentNotification(appointment.patientId, "cancelled", {
          appointmentId: appointmentId,
          appointmentDate: appointment.appointmentDate,
          appointmentType: appointment.type,
        });
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to cancel appointment. Please try again.";
      toast.error(message);
    },
  });

  const patientName = useMemo(() => {
    if (patient) {
      const accountFullName = (patient as any).accountInfo
        ? getFullNameFromObject((patient as any).accountInfo)
        : null;
      return accountFullName || getFullNameFromObject(patient) || patient.id;
    }
    if (appointment?.patient) {
      const p = appointment.patient as any;
      const accountFullName = p.accountInfo
        ? getFullNameFromObject(p.accountInfo)
        : null;
      return (
        accountFullName || getFullNameFromObject(p) || appointment.patientId
      );
    }
    return appointment?.patientId ?? "Unknown";
  }, [patient, appointment]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Not recorded";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoadingAppointment) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading appointment details...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">Appointment not found</p>
      </div>
    );
  }

  return (
    <div
      className={
        layout === "modal" ? "space-y-6 overflow-y-auto pr-1" : "space-y-6"
      }
      style={layout === "modal" ? { maxHeight: "70vh" } : undefined}
    >
      {/* Appointment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Patient Info */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Patient</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-gray-700">{patientName}</p>
                {onOpenPatientProfile && appointment.patientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPatientProfile(appointment.patientId!)}
                  >
                    View Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Doctor Info - Only show if doctor exists */}
            {hasDoctor && assignedDoctor ? (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Assigned Doctor</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-gray-700">
                    {getFullNameFromObject(assignedDoctor) ||
                      assignedDoctor.badgeId ||
                      "Unknown Doctor"}
                  </p>
                  {assignedDoctor.specialty && (
                    <Badge variant="secondary" className="text-xs">
                      {assignedDoctor.specialty}
                    </Badge>
                  )}
                  {assignedDoctor.role && (
                    <Badge variant="outline" className="text-xs">
                      {assignedDoctor.role}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-amber-600">
                  Doctor Assignment
                </Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-amber-800">No doctor assigned</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => assignRandomDoctorMutation.mutate()}
                    disabled={
                      assignRandomDoctorMutation.isPending ||
                      doctors.length === 0
                    }
                  >
                    {assignRandomDoctorMutation.isPending
                      ? "Assigning..."
                      : "Assign"}
                  </Button>
                </div>
              </div>
            )}

            {/* Booking Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Booking Date</Label>
              <p className="text-sm text-gray-700">
                {appointmentDate ? formatDate(appointmentDate) : "N/A"}
              </p>
            </div>

            {/* Appointment Time */}
            {appointmentTime && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Appointment Time
                </Label>
                <p className="text-sm text-gray-700">{appointmentTime}</p>
              </div>
            )}

            {/* Appointment Status */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Status</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    appointmentStatus === "Completed"
                      ? "default"
                      : appointmentStatus === "Cancelled"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {appointmentStatus
                    ? (APPOINTMENT_STATUS_LABELS[appointmentStatus] ??
                      appointmentStatus)
                    : "Unknown"}
                </Badge>
              </div>
            </div>

            {/* Appointment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Appointment Type</Label>
              <p className="text-sm text-gray-700 capitalize">
                {appointmentType
                  ? (APPOINTMENT_TYPES.find((t) => t.value === appointmentType)
                      ?.label ?? appointmentType)
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Notes - Full width */}
          {appointment.notes && (
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-semibold">
                Notes / Patient Requests
              </Label>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check In/Out */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Check-in Time</Label>
              <Input
                readOnly
                value={formatDateTime(appointment.checkInTime ?? null)}
                className="bg-gray-50"
              />
              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={
                  checkInMutation.isPending || !!appointment.checkInTime
                }
                size="sm"
              >
                {checkInMutation.isPending ? "Checking in..." : "Check In"}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Check-out Time</Label>
              <Input
                readOnly
                value={formatDateTime(appointment.checkOutTime ?? null)}
                className="bg-gray-50"
              />
              <Button
                onClick={() => checkOutMutation.mutate()}
                disabled={
                  checkOutMutation.isPending ||
                  !!appointment.checkOutTime ||
                  !appointment.checkInTime
                }
                size="sm"
                variant="secondary"
              >
                {checkOutMutation.isPending ? "Checking out..." : "Check Out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>Change Doctor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Doctor</Label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  setSelectedSlotId(""); // Reset slot when doctor changes
                }}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doctor) => {
                  const displayName =
                    getFullNameFromObject(doctor) ||
                    doctor.email ||
                    `Doctor ${doctor.badgeId || doctor.id}`;
                  return (
                    <option key={doctor.id} value={doctor.id}>
                      {displayName}
                      {doctor.specialty && ` - ${doctor.specialty}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Available Slots */}
            {selectedDoctorId && (
              <div className="space-y-2">
                <Label>Available Slots</Label>
                {isLoadingSchedules ? (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">
                      Loading schedules...
                    </p>
                  </div>
                ) : schedulesForDate.length === 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">
                      No schedule found for this doctor on this date. You can
                      still change the doctor without selecting a slot.
                    </p>
                  </div>
                ) : isLoadingSlots ? (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">
                      Loading available slots...
                    </p>
                  </div>
                ) : slotsError ? (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-800">
                      Error loading slots. You can still change the doctor
                      without selecting a slot.
                    </p>
                  </div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  (() => {
                    const freeSlots = availableSlots.filter((s) => !s.isBooked);
                    return freeSlots.length > 0 ? (
                      <>
                        <select
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={selectedSlotId}
                          onChange={(e) => setSelectedSlotId(e.target.value)}
                        >
                          <option value="">Select a slot (optional)</option>
                          {freeSlots.map((slot) => {
                            const getTimeDisplay = (timeStr?: string) => {
                              if (!timeStr) return "N/A";
                              try {
                                if (timeStr.includes("T")) {
                                  const date = new Date(timeStr);
                                  if (isNaN(date.getTime())) {
                                    return timeStr.slice(0, 5);
                                  }
                                  return date.toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  });
                                }
                                return timeStr.slice(0, 5);
                              } catch {
                                return timeStr.slice(0, 5);
                              }
                            };
                            return (
                              <option key={slot.id} value={slot.id}>
                                {getTimeDisplay(slot.startTime)} -{" "}
                                {getTimeDisplay(slot.endTime)}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-xs text-green-600">
                          {freeSlots.length} available slot(s) on this date
                        </p>
                      </>
                    ) : (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800">
                          All slots are booked for this doctor on this date. You
                          can still change the doctor without selecting a slot.
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">
                      No slots available for this doctor on this date. You can
                      still change the doctor without selecting a slot.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => {
                if (selectedDoctorId) {
                  changeDoctorMutation.mutate({
                    doctorId: selectedDoctorId,
                    slotId: selectedSlotId || undefined,
                  });
                }
              }}
              disabled={
                changeDoctorMutation.isPending ||
                !selectedDoctorId ||
                (assignedDoctor
                  ? selectedDoctorId === assignedDoctor.doctorId &&
                    (!selectedSlotId || selectedSlotId === appointment?.slotId)
                  : false)
              }
              size="sm"
              variant="outline"
            >
              {changeDoctorMutation.isPending ? "Changing..." : "Change Doctor"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Appointment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Cancel Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCancelDialog ? (
            <Button
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={appointmentStatus === "Cancelled"}
            >
              Cancel Appointment
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cancellation Reason</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!cancelReason.trim()) {
                      toast.error("Please enter a cancellation reason");
                      return;
                    }
                    cancelAppointmentMutation.mutate();
                  }}
                  disabled={cancelAppointmentMutation.isPending}
                >
                  {cancelAppointmentMutation.isPending
                    ? "Cancelling..."
                    : "Confirm Cancellation"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {layout === "modal" && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
