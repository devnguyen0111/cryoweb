import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";

export const Route = createFileRoute("/doctor/patients")({
  component: DoctorPatientsComponent,
  validateSearch: (search: { q?: string } = {}) => search,
});

function DoctorPatientsComponent() {
  const { q } = Route.useSearch();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState(q ?? "");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [treatmentFilter, setTreatmentFilter] = useState<string>("");
  const navigate = useNavigate();

  const filters = useMemo(
    () => ({ searchTerm, genderFilter, treatmentFilter, page }),
    [searchTerm, genderFilter, treatmentFilter, page]
  );

  const { data, isFetching } = useQuery({
    queryKey: ["doctor", "patients", filters],
    queryFn: () =>
      api.patient.getPatients({
        SearchTerm: searchTerm || undefined,
        Page: page,
        Size: pageSize,
        // Gender and treatment filter are placeholders waiting for backend support
      }),
  });

  const total = data?.metaData?.total ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;

  const resetFilters = () => {
    setSearchTerm("");
    setGenderFilter("");
    setTreatmentFilter("");
    setPage(1);
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Patient directory</h1>
            <p className="text-gray-600">
              Quickly access patient charts, encounter history, and treatment
              cycles.
            </p>
          </section>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Search filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Results: {total} patients - Page {page}/{totalPages}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/doctor/treatment-cycles" })}
                  >
                    View treatment cycles
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2 xl:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search by name, email, or patient ID
                  </label>
                  <Input
                    placeholder="Ex: Jane Doe, 0987..."
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    value={genderFilter}
                    onChange={(event) => setGenderFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Treatment status
                  </label>
                  <select
                    value={treatmentFilter}
                    onChange={(event) => setTreatmentFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All</option>
                    <option value="iui">IUI in progress</option>
                    <option value="ivf">IVF in progress</option>
                    <option value="follow-up">Post-treatment follow-up</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isFetching ? (
                <div className="py-12 text-center text-gray-500">
                  Loading data...
                </div>
              ) : data?.data?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">Patient</th>
                        <th className="px-4 py-3 font-medium">Contact</th>
                        <th className="px-4 py-3 font-medium">Date of birth</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.data.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {[patient.firstName, patient.lastName]
                              .filter(Boolean)
                              .join(" ") || "Not updated"}
                            <p className="text-xs text-gray-500">
                              #{patient.id}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div>{patient.email || "-"}</div>
                            <div className="text-xs">
                              {patient.phone || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {patient.dateOfBirth || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate({
                                    to: "/doctor/patients/$patientId",
                                    params: { patientId: patient.id },
                                  })
                                }
                              >
                                View profile
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate({
                                    to: "/doctor/encounters/create",
                                    search: { patientId: patient.id },
                                  })
                                }
                              >
                                Create encounter
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
                  No patients match the filters.
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {data?.data?.length ?? 0} of {total} patients
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
