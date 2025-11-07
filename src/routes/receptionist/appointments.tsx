import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/receptionist/appointments")({
  component: ReceptionistAppointmentsComponent,
});

function ReceptionistAppointmentsComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["appointments", { Page: 1, Size: 20 }],
    queryFn: () => api.appointment.getAppointments({ Page: 1, Size: 20 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý cuộc hẹn</h1>
            <p className="text-gray-600 mt-2">Danh sách cuộc hẹn</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách cuộc hẹn</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : (
                <div className="space-y-4">
                  {data?.data && data.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Tiêu đề</th>
                            <th className="text-left p-2">Ngày</th>
                            <th className="text-left p-2">Thời gian</th>
                            <th className="text-left p-2">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map((appointment) => (
                            <tr key={appointment.id} className="border-b">
                              <td className="p-2">{appointment.title}</td>
                              <td className="p-2">
                                {appointment.appointmentDate}
                              </td>
                              <td className="p-2">
                                {appointment.startTime} - {appointment.endTime}
                              </td>
                              <td className="p-2">{appointment.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Không có dữ liệu
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
