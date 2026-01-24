// src/routes/lab-technician/thawing.tsx
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { EmptyState } from "@/components/admin/EmptyState";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { api } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/lab-technician/thawing")({
  component: ThawingPage,
});

type TabKey = "stored" | "exports";
type ModalMode = "none" | "viewSample" | "export" | "viewExport";

/** Dựa theo file cryo-import.api.ts bạn gửi */
type SampleType = "Oocyte" | "Sperm" | "Embryo";
type LabSampleStatus = "Stored" | "Used" | "Discarded";

type LabSample = {
  id: string;
  patientId: string;
  sampleCode: string;
  sampleType: SampleType;
  status: LabSampleStatus;
  collectionDate?: string;
  isAvailable?: boolean;
  isStoraged?: boolean;
  storageDate?: string;
  expiryDate?: string;
  quality?: string;
  notes?: string;
  canFrozen?: boolean;
  canFertilize?: boolean;
};

type CryoLocation = {
  id: string;
  name: string;
  code: string;
  type: "Bank" | "Tank" | "Canister" | "Slot";
  sampleType: SampleType;
  parentId?: string;
};

type CryoImport = {
  id: string;
  labSampleId: string;
  cryoLocationId: string;
  importDate: string;
  importedBy: string;
  witnessedBy: string;
  temperature: number;
  reason: string;
  notes: string;
  labSample: LabSample;
  cryoLocation: CryoLocation;
  createdAt: string;
  updatedAt: string;
};

/** CryoExport payload theo swagger bạn chụp (query params) */
type CreateCryoExportRequest = {
  labSampleId: string;
  cryoLocationId: string;
  exportDate: string;

  exportedBy?: string;
  witnessedBy?: string;
  reason?: string;
  destination?: string;
  notes?: string;

  isThawed?: boolean;
  thawingDate?: string;
  thawingResult?: string;
};

type CryoExport = {
  id: string;
  labSampleId: string;
  cryoLocationId: string;
  exportDate: string;
  exportedBy?: string;
  witnessedBy?: string;
  reason?: string;
  destination?: string;
  notes?: string;
  isThawed?: boolean;
  thawingDate?: string;
  thawingResult?: string;

  labSample?: LabSample;
  cryoLocation?: CryoLocation;

  createdAt?: string;
  updatedAt?: string;
};

