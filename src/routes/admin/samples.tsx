import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/admin/samples")({
  component: AdminSamplesComponent,
});

function AdminSamplesComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["samples", { pageNumber: 1, pageSize: 20 }],
    queryFn: () => api.sample.getSamples({ pageNumber: 1, pageSize: 20 }),
  });

  // Sort samples by createdAt (newest first)
  const sortedSamples = useMemo(() => {
    const rawSamples = data?.data ?? [];
    return [...rawSamples].sort((a, b) => {
      const aCreatedAt = (a as any).createdAt || a.createdAt || "";
      const bCreatedAt = (b as any).createdAt || b.createdAt || "";
      if (!aCreatedAt && !bCreatedAt) return 0;
      if (!aCreatedAt) return 1;
      if (!bCreatedAt) return -1;
      return new Date(bCreatedAt).getTime() - new Date(aCreatedAt).getTime();
    });
  }, [data?.data]);

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Sample management</h1>
            <p className="text-gray-600 mt-2">Sample list</p>
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
                  {sortedSamples.length > 0 ? (
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
                          {sortedSamples.map((sample) => (
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
