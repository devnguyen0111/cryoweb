import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/doctor/patients/$patientId")({
  component: DoctorPatientProfileComponent,
});

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "medical", label: "History" },
  { id: "encounters", label: "Encounters &amp; diagnosis" },
  { id: "treatments", label: "Treatment cycles" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "attachments", label: "Documents" },
];

function DoctorPatientProfileComponent() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("overview");

  const { data: patientResponse, isFetching: patientLoading } = useQuery({
    queryKey: ["doctor", "patient", patientId],
    queryFn: async () => {
      const response = await api.patient.getPatientById(patientId);
      return response.data;
    },
  });

  const { data: treatmentCycles } = useQuery({
    queryKey: ["doctor", "patient", patientId, "cycles"],
    queryFn: () =>
      api.treatmentCycle.getTreatmentCycles({
        PatientId: patientId,
        Page: 1,
        Size: 10,
      }),
  });

  const { data: appointments } = useQuery({
    queryKey: ["doctor", "patient", patientId, "appointments"],
    queryFn: () =>
      api.appointment.getAppointments({
        SearchTerm: patientId,
        Page: 1,
        Size: 10,
        Order: "desc",
        Sort: "appointmentDate",
      }) as any,
  });

  const patient = patientResponse;

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Patient profile</h1>
            <p className="text-gray-600">
              Patient ID: <span className="font-semibold">{patientId}</span>
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {patientLoading
                    ? "Loading..."
                    : [patient?.firstName, patient?.lastName]
                        .filter(Boolean)
                        .join(" ") || "Not updated"}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Date of birth: {patient?.dateOfBirth || "-"} - Gender:{" "}
                  {patient?.gender || "-"}
                </p>
                <p className="text-sm text-gray-500">
                  Email: {patient?.email || "-"} - Phone:{" "}
                  {patient?.phone || "-"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/doctor/encounters/create",
                      search: { patientId },
                    })
                  }
                >
                  New encounter
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/doctor/treatment-cycles",
                      search: { patientId },
                    })
                  }
                >
                  Manage cycles
                </Button>
                <Button
                  onClick={() =>
                    navigate({
                      to: "/doctor/prescriptions",
                      search: { patientId },
                    })
                  }
                >
                  Create prescription
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-medium",
                      activeTab === tab.id
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {activeTab === "overview" && (
            <section className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Personal information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="text-base text-gray-800">
                      {patient?.address || "Not recorded"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">National ID</p>
                    <p className="text-base text-gray-800">---</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Marital status</p>
                    <p className="text-base text-gray-800">---</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Profile created</p>
                    <p className="text-base text-gray-800">
                      {patient?.createdAt || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <p>
                    - {appointments?.data?.[0]?.appointmentDate || "N/A"}:
                    Consultation.
                  </p>
                  <p>
                    - Active cycle:{" "}
                    {treatmentCycles?.data?.[0]?.treatmentType || "None"}.
                  </p>
                  <p>- Reminder: schedule follow-up in 14 days.</p>
                </CardContent>
              </Card>
            </section>
          )}

          {activeTab === "medical" && (
            <Card>
              <CardHeader>
                <CardTitle>History &amp; allergies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>- Obstetric history: Not recorded.</p>
                <p>- Drug allergies: None reported.</p>
                <p>- Prior treatments: Intrauterine insemination in 2023.</p>
                <p className="text-xs text-gray-500">
                  * Information will sync from encounter notes and treatment
                  records.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "encounters" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Encounter log</CardTitle>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: "/doctor/encounters/create",
                      search: { patientId },
                    })
                  }
                >
                  Add encounter
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  - No encounters recorded yet. Create the first encounter to
                  begin tracking.
                </p>
                <p>- Once completed, continue to the diagnosis workflow.</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "treatments" && (
            <Card>
              <CardHeader>
                <CardTitle>Treatment cycles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {treatmentCycles?.data?.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {treatmentCycles.data.map((cycle) => (
                      <div
                        key={cycle.id}
                        className="rounded-lg border border-gray-100 p-4 text-sm"
                      >
                        <p className="text-base font-semibold text-gray-900">
                          {cycle.treatmentType || "Cycle"}
                        </p>
                        <p className="text-gray-600">
                          Start: {cycle.startDate || "-"} - End:{" "}
                          {cycle.endDate || "-"}
                        </p>
                        <p className="text-gray-500">
                          Status: {cycle.status || "Pending"}
                        </p>
                        <div className="mt-3 flex gap-2">
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
                            View details
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    No treatment cycles yet. Create one from the Treatment Cycle
                    module.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "prescriptions" && (
            <Card>
              <CardHeader>
                <CardTitle>Prescriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  - Electronic prescriptions will appear here once the API is
                  integrated.
                </p>
                <p>
                  - Create new prescriptions from the Prescription Management
                  module and sign digitally.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "attachments" && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  - No files uploaded yet. Attach ultrasound or lab results
                  here.
                </p>
                <p>- Supported formats: PDF, JPG, PNG up to 10 MB each.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
