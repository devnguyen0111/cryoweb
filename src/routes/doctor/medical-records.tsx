import { useState, useMemo, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import { CreateMedicalRecordForm } from "@/features/doctor/medical-records/CreateMedicalRecordForm";
import { DoctorAppointmentDetailModal } from "@/features/doctor/appointments/DoctorAppointmentDetailModal";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";
import type {
  PaginatedResponse,
  MedicalRecord,
  MedicalRecordDetailResponse,
  UpdateMedicalRecordRequest,
} from "@/api/types";

export const Route = createFileRoute("/doctor/medical-records")({
  component: DoctorMedicalRecordsComponent,
  validateSearch: (search: { q?: string; appointmentId?: string } = {}) =>
    search,
});

const createEmptyResponse = <T,>(): PaginatedResponse<T> => ({
  code: 200,
  message: "",
  data: [],
  metaData: {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  },
});

function DoctorMedicalRecordsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState(search.q ?? "");
  const [appointmentIdFilter, setAppointmentIdFilter] = useState(
    search.appointmentId ?? ""
  );
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateMedicalRecordRequest>(
    {}
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [appointmentModalId, setAppointmentModalId] = useState<string | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["doctor", "medical-records"],
      }),
    ]);
    setIsRefreshing(false);
  };

  const filters = useMemo(
    () => ({
      SearchTerm: searchTerm || undefined,
      AppointmentId: appointmentIdFilter || undefined,
      Page: page,
      Size: pageSize,
    }),
    [searchTerm, appointmentIdFilter, page, pageSize]
  );

  const { data, isFetching } = useQuery<PaginatedResponse<MedicalRecord>>({
    queryKey: ["doctor", "medical-records", filters],
    queryFn: async () => {
      try {
        return await api.medicalRecord.getMedicalRecords(filters);
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyResponse<MedicalRecord>();
        }
        const message =
          error?.response?.data?.message || "Unable to load medical records.";
        toast.error(message);
        return createEmptyResponse<MedicalRecord>();
      }
    },
  });

  const { data: selectedRecord } = useQuery<MedicalRecordDetailResponse>({
    queryKey: ["medical-record", selectedRecordId],
    enabled: !!selectedRecordId,
    queryFn: async () => {
      if (!selectedRecordId) throw new Error("No record ID");
      const response =
        await api.medicalRecord.getMedicalRecordById(selectedRecordId);
      return response.data;
    },
  });

  // Fetch appointment details to get patientId if not in record
  const { data: appointmentDetails } = useQuery({
    queryKey: [
      "appointment-details",
      selectedRecord?.appointmentId,
      "medical-record",
    ],
    enabled: !!selectedRecord?.appointmentId && !selectedRecord?.patient,
    queryFn: async () => {
      if (!selectedRecord?.appointmentId) return null;
      try {
        const response = await api.appointment.getAppointmentDetails(
          selectedRecord.appointmentId
        );
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        // Try getAppointmentById as fallback
        try {
          const fallback = await api.appointment.getAppointmentById(
            selectedRecord.appointmentId
          );
          return fallback.data;
        } catch {
          return null;
        }
      }
    },
  });

  // Get patientId from record, appointment in record, or fetched appointment details
  const patientId = useMemo(() => {
    if (!selectedRecord) return null;

    // Try from patient in record
    if (selectedRecord.patient) {
      const patientIdFromPatient =
        (selectedRecord.patient as any)?.id ||
        selectedRecord.patient?.id ||
        (selectedRecord.patient as any)?.accountId;
      if (patientIdFromPatient) return patientIdFromPatient;
    }

    // Try from appointment in record
    if (selectedRecord.appointment) {
      const raw = selectedRecord.appointment as unknown as Record<string, any>;
      const patientIdFromAppointment =
        (selectedRecord.appointment as any)?.patientId ||
        raw.patientID ||
        raw.PatientId ||
        raw.PatientID ||
        raw.patient?.id ||
        raw.patient?.patientId ||
        raw.patient?.accountId ||
        raw.patientAccountId ||
        raw.patientAccountID;
      if (patientIdFromAppointment) return patientIdFromAppointment;
    }

    // Try from fetched appointment details
    if (appointmentDetails) {
      const raw = appointmentDetails as unknown as Record<string, any>;
      const patientIdFromDetails =
        appointmentDetails.patientId ||
        raw.patientID ||
        raw.PatientId ||
        raw.PatientID ||
        raw.patient?.id ||
        raw.patient?.patientId ||
        raw.patient?.accountId ||
        raw.patientAccountId ||
        raw.patientAccountID;
      if (patientIdFromDetails) return patientIdFromDetails;
    }

    return null;
  }, [selectedRecord, appointmentDetails]);

  // Fetch patient details if not included in response
  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", patientId, "medical-record"],
    enabled: !!patientId && !selectedRecord?.patient,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          try {
            const fallback = await api.patient.getPatientById(patientId);
            return fallback.data;
          } catch {
            return null;
          }
        }
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
  });

  // Fetch user details for patient name
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", patientId, "medical-record"],
    enabled: !!patientId,
    queryFn: async () => {
      if (!patientId) return null;
      try {
        const response = await api.user.getUserDetails(patientId);
        return response.data;
      } catch {
        return null;
      }
    },
  });

  // Merge patient data - also check appointment details for patient
  const displayPatient = useMemo(() => {
    if (selectedRecord?.patient) {
      return selectedRecord.patient;
    }
    if ((appointmentDetails as any)?.patient) {
      return (appointmentDetails as any).patient;
    }
    if (patientDetails) {
      return patientDetails;
    }
    return null;
  }, [selectedRecord?.patient, appointmentDetails, patientDetails]);

  const { data: editingRecord } = useQuery<MedicalRecordDetailResponse>({
    queryKey: ["medical-record", editingRecordId],
    enabled: !!editingRecordId,
    queryFn: async () => {
      if (!editingRecordId) throw new Error("No record ID");
      const response =
        await api.medicalRecord.getMedicalRecordById(editingRecordId);
      return response.data;
    },
  });

  // Initialize form data when editing record is loaded
  useEffect(() => {
    if (editingRecord && editingRecordId) {
      setEditFormData({
        chiefComplaint: editingRecord.chiefComplaint || "",
        history: editingRecord.history || "",
        physicalExamination: editingRecord.physicalExamination || "",
        diagnosis: editingRecord.diagnosis || "",
        treatmentPlan: editingRecord.treatmentPlan || "",
        followUpInstructions: editingRecord.followUpInstructions || "",
        vitalSigns: editingRecord.vitalSigns || "",
        labResults: editingRecord.labResults || "",
        imagingResults: editingRecord.imagingResults || "",
        notes: editingRecord.notes || "",
      });
    }
  }, [editingRecord, editingRecordId]);

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMedicalRecordRequest;
    }) => {
      await api.medicalRecord.updateMedicalRecord(id, data);
    },
    onSuccess: () => {
      toast.success("Medical record updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "medical-records"],
      });
      queryClient.invalidateQueries({
        queryKey: ["medical-record"],
      });
      setEditingRecordId(null);
      setEditFormData({});
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to update medical record";
      toast.error(message);
    },
  });

  const records = data?.data ?? [];
  const total = data?.metaData?.totalCount ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;

  // Fetch appointment details for each record to get patient info
  // Only fetch for records currently displayed on the page
  const appointmentIds = useMemo(
    () => Array.from(new Set(records.map((r) => r.appointmentId))),
    [records]
  );

  const appointmentQueries = useQueries({
    queries: appointmentIds.map((appointmentId) => ({
      queryKey: ["appointment-detail", "for-medical-records", appointmentId],
      queryFn: async () => {
        try {
          const response =
            await api.appointment.getAppointmentDetails(appointmentId);
          return { appointmentId, data: response.data };
        } catch (error) {
          // Silently fail - just return null
          return { appointmentId, data: null };
        }
      },
      enabled: !!appointmentId && records.length > 0,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false, // Don't retry on error
    })),
  });

  // Create a map of appointmentId -> patient info
  const appointmentPatientMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string; id: string }>();
    appointmentQueries.forEach((query) => {
      if (query.data?.data?.patient) {
        const patient = query.data.data.patient;
        const name =
          getFullNameFromObject(patient) ||
          patient.patientCode ||
          getLast4Chars(query.data.data.patientId) ||
          "Unknown";
        const code =
          patient.patientCode || getLast4Chars(query.data.data.patientId) || "";
        map.set(query.data.appointmentId, {
          name,
          code,
          id: query.data.data.patientId || patient.id || "",
        });
      }
    });
    return map;
  }, [appointmentQueries]);

  const handleEdit = (id: string) => {
    setEditingRecordId(id);
  };

  const handleSaveEdit = () => {
    if (editingRecordId) {
      updateMutation.mutate({
        id: editingRecordId,
        data: editFormData,
      });
    }
  };

  const handleFieldChange = (
    field: keyof UpdateMedicalRecordRequest,
    value: string
  ) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const truncateText = (text: string | null | undefined, maxLength: number) => {
    if (!text) return "—";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Medical Records</h1>
              <p className="text-gray-600 mt-2">
                Manage and view patient medical records
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
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Create New Record
              </Button>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <Input
                    placeholder="Search by diagnosis, notes, or patient..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Appointment ID
                  </label>
                  <Input
                    placeholder="Filter by appointment ID"
                    value={appointmentIdFilter}
                    onChange={(e) => {
                      setAppointmentIdFilter(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Medical Records</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {total} record{total !== 1 ? "s" : ""} found
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isFetching ? (
                <div className="py-12 text-center text-gray-500">
                  Loading medical records...
                </div>
              ) : records.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Appointment ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Diagnosis
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Chief Complaint
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record) => {
                          const patientInfo = appointmentPatientMap.get(
                            record.appointmentId
                          );
                          return (
                            <tr key={record.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                {getLast4Chars(record.appointmentId)}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {patientInfo ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">
                                      {patientInfo.name}
                                    </span>
                                    {patientInfo.code && (
                                      <span className="text-xs text-gray-500 font-mono">
                                        {patientInfo.code}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">
                                    Loading...
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {truncateText(record.diagnosis, 50)}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {truncateText(record.chiefComplaint, 50)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(record.createdAt)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedRecordId(record.id)
                                    }
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setAppointmentModalId(
                                        record.appointmentId
                                      )
                                    }
                                  >
                                    Appointment
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(record.id)}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mb-4 text-6xl">📋</div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      No medical records found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || appointmentIdFilter
                        ? "Try adjusting your filters"
                        : "No medical records have been created yet"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* View Record Modal */}
        {selectedRecordId && (
          <Modal
            isOpen={!!selectedRecordId}
            onClose={() => setSelectedRecordId(null)}
            title="Medical Record Details"
            size="xl"
          >
            {selectedRecord ? (
              <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Patient Information - Matching Create Medical Record Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {displayPatient && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Patient
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="font-medium text-gray-900">
                            {getFullNameFromObject(userDetails) ||
                              getFullNameFromObject(displayPatient) ||
                              (displayPatient as any)?.accountInfo?.username ||
                              "—"}
                          </p>
                          {displayPatient.patientCode ? (
                            <p className="text-xs text-gray-500 mt-1">
                              Patient Code: {displayPatient.patientCode}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              Patient Code: —
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {!displayPatient && patientId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Patient
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-500 text-sm">
                            Loading patient information...
                          </p>
                        </div>
                      </div>
                    )}
                    {!displayPatient && !patientId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Patient
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-xs text-gray-500">Patient: —</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Patient Code: —
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Appointment
                      </label>
                      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                        <p className="font-medium text-gray-900">
                          {(selectedRecord.appointment as any)
                            ?.appointmentCode ||
                            getLast4Chars(selectedRecord.appointmentId)}
                        </p>
                        {selectedRecord.appointment && (
                          <>
                            <p className="text-xs text-gray-500 mt-1">
                              Date:{" "}
                              {new Date(
                                selectedRecord.appointment.appointmentDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                            {(selectedRecord.appointment as any)?.slot
                              ?.startTime && (
                              <p className="text-xs text-gray-500 mt-1">
                                Time:{" "}
                                {new Date(
                                  `2000-01-01T${(selectedRecord.appointment as any).slot.startTime}`
                                ).toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                            {(selectedRecord.appointment as any)
                              ?.doctors?.[0] && (
                              <p className="text-xs text-gray-500 mt-1">
                                Doctor:{" "}
                                {getFullNameFromObject(
                                  (selectedRecord.appointment as any).doctors[0]
                                ) ||
                                  getFullNameFromObject(
                                    (selectedRecord.appointment as any)?.slot
                                      ?.schedule?.doctor
                                  ) ||
                                  "—"}
                              </p>
                            )}
                            {selectedRecord.appointment.status && (
                              <p className="text-xs text-gray-500 mt-1">
                                Status: {selectedRecord.appointment.status}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {(selectedRecord.appointment as any)?.treatmentCycleId && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Treatment Cycle
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-xs text-gray-500">
                            Cycle ID:{" "}
                            {getLast4Chars(
                              (selectedRecord.appointment as any)
                                .treatmentCycleId
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                          Created At
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900">
                            {formatDateTime(selectedRecord.createdAt)}
                          </p>
                        </div>
                      </div>
                      {selectedRecord.updatedAt && (
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-700">
                            Last Updated
                          </label>
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <p className="text-gray-900">
                              {formatDateTime(selectedRecord.updatedAt)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Medical Information - Matching Create Medical Record Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRecord.chiefComplaint && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Chief Complaint
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.chiefComplaint}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRecord.history && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          History
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.history}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRecord.physicalExamination && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Physical Examination
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.physicalExamination}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRecord.diagnosis && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Diagnosis
                        </label>
                        <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.diagnosis}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRecord.treatmentPlan && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Treatment Plan
                        </label>
                        <div className="rounded-md border border-green-200 bg-green-50/50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.treatmentPlan}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRecord.followUpInstructions && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Follow-up Instructions
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.followUpInstructions}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedRecord.vitalSigns && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Vital Signs
                          </label>
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {selectedRecord.vitalSigns}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedRecord.labResults && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Lab Results
                          </label>
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {selectedRecord.labResults}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedRecord.imagingResults && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Imaging Results
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.imagingResults}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedRecord.notes && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedRecord.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRecordId(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() =>
                      navigate({
                        to: "/doctor/appointments/$appointmentId",
                        params: {
                          appointmentId: selectedRecord.appointmentId,
                        },
                      })
                    }
                  >
                    View Appointment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Loading record details...
              </div>
            )}
          </Modal>
        )}

        {/* Edit Record Modal */}
        {editingRecordId && (
          <Modal
            isOpen={!!editingRecordId}
            onClose={() => {
              setEditingRecordId(null);
              setEditFormData({});
            }}
            title="Edit Medical Record"
            size="xl"
          >
            {editingRecord ? (
              <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Header Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Record Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Appointment ID
                        </label>
                        <p className="text-sm font-mono text-gray-900">
                          {getLast4Chars(editingRecord.appointmentId)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Created At
                        </label>
                        <p className="text-sm text-gray-900">
                          {formatDate(editingRecord.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chief Complaint */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chief Complaint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter chief complaint..."
                      value={editFormData.chiefComplaint || ""}
                      onChange={(e) =>
                        handleFieldChange("chiefComplaint", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                {/* History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medical History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter medical history..."
                      value={editFormData.history || ""}
                      onChange={(e) =>
                        handleFieldChange("history", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                {/* Physical Examination */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Physical Examination
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter physical examination findings..."
                      value={editFormData.physicalExamination || ""}
                      onChange={(e) =>
                        handleFieldChange("physicalExamination", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                {/* Diagnosis */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">
                      Diagnosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter diagnosis..."
                      value={editFormData.diagnosis || ""}
                      onChange={(e) =>
                        handleFieldChange("diagnosis", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                {/* Treatment Plan */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-900">
                      Treatment Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter treatment plan..."
                      value={editFormData.treatmentPlan || ""}
                      onChange={(e) =>
                        handleFieldChange("treatmentPlan", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                {/* Follow-up Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Follow-up Instructions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter follow-up instructions..."
                      value={editFormData.followUpInstructions || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "followUpInstructions",
                          e.target.value
                        )
                      }
                    />
                  </CardContent>
                </Card>

                {/* Vital Signs & Lab Results */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Vital Signs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Enter vital signs..."
                        value={editFormData.vitalSigns || ""}
                        onChange={(e) =>
                          handleFieldChange("vitalSigns", e.target.value)
                        }
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Lab Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Enter lab results..."
                        value={editFormData.labResults || ""}
                        onChange={(e) =>
                          handleFieldChange("labResults", e.target.value)
                        }
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Imaging Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Imaging Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter imaging results..."
                      value={editFormData.imagingResults || ""}
                      onChange={(e) =>
                        handleFieldChange("imagingResults", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter additional notes..."
                      value={editFormData.notes || ""}
                      onChange={(e) =>
                        handleFieldChange("notes", e.target.value)
                      }
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingRecordId(null);
                      setEditFormData({});
                    }}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                Loading record details...
              </div>
            )}
          </Modal>
        )}

        {/* Create Medical Record Modal */}
        <CreateMedicalRecordForm
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            setIsCreateModalOpen(false);
          }}
        />

        {/* Appointment Detail Modal */}
        <DoctorAppointmentDetailModal
          appointmentId={appointmentModalId}
          isOpen={!!appointmentModalId}
          onClose={() => setAppointmentModalId(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
