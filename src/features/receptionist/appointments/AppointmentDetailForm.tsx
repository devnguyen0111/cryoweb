import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
  DoctorSchedule,
  TimeSlot,
} from "@/api/types";
import {
  APPOINTMENT_STATUS_LABELS,
  normalizeAppointmentStatus,
  ensureAppointmentStatus,
} from "@/utils/appointments";

const STATUS_SEQUENCE: AppointmentStatus[] = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] =
  STATUS_SEQUENCE.map((status) => ({
    value: status,
    label: APPOINTMENT_STATUS_LABELS[status],
  }));

export interface AppointmentDetailFormProps {
  appointmentId: string;
  layout?: "page" | "modal";
  onClose?: () => void;
  onOpenPatientProfile?: (patientId: string) => void;
  initialAppointment?: Appointment | null;
}

const defaultFormState = {
  title: "",
  description: "",
  appointmentDate: "",
  startTime: "",
  endTime: "",
  type: "consultation",
  checkInTime: "",
  checkOutTime: "",
};

const getDateInputValue = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("T")) {
    return value.split("T")[0] || "";
  }
  return value.slice(0, 10);
};

const getTimeInputValue = (value?: string | null) => {
  if (!value) return "";
  if (value.includes("T")) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(11, 16);
    }
    const parts = value.split("T")[1];
    if (parts) {
      return parts.slice(0, 5);
    }
  }
  return value.slice(0, 5);
};

const formatDateTimeDisplay = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString();
  }
  return value;
};

