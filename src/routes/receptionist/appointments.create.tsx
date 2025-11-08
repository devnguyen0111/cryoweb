import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreateAppointmentForm } from "@/features/receptionist/appointments/CreateAppointmentForm";

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
  const search = Route.useSearch();

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <CreateAppointmentForm
          layout="page"
          defaultPatientId={search.patientId}
          defaultServiceRequestId={search.serviceRequestId}
          defaultServiceId={search.serviceId}
          onClose={() => navigate({ to: "/receptionist/appointments" })}
          onCreated={(appointmentId) =>
            navigate({
              to: "/receptionist/appointments/$appointmentId",
              params: { appointmentId },
            })
          }
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