function ThawingPage() {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabKey>("stored");
  const [searchTerm, setSearchTerm] = useState("");
  const [sampleTypeFilter, setSampleTypeFilter] = useState<
    "all" | SampleType
  >("all");

  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
  const [selectedExport, setSelectedExport] = useState<CryoExport | null>(null);

  const [exportForm, setExportForm] = useState<CreateCryoExportRequest>({
    labSampleId: "",
    cryoLocationId: "",
    exportDate: "",
    exportedBy: "",
    witnessedBy: "",
    reason: "",
    destination: "",
    notes: "",
    isThawed: false,
    thawingDate: "",
    thawingResult: "",
  });

  const closeModal = () => {
    setModalMode("none");
    setSelectedSample(null);
    setSelectedExport(null);
  };

  const fmtDate = (s?: string) => {
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toISOString().slice(0, 10);
  };

  const fmtDateTimeLocalValue = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const toIsoFromDateTimeLocal = (v: string) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  /* =========================
     QUERIES
  ========================= */

  // 1) Lấy danh sách import để map location theo sampleId
  const { data: importData } = useQuery({
    queryKey: ["cryoImports"],
    queryFn: () => api.cryoImport.getAll(),
  });

  const imports = (importData?.data ?? []) as CryoImport[];
  const importBySampleId = useMemo(() => {
    const map = new Map<string, CryoImport>();
    for (const it of imports) {
      if (!map.has(it.labSampleId)) map.set(it.labSampleId, it);
    }
    return map;
  }, [imports]);

  // 2) Stored samples
  const { data: sampleData, isLoading: isSamplesLoading, isFetching } = useQuery({
    queryKey: ["samples", { searchTerm, sampleTypeFilter }],
    queryFn: () =>
      api.sample.getSamples({
        Status: "Stored",
        SearchTerm: searchTerm || undefined,
        SampleType: sampleTypeFilter === "all" ? undefined : sampleTypeFilter,
        Page: 1,
        Size: 200,
      } as any),
  });

  const samples = (sampleData?.data ?? []) as LabSample[];

  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const code = (s.sampleCode ?? "").toLowerCase();
      const pid = (s.patientId ?? "").toLowerCase();
      const st = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !st || code.includes(st) || pid.includes(st);

      const matchesType =
        sampleTypeFilter === "all" || s.sampleType === sampleTypeFilter;

      // Status đã lọc từ API, nhưng vẫn giữ check cho chắc
      const matchesStatus = s.status === "Stored";

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [samples, searchTerm, sampleTypeFilter]);

  // 3) Export history
  const { data: exportData, isLoading: isExportsLoading } = useQuery({
    queryKey: ["cryoExports"],
    queryFn: async () => {
      // Bạn cần có api.cryoExport.getAll()
      // Nếu module tên khác, đổi lại tại đây
      return (api as any).cryoExport.getAll();
    },
    enabled: tab === "exports",
  });

  const exportsList = ((exportData?.data ?? []) as CryoExport[]) ?? [];

  /* =========================
     ACTIONS
  ========================= */

  const openViewSample = (s: LabSample) => {
    setSelectedSample(s);
    setModalMode("viewSample");
  };

  const openExport = (s: LabSample) => {
    const imp = importBySampleId.get(s.id);
    const cryoLocationId = imp?.cryoLocationId ?? "";

    setSelectedSample(s);
    setExportForm({
      labSampleId: s.id,
      cryoLocationId,
      exportDate: new Date().toISOString(),
      exportedBy: "",
      witnessedBy: "",
      reason: "",
      destination: "",
      notes: "",
      isThawed: false,
      thawingDate: "",
      thawingResult: "",
    });
    setModalMode("export");
  };

  const openViewExport = (ex: CryoExport) => {
    setSelectedExport(ex);
    setModalMode("viewExport");
  };

  /* =========================
     MUTATIONS
  ========================= */

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!exportForm.labSampleId || !exportForm.cryoLocationId || !exportForm.exportDate) {
        throw new Error("Vui lòng nhập đủ LabSampleId, CryoLocationId, ExportDate");
      }

      const payload: CreateCryoExportRequest = {
        labSampleId: exportForm.labSampleId,
        cryoLocationId: exportForm.cryoLocationId,
        exportDate: exportForm.exportDate,

        exportedBy: exportForm.exportedBy?.trim() || undefined,
        witnessedBy: exportForm.witnessedBy?.trim() || undefined,
        reason: exportForm.reason?.trim() || undefined,
        destination: exportForm.destination?.trim() || undefined,
        notes: exportForm.notes?.trim() || undefined,

        isThawed: Boolean(exportForm.isThawed),
        thawingDate: exportForm.thawingDate?.trim() || undefined,
        thawingResult: exportForm.thawingResult?.trim() || undefined,
      };

      // Bạn cần có api.cryoExport.create(payload) theo đúng style cryoImport
      return (api as any).cryoExport.create(payload);
    },
    onSuccess: () => {
      toast.success("Export thành công");
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      queryClient.invalidateQueries({ queryKey: ["cryoExports"] });
      closeModal();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Export thất bại");
    },
  });

  const canExportSubmit =
    !!exportForm.labSampleId &&
    !!exportForm.cryoLocationId &&
    !!exportForm.exportDate &&
    !exportMutation.isPending;

  /* =========================
     SMALL UI HELPERS
  ========================= */

  const SampleTypeBadge = ({ t }: { t: SampleType }) => {
    const cls =
      t === "Oocyte"
        ? "bg-amber-100 text-amber-800"
        : t === "Sperm"
          ? "bg-blue-100 text-blue-800"
          : "bg-emerald-100 text-emerald-800";

    const label = t === "Oocyte" ? "Egg" : t === "Sperm" ? "Sperm" : "Embryo";

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
        {label}
      </span>
    );
  };

  const StorageLocationText = ({ sampleId }: { sampleId: string }) => {
    const imp = importBySampleId.get(sampleId);
    if (!imp) return <span className="text-muted-foreground">-</span>;

    const loc = imp.cryoLocation;
    const name = loc?.name || loc?.code || "-";
    const type = loc?.type || "";
    return (
      <span title={`${type} ${name}`}>
        {type ? `${type} ` : ""}
        {name}
      </span>
    );
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Thawing"
            description="Manage stored samples and export records."
            breadcrumbs={[
              { label: "Dashboard", href: "/lab-technician/dashboard" },
              { label: "Thawing" },
            ]}
            actions={
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["samples"] })}
                disabled={isFetching}
              >
                Refresh
              </Button>
            }
          />

          {/* Tabs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab("stored")}
              className={`px-3 py-2 text-sm rounded-md border ${
                tab === "stored" ? "bg-muted" : "bg-background hover:bg-muted/40"
              }`}
            >
              Stored Samples
            </button>
            <button
              type="button"
              onClick={() => setTab("exports")}
              className={`px-3 py-2 text-sm rounded-md border ${
                tab === "exports" ? "bg-muted" : "bg-background hover:bg-muted/40"
              }`}
            >
              Export History
            </button>
          </div>

          {tab === "stored" ? (
            <>
              <ListToolbar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search by sample code or patient id"
                filters={
                  <div className="flex items-center gap-2">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={sampleTypeFilter}
                      onChange={(e) => setSampleTypeFilter(e.target.value as any)}
                    >
                      <option value="all">All types</option>
                      <option value="Oocyte">Egg</option>
                      <option value="Sperm">Sperm</option>
                      <option value="Embryo">Embryo</option>
                    </select>

                    <Button
                      variant="outline"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["samples"] })}
                      disabled={isFetching}
                    >
                      Refresh
                    </Button>
                  </div>
                }
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stored samples</CardTitle>
                </CardHeader>

                <CardContent>
                  {isSamplesLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      Loading samples…
                    </div>
                  ) : filteredSamples.length === 0 ? (
                    <EmptyState
                      title="No stored samples found"
                      description="Try adjusting your search or filters."
                    />
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="p-3 text-left">Sample Code</th>
                            <th className="p-3 text-left">Patient</th>
                            <th className="p-3 text-left">Sample Type</th>
                            <th className="p-3 text-left">Expiry Date</th>
                            <th className="p-3 text-left">Storage Location</th>
                            <th className="p-3 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSamples.map((s) => (
                            <tr key={s.id} className="border-t hover:bg-muted/30">
                              <td className="p-3">
                                <div className="font-medium">{s.sampleCode || "-"}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {s.id}
                                </div>
                              </td>
                              <td className="p-3">{s.patientId || "-"}</td>
                              <td className="p-3">
                                <SampleTypeBadge t={s.sampleType} />
                              </td>
                              <td className="p-3">{fmtDate(s.expiryDate)}</td>
                              <td className="p-3">
                                <StorageLocationText sampleId={s.id} />
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => openViewSample(s)}>
                                    View
                                  </Button>
                                  <Button size="sm" onClick={() => openExport(s)}>
                                    Export
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export records</CardTitle>
              </CardHeader>
              <CardContent>
                {isExportsLoading ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Loading exports…
                  </div>
                ) : exportsList.length === 0 ? (
                  <EmptyState
                    title="No export records"
                    description="No samples have been exported yet."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="p-3 text-left">Sample</th>
                          <th className="p-3 text-left">Location</th>
                          <th className="p-3 text-left">Export Date</th>
                          <th className="p-3 text-left">Thawed</th>
                          <th className="p-3 text-left">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportsList.map((ex) => (
                          <tr key={ex.id} className="border-t hover:bg-muted/30">
                            <td className="p-3">
                              <div className="font-medium">
                                {ex.labSample?.sampleCode ?? ex.labSampleId}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Patient: {ex.labSample?.patientId ?? "-"}
                              </div>
                            </td>
                            <td className="p-3">
                              {ex.cryoLocation?.type
                                ? `${ex.cryoLocation.type} ${ex.cryoLocation.name || ex.cryoLocation.code}`
                                : ex.cryoLocationId}
                            </td>
                            <td className="p-3">{fmtDate(ex.exportDate)}</td>
                            <td className="p-3">
                              {ex.isThawed ? (
                                <span className="text-emerald-700 font-medium">Yes</span>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Button size="sm" variant="outline" onClick={() => openViewExport(ex)}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* =========================
              MODALS
          ========================= */}

          {modalMode !== "none" ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-2xl rounded-xl bg-background shadow-lg border">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div className="font-semibold">
                    {modalMode === "viewSample"
                      ? "Sample Details"
                      : modalMode === "export"
                        ? "Export Sample"
                        : "Export Details"}
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md px-2 py-1 text-sm hover:bg-muted"
                  >
                    Close
                  </button>
                </div>

                <div className="px-5 py-4">
                  {modalMode === "viewSample" && selectedSample ? (
                    <div className="space-y-4">
                      <InfoRow label="Sample Code" value={selectedSample.sampleCode || "-"} />
                      <InfoRow label="Sample ID" value={selectedSample.id} />
                      <InfoRow label="Patient ID" value={selectedSample.patientId || "-"} />
                      <InfoRow label="Sample Type" value={selectedSample.sampleType} />
                      <InfoRow label="Status" value={selectedSample.status} />
                      <InfoRow label="Storage Date" value={fmtDate(selectedSample.storageDate)} />
                      <InfoRow label="Expiry Date" value={fmtDate(selectedSample.expiryDate)} />
                      <InfoRow label="Quality" value={selectedSample.quality || "-"} />
                      <InfoRow label="Notes" value={selectedSample.notes || "-"} />

                      <div className="pt-2 border-t" />

                      {(() => {
                        const imp = importBySampleId.get(selectedSample.id);
                        if (!imp) {
                          return (
                            <div className="text-sm text-muted-foreground">
                              Không tìm thấy thông tin import cho mẫu này.
                            </div>
                          );
                        }
                        const loc = imp.cryoLocation;
                        return (
                          <div className="space-y-2">
                            <div className="font-medium">Storage location</div>
                            <InfoRow label="CryoImport ID" value={imp.id} />
                            <InfoRow label="Import Date" value={fmtDate(imp.importDate)} />
                            <InfoRow label="Location ID" value={imp.cryoLocationId} />
                            <InfoRow
                              label="Location"
                              value={`${loc.type} ${loc.name || loc.code}`}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}

                  {modalMode === "export" && selectedSample ? (
                    <div className="space-y-5">
                      <div className="rounded-lg border p-3 bg-muted/20">
                        <div className="text-sm font-medium">
                          {selectedSample.sampleCode} ({selectedSample.sampleType})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sample ID: {selectedSample.id}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          label="LabSampleId"
                          value={exportForm.labSampleId}
                          onChange={(v) => setExportForm((p) => ({ ...p, labSampleId: v }))}
                        />
                        <Field
                          label="CryoLocationId"
                          value={exportForm.cryoLocationId}
                          onChange={(v) => setExportForm((p) => ({ ...p, cryoLocationId: v }))}
                        />

                        <DateTimeField
                          label="ExportDate"
                          value={fmtDateTimeLocalValue(exportForm.exportDate)}
                          onChange={(v) =>
                            setExportForm((p) => ({ ...p, exportDate: toIsoFromDateTimeLocal(v) }))
                          }
                        />

                        <SelectBool
                          label="IsThawed"
                          value={Boolean(exportForm.isThawed)}
                          onChange={(v) => setExportForm((p) => ({ ...p, isThawed: v }))}
                        />

                        <Field
                          label="ExportedBy"
                          value={exportForm.exportedBy || ""}
                          onChange={(v) => setExportForm((p) => ({ ...p, exportedBy: v }))}
                          placeholder="uuid"
                        />
                        <Field
                          label="WitnessedBy"
                          value={exportForm.witnessedBy || ""}
                          onChange={(v) => setExportForm((p) => ({ ...p, witnessedBy: v }))}
                          placeholder="uuid"
                        />

                        <Field
                          label="Reason"
                          value={exportForm.reason || ""}
                          onChange={(v) => setExportForm((p) => ({ ...p, reason: v }))}
                        />
                        <Field
                          label="Destination"
                          value={exportForm.destination || ""}
                          onChange={(v) => setExportForm((p) => ({ ...p, destination: v }))}
                        />

                        <DateTimeField
                          label="ThawingDate"
                          value={fmtDateTimeLocalValue(exportForm.thawingDate)}
                          onChange={(v) =>
                            setExportForm((p) => ({ ...p, thawingDate: toIsoFromDateTimeLocal(v) }))
                          }
                        />

                        <Field
                          label="ThawingResult"
                          value={exportForm.thawingResult || ""}
                          onChange={(v) => setExportForm((p) => ({ ...p, thawingResult: v }))}
                        />

                        <TextArea
                          label="Notes"
                          value={exportForm.notes || ""}
                          onChange={(v) => setExportForm((p) => ({ ...p, notes: v }))}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" onClick={closeModal}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => exportMutation.mutate()}
                          disabled={!canExportSubmit}
                        >
                          {exportMutation.isPending ? "Exporting…" : "Confirm export"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {modalMode === "viewExport" && selectedExport ? (
                    <div className="space-y-4">
                      <InfoRow label="Export ID" value={selectedExport.id} />
                      <InfoRow label="LabSampleId" value={selectedExport.labSampleId} />
                      <InfoRow label="CryoLocationId" value={selectedExport.cryoLocationId} />
                      <InfoRow label="ExportDate" value={selectedExport.exportDate} />
                      <InfoRow label="ExportedBy" value={selectedExport.exportedBy || "-"} />
                      <InfoRow label="WitnessedBy" value={selectedExport.witnessedBy || "-"} />
                      <InfoRow label="Reason" value={selectedExport.reason || "-"} />
                      <InfoRow label="Destination" value={selectedExport.destination || "-"} />
                      <InfoRow label="Notes" value={selectedExport.notes || "-"} />
                      <InfoRow label="IsThawed" value={selectedExport.isThawed ? "true" : "false"} />
                      <InfoRow label="ThawingDate" value={selectedExport.thawingDate || "-"} />
                      <InfoRow label="ThawingResult" value={selectedExport.thawingResult || "-"} />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/* =========================
   SMALL FORM COMPONENTS
========================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="md:col-span-2 text-sm font-medium break-words">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <input
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1 md:col-span-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <textarea
        className="min-h-[84px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <input
        type="datetime-local"
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectBool({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <select
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
      >
        <option value="false">false</option>
        <option value="true">true</option>
      </select>
    </div>
  );
}
