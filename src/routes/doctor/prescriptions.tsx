import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type {
  PaginatedResponse,
  Medicine,
  Prescription,
  CreatePrescriptionRequest,
  Patient,
  MedicalRecord,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";

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

const createEmptyResponse = <T,>(): PaginatedResponse<T> => ({
  code: 200,
  message: "Success",
  data: [],
  metaData: {
    totalCount: 0,
    pageNumber: 1,
    pageSize: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  },
});

export const Route = createFileRoute("/doctor/prescriptions")({
  component: DoctorPrescriptionComponent,
  validateSearch: (
    search: { patientId?: string; medicalRecordId?: string } = {}
  ) => search,
});

function DoctorPrescriptionComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch() as PrescriptionSearchState;
  const [isPreviewing, setIsPreviewing] = useState(false);

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
          return createEmptyResponse<Medicine>();
        }
        const message =
          error?.response?.data?.message || "Unable to load medicines.";
        toast.error(message);
        return createEmptyResponse<Medicine>();
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

  const prescriptionsQuery = useQuery<PaginatedResponse<Prescription>>({
    queryKey: ["prescriptions", "doctor-prescriptions", search.medicalRecordId],
    retry: false,
    queryFn: async (): Promise<PaginatedResponse<Prescription>> => {
      try {
        const response = await api.prescription.getPrescriptions({
          MedicalRecordId: search.medicalRecordId,
          Page: 1,
          Size: 25,
        });
        return response;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyResponse<Prescription>();
        }
        const message =
          error?.response?.data?.message || "Unable to load prescriptions.";
        toast.error(message);
        return createEmptyResponse<Prescription>();
      }
    },
  });

  const prescriptions = prescriptionsQuery.data;
  const prescriptionsLoading = prescriptionsQuery.isFetching;
  const prescriptionRows = prescriptions?.data ?? [];

  // Extract unique medical record IDs from prescriptions
  const medicalRecordIds = useMemo(() => {
    if (!prescriptionRows) return [];
    return Array.from(
      new Set(
        prescriptionRows
          .map((prescription) => prescription.medicalRecordId)
          .filter((id): id is string => Boolean(id))
      )
    );
  }, [prescriptionRows]);

  // Fetch medical records to get patientId
  const medicalRecordsQuery = useQuery<
    Record<string, MedicalRecord & { patientId?: string }>
  >({
    queryKey: ["medical-records", "by-ids", medicalRecordIds, "prescriptions"],
    enabled: medicalRecordIds.length > 0,
    retry: false,
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
  const { data: patientsMap } = useQuery<Record<string, Patient>>({
    queryKey: ["patients", "by-ids", patientIds, "prescriptions"],
    enabled: patientIds.length > 0,
    retry: false,
    queryFn: async () => {
      const results: Record<string, Patient> = {};
      await Promise.all(
        patientIds.map(async (id) => {
          try {
            const response = await api.patient.getPatientDetails(id);
            if (response.data) {
              results[id] = response.data as Patient;
            }
          } catch (error) {
            // Try fallback to getPatientById
            try {
              const fallback = await api.patient.getPatientById(id);
              if (fallback.data) {
                results[id] = fallback.data;
              }
            } catch {
              // Ignore errors for individual patients
              console.warn(`Failed to fetch patient ${id}:`, error);
            }
          }
        })
      );
      return results;
    },
  });

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
          medicalRecordId: values.medicalRecordId,
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

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent prescriptions</CardTitle>
                <p className="text-sm text-gray-500">
                  Track prescriptions that are still pending signature or
                  fulfillment.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Advanced filtering will be added soon.")
                }
              >
                Advanced filters
              </Button>
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
                          ? patientsMap?.[patientId]
                          : null;

                        const patientName =
                          patient?.fullName ||
                          (patient as any)?.accountInfo?.username ||
                          patient?.patientCode ||
                          (patientId ? getLast4Chars(patientId) : "-");
                        const patientCode = patient?.patientCode
                          ? ` (${patient.patientCode})`
                          : "";

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
                          <tr
                            key={item.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              // Navigate to prescription detail or medical record
                              navigate({
                                to: "/doctor/medical-records",
                                search: {},
                              });
                            }}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {getLast4Chars(item.id)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {patientName}
                              {patientCode}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {formattedDate}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {item.isFilled ? "Filled" : "Pending"}
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

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create new prescription</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medications &amp; dosing</CardTitle>
                <Button
                  type="button"
                  variant="outline"
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
                          {medicinesLoading ? "Loading..." : "Select medicine"}
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
                <CardTitle>Medication instructions</CardTitle>
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
                  <CardTitle>Prescription preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <p>
                    Medical Record:{" "}
                    {form.watch("medicalRecordId") || "Not provided"}
                  </p>
                  <p>Diagnosis: {form.watch("diagnosis") || "Not provided"}</p>
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
                          {med.durationDays ? `- ${med.durationDays} days` : ""}{" "}
                          {med.quantity ? `(Qty: ${med.quantity})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p>
                    Instructions: {form.watch("instructions") || "Not provided"}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewing((prev) => !prev)}
              >
                {isPreviewing ? "Hide preview" : "Show preview"}
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
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
