import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { RefreshCw, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type {
  PaginatedResponse,
  TreatmentCycle,
  UserDetailResponse,
  Relationship,
} from "@/api/types";
import { normalizeTreatmentCycleStatus } from "@/api/types";
import { cn } from "@/utils/cn";
import { DoctorPatientDetailModal } from "@/features/doctor/patients/DoctorPatientDetailModal";
import {
  isPatientDetailResponse,
  getPatientProperty,
} from "@/utils/patient-helpers";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { usePatientDetails } from "@/hooks/usePatientDetails";

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

  // Fetch user details for all patients to get dob and gender
  const userDetailsQueries = useQueries({
    queries: patients.map((patient) => ({
      queryKey: ["doctor", "patients", patient.id, "user-details"],
      enabled: Boolean(patient.id || patient.accountId),
      retry: false,
      queryFn: async (): Promise<UserDetailResponse | null> => {
        const accountId = patient.accountId || patient.id;
        if (!accountId) {
          return null;
        }
        try {
          const response = await api.user.getUserDetails(accountId);
          return response.data ?? null;
        } catch (error) {
          if (
            isAxiosError(error) &&
            (error.response?.status === 404 || error.response?.status === 403)
          ) {
            return null;
          }
          console.warn(
            "[DoctorPatients] Unable to load user details",
            accountId,
            error
          );
          return null;
        }
      },
    })),
  });

  // Create a map of patientId -> userDetails for quick lookup
  const userDetailsMap = useMemo(() => {
    const map = new Map<string, UserDetailResponse | null>();
    userDetailsQueries.forEach((query, index) => {
      const patient = patients[index];
      if (patient) {
        map.set(patient.id, query.data ?? null);
      }
    });
    return map;
  }, [userDetailsQueries, patients]);

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

  // Get user details for selected patient
  const selectedPatientUserDetails = useMemo(() => {
    if (!selectedPatientId) return null;
    return userDetailsMap.get(selectedPatientId) ?? null;
  }, [selectedPatientId, userDetailsMap]);

  // Fetch full patient details for selected patient
  const {
    data: selectedPatientDetails,
    // isLoading: selectedPatientDetailsLoading,
  } = usePatientDetails(selectedPatientId, Boolean(selectedPatientId));

  // Fetch relationships for partner information
  const {
    data: relationshipsResponse,
    // isLoading: relationshipsLoading,
  } = useQuery({
    enabled: Boolean(selectedPatientId),
    queryKey: ["doctor", "patients", selectedPatientId, "relationships"],
    retry: false,
    queryFn: async () => {
      if (!selectedPatientId) return null;
      try {
        const response = await api.relationship.getRelationships(
          selectedPatientId
        );
        return response.data ?? [];
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 || error.response?.status === 403)
        ) {
          return [];
        }
        console.warn("Failed to fetch relationships:", error);
        return [];
      }
    },
  });

  const relationships = relationshipsResponse ?? [];

  // Get active partner relationship (Married or Unmarried)
  const partnerRelationship = useMemo(() => {
    if (!relationships || relationships.length === 0) return null;
    return relationships.find(
      (rel: Relationship) =>
        (rel.relationshipType === "Married" ||
          rel.relationshipType === "Unmarried") &&
        rel.isActive !== false
    ) as Relationship | undefined;
  }, [relationships]);

  // Get partner info from relationship
  const partnerInfo = useMemo(() => {
    if (!partnerRelationship || !selectedPatientId) return null;
    // Determine which patient is the partner
    const isPatient1 = partnerRelationship.patient1Id === selectedPatientId;
    return isPatient1
      ? partnerRelationship.patient2Info
      : partnerRelationship.patient1Info;
  }, [partnerRelationship, selectedPatientId]);

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
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
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
                    Search by patient code
                  </label>
                  <Input
                    value={searchTerm}
                    placeholder="e.g. PAT001"
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
                      const userDetails = userDetailsMap.get(patient.id);
                      const displayName =
                        (isDetail
                          ? (patient as any).accountInfo?.username
                          : null) ||
                        (patient.firstName && patient.lastName
                          ? `${patient.firstName} ${patient.lastName}`.trim()
                          : patient.firstName || patient.lastName) ||
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
                      
                      // Get date of birth from userDetails or patient
                      const dateOfBirth = userDetails?.dob
                        ? formatDate(userDetails.dob)
                        : patient.dateOfBirth
                          ? formatDate(patient.dateOfBirth)
                          : "—";
                      
                      // Get gender from userDetails or patient
                      const gender = userDetails?.gender !== undefined
                        ? userDetails.gender ? "Male" : "Female"
                        : patient.gender || "—";
                      
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
                        <div
                          key={patient.id}
                          className={cn(
                            "w-full rounded-lg border p-4 transition",
                            selectedPatientId === patient.id
                              ? "border-primary bg-primary/5 shadow"
                              : "border-gray-200"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedPatientId(patient.id)}
                            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                                  Demographics
                                </p>
                                <p>DOB: {dateOfBirth}</p>
                                <p>Gender: {gender}</p>
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
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-3">
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
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPatientDetailModal(patient.id);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Detail
                            </Button>
                          </div>
                        </div>
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
                        {getFullNameFromObject(selectedPatientUserDetails) ||
                          (isPatientDetailResponse(selectedPatient)
                            ? (selectedPatient as any).accountInfo?.username
                            : null) ||
                          getFullNameFromObject(selectedPatient) ||
                          selectedPatient.patientCode ||
                          "Unnamed patient"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Patient Code: {selectedPatient.patientCode ?? "—"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Account ID: {getLast4Chars(selectedPatient.accountId)}
                      </p>
                      <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
                        <div>
                          <p>
                            <span className="font-medium">Date of Birth:</span>{" "}
                            {selectedPatientUserDetails?.dob
                              ? formatDate(selectedPatientUserDetails.dob)
                              : selectedPatientDetails?.dateOfBirth
                                ? formatDate(selectedPatientDetails.dateOfBirth)
                                : selectedPatient.dateOfBirth
                                  ? formatDate(selectedPatient.dateOfBirth)
                                  : "—"}
                          </p>
                          <p>
                            <span className="font-medium">Gender:</span>{" "}
                            {selectedPatientUserDetails?.gender !== undefined
                              ? selectedPatientUserDetails.gender
                                ? "Male"
                                : "Female"
                              : selectedPatientDetails?.gender ||
                                  selectedPatient.gender ||
                                  "—"}
                          </p>
                          <p>
                            <span className="font-medium">Citizen ID:</span>{" "}
                            {selectedPatientDetails?.nationalId ||
                              selectedPatient.nationalId ||
                              "—"}
                          </p>
                          <p>
                            <span className="font-medium">Occupation:</span>{" "}
                            {isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.occupation || "Not provided"
                              : "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Blood Type:</span>{" "}
                            {selectedPatientDetails?.bloodType ||
                              selectedPatient.bloodType ||
                              "Not recorded"}
                          </p>
                          {isPatientDetailResponse(selectedPatientDetails) &&
                            selectedPatientDetails.height && (
                              <p>
                                <span className="font-medium">Height:</span>{" "}
                                {selectedPatientDetails.height} cm
                              </p>
                            )}
                          {isPatientDetailResponse(selectedPatientDetails) &&
                            selectedPatientDetails.weight && (
                              <p>
                                <span className="font-medium">Weight:</span>{" "}
                                {selectedPatientDetails.weight} kg
                              </p>
                            )}
                          {isPatientDetailResponse(selectedPatientDetails) &&
                            selectedPatientDetails.bmi && (
                              <p>
                                <span className="font-medium">BMI:</span>{" "}
                                {selectedPatientDetails.bmi.toFixed(1)}
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                          {careStatus}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                          {getAccountStatus(selectedPatient).label}
                        </span>
                        {selectedPatientDetails?.bloodType && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-700">
                            Blood: {selectedPatientDetails.bloodType}
                          </span>
                        )}
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
                        Contact & coverage
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.accountInfo?.email
                              : null) ||
                              selectedPatient?.email ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.accountInfo?.phone
                              : null) ||
                              selectedPatient?.phoneNumber ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Address</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.accountInfo?.address
                              : null) ||
                              (isPatientDetailResponse(selectedPatientDetails)
                                ? selectedPatientDetails.address
                                : null) ||
                              selectedPatient.address ||
                              "Not provided"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Insurance</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.insurance
                              : null) ||
                              getPatientProperty(
                                selectedPatient,
                                "insurance",
                                "Not recorded"
                              )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Emergency contact</p>
                          <p>
                            {(isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.emergencyContact
                              : null) ||
                              getPatientProperty(
                                selectedPatient,
                                "emergencyContact",
                                "Not provided"
                              )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(isPatientDetailResponse(selectedPatientDetails)
                              ? selectedPatientDetails.emergencyPhone
                              : null) ||
                              getPatientProperty(
                                selectedPatient,
                                "emergencyPhone",
                                "—"
                              )}
                          </p>
                        </div>
                      </div>
                    </section>

                    {isPatientDetailResponse(selectedPatientDetails) &&
                      (selectedPatientDetails.medicalHistory ||
                        selectedPatientDetails.allergies) && (
                        <section className="space-y-3 text-sm text-gray-700">
                          <p className="text-sm font-semibold text-gray-900">
                            Medical information
                          </p>
                          <div className="grid gap-2">
                            {selectedPatientDetails.medicalHistory && (
                              <div>
                                <p className="text-gray-500">Medical history</p>
                                <p className="whitespace-pre-wrap">
                                  {selectedPatientDetails.medicalHistory}
                                </p>
                              </div>
                            )}
                            {selectedPatientDetails.allergies && (
                              <div>
                                <p className="text-gray-500">Allergies</p>
                                <p className="whitespace-pre-wrap">
                                  {selectedPatientDetails.allergies}
                                </p>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                    {partnerInfo && (
                      <section className="space-y-3 text-sm text-gray-700">
                        <p className="text-sm font-semibold text-gray-900">
                          Partner information
                        </p>
                        <div className="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                          <div>
                            <p className="text-gray-500">Partner name</p>
                            <p className="font-medium">{partnerInfo.fullName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Relationship type</p>
                            <p>
                              {partnerRelationship?.relationshipTypeName ||
                                partnerRelationship?.relationshipType ||
                                "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Partner patient code</p>
                            <p>{partnerInfo.patientCode}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Partner citizen ID</p>
                            <p>{partnerInfo.nationalId}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Partner email</p>
                            <p>{partnerInfo.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Partner phone</p>
                            <p>{partnerInfo.phone}</p>
                          </div>
                          {partnerRelationship?.establishedDate && (
                            <div>
                              <p className="text-gray-500">
                                Relationship established
                              </p>
                              <p>
                                {formatDate(partnerRelationship.establishedDate)}
                              </p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

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
                          variant="default"
                          type="button"
                          onClick={() =>
                            handleNavigateToPatientProfile(selectedPatient.id)
                          }
                          className="w-full"
                        >
                          View full patient profile
                        </Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            handleOpenPatientDetailModal(selectedPatient.id)
                          }
                          className="w-full"
                        >
                          Quick view patient details
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
                          className="w-full"
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
                          className="w-full"
                        >
                          Create prescription
                        </Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/doctor/treatment-cycles",
                              search: { patientId: selectedPatient.id },
                            })
                          }
                          className="w-full"
                        >
                          View treatment cycles
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
