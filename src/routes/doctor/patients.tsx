import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { PaginatedResponse, TreatmentCycle } from "@/api/types";
import { normalizeTreatmentCycleStatus } from "@/api/types";
import { cn } from "@/utils/cn";
import { DoctorPatientDetailModal } from "@/features/doctor/patients/DoctorPatientDetailModal";
import {
  isPatientDetailResponse,
  getPatientProperty,
} from "@/utils/patient-helpers";
import { getLast4Chars } from "@/utils/id-helpers";

const emptyCycleResponse: PaginatedResponse<TreatmentCycle> = {
  code: 200,
  message: "No treatment cycles available",
  data: [],
  metaData: {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  },
};

const bloodTypeOptions = [
  "",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

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

export const Route = createFileRoute("/doctor/patients")({
  component: DoctorPatientsComponent,
  validateSearch: (search: { q?: string } = {}) => search,
});

function DoctorPatientsComponent() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState(q ?? "");
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );
  const [detailModalPatientId, setDetailModalPatientId] = useState<
    string | null
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor", "patients"] }),
    ]);
    setIsRefreshing(false);
  };

  const filters = useMemo(
    () => ({ searchTerm, bloodTypeFilter, statusFilter, page }),
    [searchTerm, bloodTypeFilter, statusFilter, page]
  );

  const { data, isFetching } = useQuery({
    queryKey: ["doctor", "patients", filters],
    queryFn: async () => {
      const response = await api.patient.getPatients({
        searchTerm: searchTerm || undefined,
        isActive:
          statusFilter === ""
            ? undefined
            : statusFilter === "active"
              ? true
              : false,
        pageNumber: page,
        pageSize,
      });

      if (!response?.data) {
        return {
          ...response,
          data: [],
        };
      }

      return response;
    },
  });

  const patients = data?.data ?? [];
  const total = data?.metaData?.totalCount ?? patients.length;
  const totalPages = data?.metaData?.totalPages ?? 1;

  useEffect(() => {
    if (!patients.length) {
      setSelectedPatientId(null);
      return;
    }
    setSelectedPatientId((current) => {
      if (current && patients.some((patient) => patient.id === current)) {
        return current;
      }
      return patients[0]?.id ?? null;
    });
  }, [patients]);

  const cycleSnapshots = useQueries({
    queries: patients.map((patient) => ({
      queryKey: ["doctor", "patients", patient.id, "cycle-snapshot"],
      enabled: Boolean(patient.id),
      retry: false,
      queryFn: async () => {
        if (!patient.id) {
          return emptyCycleResponse;
        }
        try {
          return (
            (await api.treatmentCycle.getTreatmentCycles({
              patientId: patient.id,
            })) ?? emptyCycleResponse
          );
        } catch (error) {
          if (
            isAxiosError(error) &&
            (error.response?.status === 404 ||
              error.response?.status === 400 ||
              error.response?.status === 500)
          ) {
            console.warn(
              "[DoctorPatients] Unable to load cycle snapshot",
              patient.id,
              error.response?.status
            );
            return emptyCycleResponse;
          }
          throw error;
        }
      },
    })),
  });

  const treatmentStatusByPatient = new Map<string, string>();
  cycleSnapshots.forEach((query, index) => {
    const patient = patients[index];
    if (!patient) {
      return;
    }
    const cycles = (query.data?.data ?? []) as TreatmentCycle[];
    const activeCycle =
      cycles.find((cycle) => {
        const normalizedStatus = normalizeTreatmentCycleStatus(cycle.status);
        return normalizedStatus
          ?.toLowerCase()
          .match(/active|in-progress|ongoing|processing/);
      }) ?? cycles[0];

    if (activeCycle?.treatmentType) {
      treatmentStatusByPatient.set(patient.id, activeCycle.treatmentType);
    } else if (getPatientProperty(patient, "treatmentCount", 0) > 0) {
      treatmentStatusByPatient.set(patient.id, "In follow-up");
    }
  });

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  const {
    data: selectedPatientCycles = emptyCycleResponse,
    isFetching: selectedPatientCyclesLoading,
  } = useQuery({
    queryKey: ["doctor", "patients", selectedPatientId, "cycles", pageSize],
    enabled: Boolean(selectedPatientId),
    retry: false,
    queryFn: async () => {
      if (!selectedPatientId) {
        return emptyCycleResponse;
      }
      try {
        return (
          (await api.treatmentCycle.getTreatmentCycles({
            patientId: selectedPatientId,
          })) ?? emptyCycleResponse
        );
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 ||
            error.response?.status === 400 ||
            error.response?.status === 500)
        ) {
          console.warn(
            "[DoctorPatients] Unable to load treatment cycles",
            selectedPatientId,
            error.response?.status
          );
          return emptyCycleResponse;
        }
        throw error;
      }
    },
  });

  const orderedCycles = useMemo(() => {
    return [...(selectedPatientCycles.data ?? [])].sort((a, b) => {
      const aTime = new Date(a.startDate ?? "").getTime();
      const bTime = new Date(b.startDate ?? "").getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return (
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        );
      }
      return bTime - aTime;
    });
  }, [selectedPatientCycles.data]);

  const activeCycle =
    orderedCycles.find((cycle) => {
      const normalizedStatus = normalizeTreatmentCycleStatus(cycle.status);
      return normalizedStatus
        ?.toLowerCase()
        .match(/active|in-progress|ongoing|processing/);
    }) ?? orderedCycles[0];

  const careStatus = selectedPatient
    ? activeCycle?.treatmentType
      ? activeCycle.treatmentType
      : getPatientProperty(selectedPatient, "treatmentCount", 0) > 0
        ? "In follow-up"
        : "Not started"
    : "No patient selected";

  const completedCycles = orderedCycles.filter((cycle) => {
    const normalizedStatus = normalizeTreatmentCycleStatus(cycle.status);
    return normalizedStatus?.toLowerCase().match(/completed|done|success/);
  }).length;

  const quickStats = selectedPatient
    ? [
        { label: "Current treatment", value: careStatus },
        {
          label: "Total treatment cycles",
          value: orderedCycles.length,
        },
        {
          label: "Completed cycles",
          value: completedCycles,
        },
        {
          label: "Relationships on file",
          value: getPatientProperty(selectedPatient, "relationshipCount", 0),
        },
      ]
    : [];

  const resetFilters = () => {
    setSearchTerm("");
    setBloodTypeFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const getAccountStatus = (patient: (typeof patients)[number]) => {
    const isDetail = isPatientDetailResponse(patient);
    const isActive =
      patient.isActive ??
      (isDetail ? (patient as any).accountInfo?.isActive : false) ??
      false;
    return {
      label: isActive ? "Active" : "Inactive",
      tone: isActive ? "text-emerald-600" : "text-gray-500",
    };
  };

  const handleOpenPatientDetailModal = (patientId?: string | null) => {
    if (!patientId) {
      console.warn(
        "[DoctorPatients] Cannot open detail modal without patientId"
      );
      return;
    }
    console.log("[DoctorPatients] Open patient detail modal", patientId);
    setDetailModalPatientId(patientId);
  };

  const handleNavigateToPatientProfile = (patientId: string) => {
    console.log("[DoctorPatients] Navigate to patient profile", patientId);
    navigate({
      to: "/doctor/patients/$patientId",
      params: { patientId },
    }).catch((error) => {
      console.error("[DoctorPatients] Failed to navigate", error);
    });
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Patient Directory
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Review demographics, treatment status, and jump straight into
                encounters or prescriptions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <p>
                  Showing <strong>{patients.length}</strong> of{" "}
                  <strong>{total}</strong> patients
                </p>
                <p className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </p>
              </div>
            </div>
          </header>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Search filters</CardTitle>
                  <p className="text-sm text-gray-500">
                    Narrow the list using patient identifiers, blood type and
                    account status.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/doctor/treatment-cycles" })}
                  >
                    Manage treatment cycles
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2 xl:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search by patient code, national ID, phone or email
                  </label>
                  <Input
                    value={searchTerm}
                    placeholder="e.g. PAT001, 090..., patient@cryo.com"
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Blood type
                  </label>
                  <select
                    value={bloodTypeFilter}
                    onChange={(event) => {
                      setBloodTypeFilter(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {bloodTypeOptions.map((value) => (
                      <option key={value || "all"} value={value}>
                        {value ? value : "All blood types"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Account status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Patient list</CardTitle>
                  <p className="text-sm text-gray-500">
                    Select a patient to review their care summary on the right.
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Total patients: {total}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isFetching ? (
                  <div className="py-10 text-center text-gray-500">
                    Loading patients...
                  </div>
                ) : patients.length ? (
                  <div className="space-y-3">
                    {patients.map((patient, index) => {
                      const isDetail = isPatientDetailResponse(patient);
                      const displayName =
                        (isDetail
                          ? (patient as any).accountInfo?.username
                          : null) ||
                        patient.fullName ||
                        patient.patientCode ||
                        "Unnamed patient";
                      const email =
                        (isDetail
                          ? (patient as any).accountInfo?.email
                          : null) ||
                        patient.email ||
                        "Email not provided";
                      const phone =
                        (isDetail
                          ? (patient as any).accountInfo?.phone
                          : null) ||
                        patient.phoneNumber ||
                        "Phone not provided";
                      const treatmentLabel =
                        treatmentStatusByPatient.get(patient.id) ??
                        (getPatientProperty(patient, "treatmentCount", 0) > 0
                          ? "In follow-up"
                          : "Not started");
                      const queryState = cycleSnapshots[index];
                      const treatmentLoading = queryState?.isFetching;
                      const { label: statusLabel, tone } =
                        getAccountStatus(patient);

                      return (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => setSelectedPatientId(patient.id)}
                          className={cn(
                            "w-full rounded-lg border p-4 text-left transition hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/40",
                            selectedPatientId === patient.id
                              ? "border-primary bg-primary/5 shadow"
                              : "border-gray-200"
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-gray-900">
                                {displayName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Patient code: {patient.patientCode ?? "—"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Account ID: {getLast4Chars(patient.accountId)}
                              </p>
                            </div>
                            <span className={cn("text-sm font-medium", tone)}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase text-gray-500">
                                Contact
                              </p>
                              <p>{email}</p>
                              <p>{phone}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-gray-500">
                                Treatment status
                              </p>
                              <p>
                                {treatmentLoading
                                  ? "Loading..."
                                  : treatmentLabel}
                              </p>
                              <p className="text-xs text-gray-500">
                                Total cycles:{" "}
                                {getPatientProperty(
                                  patient,
                                  "treatmentCount",
                                  0
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase text-gray-500">
                                Additional info
                              </p>
                              <p>Blood type: {patient.bloodType || "N/A"}</p>
                              <p>
                                Lab samples:{" "}
                                {getPatientProperty(
                                  patient,
                                  "labSampleCount",
                                  0
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    No patients match the current filters.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle>Care summary</CardTitle>
                <p className="text-sm text-gray-500">
                  Key indicators and quick actions for the selected patient.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedPatient ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {(isPatientDetailResponse(selectedPatient)
                          ? (selectedPatient as any).accountInfo?.username
                          : null) ||
                          selectedPatient.fullName ||
                          selectedPatient.patientCode ||
                          "Unnamed patient"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Account ID: {getLast4Chars(selectedPatient.accountId)}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                          {careStatus}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                          {getAccountStatus(selectedPatient).label}
                        </span>
                      </div>
                    </div>

                    {quickStats.length ? (
                      <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                        {quickStats.map((stat) => (
                          <div
                            key={stat.label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-gray-500">{stat.label}</span>
                            <span className="font-semibold text-gray-900">
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <section className="space-y-3 text-sm text-gray-700">
                      <p className="text-sm font-semibold text-gray-900">
                        Contact details
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatient)
                              ? (selectedPatient as any).accountInfo?.email
                              : null) ||
                              selectedPatient.email ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatient)
                              ? (selectedPatient as any).accountInfo?.phone
                              : null) ||
                              selectedPatient.phoneNumber ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Emergency contact</p>
                          <p>
                            {getPatientProperty(
                              selectedPatient,
                              "emergencyContact",
                              "Not provided"
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getPatientProperty(
                              selectedPatient,
                              "emergencyPhone",
                              "—"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Insurance</p>
                          <p>
                            {getPatientProperty(
                              selectedPatient,
                              "insurance",
                              "Not recorded"
                            )}
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          Latest treatment activity
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/doctor/treatment-cycles",
                              search: { patientId: selectedPatient.id },
                            })
                          }
                        >
                          View treatment cycles
                        </Button>
                      </div>
                      {selectedPatientCyclesLoading ? (
                        <p className="text-sm text-gray-500">
                          Loading treatment cycles...
                        </p>
                      ) : orderedCycles.length ? (
                        <div className="space-y-2">
                          {orderedCycles.slice(0, 3).map((cycle) => (
                            <div
                              key={cycle.id}
                              className="rounded-md border border-gray-200 p-3 text-sm text-gray-700"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-gray-900">
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
                              {cycle.notes ? (
                                <p className="mt-1 text-xs text-gray-600">
                                  {cycle.notes}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No treatment cycles recorded yet.
                        </p>
                      )}
                    </section>

                    <section className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Quick actions
                      </p>
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            handleOpenPatientDetailModal(selectedPatient.id)
                          }
                        >
                          View full patient record
                        </Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/doctor/encounters/create",
                              search: {
                                patientId: selectedPatient.id,
                                accountId:
                                  selectedPatient.accountId ?? undefined,
                              } as any,
                            })
                          }
                        >
                          Create encounter
                        </Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/doctor/prescriptions",
                              search: { patientId: selectedPatient.id },
                            })
                          }
                        >
                          Order prescription or service
                        </Button>
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    Select a patient to see their care summary.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Displaying {patients.length} of {total} patients
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
                Page {page} / {totalPages}
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
      <DoctorPatientDetailModal
        patientId={detailModalPatientId}
        isOpen={Boolean(detailModalPatientId)}
        onClose={() => setDetailModalPatientId(null)}
        onOpenFullProfile={handleNavigateToPatientProfile}
      />
    </ProtectedRoute>
  );
}
