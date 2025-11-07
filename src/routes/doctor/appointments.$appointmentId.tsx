import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/doctor/appointments/$appointmentId")({
  component: DoctorAppointmentDetailsComponent,
});

function DoctorAppointmentDetailsComponent() {
  const { appointmentId } = Route.useParams();
  const queryClient = useQueryClient();
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["doctor", "appointments", "detail", appointmentId],
    queryFn: async () => {
      const response =
        await api.appointment.getAppointmentDetails(appointmentId);
      return response.data;
    },
  });

  const appointment = data;

  const invalidateAppointmentLists = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
    queryClient.invalidateQueries({ queryKey: ["appointments", "today"] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.appointment.updateAppointmentStatus(appointmentId, status as any),
    onSuccess: () => {
      toast.success("Appointment status updated.");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "detail", appointmentId],
      });
      invalidateAppointmentLists();
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
      api.appointment.cancelAppointment(appointmentId, cancelReason),
    onSuccess: () => {
      toast.success("Appointment cancelled.");
      setShowCancelReason(false);
      setCancelReason("");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "appointments", "detail", appointmentId],
      });
      invalidateAppointmentLists();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Unable to cancel appointment. Please try again."
      );
    },
  });

  const actions = useMemo(
    () => [
      {
        label: "Confirm",
        status: "confirmed",
        description: "Send a confirmation notification to the patient",
      },
      {
        label: "Check-in",
        status: "in-progress",
        description: "Mark the patient as arrived",
      },
      {
        label: "Complete",
        status: "completed",
        description: "Close the appointment and log the encounter",
      },
    ],
    []
  );

  const statusClass = (status?: string) => {
    switch (status) {
      case "confirmed":
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "in-progress":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
      case "no-show":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Appointment details</h1>
            <p className="text-gray-600">
              Appointment ID:{" "}
              <span className="font-semibold">{appointmentId}</span>
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Appointment information</CardTitle>
                  <p className="text-sm text-gray-500">
                    {appointment?.appointmentDate} - {appointment?.startTime} -{" "}
                    {appointment?.endTime}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    statusClass(appointment?.status)
                  )}
                >
                  {appointment?.status || "pending"}
                </span>
              </CardHeader>
              <CardContent className="space-y-6 text-sm">
                {isFetching ? (
                  <div className="py-10 text-center text-gray-500">
                    Loading data...
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-gray-500">Appointment type</p>
                        <p className="text-base font-medium text-gray-900">
                          {appointment?.type ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Related treatment cycle</p>
                        <p className="text-base font-medium text-gray-900">
                          {appointment?.treatmentCycleId ?? "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Description</p>
                        <p className="text-base text-gray-800">
                          {appointment?.description ||
                            "No description provided."}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">System note</p>
                        <p className="text-base text-gray-800">
                          Close the encounter notes before 18:00 on the same
                          day.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Update history
                      </h3>
                      <ul className="mt-3 space-y-2 text-gray-600">
                        <li>- 07:30 - Scheduled by coordinator.</li>
                        <li>- 08:00 - Reminder email sent to patient.</li>
                        <li>- 08:45 - Patient confirmed attendance.</li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {actions.map((action) => (
                  <div
                    key={action.status}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <p className="font-semibold text-gray-800">
                      {action.label}
                    </p>
                    <p className="mt-1 text-gray-500">{action.description}</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      variant="outline"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate(action.status)}
                    >
                      Update status
                    </Button>
                  </div>
                ))}

                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-semibold text-red-700">
                    Cancel appointment
                  </p>
                  {!showCancelReason ? (
                    <>
                      <p className="mt-1 text-red-600">
                        Please provide a reason so it is logged in history.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => setShowCancelReason(true)}
                      >
                        Enter cancellation reason
                      </Button>
                    </>
                  ) : (
                    <>
                      <textarea
                        className="mt-2 w-full rounded-md border border-red-200 p-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
                        rows={3}
                        value={cancelReason}
                        placeholder="Example: patient requested to reschedule due to work"
                        onChange={(event) =>
                          setCancelReason(event.target.value)
                        }
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={
                            cancelMutation.isPending || !cancelReason.trim()
                          }
                          onClick={() => cancelMutation.mutate()}
                        >
                          Confirm cancellation
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowCancelReason(false);
                            setCancelReason("");
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Patient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>
                  Name:{" "}
                  <span className="font-semibold text-gray-900">
                    {appointment?.patientId || "Not available"}
                  </span>
                </p>
                <p>Contact: Information syncs from the patient record.</p>
                <p>
                  After the visit, update the encounter to continue with
                  diagnosis and care planning.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preparation &amp; checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>- Verify electronic consent before any procedure.</p>
                <p>- Review the latest lab results.</p>
                <p>- Prepare counseling materials and follow-up plan.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
