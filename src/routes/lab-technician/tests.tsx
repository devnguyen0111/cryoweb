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
            <h1 className="text-3xl font-bold">Xét nghiệm</h1>
            <p className="text-gray-600 mt-2">Quản lý xét nghiệm</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách xét nghiệm</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Tính năng đang được phát triển...</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