export function AppointmentDetailForm({
  appointmentId,
  layout = "page",
  onClose,
  onOpenPatientProfile,
  initialAppointment,
}: AppointmentDetailFormProps) {
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState(defaultFormState);
  const [status, setStatus] = useState<AppointmentStatus>("Pending");
  const [cancelReason, setCancelReason] = useState("");

  const { data: appointmentResponse, isLoading } = useQuery({
    queryKey: ["receptionist", "appointments", "detail", appointmentId],
    queryFn: async () => {
      try {
        const detail =
          await api.appointment.getAppointmentDetails(appointmentId);
        return detail.data;
      } catch (error) {
        throw error;
      }
    },
  });

  const appointment = useMemo(() => {
    if (!appointmentResponse && !initialAppointment) {
      return null;
    }
    if (!appointmentResponse) {
      return (initialAppointment ?? null) as Appointment | null;
    }
    if (!initialAppointment) {
      // Convert AppointmentExtendedDetailResponse to Appointment format
      const extended = appointmentResponse as any;
      return {
        ...extended,
        appointmentCode: extended.appointmentCode || extended.id,
        appointmentType: extended.type || extended.appointmentType,
      } as Appointment;
    }
    const merged: Record<string, any> = { ...(initialAppointment as any) };
    Object.entries(appointmentResponse as Record<string, any>).forEach(
      ([key, value]) => {
        if (value !== undefined && value !== null) {
          merged[key] = value;
        }
      }
    );
    return merged as Appointment;
  }, [appointmentResponse, initialAppointment]);
  const isDetailsLoading =
    isLoading && !appointmentResponse && !initialAppointment;
  const derivedPatientId = useMemo(() => {
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    return (
      appointment.patientId ??
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
  }, [appointment]);
  const derivedDoctorIds = useMemo(() => {
    if (!appointment) return [];
    const raw = appointment as unknown as Record<string, any>;
    const source =
      (appointment as unknown as Record<string, any>)?.doctorIds ??
      raw.DoctorIds ??
      raw.doctorIDs ??
      raw.DoctorIDs ??
      raw.doctors?.map((item: any) => item?.doctorId ?? item?.id) ??
      raw.doctorAssignments?.map(
        (item: any) => item?.doctorId ?? item?.doctor?.id
      ) ??
      [];
    return Array.isArray(source) ? source.filter(Boolean) : [];
  }, [appointment]);
  const derivedDoctorId = useMemo(() => {
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    // Appointment doesn't have doctorId directly, check doctors array
    return (
      raw.doctorID ??
      raw.DoctorId ??
      raw.DoctorID ??
      raw.doctor?.id ??
      raw.doctor?.doctorId ??
      raw.doctor?.accountId ??
      raw.doctorAccountId ??
      raw.doctorAccountID ??
      derivedDoctorIds[0] ??
      null
    );
  }, [appointment, derivedDoctorIds]);
  const derivedSlotId = useMemo(() => {
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    return (
      appointment.slotId ??
      raw.slotID ??
      raw.SlotId ??
      raw.SlotID ??
      raw.slot?.id ??
      null
    );
  }, [appointment]);
  const derivedCheckInTime = useMemo(() => {
    if (!appointment) return "";
    const raw = appointment as unknown as Record<string, any>;
    // Check-in/out times are not stored in Appointment, they're managed via API calls
    return (
      raw.checkinTime ??
      raw.CheckInTime ??
      raw.checkIn ??
      raw.check_in_time ??
      ""
    );
  }, [appointment]);
  const derivedCheckOutTime = useMemo(() => {
    if (!appointment) return "";
    const raw = appointment as unknown as Record<string, any>;
    // Check-in/out times are not stored in Appointment, they're managed via API calls
    return (
      raw.checkoutTime ??
      raw.CheckOutTime ??
      raw.checkOut ??
      raw.check_out_time ??
      ""
    );
  }, [appointment]);

  const {
    data: slotDetail,
    isLoading: slotLoading,
    isFetching: slotFetching,
  } = useQuery<TimeSlot | null>({
    queryKey: [
      "receptionist",
      "slots",
      "detail",
      derivedSlotId ?? "unknown-slot",
    ],
    enabled: Boolean(derivedSlotId),
    retry: false,
    queryFn: async () => {
      if (!derivedSlotId) return null;
      try {
        const response = await api.slot.getSlotById(derivedSlotId);
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
  const slotScheduleId = useMemo(() => {
    if (!slotDetail) return null;
    const raw = slotDetail as unknown as Record<string, any>;
    return (
      slotDetail.doctorScheduleId ??
      raw.doctorScheduleID ??
      raw.scheduleId ??
      raw.ScheduleId ??
      raw.schedule?.id ??
      null
    );
  }, [slotDetail]);

  const {
    data: scheduleDetail,
    isLoading: scheduleLoading,
    isFetching: scheduleFetching,
  } = useQuery<DoctorSchedule | null>({
    queryKey: [
      "receptionist",
      "doctor-schedule",
      "detail",
      slotScheduleId ?? "unknown-schedule",
    ],
    enabled: Boolean(slotScheduleId),
    retry: false,
    queryFn: async () => {
      if (!slotScheduleId) return null;
      try {
        const response =
          await api.doctorSchedule.getDoctorScheduleById(slotScheduleId);
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });
  const recommendedDoctorId = useMemo(() => {
    if (scheduleDetail?.doctorId) {
      return scheduleDetail.doctorId;
    }
    const raw = scheduleDetail as unknown as Record<string, any> | null;
    if (!raw) return null;
    return (
      raw.doctorID ??
      raw.DoctorId ??
      raw.DoctorID ??
      raw.doctor?.id ??
      raw.doctor?.doctorId ??
      raw.doctor?.accountId ??
      null
    );
  }, [scheduleDetail]);
  useEffect(() => {
    if (!appointment) return;
    const normalizedDate = getDateInputValue(appointment.appointmentDate);
    // Extract time from appointmentDate (ISO datetime)
    const normalizedStartTime = getTimeInputValue(appointment.appointmentDate);
    // End time not available in Appointment type, derive from slot if available
    const normalizedEndTime = "";

    setFormState({
      title: "",
      description: appointment.notes || "",
      appointmentDate: normalizedDate,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      type: appointment.appointmentType || "Consultation",
      checkInTime: derivedCheckInTime || "",
      checkOutTime: derivedCheckOutTime || "",
    });
    const normalizedStatus =
      normalizeAppointmentStatus(
        (appointment.status as string | undefined) ?? undefined
      ) ?? "Pending";
    setStatus(normalizedStatus);
  }, [
    appointment?.id,
    appointment?.appointmentDate,
    appointment?.appointmentType,
    appointment?.status,
    appointment?.notes,
    derivedCheckInTime,
    derivedCheckOutTime,
  ]);

  const { data: patient } = useQuery({
    queryKey: ["receptionist", "patient", { patientId: derivedPatientId }],
    enabled: Boolean(derivedPatientId),
    queryFn: async () => {
      if (!derivedPatientId) return null;
      try {
        const response = await api.patient.getPatientDetails(derivedPatientId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallback = await api.patient.getPatientById(derivedPatientId);
          return fallback.data;
        }
        throw error;
      }
    },
  });

  const { data: doctor } = useQuery({
    queryKey: ["receptionist", "doctor", { doctorId: derivedDoctorId }],
    enabled: Boolean(derivedDoctorId),
    queryFn: async () => {
      if (!derivedDoctorId) return null;
      const response = await api.doctor.getDoctorById(derivedDoctorId);
      return response.data;
    },
  });
  const { data: doctorList } = useQuery({
    queryKey: ["receptionist", "doctor-lookup"],
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
  const doctorMap = useMemo(() => {
    const map = new Map<string, Doctor>();
    (doctorList as Doctor[] | undefined)?.forEach((item) => {
      if (item?.id) {
        map.set(item.id, item);
      }
      if (item?.accountId) {
        map.set(item.accountId, item);
      }
    });
    return map;
  }, [doctorList]);
  const recommendedDoctor = useMemo(() => {
    if (!recommendedDoctorId) return null;
    return (
      doctorMap.get(recommendedDoctorId) ??
      doctorList?.find((item) => item.id === recommendedDoctorId) ??
      null
    );
  }, [recommendedDoctorId, doctorMap, doctorList]);
  // Slot doesn't have patientId in the type, check from appointment instead
  const slotPatientId = derivedPatientId;
  const isPatientSelfBooking = useMemo(() => {
    const raw = appointment as unknown as Record<string, any> | null;
    const createdByRole =
      raw?.createdByRole ??
      raw?.CreatedByRole ??
      raw?.createdBy?.role ??
      raw?.CreatedBy?.Role ??
      null;
    const bookingChannel =
      raw?.bookingChannel ??
      raw?.BookingChannel ??
      raw?.source ??
      raw?.Source ??
      null;
    const createdByPatient =
      typeof createdByRole === "string" &&
      createdByRole.toLowerCase().includes("patient");
    const viaPatientChannel =
      typeof bookingChannel === "string" &&
      bookingChannel.toLowerCase().includes("patient");
    const slotOwnedByPatient =
      Boolean(derivedPatientId) &&
      Boolean(slotPatientId) &&
      slotPatientId === derivedPatientId;
    return createdByPatient || viaPatientChannel || slotOwnedByPatient;
  }, [appointment, derivedPatientId, slotPatientId]);
  const [selectedDoctorForAssignment, setSelectedDoctorForAssignment] =
    useState<string>("");
  useEffect(() => {
    if (recommendedDoctorId) {
      setSelectedDoctorForAssignment(recommendedDoctorId);
      return;
    }
    if (derivedDoctorId) {
      setSelectedDoctorForAssignment(derivedDoctorId);
      return;
    }
    setSelectedDoctorForAssignment("");
  }, [recommendedDoctorId, derivedDoctorId]);
  const doctorSelectOptions = useMemo(() => {
    const list = doctorList ?? [];
    if (!list.length) return [];
    return list
      .map((item) => ({
        id: item.id ?? item.accountId ?? "",
        label: item.fullName || item.email || item.id || item.accountId || "",
      }))
      .filter((option) => option.id);
  }, [doctorList]);
  const doctorDisplayName = useMemo(() => {
    if (!appointment) return "Unassigned";
    const raw = appointment as unknown as Record<string, any>;
    const primaryDoctor =
      (derivedDoctorId && doctorMap.get(derivedDoctorId)) ||
      (doctor &&
        (doctorMap.get(doctor.id ?? "") ||
          (doctor.accountId ? doctorMap.get(doctor.accountId) : null)));
    return (
      primaryDoctor?.fullName ||
      doctor?.fullName ||
      raw.doctor?.fullName ||
      raw.doctor?.name ||
      raw.doctorAssignments?.[0]?.doctor?.fullName ||
      raw.doctorAssignments?.[0]?.doctorName ||
      raw.doctorName ||
      raw.doctorFullName ||
      raw.doctor?.accountInfo?.username ||
      derivedDoctorId ||
      "Unassigned"
    );
  }, [appointment, doctor, derivedDoctorId]);
  const doctorEmail = useMemo(() => {
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    const primaryDoctor =
      (derivedDoctorId && doctorMap.get(derivedDoctorId)) ||
      (doctor &&
        (doctorMap.get(doctor.id ?? "") ||
          (doctor.accountId ? doctorMap.get(doctor.accountId) : null)));
    return (
      primaryDoctor?.email ||
      doctor?.email ||
      raw.doctor?.email ||
      raw.doctorEmail ||
      raw.doctorAssignments?.[0]?.doctor?.email ||
      raw.doctor?.accountInfo?.email ||
      null
    );
  }, [appointment, doctor]);
  const doctorPhone = useMemo(() => {
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    const primaryDoctor =
      (derivedDoctorId && doctorMap.get(derivedDoctorId)) ||
      (doctor &&
        (doctorMap.get(doctor.id ?? "") ||
          (doctor.accountId ? doctorMap.get(doctor.accountId) : null)));
    return (
      primaryDoctor?.phoneNumber ||
      doctor?.phoneNumber ||
      raw.doctor?.phoneNumber ||
      raw.doctor?.phone ||
      raw.doctorPhone ||
      raw.doctorAssignments?.[0]?.doctor?.phoneNumber ||
      raw.doctorAssignments?.[0]?.doctor?.phone ||
      raw.doctor?.accountInfo?.phone ||
      null
    );
  }, [appointment, doctor, derivedDoctorId, doctorMap]);
  const doctorRole = useMemo(() => {
    const raw = appointment as unknown as Record<string, any>;
    const roles =
      raw?.doctorRoles ??
      raw?.DoctorRoles ??
      raw?.doctorAssignments?.map((item: any) => item?.role) ??
      [];
    return Array.isArray(roles) ? (roles.filter(Boolean)[0] ?? null) : null;
  }, [appointment]);
  const additionalDoctorSummaries = useMemo(() => {
    if (!appointment) return [];
    const raw = appointment as unknown as Record<string, any>;
    const assignments: any[] = Array.isArray(raw?.doctorAssignments)
      ? raw.doctorAssignments
      : [];
    if (!assignments.length) {
      const ids = derivedDoctorIds.filter((id) => id && id !== derivedDoctorId);
      return ids.map((id) => `Doctor ID: ${id}`);
    }
    return assignments
      .filter((item) => {
        const id =
          item?.doctorId ??
          item?.doctor?.id ??
          item?.doctor?.doctorId ??
          item?.doctor?.accountId;
        return id && id !== derivedDoctorId;
      })
      .map((item) => {
        const id =
          item?.doctorId ??
          item?.doctor?.id ??
          item?.doctor?.doctorId ??
          item?.doctor?.accountId;
        const lookupDoctor = id ? doctorMap.get(id) : undefined;
        const name =
          lookupDoctor?.fullName ||
          item?.doctor?.fullName ||
          item?.doctorName ||
          item?.doctor?.accountInfo?.username ||
          id;
        const role = item?.role;
        if (name && role) {
          return `${name} (${role})`;
        }
        return name || "Unknown doctor";
      });
  }, [appointment, derivedDoctorIds, derivedDoctorId, doctorMap]);
  const patientDisplayName = useMemo(() => {
    const rawPatient = patient as unknown as Record<string, any> | undefined;
    const rawAppointment = appointment as unknown as
      | Record<string, any>
      | undefined;
    return (
      rawPatient?.accountInfo?.fullName ??
      rawPatient?.fullName ??
      rawPatient?.accountInfo?.username ??
      rawPatient?.patientCode ??
      rawPatient?.id ??
      rawAppointment?.patient?.fullName ??
      rawAppointment?.patient?.name ??
      rawAppointment?.patientName ??
      rawAppointment?.patientFullName ??
      rawAppointment?.patient?.accountInfo?.username ??
      derivedPatientId ??
      "Unassigned"
    );
  }, [patient, appointment, derivedPatientId]);

  const updateAppointmentMutation = useMutation({
    mutationFn: () => {
      // UpdateAppointmentRequest only allows: slotId, appointmentType, notes
      return api.appointment.updateAppointment(appointmentId, {
        appointmentType: formState.type as any,
        notes: formState.description || undefined,
        // Note: appointmentDate and times are managed via slotId
      });
    },
    onSuccess: () => {
      toast.success("Appointment updated");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update appointment. Please try again.";
      toast.error(message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (nextStatus: AppointmentStatus | string) =>
      api.appointment.updateAppointmentStatus(appointmentId, {
        status: ensureAppointmentStatus(nextStatus),
      }),
    onSuccess: () => {
      toast.success("Appointment status updated");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update status. Please try again.";
      toast.error(message);
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: () =>
      api.appointment.cancelAppointment(appointmentId, {
        cancellationReason: cancelReason || undefined,
      }),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      setCancelReason("");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to cancel appointment. Please try again.";
      toast.error(message);
    },
  });

  const updateCheckInMutation = useMutation({
    mutationFn: async (value: string | null) => {
      if (value) {
        await api.appointment.checkIn(appointmentId);
        // Return appointment data for consistency
        const response =
          await api.appointment.getAppointmentById(appointmentId);
        return response.data!;
      } else {
        // No API to clear check-in, so we'll just update notes
        const response = await api.appointment.updateAppointment(
          appointmentId,
          {
            notes: appointment?.notes || undefined,
          }
        );
        return response.data!;
      }
    },
    onSuccess: (_, value) => {
      toast.success(value ? "Patient checked in." : "Check-in time cleared.");
      setFormState((prev) => ({
        ...prev,
        checkInTime: value ?? "",
      }));
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update check-in time. Please try again.";
      toast.error(message);
    },
  });

  const updateCheckOutMutation = useMutation({
    mutationFn: async (value: string | null) => {
      if (value) {
        await api.appointment.checkOut(appointmentId);
        // Return appointment data for consistency
        const response =
          await api.appointment.getAppointmentById(appointmentId);
        return response.data!;
      } else {
        // No API to clear check-out, so we'll just update notes
        const response = await api.appointment.updateAppointment(
          appointmentId,
          {
            notes: appointment?.notes || undefined,
          }
        );
        return response.data!;
      }
    },
    onSuccess: (_, value) => {
      toast.success(value ? "Patient checked out." : "Check-out time cleared.");
      setFormState((prev) => ({
        ...prev,
        checkOutTime: value ?? "",
      }));
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to update check-out time. Please try again.";
      toast.error(message);
    },
  });

  const assignDoctorMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      if (!doctorId) {
        throw new Error("Missing doctor identifier.");
      }

      const swallowDuplicateAssignmentError = (error: unknown) => {
        if (isAxiosError(error)) {
          const status = error.response?.status ?? 0;
          const rawMessage = (error.response?.data as any)?.message;
          const message =
            typeof rawMessage === "string" ? rawMessage.toLowerCase() : "";
          if (
            status === 409 ||
            status === 208 ||
            message.includes("already") ||
            message.includes("exists") ||
            message.includes("duplicate")
          ) {
            return;
          }
        }
        throw error;
      };

      // Update appointment with slotId if available
      if (derivedSlotId) {
        try {
          await api.appointment.updateAppointment(appointmentId, {
            slotId: derivedSlotId,
          });
        } catch (error) {
          swallowDuplicateAssignmentError(error);
        }
      }

      // Assign doctor via appointmentDoctor API
      try {
        await api.appointmentDoctor.createAssignment({
          appointmentId,
          doctorId,
          role: "Primary",
        });
      } catch (error) {
        swallowDuplicateAssignmentError(error);
      }

      return doctorId;
    },
    onSuccess: (doctorId) => {
      const doctorName =
        doctorMap.get(doctorId)?.fullName ??
        doctorList?.find((item) => item.id === doctorId)?.fullName ??
        "Doctor";
      toast.success(`${doctorName} assigned to appointment.`);
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", "detail", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointment-doctors", appointmentId],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to assign doctor from schedule. Please try again.";
      toast.error(message);
    },
  });

  const statusLabel = useMemo(
    () => STATUS_OPTIONS.find((item) => item.value === status)?.label || status,
    [status]
  );

  const handleSubmit = () => {
    updateAppointmentMutation.mutate();
  };

  const handleStatusChange = (nextStatus: AppointmentStatus) => {
    const normalized = ensureAppointmentStatus(nextStatus);
    setStatus(normalized);
    updateStatusMutation.mutate(normalized);
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }
    cancelAppointmentMutation.mutate();
  };

  return (
    <div
      className={
        layout === "modal" ? "space-y-6 overflow-y-auto pr-1" : "space-y-6"
      }
      style={layout === "modal" ? { maxHeight: "70vh" } : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scheduling details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            {isDetailsLoading ? (
              <p>Loading appointment...</p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <Input
                    value={formState.title}
                    placeholder="Short summary"
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Description / notes
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
                  />
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
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={formState.type}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          type: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="procedure">Procedure</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="testing">Testing</option>
                      <option value="other">Other</option>
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(event) =>
                      handleStatusChange(
                        event.target.value as AppointmentStatus
                      )
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm capitalize focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button
              onClick={handleSubmit}
              disabled={updateAppointmentMutation.isPending}
            >
              Save changes
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                appointment &&
                setFormState({
                  title: "",
                  description: appointment.notes || "",
                  appointmentDate: getDateInputValue(
                    appointment.appointmentDate
                  ),
                  startTime: getTimeInputValue(appointment.appointmentDate),
                  endTime: "",
                  type: appointment.appointmentType || "Consultation",
                  checkInTime: derivedCheckInTime || "",
                  checkOutTime: derivedCheckOutTime || "",
                })
              }
            >
              Reset form
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (derivedPatientId) {
                  onOpenPatientProfile?.(derivedPatientId);
                }
              }}
              disabled={!derivedPatientId}
            >
              Open patient profile
            </Button>
            {layout === "modal" ? (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-medium text-gray-900">Patient:</span>{" "}
                {patientDisplayName}
              </div>
              <div>
                <span className="font-medium text-gray-900">Doctor:</span>{" "}
                {doctorDisplayName}
                {doctorRole ? (
                  <span className="ml-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                    {doctorRole}
                  </span>
                ) : null}
                {doctorEmail ? (
                  <div className="text-xs text-gray-500">
                    Email: {doctorEmail}
                  </div>
                ) : null}
                {doctorPhone ? (
                  <div className="text-xs text-gray-500">
                    Phone: {doctorPhone}
                  </div>
                ) : null}
                {additionalDoctorSummaries.length ? (
                  <div className="text-xs text-gray-500">
                    Additional doctors: {additionalDoctorSummaries.join(", ")}
                  </div>
                ) : null}
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  Current status:
                </span>{" "}
                {statusLabel}
              </div>
              {derivedSlotId ? (
                <div className="mt-3 space-y-3 rounded-md border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-800">
                  <p className="text-xs font-medium">
                    {isPatientSelfBooking
                      ? "Patient self-booked this visit. Confirm or override the doctor assignment below before finalizing."
                      : "This appointment is linked to a patient slot. Assign the appropriate doctor for this schedule below."}
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      value={selectedDoctorForAssignment}
                      onChange={(event) =>
                        setSelectedDoctorForAssignment(event.target.value)
                      }
                      className="w-full rounded-md border border-blue-200 px-3 py-2 text-xs text-blue-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
                    >
                      <option value="">
                        {doctorSelectOptions.length
                          ? "Select doctor"
                          : "Loading doctors..."}
                      </option>
                      {doctorSelectOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                          {recommendedDoctorId === option.id
                            ? " (recommended)"
                            : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        !selectedDoctorForAssignment ||
                        assignDoctorMutation.isPending
                      }
                      onClick={() =>
                        selectedDoctorForAssignment &&
                        assignDoctorMutation.mutate(selectedDoctorForAssignment)
                      }
                    >
                      {assignDoctorMutation.isPending
                        ? "Assigning..."
                        : "Assign doctor"}
                    </Button>
                  </div>
                  {recommendedDoctor ? (
                    <p className="text-[11px] text-blue-700">
                      Recommended doctor:{" "}
                      <span className="font-semibold">
                        {recommendedDoctor.fullName}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {derivedSlotId ? (
            <Card>
              <CardHeader>
                <CardTitle>Patient-selected slot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {slotLoading || slotFetching ? (
                  <p className="text-xs text-gray-500">
                    Loading slot information...
                  </p>
                ) : slotDetail ? (
                  <>
                    {isPatientSelfBooking ? (
                      <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                        This appointment was self-booked by the patient. Please
                        align the assigned doctor with the captured schedule and
                        slot before confirming.
                      </div>
                    ) : null}
                    <div>
                      <span className="font-medium text-gray-900">
                        Slot ID:
                      </span>{" "}
                      {slotDetail.id}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Time:</span>{" "}
                      {slotDetail.startTime
                        ? new Date(slotDetail.startTime).toLocaleString()
                        : "??"}{" "}
                      →{" "}
                      {slotDetail.endTime
                        ? new Date(slotDetail.endTime).toLocaleString()
                        : "??"}
                    </div>
                    {typeof slotDetail.isBooked === "boolean" ? (
                      <div>
                        <span className="font-medium text-gray-900">
                          Is booked:
                        </span>{" "}
                        {slotDetail.isBooked ? "Yes" : "No"}
                      </div>
                    ) : null}
                    {derivedPatientId ? (
                      <div>
                        <span className="font-medium text-gray-900">
                          Patient:
                        </span>{" "}
                        {derivedPatientId}
                      </div>
                    ) : null}
                    <div>
                      <span className="font-medium text-gray-900">
                        Schedule reference:
                      </span>{" "}
                      {slotScheduleId ?? "Unlinked"}
                    </div>
                    {scheduleLoading || scheduleFetching ? (
                      <p className="text-xs text-gray-500">
                        Loading linked doctor schedule...
                      </p>
                    ) : scheduleDetail ? (
                      <>
                        <div>
                          <span className="font-medium text-gray-900">
                            Schedule window:
                          </span>{" "}
                          {`${scheduleDetail.startTime ?? "??"} → ${
                            scheduleDetail.endTime ?? "??"
                          }`}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            Work date:
                          </span>{" "}
                          {scheduleDetail.workDate
                            ? new Date(
                                scheduleDetail.workDate
                              ).toLocaleDateString()
                            : "Not provided"}
                        </div>
                        {scheduleDetail.notes ? (
                          <div className="text-xs text-gray-500">
                            Notes: {scheduleDetail.notes}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">
                        No doctor schedule linked to this slot yet.
                      </p>
                    )}
                    {recommendedDoctorId ? (
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-900">
                            Recommended doctor:
                          </span>{" "}
                          {recommendedDoctor?.fullName || recommendedDoctorId}
                        </div>
                        {!derivedDoctorId ||
                        derivedDoctorId !== recommendedDoctorId ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              assignDoctorMutation.mutate(recommendedDoctorId)
                            }
                            disabled={assignDoctorMutation.isPending}
                          >
                            Assign recommended doctor
                          </Button>
                        ) : (
                          <p className="text-xs text-green-600">
                            Recommended doctor already assigned.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Unable to determine a doctor from the linked schedule.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-red-600">
                    Slot data could not be loaded. Please verify the booking.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Check-in time
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    readOnly
                    value={formatDateTimeDisplay(formState.checkInTime)}
                    placeholder="Not recorded"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        updateCheckInMutation.mutate(new Date().toISOString())
                      }
                      disabled={updateCheckInMutation.isPending}
                    >
                      Check-in now
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updateCheckInMutation.mutate(null)}
                      disabled={
                        updateCheckInMutation.isPending ||
                        !formState.checkInTime
                      }
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Check-out time
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    readOnly
                    value={formatDateTimeDisplay(formState.checkOutTime)}
                    placeholder="Not recorded"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        updateCheckOutMutation.mutate(new Date().toISOString())
                      }
                      disabled={updateCheckOutMutation.isPending}
                    >
                      Check-out now
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => updateCheckOutMutation.mutate(null)}
                      disabled={
                        updateCheckOutMutation.isPending ||
                        !formState.checkOutTime
                      }
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p className="text-gray-600">
                Set status to <strong>Cancelled</strong> with an optional reason
                to notify the patient and doctor.
              </p>
              <textarea
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={3}
                placeholder="Reason for cancellation (required)"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelAppointmentMutation.isPending}
              >
                Cancel appointment
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
