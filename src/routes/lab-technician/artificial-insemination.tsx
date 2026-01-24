// src/routes/lab-technician/artificial-insemination.tsx
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export const Route = createFileRoute("/lab-technician/artificial-insemination")({
  component: ArtificialInseminationPage,
});

type TabKey = "insemination" | "embryo";

/* ================= UTIL ================= */
function safeStr(v: any, fallback = "-") {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s ? s : fallback;
}

function formatDateTime(v: any) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "-";
  }
}

function StatusPill({ status }: { status?: string }) {
  const s = safeStr(status, "-");
  const cls =
    s === "ReadyToFreeze" || s === "Ready to Freeze"
      ? "bg-blue-100 text-blue-700"
      : s === "Culturing"
      ? "bg-yellow-100 text-yellow-700"
      : s === "Stored"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
      {s}
    </span>
  );
}

/* ================= MODAL WRAPPER ================= */
function Modal({
  open,
  title,
  onClose,
  children,
  widthClass = "max-w-3xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${widthClass} bg-white rounded-xl shadow-lg overflow-hidden`}>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="font-semibold text-lg">{title}</div>
            <button className="px-3 py-1 border rounded-lg hover:bg-gray-50" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ArtificialInseminationPage() {
  const queryClient = useQueryClient();

  /* ================= STATE TAB ================= */
  const [activeTab, setActiveTab] = useState<TabKey>("insemination");

  /* ================= STATE TAB 1 ================= */
  const [selectedOocyte, setSelectedOocyte] = useState<any | null>(null);
  const [selectedSperm, setSelectedSperm] = useState<any | null>(null);

  /* ================= STATE TAB 2 ================= */
  const [viewEmbryoId, setViewEmbryoId] = useState<string | null>(null);
  const [updateEmbryoId, setUpdateEmbryoId] = useState<string | null>(null);

  /* ================= FETCH PATIENTS (for code + name) ================= */
  const { data: patientData } = useQuery({
    queryKey: ["patients", "all-for-map"],
    queryFn: () =>
      (api as any).patient.getPatients({
        pageNumber: 1,
        pageSize: 2000,
      }),
  });

  const patientMap = useMemo(() => {
    const list = (patientData as any)?.data ?? [];
    return new Map(list.map((p: any) => [String(p.id), p]));
  }, [patientData]);

  const getPatientLabel = (patientId?: string) => {
    if (!patientId) return { code: "-", name: "-" };
    const p: any = patientMap.get(String(patientId)) || {};
    const code = p?.patientCode ?? "-";
    const name = p?.accountInfo
      ? `${p.accountInfo.firstName ?? ""} ${p.accountInfo.lastName ?? ""}`.trim()
      : p?.fullName ?? "-";
    return { code, name: name || "-" };
  };

  /* ================= TAB 1: FETCH OOCYTES =================
     nghiệp vụ: status = QualityChecked + canFertilize = true
  */
  const { data: oocyteRes, isLoading: oocyteLoading, error: oocyteError } =
    useQuery({
      queryKey: ["lab-samples", "oocyte", "qualitychecked"],
      queryFn: () =>
        (api as any).sample.getSamples({
          sampleType: "Oocyte",
          status: "QualityChecked",
          pageNumber: 1,
          pageSize: 200,
        }),
    });

  const oocytes = useMemo(() => {
    const all = (oocyteRes as any)?.data ?? [];
    return all.filter((x: any) => x?.canFertilize === true);
  }, [oocyteRes]);

  /* ================= TAB 1: FETCH RELATIONSHIP ================= */
  const {
    data: relationshipRes,
    isLoading: relationshipLoading,
    error: relationshipError,
  } = useQuery({
    queryKey: ["relationship-by-patient", selectedOocyte?.patientId],
    enabled: !!selectedOocyte?.patientId,
    queryFn: () =>
      (api as any).relationship.getRelationships(String(selectedOocyte.patientId)),
  });

  const relationship = useMemo(() => {
    const data = (relationshipRes as any)?.data;
    if (!data) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    return data;
  }, [relationshipRes]);

  const partnerPatientId = useMemo(() => {
    if (!selectedOocyte?.patientId || !relationship) return "";
    const pid = String(selectedOocyte.patientId);
    const p1 = String((relationship as any).patient1Id ?? "");
    const p2 = String((relationship as any).patient2Id ?? "");
    if (!p1 || !p2) return "";
    return p1 === pid ? p2 : p2 === pid ? p1 : "";
  }, [relationship, selectedOocyte?.patientId]);

  /* ================= TAB 1: FETCH SPERMS ================= */
  const { data: spermRes, isLoading: spermLoading, error: spermError } = useQuery({
    queryKey: ["lab-samples", "sperm", "partner", partnerPatientId],
    enabled: !!partnerPatientId,
    queryFn: () =>
      (api as any).sample.getSamples({
        sampleType: "Sperm",
        status: "QualityChecked",
        patientId: partnerPatientId,
        pageNumber: 1,
        pageSize: 200,
      }),
  });

  const sperms = useMemo(() => {
    const all = (spermRes as any)?.data ?? [];
    return all.filter((x: any) => x?.canFertilize === true);
  }, [spermRes]);

  /* ================= TAB 1: CREATE EMBRYO ================= */
  const createEmbryoMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOocyte?.id) throw new Error("Missing oocyte");
      if (!selectedSperm?.id) throw new Error("Missing sperm");
      if (!selectedOocyte?.patientId) throw new Error("Missing patientId");

      return (api as any).sample.createEmbryoSample({
        PatientId: String(selectedOocyte.patientId),
        LabSampleOocyteId: String(selectedOocyte.id),
        LabSampleSpermId: String(selectedSperm.id),
      } as any);
    },
    onSuccess: () => {
      alert("Create embryo successfully");
      setSelectedSperm(null);
      setSelectedOocyte(null);

      queryClient.invalidateQueries({
        queryKey: ["lab-samples", "oocyte", "qualitychecked"],
      });
      queryClient.invalidateQueries({
        queryKey: ["lab-samples", "sperm", "partner", partnerPatientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lab-samples", "embryo"],
      });
    },
    onError: (err: any) => {
      alert(err?.message ?? "Create embryo failed");
    },
  });

  const selectedOocytePatient = getPatientLabel(selectedOocyte?.patientId);
  const partnerPatient = getPatientLabel(partnerPatientId);

  /* ================= TAB 2: FETCH EMBRYOS LIST ================= */
  const {
    data: embryoRes,
    isLoading: embryoLoading,
    error: embryoError,
    refetch: refetchEmbryos,
  } = useQuery({
    queryKey: ["lab-samples", "embryo"],
    queryFn: () =>
      (api as any).sample.getSamples({
        sampleType: "Embryo",
        pageNumber: 1,
        pageSize: 200,
      }),
  });

  const embryos = useMemo(() => {
    return (embryoRes as any)?.data ?? [];
  }, [embryoRes]);

  /* ================= TAB 2: VIEW EMBRYO DETAIL (GET /api/labsample/{id}) =================
     Dùng API swagger  GET /api/labsample/{id}
  */
  const {
    data: viewEmbryoRes,
    isLoading: viewEmbryoLoading,
    error: viewEmbryoError,
  } = useQuery({
    queryKey: ["lab-sample-detail", viewEmbryoId],
    enabled: !!viewEmbryoId,
    queryFn: async () => {
      const id = String(viewEmbryoId);
      const sampleApi: any = (api as any).sample;

      if (typeof sampleApi.getLabSampleById === "function") return sampleApi.getLabSampleById(id);

      
      throw new Error("No client method for GET /api/labsample/{id}");
    },
  });

  const viewEmbryoDetail = useMemo(() => {
    return (viewEmbryoRes as any)?.data ?? null;
  }, [viewEmbryoRes]);

  const viewEmbryoData = useMemo(() => {
    return (viewEmbryoDetail as any)?.data ?? null;
  }, [viewEmbryoDetail]);

  const viewEmbryoInner = useMemo(() => {
    return (viewEmbryoData as any)?.embryo ?? null;
  }, [viewEmbryoData]);

  const viewOocyteId = safeStr(viewEmbryoInner?.oocyteId, "");
  const viewSpermId = safeStr(viewEmbryoInner?.spermId, "");


  const { data: oocyteDetailRes } = useQuery({
    queryKey: ["lab-sample-detail", "oocyte", viewOocyteId],
    enabled: !!viewEmbryoId && !!viewOocyteId,
    queryFn: async () => {
      const id = String(viewOocyteId);
      const sampleApi: any = (api as any).sample;

      if (typeof sampleApi.getLabSampleById === "function") return sampleApi.getLabSampleById(id);
      if (typeof sampleApi.getSampleById === "function") return sampleApi.getSampleById(id);
      if (typeof sampleApi.getLabSample === "function") return sampleApi.getLabSample(id);
      if (typeof (api as any).get === "function") return (api as any).get(`/api/labsample/${id}`);

      return null;
    },
  });

  const { data: spermDetailRes } = useQuery({
    queryKey: ["lab-sample-detail", "sperm", viewSpermId],
    enabled: !!viewEmbryoId && !!viewSpermId,
    queryFn: async () => {
      const id = String(viewSpermId);
      const sampleApi: any = (api as any).sample;

      if (typeof sampleApi.getLabSampleById === "function") return sampleApi.getLabSampleById(id);
      if (typeof sampleApi.getSampleById === "function") return sampleApi.getSampleById(id);
      if (typeof sampleApi.getLabSample === "function") return sampleApi.getLabSample(id);
      if (typeof (api as any).get === "function") return (api as any).get(`/api/labsample/${id}`);

      return null;
    },
  });

  const oocyteSampleCode = useMemo(() => {
    const d = (oocyteDetailRes as any)?.data?.data;
    return safeStr(d?.sampleCode, "-");
  }, [oocyteDetailRes]);

  const spermSampleCode = useMemo(() => {
    const d = (spermDetailRes as any)?.data?.data;
    return safeStr(d?.sampleCode, "-");
  }, [spermDetailRes]);

  /* ================= TAB 2: UPDATE FORM STATE ================= */
  type EmbryoUpdateBody = {
    status: string;
    notes: string | null;
    quality: string | null;
    isAvailable: boolean;
    dayOfDevelopment: number | null;
    grade: string | null;
    cellCount: number | null;
    morphology: string | null;
    isBiopsied: boolean;
    isPgtTested: boolean;
    pgtResult: string | null;
    fertilizationMethod: string | null;
  };

  const [updateForm, setUpdateForm] = useState<EmbryoUpdateBody>({
    status: "Collected",
    notes: null,
    quality: null,
    isAvailable: false,
    dayOfDevelopment: null,
    grade: null,
    cellCount: null,
    morphology: null,
    isBiopsied: false,
    isPgtTested: false,
    pgtResult: null,
    fertilizationMethod: null,
  });

  // Khi mở modal update, lấy dữ liệu từ list (ưu tiên) và nếu đang view detail thì lấy từ detail để đầy đủ hơn
  useEffect(() => {
    if (!updateEmbryoId) return;

    const row = embryos.find((x: any) => String(x.id) === String(updateEmbryoId));
    const detail = viewEmbryoData && String(viewEmbryoData.id) === String(updateEmbryoId) ? viewEmbryoData : null;

    const status = safeStr(detail?.status ?? row?.status, "Collected");
    const notes = (detail?.notes ?? detail?.embryo?.notes ?? row?.notes ?? row?.note ?? null) as any;

    const embryoObj = detail?.embryo ?? null;

    setUpdateForm({
      status,
      notes: notes ?? null,
      quality: (detail?.quality ?? row?.quality ?? null) as any,
      isAvailable: Boolean(detail?.isAvailable ?? row?.isAvailable ?? false),
      dayOfDevelopment: embryoObj?.dayOfDevelopment ?? row?.dayOfDevelopment ?? null,
      grade: embryoObj?.grade ?? row?.grade ?? null,
      cellCount: embryoObj?.cellCount ?? row?.cellCount ?? null,
      morphology: embryoObj?.morphology ?? row?.morphology ?? null,
      isBiopsied: Boolean(embryoObj?.isBiopsied ?? row?.isBiopsied ?? false),
      isPgtTested: Boolean(embryoObj?.isPgtTested ?? row?.isPgtTested ?? false),
      pgtResult: (embryoObj?.pgtResult ?? row?.pgtResult ?? null) as any,
      fertilizationMethod: (embryoObj?.fertilizationMethod ?? row?.fertilizationMethod ?? null) as any,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateEmbryoId]);

  /* ================= TAB 2: UPDATE MUTATION (PUT /api/labsample/embryo/{id}) ================= */
  const updateEmbryoMutation = useMutation({
    mutationFn: async (payload: { embryoId: string; body: EmbryoUpdateBody }) => {
      const sampleApi: any = (api as any).sample;

      if (typeof sampleApi.updateEmbryoSample === "function") {
        return sampleApi.updateEmbryoSample(payload.embryoId, payload.body);
      }


      if (typeof sampleApi.updateEmbryo === "function") {
        return sampleApi.updateEmbryo(payload.embryoId, payload.body);
      }
      if (typeof sampleApi.putEmbryo === "function") {
        return sampleApi.putEmbryo(payload.embryoId, payload.body);
      }

      // Nếu có axios instance .put
      if (typeof (api as any).put === "function") {
        return (api as any).put(`/api/labsample/embryo/${payload.embryoId}`, payload.body);
      }

      throw new Error("No client method for PUT /api/labsample/embryo/{id}");
    },
    onSuccess: () => {
      alert("Update embryo successfully");
      queryClient.invalidateQueries({ queryKey: ["lab-samples", "embryo"] });
      if (viewEmbryoId) queryClient.invalidateQueries({ queryKey: ["lab-sample-detail", viewEmbryoId] });
      setUpdateEmbryoId(null);
      refetchEmbryos();
    },
    onError: (err: any) => {
      alert(err?.message ?? "Update embryo failed");
    },
  });

  /* ================= RENDER ================= */
  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        {/* ===== Tabs ===== */}
        <div className="mb-4 flex border-b">
          <button
            className={`px-4 py-2 ${
              activeTab === "insemination"
                ? "border-b-2 border-blue-600 font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("insemination")}
          >
            Eligible for Fertilization
          </button>

          <button
            className={`px-4 py-2 ml-4 ${
              activeTab === "embryo"
                ? "border-b-2 border-blue-600 font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("embryo")}
          >
            Embryo Culture
          </button>
        </div>

        {/* ================= TAB 1 ================= */}
        {activeTab === "insemination" && (
          <div className="flex gap-6">
            {/* LEFT: OOCYTE LIST */}
            <div className="flex-1 bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h1 className="text-2xl font-semibold">Artificial Insemination</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Oocytes approved for fertilization (QualityChecked + canFertilize)
                </p>
              </div>

              {oocyteLoading ? (
                <div className="p-8 text-center text-gray-500">Loading oocytes...</div>
              ) : oocyteError ? (
                <div className="p-8 text-center text-red-600">Failed to load oocytes</div>
              ) : oocytes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No oocyte available for fertilization
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600">
                      <th className="px-6 py-4 text-left">Sample Code</th>
                      <th className="px-6 py-4 text-left">Patient Code</th>
                      <th className="px-6 py-4 text-left">Patient Name</th>
                      <th className="px-6 py-4 text-left">Collected At</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oocytes.map((o: any) => {
                      const p = getPatientLabel(o.patientId);
                      return (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{o.sampleCode}</td>
                          <td className="px-6 py-4">{p.code}</td>
                          <td className="px-6 py-4">{p.name}</td>
                          <td className="px-6 py-4">{formatDateTime(o.collectionDate)}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="px-4 py-1.5 border rounded-lg hover:bg-blue-50"
                              onClick={() => {
                                setSelectedOocyte(o);
                                setSelectedSperm(null);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* RIGHT: SPERM PANEL */}
            {selectedOocyte && (
              <div className="w-[460px] bg-white border rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Select Sperm</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Oocyte: <span className="font-medium">{selectedOocyte.sampleCode}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Patient:{" "}
                      <span className="font-medium">
                        {selectedOocytePatient.code}, {selectedOocytePatient.name}
                      </span>
                    </div>
                  </div>

                  <button
                    className="px-3 py-1 border rounded-lg"
                    onClick={() => {
                      setSelectedOocyte(null);
                      setSelectedSperm(null);
                    }}
                  >
                    Close
                  </button>
                </div>

                <div className="p-5 border-b text-sm">
                  <div className="text-gray-700 font-medium">Relationship partner</div>
                  {relationshipLoading ? (
                    <div className="text-gray-500 mt-1">Loading relationship...</div>
                  ) : relationshipError ? (
                    <div className="text-red-600 mt-1">Failed to load relationship</div>
                  ) : !partnerPatientId ? (
                    <div className="text-gray-500 mt-1">No partner found from relationship</div>
                  ) : (
                    <div className="text-gray-600 mt-1">
                      {partnerPatient.code}, {partnerPatient.name}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 overflow-y-auto space-y-3 text-sm">
                  {!partnerPatientId ? (
                    <div className="text-gray-500">Cannot load sperm without relationship partner</div>
                  ) : spermLoading ? (
                    <div className="text-gray-500">Loading sperms...</div>
                  ) : spermError ? (
                    <div className="text-red-600">Failed to load sperms</div>
                  ) : sperms.length === 0 ? (
                    <div className="text-gray-500">
                      No sperm (QualityChecked + canFertilize) for this relationship partner
                    </div>
                  ) : (
                    sperms.map((s: any) => {
                      const sp = getPatientLabel(s.patientId);
                      const active = selectedSperm?.id === s.id;

                      return (
                        <label
                          key={s.id}
                          className={`block border rounded-lg p-3 cursor-pointer ${
                            active ? "border-blue-600 bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="sperm"
                              className="mt-1"
                              checked={active}
                              onChange={() => setSelectedSperm(s)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{s.sampleCode}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Patient: {sp.code}, {sp.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Collected at {formatDateTime(s.collectionDate)}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>

                <div className="p-5 border-t">
                  <button
                    disabled={!selectedSperm?.id || createEmbryoMutation.isPending}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    onClick={() => createEmbryoMutation.mutate()}
                  >
                    {createEmbryoMutation.isPending ? "Creating embryo..." : "Create Embryo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2 ================= */}
        {activeTab === "embryo" && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Embryo Culture</h2>
              <p className="text-sm text-gray-500 mt-1">Danh sách phôi, xem chi tiết và cập nhật chất lượng</p>
            </div>

            {embryoLoading ? (
              <div className="p-8 text-center text-gray-500">Loading embryos...</div>
            ) : embryoError ? (
              <div className="p-8 text-center text-red-600">Failed to load embryos</div>
            ) : embryos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No embryo found</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-600">
                    <th className="px-6 py-4 text-left">Embryo Code</th>
                    <th className="px-6 py-4 text-left">Pair Code</th>
                    <th className="px-6 py-4 text-left">Patient Code</th>
                    <th className="px-6 py-4 text-left">Culture Day</th>
                    <th className="px-6 py-4 text-left">Quantity</th>
                    <th className="px-6 py-4 text-left">Last Updated</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {embryos.map((e: any) => {
                    const p = getPatientLabel(e.patientId);

                    const pairCode =
                      e.pairCode ?? e.linkCode ?? e.fertilizationCode ?? e.coupleCode ?? "-";

                    const cultureDay =
                      e.dayOfDevelopment ??
                      e.embryo?.dayOfDevelopment ??
                      e.cultureDay ??
                      "-";

                    const grade =
                      e.grade ?? e.embryo?.grade ?? e.quality ?? "-";

                    const lastUpdated =
                      e.updatedAt ??
                      e.lastUpdated ??
                      e.modifiedAt ??
                      e.createdAt ??
                      e.collectionDate ??
                      null;

                    return (
                      <tr key={e.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{safeStr(e.sampleCode)}</td>
                        <td className="px-6 py-4">{safeStr(pairCode)}</td>
                        <td className="px-6 py-4">{safeStr(p.code)}</td>
                        <td className="px-6 py-4">{safeStr(cultureDay)}</td>
                        <td className="px-6 py-4 font-semibold">{safeStr(grade)}</td>
                        <td className="px-6 py-4">{formatDateTime(lastUpdated)}</td>
                        <td className="px-6 py-4">
                          <StatusPill status={e.status} />
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            className="px-3 py-1.5 border rounded-lg hover:bg-blue-50"
                            onClick={() => setViewEmbryoId(String(e.id))}
                          >
                            View
                          </button>

                          <button
                            className="px-3 py-1.5 border rounded-lg hover:bg-blue-50"
                            onClick={() => {
                              // mở update modal
                              setUpdateEmbryoId(String(e.id));
                              // nếu chưa view thì set view trước để lấy detail (giúp form đầy đủ hơn)
                              setViewEmbryoId(String(e.id));
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
            )}
          </div>
        )}

        {/* ================= MODAL VIEW (GET /api/labsample/{id}) ================= */}
        <Modal
          open={!!viewEmbryoId && activeTab === "embryo"}
          title="Embryo Detail"
          onClose={() => setViewEmbryoId(null)}
          widthClass="max-w-3xl"
        >
          {viewEmbryoLoading ? (
            <div className="text-gray-500">Loading...</div>
          ) : viewEmbryoError ? (
            <div className="text-red-600">Failed to load embryo detail</div>
          ) : !viewEmbryoData ? (
            <div className="text-gray-500">No data</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Embryo Code</div>
                  <div className="font-semibold">{safeStr(viewEmbryoData.sampleCode)}</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1">
                    <StatusPill status={viewEmbryoData.status} />
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Patient</div>
                  <div className="font-medium">
                    {safeStr(viewEmbryoData.patient?.fullName, "-")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {safeStr(viewEmbryoData.patientId)}
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="text-xs text-gray-500">Collected At</div>
                  <div className="font-medium">{formatDateTime(viewEmbryoData.collectionDate)}</div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-3">Fertilization inputs</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Oocyte</div>
                    <div className="font-medium">{safeStr(viewOocyteId, "-")}</div>
                    <div className="text-xs text-gray-500 mt-1">Sample Code: {oocyteSampleCode}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Sperm</div>
                    <div className="font-medium">{safeStr(viewSpermId, "-")}</div>
                    <div className="text-xs text-gray-500 mt-1">Sample Code: {spermSampleCode}</div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-3">Embryo info</div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500">Culture Day</div>
                    <div className="font-medium">{safeStr(viewEmbryoInner?.dayOfDevelopment)}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500">Grade</div>
                    <div className="font-medium">{safeStr(viewEmbryoInner?.grade)}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-xs text-gray-500">Cell Count</div>
                    <div className="font-medium">{safeStr(viewEmbryoInner?.cellCount)}</div>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <div className="text-xs text-gray-500">Notes</div>
                  <div className="mt-1 whitespace-pre-wrap">{safeStr(viewEmbryoInner?.notes, "-")}</div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="px-4 py-2 border rounded-lg hover:bg-blue-50"
                  onClick={() => {
                    if (!viewEmbryoId) return;
                    setUpdateEmbryoId(String(viewEmbryoId));
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ================= MODAL UPDATE (PUT /api/labsample/embryo/{id}) ================= */}
        <Modal
          open={!!updateEmbryoId && activeTab === "embryo"}
          title="Update Embryo"
          onClose={() => setUpdateEmbryoId(null)}
          widthClass="max-w-4xl"
        >
          {!updateEmbryoId ? null : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateEmbryoMutation.mutate({
                  embryoId: String(updateEmbryoId),
                  body: updateForm,
                });
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                {/* status */}
                <div>
                  <label className="text-sm font-medium">status</label>
                  <select
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.status}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, status: ev.target.value }))
                    }
                  >
                    <option value="Collected">Collected</option>
                    <option value="Culturing">Culturing</option>
                    <option value="ReadyToFreeze">ReadyToFreeze</option>
                    <option value="Stored">Stored</option>
                    <option value="Discarded">Discarded</option>
                  </select>
                </div>

                {/* isAvailable */}
                <div className="flex items-end gap-2">
                  <input
                    id="isAvailable"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!updateForm.isAvailable}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, isAvailable: ev.target.checked }))
                    }
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium">
                    isAvailable
                  </label>
                </div>

                {/* quality */}
                <div>
                  <label className="text-sm font-medium">quality</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.quality ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, quality: ev.target.value || null }))
                    }
                    placeholder="string"
                  />
                </div>

                {/* grade */}
                <div>
                  <label className="text-sm font-medium">grade</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.grade ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, grade: ev.target.value || null }))
                    }
                    placeholder="string"
                  />
                </div>

                {/* dayOfDevelopment */}
                <div>
                  <label className="text-sm font-medium">dayOfDevelopment</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.dayOfDevelopment ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({
                        ...p,
                        dayOfDevelopment:
                          ev.target.value === "" ? null : Number(ev.target.value),
                      }))
                    }
                    placeholder="10"
                  />
                </div>

                {/* cellCount */}
                <div>
                  <label className="text-sm font-medium">cellCount</label>
                  <input
                    type="number"
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.cellCount ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({
                        ...p,
                        cellCount: ev.target.value === "" ? null : Number(ev.target.value),
                      }))
                    }
                    placeholder="200"
                  />
                </div>

                {/* morphology */}
                <div>
                  <label className="text-sm font-medium">morphology</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.morphology ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, morphology: ev.target.value || null }))
                    }
                    placeholder="string"
                  />
                </div>

                {/* fertilizationMethod */}
                <div>
                  <label className="text-sm font-medium">fertilizationMethod</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.fertilizationMethod ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({
                        ...p,
                        fertilizationMethod: ev.target.value || null,
                      }))
                    }
                    placeholder="string"
                  />
                </div>

                {/* isBiopsied */}
                <div className="flex items-center gap-2">
                  <input
                    id="isBiopsied"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!updateForm.isBiopsied}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, isBiopsied: ev.target.checked }))
                    }
                  />
                  <label htmlFor="isBiopsied" className="text-sm font-medium">
                    isBiopsied
                  </label>
                </div>

                {/* isPgtTested */}
                <div className="flex items-center gap-2">
                  <input
                    id="isPgtTested"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!updateForm.isPgtTested}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, isPgtTested: ev.target.checked }))
                    }
                  />
                  <label htmlFor="isPgtTested" className="text-sm font-medium">
                    isPgtTested
                  </label>
                </div>

                {/* pgtResult */}
                <div>
                  <label className="text-sm font-medium">pgtResult</label>
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2"
                    value={updateForm.pgtResult ?? ""}
                    onChange={(ev) =>
                      setUpdateForm((p) => ({ ...p, pgtResult: ev.target.value || null }))
                    }
                    placeholder="string"
                  />
                </div>
              </div>

              {/* notes */}
              <div>
                <label className="text-sm font-medium">notes</label>
                <textarea
                  className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[90px]"
                  value={updateForm.notes ?? ""}
                  onChange={(ev) =>
                    setUpdateForm((p) => ({ ...p, notes: ev.target.value || null }))
                  }
                  placeholder="string"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  onClick={() => setUpdateEmbryoId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateEmbryoMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {updateEmbryoMutation.isPending ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
