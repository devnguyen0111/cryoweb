import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { AppointmentDetailForm } from "@/features/receptionist/appointments/AppointmentDetailForm";

export const Route = createFileRoute(
  "/receptionist/appointments/$appointmentId"
)({
  component: ReceptionistAppointmentDetailRoute,
});

function ReceptionistAppointmentDetailRoute() {
  const { appointmentId } = Route.useParams();
  const navigate = useNavigate();

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

          <AppointmentDetailForm
            appointmentId={appointmentId}
            onOpenPatientProfile={(patientId) =>
              navigate({
                to: "/receptionist/patients/$patientId",
                params: { patientId },
              })
            }
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
