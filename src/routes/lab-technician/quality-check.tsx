import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import api from "@/api/client";

/**
 
/* ================= ROUTE ================= */
export const Route = createFileRoute("/lab-technician/quality-check")({
  component: QualityCheckPage,
});

/* ================= SWITCH ================= */
function Switch({
  value,
  onChange,
  disabled,
}: {
  value?: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onChange(!value);
      }}
      className={`w-12 h-6 rounded-full relative transition ${
        value ? "bg-blue-600" : "bg-gray-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      aria-disabled={disabled}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
          value ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

/* ================= VIEW FIELD ================= */
function ViewField({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium">{value ?? "-"}</div>
    </div>
  );
}

/* ================= COLORED SECTION ================= */
function InfoSection({
  title,
  color = "gray",
  children,
}: {
  title: string;
  color?: "blue" | "green" | "purple" | "gray";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    gray: "border-gray-200 bg-gray-50",
  };

  return (
    <section className={`rounded-lg border p-4 ${map[color]}`}>
      <h4 className="text-base font-semibold mb-3">{title}</h4>
      {children}
    </section>
  );
}

/* ================= HELPERS ================= */
function toDateOnly(iso?: string) {
  if (!iso) return "-";
  return String(iso).slice(0, 10);
}
function toDateInput(iso?: string) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}
function toDateTimeInput(iso?: string) {
  if (!iso) return "";
  return String(iso).slice(0, 16);
}

/* ================= PAGE ================= */
function QualityCheckPage() {
  /* ---------- FETCH SAMPLES ---------- */
  const {
    data: sampleData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["lab-samples"],
    queryFn: () =>
      api.sample.getSamples({
        Page: 1,
        Size: 200,
      } as any),
  });

  const samples = sampleData?.data ?? [];

  /* ---------- FETCH PATIENTS ---------- */
  const { data: patientData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => api.patient.getPatients(),
  });

  const patientMap = useMemo(() => {
    const map = new Map<string, any>();
    patientData?.data?.forEach((p: any) => {
      map.set(String(p.id), p);
    });
    return map;
  }, [patientData]);

  /* ---------- SEARCH + FILTER ---------- */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  /* ---------- PAGINATION ---------- */
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  /* ---------- FILTERED DATA ---------- */
  const filteredSamples = useMemo(() => {
    let data = [...samples];

    if (search) {
      const key = search.toLowerCase();
      data = data.filter((s: any) => {
        const p = patientMap.get(String(s.patientId));
        const patientName = p?.accountInfo
          ? `${p.accountInfo.firstName ?? ""} ${p.accountInfo.lastName ?? ""}`.trim()
          : "";
        return (
          String(s.sampleCode ?? "").toLowerCase().includes(key) ||
          String(p?.patientCode ?? "").toLowerCase().includes(key) ||
          String(patientName ?? "").toLowerCase().includes(key)
        );
      });
    }

    if (statusFilter !== "All") {
      data = data.filter((s: any) => String(s.status) === statusFilter);
    }

    return data;
  }, [samples, search, statusFilter, patientMap]);

  const totalPages = Math.ceil(filteredSamples.length / PAGE_SIZE) || 1;

  const pagedSamples = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSamples.slice(start, start + PAGE_SIZE);
  }, [filteredSamples, page]);

  /* =========================================================
     VIEW MODAL STATE
     ========================================================= */
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [patientDetail, setPatientDetail] = useState<any | null>(null);

  const closeView = () => {
    setViewOpen(false);
    setViewLoading(false);
    setViewData(null);
  };

  const openView = async (row: any) => {
  setViewOpen(true);
  setViewLoading(true);
  setViewData(null);
  setPatientDetail(null);

  try {
    // 1️⃣ Lấy lab sample detail
    const res = await api.sample.getSampleById(String(row.id));
    const detail = (res as any)?.data ?? null;
    setViewData(detail);

    // 2️⃣ Lấy patient detail (CHỈ CHỖ NÀY LÀ MỚI)
    if (detail?.patientId) {
      const patientRes = await api.patient.getPatientById(
        String(detail.patientId),
      );
      setPatientDetail(patientRes?.data ?? null);
    }
  } catch (e) {
    console.error("VIEW ERROR", e);
    setViewData(null);
    setPatientDetail(null);
  } finally {
    setViewLoading(false);
  }
};


  /* =========================================================
     UPDATE MODAL STATE
     ========================================================= */
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);

  /**
   * NOTE: formData giữ detail lấy từ GET /labsample/{id}
   * nên có thể có formData.sperm, formData.oocyte, formData.embryo
   */
  const [formData, setFormData] = useState<any>({});

  const closeEdit = () => {
    setEditOpen(false);
    setEditLoading(false);
    setSelectedSample(null);
    setFormData({});
  };

  const setField = (k: string, v: any) => {
    setFormData((p: any) => ({ ...p, [k]: v }));
  };

  const setSpermField = (k: string, v: any) => {
    setFormData((p: any) => ({ ...p, sperm: { ...(p.sperm ?? {}), [k]: v } }));
  };

  const setOocyteField = (k: string, v: any) => {
    setFormData((p: any) => ({ ...p, oocyte: { ...(p.oocyte ?? {}), [k]: v } }));
  };

  const setEmbryoField = (k: string, v: any) => {
    setFormData((p: any) => ({ ...p, embryo: { ...(p.embryo ?? {}), [k]: v } }));
  };

  const openEdit = async (row: any) => {
    setSelectedSample(row);
    setEditOpen(true);
    setEditLoading(true);
    setFormData({});

    try {
      const res = await api.sample.getSampleById(String(row.id));
      setFormData((res as any)?.data ?? {});
    } catch (e) {
      console.error("EDIT LOAD DETAIL ERROR", e);
      setFormData({ ...row });
    } finally {
      setEditLoading(false);
    }
  };

  /* =========================================================
     UPDATE MUTATION
     ========================================================= */

  const buildCommonPayload = () => {
    const payload: any = {};

    // NOTE: common QC fields
    if (formData.quality !== undefined) payload.Quality = formData.quality;
    if (formData.notes !== undefined) payload.Notes = formData.notes;

    if (typeof formData.isAvailable === "boolean") payload.IsAvailable = formData.isAvailable;

    // NOTE: canFrozen ở hệ thống bạn dùng canFrozen, API types dùng CanFrozen hoặc IsQualityCheck, nên mình giữ logic minimal
    if (typeof formData.canFrozen === "boolean") payload.CanFrozen = formData.canFrozen;
    if (typeof formData.canFertilize === "boolean") payload.CanFertilize = formData.canFertilize;

    // NOTE: nếu backend cho update status, bạn có thể bật thêm, hiện tại mình không gửi status để tránh lỗi schema
    // payload.Status = formData.status;

    return payload;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const id = String(selectedSample?.id ?? formData?.id ?? "");
      if (!id) throw new Error("Missing sample id");

      const type = String(formData?.sampleType ?? selectedSample?.sampleType ?? "");

      // SPERM
      if (type === "Sperm") {
        const payload: any = buildCommonPayload();
        const s = formData.sperm ?? {};

        if (s.volume != null) payload.Volume = s.volume;
        if (s.concentration != null) payload.Concentration = s.concentration;
        if (s.motility != null) payload.Motility = s.motility;
        if (s.progressiveMotility != null) payload.ProgressiveMotility = s.progressiveMotility;
        if (s.morphology != null) payload.Morphology = s.morphology;
        if (s.ph != null) payload.PH = s.ph;

        if (s.viscosity !== undefined) payload.Viscosity = s.viscosity;
        if (s.liquefaction !== undefined) payload.Liquefaction = s.liquefaction;
        if (s.color !== undefined) payload.Color = s.color;
        if (s.totalSpermCount != null) payload.TotalSpermCount = s.totalSpermCount;

        return api.sample.updateSpermSample(id, payload);
      }

      // OOCYTE
      if (type === "Oocyte") {
        const payload: any = buildCommonPayload();
        const o = formData.oocyte ?? {};

        if (o.maturityStage !== undefined) payload.MaturityStage = o.maturityStage;
        if (typeof o.isMature === "boolean") payload.IsMature = o.isMature;

        if (o.retrievalDate !== undefined && o.retrievalDate !== "") payload.RetrievalDate = o.retrievalDate;
        if (o.cumulusCells !== undefined) payload.CumulusCells = o.cumulusCells;
        if (o.cytoplasmAppearance !== undefined) payload.CytoplasmAppearance = o.cytoplasmAppearance;

        if (typeof o.isVitrified === "boolean") payload.IsVitrified = o.isVitrified;
        if (o.vitrificationDate !== undefined && o.vitrificationDate !== "")
          payload.VitrificationDate = o.vitrificationDate;

        return api.sample.updateOocyteSample(id, payload);
      }

      // EMBRYO
      if (type === "Embryo") {
        const payload: any = buildCommonPayload();
        const e = formData.embryo ?? {};

        if (e.dayOfDevelopment != null) payload.DayOfDevelopment = e.dayOfDevelopment;
        if (e.grade !== undefined) payload.Grade = e.grade;
        if (e.cellCount != null) payload.CellCount = e.cellCount;
        if (e.morphology !== undefined) payload.Morphology = e.morphology;

        if (typeof e.isBiopsied === "boolean") payload.IsBiopsied = e.isBiopsied;

        // NOTE: response đôi khi là isPgtTested, types đôi khi là IsPGTTested
        const pgt = typeof e.isPGTTested === "boolean" ? e.isPGTTested : e.isPgtTested;
        if (typeof pgt === "boolean") payload.IsPGTTested = pgt;

        if (e.pgtResult !== undefined) payload.PGTResult = e.pgtResult;
        if (e.fertilizationMethod !== undefined) payload.FertilizationMethod = e.fertilizationMethod;

        // Notes riêng embryo
        if (e.notes !== undefined) payload.Notes = e.notes;

        // liên kết sample
        if (e.oocyteId !== undefined) payload.LabSampleOocyteId = e.oocyteId;
        if (e.spermId !== undefined) payload.LabSampleSpermId = e.spermId;

        return api.sample.updateEmbryoSample(id, payload);
      }

      // fallback
      throw new Error(`Unsupported sampleType: ${type}`);
    },
    onSuccess: () => {
      closeEdit();
      refetch();
    },
    onError: (e: any) => {
      console.error("UPDATE ERROR", e);
    },
  });

  /* =========================================================
     RENDER
     ========================================================= */
  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Quality Check</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View all lab samples, check details, update QC fields by sample type.
              </p>
            </div>

            <button
              className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>

          {/* SEARCH + FILTER */}
          <div className="flex gap-4 flex-wrap items-center">
            <input
              className="rounded-lg border px-4 py-2.5 w-[320px]"
              placeholder="Search by sample code, patient code, patient name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />

            <select
              className="rounded-lg border px-4 py-2.5"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="Collected">Collected</option>
              <option value="QualityChecked">Quality Checked</option>
              <option value="Stored">Stored</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow border overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading samples...</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Sample Code</th>
                    <th className="px-4 py-3 text-left">Patient Code</th>
                    <th className="px-4 py-3 text-left">Patient Name</th>
                    <th className="px-4 py-3 text-left">Sample Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Collection Date</th>
                    <th className="px-4 py-3 text-left">Quality</th>
                    <th className="px-4 py-3 text-left">Available</th>
                    <th className="px-4 py-3 text-left">Can Frozen</th>
                    <th className="px-4 py-3 text-left">Can Fertilize</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedSamples.map((s: any) => {
                    const p = patientMap.get(String(s.patientId));
                    const patientName = p?.accountInfo
                      ? `${p.accountInfo.firstName ?? ""} ${p.accountInfo.lastName ?? ""}`.trim()
                      : "-";

                    const type = String(s.sampleType ?? "");
                    const typePill =
                      type === "Sperm"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : type === "Oocyte"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : type === "Embryo"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-gray-50 text-gray-700 border-gray-200";

                    return (
                      <tr key={s.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{s.sampleCode ?? "-"}</td>
                        <td className="px-4 py-2">{p?.patientCode ?? "-"}</td>
                        <td className="px-4 py-2">{patientName}</td>

                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${typePill}`}>
                            {type || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-2">{s.status ?? "-"}</td>
                        <td className="px-4 py-2">{s.collectionDate ?? "-"}</td>
                        <td className="px-4 py-2">{s.quality ?? "-"}</td>
                        <td className="px-4 py-2">{s.isAvailable ? "Yes" : "No"}</td>
                        <td className="px-4 py-2">{s.canFrozen ? "Yes" : "No"}</td>
                        <td className="px-4 py-2">{s.canFertilize ? "Yes" : "No"}</td>

                        <td className="px-4 py-2 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              className="px-3 py-1 rounded border bg-white hover:bg-gray-50"
                              onClick={() => openView(s)}
                            >
                              View
                            </button>

                            <button
                              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => openEdit(s)}
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {pagedSamples.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                        No samples found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>

            <span className="text-sm">
              Page {page} / {totalPages}
            </span>

            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* =========================
            VIEW MODAL
           ========================= */}
        {viewOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-semibold">Sample Details</h3>
                <button onClick={closeView}>✕</button>
              </div>

              <div className="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {viewLoading ? (
                  <div className="p-10 text-center text-gray-500">Loading detail...</div>
                ) : !viewData ? (
                  <div className="p-10 text-center text-gray-500">No detail data.</div>
                ) : (
                  <>
                    <InfoSection title="Sample Information" color="gray">
                      <div className="grid grid-cols-2 gap-6">
                        <ViewField label="Sample Code" value={viewData.sampleCode} />
                        <ViewField label="Sample Type" value={viewData.sampleType} />
                        <ViewField label="Status" value={viewData.status} />
                        <ViewField label="Collection Date" value={toDateOnly(viewData.collectionDate)} />
                        <ViewField label="Quality" value={viewData.quality} />
                        <ViewField label="Notes" value={viewData.notes} />
                        <ViewField label="Available" value={viewData.isAvailable ? "Yes" : "No"} />
                        <ViewField label="Can Frozen" value={viewData.canFrozen ? "Yes" : "No"} />
                        <ViewField label="Can Fertilize" value={viewData.canFertilize ? "Yes" : "No"} />
                      </div>
                    </InfoSection>

                    <InfoSection title="Patient Information" color="gray">
  <div className="grid grid-cols-2 gap-6">
    <ViewField
  label="Patient Code"
  value={patientDetail?.patientCode ?? "-"}
/>

    <ViewField
      label="Patient Name"
      value={viewData.patient?.fullName ?? "-"}
    />

    <ViewField
      label="Gender"
      value={viewData.patient?.gender ?? "-"}
    />

    <ViewField
      label="Birth Date"
      value={viewData.patient?.dob ?? "-"}
    />

    
  </div>
</InfoSection>

                    {viewData.sperm && (
                      <InfoSection title="Sperm Quality Information" color="blue">
                        <div className="grid grid-cols-2 gap-6">
                          <ViewField label="Volume" value={viewData.sperm.volume} />
                          <ViewField label="Concentration" value={viewData.sperm.concentration} />
                          <ViewField label="Motility" value={viewData.sperm.motility} />
                          <ViewField label="Progressive Motility" value={viewData.sperm.progressiveMotility} />
                          <ViewField label="Morphology" value={viewData.sperm.morphology} />
                          <ViewField label="pH" value={viewData.sperm.ph} />
                          <ViewField label="Viscosity" value={viewData.sperm.viscosity} />
                          <ViewField label="Liquefaction" value={viewData.sperm.liquefaction} />
                          <ViewField label="Color" value={viewData.sperm.color} />
                          <ViewField label="Total Sperm Count" value={viewData.sperm.totalSpermCount} />
                        </div>
                      </InfoSection>
                    )}

                    {viewData.oocyte && (
                      <InfoSection title="Oocyte Quality Information" color="green">
                        <div className="grid grid-cols-2 gap-6">
                          <ViewField label="Maturity Stage" value={viewData.oocyte.maturityStage} />
                          <ViewField label="Is Mature" value={viewData.oocyte.isMature ? "Yes" : "No"} />
                          <ViewField label="Retrieval Date" value={viewData.oocyte.retrievalDate} />
                          <ViewField label="Cumulus Cells" value={viewData.oocyte.cumulusCells} />
                          <ViewField label="Cytoplasm Appearance" value={viewData.oocyte.cytoplasmAppearance} />
                          <ViewField label="Is Vitrified" value={viewData.oocyte.isVitrified ? "Yes" : "No"} />
                          <ViewField label="Vitrification Date" value={viewData.oocyte.vitrificationDate} />
                        </div>
                      </InfoSection>
                    )}

                    {viewData.embryo && (
                      <InfoSection title="Embryo Quality Information" color="purple">
                        <div className="grid grid-cols-2 gap-6">
                          <ViewField label="Grade" value={viewData.embryo.grade} />
                          <ViewField label="Cell Count" value={viewData.embryo.cellCount} />
                          <ViewField label="Morphology" value={viewData.embryo.morphology} />
                          <ViewField label="Day Of Development" value={viewData.embryo.dayOfDevelopment} />
                          <ViewField label="Is Biopsied" value={viewData.embryo.isBiopsied ? "Yes" : "No"} />
                          <ViewField
                            label="Is PGT Tested"
                            value={(viewData.embryo.isPGTTested ?? viewData.embryo.isPgtTested) ? "Yes" : "No"}
                          />
                          <ViewField label="PGT Result" value={viewData.embryo.pgtResult} />
                          <ViewField label="Fertilization Method" value={viewData.embryo.fertilizationMethod} />
                          <ViewField label="Embryo Notes" value={viewData.embryo.notes} />
                          <ViewField label="Oocyte ID" value={viewData.embryo.oocyteId} />
                          <ViewField label="Sperm ID" value={viewData.embryo.spermId} />
                        </div>
                      </InfoSection>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-5 border-t flex justify-end">
                <button className="px-6 py-2 border rounded-lg" onClick={closeView}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================
            UPDATE MODAL
           ========================= */}
        {editOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Update Sample, {String(formData.sampleType ?? selectedSample?.sampleType ?? "-")}
                </h3>
                <button onClick={closeEdit}>✕</button>
              </div>

              <div className="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
                {editLoading ? (
                  <div className="p-10 text-center text-gray-500">Loading detail...</div>
                ) : (
                  <>
                    <InfoSection title="Common Quality Check" color="gray">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Quality</label>
                          <input
                            className="mt-1 w-full border rounded px-3 py-2"
                            value={formData.quality ?? ""}
                            onChange={(e) => setField("quality", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <input
                            className="mt-1 w-full border rounded px-3 py-2"
                            value={formData.notes ?? ""}
                            onChange={(e) => setField("notes", e.target.value)}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-3 border rounded px-3 py-2">
                          <div>
                            <div className="font-medium">Available</div>
                            <div className="text-xs text-gray-500">Is sample available</div>
                          </div>
                          <Switch value={formData.isAvailable} onChange={(v) => setField("isAvailable", v)} />
                        </div>

                        <div className="flex items-center justify-between gap-3 border rounded px-3 py-2">
                          <div>
                            <div className="font-medium">Can Frozen</div>
                            <div className="text-xs text-gray-500">Allow cryo storage</div>
                          </div>
                          <Switch value={formData.canFrozen} onChange={(v) => setField("canFrozen", v)} />
                        </div>

                        <div className="flex items-center justify-between gap-3 border rounded px-3 py-2">
                          <div>
                            <div className="font-medium">Can Fertilize</div>
                            <div className="text-xs text-gray-500">Allow fertilization</div>
                          </div>
                          <Switch value={formData.canFertilize} onChange={(v) => setField("canFertilize", v)} />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Collection Date</label>
                          <input
                            type="date"
                            className="mt-1 w-full border rounded px-3 py-2"
                            value={toDateInput(formData.collectionDate)}
                            onChange={(e) => setField("collectionDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </InfoSection>

                    {/* SPERM FORM */}
                    {String(formData.sampleType) === "Sperm" && (
                      <InfoSection title="Sperm Quality Information" color="blue">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Volume</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.volume ?? ""}
                              onChange={(e) => setSpermField("volume", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Concentration</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.concentration ?? ""}
                              onChange={(e) => setSpermField("concentration", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Motility</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.motility ?? ""}
                              onChange={(e) => setSpermField("motility", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Progressive Motility</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.progressiveMotility ?? ""}
                              onChange={(e) => setSpermField("progressiveMotility", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Morphology</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.morphology ?? ""}
                              onChange={(e) => setSpermField("morphology", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">pH</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.ph ?? ""}
                              onChange={(e) => setSpermField("ph", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Viscosity</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.viscosity ?? ""}
                              onChange={(e) => setSpermField("viscosity", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Liquefaction</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.liquefaction ?? ""}
                              onChange={(e) => setSpermField("liquefaction", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Color</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.color ?? ""}
                              onChange={(e) => setSpermField("color", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Total Sperm Count</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.sperm?.totalSpermCount ?? ""}
                              onChange={(e) => setSpermField("totalSpermCount", Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </InfoSection>
                    )}

                    {/* OOCYTE FORM */}
                    {String(formData.sampleType) === "Oocyte" && (
                      <InfoSection title="Oocyte Quality Information" color="green">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Maturity Stage</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.oocyte?.maturityStage ?? ""}
                              onChange={(e) => setOocyteField("maturityStage", e.target.value)}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 border rounded px-3 py-2 mt-6">
                            <div>
                              <div className="font-medium">Is Mature</div>
                              <div className="text-xs text-gray-500">Mature status</div>
                            </div>
                            <Switch value={formData.oocyte?.isMature} onChange={(v) => setOocyteField("isMature", v)} />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Retrieval Date</label>
                            <input
                              type="datetime-local"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={toDateTimeInput(formData.oocyte?.retrievalDate)}
                              onChange={(e) => setOocyteField("retrievalDate", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Cumulus Cells</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.oocyte?.cumulusCells ?? ""}
                              onChange={(e) => setOocyteField("cumulusCells", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Cytoplasm Appearance</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.oocyte?.cytoplasmAppearance ?? ""}
                              onChange={(e) => setOocyteField("cytoplasmAppearance", e.target.value)}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 border rounded px-3 py-2 mt-6">
                            <div>
                              <div className="font-medium">Is Vitrified</div>
                              <div className="text-xs text-gray-500">Vitrification status</div>
                            </div>
                            <Switch
                              value={formData.oocyte?.isVitrified}
                              onChange={(v) => setOocyteField("isVitrified", v)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Vitrification Date</label>
                            <input
                              type="datetime-local"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={toDateTimeInput(formData.oocyte?.vitrificationDate)}
                              onChange={(e) => setOocyteField("vitrificationDate", e.target.value)}
                            />
                          </div>
                        </div>
                      </InfoSection>
                    )}

                    {/* EMBRYO FORM */}
                    {String(formData.sampleType) === "Embryo" && (
                      <InfoSection title="Embryo Quality Information" color="purple">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Oocyte ID</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.oocyteId ?? ""}
                              onChange={(e) => setEmbryoField("oocyteId", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Sperm ID</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.spermId ?? ""}
                              onChange={(e) => setEmbryoField("spermId", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Day Of Development</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.dayOfDevelopment ?? ""}
                              onChange={(e) => setEmbryoField("dayOfDevelopment", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Grade</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.grade ?? ""}
                              onChange={(e) => setEmbryoField("grade", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Cell Count</label>
                            <input
                              type="number"
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.cellCount ?? ""}
                              onChange={(e) => setEmbryoField("cellCount", Number(e.target.value))}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Morphology</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.morphology ?? ""}
                              onChange={(e) => setEmbryoField("morphology", e.target.value)}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 border rounded px-3 py-2 mt-6">
                            <div>
                              <div className="font-medium">Is Biopsied</div>
                              <div className="text-xs text-gray-500">Biopsy status</div>
                            </div>
                            <Switch
                              value={formData.embryo?.isBiopsied}
                              onChange={(v) => setEmbryoField("isBiopsied", v)}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-3 border rounded px-3 py-2 mt-6">
                            <div>
                              <div className="font-medium">Is PGT Tested</div>
                              <div className="text-xs text-gray-500">PGT test status</div>
                            </div>
                            <Switch
                              value={formData.embryo?.isPgtTested ?? formData.embryo?.isPGTTested}
                              onChange={(v) => setEmbryoField("isPgtTested", v)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">PGT Result</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.pgtResult ?? ""}
                              onChange={(e) => setEmbryoField("pgtResult", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium">Fertilization Method</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.fertilizationMethod ?? ""}
                              onChange={(e) => setEmbryoField("fertilizationMethod", e.target.value)}
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-sm font-medium">Embryo Notes</label>
                            <input
                              className="mt-1 w-full border rounded px-3 py-2"
                              value={formData.embryo?.notes ?? ""}
                              onChange={(e) => setEmbryoField("notes", e.target.value)}
                            />
                          </div>
                        </div>
                      </InfoSection>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button className="px-4 py-2 border rounded" onClick={closeEdit}>
                        Cancel
                      </button>

                      <button
                        className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate()}
                      >
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </button>
                    </div>
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
