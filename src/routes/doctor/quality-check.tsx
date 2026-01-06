import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";
import { api } from "@/api/client";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import type {
  LabSampleDetailResponse,
  SpecimenStatus,
  Patient,
  PatientDetailResponse,
} from "@/api/types";
import { RefreshCw, FlaskConical, Eye, Filter, X, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullName } from "@/utils/name-helpers";
import { QualityCheckModal } from "@/features/doctor/quality-check/QualityCheckModal";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { getSampleStatusBadgeClass } from "@/utils/status-colors";

export const Route = createFileRoute("/doctor/quality-check")({
  component: QualityCheckComponent,
});

function QualityCheckComponent() {
  const queryClient = useQueryClient();
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [selectedEmbryoAction, setSelectedEmbryoAction] = useState<
    "transfer" | "frozen" | null
  >(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [sampleToCancel, setSampleToCancel] = useState<string | null>(null);
  const [sampleTypeFilter, setSampleTypeFilter] = useState<
    "Sperm" | "Oocyte" | "Embryo" | ""
  >("");
  const [canFrozenFilter, setCanFrozenFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [patientCodeFilter, setPatientCodeFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["quality-check-samples"],
    });
    setIsRefreshing(false);
  };

  // Fetch sperm and oocyte samples with QualityChecked status only
  const spermFilters = useMemo(
    () => ({
      SampleType: "Sperm" as const,
      Status: "QualityChecked" as const,
      SearchTerm: searchTerm || undefined,
      CanFrozen:
        canFrozenFilter === "true"
          ? true
          : canFrozenFilter === "false"
            ? false
            : undefined,
      Page: 1,
      Size: 100,
      Sort: "collectionDate",
      Order: "desc" as const,
    }),
    [searchTerm, canFrozenFilter]
  );

  const { data: spermData, isLoading: spermLoading } = useQuery({
    queryKey: ["quality-check-samples", "sperm", spermFilters],
    queryFn: () => api.sample.getAllDetailSamples(spermFilters),
    enabled: sampleTypeFilter === "" || sampleTypeFilter === "Sperm",
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const oocyteFilters = useMemo(
    () => ({
      SampleType: "Oocyte" as const,
      Status: "QualityChecked" as const,
      SearchTerm: searchTerm || undefined,
      Page: 1,
      Size: 100,
      Sort: "collectionDate",
      Order: "desc" as const,
    }),
    [searchTerm]
  );

  const { data: oocyteData, isLoading: oocyteLoading } = useQuery({
    queryKey: ["quality-check-samples", "oocyte", oocyteFilters],
    queryFn: () => api.sample.getAllDetailSamples(oocyteFilters),
    enabled: sampleTypeFilter === "" || sampleTypeFilter === "Oocyte",
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const embryoFilters = useMemo(
    () => ({
      SampleType: "Embryo" as const,
      Status: "QualityChecked" as const,
      SearchTerm: searchTerm || undefined,
      Page: 1,
      Size: 100,
      Sort: "collectionDate",
      Order: "desc" as const,
    }),
    [searchTerm]
  );

  const { data: embryoData, isLoading: embryoLoading } = useQuery({
    queryKey: ["quality-check-samples", "embryo", embryoFilters],
    queryFn: () => api.sample.getAllDetailSamples(embryoFilters),
    enabled: sampleTypeFilter === "" || sampleTypeFilter === "Embryo",
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Combine all quality-checked samples
  const qualityCheckedSamples = useMemo(() => {
    const allSamples: LabSampleDetailResponse[] = [];

    if (sampleTypeFilter === "" || sampleTypeFilter === "Sperm") {
      const spermSamples = (spermData?.data ?? []).filter(
        (s) => s.sampleType === "Sperm" && s.status === "QualityChecked"
      ) as LabSampleDetailResponse[];
      allSamples.push(...spermSamples);
    }

    if (sampleTypeFilter === "" || sampleTypeFilter === "Oocyte") {
      const oocyteSamples = (oocyteData?.data ?? []).filter(
        (s) => s.sampleType === "Oocyte" && s.status === "QualityChecked"
      ) as LabSampleDetailResponse[];
      allSamples.push(...oocyteSamples);
    }

    if (sampleTypeFilter === "" || sampleTypeFilter === "Embryo") {
      const embryoSamples = (embryoData?.data ?? []).filter(
        (s) => s.sampleType === "Embryo" && s.status === "QualityChecked"
      ) as LabSampleDetailResponse[];
      allSamples.push(...embryoSamples);
    }

    return allSamples;
  }, [spermData?.data, oocyteData?.data, embryoData?.data, sampleTypeFilter]);

  // Extract unique patient IDs from samples
  const patientIds = useMemo(() => {
    const ids = qualityCheckedSamples
      .map((sample) => sample.patientId)
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(ids));
  }, [qualityCheckedSamples]);

  // Fetch patient data for all samples
  const patientQueries = useQueries({
    queries: patientIds.map((patientId) => ({
      queryKey: ["doctor", "patient", patientId, "quality-check"],
      queryFn: async (): Promise<Patient | PatientDetailResponse | null> => {
        try {
          const response = await api.patient.getPatientById(patientId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error)) {
            if (error.response?.status === 403) {
              try {
                const fallback = await api.patient.getPatientDetails(patientId);
                return fallback.data ?? null;
              } catch {
                return null;
              }
            }
            if (error.response?.status === 404) {
              return null;
            }
          }
          return null;
        }
      },
      retry: false,
      staleTime: 60000, // Cache for 1 minute
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    })),
  });

  // Create a map of patientId -> Patient for quick lookup
  const patientsMap = useMemo(() => {
    const map = new Map<string, Patient | PatientDetailResponse>();
    patientQueries.forEach((query, index) => {
      if (query.data && patientIds[index]) {
        map.set(patientIds[index], query.data);
      }
    });
    return map;
  }, [patientQueries, patientIds]);

  // Apply patient code filter
  const filteredSamples = useMemo(() => {
    if (!patientCodeFilter) return qualityCheckedSamples;

    const searchLower = patientCodeFilter.toLowerCase().trim();
    return qualityCheckedSamples.filter((sample) => {
      const fetchedPatient = sample.patientId
        ? patientsMap.get(sample.patientId)
        : null;
      const patientCode =
        (fetchedPatient as Patient)?.patientCode ||
        sample.patient?.patientCode ||
        "";
      return patientCode.toLowerCase().includes(searchLower);
    });
  }, [qualityCheckedSamples, patientCodeFilter, patientsMap]);

  const hasActiveFilters = canFrozenFilter || searchTerm || patientCodeFilter;

  const updateSampleMutation = useMutation({
    mutationFn: async ({
      sampleId,
      status,
      notes,
    }: {
      sampleId: string;
      status: SpecimenStatus;
      notes?: string;
    }) => {
      // Get sample to determine type
      const allSamples = [
        ...(spermData?.data ?? []),
        ...(oocyteData?.data ?? []),
        ...(embryoData?.data ?? []),
      ];
      const sample = allSamples.find((s) => s.id === sampleId);

      if (!sample) throw new Error("Sample not found");

      // If status is "Stored" (freeze for storage action), use frozen API only
      if (status === "Stored") {
        return await api.sample.updateFrozenStatus(sampleId, true);
      }

      // For "Used" status or other actions, use the regular update flow
      const updateData: any = {
        status,
        notes,
      };

      // Use specific update methods based on sample type
      if (sample.sampleType === "Sperm") {
        return api.sample.updateSpermSample(sampleId, updateData);
      } else if (sample.sampleType === "Oocyte") {
        return api.sample.updateOocyteSample(sampleId, updateData);
      } else if (sample.sampleType === "Embryo") {
        return api.sample.updateEmbryoSample(sampleId, updateData);
      }

      // Fallback to generic update
      return api.sample.updateSample(sampleId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-check-samples"] });
      toast.success("Sample updated successfully");
      setSelectedSampleId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update sample");
    },
  });

  const cancelSampleMutation = useMutation({
    mutationFn: async ({
      sampleId,
      notes,
    }: {
      sampleId: string;
      notes?: string;
    }) => {
      // Get sample to determine type
      const allSamples = [
        ...(spermData?.data ?? []),
        ...(oocyteData?.data ?? []),
        ...(embryoData?.data ?? []),
      ];
      const sample = allSamples.find((s) => s.id === sampleId);

      if (!sample) throw new Error("Sample not found");

      const updateData: any = {
        status:
          sample.sampleType === "Embryo"
            ? ("Discarded" as SpecimenStatus)
            : ("Disposed" as SpecimenStatus),
        notes: notes || "Cancelled by doctor",
      };

      // Use specific update methods based on sample type
      if (sample.sampleType === "Sperm") {
        return api.sample.updateSpermSample(sampleId, updateData);
      } else if (sample.sampleType === "Oocyte") {
        return api.sample.updateOocyteSample(sampleId, updateData);
      } else if (sample.sampleType === "Embryo") {
        return api.sample.updateEmbryoSample(sampleId, updateData);
      }

      // Fallback to generic update
      return api.sample.updateSample(sampleId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quality-check-samples"] });
      toast.success("Sample cancelled successfully");
      setSampleToCancel(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel sample");
    },
  });

  const resetFilters = () => {
    setCanFrozenFilter("");
    setSearchTerm("");
    setPatientCodeFilter("");
  };

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

  const isLoading = spermLoading || oocyteLoading || embryoLoading;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Quality Check</h1>
              <p className="text-gray-600 mt-2">
                Review quality-checked samples (Oocyte, Sperm, and Embryo).
                Confirm to use in treatment or store for freezing.
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-1 bg-red-500 text-white">
                    {
                      [canFrozenFilter, searchTerm, patientCodeFilter].filter(
                        Boolean
                      ).length
                    }
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
                      Sample Type
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={sampleTypeFilter}
                      onChange={(e) =>
                        setSampleTypeFilter(
                          e.target.value as "Sperm" | "Oocyte" | "Embryo" | ""
                        )
                      }
                    >
                      <option value="">All Types</option>
                      <option value="Sperm">Sperm</option>
                      <option value="Oocyte">Oocyte</option>
                      <option value="Embryo">Embryo</option>
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
                      Patient Code
                    </label>
                    <Input
                      placeholder="e.g. PAT001"
                      value={patientCodeFilter}
                      onChange={(e) => setPatientCodeFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                Quality-Checked Samples
                {sampleTypeFilter && ` (${sampleTypeFilter})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {filteredSamples.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sample Type</th>
                            <th className="text-left p-3">Sample Code</th>
                            <th className="text-left p-3">Patient</th>
                            <th className="text-left p-3">Collection Date</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSamples.map((sample) => {
                            // Get patient from map (fetched) or from sample.patient (nested)
                            const fetchedPatient = sample.patientId
                              ? patientsMap.get(sample.patientId)
                              : null;
                            const patient = fetchedPatient || sample.patient;

                            // Get patient name
                            const patientName = patient
                              ? (() => {
                                  if (fetchedPatient) {
                                    const patientWithAccount =
                                      fetchedPatient as any;
                                    if (patientWithAccount.accountInfo) {
                                      return getFullName(
                                        patientWithAccount.accountInfo
                                          .firstName,
                                        patientWithAccount.accountInfo.lastName
                                      );
                                    }
                                    return getFullName(
                                      (fetchedPatient as Patient).firstName,
                                      (fetchedPatient as Patient).lastName
                                    );
                                  }
                                  if (sample.patient) {
                                    return getFullName(
                                      sample.patient.firstName,
                                      sample.patient.lastName
                                    );
                                  }
                                  return "";
                                })()
                              : "";
                            const patientCode =
                              (fetchedPatient as Patient)?.patientCode ||
                              sample.patient?.patientCode ||
                              null;

                            const isSperm = sample.sampleType === "Sperm";
                            const isOocyte = sample.sampleType === "Oocyte";

                            return (
                              <tr
                                key={sample.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    {isSperm ? (
                                      <FlaskConical className="h-4 w-4 text-blue-500" />
                                    ) : isOocyte ? (
                                      <FlaskConical className="h-4 w-4 text-pink-500" />
                                    ) : (
                                      <FlaskConical className="h-4 w-4 text-purple-500" />
                                    )}
                                    <span className="text-sm font-medium">
                                      {isSperm
                                        ? "Sperm"
                                        : isOocyte
                                          ? "Oocyte"
                                          : "Embryo"}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span className="font-mono text-sm">
                                    {sample.sampleCode ||
                                      getLast4Chars(sample.id)}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {(patientName || patientCode) && patient ? (
                                    <>
                                      {patientName.trim() ? (
                                        <>
                                          <div className="font-semibold">
                                            {patientName}
                                          </div>
                                          {patientCode && (
                                            <p className="text-xs text-gray-500">
                                              {patientCode}
                                            </p>
                                          )}
                                        </>
                                      ) : (
                                        patientCode && (
                                          <div className="font-semibold">
                                            {patientCode}
                                          </div>
                                        )
                                      )}
                                    </>
                                  ) : (
                                    "—"
                                  )}
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
                                <td className="p-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSampleId(sample.id);
                                        setIsViewMode(true);
                                        setSelectedEmbryoAction(null);
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSampleId(sample.id);
                                        setSelectedEmbryoAction(null);
                                        setIsViewMode(false);
                                      }}
                                      className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setSampleToCancel(sample.id)
                                      }
                                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Cancel
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No quality-checked samples found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedSampleId && (
          <QualityCheckModal
            sampleId={selectedSampleId}
            isOpen={!!selectedSampleId}
            onClose={() => {
              setSelectedSampleId(null);
              setSelectedEmbryoAction(null);
              setIsViewMode(false);
            }}
            onSuccess={(status, notes) => {
              updateSampleMutation.mutate({
                sampleId: selectedSampleId,
                status,
                notes,
              });
            }}
            isLoading={updateSampleMutation.isPending}
            embryoAction={selectedEmbryoAction}
            viewMode={isViewMode}
          />
        )}

        {sampleToCancel && (
          <ConfirmationDialog
            isOpen={!!sampleToCancel}
            onClose={() => setSampleToCancel(null)}
            onConfirm={() => {
              cancelSampleMutation.mutate({
                sampleId: sampleToCancel,
              });
            }}
            title="Cancel Sample"
            message="Are you sure you want to cancel this sample? This action cannot be undone."
            confirmText="Cancel Sample"
            cancelText="Cancel"
            variant="destructive"
            isLoading={cancelSampleMutation.isPending}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
