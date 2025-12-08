import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api/client";
import type {
  AppointmentType,
  AppointmentStatus,
  CreateAppointmentRequest,
  Slot,
  PaginatedResponse,
  Appointment,
  Doctor,
  BaseResponse,
} from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLast4Chars } from "@/utils/id-helpers";

// Default slots - 4 fixed slots (2 morning, 2 afternoon) - same as in doctor schedule
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

interface DoctorCreateAppointmentFormProps {
  doctorId: string;
  doctorName?: string | null;
  layout?: "page" | "modal";
  defaultPatientId?: string;
  disablePatientSelection?: boolean; // Lock patient when creating from treatment cycle
  defaultAppointmentDate?: string; // Default appointment date (YYYY-MM-DD)
  defaultAppointmentType?: AppointmentType; // Default appointment type
  treatmentCycleId?: string; // Treatment cycle ID if creating appointment during treatment
  onClose?: () => void;
  onCreated?: (appointmentId: string) => void;
}

// Appointment types matching backend enum
const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: "Consultation", label: "Consultation" },
  { value: "Ultrasound", label: "Ultrasound" },
  { value: "BloodTest", label: "Blood Test" },
  { value: "OPU", label: "OPU (Oocyte Pick Up)" },
  { value: "ET", label: "ET (Embryo Transfer)" },
  { value: "IUI", label: "IUI (Intrauterine Insemination)" },
  { value: "FollowUp", label: "Follow-up visit" },
  { value: "Injection", label: "Injection" },
  { value: "Booking", label: "Booking" },
];

