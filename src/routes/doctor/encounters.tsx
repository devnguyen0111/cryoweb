import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/doctor/encounters")({
  component: DoctorEncountersComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

function DoctorEncountersComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  const quickGuide = useMemo(
    () => [
      {
        title: "Step 1: Start the encounter",
        description:
          "Capture visit reasons, medical history, and vital signs. The system automatically links to the current appointment.",
      },
      {
        title: "Step 2: Diagnose & order",
        description:
          "After saving, continue to the diagnosis screen to add assessments and ancillary orders.",
      },
      {
        title: "Step 3: Transition to treatment",
        description:
          "From diagnosis you can issue prescriptions, create IUI/IVF cycles, or hand off data to the cryobank.",
      },
    ],
    []
  );

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">
              Encounters &amp; clinical visits
            </h1>
            <p className="text-gray-600">
              Manage outpatient visits, update patient records, and move into
              the diagnosis workflow.
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent encounters</CardTitle>
                <p className="text-sm text-gray-500">
                  Encounter APIs are being integrated. You can still start a new
                  encounter now.
                </p>
              </div>
              <Button
                onClick={() =>
                  navigate({
                    to: "/doctor/encounters/create",
                    search,
                  })
                }
              >
                Create encounter
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>- Encounters show up here after you save the first record.</p>
              <p>
                - Every encounter includes an audit log and status (Draft, In
                Progress, Completed).
              </p>
              <p>
                - Once saved, continue to the diagnosis screen with all captured
                data.
              </p>
            </CardContent>
          </Card>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quickGuide.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  {item.description}
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
