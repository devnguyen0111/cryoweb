import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/doctor/patients")({
  component: DoctorPatientsComponent,
});

function DoctorPatientsComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["patients", { Page: 1, Size: 20 }],
    queryFn: () => api.patient.getPatients({ Page: 1, Size: 20 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Bệnh nhân của tôi</h1>
            <p className="text-gray-600 mt-2">Danh sách bệnh nhân</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách bệnh nhân</CardTitle>
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
                            <th className="text-left p-2">Tên</th>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Số điện thoại</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map((patient) => (
                            <tr key={patient.id} className="border-b">
                              <td className="p-2">
                                {patient.firstName} {patient.lastName}
                              </td>
                              <td className="p-2">{patient.email}</td>
                              <td className="p-2">{patient.phone}</td>
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
