import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api/client";
import type {
  AppointmentStatus,
  AppointmentType,
  CreateAppointmentRequest,
} from "@/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreateAppointmentFormProps {
  layout?: "page" | "modal";
  defaultPatientId?: string;
  defaultServiceRequestId?: string;
  defaultServiceId?: string;
  onClose?: () => void;
  onCreated?: (appointmentId: string) => void;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: "Consultation", label: "Consultation" },
  { value: "Ultrasound", label: "Ultrasound scan" },
  { value: "BloodTest", label: "Blood test" },
  { value: "OPU", label: "OPU (Oocyte Pick Up)" },
  { value: "ET", label: "ET (Embryo Transfer)" },
  { value: "IUI", label: "IUI" },
  { value: "FollowUp", label: "Follow-up visit" },
  { value: "Injection", label: "Injection" },
];

export function CreateAppointmentForm({
  layout = "modal",
  defaultPatientId,
  defaultServiceRequestId,
  defaultServiceId,
  onClose,
  onCreated,
}: CreateAppointmentFormProps) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState("");

  const initialFormState = useMemo(
    () => ({
      patientId: defaultPatientId ?? "",
      doctorId: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      title: "",
      description: "",
      type: "Consultation" as AppointmentType,
      serviceRequestId: defaultServiceRequestId ?? "",
      serviceId: defaultServiceId ?? "",
      slotId: "",
    }),
    [defaultPatientId, defaultServiceRequestId, defaultServiceId]
  );

  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    setFormState(initialFormState);
  }, [initialFormState]);

  const { data: patientsData } = useQuery({
    queryKey: [
      "receptionist",
      "patients",
      { SearchTerm: patientSearch.trim() || undefined },
    ],
    queryFn: () =>
      api.patient.getPatients({
        Page: 1,
        Size: 50,
        SearchTerm: patientSearch.trim() || undefined,
      }),
  });
  const patients = patientsData?.data ?? [];

  const { data: doctorsData } = useQuery({
    queryKey: ["receptionist", "doctors"],
    queryFn: () =>
      api.doctor.getDoctors({
        Page: 1,
        Size: 50,
        Status: "active",
      }),
  });
  const doctors = doctorsData?.data ?? [];

  const { data: servicesData } = useQuery({
    queryKey: ["receptionist", "services", { Size: 50 }],
    queryFn: () =>
      api.service.getServices({
        Page: 1,
        Size: 50,
      }),
  });
  const services = servicesData?.data ?? [];

  const { data: slotsData, isFetching: isLoadingSlots } = useQuery({
    queryKey: [
      "receptionist",
      "slots",
      {
        doctorId: formState.doctorId,
        date: formState.appointmentDate,
      },
    ],
    enabled: Boolean(formState.doctorId && formState.appointmentDate),
    queryFn: () =>
      api.slot.getSlots({
        DoctorId: formState.doctorId,
        Date: formState.appointmentDate,
      }),
  });
  const slots = slotsData?.data ?? [];

  const availableSlots = useMemo(() => {
    if (!slots.length) return [];
    return slots.filter(
      (slot) => slot.bookingStatus === "available" || slot.isBooked === false
    );
  }, [slots]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === formState.serviceId),
    [services, formState.serviceId]
  );

  const createAppointmentMutation = useMutation({
    mutationFn: async ({
      payload,
      serviceRequestId,
      appointmentDateOnly,
    }: {
      payload: CreateAppointmentRequest;
      serviceRequestId?: string;
      appointmentDateOnly?: string;
    }) => {
      const response = await api.appointment.createAppointment(payload);
      const created = response.data;

      if (created?.id && serviceRequestId) {
        await api.serviceRequest.updateServiceRequest(serviceRequestId, {
          status: "Confirmed",
          appointmentId: created.id,
          scheduledDate: appointmentDateOnly,
        });
      }

      return created;
    },
    onSuccess: (appointment) => {
      toast.success("Appointment created successfully");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "service-requests"],
      });
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
        console.error("Create appointment error", apiErrors);
      } else {
        const message = error?.response?.data?.message || defaultMessage;
        toast.error(message);
        console.error(
          "Create appointment error",
          error?.response?.data || error
        );
      }
    },
  });

  const handleSlotSelect = (slotId: string) => {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot) {
      setFormState((prev) => ({
        ...prev,
        slotId: "",
      }));
      return;
    }
    setFormState((prev) => ({
      ...prev,
      slotId,
      startTime: slot.startTime || prev.startTime,
      endTime: slot.endTime || prev.endTime,
    }));
  };

  const handleSubmit = () => {
    const trimmedTitle = formState.title.trim();
    const trimmedDescription = formState.description
      ? formState.description.trim()
      : "";

    if (!formState.patientId) {
      toast.error("Please select a patient.");
      return;
    }
    if (!trimmedTitle) {
      toast.error("Please enter an appointment title.");
      return;
    }
    if (!formState.appointmentDate) {
      toast.error("Please select an appointment date.");
      return;
    }
    if (!formState.startTime || !formState.endTime) {
      toast.error("Please choose a start and end time.");
      return;
    }

    const ensureSeconds = (time: string) => {
      if (!time) return "";
      return time.length === 8 ? time : `${time}:00`;
    };

    const startTimeValue = ensureSeconds(formState.startTime);
    const endTimeValue = ensureSeconds(formState.endTime);

    const appointmentDateValue = formState.appointmentDate
      ? `${formState.appointmentDate}T${startTimeValue || "00:00:00"}Z`
      : "";

    const payload: CreateAppointmentRequest = {
      request: {
        patientId: formState.patientId,
        type: formState.type,
        title: trimmedTitle,
        appointmentDate: appointmentDateValue,
        startTime: startTimeValue,
        endTime: endTimeValue,
        status: "Scheduled" as AppointmentStatus,
        reason: trimmedTitle,
      },
    };

    if (trimmedDescription) {
      payload.request.description = trimmedDescription;
      payload.request.instructions = trimmedDescription;
    }
    if (formState.slotId) {
      payload.request.slotId = formState.slotId;
    }
    if (selectedService) {
      payload.request.notes = `Service: ${selectedService.name ?? selectedService.id}`;
    }
    if (formState.doctorId) {
      payload.doctorIds = [formState.doctorId];
      payload.doctorRoles = ["Primary"];
    }

    createAppointmentMutation.mutate({
      payload,
      serviceRequestId: formState.serviceRequestId,
      appointmentDateOnly: formState.appointmentDate,
    });
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setPatientSearch("");
  };

  const headerDescription =
    layout === "page"
      ? "Convert a confirmed service request or schedule a visit directly."
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
              </label>
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
                    {patient.accountInfo?.username ||
                      patient.patientCode ||
                      patient.id}
                  </option>
                ))}
              </select>
              {defaultPatientId ? (
                <p className="text-xs text-gray-500">
                  Prefilled from related service request.
                </p>
              ) : null}
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

            {availableSlots.length ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Suggested slots
                </label>
                <select
                  value={formState.slotId}
                  onChange={(event) => handleSlotSelect(event.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a doctor slot</option>
                  {availableSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Slots are filtered by doctor availability on the selected
                  date.
                </p>
              </div>
            ) : isLoadingSlots ? (
              <p className="text-xs text-gray-500">
                Loading available slots for the selected doctor and date...
              </p>
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
              <select
                value={formState.doctorId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    doctorId: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select doctor (optional)</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName || doctor.email || doctor.id}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Leaving this blank keeps the appointment unassigned until the
                doctor confirms.
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
                    {service.name || `Service ${service.id}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Optional – leave blank if this appointment is not tied to a
                package.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Appointment title
              </label>
              <Input
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="E.g. Initial IVF consultation"
              />
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
