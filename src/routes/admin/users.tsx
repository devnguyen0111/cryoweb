import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
});

function AdminUsersComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["users", { Page: 1, Size: 20 }],
    queryFn: () => api.user.getUsers({ Page: 1, Size: 20 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
            <p className="text-gray-600 mt-2">
              Danh sách tất cả người dùng hệ thống
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
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
                            <th className="text-left p-2">Vai trò</th>
                            <th className="text-left p-2">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.map((user) => (
                            <tr key={user.id} className="border-b">
                              <td className="p-2">
                                {user.userName || user.email}
                              </td>
                              <td className="p-2">{user.email}</td>
                              <td className="p-2">{user.roleName}</td>
                              <td className="p-2">
                                {user.status ? "Hoạt động" : "Không hoạt động"}
                              </td>
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
