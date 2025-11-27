import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/admin/appointments")({
  component: AdminAppointmentsComponent,
});

function AdminAppointmentsComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["appointments", { pageNumber: 1, pageSize: 20 }],
    queryFn: () => api.appointment.getAppointments({ pageNumber: 1, pageSize: 20 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Appointment management</h1>
            <p className="text-gray-600 mt-2">Appointment list</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appointment list</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {data?.data && data.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Code</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Patient ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map((appointment) => (
                            <tr key={appointment.id} className="border-b">
                              <td className="p-2">{appointment.appointmentCode}</td>
                              <td className="p-2">{appointment.appointmentType}</td>
                              <td className="p-2">
                                {appointment.appointmentDate}
                              </td>
                              <td className="p-2">
                                {appointment.status}
                              </td>
                              <td className="p-2">{appointment.patientId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
