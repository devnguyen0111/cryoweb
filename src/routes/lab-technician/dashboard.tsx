import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { api } from "@/api/client";

export const Route = createFileRoute("/lab-technician/dashboard")({
  component: LabTechnicianDashboardComponent,
});

function LabTechnicianDashboardComponent() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: samplesData } = useQuery({
    queryKey: ["samples", { pageNumber: 1, pageSize: 1 }],
    queryFn: () => api.sample.getSamples({ pageNumber: 1, pageSize: 1 }),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Invalidate all queries to refresh dashboard data
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["samples"] }),
    ]);
    setIsRefreshing(false);
  };

  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard - Lab Technician</h1>
              <p className="text-gray-600 mt-2">Overview of work</p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total samples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {samplesData?.metaData?.totalCount || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Samples being processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed samples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
