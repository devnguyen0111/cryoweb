import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/lab-technician/tests")({
  component: LabTechnicianTestsComponent,
});

function LabTechnicianTestsComponent() {
  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Test management</h1>
            <p className="text-gray-600 mt-2">Test list</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test list</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Feature is under development...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
