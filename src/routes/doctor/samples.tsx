import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/doctor/samples")({
  component: DoctorSamplesComponent,
});

function DoctorSamplesComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["samples", { pageNumber: 1, pageSize: 20 }],
    queryFn: () => api.sample.getSamples({ pageNumber: 1, pageSize: 20 }),
  });

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Lab samples</h1>
            <p className="text-gray-600 mt-2">Listing of collected samples</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sample list</CardTitle>
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
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Sample type</th>
                            <th className="text-left p-2">Collection date</th>
                            <th className="text-left p-2">Status</th>
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
                      No data available
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
