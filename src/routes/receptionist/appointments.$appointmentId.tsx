import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import type { AppointmentStatus } from "@/api/types";

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No-show" },
];

export const Route = createFileRoute(
  "/receptionist/appointments/$appointmentId"
)({
  component: ReceptionistAppointmentDetailRoute,
});

function ReceptionistAppointmentDetailRoute() {
  const { appointmentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    title: "",
    description: "",
    appointmentDate: "",
    startTime: "",
    endTime: "",
    type: "consultation",
  });
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [cancelReason, setCancelReason] = useState("");

  const { data: appointmentResponse, isLoading } = useQuery({
    queryKey: ["receptionist", "appointments", { appointmentId }],
    queryFn: async () => {
      const response = await api.appointment.getAppointmentById(appointmentId);
      return response.data;
    },
  });

  const appointment = appointmentResponse;

  useEffect(() => {
    if (!appointment) return;
    setFormState({
      title: appointment.title || "",
      description: appointment.description || "",
      appointmentDate: appointment.appointmentDate || "",
      startTime: appointment.startTime || "",
      endTime: appointment.endTime || "",
      type: (appointment.type as string) || "consultation",
    });
    setStatus((appointment.status as AppointmentStatus) || "scheduled");
  }, [appointment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAppointmentMutation = useMutation({
    mutationFn: () =>
      api.appointment.updateAppointment(appointmentId, {
        title: formState.title || undefined,
        description: formState.description || undefined,
        appointmentDate: formState.appointmentDate || undefined,
        startTime: formState.startTime || undefined,
        endTime: formState.endTime || undefined,
        type: formState.type as any,
      }),
    onSuccess: () => {
      toast.success("Appointment updated");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", { appointmentId }],
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
    mutationFn: (nextStatus: AppointmentStatus) =>
      api.appointment.updateAppointmentStatus(appointmentId, nextStatus),
    onSuccess: () => {
      toast.success("Appointment status updated");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", { appointmentId }],
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
      api.appointment.cancelAppointment(
        appointmentId,
        cancelReason || undefined
      ),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      setCancelReason("");
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["receptionist", "appointments", { appointmentId }],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to cancel appointment. Please try again.";
      toast.error(message);
    },
  });

  const patientId = appointment?.patientId;
  const doctorId = appointment?.doctorId;

  const { data: patient } = useQuery({
    queryKey: ["receptionist", "patient", { patientId }],
    enabled: Boolean(patientId),
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallback = await api.patient.getPatientById(patientId);
          return fallback.data;
        }
        throw error;
      }
    },
  });

  const { data: doctor } = useQuery({
    queryKey: ["receptionist", "doctor", { doctorId }],
    enabled: Boolean(doctorId),
    queryFn: async () => {
      if (!doctorId) return null;
      const response = await api.doctor.getDoctorById(doctorId);
      return response.data;
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
    setStatus(nextStatus);
    updateStatusMutation.mutate(nextStatus);
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }
    cancelAppointmentMutation.mutate();
  };

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Appointment detail</h1>
              <p className="text-gray-600">
                Appointment ID:{" "}
                <span className="font-medium">{appointmentId}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/receptionist/appointments",
                  })
                }
              >
                Back to list
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Dashboard
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scheduling details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                {isLoading ? (
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
                      title: appointment.title || "",
                      description: appointment.description || "",
                      appointmentDate: appointment.appointmentDate || "",
                      startTime: appointment.startTime || "",
                      endTime: appointment.endTime || "",
                      type: (appointment.type as string) || "consultation",
                    })
                  }
                >
                  Reset form
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (appointment?.patientId) {
                      navigate({
                        to: "/receptionist/patients/$patientId",
                        params: { patientId: appointment.patientId },
                      });
                    }
                  }}
                  disabled={!appointment?.patientId}
                >
                  Open patient profile
                </Button>
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
                    {patient
                      ? patient.accountInfo?.username ||
                        patient.patientCode ||
                        patient.id
                      : appointment?.patientId || "Unassigned"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Doctor:</span>{" "}
                    {doctor?.fullName || appointment?.doctorId || "Unassigned"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Current status:
                    </span>{" "}
                    {statusLabel}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cancellation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <p className="text-gray-600">
                    Set status to <strong>Cancelled</strong> with an optional
                    reason to notify the patient and doctor.
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}
