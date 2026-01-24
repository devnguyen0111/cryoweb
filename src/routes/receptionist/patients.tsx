import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { isAxiosError } from "axios";
import { z } from "zod";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import {
  isPatientDetailResponse,
  getPatientProperty,
} from "@/utils/patient-helpers";
import { getLast4Chars } from "@/utils/id-helpers";
import { getStatusBadgeClass } from "@/utils/status-colors";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { StructuredNote } from "@/components/StructuredNote";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/receptionist/patients")({
  validateSearch: z.object({
    viewId: z.string().optional(),
  }),
  component: ReceptionistPatientsComponent,
});

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
  placeholder?: string;
  multiline?: boolean;
}

function DetailField({
  label,
  value,
  placeholder = "—",
  multiline,
}: DetailFieldProps) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? placeholder
      : String(value);

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div
        className={cn(
          "rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
          multiline ? "whitespace-pre-wrap leading-relaxed" : ""
        )}
      >
        {displayValue}
      </div>
    </div>
  );
}

function ReceptionistPatientsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["receptionist", "patients"] }),
      queryClient.invalidateQueries({ queryKey: ["receptionist", "patient"] }),
    ]);
    setIsRefreshing(false);
  };
  const { viewId } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "receptionist",
      "patients",
      {
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: searchTerm || undefined,
      },
    ],
    queryFn: async () => {
      const response = await api.patient.getPatients({
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: searchTerm || undefined,
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
  const total = data?.metaData?.totalCount ?? 0;
  const totalPages = data?.metaData?.totalPages ?? 1;
  const isDetailOpen = Boolean(viewId);

  useEffect(() => {
    if (!isDetailOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDetailOpen]);

  const {
    data: patientDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = usePatientDetails(viewId, isDetailOpen && !!viewId);

  const { data: patientAppointments, isLoading: isAppointmentsLoading } =
    useQuery({
      queryKey: ["receptionist", "patient", "detail", "appointments", viewId],
      enabled: isDetailOpen && Boolean(viewId),
      queryFn: async () => {
        if (!viewId) return null;
        try {
          return await api.appointment.getAppointments({
            PatientId: viewId,
            Page: 1,
            Size: 5,
            Sort: "appointmentDate",
            Order: "desc",
          } as any);
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 403) {
            return { data: [] };
          }
          throw error;
        }
      },
    });

  const statusBadgeClass = (status?: string) => {
    return getStatusBadgeClass(status, "auto");
  };

  const handleViewDetails = (patientId: string) => {
    navigate({
      to: "/receptionist/patients",
      search: (previous) => ({
        ...previous,
        viewId: patientId,
      }),
    });
  };

  const handleCloseDetails = () => {
    navigate({
      to: "/receptionist/patients",
      search: (previous) => ({
        ...previous,
        viewId: undefined,
      }),
      replace: true,
    });
  };

  const recentAppointments = patientAppointments?.data ?? [];

  const detailHeader = useMemo(() => {
    if (!patientDetail) return null;
    const isDetail = isPatientDetailResponse(patientDetail);
    const accountInfo = isDetail ? (patientDetail as any).accountInfo : null;
    const firstName = accountInfo?.firstName || patientDetail.firstName;
    const lastName = accountInfo?.lastName || patientDetail.lastName;
    const displayName =
      (firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName) ||
      accountInfo?.username ||
      patientDetail.patientCode ||
      "Patient detail";
    return {
      displayName,
      patientCode: patientDetail.patientCode || "N/A",
      email:
        (isPatientDetailResponse(patientDetail)
          ? patientDetail.accountInfo?.email
          : null) ||
        patientDetail.email ||
        "-",
      phone:
        (isPatientDetailResponse(patientDetail)
          ? patientDetail.accountInfo?.phone
          : null) ||
        patientDetail.phoneNumber ||
        "-",
      bloodType: patientDetail.bloodType || "N/A",
    };
  }, [patientDetail]);

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Patient management</h1>
              <p className="text-gray-600 mt-2">
                Search and update patient records captured during intake.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
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
              <Button
                onClick={() =>
                  navigate({ to: "/receptionist/service-requests" })
                }
              >
                Link service request
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Dashboard
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle>Patient list</CardTitle>
                  <p className="text-sm text-gray-500">
                    Results: {total} patients · Page {page}/{totalPages}
                  </p>
                </div>
                <Input
                  placeholder="Search by name, code, email, or phone..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Error loading patients. Please try again.
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.length ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Patient</th>
                              <th className="text-left p-2">Contact</th>
                              <th className="text-left p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patients.map((patient) => {
                              const isDetail = isPatientDetailResponse(patient);
                              const accountInfo = isDetail
                                ? (patient as any).accountInfo
                                : null;
                              const firstName =
                                accountInfo?.firstName || patient.firstName;
                              const lastName =
                                accountInfo?.lastName || patient.lastName;
                              const displayName =
                                (firstName && lastName
                                  ? `${firstName} ${lastName}`.trim()
                                  : firstName || lastName) ||
                                accountInfo?.username ||
                                patient.patientCode ||
                                "Unknown";
                              return (
                                <tr key={patient.id} className="border-b">
                                  <td className="p-2">
                                    <div className="font-medium text-gray-900">
                                      {displayName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Patient code:{" "}
                                      {patient.patientCode || "N/A"}
                                    </div>
                                  </td>
                                  <td className="p-2 text-sm text-gray-600">
                                    <div>
                                      {(isDetail
                                        ? (patient as any).accountInfo?.email
                                        : null) ||
                                        patient.email ||
                                        "-"}
                                    </div>
                                    <div className="text-xs">
                                      {(isDetail
                                        ? (patient as any).accountInfo?.phone
                                        : null) ||
                                        patient.phoneNumber ||
                                        "-"}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      type="button"
                                      onClick={() =>
                                        handleViewDetails(patient.id)
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
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Showing {patients.length} / {total} patients
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() =>
                              setPage((prev) => Math.max(1, prev - 1))
                            }
                          >
                            Previous
                          </Button>
                          <span>
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
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {detailHeader?.displayName || "Patient detail"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Patient ID:{" "}
                    <span className="font-medium">{getLast4Chars(viewId)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {patientDetail?.isActive !== undefined && (
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        patientDetail.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {patientDetail.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                  <Button variant="ghost" onClick={handleCloseDetails}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {isDetailLoading ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Loading patient details...
                  </div>
                ) : detailError ? (
                  <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
                    Unable to load patient details. Please try again later.
                  </div>
                ) : !patientDetail ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Patient details not available.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Basic information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          <p>
                            <span className="font-medium text-gray-900">
                              Patient code:
                            </span>{" "}
                            {detailHeader?.patientCode}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Citizen ID Card:
                            </span>{" "}
                            {patientDetail.nationalId || "Not recorded"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Blood type:
                            </span>{" "}
                            {detailHeader?.bloodType}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Insurance:
                            </span>{" "}
                            {getPatientProperty(
                              patientDetail,
                              "insurance",
                              "No insurance info"
                            )}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Created at:
                            </span>{" "}
                            {patientDetail.createdAt || "-"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Contact information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          <p>
                            <span className="font-medium text-gray-900">
                              Email:
                            </span>{" "}
                            {detailHeader?.email}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Phone:
                            </span>{" "}
                            {detailHeader?.phone}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Address:
                            </span>{" "}
                            {(isPatientDetailResponse(patientDetail)
                              ? patientDetail.accountInfo?.address
                              : null) ||
                              patientDetail.address ||
                              "-"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Emergency contact:
                            </span>{" "}
                            {getPatientProperty(
                              patientDetail,
                              "emergencyContact",
                              "Not provided"
                            )}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Emergency phone:
                            </span>{" "}
                            {getPatientProperty(
                              patientDetail,
                              "emergencyPhone",
                              "-"
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-6">
                      <Card>
                        <CardHeader className="flex items-center justify-between">
                          <CardTitle>Appointments history</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          {isAppointmentsLoading ? (
                            <p className="text-gray-500">
                              Loading appointments...
                            </p>
                          ) : recentAppointments.length ? (
                            recentAppointments.map((appointment, index) => (
                              <div
                                key={appointment.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {appointment.appointmentCode ||
                                      `appointment #${index + 1}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {appointment.appointmentDate || "—"}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status || "scheduled"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">
                              No appointments on record.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold text-gray-900">
                          Medical notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <DetailField
                          label="Medical history"
                          value={getPatientProperty(
                            patientDetail,
                            "medicalHistory",
                            null
                          )}
                          placeholder="Not provided"
                          multiline
                        />
                        <DetailField
                          label="Allergies"
                          value={getPatientProperty(
                            patientDetail,
                            "allergies",
                            null
                          )}
                          placeholder="Not provided"
                          multiline
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Notes
                          </p>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                            {getPatientProperty(
                              patientDetail,
                              "notes",
                              null
                            ) ? (
                              <StructuredNote
                                note={getPatientProperty(
                                  patientDetail,
                                  "notes",
                                  null
                                )}
                              />
                            ) : (
                              <p className="text-sm text-gray-500">
                                No additional notes
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
