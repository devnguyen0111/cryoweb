import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Treatment } from "@/api/types";

export const Route = createFileRoute("/doctor/encounters")({
  component: DoctorEncountersComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

function DoctorEncountersComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch encounters (treatments with type "Other" or all types for this doctor)
  const { data: encountersData, isLoading } = useQuery({
    queryKey: ["doctor-encounters", user?.id, statusFilter, searchTerm],
    queryFn: async () => {
      const response = await api.treatment.getTreatments({
        doctorId: user?.id,
        treatmentType: "Other", // Encounters are stored as "Other" type
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        pageNumber: 1,
        pageSize: 50,
      });
      return response;
    },
    enabled: !!user?.id,
  });

  const encounters = encountersData?.data || [];
  const filteredEncounters = useMemo(() => {
    if (!searchTerm) return encounters;
    const term = searchTerm.toLowerCase();
    return encounters.filter(
      (encounter) =>
        encounter.treatmentCode?.toLowerCase().includes(term) ||
        encounter.notes?.toLowerCase().includes(term)
    );
  }, [encounters, searchTerm]);

  const quickGuide = useMemo(
    () => [
      {
        title: "Step 1: Start the encounter",
        description:
          "Capture visit reasons, medical history, and vital signs. The system automatically links to the current appointment.",
      },
      {
        title: "Step 2: Diagnose & order",
        description:
          "After saving, continue to the diagnosis screen to add assessments and ancillary orders.",
      },
      {
        title: "Step 3: Transition to treatment",
        description:
          "From diagnosis you can issue prescriptions, create IUI/IVF cycles, or hand off data to the cryobank.",
      },
    ],
    []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "InProgress":
        return "bg-blue-100 text-blue-700";
      case "Planning":
        return "bg-yellow-100 text-yellow-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Encounters &amp; clinical visits
                </h1>
                <p className="text-gray-600">
                  Manage outpatient visits, update patient records, and move into
                  the diagnosis workflow.
                </p>
              </div>
              <Button
                onClick={() =>
                  navigate({
                    to: "/doctor/encounters/create",
                    search,
                  })
                }
              >
                + Create encounter
              </Button>
            </div>
          </section>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search encounters</label>
                  <Input
                    placeholder="Search by code or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by status</label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Planning">Planning</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encounters List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Recent encounters ({filteredEncounters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-gray-500">
                  Loading encounters...
                </div>
              ) : filteredEncounters.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p className="mb-4">No encounters found.</p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate({
                        to: "/doctor/encounters/create",
                        search,
                      })
                    }
                  >
                    Create your first encounter
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEncounters.map((encounter) => (
                    <div
                      key={encounter.id}
                      className="rounded-lg border p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {encounter.treatmentCode || `Encounter ${encounter.id.slice(0, 8)}`}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                                encounter.status
                              )}`}
                            >
                              {encounter.status}
                            </span>
                          </div>
                          <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                            <div>
                              <span className="font-medium">Date: </span>
                              {encounter.startDate
                                ? new Date(encounter.startDate).toLocaleDateString("vi-VN")
                                : "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Patient ID: </span>
                              {encounter.patientId || "N/A"}
                            </div>
                            {encounter.notes && (
                              <div className="md:col-span-2">
                                <span className="font-medium">Notes: </span>
                                <span className="line-clamp-2">
                                  {encounter.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate({
                                to: "/doctor/encounters/$encounterId",
                                params: { encounterId: encounter.id },
                              })
                            }
                          >
                            View
                          </Button>
                          {encounter.status === "InProgress" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate({
                                  to: "/doctor/encounters/$encounterId/diagnosis",
                                  params: { encounterId: encounter.id },
                                  search: {
                                    patientId: encounter.patientId,
                                    treatmentId: encounter.id,
                                  },
                                })
                              }
                            >
                              Diagnose
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quickGuide.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  {item.description}
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
