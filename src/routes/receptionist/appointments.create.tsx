import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/receptionist/appointments/create")({
  component: ReceptionistAppointmentCreateRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : "",
    serviceRequestId:
      typeof search.serviceRequestId === "string"
        ? search.serviceRequestId
        : "",
    serviceId: typeof search.serviceId === "string" ? search.serviceId : "",
  }),
});

function ReceptionistAppointmentCreateRoute() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-4 rounded-md border border-dashed border-gray-300 bg-white p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Appointment creation moved
          </h1>
          <p className="text-sm text-gray-600">
            Receptionists can now review and update existing appointments, but
            new appointments must be created by a doctor. Please coordinate with
            the appropriate doctor to schedule a visit.
          </p>
          <div>
            <Button
              onClick={() => navigate({ to: "/receptionist/appointments" })}
            >
              Back to appointments
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
