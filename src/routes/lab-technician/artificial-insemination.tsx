// src/routes/lab-technician/artificial-insemination.tsx
import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/lab-technician/artificial-insemination")({
  component: ArtificialInseminationPage,
});

type TabKey = "insemination" |"embryo";

/* ================= UTIL ================= */

function formatDateTime(v: any) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "-";
  }
}



/* ================= MODAL WRAPPER ================= */

function ArtificialInseminationPage() {
  const queryClient = useQueryClient();

  /* ================= STATE TAB ================= */
  const [activeTab, setActiveTab] = useState<TabKey>("insemination");

  /* ================= STATE TAB 1 ================= */
  const [selectedOocyte, setSelectedOocyte] = useState<any | null>(null);
  const [selectedSperm, setSelectedSperm] = useState<any | null>(null);



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
      toast.success("Embryo created successfully");
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
      const message = err?.response?.data?.message || err?.message || "Failed to create embryo";
      toast.error(message);
    },
  });

  const selectedOocytePatient = getPatientLabel(selectedOocyte?.patientId);
  const partnerPatient = getPatientLabel(partnerPatientId);

  

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
        
      </DashboardLayout>
    </ProtectedRoute>
  );
}
