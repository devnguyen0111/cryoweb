import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { LabSampleDetailResponse } from "@/api/types";
import { SpermSampleDetailModal } from "@/features/doctor/samples/SpermSampleDetailModal";
import { Eye, Filter, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

export const Route = createFileRoute("/doctor/samples")({
  component: DoctorSamplesComponent,
});

function DoctorSamplesComponent() {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [showAssessedOnly, setShowAssessedOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [canFrozenFilter, setCanFrozenFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [patientIdFilter, setPatientIdFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      SampleType: "Sperm" as const,
      Status: statusFilter || undefined,
      CanFrozen: canFrozenFilter === "true" ? true : canFrozenFilter === "false" ? false : undefined,
      SearchTerm: searchTerm || undefined,
      PatientId: patientIdFilter || undefined,
      Page: 1,
      Size: 100,
      Sort: "collectionDate",
      Order: "desc" as const,
    }),
    [statusFilter, canFrozenFilter, searchTerm, patientIdFilter]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["samples", "all-detail", filters],
    queryFn: () => api.sample.getAllDetailSamples(filters),
  });

  const hasActiveFilters = statusFilter || canFrozenFilter || searchTerm || patientIdFilter;

  const resetFilters = () => {
    setStatusFilter("");
    setCanFrozenFilter("");
    setSearchTerm("");
    setPatientIdFilter("");
  };

  // Filter for assessed sperm samples (client-side filter for "Assessed Only" toggle)
  const assessedSpermSamples = useMemo(() => {
    if (!data?.data) return [];

    const spermSamples = data.data.filter(
      (sample) => sample.sampleType === "Sperm"
    ) as LabSampleDetailResponse[];

    if (!showAssessedOnly) {
      return spermSamples;
    }

    // Filter for samples that have been assessed
    // - Status "QualityChecked" means already assessed (regardless of quality data)
    // - Other statuses (Stored, Processing, Used, Frozen) require quality data to be present
    return spermSamples.filter((sample) => {
      // If status is QualityChecked, it's already assessed
      if (sample.status === "QualityChecked") {
        return true;
      }

      // For other statuses, check if quality data exists in nested sperm object
      const sperm = sample.sperm;
      const hasQualityData =
        (sperm?.volume !== undefined && sperm.volume !== null) ||
        (sperm?.concentration !== undefined && sperm.concentration !== null) ||
        (sperm?.motility !== undefined && sperm.motility !== null) ||
        (sperm?.morphology !== undefined && sperm.morphology !== null);

      // Other assessed statuses require quality data
      const isAssessed =
        hasQualityData &&
        (sample.status === "Stored" ||
          sample.status === "Processing" ||
          sample.status === "Used" ||
          sample.status === "Frozen");

      return isAssessed;
    });
  }, [data?.data, showAssessedOnly]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      // Check if date is valid and not a default/invalid date
      if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() < 1900 ||
        dateString === "0001-01-01T00:00:00"
      ) {
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
    const statusClasses: Record<string, string> = {
      Collected: "bg-blue-100 text-blue-800 border-blue-200",
      Processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Stored: "bg-green-100 text-green-800 border-green-200",
      Used: "bg-purple-100 text-purple-800 border-purple-200",
      Discarded: "bg-red-100 text-red-800 border-red-200",
      QualityChecked: "bg-emerald-100 text-emerald-800 border-emerald-200",
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
            <div className="flex items-center gap-2">
              <Button
                variant={showAssessedOnly ? "default" : "outline"}
                onClick={() => setShowAssessedOnly(!showAssessedOnly)}
                className="flex items-center gap-2"
              >
                {showAssessedOnly ? "Assessed Only" : "All Samples"}
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-1 bg-red-500 text-white">
                    {[statusFilter, canFrozenFilter, searchTerm, patientIdFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Filters Card */}
          {showFilters && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-sm"
                      >
                        Clear all
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">All statuses</option>
                      <option value="Collected">Collected</option>
                      <option value="Processing">Processing</option>
                      <option value="Stored">Stored</option>
                      <option value="Used">Used</option>
                      <option value="Discarded">Discarded</option>
                      <option value="QualityChecked">Quality Checked</option>
                      <option value="Frozen">Frozen</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Can Frozen
                    </label>
                    <select
                      value={canFrozenFilter}
                      onChange={(e) => setCanFrozenFilter(e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">All</option>
                      <option value="true">Can Frozen</option>
                      <option value="false">Cannot Frozen</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Search (Sample Code)
                    </label>
                    <Input
                      placeholder="e.g. SP-2025"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Patient ID
                    </label>
                    <Input
                      placeholder="Enter patient ID"
                      value={patientIdFilter}
                      onChange={(e) => setPatientIdFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                                {sample.sperm?.volume !== undefined &&
                                sample.sperm.volume !== null
                                  ? `${sample.sperm.volume} mL`
                                  : "—"}
                              </td>
                              <td className="p-3 text-sm">
                                {sample.sperm?.concentration !== undefined &&
                                sample.sperm.concentration !== null
                                  ? `${sample.sperm.concentration} million/mL`
                                  : "—"}
                              </td>
                              <td className="p-3 text-sm">
                                {sample.sperm?.motility !== undefined &&
                                sample.sperm.motility !== null
                                  ? `${sample.sperm.motility}%`
                                  : "—"}
                              </td>
                              <td className="p-3 text-sm">
                                {sample.sperm?.morphology !== undefined &&
                                sample.sperm.morphology !== null
                                  ? `${sample.sperm.morphology}%`
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
