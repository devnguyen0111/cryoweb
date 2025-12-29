import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { LabSampleDetailResponse } from "@/api/types";
import { RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";
import { EmbryoQualityCheckModal } from "@/features/doctor/embryo-quality-check/EmbryoQualityCheckModal";
import { getSampleStatusBadgeClass } from "@/utils/status-colors";

export const Route = createFileRoute("/doctor/embryo-quality-check")({
  component: EmbryoQualityCheckComponent,
});

function EmbryoQualityCheckComponent() {
  const queryClient = useQueryClient();
  const [selectedEmbryoId, setSelectedEmbryoId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["embryo-quality-check"] });
    setIsRefreshing(false);
  };

  // Fetch embryos that need quality check
  const filters = useMemo(
    () => ({
      SampleType: "Embryo" as const,
      Status: statusFilter || undefined,
      SearchTerm: searchTerm || undefined,
      Page: 1,
      Size: 100,
      Sort: "collectionDate",
      Order: "desc" as const,
    }),
    [statusFilter, searchTerm]
  );

  const { data: embryosData, isLoading: embryosLoading } = useQuery({
    queryKey: ["embryo-quality-check", filters],
    queryFn: () => api.sample.getAllDetailSamples(filters),
  });

  // Filter embryos that need quality check (status: Processing or not QualityChecked/Used/Discarded)
  const embryosNeedingCheck = useMemo(() => {
    if (!embryosData?.data) return [];

    return (embryosData.data ?? []).filter(
      (embryo) =>
        embryo.sampleType === "Embryo" &&
        (embryo.status === "Processing" ||
          embryo.status === "Collected" ||
          (embryo.status !== "QualityChecked" &&
            embryo.status !== "Used" &&
            embryo.status !== "Discarded"))
    ) as LabSampleDetailResponse[];
  }, [embryosData?.data]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) {
        return "—";
      }
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    return getSampleStatusBadgeClass(status);
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Embryo Quality Check</h1>
              <p className="text-gray-600 mt-2">
                Check embryo quality and select embryos to use, cancel, or
                freeze
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Embryos Requiring Quality Check</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-48"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Processing">Processing</option>
                    <option value="Collected">Collected</option>
                  </select>
                  <Input
                    placeholder="Search embryo code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {embryosLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : embryosNeedingCheck.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No embryos require quality check
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Embryo Code</th>
                          <th className="text-left p-3">Fertilization Date</th>
                          <th className="text-left p-3">Day of Development</th>
                          <th className="text-left p-3">Grade</th>
                          <th className="text-left p-3">Quality</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {embryosNeedingCheck.map((embryo) => (
                          <tr
                            key={embryo.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">
                              <span className="font-mono text-sm">
                                {embryo.sampleCode || getLast4Chars(embryo.id)}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {formatDate(
                                embryo.embryo?.fertilizationDate ||
                                  embryo.collectionDate
                              )}
                            </td>
                            <td className="p-3">
                              {embryo.embryo?.dayOfDevelopment ? (
                                <Badge variant="outline">
                                  Day {embryo.embryo.dayOfDevelopment}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-gray-50 text-gray-500 border-gray-300"
                                >
                                  Not Checked
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              {embryo.embryo?.grade ? (
                                <span className="text-sm">
                                  {embryo.embryo.grade}
                                </span>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-gray-50 text-gray-500 border-gray-300"
                                >
                                  Not Checked
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              {embryo.quality ? (
                                <span className="text-sm">
                                  {embryo.quality}
                                </span>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-gray-50 text-gray-500 border-gray-300"
                                >
                                  Not Checked
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge
                                className={cn(
                                  "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                  getStatusBadgeClass(embryo.status)
                                )}
                              >
                                {embryo.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEmbryoId(embryo.id)}
                              >
                                Check
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedEmbryoId && (
          <EmbryoQualityCheckModal
            embryoId={selectedEmbryoId}
            isOpen={!!selectedEmbryoId}
            onClose={() => setSelectedEmbryoId(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["embryo-quality-check"],
              });
              setSelectedEmbryoId(null);
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
