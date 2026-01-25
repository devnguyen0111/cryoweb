import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import api from "@/api/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";

/* =====================
   ROUTE
===================== */

export const Route = createFileRoute("/lab-technician/cryostorage")({
  component: () => (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <CryostoragePage />
      </DashboardLayout>
    </ProtectedRoute>
  ),
});

/* =====================
   UI TYPES (FE-only)
===================== */

type CryoNodeType = "Tank" | "Canister" | "Goblet" | "Slot";

interface CryoNode {
  id: string;
  name: string;
  type: CryoNodeType;
  sampleCount?: number;
  parentId?: string;
  children?: CryoNode[];
  isLoaded?: boolean;
}

interface FrozenSample {
  id: string;
  sampleCode: string;
  sampleType: string;
  status: string;
}

interface LabUser {
  id: string;
  fullName: string;
}

interface SlotStoredSample {
  cryoImportId: string;
  labSampleId: string;
  sampleCode: string;
  sampleType: string;
  status: string;
  importDate?: string;
  importedByName?: string;
  witnessedByName?: string;
}

/* =====================
   HELPERS
===================== */

const extractNumber = (text: string) => {
  const m = String(text ?? "").match(/\d+/);
  return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
};

const sortByNumberInName = <T extends { name: string }>(list: T[]) => {
  return [...list].sort((a, b) => extractNumber(a.name) - extractNumber(b.name));
};

const normalizeNodeType = (t: any): CryoNodeType => {
  const s = String(t ?? "").toLowerCase();
  if (s.includes("tank")) return "Tank";
  if (s.includes("canister")) return "Canister";
  if (s.includes("goblet")) return "Goblet";
  return "Slot";
};

const unwrapArray = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.result)) return res.result;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data?.result)) return res.data.result;
  return [];
};

const normalizeNodes = (raw: any): CryoNode[] => {
  const nodes = unwrapArray(raw);

  const mapped: CryoNode[] = nodes.map((n: any) => ({
    id: String(n.id),
    name: String(n.name ?? ""),
    type: normalizeNodeType(n.type),
    sampleCount: typeof n.sampleCount === "number" ? n.sampleCount : Number(n.sampleCount ?? 0) || 0,
    parentId: n.parentId ? String(n.parentId) : undefined,
    children: Array.isArray(n.children) ? normalizeNodes(n.children) : undefined,
    isLoaded: Array.isArray(n.children) ? true : false,
  }));

  return sortByNumberInName(mapped);
};

const updateNodeChildren = (
  nodes: CryoNode[],
  nodeId: string,
  children: CryoNode[],
): CryoNode[] => {
  return nodes.map((n) => {
    if (n.id === nodeId) return { ...n, children, isLoaded: true };
    if (n.children?.length) {
      return { ...n, children: updateNodeChildren(n.children, nodeId, children) };
    }
    return n;
  });
};

const toFullName = (u: any) =>
  String(u?.fullName ?? u?.name ?? u?.email ?? u?.username ?? "").trim();

/* =====================
   PAGE
===================== */

