import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StructuredNote } from "@/components/StructuredNote";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import {
  APPOINTMENT_STATUS_LABELS,
  normalizeAppointmentStatus,
  ensureAppointmentStatus,
} from "@/utils/appointments";
import type { AppointmentStatus } from "@/api/types";
import { getAppointmentStatusBadgeClass } from "@/utils/status-colors";
import { getFullNameFromObject } from "@/utils/name-helpers";

export const Route = createFileRoute("/doctor/appointments/$appointmentId")({
  component: DoctorAppointmentDetailsComponent,
});

function DoctorAppointmentDetailsComponent() {
  const { appointmentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: appointment, isFetching } = useQuery({
    queryKey: ["doctor", "appointments", "detail", appointmentId],
    queryFn: async () => {
      const response =
        await api.appointment.getAppointmentDetails(appointmentId);
      return response.data;
    },
  });

  const patientId = useMemo(() => {
    if (!appointment) return null;
    const raw = appointment as unknown as Record<string, any>;
    return (
      appointment.patientId ??
      raw.patientID ??
      raw.PatientId ??
      raw.PatientID ??
      raw.patient?.id ??
      null
    );
  }, [appointment]);

  const { data: patient } = useQuery({
    queryKey: ["doctor", "patient", patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      if (!patientId) return null;
      // usePatientDetails hook handles the fallback logic
      // But we need the query structure here, so we use the same pattern
      try {
        const response = await api.patient.getPatientById(patientId);
        return response.data ?? null;
      } catch {
        try {
          const fallback = await api.patient.getPatientDetails(patientId);
          return fallback.data ?? null;
        } catch {
          return null;
        }
      }
    },
  });

  const invalidateAppointmentLists = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
    queryClient.invalidateQueries({ queryKey: ["appointments", "today"] });
  };

  const normalizedStatus = useMemo(() => {
    if (!appointment?.status) return "Scheduled" as AppointmentStatus | string;
    return (normalizeAppointmentStatus(appointment.status) ?? "Scheduled") as
      | AppointmentStatus
      | string;
  }, [appointment?.status]);

  const updateStatusMutation = useMutation({
    mutationFn: (status: AppointmentStatus) =>
      api.appointment.updateAppointmentStatus(appointmentId, {
        status: ensureAppointmentStatus(status),
      }),
    onSuccess: async (_, status) => {
      toast.success("Appointment status updated.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "detail", appointmentId],
      });
      invalidateAppointmentLists();
      
      // Send notification to patient
      if (patientId && appointment) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        await sendAppointmentNotification(
          patientId,
          "status_changed",
          {
            appointmentId: appointmentId,
            appointmentDate: appointment.appointmentDate,
            status: String(status),
          }
        );
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update status. Please try again."
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.appointment.cancelAppointment(appointmentId, {
        cancellationReason: cancelReason,
      }),
    onSuccess: async () => {
      toast.success("Appointment cancelled.");
      setShowCancelReason(false);
      setCancelReason("");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "detail", appointmentId],
      });
      invalidateAppointmentLists();
      
      // Send notification to patient
      if (patientId && appointment) {
        const { sendAppointmentNotification } = await import(
          "@/utils/notifications"
        );
        await sendAppointmentNotification(
          patientId,
          "cancelled",
          {
            appointmentId: appointmentId,
            appointmentDate: appointment.appointmentDate,
            appointmentType: appointment.type,
          }
        );
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to cancel appointment. Please try again."
      );
    },
  });

  const checkInMutation = useMutation({
    mutationFn: () => api.appointment.checkIn(appointmentId),
    onSuccess: () => {
      toast.success("Patient checked in.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "detail", appointmentId],
      });
      invalidateAppointmentLists();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to check in patient. Please try again."
      );
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => api.appointment.checkOut(appointmentId),
    onSuccess: () => {
      toast.success("Patient checked out.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "detail", appointmentId],
      });
      invalidateAppointmentLists();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to check out patient. Please try again."
      );
    },
  });

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const statusBadgeClass = (status: AppointmentStatus | string) => {
    return getAppointmentStatusBadgeClass(status);
  };

  const patientDisplayName = useMemo(() => {
    if (!patient) {
      const raw = appointment as unknown as Record<string, any> | undefined;
      return (
        getFullNameFromObject(raw?.patient) ??
        raw?.patientName ??
        raw?.patientFullName ??
        patientId ??
        "Not available"
      );
    }
    const raw = patient as unknown as Record<string, any>;
    return (
      getFullNameFromObject(patient) ??
      raw.accountInfo?.username ??
      patient.patientCode ??
      patientId ??
      "Not available"
    );
  }, [patient, appointment, patientId]);

  const canCheckIn = normalizedStatus === ("Scheduled" as string);
  const canCheckOut =
    normalizedStatus === ("CheckedIn" as string) ||
    normalizedStatus === ("InProgress" as string);
  const canComplete =
    normalizedStatus === ("CheckedIn" as string) ||
    normalizedStatus === ("InProgress" as string);
  const canCancel =
    normalizedStatus !== ("Completed" as string) &&
    normalizedStatus !== ("Cancelled" as string);

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Appointment Details
                </h1>
                {appointment && (
                  <Badge
                    className={cn(
                      "border font-semibold",
                      statusBadgeClass(normalizedStatus)
                    )}
                  >
                    {(APPOINTMENT_STATUS_LABELS as Record<string, string>)[
                      normalizedStatus
                    ] ?? normalizedStatus}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Appointment ID:{" "}
                <span className="font-mono font-medium">{appointmentId}</span>
              </p>
              {appointment?.appointmentDate && (
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4"
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
                    {formatDateTime(appointment.appointmentDate)}
                  </span>
                  {appointment.appointmentDate && (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatTime(appointment.appointmentDate)}
                      {appointment.slot?.endTime &&
                        ` - ${formatTime(appointment.slot.endTime)}`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/doctor/appointments" })}
              >
                Back to List
              </Button>
            </div>
          </div>

          {isFetching ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Loading appointment details...</p>
              </CardContent>
            </Card>
          ) : !appointment ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-red-600">Appointment not found.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Main Content Grid */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Details */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Patient Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Patient Name
                          </p>
                          <p className="mt-1 text-base font-semibold text-gray-900">
                            {patientDisplayName}
                          </p>
                        </div>
                        {patient?.patientCode && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Patient Code
                            </p>
                            <p className="mt-1 text-base font-mono text-gray-900">
                              {patient.patientCode}
                            </p>
                          </div>
                        )}
                        {patient?.phoneNumber && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Phone Number
                            </p>
                            <p className="mt-1 text-base text-gray-900">
                              {patient.phoneNumber}
                            </p>
                          </div>
                        )}
                        {patient?.email && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Email
                            </p>
                            <p className="mt-1 text-base text-gray-900">
                              {patient.email}
                            </p>
                          </div>
                        )}
                        {patient?.dateOfBirth && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Date of Birth
                            </p>
                            <p className="mt-1 text-base text-gray-900">
                              {formatDateTime(patient.dateOfBirth)}
                            </p>
                          </div>
                        )}
                        {patient?.gender && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Gender
                            </p>
                            <p className="mt-1 text-base text-gray-900">
                              {patient.gender}
                            </p>
                          </div>
                        )}
                      </div>
                      {patientId && (
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: "/doctor/patients/$patientId",
                                params: { patientId },
                              })
                            }
                          >
                            View Full Patient Profile
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Appointment Details Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Appointment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Appointment Type
                          </p>
                          <p className="mt-1 text-base font-semibold text-gray-900">
                            {(appointment as any).appointmentType ??
                              (appointment as any).type ??
                              "Consultation"}
                          </p>
                        </div>
                        {(appointment as any).treatmentCycleId && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Treatment Cycle
                            </p>
                            <p className="mt-1 text-base font-mono text-gray-900">
                              {(appointment as any).treatmentCycleId}
                            </p>
                          </div>
                        )}
                      </div>
                      {appointment.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Notes / Description
                          </p>
                          <StructuredNote
                            note={appointment.notes}
                            className="mt-1 text-base text-gray-900"
                          />
                        </div>
                      )}
                      {!appointment.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Notes / Description
                          </p>
                          <p className="mt-1 text-sm text-gray-400 italic">
                            No notes provided for this appointment.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Preparation Checklist Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Preparation & Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm text-gray-700">
                        <li className="flex items-start gap-3">
                          <svg
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Verify electronic consent before any procedure
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Review the latest lab results</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Prepare counseling materials and follow-up plan
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <svg
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Close the encounter notes before 18:00 on the same
                            day
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                  {/* Quick Actions Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {canCheckIn && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                          <p className="font-semibold text-blue-900">
                            Check-in Patient
                          </p>
                          <p className="mt-1 text-sm text-blue-700">
                            Mark the patient as arrived
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 w-full"
                            disabled={checkInMutation.isPending}
                            onClick={() => checkInMutation.mutate()}
                          >
                            {checkInMutation.isPending
                              ? "Processing..."
                              : "Check-in Now"}
                          </Button>
                        </div>
                      )}

                      {canCheckOut && (
                        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4">
                          <p className="font-semibold text-purple-900">
                            Check-out Patient
                          </p>
                          <p className="mt-1 text-sm text-purple-700">
                            Mark the patient as departed
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mt-3 w-full"
                            disabled={checkOutMutation.isPending}
                            onClick={() => checkOutMutation.mutate()}
                          >
                            {checkOutMutation.isPending
                              ? "Processing..."
                              : "Check-out Now"}
                          </Button>
                        </div>
                      )}

                      {canComplete && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                          <p className="font-semibold text-emerald-900">
                            Complete Appointment
                          </p>
                          <p className="mt-1 text-sm text-emerald-700">
                            Close the appointment and log the encounter
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={updateStatusMutation.isPending}
                            onClick={() =>
                              updateStatusMutation.mutate("Completed")
                            }
                          >
                            {updateStatusMutation.isPending
                              ? "Processing..."
                              : "Mark as Completed"}
                          </Button>
                        </div>
                      )}

                      {canCancel && (
                        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                          <p className="font-semibold text-red-900">
                            Cancel Appointment
                          </p>
                          {!showCancelReason ? (
                            <>
                              <p className="mt-1 text-sm text-red-700">
                                Please provide a reason for cancellation
                              </p>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="mt-3 w-full"
                                onClick={() => setShowCancelReason(true)}
                              >
                                Enter Cancellation Reason
                              </Button>
                            </>
                          ) : (
                            <>
                              <textarea
                                className="mt-2 w-full rounded-md border border-red-200 bg-white p-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                                rows={3}
                                value={cancelReason}
                                placeholder="Example: Patient requested to reschedule due to work commitments"
                                onChange={(event) =>
                                  setCancelReason(event.target.value)
                                }
                              />
                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  disabled={
                                    cancelMutation.isPending ||
                                    !cancelReason.trim()
                                  }
                                  onClick={() => cancelMutation.mutate()}
                                >
                                  {cancelMutation.isPending
                                    ? "Cancelling..."
                                    : "Confirm Cancellation"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowCancelReason(false);
                                    setCancelReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Status Information Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Status Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">
                          Current Status
                        </p>
                        <p className="mt-1">
                          <Badge
                            className={cn(
                              "border font-semibold",
                              statusBadgeClass(normalizedStatus)
                            )}
                          >
                            {(
                              APPOINTMENT_STATUS_LABELS as Record<
                                string,
                                string
                              >
                            )[normalizedStatus] ?? normalizedStatus}
                          </Badge>
                        </p>
                      </div>
                      {appointment.createdAt && (
                        <div>
                          <p className="font-medium text-gray-500">
                            Created At
                          </p>
                          <p className="mt-1 text-gray-900">
                            {formatDateTime(appointment.createdAt)}
                          </p>
                        </div>
                      )}
                      {appointment.updatedAt && (
                        <div>
                          <p className="font-medium text-gray-500">
                            Last Updated
                          </p>
                          <p className="mt-1 text-gray-900">
                            {formatDateTime(appointment.updatedAt)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
