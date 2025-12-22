import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { toast } from "sonner";
import type {
  TreatmentCycle,
  LabSampleDetailResponse,
  SpecimenStatus,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// Checkbox component not available, using custom implementation
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";

interface EmbryoTransferConfirmationModalProps {
  cycleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmbryoTransferConfirmationModal({
  cycleId,
  isOpen,
  onClose,
  onSuccess,
}: EmbryoTransferConfirmationModalProps) {
  const [selectedEmbryoIds, setSelectedEmbryoIds] = useState<Set<string>>(
    new Set()
  );
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");

  const { data: cycle, isLoading: cycleLoading } = useQuery<TreatmentCycle | null>({
    enabled: isOpen && Boolean(cycleId),
    queryKey: ["treatment-cycle", cycleId],
    retry: false,
    queryFn: async () => {
      if (!cycleId) return null;
      try {
        const response = await api.treatmentCycle.getTreatmentCycleById(cycleId);
        return response.data ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  // Fetch embryos ready for transfer
  const { data: embryos, isLoading: embryosLoading } = useQuery<
    LabSampleDetailResponse[]
  >({
    enabled: isOpen && Boolean(cycleId),
    queryKey: ["embryos", "transfer", cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      try {
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Embryo",
          Status: "QualityChecked",
          Page: 1,
          Size: 100,
        });
        return (response.data ?? []).filter(
          (e) =>
            e.treatmentCycleId === cycleId &&
            (e.status === "QualityChecked" || e.status === "Processing")
        );
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch patient details for patient name
  const { data: patientDetails } = useQuery({
    enabled: isOpen && Boolean(cycle?.patientId),
    queryKey: ["patient-details", cycle?.patientId, "embryo-transfer-modal"],
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
        return null;
      }
    },
  });

  // Fetch user details for patient name
  const { data: userDetails } = useQuery({
    enabled: isOpen && Boolean(cycle?.patientId),
    queryKey: ["user-details", cycle?.patientId, "embryo-transfer-modal"],
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

  useEffect(() => {
    // Auto-select all embryos by default
    if (embryos && embryos.length > 0) {
      setSelectedEmbryoIds(new Set(embryos.map((e) => e.id)));
    }
  }, [embryos]);

  const updateEmbryoMutation = useMutation({
    mutationFn: async ({
      embryoId,
      status,
      notes,
    }: {
      embryoId: string;
      status: SpecimenStatus;
      notes?: string;
    }) => {
      return api.sample.updateSample(embryoId, {
        status,
        notes,
      });
    },
    onSuccess: () => {
      toast.success("Embryo transfer confirmed successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Unable to confirm embryo transfer"
      );
    },
  });

  const handleToggleEmbryo = (embryoId: string) => {
    const newSelected = new Set(selectedEmbryoIds);
    if (newSelected.has(embryoId)) {
      newSelected.delete(embryoId);
    } else {
      newSelected.add(embryoId);
    }
    setSelectedEmbryoIds(newSelected);
  };

  const handleSelectAll = () => {
    if (embryos) {
      if (selectedEmbryoIds.size === embryos.length) {
        setSelectedEmbryoIds(new Set());
      } else {
        setSelectedEmbryoIds(new Set(embryos.map((e) => e.id)));
      }
    }
  };

  const handleSubmit = () => {
    if (selectedEmbryoIds.size === 0) {
      toast.error("Please select at least one embryo to transfer");
      return;
    }

    // Update all selected embryos to "Used" status
    Promise.all(
      Array.from(selectedEmbryoIds).map((embryoId) =>
        updateEmbryoMutation.mutateAsync({
          embryoId,
          status: "Used",
          notes: notes || undefined,
        })
      )
    ).then(() => {
      onSuccess();
    });
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
    updateEmbryoMutation.isPending;

  return (
    <Modal
      title="Embryo Transfer Confirmation"
      description="Select embryos to transfer for patient"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
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
              <CardTitle className="text-lg">Treatment Cycle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Cycle Code
                  </Label>
                  <p className="mt-1 text-sm font-mono">
                    {cycle.cycleCode || getLast4Chars(cycle.id)}
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
                      getFullNameFromObject(patientDetails?.accountInfo) ||
                      getFullNameFromObject(patientDetails) ||
                      userDetails?.userName ||
                      patientDetails?.accountInfo?.username ||
                      (cycle.patientId
                        ? getLast4Chars(cycle.patientId)
                        : "—")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Treatment Type
                  </Label>
                  <p className="mt-1 text-sm">{cycle.treatmentType || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embryo Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Embryos to Transfer</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {embryos &&
                  selectedEmbryoIds.size === embryos.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {embryos && embryos.length > 0 ? (
                <div className="space-y-2">
                  {embryos.map((embryo) => (
                    <div
                      key={embryo.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3",
                        selectedEmbryoIds.has(embryo.id)
                          ? "border-primary bg-primary/5"
                          : "border-gray-200"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmbryoIds.has(embryo.id)}
                        onChange={() => handleToggleEmbryo(embryo.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {embryo.sampleCode || getLast4Chars(embryo.id)}
                          </span>
                          <Badge variant="outline">
                            {embryo.embryo?.quantity || 0} embryos
                          </Badge>
                          {embryo.embryo?.stage && (
                            <Badge variant="secondary">
                              {embryo.embryo.stage}
                            </Badge>
                          )}
                          {embryo.embryo?.quality && (
                            <Badge variant="outline">
                              {embryo.embryo.quality}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Creation Date:{" "}
                          {formatDate(
                            embryo.embryo?.creationDate || embryo.collectionDate
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No embryos ready for transfer
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transfer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transferDate">Transfer Date</Label>
                <input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes about transfer process (optional)"
                  rows={3}
                />
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
              disabled={isLoading || selectedEmbryoIds.size === 0}
            >
              {isLoading ? "Processing..." : "Confirm Transfer"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

