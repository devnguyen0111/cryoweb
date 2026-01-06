import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import type {
  PaginatedResponse,
  Medicine,
  Prescription,
  CreatePrescriptionRequest,
  Patient,
  MedicalRecord,
  PatientDetailResponse,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { PrescriptionDetailModal } from "@/features/doctor/prescriptions/PrescriptionDetailModal";
import { createEmptyPaginatedResponse } from "@/utils/api-helpers";

type PrescriptionMedication = {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  notes: string;
};

type PrescriptionFormValues = {
  medicalRecordId: string;
  diagnosis: string;
  medications: PrescriptionMedication[];
  instructions: string;
};

type PrescriptionSearchState = {
  patientId?: string;
  medicalRecordId?: string;
};


export const Route = createFileRoute("/doctor/prescriptions")({
  component: DoctorPrescriptionComponent,
  validateSearch: (
    search: { patientId?: string; medicalRecordId?: string } = {}
  ) => search,
});

function DoctorPrescriptionComponent() {
  const search = Route.useSearch() as PrescriptionSearchState;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [viewPrescriptionId, setViewPrescriptionId] = useState<string | null>(
    null
  );

  // Filter states
  const [medicalRecordIdFilter, setMedicalRecordIdFilter] = useState(
    search.medicalRecordId || ""
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientCodeSearch, setPatientCodeSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // "all", "filled", "pending"

  // Update medicalRecordIdFilter when search param changes
  useEffect(() => {
    if (search.medicalRecordId) {
      setMedicalRecordIdFilter(search.medicalRecordId);
    }
  }, [search.medicalRecordId]);

  const form = useForm<PrescriptionFormValues>({
    defaultValues: {
      medicalRecordId: search.medicalRecordId || "",
      diagnosis: "",
      medications: [
        {
          medicineId: "",
          name: "",
          dosage: "",
          frequency: "",
          durationDays: 0,
          quantity: 1,
          notes: "",
        },
      ],
      instructions: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const { data: medicineList, isFetching: medicinesLoading } = useQuery<
    PaginatedResponse<Medicine>
  >({
    queryKey: ["medicines", "doctor-prescriptions"],
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<Medicine>> => {
      try {
        const response = await api.medicine.getMedicines({
          pageNumber: 1,
          pageSize: 100,
        });
        return response;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<Medicine>();
        }
        const message =
          error?.response?.data?.message || "Unable to load medicines.";
        toast.error(message);
        return createEmptyPaginatedResponse<Medicine>();
      }
    },
  });

  // Filter active medicines only
  const medicineOptions = useMemo(() => {
    return (medicineList?.data ?? []).filter(
      (medicine) => medicine.isActive !== false
    );
  }, [medicineList?.data]);

  const medicineMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    medicineOptions.forEach((medicine) => {
      if (medicine.id) {
        map.set(medicine.id, medicine);
      }
    });
    return map;
  }, [medicineOptions]);
  const createPrescriptionMutation = useMutation({
    mutationFn: (payload: CreatePrescriptionRequest) =>
      api.prescription.createPrescription(payload),
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to create prescription. Please try again.";
      toast.error(message);
    },
  });

  // Build filter params
  const filterParams = useMemo(() => {
    const params: any = {
      Page: 1,
      Size: 25,
    };

    if (medicalRecordIdFilter) {
      params.MedicalRecordId = medicalRecordIdFilter;
    }

    if (dateFrom) {
      params.FromDate = new Date(dateFrom).toISOString();
    }

    if (dateTo) {
      // Set to end of day
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      params.ToDate = toDate.toISOString();
    }

    return params;
  }, [medicalRecordIdFilter, dateFrom, dateTo]);

  const prescriptionsQuery = useQuery<PaginatedResponse<Prescription>>({
    queryKey: ["prescriptions", "doctor-prescriptions", filterParams],
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    queryFn: async (): Promise<PaginatedResponse<Prescription>> => {
      try {
        const response = await api.prescription.getPrescriptions(filterParams);
        return response;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyPaginatedResponse<Prescription>();
        }
        const message =
          error?.response?.data?.message || "Unable to load prescriptions.";
        toast.error(message);
        return createEmptyPaginatedResponse<Prescription>();
      }
    },
  });

  const prescriptions = prescriptionsQuery.data;
  const prescriptionsLoading = prescriptionsQuery.isFetching;
  const allPrescriptionRows = prescriptions?.data ?? [];

  // Extract unique medical record IDs from prescriptions (use allPrescriptionRows to avoid circular dependency)
  const medicalRecordIds = useMemo(() => {
    if (!allPrescriptionRows) return [];
    return Array.from(
      new Set(
        allPrescriptionRows
          .map((prescription) => prescription.medicalRecordId)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [allPrescriptionRows]);

  // Fetch medical records to get patientId
  const medicalRecordsQuery = useQuery<
    Record<string, MedicalRecord & { patientId?: string }>
  >({
    queryKey: ["medical-records", "by-ids", medicalRecordIds, "prescriptions"],
    enabled: medicalRecordIds.length > 0,
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    queryFn: async () => {
      const results: Record<string, MedicalRecord & { patientId?: string }> =
        {};
      await Promise.all(
        medicalRecordIds.map(async (id) => {
          try {
            const response = await api.medicalRecord.getMedicalRecordById(id);
            if (response.data) {
              const record = response.data as MedicalRecord & {
                patientId?: string;
              };
              results[id] = record;
            }
          } catch (error) {
            // Ignore errors for individual medical records
            console.warn(`Failed to fetch medical record ${id}:`, error);
          }
        })
      );
      return results;
    },
  });

  // Extract patient IDs from medical records
  const patientIds = useMemo(() => {
    const ids: string[] = [];
    const medicalRecords = medicalRecordsQuery.data ?? {};
    Object.values(medicalRecords).forEach((record) => {
      const patientId =
        (record as any)?.patientId ?? (record as any)?.PatientId ?? null;
      if (patientId) {
        ids.push(patientId);
      }
    });
    return Array.from(new Set(ids));
  }, [medicalRecordsQuery.data]);

  // Fetch patient details
  const patientQueries = useQueries({
    queries: patientIds.map((patientId) => ({
      queryKey: ["doctor", "patient", patientId, "prescriptions"],
      staleTime: 60000, // Cache for 1 minute
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
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
      enabled: patientIds.length > 0,
      retry: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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

  // Apply status filter and patient code search client-side
  const prescriptionRows = useMemo(() => {
    let filtered = allPrescriptionRows;

    // Apply status filter
    if (statusFilter === "filled") {
      filtered = filtered.filter((p) => p.isFilled);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((p) => !p.isFilled);
    }

    // Apply patient code search filter
    if (patientCodeSearch) {
      const searchLower = patientCodeSearch.toLowerCase().trim();
      filtered = filtered.filter((prescription) => {
        // Get medical record for this prescription
        const medicalRecord = prescription.medicalRecordId
          ? medicalRecordsQuery.data?.[prescription.medicalRecordId]
          : null;

        // Get patientId from medical record
        const patientId = medicalRecord
          ? ((medicalRecord as any)?.patientId ??
            (medicalRecord as any)?.PatientId ??
            null)
          : null;

        // Get patient from patients map
        const patient = patientId ? patientsMap.get(patientId) : null;
        const patientCode = patient?.patientCode || "";

        return patientCode.toLowerCase().includes(searchLower);
      });
    }

    return filtered;
  }, [
    allPrescriptionRows,
    statusFilter,
    patientCodeSearch,
    medicalRecordsQuery.data,
    patientsMap,
  ]);

  const resetFilters = () => {
    setMedicalRecordIdFilter("");
    setDateFrom("");
    setDateTo("");
    setPatientCodeSearch("");
    setStatusFilter("all");
  };

  const onSubmit = (values: PrescriptionFormValues) => {
    if (!values.medicalRecordId) {
      toast.error("Medical Record ID is required.");
      return;
    }

    const prescriptionDetails = values.medications
      .filter((item) => item.medicineId)
      .map((item) => {
        return {
          medicineId: item.medicineId,
          quantity: item.quantity || 1,
          dosage: item.dosage || undefined,
          frequency: item.frequency || undefined,
          durationDays: item.durationDays || undefined,
          instructions: item.notes || undefined,
          notes: item.notes || undefined,
        };
      });

    if (!prescriptionDetails.length) {
      toast.error("Select at least one medicine.");
      return;
    }

    const payload: CreatePrescriptionRequest = {
      medicalRecordId: values.medicalRecordId,
      prescriptionDate: new Date().toISOString(),
      diagnosis: values.diagnosis || undefined,
      instructions: values.instructions || undefined,
      notes: values.instructions || values.diagnosis || undefined,
      prescriptionDetails,
    };

    createPrescriptionMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Prescription created successfully.");
        form.reset({
          medicalRecordId: search.medicalRecordId || "",
          diagnosis: "",
          medications: [
            {
              medicineId: "",
              name: "",
              dosage: "",
              frequency: "",
              durationDays: 0,
              quantity: 1,
              notes: "",
            },
          ],
          instructions: "",
        });
        setIsPreviewing(false);
        setIsCreateModalOpen(false);
        prescriptionsQuery.refetch();
      },
    });
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Prescription management</h1>
            <p className="text-gray-600">
              Draft, sign, and deliver e-prescriptions to patients. PDF export
              and SMS notifications are supported.
            </p>
          </section>

          {/* Advanced Filters */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Advanced filters</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    Create Prescription
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="filled">Filled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medical Record ID
                  </label>
                  <Input
                    placeholder="Filter by medical record ID"
                    value={medicalRecordIdFilter}
                    onChange={(event) =>
                      setMedicalRecordIdFilter(event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    From date
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    To date
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
                    Search patient code
                  </label>
                  <Input
                    placeholder="e.g. PAT001"
                    value={patientCodeSearch}
                    onChange={(event) =>
                      setPatientCodeSearch(event.target.value)
                    }
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent prescriptions</CardTitle>
                <p className="text-sm text-gray-500">
                  Track prescriptions that are still pending signature or
                  fulfillment.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {prescriptionsLoading ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Loading data...
                </div>
              ) : prescriptionRows.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">
                          Prescription ID
                        </th>
                        <th className="px-4 py-3 font-medium">Patient</th>
                        <th className="px-4 py-3 font-medium">
                          Prescription Date
                        </th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {prescriptionRows.map((item: Prescription) => {
                        // Get medical record for this prescription
                        const medicalRecord = item.medicalRecordId
                          ? medicalRecordsQuery.data?.[item.medicalRecordId]
                          : null;

                        // Get patientId from medical record
                        const patientId = medicalRecord
                          ? ((medicalRecord as any)?.patientId ??
                            (medicalRecord as any)?.PatientId ??
                            null)
                          : null;

                        // Get patient from patients map
                        const patient = patientId
                          ? patientsMap.get(patientId)
                          : null;

                        // Get patient name with priority: accountInfo > patient object
                        const patientName = (() => {
                          if (!patient) return "";
                          const patientWithAccount = patient as any;
                          // Try to get name from accountInfo first (if PatientDetailResponse)
                          if (patientWithAccount.accountInfo) {
                            const accountFullName = getFullNameFromObject(
                              patientWithAccount.accountInfo
                            );
                            if (accountFullName) return accountFullName;
                          }
                          // Fallback to patient object directly
                          return getFullNameFromObject(patient);
                        })();
                        const patientCode = patient?.patientCode || null;
                        const patientIndex = patientId
                          ? patientIds.findIndex((id) => id === patientId)
                          : -1;
                        const isPatientLoading =
                          patientIndex >= 0
                            ? patientQueries[patientIndex]?.isLoading
                            : false;

                        const formattedDate = item.prescriptionDate
                          ? new Date(item.prescriptionDate).toLocaleString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "-";

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {getLast4Chars(item.id)}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
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
                              ) : isPatientLoading ? (
                                <>
                                  <div className="font-semibold">
                                    Loading...
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {patientId && (
                                      <>ID: {getLast4Chars(patientId)}</>
                                    )}
                                  </p>
                                </>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formattedDate}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {item.isFilled ? "Filled" : "Pending"}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewPrescriptionId(item.id);
                                }}
                              >
                                View detail
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  No prescriptions found.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Prescription Modal */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              form.reset({
                medicalRecordId: search.medicalRecordId || "",
                diagnosis: "",
                medications: [
                  {
                    medicineId: "",
                    name: "",
                    dosage: "",
                    frequency: "",
                    durationDays: 0,
                    quantity: 1,
                    notes: "",
                  },
                ],
                instructions: "",
              });
              setIsPreviewing(false);
            }}
            title="Create new prescription"
            description="Draft, sign, and deliver e-prescriptions to patients."
            size="xl"
          >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medical Record ID
                  </label>
                  <Input
                    placeholder="Enter the medical record identifier"
                    {...form.register("medicalRecordId", { required: true })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Describe the diagnosis and treatment status"
                    {...form.register("diagnosis")}
                  />
                </div>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">
                    Medications &amp; dosing
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        medicineId: "",
                        name: "",
                        dosage: "",
                        frequency: "",
                        durationDays: 0,
                        quantity: 1,
                        notes: "",
                      })
                    }
                  >
                    Add medication
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid gap-4 rounded-lg border border-gray-100 p-4 md:grid-cols-2"
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Medicine (catalog)
                        </label>
                        <select
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          {...form.register(
                            `medications.${index}.medicineId` as const,
                            {
                              required: true,
                              onChange: (e) => {
                                const medicine = medicineOptions.find(
                                  (m) => m.id === e.target.value
                                );
                                if (medicine) {
                                  form.setValue(
                                    `medications.${index}.name` as const,
                                    medicine.name
                                  );
                                  if (medicine.dosage) {
                                    form.setValue(
                                      `medications.${index}.dosage` as const,
                                      medicine.dosage
                                    );
                                  }
                                }
                              },
                            }
                          )}
                        >
                          <option value="">
                            {medicinesLoading
                              ? "Loading..."
                              : "Select medicine"}
                          </option>
                          {medicineOptions.map((medicine: Medicine) => (
                            <option key={medicine.id} value={medicine.id}>
                              {medicine.name}
                              {medicine.genericName
                                ? ` (${medicine.genericName})`
                                : ""}
                              {medicine.form ? ` - ${medicine.form}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Medication name
                        </label>
                        <Input
                          placeholder="Ex: Utrogestan 200mg"
                          {...form.register(
                            `medications.${index}.name` as const,
                            {
                              required: true,
                            }
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Dose per administration
                        </label>
                        <Input
                          placeholder="2 capsules"
                          {...form.register(
                            `medications.${index}.dosage` as const
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Frequency
                        </label>
                        <Input
                          placeholder="Twice daily"
                          {...form.register(
                            `medications.${index}.frequency` as const
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Duration (days)
                        </label>
                        <Input
                          type="number"
                          placeholder="14"
                          min="1"
                          {...form.register(
                            `medications.${index}.durationDays` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          placeholder="1"
                          min="1"
                          {...form.register(
                            `medications.${index}.quantity` as const,
                            {
                              valueAsNumber: true,
                            }
                          )}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <textarea
                          className="min-h-[80px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Administration guidance, interactions, timing..."
                          {...form.register(
                            `medications.${index}.notes` as const
                          )}
                        />
                      </div>
                      {fields.length > 1 && (
                        <div className="md:col-span-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            Remove this medication
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Medication instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Remind patient about timing, lifestyle considerations, and follow-ups..."
                    {...form.register("instructions")}
                  />
                </CardContent>
              </Card>

              {isPreviewing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Prescription preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-700">
                    <p>
                      Medical Record:{" "}
                      {form.watch("medicalRecordId") || "Not provided"}
                    </p>
                    <p>
                      Diagnosis: {form.watch("diagnosis") || "Not provided"}
                    </p>
                    <div>
                      <p className="font-semibold">Medications:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {form.watch("medications").map((med, index) => (
                          <li key={`preview-${index}`}>
                            {medicineMap.get(med.medicineId)?.name ||
                              med.name ||
                              "(No medicine selected)"}{" "}
                            {med.dosage ? `- ${med.dosage}` : ""}{" "}
                            {med.frequency ? `- ${med.frequency}` : ""}{" "}
                            {med.durationDays
                              ? `- ${med.durationDays} days`
                              : ""}{" "}
                            {med.quantity ? `(Qty: ${med.quantity})` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p>
                      Instructions:{" "}
                      {form.watch("instructions") || "Not provided"}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewing((prev) => !prev)}
                >
                  {isPreviewing ? "Hide preview" : "Show preview"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    form.reset({
                      medicalRecordId: search.medicalRecordId || "",
                      diagnosis: "",
                      medications: [
                        {
                          medicineId: "",
                          name: "",
                          dosage: "",
                          frequency: "",
                          durationDays: 0,
                          quantity: 1,
                          notes: "",
                        },
                      ],
                      instructions: "",
                    });
                    setIsPreviewing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPrescriptionMutation.isPending}
                >
                  {createPrescriptionMutation.isPending
                    ? "Saving..."
                    : "Save prescription"}
                </Button>
              </div>
            </form>
          </Modal>

          {/* View Prescription Detail Modal */}
          <PrescriptionDetailModal
            prescriptionId={viewPrescriptionId}
            isOpen={Boolean(viewPrescriptionId)}
            onClose={() => setViewPrescriptionId(null)}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
