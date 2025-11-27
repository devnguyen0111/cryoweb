import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
];

export const Route = createFileRoute("/receptionist/service-requests")({
  component: ReceptionistServiceRequestsRoute,
});

function ReceptionistServiceRequestsRoute() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filters = useMemo(
    () => ({ status, serviceId, dateFrom, dateTo, searchTerm }),
    [status, serviceId, dateFrom, dateTo, searchTerm]
  );

  const { data: servicesData } = useQuery({
    queryKey: ["services", { pageNumber: 1, pageSize: 100 }],
    queryFn: () => api.service.getServices({ pageNumber: 1, pageSize: 100 }),
  });

  const serviceOptions = useMemo(() => {
    const base = [{ value: "", label: "All services" }];
    if (!servicesData?.data?.length) {
      return base;
    }
    return [
      ...base,
      ...servicesData.data.map((service) => ({
        value: service.id,
        label: service.name || `Service ${service.id}`,
      })),
    ];
  }, [servicesData]);

  const { data, isFetching } = useQuery({
    queryKey: [
      "receptionist",
      "service-requests",
      {
        pageNumber: page,
        pageSize: pageSize,
        status: filters.status || undefined,
        searchTerm: filters.searchTerm || undefined,
      },
    ],
    queryFn: () =>
      api.serviceRequest.getServiceRequests({
        pageNumber: page,
        pageSize: pageSize,
        status: filters.status ? (filters.status as any) : undefined,
      } as any),
  });

  const total = data?.metaData?.totalCount ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;
  const requests = data?.data ?? [];

  const filteredRequests = useMemo(() => {
    if (!requests.length) {
      return [];
    }
    return requests.filter((request) => {
      if (!dateFrom && !dateTo) {
        return true;
      }
      if (!request.requestedDate) {
        return false;
      }
      const requestDate = new Date(request.requestedDate);
      if (Number.isNaN(requestDate.getTime())) {
        return true;
      }
      const isAfterFrom = dateFrom ? requestDate >= new Date(dateFrom) : true;
      const isBeforeTo = dateTo
        ? requestDate <= new Date(dateTo + "T23:59:59")
        : true;
      return isAfterFrom && isBeforeTo;
    });
  }, [requests, dateFrom, dateTo]);

  const resetFilters = () => {
    setStatus("");
    setServiceId("");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
    setPage(1);
  };

  const statusBadgeClass = (value?: string) => {
    switch (value) {
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "Confirmed":
        return "bg-emerald-100 text-emerald-700";
      case "Rejected":
      case "Cancelled":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Service requests</h1>
              <p className="text-gray-600">
                Review incoming registrations and convert them into
                appointments.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Results: {total} requests · Page {page} / {totalPages}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/receptionist/dashboard" })}
            >
              Back to dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Narrow down by status, service type, dates, or keywords.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Service
                  </label>
                  <select
                    value={serviceId}
                    onChange={(event) => {
                      setServiceId(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Requested from
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Requested to
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(event) => setDateTo(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <Input
                    placeholder="Search by patient, service, or notes..."
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="border rounded-lg">
                {isFetching ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading requests...
                  </div>
                ) : filteredRequests.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-600">
                          <th className="px-4 py-3 font-medium">Request</th>
                          <th className="px-4 py-3 font-medium">Service</th>
                          <th className="px-4 py-3 font-medium">
                            Requested date
                          </th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredRequests.map((request) => {
                          const serviceName = request.requestCode || "—";
                          return (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  #{request.id.slice(0, 8)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Patient ID:{" "}
                                  {request.patientId || "Unassigned"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {serviceName}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {request.requestedDate || "—"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                                    statusBadgeClass(request.status)
                                  )}
                                >
                                  {request.status || "pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate({
                                      to: "/receptionist/service-requests/$serviceRequestId",
                                      params: { serviceRequestId: request.id },
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
                  <div className="py-12 text-center text-gray-500">
                    No service requests match the current filters.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredRequests.length} / {total} requests (current
                  page)
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