export function DoctorCreateAppointmentForm({
  doctorId,
  doctorName,
  layout = "modal",
  defaultPatientId,
  disablePatientSelection = false,
  defaultAppointmentDate,
  defaultAppointmentType,
  treatmentCycleId,
  onClose,
  onCreated,
}: DoctorCreateAppointmentFormProps) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState("");

  // Fetch doctor details to get full name if not provided
  const { data: doctorData } = useQuery<BaseResponse<Doctor>>({
    queryKey: ["doctor", doctorId],
    enabled: !!doctorId && !doctorName,
    retry: false,
    queryFn: async () => {
      if (!doctorId) {
        throw new Error("Doctor ID is required");
      }
      try {
        const response = await api.doctor.getDoctorById(doctorId);
        return response;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return {
            code: 404,
            message: "Doctor not found",
            data: null as any,
          };
        }
        throw error;
      }
    },
  });

  // Get doctor display name - use provided name or fetch from API
  // Priority: doctorName prop > account.firstName + lastName > fullName
  const displayDoctorName = useMemo(() => {
    if (doctorName) {
      return doctorName;
    }

    if (doctorData?.data) {
      const doctor = doctorData.data as any;
      // Try to get name from account object (firstName + lastName)
      if (doctor.account?.firstName && doctor.account?.lastName) {
        return `${doctor.account.firstName} ${doctor.account.lastName}`.trim();
      }
      // Fallback to fullName if account doesn't have firstName/lastName
      if (doctor.fullName) {
        return doctor.fullName;
      }
    }

    return null;
  }, [doctorName, doctorData]);

  const initialFormState = useMemo(
    () => ({
      patientId: defaultPatientId ?? "",
      appointmentDate: defaultAppointmentDate ?? "",
      startTime: "",
      endTime: "",
      description: "",
      type: (defaultAppointmentType ?? "Consultation") as AppointmentType,
      serviceId: "",
      slotId: "",
      doctorId,
    }),
    [defaultPatientId, doctorId, defaultAppointmentDate, defaultAppointmentType]
  );

  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  const { data: patientsData } = useQuery({
    queryKey: [
      "doctor",
      "patients",
      { searchTerm: patientSearch.trim() || undefined },
    ],
    queryFn: () =>
      api.patient.getPatients({
        pageNumber: 1,
        pageSize: 50,
        searchTerm: patientSearch.trim() || undefined,
      }),
    enabled: !disablePatientSelection, // Don't fetch if patient selection is disabled
  });
  const patients = patientsData?.data ?? [];

  // Fetch patient details when patient is locked (from treatment cycle)
  const { data: lockedPatientDetails } = useQuery({
    queryKey: ["patient-details", formState.patientId],
    queryFn: async () => {
      if (!formState.patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(
          formState.patientId
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: disablePatientSelection && !!formState.patientId,
  });

  const { data: lockedUserDetails } = useQuery({
    queryKey: ["user-details", formState.patientId],
    queryFn: async () => {
      if (!formState.patientId) return null;
      try {
        const response = await api.user.getUserDetails(formState.patientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: disablePatientSelection && !!formState.patientId,
  });

  // Get locked patient display info
  const lockedPatientName =
    lockedPatientDetails?.accountInfo?.username ||
    lockedUserDetails?.fullName ||
    lockedUserDetails?.userName ||
    lockedPatientDetails?.fullName ||
    "Unknown";
  const lockedPatientCode = lockedPatientDetails?.patientCode;

  const { data: servicesData } = useQuery({
    queryKey: ["doctor", "services", { pageSize: 50 }],
    queryFn: () =>
      api.service.getServices({
        pageNumber: 1,
        pageSize: 50,
      }),
  });
  const services = servicesData?.data ?? [];

  // Check if selected date is a weekend (Saturday = 6, Sunday = 0)
  const isWeekend = useMemo(() => {
    if (!formState.appointmentDate) return false;
    const date = new Date(`${formState.appointmentDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }, [formState.appointmentDate]);

  // Query appointments for the selected date to check which slots are booked
  // Following the same logic as doctor schedule dashboard
  const { data: appointmentsData, isFetching: isLoadingAppointments } =
    useQuery<PaginatedResponse<Appointment>>({
      queryKey: ["doctor", "appointments", doctorId, formState.appointmentDate],
      enabled: Boolean(doctorId && formState.appointmentDate && !isWeekend),
      retry: false,
      queryFn: async (): Promise<PaginatedResponse<Appointment>> => {
        if (!doctorId || !formState.appointmentDate) {
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
              dateFrom: `${formState.appointmentDate}T00:00:00`,
              dateTo: `${formState.appointmentDate}T23:59:59`,
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
    if (!appointmentsData?.data || !formState.appointmentDate) return [];

    return appointmentsData.data.filter((appointment) => {
      if (!appointment.appointmentDate) return false;

      try {
        // Parse appointmentDate (can be ISO datetime or date only)
        const appointmentDateStr = appointment.appointmentDate;

        // If already in YYYY-MM-DD format, use directly
        if (appointmentDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return appointmentDateStr === formState.appointmentDate;
        }

        // If ISO datetime, extract date part
        if (appointmentDateStr.includes("T")) {
          const datePart = appointmentDateStr.split("T")[0];
          return datePart === formState.appointmentDate;
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

        return appointmentDateOnly === formState.appointmentDate;
      } catch {
        return false;
      }
    });
  }, [appointmentsData?.data, formState.appointmentDate]);

  // Map appointments to slots to determine which slots are booked
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

  // Create slots with booking status based on appointments for the day
  const slotsWithStatus = useMemo(() => {
    if (isWeekend) return [];
    return DEFAULT_SLOTS.map((slot) => {
      const appointment = appointmentsBySlotId[slot.id] || null;
      return {
        ...slot,
        isBooked: !!appointment,
      };
    });
  }, [appointmentsBySlotId, isWeekend]);

  const availableSlots = useMemo(() => {
    return slotsWithStatus.filter((slot) => !slot.isBooked);
  }, [slotsWithStatus]);

  const isLoadingSlots = isLoadingAppointments;

  // Auto-select first available slot when slots are loaded and no slot is selected
  useEffect(() => {
    if (
      !isLoadingSlots &&
      !isWeekend &&
      availableSlots.length > 0 &&
      !formState.slotId &&
      formState.appointmentDate
    ) {
      // Auto-select the first available slot
      const firstAvailableSlot = availableSlots[0];
      if (firstAvailableSlot) {
        // Extract time from slot.startTime and endTime
        const getTimeString = (timeStr?: string) => {
          if (!timeStr) return "";
          if (timeStr.includes("T")) {
            // ISO datetime format - extract HH:mm
            const date = new Date(timeStr);
            return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
          }
          // Time string format (HH:mm:ss or HH:mm) - extract HH:mm
          return timeStr.slice(0, 5);
        };

        setFormState((prev) => ({
          ...prev,
          slotId: firstAvailableSlot.id,
          startTime:
            getTimeString(firstAvailableSlot.startTime) || prev.startTime,
          endTime: getTimeString(firstAvailableSlot.endTime) || prev.endTime,
        }));
      }
    }
  }, [
    isLoadingSlots,
    isWeekend,
    availableSlots,
    formState.slotId,
    formState.appointmentDate,
  ]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === formState.serviceId),
    [services, formState.serviceId]
  );

  const createAppointmentMutation = useMutation({
    mutationFn: async ({ payload }: { payload: CreateAppointmentRequest }) => {
      // Create the appointment with doctorIds and doctorRoles included
      // The backend should handle creating AppointmentDoctor entries automatically
      const response = await api.appointment.createAppointment(payload);
      const appointment = response.data;

      // Fallback: If backend doesn't handle doctorIds automatically,
      // create AppointmentDoctor entry separately
      // This is a safety measure - if doctorIds is handled, this might fail with duplicate error
      // which we'll ignore
      if (
        appointment?.id &&
        doctorId &&
        (!payload.doctorIds || payload.doctorIds.length === 0)
      ) {
        try {
          await api.appointmentDoctor.createAssignment({
            appointmentId: appointment.id,
            doctorId: doctorId,
            role: "Primary",
          });
        } catch (error: any) {
          // If it's a duplicate error (409), that's fine - backend already handled it
          if (error?.response?.status === 409) {
            // Backend already created the AppointmentDoctor entry, ignore
            console.log(
              "AppointmentDoctor entry already exists, backend handled it"
            );
          } else {
            // Other errors - log but don't fail
            console.error("Failed to link doctor to appointment:", error);
            toast.warning(
              "Appointment created but doctor assignment may have failed. Please verify."
            );
          }
        }
      }

      return appointment;
    },
    onSuccess: async (appointment) => {
      toast.success("Appointment created successfully");
      // Invalidate all appointment-related queries
      queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", { doctorId }],
      });
      // Invalidate appointmentDoctor queries
      queryClient.invalidateQueries({ queryKey: ["appointmentDoctor"] });
      // Invalidate appointments query for the selected date to update slot availability
      if (formState.appointmentDate) {
        queryClient.invalidateQueries({
          queryKey: [
            "doctor",
            "appointments",
            doctorId,
            formState.appointmentDate,
          ],
        });
      }
      
      // Send notification to patient
      if (appointment?.patientId && appointment?.id) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        await sendAppointmentNotification(
          appointment.patientId,
          "created",
          {
            appointmentId: appointment.id,
            appointmentDate: appointment.appointmentDate,
            appointmentType: appointment.appointmentType || (appointment as any).type,
            doctorName: displayDoctorName,
          },
          doctorId
        );
      }
      
      if (appointment?.id) {
        onCreated?.(appointment.id);
      }
      onClose?.();
    },
    onError: (error: any) => {
      const defaultMessage =
        "Unable to create appointment. Please check the form and try again.";
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const details = Object.values(apiErrors).flat().join(" ");
        toast.error(details || defaultMessage);
        console.error("Doctor create appointment error", apiErrors);
      } else {
        const message = error?.response?.data?.message || defaultMessage;
        toast.error(message);
        console.error(
          "Doctor create appointment error",
          error?.response?.data || error
        );
      }
    },
  });

  const handleSlotSelect = (slotId: string) => {
    const slot = availableSlots.find((item) => item.id === slotId);
    if (!slot) {
      setFormState((prev) => ({
        ...prev,
        slotId: "",
      }));
      return;
    }

    // Extract time from slot.startTime (could be ISO datetime or time string)
    const getTimeString = (timeStr?: string) => {
      if (!timeStr) return "";
      if (timeStr.includes("T")) {
        // ISO datetime format - extract HH:mm
        const date = new Date(timeStr);
        return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
      // Time string format (HH:mm:ss or HH:mm) - extract HH:mm
      return timeStr.slice(0, 5);
    };

    setFormState((prev) => ({
      ...prev,
      slotId,
      startTime: getTimeString(slot.startTime) || prev.startTime,
      endTime: getTimeString(slot.endTime) || prev.endTime,
    }));
  };

  const handleSubmit = () => {
    const trimmedDescription = formState.description
      ? formState.description.trim()
      : "";

    if (!formState.patientId) {
      toast.error("Please select a patient.");
      return;
    }
    if (!formState.appointmentDate) {
      toast.error("Please select an appointment date.");
      return;
    }

    // Check if selected date is a weekend
    const selectedDate = new Date(`${formState.appointmentDate}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error("Appointments are only available Monday through Friday.");
      return;
    }

    if (!formState.slotId) {
      toast.error("Please select a time slot.");
      return;
    }

    // Verify the selected slot is available
    const selectedSlot = availableSlots.find((s) => s.id === formState.slotId);
    if (!selectedSlot) {
      toast.error(
        "The selected slot is no longer available. Please choose another slot."
      );
      return;
    }

    // Backend expects appointmentDate as DateOnly (YYYY-MM-DD), not ISO datetime
    // The slotId already contains the time information
    const appointmentDate = formState.appointmentDate; // Already in YYYY-MM-DD format

    // Build the payload according to backend API requirements
    const payload: CreateAppointmentRequest = {
      patientId: formState.patientId,
      slotId: formState.slotId,
      type: formState.type, // Backend uses "type" not "appointmentType"
      appointmentDate: appointmentDate, // DateOnly format: YYYY-MM-DD
      status: "Scheduled" as AppointmentStatus,
      reason: trimmedDescription || "Appointment scheduled",
      instructions: trimmedDescription || undefined,
      notes:
        trimmedDescription ||
        (selectedService
          ? `Service: ${selectedService.serviceName ?? selectedService.id}`
          : undefined),
      treatmentCycleId: treatmentCycleId || undefined, // Include treatment cycle ID if provided
      doctorIds: doctorId ? [doctorId] : undefined,
      doctorRoles: doctorId ? ["Primary"] : undefined,
    };

    createAppointmentMutation.mutate({ payload });
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setPatientSearch("");
  };

  const headerDescription =
    layout === "page"
      ? "Schedule a patient visit and attach optional services."
      : "Fill in the details below to schedule a new appointment.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Create appointment</h2>
          <p className="text-sm text-gray-600">{headerDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {layout === "page" ? (
            <Button variant="outline" onClick={resetForm}>
              Reset form
            </Button>
          ) : null}
          {onClose ? (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          ) : null}
          <Button
            onClick={handleSubmit}
            disabled={createAppointmentMutation.isPending}
          >
            Save appointment
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient & scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Patient
                {disablePatientSelection && (
                  <span className="ml-2 text-xs text-gray-500">
                    (Locked to treatment cycle patient)
                  </span>
                )}
              </label>
              {disablePatientSelection && formState.patientId ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {lockedPatientName}
                    </span>
                    {lockedPatientCode && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 font-mono">
                          {lockedPatientCode}
                        </span>
                      </>
                    )}
                    <span className="ml-auto text-xs text-gray-500">
                      (Locked)
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search by name, code, or email..."
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                  />
                  <select
                    value={formState.patientId}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        patientId: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.fullName || patient.patientCode || patient.id}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment date
                </label>
                <Input
                  type="date"
                  value={formState.appointmentDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      appointmentDate: event.target.value,
                      slotId: "", // Reset slot when date changes
                      startTime: "", // Reset start time when date changes
                      endTime: "", // Reset end time when date changes
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment type
                </label>
                <select
                  value={formState.type}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      type: event.target.value as AppointmentType,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {APPOINTMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start time
                </label>
                <Input
                  type="time"
                  value={formState.startTime}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      startTime: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End time
                </label>
                <Input
                  type="time"
                  value={formState.endTime}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      endTime: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {isWeekend ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p className="font-medium">Weekend - No slots available</p>
                <p>Appointments are only available Monday through Friday.</p>
              </div>
            ) : isLoadingSlots ? (
              <p className="text-xs text-gray-500">
                Loading available slots for the selected date...
              </p>
            ) : slotsWithStatus.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Available time slots ({availableSlots.length} of{" "}
                  {slotsWithStatus.length} available)
                </label>
                <select
                  value={formState.slotId}
                  onChange={(event) => handleSlotSelect(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a slot</option>
                  {slotsWithStatus.map((slot) => {
                    // Extract time display
                    const getTimeDisplay = (timeStr?: string) => {
                      if (!timeStr) return "N/A";
                      if (timeStr.includes("T")) {
                        const date = new Date(timeStr);
                        return date.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        });
                      }
                      // Handle time format like "08:00:00"
                      const time = timeStr.slice(0, 5); // Get HH:mm
                      const [hours, minutes] = time.split(":");
                      const hour24 = parseInt(hours, 10);
                      const ampm = hour24 >= 12 ? "PM" : "AM";
                      const hour12 = hour24 % 12 || 12;
                      return `${hour12}:${minutes} ${ampm}`;
                    };
                    return (
                      <option
                        key={slot.id}
                        value={slot.id}
                        disabled={slot.isBooked}
                      >
                        {getTimeDisplay(slot.startTime)} -{" "}
                        {getTimeDisplay(slot.endTime)}
                        {slot.isBooked ? " (Booked)" : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500">
                  {slotsWithStatus.length - availableSlots.length > 0
                    ? `${slotsWithStatus.length - availableSlots.length} slot(s) already booked.`
                    : "All 4 slots are available for this date."}
                </p>
              </div>
            ) : formState.appointmentDate ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <p className="font-medium">No slots available</p>
                <p>
                  All slots for this date are already booked. Please select
                  another date.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doctor & service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Assigned doctor
              </label>
              <Input
                value={
                  displayDoctorName
                    ? `${displayDoctorName} - ${getLast4Chars(doctorId)}`
                    : getLast4Chars(doctorId)
                }
                readOnly
              />
              <p className="text-xs text-gray-500">
                Appointments you create are automatically assigned to you.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Service package
              </label>
              <select
                value={formState.serviceId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    serviceId: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No service selected</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name ||
                      service.serviceName ||
                      service.serviceCode ||
                      `Service ${service.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Preparation notes
              </label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional instructions sent with reminders."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
