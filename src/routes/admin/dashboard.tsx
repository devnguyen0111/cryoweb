import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { UserRole } from "@/types/auth";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
  const { data: usersData } = useQuery({
    queryKey: ["users", { Page: 1, Size: 1 }],
    queryFn: () => api.user.getUsers({ Page: 1, Size: 1 }),
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments", { Page: 1, Size: 1 }],
    queryFn: () => api.appointment.getAppointments({ Page: 1, Size: 1 }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients", { Page: 1, Size: 1 }],
    queryFn: () => api.patient.getPatients({ Page: 1, Size: 1 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard - Admin</h1>
            <p className="text-gray-600 mt-2">Overview of system</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersData?.metaData?.total || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {appointmentsData?.metaData?.total || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {patientsData?.metaData?.total || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
