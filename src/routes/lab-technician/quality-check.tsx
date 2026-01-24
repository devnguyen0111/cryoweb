import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import api from "@/api/client";

/* ================= ROUTE ================= */
export const Route = createFileRoute(
  "/lab-technician/quality-check",
)({
  component: QualityCheckPage,
});
/* ================= SWITCH ================= */
function Switch({
  value,
  onChange,
}: {
  value?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full relative transition ${
        value ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${
          value ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

/* ================= PAGE ================= */
function QualityCheckPage() {
  /* ---------- FETCH SAMPLES ---------- */
  const {
    data: sampleData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lab-samples"],
    queryFn: () => api.sample.getSamples(),
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
  const [statusFilter, setStatusFilter] =
    useState<string>("All");
  const [isViewMode, setIsViewMode] = useState(false);
  /* ---------- PAGINATION ---------- */
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  /* ---------- FILTERED DATA ---------- */
  const filteredSamples = useMemo(() => {
    let data = [...samples];

    // Search
    if (search) {
      const key = search.toLowerCase();
      data = data.filter((s: any) => {
        const patient = patientMap.get(
          String(s.patientId),
        );
        const patientName = patient
          ? `${patient.accountInfo?.firstName ?? ""} ${patient.accountInfo?.lastName ?? ""}`
          : "";

        return (
          s.sampleCode?.toLowerCase().includes(key) ||
          patient?.patientCode
            ?.toLowerCase()
            .includes(key) ||
          patientName.toLowerCase().includes(key)
        );
      });
    }

    // Status filter
    if (statusFilter !== "All") {
      data = data.filter(
        (s: any) => s.status === statusFilter,
      );
    }

    return data;
  }, [samples, search, statusFilter, patientMap]);

  /* ---------- PAGED DATA ---------- */
  const totalPages =
    Math.ceil(filteredSamples.length / PAGE_SIZE) ||
    1;

  const pagedSamples = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSamples.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [filteredSamples, page]);

  /* ---------- MODAL STATE ---------- */
  const [open, setOpen] = useState(false);
  const [selectedSample, setSelectedSample] =
    useState<any | null>(null);
  const [formData, setFormData] =
    useState<Record<string, any>>({});
  const [viewOnly, setViewOnly] = useState(false);
  const openModal = (s: any) => {
    setSelectedSample(s);
    setFormData({ ...s });
    setOpen(true);
  };
const openView = (s: any) => {
  setSelectedSample(s);
  setFormData({ ...s });
  setViewOnly(true);   
  setOpen(true);
};
  const closeModal = () => {
    setOpen(false);
    setSelectedSample(null);
    setFormData({});
  };

  const setField = (k: string, v: any) => {
    setFormData((p) => ({ ...p, [k]: v }));
  };

  /* ---------- UPDATE ---------- */
  const updateMutation = useMutation({
  mutationFn: async () => {
    if (!formData?.id) {
      console.log("NO FORM DATA ID");
      return;
    }
    const payload: any = {};

    // ===== COMMON QC FIELDS =====
    if (formData.quality) {
      payload.quality = formData.quality;
    }

    if (formData.notes) {
      payload.notes = formData.notes;
    }

    if (typeof formData.isAvailable === "boolean") {
      payload.isAvailable = formData.isAvailable;
    }

    if (typeof formData.canFrozen === "boolean") {
      payload.canFrozen = formData.canFrozen;
    }

    if (typeof formData.canFertilize === "boolean") {
      payload.canFertilize = formData.canFertilize;
    }

    // ===== SAMPLE TYPE SPECIFIC =====
    if (formData.sampleType === "Sperm") {
  const payload: any = {};

  if (formData.quality) payload.quality = formData.quality;
  if (formData.notes) payload.notes = formData.notes;

  if (typeof formData.isAvailable === "boolean")
    payload.isAvailable = formData.isAvailable;

  if (typeof formData.canFrozen === "boolean")
    payload.canFrozen = formData.canFrozen;

  if (typeof formData.canFertilize === "boolean")
    payload.canFertilize = formData.canFertilize;

  if (formData.volume != null) payload.volume = formData.volume;
  if (formData.concentration != null)
    payload.concentration = formData.concentration;
  if (formData.motility != null) payload.motility = formData.motility;
  if (formData.progressiveMotility != null)
    payload.progressiveMotility = formData.progressiveMotility;
  if (formData.morphology != null)
    payload.morphology = formData.morphology;
  if (formData.ph != null) payload.ph = formData.ph;
  if (formData.viscosity) payload.viscosity = formData.viscosity;
  if (formData.liquefaction)
    payload.liquefaction = formData.liquefaction;
  if (formData.color) payload.color = formData.color;
  if (formData.totalSpermCount != null)
    payload.totalSpermCount = formData.totalSpermCount;

  console.log("SPERM QC PAYLOAD", payload);

  return api.sample.updateSpermSample(formData.id, payload);
} 

    if (formData.sampleType === "Oocyte") {
  const payload: any = {};

  // ===== COMMON =====
  if (formData.quality) payload.quality = formData.quality;
  if (formData.notes) payload.notes = formData.notes;

  if (typeof formData.isAvailable === "boolean") {
    payload.isAvailable = formData.isAvailable;
  }

  // ===== OOCYTE FIELDS =====
  if (formData.maturityStage)
    payload.maturityStage = formData.maturityStage;

  if (typeof formData.isMature === "boolean")
    payload.isMature = formData.isMature;

  if (formData.retrievalDate)
    payload.retrievalDate = formData.retrievalDate;

  if (formData.cumulusCells)
    payload.cumulusCells = formData.cumulusCells;

  if (formData.cytoplasmAppearance)
    payload.cytoplasmAppearance = formData.cytoplasmAppearance;

  if (typeof formData.isVitrified === "boolean")
    payload.isVitrified = formData.isVitrified;

  if (formData.vitrificationDate)
    payload.vitrificationDate = formData.vitrificationDate;

  console.log("OOCYTE QC PAYLOAD", payload);

  return api.sample.updateOocyteSample(formData.id, payload);
}
  },

  onSuccess: () => {
    console.log("QUALITY CHECK SUCCESS");
    closeModal();
    refetch();
  },

  onError: (error) => {
    console.error("QUALITY CHECK ERROR", error);
  },
});

  /* ================= RENDER ================= */
  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">
            Quality Check
            
          </h1>
          
          {/* SEARCH + FILTER */}
          <div className="flex gap-4 flex-wrap">
            <input
              className="rounded-lg border px-4 py-2.5"
              placeholder="Search by sample or patient"
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
              <option value="Collected">
                Collected
              </option>
              <option value="QualityChecked">
                Quality Check
              </option>
              <option value="Stored">Stored</option>
              <option value="Expired">
                Expired
              </option>
            </select>
            <button
              className="px-5 py-2.5 border rounded-lg hover:bg-gray-50"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-xl shadow border overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Loading samples...
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">
                      Sample Code
                    </th>
                    <th className="px-4 py-3">
                      Patient Code
                    </th>
                    <th className="px-4 py-3">
                      Patient Name
                    </th>
                    <th className="px-4 py-3">
                      Sample Type
                    </th>
                    
                    <th className="px-4 py-3">
                      Status
                    </th>
                    <th className="px-4 py-3">
                      Collection Date
                    </th>
                    <th className="px-4 py-3">
                      Quality
                    </th>
                    <th className="px-4 py-3">
                      Can Frozen
                    </th>
                    <th className="px-4 py-3">
                      Can Fertilize
                    </th>
                    <th className="px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pagedSamples.map((s: any) => {
                    const p = patientMap.get(
                      String(s.patientId),
                    );

                    return (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-4 py-2">
                          {s.sampleCode}
                        </td>
                        <td className="px-4 py-2">
                          {p?.patientCode ?? "-"}
                        </td>
                        <td className="px-4 py-2">
                          {p?.accountInfo
                            ? `${p.accountInfo.firstName} ${p.accountInfo.lastName}`
                            : "-"}
                        </td>
                        <td className="px-4 py-2">
                          {s.sampleType}
                        </td>
                       
                        <td className="px-4 py-2">
                          {s.status}
                        </td>
                        <td className="px-4 py-2">
                          {s.collectionDate ?? "-"}
                        </td>
                        
                        <td className="px-4 py-2">
                          {s.quality ?? "-"}
                        </td>
                        
                        <td className="px-4 py-2">
                          {s.canFrozen
                            ? "Yes"
                            : "No"}
                        </td>
                        <td className="px-4 py-2">
                          {s.canFertilize
                            ? "Yes"
                            : "No"}
                        </td>
                        
                        <td className="px-4 py-2 text-right">
  {s.status === "Collected" && (
    <button
      className="px-3 py-1 bg-blue-600 text-white rounded"
      onClick={() => {
        setViewOnly(false); // QC mode
        openModal(s);
      }}
    >
      Quality Control
    </button>
  )}

  {s.status !== "Collected" && (
    <button
      className="px-3 py-1 border rounded"
      onClick={() => openView(s)}
    >
      View
    </button>
  )}
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex justify-between items-center">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page === 1}
              onClick={() =>
                setPage((p) => p - 1)
              }
            >
              Previous
            </button>

            <span className="text-sm">
              Page {page} / {totalPages}
            </span>

            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() =>
                setPage((p) => p + 1)
              }
            >
              Next
            </button>
          </div>
        </div>
        {open && selectedSample && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg">
      {/* HEADER */}
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          Update Sample – {selectedSample.sampleType}
        </h3>
        <button onClick={closeModal}>✕</button>
      </div>

      {/* BODY */}
<div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto text-sm">

  {/* ===== LABSAMPLE FIELDS ===== */}
  <div>
    <h4 className="font-semibold mb-3">Lab Sample Information</h4>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label>Status</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={formData.status ?? ""}
          onChange={(e) => setField("status", e.target.value)}
        >
          <option value="">Select status</option>
          <option value="Collected">Collected</option>
          <option value="QualityCheck">Quality Check</option>
          <option value="Stored">Stored</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <div>
        <label>Quality</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.quality ?? ""}
          onChange={(e) => setField("quality", e.target.value)}
        />
      </div>

      <div>
        <label>Cryo Location ID</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.cryoLocationId ?? ""}
          onChange={(e) => setField("cryoLocationId", e.target.value)}
        />
      </div>

      <div>
        <label>Collection Date</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={formData.collectionDate?.slice(0, 10) ?? ""}
          onChange={(e) => setField("collectionDate", e.target.value)}
        />
      </div>

      <div>
        <label>Storage Date</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={formData.storageDate?.slice(0, 10) ?? ""}
          onChange={(e) => setField("storageDate", e.target.value)}
        />
      </div>

      <div>
        <label>Expiry Date</label>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={formData.expiryDate?.slice(0, 10) ?? ""}
          onChange={(e) => setField("expiryDate", e.target.value)}
        />
      </div>

      <div>
        <label>Available</label>
        <Switch
          value={formData.isAvailable}
          onChange={(v) => setField("isAvailable", v)}
        />
      </div>

      <div>
        <label>Can Frozen</label>
        <Switch
          value={formData.canFrozen}
          onChange={(v) => setField("canFrozen", v)}
        />
      </div>

      <div>
        <label>Can Fertilize</label>
        <Switch
          value={formData.canFertilize}
          onChange={(v) => setField("canFertilize", v)}
        />
      </div>
    </div>

    <div className="mt-3">
      <label>Notes</label>
      <input
        className="w-full border rounded px-3 py-2"
        value={formData.notes ?? ""}
        onChange={(e) => setField("notes", e.target.value)}
      />
    </div>
  </div>

  {/* ===== SAMPLE TYPE FIELDS ===== */}
  <div>
    <h4 className="font-semibold mb-3">
      {selectedSample.sampleType} Information
    </h4>

    {/* SPERM */}
    {formData.sampleType === "Sperm" && (
  <div>
    <h4 className="font-semibold mb-3">Sperm Quality Information</h4>

    <div className="grid grid-cols-2 gap-4">

      <div>
        <label>Volume</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.volume ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, volume: Number(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Concentration</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.concentration ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              concentration: Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>Motility (%)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.motility ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              motility: Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>Progressive Motility (%)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.progressiveMotility ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              progressiveMotility: Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>Morphology (%)</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.morphology ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              morphology: Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>pH</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.ph ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              ph: Number(e.target.value),
            })
          }
        />
      </div>

      <div>
        <label>Viscosity</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.viscosity ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              viscosity: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Liquefaction</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.liquefaction ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              liquefaction: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Color</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.color ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              color: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Total Sperm Count</label>
        <input
          type="number"
          className="w-full border rounded px-3 py-2"
          value={formData.totalSpermCount ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              totalSpermCount: Number(e.target.value),
            })
          }
        />
      </div>

    </div>
  </div>
)}


    {/* OOCYTE */}
    {formData.sampleType === "Oocyte" && (
  <div>
    <h4 className="font-semibold mb-3">Oocyte Quality Information</h4>

    <div className="grid grid-cols-2 gap-4">

      <div>
        <label>Maturity Stage</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.maturityStage ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, maturityStage: e.target.value })
          }
        />
      </div>

      <div>
        <label>Is Mature</label>
        <Switch
          value={formData.isMature}
          onChange={(v) =>
            setFormData({ ...formData, isMature: v })
          }
        />
      </div>

      <div>
        <label>Retrieval Date</label>
        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2"
          value={
            formData.retrievalDate
              ? formData.retrievalDate.slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              retrievalDate: new Date(e.target.value).toISOString(),
            })
          }
        />
      </div>

      <div>
        <label>Cumulus Cells</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.cumulusCells ?? ""}
          onChange={(e) =>
            setFormData({ ...formData, cumulusCells: e.target.value })
          }
        />
      </div>

      <div>
        <label>Cytoplasm Appearance</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={formData.cytoplasmAppearance ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              cytoplasmAppearance: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label>Is Vitrified</label>
        <Switch
          value={formData.isVitrified}
          onChange={(v) =>
            setFormData({ ...formData, isVitrified: v })
          }
        />
      </div>

      <div>
        <label>Vitrification Date</label>
        <input
          type="datetime-local"
          className="w-full border rounded px-3 py-2"
          value={
            formData.vitrificationDate
              ? formData.vitrificationDate.slice(0, 16)
              : ""
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              vitrificationDate: new Date(e.target.value).toISOString(),
            })
          }
        />
      </div>

    </div>
  </div>
)}
    {/* FOOTER */}
<div className="px-6 py-4 border-t flex justify-end gap-2">
  <button
    className="px-4 py-2 border rounded"
    onClick={closeModal}
  >
    Cancel
  </button>

  {!viewOnly && (
  <button
    className="px-6 py-2 bg-blue-600 text-white rounded"
    onClick={() => {
      console.log("CLICK SAVE");
      updateMutation.mutate();
    }}
  >
    Save
  </button>
)}

</div>
  </div>
</div>
</div>
</div>)}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
