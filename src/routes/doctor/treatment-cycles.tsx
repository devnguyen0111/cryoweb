import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import type { DynamicResponse, TreatmentCycle } from "@/api/types";

export const Route = createFileRoute("/doctor/treatment-cycles")({
  component: DoctorTreatmentCyclesComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

const STATUS_COLORS: Record<string, string> = {
  Planned: "bg-gray-100 text-gray-700",
  "In Progress": "bg-blue-100 text-blue-700",
  COS: "bg-blue-100 text-blue-700",
  OPU: "bg-purple-100 text-purple-700",
  ET: "bg-emerald-100 text-emerald-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

function DoctorTreatmentCyclesComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>(search.patientId || "");

  const filters = useMemo(
    () => ({ page, statusFilter, searchTerm }),
    [page, statusFilter, searchTerm]
  );

  const emptyResponse: DynamicResponse<TreatmentCycle> = useMemo(
    () => ({
      data: [],
      metaData: { total: 0, page: 1, size: 0, totalPages: 0 },
    }),
    []
  );

  const { data, isFetching } = useQuery<DynamicResponse<TreatmentCycle>>({
    queryKey: ["doctor", "treatment-cycles", filters],
    retry: false,
    queryFn: async (): Promise<DynamicResponse<TreatmentCycle>> => {
      try {
        return await api.treatmentCycle.getTreatmentCycles({
          Page: page,
          Size: 8,
          Status: statusFilter || undefined,
          SearchTerm: searchTerm || undefined,
          PatientId: search.patientId,
        } as any);
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return emptyResponse;
        }
        const message =
          error?.response?.data?.message || "Unable to load treatment cycles.";
        toast.error(message);
        return emptyResponse;
      }
    },
  });

  const totalPages = data?.metaData?.totalPages ?? 1;
  const timelinePhases = [
    "Planned",
    "COS",
    "OPU",
    "Fertilization",
    "ET",
    "Completed",
  ];

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Treatment cycles</h1>
            <p className="text-gray-600">
              Monitor IUI/IVF progress, update statuses, and coordinate with the
              cryobank.
            </p>
          </section>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Cycle filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Page {page}/{totalPages} - {data?.metaData?.total ?? 0}{" "}
                    cycles
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/doctor/cryobank" })}
                  >
                    View cryobank
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/doctor/encounters" })}
                  >
                    Back to encounters
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <Input
                    placeholder="By patient name or cycle ID"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All</option>
                    {timelinePhases.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <section className="grid gap-6 lg:grid-cols-2">
            {isFetching ? (
              <div className="lg:col-span-2 py-12 text-center text-gray-500">
                Loading data...
              </div>
            ) : data?.data?.length ? (
              data.data.map((cycle) => {
                const currentIndex = timelinePhases.findIndex(
                  (phase) => phase === cycle.status
                );
                return (
                  <Card key={cycle.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{cycle.treatmentType || "Cycle"}</CardTitle>
                        <p className="text-sm text-gray-500">
                          Patient: {cycle.patientId || "Not linked"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          STATUS_COLORS[cycle.status || ""] ||
                            STATUS_COLORS.Planned
                        )}
                      >
                        {cycle.status || "Planned"}
                      </span>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p>Start: {cycle.startDate || "-"}</p>
                          <p>Expected end: {cycle.endDate || "-"}</p>
                        </div>
                        <div>
                          <p>Notes: {cycle.notes || "None"}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-gray-700">Timeline</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {timelinePhases.map((phase, index) => (
                            <span
                              key={phase}
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                index < currentIndex
                                  ? "bg-emerald-100 text-emerald-700"
                                  : index === currentIndex
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-500"
                              )}
                            >
                              {phase}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate({
                              to: "/doctor/treatment-cycles/$cycleId",
                              params: { cycleId: cycle.id },
                            })
                          }
                        >
                          Cycle details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            navigate({
                              to: "/doctor/treatment-cycles/$cycleId/workflow",
                              params: { cycleId: cycle.id },
                            })
                          }
                        >
                          Open workflow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="lg:col-span-2 py-12 text-center text-gray-500">
                No matching treatment cycles.
              </div>
            )}
          </section>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {data?.data?.length ?? 0} cycles on this page
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
