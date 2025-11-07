import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/doctor/reports")({
  component: DoctorReportsComponent,
});

function DoctorReportsComponent() {
  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Báo cáo</h1>
            <p className="text-gray-600 mt-2">Báo cáo và thống kê</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Báo cáo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Tính năng báo cáo đang được phát triển...
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
