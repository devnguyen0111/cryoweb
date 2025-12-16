import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { LabSampleSperm } from "@/api/types";
import { SpermSampleDetailModal } from "@/features/doctor/samples/SpermSampleDetailModal";
import { Eye, Filter } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/doctor/samples")({
  component: DoctorSamplesComponent,
});

function DoctorSamplesComponent() {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [showAssessedOnly, setShowAssessedOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["samples", { pageNumber: 1, pageSize: 100 }],
    queryFn: () => api.sample.getSamples({ pageNumber: 1, pageSize: 100 }),
  });

  // Filter for assessed sperm samples
  const assessedSpermSamples = useMemo(() => {
    if (!data?.data) return [];

    const spermSamples = data.data.filter(
      (sample) => sample.sampleType === "Sperm"
    ) as LabSampleSperm[];

    if (!showAssessedOnly) {
      return spermSamples;
    }

    // Filter for samples that have been assessed (have quality data and are in Stored or Processing status)
    return spermSamples.filter((sample) => {
      const hasQualityData =
        sample.volume !== undefined ||
        sample.concentration !== undefined ||
        sample.motility !== undefined ||
        sample.morphology !== undefined;

      const isAssessed =
        hasQualityData &&
        (sample.status === "Stored" ||
          sample.status === "Processing" ||
          sample.status === "Used");

      return isAssessed;
    });
  }, [data?.data, showAssessedOnly]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const statusClasses: Record<string, string> = {
      Collected: "bg-blue-100 text-blue-800 border-blue-200",
      Processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Stored: "bg-green-100 text-green-800 border-green-200",
      Used: "bg-purple-100 text-purple-800 border-purple-200",
      Discarded: "bg-red-100 text-red-800 border-red-200",
    };
    return statusClasses[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Assessed Sperm Samples</h1>
              <p className="text-gray-600 mt-2">
                List of sperm samples received after quality assessment
              </p>
            </div>
            <Button
              variant={showAssessedOnly ? "default" : "outline"}
              onClick={() => setShowAssessedOnly(!showAssessedOnly)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showAssessedOnly ? "Assessed Only" : "All Samples"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Sperm Samples List
                {showAssessedOnly && " (Quality Assessed)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {assessedSpermSamples.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sample Code</th>
                            <th className="text-left p-3">Collection Date</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Volume</th>
                            <th className="text-left p-3">Concentration</th>
                            <th className="text-left p-3">Motility</th>
                            <th className="text-left p-3">Morphology</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessedSpermSamples.map((sample) => (
                            <tr
                              key={sample.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3">
                                <span className="font-mono text-sm">
                                  {sample.sampleCode ||
                                    getLast4Chars(sample.id)}
                                </span>
                              </td>
                              <td className="p-3 text-sm">
                                {formatDate(sample.collectionDate)}
                              </td>
                              <td className="p-3">
                                <Badge
                                  className={cn(
                                    "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                    getStatusBadgeClass(sample.status)
                                  )}
                                >
                                  {sample.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                {sample.volume !== undefined
                                  ? `${sample.volume} mL`
                                  : "—"}
                              </td>
                              <td className="p-3 text-sm">
                                {sample.concentration !== undefined
                                  ? `${sample.concentration} million/mL`
                                  : "—"}
                              </td>
                              <td className="p-3 text-sm">
                                {sample.motility !== undefined
                                  ? `${sample.motility}%`
                                  : "—"}
                              </td>
                              <td className="p-3 text-sm">
                                {sample.morphology !== undefined
                                  ? `${sample.morphology}%`
                                  : "—"}
                              </td>
                              <td className="p-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedSampleId(sample.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {showAssessedOnly
                        ? "No assessed sperm samples found"
                        : "No data available"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sample Detail Modal */}
        {selectedSampleId && (
          <SpermSampleDetailModal
            sampleId={selectedSampleId}
            isOpen={!!selectedSampleId}
            onClose={() => setSelectedSampleId(null)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