function CryostoragePage() {
  const [tree, setTree] = useState<CryoNode[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CryoNode | null>(null);

  const [frozenSamples, setFrozenSamples] = useState<FrozenSample[]>([]);
  const [selectedSample, setSelectedSample] = useState<FrozenSample | null>(null);

  const [labUsers, setLabUsers] = useState<LabUser[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);

  // Slot view
  const [slotSamples, setSlotSamples] = useState<SlotStoredSample[]>([]);
  const [loadingSlotSamples, setLoadingSlotSamples] = useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const currentUserId = String((currentUser as any)?.id ?? "");

  const [importForm, setImportForm] = useState({
    importedBy: currentUserId,
    witnessedBy: "",
    temperature: -196,
    reason: "Store frozen sample",
    notes: "",
  });

  useEffect(() => {
    void loadInitialTree();
    void loadFrozenSamples();
    void loadLabUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setImportForm((prev) => ({
      ...prev,
      importedBy: prev.importedBy || currentUserId,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  /* =====================
     LOADERS
  ===================== */

  const loadInitialTree = async () => {
    setLoadingTree(true);
    try {
      const res = await api.cryoLocation.getInitialTree();
      setTree(normalizeNodes(res));
    } catch {
      setTree([]);
    } finally {
      setLoadingTree(false);
    }
  };

  const loadChildren = async (parentId: string) => {
    const res = await api.cryoLocation.getChildren(parentId);
    return normalizeNodes(res);
  };

  const loadFrozenSamples = async () => {
    const res = await api.sample.getSamples({ status: "Frozen" });
    const rows = unwrapArray(res);

    const mapped: FrozenSample[] = rows.map((x: any) => ({
      id: String(x.id),
      sampleCode: String(x.sampleCode ?? x.code ?? ""),
      sampleType: String(x.sampleType ?? ""),
      status: String(x.status ?? ""),
    }));

    setFrozenSamples(mapped);
  };

  const loadLabUsers = async () => {
    try {
      const res = await api.user.getUsers({
        role: "LaboratoryTechnician",
        isActive: true,
      });

      const rows = unwrapArray(res);

      const mapped: LabUser[] = rows.map((u: any) => ({
        id: String(u.id),
        fullName: String(u.fullName ?? u.name ?? u.email ?? "Lab user"),
      }));

      setLabUsers(mapped);
    } catch {
      setLabUsers([]);
    }
  };

  /**
   * =====================
   * SLOT VIEW (Method B)
   * Each slot contains max 1 sample.
   *
   * We try these in order:
   * 1) api.cryoImport.getByLocation(slotId) if your FE has it
   * 2) api.cryoImport.getAll({ cryoLocationId: slotId, pageSize: 50 }) if BE supports filtering
   * 3) api.cryoImport.getAll() then filter client-side (may miss if paginated)
   * Then take latest importDate, and show labSample from BE response
   * =====================
   */
  const loadSlotSamples = async (slotId: string) => {
    setLoadingSlotSamples(true);
    try {
      const cryoImportApi: any = (api as any).cryoImport;

      let rawRes: any;

      if (typeof cryoImportApi?.getByLocation === "function") {
        rawRes = await cryoImportApi.getByLocation(slotId);
      } else if (typeof cryoImportApi?.getAll === "function") {
        // Try with filter params (if BE supports)
        try {
          rawRes = await cryoImportApi.getAll({
            cryoLocationId: slotId,
            page: 1,
            pageSize: 50,
          });
        } catch {
          rawRes = await cryoImportApi.getAll();
        }
      } else {
        setSlotSamples([]);
        return;
      }

      // Normalize possible shapes
      const data = rawRes?.data ?? rawRes;
      let rows = unwrapArray(data);

      // Case: BaseResponse with data = object (single cryoImport)
      if (rows.length === 0) {
        const single = data?.data ?? data;
        if (single && typeof single === "object" && single.cryoLocationId) {
          rows = [single];
        }
      }

      // Filter by slotId
      const filtered = rows.filter((x: any) => String(x?.cryoLocationId ?? "") === String(slotId));

      // Sort by importDate desc
      filtered.sort((a: any, b: any) => {
        const ta = Date.parse(a?.importDate ?? "") || 0;
        const tb = Date.parse(b?.importDate ?? "") || 0;
        return tb - ta;
      });

      const latest = filtered[0];
      if (!latest) {
        setSlotSamples([]);
        return;
      }

      // If your getAll does NOT include nested labSample, but getById does,
      // we will fetch detail by id to get labSample.
      let detail = latest;
      if (!detail?.labSample && detail?.id && typeof cryoImportApi?.getById === "function") {
        try {
          const d = await cryoImportApi.getById(String(detail.id));
          detail = d?.data?.data ?? d?.data ?? d;
        } catch {
          // keep latest
        }
      }

      const labSample = detail?.labSample ?? {};
      const importedByName =
        toFullName(detail?.importedBy) ||
        toFullName(detail?.importedByInfo) ||
        toFullName(detail?.importedByUser) ||
        "";

      const witnessedByName =
        toFullName(detail?.witnessedByInfo) ||
        toFullName(detail?.witnessedByUser) ||
        "";

      const mapped: SlotStoredSample = {
        cryoImportId: String(detail?.id ?? ""),
        labSampleId: String(detail?.labSampleId ?? labSample?.id ?? ""),
        sampleCode: String(labSample?.sampleCode ?? detail?.sampleCode ?? ""),
        sampleType: String(labSample?.sampleType ?? detail?.sampleType ?? ""),
        status: String(labSample?.status ?? detail?.status ?? ""),
        importDate: detail?.importDate ? String(detail.importDate) : undefined,
        importedByName: importedByName || undefined,
        witnessedByName: witnessedByName || undefined,
      };

      setSlotSamples([mapped]);
    } catch {
      setSlotSamples([]);
    } finally {
      setLoadingSlotSamples(false);
    }
  };

  /* =====================
     EXPLORER ACTIONS
  ===================== */

  const toggleExpand = async (node: CryoNode) => {
    const isExpanded = expandedIds.includes(node.id);

    if (isExpanded) {
      setExpandedIds((prev) => prev.filter((x) => x !== node.id));
      return;
    }

    setExpandedIds((prev) => [...prev, node.id]);

    if (!node.isLoaded && node.type !== "Slot") {
      const children = await loadChildren(node.id);
      setTree((prev) => updateNodeChildren(prev, node.id, children));
    }
  };

  const handleNodeClick = async (node: CryoNode) => {
    if (node.type === "Slot") {
      setSelectedSlot(node);
      await loadSlotSamples(node.id);
      return;
    }
    await toggleExpand(node);
  };

  const renderNode = (node: CryoNode, level = 0) => {
    const isExpanded = expandedIds.includes(node.id);
    const isSlot = node.type === "Slot";

    return (
      <div key={node.id} style={{ marginLeft: level * 14 }}>
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer select-none
          ${selectedSlot?.id === node.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
          onClick={() => void handleNodeClick(node)}
        >
          <span>
  {!isSlot && node.type === "Tank" && (isExpanded ? "🛢️" : "🗄️")}
  {!isSlot && node.type === "Canister" && "🧊"}
  {!isSlot && node.type === "Goblet" && "🧪"}
  {isSlot && "🔲"}
</span>
          <span>{node.name}</span>
          {node.type === "Slot" && typeof node.sampleCount === "number" && (
            <span className="ml-auto text-xs text-gray-400">count: {node.sampleCount}</span>
          )}
        </div>

        {isExpanded && node.children?.map((child) => renderNode(child, level + 1))}
      </div>
    );
  };

  /* =====================
     IMPORT
  ===================== */

  const canConfirmImport =
    !!selectedSample && !!selectedSlot && selectedSlot.type === "Slot";

  const openImportModal = () => {
    setShowImportModal(true);
  };

  const submitImport = async () => {
    if (!selectedSample || !selectedSlot) return;

    if (!importForm.importedBy) {
      toast.error("Please select Imported By");
      return;
    }

    if (!importForm.witnessedBy) {
      toast.error("Please select Witnessed By");
      return;
    }

    setLoadingImport(true);
    try {
      // IMPORTANT: create must send query params (Swagger shows query),
      // so please update cryo-import.api.ts accordingly (see section 2 below)
      await api.cryoImport.create({
        labSampleId: selectedSample.id,
        cryoLocationId: selectedSlot.id,
        importDate: new Date().toISOString(),
        importedBy: importForm.importedBy,
        witnessedBy: importForm.witnessedBy,
        temperature: Number(importForm.temperature),
        reason: importForm.reason,
        notes: importForm.notes,
      });

      toast.success("Sample imported successfully");

      // Refresh lists
      await loadFrozenSamples();
      await loadSlotSamples(selectedSlot.id);

      setSelectedSample(null);
      setShowImportModal(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Import failed";
      toast.error(msg);
    } finally {
      setLoadingImport(false);
    }
  };

  /* =====================
     UI
  ===================== */

  const witnessOptions = labUsers.filter((u) => u.id !== importForm.importedBy);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Cryo Storage</h2>

        <button
          onClick={openImportModal}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Import Sample
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        <div className="border rounded p-4 overflow-auto">
          {loadingTree && <div className="text-gray-500">Loading tanks...</div>}
          {!loadingTree && tree.length === 0 && (
            <div className="text-gray-400">No tanks found</div>
          )}
          {tree.map((n) => renderNode(n))}
        </div>

        <div className="col-span-2 border rounded p-6 overflow-auto">
          <div className="flex items-start justify-between mb-3 gap-3">
            <div>
              <h3 className="font-semibold">Frozen Samples</h3>
              <div className="text-sm text-gray-500">
                Select a frozen sample, then select a Slot on the left.
              </div>
            </div>

            {selectedSlot ? (
              <div className="text-sm text-gray-600">
                Selected Slot:{" "}
                <span className="font-medium">{selectedSlot.name}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No slot selected</div>
            )}
          </div>

          {/* SLOT DETAIL */}
          {selectedSlot && (
            <div className="mb-4 border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Slot Details</div>

                <button
                  className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                  onClick={() => void loadSlotSamples(selectedSlot.id)}
                  disabled={loadingSlotSamples}
                >
                  {loadingSlotSamples ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Slot sampleCount:{" "}
                <span className="font-medium">{selectedSlot.sampleCount ?? 0}</span>
              </div>

              {loadingSlotSamples && (
                <div className="text-gray-500 mt-2">Loading slot data...</div>
              )}

              {!loadingSlotSamples && slotSamples.length === 0 && (
                <div className="text-gray-400 mt-2">This slot is empty</div>
              )}

              {!loadingSlotSamples && slotSamples.length > 0 && (
                <div className="mt-2 space-y-2">
                  {slotSamples.map((x) => (
                    <div key={x.cryoImportId} className="border rounded p-2">
                      <div className="font-medium">
                        {x.sampleCode || x.labSampleId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {x.sampleType} • {x.status}
                      </div>

                      {x.importDate && (
                        <div className="text-xs text-gray-400 mt-1">
                          Import Date: {new Date(x.importDate).toLocaleString()}
                        </div>
                      )}

                      {x.importedByName && (
                        <div className="text-xs text-gray-400">
                          Imported By: {x.importedByName}
                        </div>
                      )}

                      {x.witnessedByName && (
                        <div className="text-xs text-gray-400">
                          Witnessed By: {x.witnessedByName}
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        CryoImport ID: {x.cryoImportId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FROZEN LIST */}
          {frozenSamples.length === 0 && (
            <div className="text-gray-400">No frozen samples available</div>
          )}

          {frozenSamples.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSample(s)}
              className={`border rounded p-3 mb-2 cursor-pointer
                ${
                  selectedSample?.id === s.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
            >
              <div className="font-medium">{s.sampleCode}</div>
              <div className="text-sm text-gray-500">
                {s.sampleType} • {s.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import Sample</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-2 py-1 rounded hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Selected Sample</div>
                <div className="border rounded p-2">
                  {selectedSample ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selectedSample.sampleCode}</div>
                        <div className="text-sm text-gray-500">{selectedSample.sampleType}</div>
                      </div>
                      <button
                        className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                        onClick={() => setSelectedSample(null)}
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      Please select a frozen sample on the right.
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Selected Slot</div>
                <div className="border rounded p-2">
                  {selectedSlot ? (
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{selectedSlot.name}</div>
                      <button
                        className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
                        onClick={() => setSelectedSlot(null)}
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-400">Please click a Slot in the left tree.</div>
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Imported By</div>
                <select
                  className="border p-2 w-full rounded"
                  value={importForm.importedBy}
                  onChange={(e) =>
                    setImportForm((prev) => ({ ...prev, importedBy: e.target.value }))
                  }
                >
                  <option value="">Select Imported By</option>
                  {labUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>

                {!!currentUserId && (
                  <div className="text-xs text-gray-400 mt-1">
                    Default is current logged-in user (if available).
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Witnessed By</div>
                <select
                  className="border p-2 w-full rounded"
                  value={importForm.witnessedBy}
                  onChange={(e) =>
                    setImportForm((prev) => ({ ...prev, witnessedBy: e.target.value }))
                  }
                >
                  <option value="">Select Witness</option>
                  {witnessOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Temperature</div>
                <input
                  className="border p-2 w-full rounded"
                  type="number"
                  value={importForm.temperature}
                  onChange={(e) =>
                    setImportForm((prev) => ({
                      ...prev,
                      temperature: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Import Date</div>
                <input
                  className="border p-2 w-full rounded bg-gray-50"
                  readOnly
                  value={new Date().toISOString()}
                />
              </div>

              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Reason</div>
                <input
                  className="border p-2 w-full rounded"
                  value={importForm.reason}
                  onChange={(e) =>
                    setImportForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                />
              </div>

              <div className="col-span-2">
                <div className="text-sm text-gray-500 mb-1">Notes</div>
                <textarea
                  className="border p-2 w-full rounded"
                  rows={3}
                  value={importForm.notes}
                  onChange={(e) =>
                    setImportForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Confirm will import the selected sample into the selected slot.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={loadingImport}
                >
                  Cancel
                </button>

                <button
                  onClick={() => void submitImport()}
                  disabled={!canConfirmImport || loadingImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  title={canConfirmImport ? "" : "Select both a frozen sample and a slot"}
                >
                  {loadingImport ? "Importing..." : "Confirm Import"}
                </button>
              </div>
            </div>

            {!canConfirmImport && (
              <div className="mt-3 text-sm text-red-500">
                Please select 1 Frozen Sample and 1 Slot before confirming.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CryostoragePage;
