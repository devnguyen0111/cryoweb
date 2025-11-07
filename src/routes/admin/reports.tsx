import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsComponent,
});

function AdminReportsComponent() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-gray-600 mt-2">Reports and system statistics</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System reports</CardTitle>
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
