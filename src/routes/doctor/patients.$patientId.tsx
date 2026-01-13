import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import type { DynamicResponse, Treatment, TreatmentCycle } from "@/api/types";
import { normalizeTreatmentCycleStatus } from "@/api/types";
import { cn } from "@/utils/cn";
import {
  isPatientDetailResponse,
  getPatientProperty,
} from "@/utils/patient-helpers";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "medical", label: "Medical History" },
  { id: "treatments", label: "Treatment Cycles" },
  { id: "encounters", label: "Treatments" },
  { id: "appointments", label: "Appointments" },
  { id: "documents", label: "Documents" },
] as const;

const emptyList: DynamicResponse<any> = {
  code: 200,
  message: "Success",
  data: [],
  metaData: {
    pageNumber: 1,
    pageSize: 0,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  },
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const Route = createFileRoute("/doctor/patients/$patientId")({
  component: DoctorPatientProfile,
});

function DoctorPatientProfile() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["id"]>("overview");

  const debug = (...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[DoctorPatientProfile]", ...args);
    }
  };

  useEffect(() => {
    debug("Route params change", { patientId });
  }, [patientId]);

  const {
    data: patient,
    isFetching: patientLoading,
    error: patientError,
  } = useQuery({
    queryKey: ["doctor", "patient", patientId],
    retry: false,
    queryFn: async () => {
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.response?.status === 403) {
            const fallback = await api.patient.getPatientById(patientId);
            return fallback.data ?? null;
          }
          if (error.response?.status === 404) {
            return null;
          }
        }
        throw error;
      }
    },
  });

  useEffect(() => {
    debug("Patient query state", {
      patientLoading,
      hasPatient: Boolean(patient),
      hasError: Boolean(patientError),
    });
  }, [patient, patientLoading, patientError]);

  const { data: treatmentCyclesResponse = emptyList } = useQuery({
    queryKey: ["doctor", "patient", patientId, "cycles"],
    enabled: !!patientId,
    retry: false,
    queryFn: async () => {
      try {
        return (
          (await api.treatmentCycle.getTreatmentCycles({
            patientId: patientId,
          })) ?? emptyList
        );
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 ||
            error.response?.status === 400 ||
            error.response?.status === 500)
        ) {
          console.warn(
            "[DoctorPatientProfile] Unable to load treatment cycles",
            patientId,
            error.response?.status
          );
          return emptyList;
        }
        throw error;
      }
    },
  });

  const { data: treatmentsResponse = emptyList } = useQuery({
    queryKey: ["doctor", "patient", patientId, "treatments"],
    enabled: !!patientId,
    retry: false,
    queryFn: async () => {
      try {
        return (
          (await api.treatment.getTreatments({
            patientId: patientId,
            pageNumber: 1,
            pageSize: 20,
          })) ?? emptyList
        );
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 ||
            error.response?.status === 400 ||
            error.response?.status === 500)
        ) {
          console.warn(
            "[DoctorPatientProfile] Unable to load treatments",
            patientId,
            error.response?.status
          );
          return emptyList;
        }
        throw error;
      }
    },
  });

  const { data: appointmentsResponse = emptyList } = useQuery({
    queryKey: ["doctor", "patient", patientId, "appointments"],
    enabled: !!patientId,
    retry: false,
    queryFn: async () => {
      try {
        return (
          (await api.appointment.getAppointments({
            patientId: patientId,
            pageNumber: 1,
            pageSize: 20,
          })) ?? emptyList
        );
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 ||
            error.response?.status === 400 ||
            error.response?.status === 500)
        ) {
          console.warn(
            "[DoctorPatientProfile] Unable to load appointments",
            patientId,
            error.response?.status
          );
          return emptyList;
        }
        throw error;
      }
    },
  });

  const treatmentCycles = useMemo(
    () =>
      [...((treatmentCyclesResponse.data ?? []) as TreatmentCycle[])].sort(
        (a, b) =>
          new Date(b.startDate ?? "").getTime() -
          new Date(a.startDate ?? "").getTime()
      ),
    [treatmentCyclesResponse.data]
  );

  const treatments = (treatmentsResponse.data ?? []) as Treatment[];

  const appointments = appointmentsResponse.data ?? [];
  useEffect(() => {
    debug("Related query snapshots", {
      treatmentCycles: treatmentCycles.length,
      treatments: treatments.length,
      appointments: appointments.length,
    });
  }, [treatmentCycles, treatments, appointments]);

  const upcomingAppointment = useMemo(() => {
    const now = Date.now();
    return appointments
      .map((appointment) => ({
        appointment,
        time: new Date(appointment.appointmentDate ?? "").getTime(),
      }))
      .filter((item) => !Number.isNaN(item.time) && item.time >= now)
      .sort((a, b) => a.time - b.time)[0]?.appointment;
  }, [appointments]);
  const latestAppointment = appointments[0];

  const activeCycle =
    treatmentCycles.find((cycle) => {
      const normalizedStatus = normalizeTreatmentCycleStatus(cycle.status);
      return normalizedStatus
        ?.toLowerCase()
        .match(/active|processing|in-progress|ongoing/);
    }) ?? treatmentCycles[0];

  const completedCycles = treatmentCycles.filter((cycle) => {
    const normalizedStatus = normalizeTreatmentCycleStatus(cycle.status);
    return normalizedStatus?.toLowerCase().match(/completed|success|done/);
  }).length;

  const careStatus = activeCycle?.treatmentType
    ? activeCycle.treatmentType
    : getPatientProperty(patient, "treatmentCount", 0) > 0
      ? "In follow-up"
      : "Not started";

  const quickStats = [
    {
      label: "Current treatment",
      value: careStatus,
    },
    {
      label: "Treatment cycles",
      value: treatmentCycles.length,
    },
    {
      label: "Completed cycles",
      value: completedCycles,
    },
    {
      label: "Treatments recorded",
      value: treatments.length,
    },
  ];

  if (patientError && !patientLoading) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Unable to load patient information
            </h1>
            <p className="max-w-md text-sm text-gray-500">
              Something went wrong while retrieving this patient. Please try
              again or contact an administrator if the issue persists.
            </p>
            <Button
              type="button"
              onClick={() => navigate({ to: "/doctor/patients" })}
            >
              Back to patient directory
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!patient && !patientLoading) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Patient not found
            </h1>
            <p className="max-w-md text-sm text-gray-500">
              The patient record may have been removed or you might not have
              access. Please verify the URL or return to the directory.
            </p>
            <Button
              type="button"
              onClick={() => navigate({ to: "/doctor/patients" })}
            >
              Back to patient directory
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const accountStatus =
    patient &&
    isPatientDetailResponse(patient) &&
    patient.accountInfo?.isActive === false
      ? "Inactive"
      : "Active";

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-gray-500">Patient profile</p>
              <h1 className="text-3xl font-bold text-gray-900">
                {(patient && isPatientDetailResponse(patient)
                  ? patient.accountInfo?.username
                  : null) ||
                  (patient?.firstName && patient?.lastName
                    ? `${patient.firstName} ${patient.lastName}`.trim()
                    : patient?.firstName || patient?.lastName) ||
                  patient?.patientCode ||
                  "Unnamed patient"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>Patient ID: {patientId}</span>
                <span className="hidden text-gray-300 lg:block">•</span>
                <span>Account ID: {patient?.accountId ?? "—"}</span>
                <span className="hidden text-gray-300 lg:block">•</span>
                <span>Blood type: {patient?.bloodType || "N/A"}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
                {accountStatus}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                {careStatus}
              </span>
            </div>
          </header>

          <Card>
            <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Care snapshot</CardTitle>
                <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                  <p>
                    Email:{" "}
                    {(patient && isPatientDetailResponse(patient)
                      ? patient.accountInfo?.email
                      : null) ||
                      patient?.email ||
                      "Not provided"}
                  </p>
                  <p>
                    Phone:{" "}
                    {(patient && isPatientDetailResponse(patient)
                      ? patient.accountInfo?.phone
                      : null) ||
                      patient?.phoneNumber ||
                      "Not provided"}
                  </p>
                  <p>
                    Citizen ID Card: {patient?.nationalId || "Not provided"}
                  </p>
                  <p>
                    Emergency contact:{" "}
                    {getPatientProperty(patient, "emergencyContact", null)
                      ? `${getPatientProperty(patient, "emergencyContact", "")} (${getPatientProperty(patient, "emergencyPhone", "—")})`
                      : "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/doctor/encounters/create",
                      search: { patientId },
                    })
                  }
                >
                  Create treatment
                </Button>
                <Button
                  variant="outline"
                  type="button"
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
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/doctor/prescriptions",
                      search: { patientId },
                    })
                  }
                >
                  New prescription
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-medium transition",
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

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickStats.map((stat) => (
              <Card key={stat.label} className="border border-gray-100">
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {stat.value ?? "—"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          {activeTab === "overview" && (
            <section className="grid gap-6 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Personal information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p>
                      {(patient && isPatientDetailResponse(patient)
                        ? patient.accountInfo?.address
                        : null) ||
                        patient?.address ||
                        "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Profile created</p>
                    <p>{formatDate(patient?.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Insurance</p>
                    <p>
                      {getPatientProperty(patient, "insurance", "Not provided")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Notes</p>
                    <p>
                      {getPatientProperty(patient, "notes", "No notes yet")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lab samples</p>
                    <p>{getPatientProperty(patient, "labSampleCount", 0)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">
                      Relationships (partner/donor)
                    </p>
                    <p>{getPatientProperty(patient, "relationshipCount", 0)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Latest appointment
                    </p>
                    <p className="font-medium text-gray-900">
                      {latestAppointment
                        ? formatDateTime(latestAppointment.appointmentDate)
                        : "No appointment yet"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {latestAppointment?.status || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Upcoming appointment
                    </p>
                    <p className="font-medium text-gray-900">
                      {upcomingAppointment
                        ? formatDateTime(upcomingAppointment.appointmentDate)
                        : "None scheduled"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Keep an eye on pre-visit tasks.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Active treatment cycle
                    </p>
                    <p className="font-medium text-gray-900">
                      {activeCycle?.treatmentType || "Not started"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {activeCycle?.status || "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeTab === "medical" && (
            <section className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Medical history & allergies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Medical history
                    </p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(
                        patient,
                        "medicalHistory",
                        "Not recorded"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Allergies</p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(
                        patient,
                        "allergies",
                        "None reported"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Occupation
                    </p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(
                        patient,
                        "occupation",
                        "Not recorded"
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    * Information is synced automatically from treatments,
                    treatment notes and prescriptions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vitals & clinician notes</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Height</p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(patient, "height", null)
                        ? `${getPatientProperty(patient, "height", 0)} cm`
                        : "Not captured"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Weight</p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(patient, "weight", null)
                        ? `${getPatientProperty(patient, "weight", 0)} kg`
                        : "Not captured"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">BMI</p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(patient, "bmi", null) ??
                        "Not calculated"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">
                      Clinician notes
                    </p>
                    <p className="text-base text-gray-800">
                      {getPatientProperty(patient, "notes", "No notes yet")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeTab === "treatments" && (
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Treatment cycles</CardTitle>
                  <p className="text-sm text-gray-500">
                    Track IUI/IVF cycles, review outcomes, and jump into the
                    workflow.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/doctor/treatment-cycles",
                      search: { patientId },
                    })
                  }
                >
                  Open treatment cycle module
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                {treatmentCycles.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {treatmentCycles.map((cycle) => (
                      <div
                        key={cycle.id}
                        className={cn(
                          "space-y-3 rounded-lg border p-4 transition",
                          cycle.id === activeCycle?.id
                            ? "border-primary bg-primary/5 shadow"
                            : "border-gray-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-gray-900">
                            {cycle.treatmentType || "Treatment cycle"}
                          </p>
                          <span className="text-xs font-medium uppercase text-primary">
                            {cycle.status || "In progress"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(cycle.startDate)} →{" "}
                          {formatDate(cycle.endDate)}
                        </p>
                        <p className="text-gray-600">
                          Notes: {cycle.notes || "No notes"}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
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
                            type="button"
                            onClick={() =>
                              navigate({
                                to: "/doctor/treatment-cycles/$cycleId",
                                params: { cycleId: cycle.id },
                              } as any)
                            }
                          >
                            Open workflow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No treatment cycles on record yet. Create the first cycle
                    from the Treatment Cycles module.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "encounters" && (
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Treatment history</CardTitle>
                  <p className="text-sm text-gray-500">
                    A chronological view of visits, diagnoses and care plans.
                  </p>
                </div>
                <Button
                  size="sm"
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/doctor/encounters/create",
                      search: { patientId },
                    })
                  }
                >
                  Add treatment
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {treatments.length ? (
                  treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {treatment.treatmentName ||
                              treatment.treatmentType ||
                              "Treatment"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(treatment.startDate)} →{" "}
                            {formatDate(treatment.endDate)}
                          </p>
                        </div>
                        <span className="text-xs font-medium uppercase text-primary">
                          {treatment.status || "Recorded"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Diagnosis: {treatment.diagnosis || "Not specified"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Notes: {treatment.notes || "No notes"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No treatments have been recorded yet. Create the first
                    treatment for this patient to kick off their clinical
                    journey.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "appointments" && (
            <Card>
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <p className="text-sm text-gray-500">
                  Monitor recent visits and upcoming commitments with the care
                  team.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                {appointments.length ? (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {appointment.title ||
                              appointment.type ||
                              "Appointment"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(appointment.appointmentDate)}
                          </p>
                        </div>
                        <span className="text-xs font-medium uppercase text-primary">
                          {appointment.status || "Scheduled"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Notes: {appointment.description || "No notes"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No appointments have been scheduled for this patient yet.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "documents" && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  - File uploads (lab results, ultrasound images, consent forms)
                  will appear here once the document API is integrated.
                </p>
                <p>
                  - Supported formats will include PDF, JPG and PNG up to 10 MB
                  per file.
                </p>
                <p>
                  - Add brief notes to each document so the nursing team knows
                  how to prepare.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
