import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";

export const Route = createFileRoute("/admin/patients")({
  component: AdminPatientsComponent,
});

function AdminPatientsComponent() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["patients", { pageNumber: 1, pageSize: 20 }],
    queryFn: () => api.patient.getPatients({ pageNumber: 1, pageSize: 20 }),
  });

  const patients = data?.data ?? [];

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Patient management</h1>
            <p className="text-gray-600 mt-2">Patient list</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Patient list</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {patients.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Patient</th>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Phone</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.map((patient) => {
                            const displayName =
                              getFullNameFromObject(patient) ||
                              patient.patientCode ||
                              "Unknown";
                            return (
                              <tr key={patient.id} className="border-b">
                                <td className="p-2 text-xs text-gray-500">
                                  {getLast4Chars(patient.id)}
                                </td>
                                <td className="p-2">
                                  <div className="font-medium text-gray-900">
                                    {displayName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Patient code: {patient.patientCode || "N/A"}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Account ID: {getLast4Chars(patient.accountId)}
                                  </div>
                                </td>
                                <td className="p-2 text-sm text-gray-600">
                                  {patient.email || "-"}
                                </td>
                                <td className="p-2 text-sm text-gray-600">
                                  {patient.phoneNumber || "-"}
                                </td>
                                <td className="p-2 text-sm text-gray-600">
                                  {patient.isActive ? (
                                    <span className="font-medium text-emerald-600">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="font-medium text-red-600">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="p-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    onClick={() =>
                                      navigate({
                                        to: "/admin/patients/$patientId",
                                        params: { patientId: patient.id },
                                      })
                                    }
                                  >
                                    View details
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
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
