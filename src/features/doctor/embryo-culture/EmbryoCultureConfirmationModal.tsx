import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { toast } from "sonner";
import type {
  TreatmentCycle,
  LabSampleDetailResponse,
  CreateLabSampleEmbryoRequest,
  Treatment,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";

interface EmbryoRow {
  id: string;
  code: string;
  dayOfDevelopment: string;
  grade: string;
  cellCount: number;
  quality: string;
  notes: string;
  creationDate: string;
}

interface EmbryoCultureConfirmationModalProps {
  cycleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmbryoCultureConfirmationModal({
  cycleId,
  isOpen,
  onClose,
  onSuccess,
}: EmbryoCultureConfirmationModalProps) {
  const [embryos, setEmbryos] = useState<EmbryoRow[]>([]);
  const [embryoCounter, setEmbryoCounter] = useState(1);
  const [labTechName, setLabTechName] = useState("");
  const [confirmationDate, setConfirmationDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [generalNotes, setGeneralNotes] = useState("");

  const { data: cycle, isLoading: cycleLoading } =
    useQuery<TreatmentCycle | null>({
      enabled: isOpen && Boolean(cycleId),
      queryKey: ["treatment-cycle", cycleId, "culture-modal"],
      retry: false,
      queryFn: async () => {
        if (!cycleId) return null;
        try {
          const response =
            await api.treatmentCycle.getTreatmentCycleById(cycleId);
          return response.data ?? null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
    });

  // Fetch existing embryos for this cycle
  const { data: existingEmbryos, isLoading: embryosLoading } = useQuery<
    LabSampleDetailResponse[]
  >({
    enabled: isOpen && Boolean(cycleId),
    queryKey: ["embryos", "cycle", cycleId, "culture-modal"],
    queryFn: async () => {
      if (!cycleId) return [];
      try {
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Embryo",
          Page: 1,
          Size: 100,
        });
        return (response.data ?? []).filter(
          (e) => e.treatmentCycleId === cycleId
        );
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch patient details for patient name
  const { data: patientDetails } = useQuery({
    enabled: isOpen && Boolean(cycle?.patientId),
    queryKey: ["patient-details", cycle?.patientId, "embryo-culture-modal"],
    queryFn: async () => {
      if (!cycle?.patientId) return null;
      try {
        const response = await api.patient.getPatientDetails(cycle.patientId);
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          try {
            const fallback = await api.patient.getPatientById(cycle.patientId);
            return fallback.data ?? null;
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
    enabled: isOpen && Boolean(cycle?.patientId),
    queryKey: ["user-details", cycle?.patientId, "embryo-culture-modal"],
    queryFn: async () => {
      if (!cycle?.patientId) return null;
      try {
        const response = await api.user.getUserDetails(cycle.patientId);
        return response.data ?? null;
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 || error.response?.status === 403)
        ) {
          return null;
        }
        return null;
      }
    },
  });

  // Fetch treatment to get treatmentType
  const { data: treatmentData } = useQuery<Treatment | null>({
    enabled: isOpen && Boolean(cycle?.treatmentId),
    queryKey: ["treatment", cycle?.treatmentId, "embryo-culture-modal"],
    queryFn: async () => {
      if (!cycle?.treatmentId) return null;
      try {
        const response = await api.treatment.getTreatmentById(
          cycle.treatmentId
        );
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
    retry: false,
  });

  // Initialize embryos from existing data
  useEffect(() => {
    if (existingEmbryos && existingEmbryos.length > 0) {
      const initialEmbryos: EmbryoRow[] = existingEmbryos.map(
        (embryo, index) => ({
          id: embryo.id,
          code: embryo.sampleCode || `E${String(index + 1).padStart(3, "0")}`,
          dayOfDevelopment: embryo.embryo?.dayOfDevelopment?.toString() || "",
          grade: embryo.embryo?.grade || "",
          cellCount: embryo.embryo?.cellCount || embryo.embryo?.quantity || 0,
          quality: embryo.embryo?.quality || "",
          notes: embryo.notes || "",
          creationDate: embryo.embryo?.creationDate
            ? new Date(embryo.embryo.creationDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        })
      );
      setEmbryos(initialEmbryos);
      setEmbryoCounter(existingEmbryos.length + 1);
    } else {
      // Initialize with one empty row
      setEmbryos([
        {
          id: `new-${embryoCounter}`,
          code: `E${String(embryoCounter).padStart(3, "0")}`,
          dayOfDevelopment: "",
          grade: "",
          cellCount: 0,
          quality: "",
          notes: "",
          creationDate: new Date().toISOString().split("T")[0],
        },
      ]);
      setEmbryoCounter(2);
    }
  }, [existingEmbryos]);

  const addEmbryoRow = () => {
    const newEmbryo: EmbryoRow = {
      id: `new-${embryoCounter}`,
      code: `E${String(embryoCounter).padStart(3, "0")}`,
      dayOfDevelopment: "",
      grade: "",
      cellCount: 0,
      quality: "",
      notes: "",
      creationDate: new Date().toISOString().split("T")[0],
    };
    setEmbryos([...embryos, newEmbryo]);
    setEmbryoCounter((prev) => prev + 1);
  };

  const updateEmbryoRow = (id: string, field: keyof EmbryoRow, value: any) => {
    setEmbryos(
      embryos.map((embryo) =>
        embryo.id === id ? { ...embryo, [field]: value } : embryo
      )
    );
  };

  const removeEmbryoRow = (id: string) => {
    setEmbryos(embryos.filter((e) => e.id !== id));
  };

  const createEmbryoMutation = useMutation({
    mutationFn: async (data: CreateLabSampleEmbryoRequest) => {
      return api.sample.createEmbryoSample(data);
    },
    onSuccess: () => {
      toast.success("Embryo culture confirmed successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Unable to confirm embryo culture"
      );
    },
  });

  const updateEmbryoMutation = useMutation({
    mutationFn: async ({
      embryoId,
      dayOfDevelopment,
      grade,
      cellCount,
      quality,
      notes,
    }: {
      embryoId: string;
      dayOfDevelopment?: number;
      grade?: string;
      cellCount?: number;
      quality?: string;
      notes?: string;
    }) => {
      return api.sample.updateEmbryoSample(embryoId, {
        status: undefined,
        notes,
        quality,
        dayOfDevelopment,
        grade,
        cellCount,
        quantity: cellCount,
      });
    },
    onSuccess: () => {
      toast.success("Embryo updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Unable to update embryo");
    },
  });

  const handleSubmit = async () => {
    if (embryos.length === 0) {
      toast.error("Please add at least one embryo");
      return;
    }

    // Validate embryos
    for (const embryo of embryos) {
      if (!embryo.code) {
        toast.error("Please enter embryo code for all embryos");
        return;
      }
      if (embryo.cellCount <= 0) {
        toast.error("Cell count must be greater than 0");
        return;
      }
    }

    if (!cycle?.patientId) {
      toast.error("Patient information not found");
      return;
    }

    try {
      // Fetch oocyte and sperm samples for this patient
      // Fetch enough samples to find the ones belonging to this cycle
      const oocyteResponse = await api.sample.getAllDetailSamples({
        SampleType: "Oocyte",
        PatientId: cycle.patientId,
        Page: 1,
        Size: 100, // Fetch more samples to find the correct one
        Sort: "collectionDate",
        Order: "desc",
      });
      const spermResponse = await api.sample.getAllDetailSamples({
        SampleType: "Sperm",
        PatientId: cycle.patientId,
        Page: 1,
        Size: 100, // Fetch more samples to find the correct one
        Sort: "collectionDate",
        Order: "desc",
      });

      // Find samples that belong to this treatment cycle
      // Priority: 1) samples with treatmentCycleId === cycleId, 2) samples without treatmentCycleId (fallback)
      const oocyteSamples = oocyteResponse.data || [];
      const spermSamples = spermResponse.data || [];

      // First, try to find samples that explicitly belong to this cycle
      let oocyteSample = oocyteSamples.find(
        (s) => s.treatmentCycleId === cycleId
      );
      let spermSample = spermSamples.find(
        (s) => s.treatmentCycleId === cycleId
      );

      // If not found, fallback to samples without treatmentCycleId (legacy samples)
      // This is useful for backward compatibility
      if (!oocyteSample) {
        oocyteSample = oocyteSamples.find((s) => !s.treatmentCycleId);
      }
      if (!spermSample) {
        spermSample = spermSamples.find((s) => !s.treatmentCycleId);
      }

      // Log warning if samples don't belong to this cycle (for debugging)
      if (process.env.NODE_ENV === "development") {
        if (oocyteSample && oocyteSample.treatmentCycleId !== cycleId) {
          console.warn(
            `[EmbryoCultureConfirmationModal] Using oocyte sample without treatmentCycleId for cycle ${cycleId}`
          );
        }
        if (spermSample && spermSample.treatmentCycleId !== cycleId) {
          console.warn(
            `[EmbryoCultureConfirmationModal] Using sperm sample without treatmentCycleId for cycle ${cycleId}`
          );
        }
      }

      // Validate that we have patientId
      if (!cycle.patientId) {
        toast.error("Patient information not found");
        return;
      }

      // Process each embryo
      const promises = embryos.map(async (embryo) => {
        if (embryo.id.startsWith("new-")) {
          // Create new embryo
          if (oocyteSample && spermSample) {
            return createEmbryoMutation.mutateAsync({
              PatientId: cycle.patientId!,
              LabSampleOocyteId: oocyteSample.id,
              LabSampleSpermId: spermSample.id,
              DayOfDevelopment: embryo.dayOfDevelopment
                ? parseInt(embryo.dayOfDevelopment, 10)
                : undefined,
              Grade: embryo.grade || undefined,
              CellCount: embryo.cellCount,
              Quality: embryo.quality || undefined,
              Notes: embryo.notes || generalNotes || undefined,
              IsAvailable: true,
              IsQualityCheck: false,
            });
          } else {
            // Fallback without oocyte/sperm IDs
            return createEmbryoMutation.mutateAsync({
              PatientId: cycle.patientId!,
              LabSampleOocyteId: oocyteSample?.id || "",
              LabSampleSpermId: spermSample?.id || "",
              DayOfDevelopment: embryo.dayOfDevelopment
                ? parseInt(embryo.dayOfDevelopment, 10)
                : undefined,
              Grade: embryo.grade || undefined,
              CellCount: embryo.cellCount,
              Quality: embryo.quality || undefined,
              Notes: embryo.notes || generalNotes || undefined,
              IsAvailable: true,
              IsQualityCheck: false,
            });
          }
        } else {
          // Update existing embryo
          return updateEmbryoMutation.mutateAsync({
            embryoId: embryo.id,
            dayOfDevelopment: embryo.dayOfDevelopment
              ? parseInt(embryo.dayOfDevelopment, 10)
              : undefined,
            grade: embryo.grade || undefined,
            cellCount: embryo.cellCount,
            quality: embryo.quality || undefined,
            notes: embryo.notes || generalNotes || undefined,
          });
        }
      });

      await Promise.all(promises);
      toast.success("Embryo culture confirmed successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to confirm embryo culture"
      );
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const isLoading =
    cycleLoading ||
    embryosLoading ||
    createEmbryoMutation.isPending ||
    updateEmbryoMutation.isPending;

  const totalEmbryos = embryos.reduce((sum, e) => sum + e.cellCount, 0);

  return (
    <Modal
      title="Embryo Culture Confirmation"
      description="Confirm embryo culture information and details"
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
    >
      {isLoading && !cycle ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading information...
        </div>
      ) : !cycle ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Treatment cycle not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cycle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Treatment Cycle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Cycle Code
                  </Label>
                  <p className="mt-1 text-sm font-mono">
                    {cycle.cycleName || getLast4Chars(cycle.id)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Start Date
                  </Label>
                  <p className="mt-1 text-sm">{formatDate(cycle.startDate)}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Patient Name
                  </Label>
                  <p className="mt-1 text-sm">
                    {getFullNameFromObject(userDetails) ||
                      getFullNameFromObject(patientDetails) ||
                      userDetails?.userName ||
                      (cycle.patientId ? getLast4Chars(cycle.patientId) : "—")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Treatment Type
                  </Label>
                  <p className="mt-1 text-sm">
                    {cycle.treatmentType || treatmentData?.treatmentType || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embryo Culture Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Embryo Culture Information
                </CardTitle>
                <Badge variant="outline" className="text-lg">
                  Total: {totalEmbryos} embryos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        No.
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Embryo Code
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Day of Development
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Grade
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Cell Count
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Quality
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Creation Date
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Notes
                      </th>
                      <th className="text-left p-2 text-xs uppercase text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {embryos.map((embryo, index) => (
                      <tr key={embryo.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <Input
                            value={embryo.code}
                            onChange={(e) =>
                              updateEmbryoRow(embryo.id, "code", e.target.value)
                            }
                            placeholder="E001"
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={embryo.dayOfDevelopment}
                            onChange={(e) =>
                              updateEmbryoRow(
                                embryo.id,
                                "dayOfDevelopment",
                                e.target.value
                              )
                            }
                            placeholder="3, 5, 6"
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={embryo.grade}
                            onChange={(e) =>
                              updateEmbryoRow(
                                embryo.id,
                                "grade",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select grade</option>
                            <option value="AA">AA</option>
                            <option value="AB">AB</option>
                            <option value="BB">BB</option>
                            <option value="BC">BC</option>
                            <option value="CC">CC</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            value={embryo.cellCount}
                            onChange={(e) =>
                              updateEmbryoRow(
                                embryo.id,
                                "cellCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={embryo.quality}
                            onChange={(e) =>
                              updateEmbryoRow(
                                embryo.id,
                                "quality",
                                e.target.value
                              )
                            }
                            placeholder="Good, Fair, Poor"
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="date"
                            value={embryo.creationDate}
                            onChange={(e) =>
                              updateEmbryoRow(
                                embryo.id,
                                "creationDate",
                                e.target.value
                              )
                            }
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={embryo.notes}
                            onChange={(e) =>
                              updateEmbryoRow(
                                embryo.id,
                                "notes",
                                e.target.value
                              )
                            }
                            placeholder="Notes..."
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeEmbryoRow(embryo.id)}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addEmbryoRow}
                className="mt-2"
              >
                Add Embryo
              </Button>
            </CardContent>
          </Card>

          {/* General Notes and Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                General Notes and Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="general-notes">General Notes</Label>
                <Textarea
                  id="general-notes"
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Enter general notes about the culture process..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lab-tech">Lab Tech Name</Label>
                  <Input
                    id="lab-tech"
                    value={labTechName}
                    onChange={(e) => setLabTechName(e.target.value)}
                    placeholder="Lab Tech Name"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmation-date">Confirmation Date</Label>
                  <Input
                    id="confirmation-date"
                    type="date"
                    value={confirmationDate}
                    onChange={(e) => setConfirmationDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || embryos.length === 0}
            >
              {isLoading ? "Processing..." : "Confirm Culture"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
