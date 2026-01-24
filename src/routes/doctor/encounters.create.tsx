import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CreateTreatmentForm } from "@/features/doctor/encounters/CreateTreatmentForm";

type TreatmentSearchState = {
  patientId?: string;
  appointmentId?: string;
};

export const Route = createFileRoute("/doctor/encounters/create")({
  component: DoctorTreatmentCreateComponent,
  validateSearch: (
    search: { patientId?: string; appointmentId?: string } = {}
  ) => search,
});

function DoctorTreatmentCreateComponent() {
  const search = Route.useSearch() as TreatmentSearchState;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <CreateTreatmentForm
            layout="page"
            defaultPatientId={search.patientId}
            defaultAppointmentId={search.appointmentId}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
