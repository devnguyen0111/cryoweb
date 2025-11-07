import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/lab-technician/samples")({
  component: LabTechnicianSamplesComponent,
});

function LabTechnicianSamplesComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["samples", { Page: 1, Size: 20 }],
    queryFn: () => api.sample.getSamples({ Page: 1, Size: 20 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý mẫu</h1>
            <p className="text-gray-600 mt-2">Danh sách mẫu xét nghiệm</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách mẫu</CardTitle>
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
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Loại mẫu</th>
                            <th className="text-left p-2">Ngày thu thập</th>
                            <th className="text-left p-2">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map((sample) => (
                            <tr key={sample.id} className="border-b">
                              <td className="p-2">{sample.id}</td>
                              <td className="p-2">{sample.sampleType}</td>
                              <td className="p-2">{sample.collectionDate}</td>
                              <td className="p-2">{sample.status}</td>
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
