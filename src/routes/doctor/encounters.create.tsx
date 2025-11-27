import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreateEncounterForm } from "@/features/doctor/encounters/CreateEncounterForm";

type EncounterSearchState = {
  patientId?: string;
  appointmentId?: string;
};

export const Route = createFileRoute("/doctor/encounters/create")({
  component: DoctorEncounterCreateComponent,
  validateSearch: (
    search: { patientId?: string; appointmentId?: string } = {}
  ) => search,
});

function DoctorEncounterCreateComponent() {
  const search = Route.useSearch() as EncounterSearchState;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <CreateEncounterForm
            layout="page"
            defaultPatientId={search.patientId}
            defaultAppointmentId={search.appointmentId}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
