import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/doctor/cryobank")({
  component: DoctorCryobankComponent,
  validateSearch: (search: { cycleId?: string } = {}) => search,
});

const STATUS_BADGE: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-blue-100 text-blue-700",
  thawing: "bg-amber-100 text-amber-700",
  discarded: "bg-red-100 text-red-700",
};

function DoctorCryobankComponent() {
  const { cycleId } = Route.useSearch();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>(cycleId || "");

  const filters = useMemo(
    () => ({ page, statusFilter, searchTerm }),
    [page, statusFilter, searchTerm]
  );

  const { data, isFetching } = useQuery({
    queryKey: ["doctor", "cryobank", filters],
    queryFn: () =>
      api.sample.getSamples({
        Page: page,
        Size: 10,
        Status: statusFilter || undefined,
        SearchTerm: searchTerm || undefined,
      }),
  });

  const totalPages = data?.metaData?.totalPages ?? 1;

  const handleAction = (action: "reserve" | "thaw" | "discard") => {
    toast.info(
      `The ${action} action will connect to the API in the next phase.`
    );
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Cryobank management</h1>
            <p className="text-gray-600">
              Monitor sperm, oocyte, and embryo inventory. Perform
              reserve/thaw/discard actions following witness workflows.
            </p>
          </section>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Cryobank filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Page {page}/{totalPages} - {data?.metaData?.total ?? 0}{" "}
                    samples
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => toast.info("CSV export is in progress")}
                >
                  Export CSV
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <Input
                    placeholder="Sample ID, patient code, storage location"
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
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="thawing">Thawing</option>
                    <option value="discarded">Discarded</option>
                  </select>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cryo samples</CardTitle>
            </CardHeader>
            <CardContent>
              {isFetching ? (
                <div className="py-12 text-center text-gray-500">
                  Loading data...
                </div>
              ) : data?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">Sample ID</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Stored on</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.data.map((sample) => (
                        <tr key={sample.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {sample.id}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {sample.sampleType || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {sample.collectionDate || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                STATUS_BADGE[
                                  sample.status?.toLowerCase?.() || ""
                                ] || STATUS_BADGE.available
                              )}
                            >
                              {sample.status || "available"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction("reserve")}
                              >
                                Reserve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAction("thaw")}
                              >
                                Thaw
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction("discard")}
                              >
                                Discard
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  No cryo samples match the current filters.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {data?.data?.length ?? 0} samples on this page
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

          <Card>
            <CardHeader>
              <CardTitle>Safety checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                - All thaw/discard actions require double witness and OTP
                verification.
              </p>
              <p>- Verify storage expiry and location before handling.</p>
              <p>
                - Record the log and digital signature immediately after
                completing the action.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
