// src/routes/lab-technician/lab-result.tsx
import * as React from "react";
import axios from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/api/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";

export const Route = createFileRoute("/lab-technician/lab-result")({
  component: LabResultPage,
});

/* ================= TYPES (normalized, safe) ================= */

type ServiceDetail = {
  id: string;
  serviceName?: string | null;
  serviceCode?: string | null;
};

type ServiceRequestLike = {
  id: string;
  appointmentId?: string | null;
  requestDate?: string | null;
  status?: string | null;
  statusName?: string | null;
  serviceDetails?: ServiceDetail[] | null;

  // nếu backend có sẵn thì dùng luôn
  patientName?: string | null;
  patientCode?: string | null;
};

type AppointmentDetailsLike = {
  id: string;

  // có thể backend trả 1 trong nhiều dạng
  medicalRecordId?: string | null;
  medicalRecord?: { id?: string | null } | null;
  medicalRecords?: Array<{ id?: string | null }> | null;

  // patient có thể nằm nhiều nhánh
  patient?: {
    id?: string | null;
    patientCode?: string | null;
    accountInfo?: { firstName?: string | null; lastName?: string | null } | null;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
  } | null;

  patientInfo?: {
    patientCode?: string | null;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;

  // một số API nhét thẳng
  patientCode?: string | null;
  patientName?: string | null;
  fullName?: string | null;
};

type MediaFileLike = {
  id: string;
  fileName?: string | null;
  originalFileName?: string | null;
  filePath: string;
  fileType?: string | null;
  uploadDate?: string | null;
};

type LabRow = {
  serviceRequest: ServiceRequestLike;

  appointmentId: string | null;

  patientCode: string;
  patientName: string;

  medicalRecordId: string | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://cryofert-bfbqgkgzf8b3e9ap.southeastasia-01.azurewebsites.net/api";

/* ================= HELPERS ================= */

function authHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(d?: string | null): string {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toISOString().split("T")[0];
}

function safeText(v?: string | null): string {
  return v && String(v).trim() ? String(v) : "-";
}

function joinServiceNames(details?: ServiceDetail[] | null): string {
  const names =
    details
      ?.map((x: ServiceDetail) => x.serviceName || "")
      .filter((x: string) => x.trim().length > 0) || [];
  return names.length ? names.join(", ") : "-";
}

function pickMedicalRecordId(details: AppointmentDetailsLike | null | undefined): string | null {
  if (!details) return null;

  const id1 = details.medicalRecordId;
  if (id1) return id1;

  const id2 = details.medicalRecord?.id;
  if (id2) return id2;

  const id3 = details.medicalRecords?.[0]?.id;
  if (id3) return id3;

  return null;
}

function pickPatientCode(details: AppointmentDetailsLike | null | undefined): string {
  if (!details) return "-";

  const p =
    details.patient?.patientCode ||
    details.patientInfo?.patientCode ||
    details.patientCode;

  return safeText(p);
}

function pickPatientName(details: AppointmentDetailsLike | null | undefined): string {
  if (!details) return "-";

  const direct =
    details.patient?.fullName ||
    details.patientInfo?.fullName ||
    details.patientName ||
    details.fullName;

  if (direct && direct.trim()) return direct.trim();

  const fn =
    details.patient?.accountInfo?.firstName ||
    details.patientInfo?.firstName ||
    details.patient?.firstName;

  const ln =
    details.patient?.accountInfo?.lastName ||
    details.patientInfo?.lastName ||
    details.patient?.lastName;

  const full = `${fn || ""} ${ln || ""}`.trim();
  return full ? full : "-";
}

function normalizeServiceRequests(raw: unknown): ServiceRequestLike[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ServiceRequestLike[];

  const r = raw as any;

  // thường gặp: response.data.data = array
  const a1 = r?.data?.data;
  if (Array.isArray(a1)) return a1 as ServiceRequestLike[];

  // thường gặp: response.data = array
  const a2 = r?.data;
  if (Array.isArray(a2)) return a2 as ServiceRequestLike[];

  // fallback
  const a3 = r?.items || r?.results;
  if (Array.isArray(a3)) return a3 as ServiceRequestLike[];

  return [];
}

async function fetchMediaByMedicalRecord(medicalRecordId: string): Promise<MediaFileLike[]> {
  const res = await axios.get(`${API_BASE_URL}/media`, {
    params: {
      relatedEntityType: "MedicalRecord",
      relatedEntityId: medicalRecordId,
    },
    headers: { ...authHeaders() },
  });

  const raw = res.data as any;

  const list =
    raw?.data?.data ??
    raw?.data ??
    raw?.items ??
    raw?.result ??
    raw ??
    [];

  return Array.isArray(list) ? (list as MediaFileLike[]) : [];
}

async function uploadFileToMedicalRecord(
  medicalRecordId: string,
  file: File
): Promise<unknown> {
  const fd = new FormData();

  // BẮT BUỘC theo swagger
  fd.append("File", file); // chú ý chữ F hoa
  fd.append("FileName", file.name); // <<< DÒNG QUAN TRỌNG
  fd.append("RelatedEntityId", medicalRecordId);
  fd.append("RelatedEntityType", "MedicalRecord");

  // các field optional, có thể bỏ trống
  fd.append("IsPublic", "true");

  const res = await axios.post(
    `${API_BASE_URL}/media/upload`,
    fd,
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}

/* ================= PAGE ================= */

function LabResultPage() {
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const pageSize = 5;

  const [selected, setSelected] = React.useState<LabRow | null>(null);
  const [mode, setMode] = React.useState<"view" | "update">("view");

  const keyword = searchTerm.trim().toLowerCase();

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<LabRow[], Error>({
    queryKey: ["lab-result-rows"],
    queryFn: async () => {
      // 1) Load full service requests (no status filter)
      const raw = await api.serviceRequest.getServiceRequests({
        Page: 1,
        Size: 50,
      } as any);

      const serviceRequests = normalizeServiceRequests(raw);

      // 2) Build unique appointmentIds
      const apptIds = Array.from(
        new Set(
          serviceRequests
            .map((sr: ServiceRequestLike) => sr.appointmentId || "")
            .filter((x: string) => x.trim().length > 0),
        ),
      );

      // 3) Fetch appointment details in parallel
      // dùng endpoint /appointment/{id}/details để có medical record + patient
      const apptPairs = await Promise.all(
        apptIds.map(async (id: string) => {
          try {
            const resp = await api.appointment.getAppointmentDetails(id);
            // resp thường là BaseResponse<...>
            const details = (resp as any)?.data ?? (resp as any);
            return [id, details as AppointmentDetailsLike] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );

      const apptMap = new Map<string, AppointmentDetailsLike | null>(apptPairs);

      // 4) Normalize rows
      const built: LabRow[] = serviceRequests.map((sr: ServiceRequestLike) => {
        const apptId = sr.appointmentId || null;

        // ưu tiên lấy từ sr nếu backend có sẵn
        let patientCode = safeText(sr.patientCode);
        let patientName = safeText(sr.patientName);
        let medicalRecordId: string | null = null;

        const details = apptId ? (apptMap.get(apptId) as AppointmentDetailsLike | null) : null;

        if (details) {
          medicalRecordId = pickMedicalRecordId(details);
          if (patientCode === "-") patientCode = pickPatientCode(details);
          if (patientName === "-") patientName = pickPatientName(details);
        }

        return {
          serviceRequest: sr,
          appointmentId: apptId,
          patientCode,
          patientName,
          medicalRecordId,
        };
      });

      return built;
    },
    staleTime: 30 * 1000,
  });

  const filteredRows = React.useMemo(() => {
    if (!keyword) return rows;

    return rows.filter((r: LabRow) => {
      const sr = r.serviceRequest;

      const requestIdMatch = sr.id.toLowerCase().includes(keyword);
      const patientCodeMatch = (r.patientCode || "").toLowerCase().includes(keyword);
      const patientNameMatch = (r.patientName || "").toLowerCase().includes(keyword);

      const serviceMatch =
        (sr.serviceDetails || [])
          .map((x: ServiceDetail) => (x.serviceName || "").toLowerCase())
          .join(" ")
          .includes(keyword);

      const statusMatch = ((sr.statusName || sr.status) || "").toLowerCase().includes(keyword);

      return requestIdMatch || patientCodeMatch || patientNameMatch || serviceMatch || statusMatch;
    });
  }, [rows, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Lab Result</h1>
              <p className="text-gray-500 mt-1">
                View and update lab result files, upload into medical record
              </p>
            </div>

            <button
              className="px-5 py-2.5 border rounded-lg hover:bg-gray-50"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <input
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by request id, patient code, patient name, service, status"
                className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Loading service requests...</div>
              ) : isError ? (
                <div className="p-8 text-center text-red-600">
                  Load failed: {error?.message || "Unknown error"}
                </div>
              ) : paginatedRows.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600">
                      <th className="px-6 py-4 text-left">Request ID</th>
                      <th className="px-6 py-4 text-left">Patient Code</th>
                      <th className="px-6 py-4 text-left">Patient Name</th>
                      <th className="px-6 py-4 text-left">Service</th>
                      <th className="px-6 py-4 text-left">Request Date</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.map((r: LabRow) => {
                      const sr = r.serviceRequest;
                      const serviceNames = joinServiceNames(sr.serviceDetails || []);

                      return (
                        <tr key={sr.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{sr.id}</td>

                          <td className="px-6 py-4">{r.patientCode}</td>

                          <td className="px-6 py-4">{r.patientName}</td>

                          <td className="px-6 py-4">{serviceNames}</td>

                          <td className="px-6 py-4">{formatDate(sr.requestDate)}</td>

                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                              {safeText(sr.statusName || sr.status)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              className="px-4 py-1.5 border rounded-lg hover:bg-blue-50"
                              onClick={() => {
                                setSelected(r);
                                setMode("view");
                              }}
                            >
                              View
                            </button>

                            <button
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              onClick={() => {
                                setSelected(r);
                                setMode("update");
                              }}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">No matching service requests found</div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Page {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((p: number) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={page === totalPages}
                  onClick={() => setPage((p: number) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {selected && (
            <LabResultModal
              row={selected}
              mode={mode}
              onClose={() => setSelected(null)}
              onUploaded={() => {
                if (selected.medicalRecordId) {
                  qc.invalidateQueries({
                    queryKey: ["medicalrecord-media", selected.medicalRecordId],
                  });
                }
                // refresh main table too (nếu muốn)
                qc.invalidateQueries({ queryKey: ["lab-result-rows"] });
              }}
            />
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/* ================= MODAL ================= */

function LabResultModal({
  row,
  mode,
  onClose,
  onUploaded,
}: {
  row: LabRow;
  mode: "view" | "update";
  onClose: () => void;
  onUploaded: () => void;
}) {
  const sr = row.serviceRequest;

  const medicalRecordId = row.medicalRecordId;

  const { data: mediaFiles = [], isLoading } = useQuery<MediaFileLike[], Error>({
    queryKey: ["medicalrecord-media", medicalRecordId],
    queryFn: () => fetchMediaByMedicalRecord(medicalRecordId as string),
    enabled: !!medicalRecordId,
  });

  const pdfFiles = React.useMemo(() => {
    return mediaFiles.filter((m: MediaFileLike) =>
      (m.fileType || "").toLowerCase().includes("pdf"),
    );
  }, [mediaFiles]);

  const [file, setFile] = React.useState<File | null>(null);

  const uploadMutation = useMutation<unknown, Error, void>({
    mutationFn: async () => {
      if (!medicalRecordId) {
        throw new Error("Medical record has not been created by doctor.");
      }
      if (!file) {
        throw new Error("Please choose a PDF file.");
      }
      return uploadFileToMedicalRecord(medicalRecordId, file);
    },
    onSuccess: () => {
      toast.success("File uploaded successfully");
      setFile(null);
      onUploaded();
    },
    onError: (error: Error) => {
      const message = error?.message || "Failed to upload file";
      toast.error(message);
    },
  });

  const serviceNames = joinServiceNames(sr.serviceDetails || []);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Service Request Details</h3>
            <p className="text-xs text-gray-500 mt-1">{sr.id}</p>
          </div>
          <button className="px-3 py-1 border rounded-lg hover:bg-gray-50" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <div className="text-gray-500 text-xs">Patient</div>
              <div className="font-medium">
                {row.patientName} ({row.patientCode})
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <div className="text-gray-500 text-xs">Status</div>
              <div className="font-medium">{safeText(sr.statusName || sr.status)}</div>
            </div>

            <div className="border rounded-lg p-3">
              <div className="text-gray-500 text-xs">Requested Service</div>
              <div className="font-medium">{serviceNames}</div>
            </div>

            <div className="border rounded-lg p-3">
              <div className="text-gray-500 text-xs">Request Date</div>
              <div className="font-medium">{formatDate(sr.requestDate)}</div>
            </div>

            <div className="border rounded-lg p-3 col-span-2">
              <div className="text-gray-500 text-xs">Medical Record ID</div>
              <div className="font-medium">{medicalRecordId || "Not created"}</div>
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-semibold">Medical Record Files (PDF)</div>

            {!medicalRecordId ? (
              <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                Medical record has not been created by doctor.
              </div>
            ) : isLoading ? (
              <div className="text-gray-600">Loading files...</div>
            ) : pdfFiles.length === 0 ? (
              <div className="text-gray-600">No PDF uploaded yet.</div>
            ) : (
              <div className="space-y-2">
                {pdfFiles.map((f: MediaFileLike) => (
                  <div key={f.id} className="flex items-center justify-between border rounded p-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {f.originalFileName || f.fileName || "PDF"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {f.uploadDate ? new Date(f.uploadDate).toLocaleString() : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                        onClick={() => window.open(f.filePath, "_blank")}
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-semibold">Upload Result PDF</div>

            <input
              type="file"
              accept="application/pdf"
              disabled={mode !== "update" || !medicalRecordId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFile(e.target.files?.[0] ?? null)
              }
            />

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                disabled={mode !== "update" || !medicalRecordId || uploadMutation.isPending}
                onClick={() => uploadMutation.mutate()}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>

            {mode !== "update" ? (
              <div className="text-xs text-gray-500">Switch to Update to upload PDF.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
