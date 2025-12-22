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
  const [embryoQuantity, setEmbryoQuantity] = useState("");
  const [stage, setStage] = useState("");
  const [quality, setQuality] = useState("");
  const [notes, setNotes] = useState("");
  const [creationDate, setCreationDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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

  // Fetch existing embryos for this cycle
  const { data: existingEmbryos, isLoading: embryosLoading } = useQuery<
    LabSampleDetailResponse[]
  >({
    enabled: isOpen && Boolean(cycleId),
    queryKey: ["embryos", "cycle", cycleId],
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
        const response = await api.treatment.getTreatmentById(cycle.treatmentId);
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

  useEffect(() => {
    if (existingEmbryos && existingEmbryos.length > 0) {
      const totalQuantity = existingEmbryos.reduce(
        (sum, e) => sum + (e.embryo?.quantity || 0),
        0
      );
      setEmbryoQuantity(totalQuantity.toString());
    }
  }, [existingEmbryos]);

  const createEmbryoMutation = useMutation({
    mutationFn: async (data: CreateLabSampleEmbryoRequest) => {
      // Use new API endpoint for creating embryo
      return api.sample.createEmbryoSample(data);
    },
    onSuccess: () => {
      toast.success("Embryo culture quantity confirmed successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Unable to confirm embryo quantity"
      );
    },
  });

  const updateEmbryoMutation = useMutation({
    mutationFn: async ({
      embryoId,
      quantity,
      stage,
      quality,
      notes,
    }: {
      embryoId: string;
      quantity: number;
      stage?: string;
      quality?: string;
      notes?: string;
    }) => {
      return api.sample.updateEmbryoSample(embryoId, {
        status: undefined, // Keep existing status
        notes,
        quality,
        dayOfDevelopment: stage ? parseInt(stage.replace(/\D/g, ""), 10) : undefined,
        grade: quality,
        cellCount: quantity,
        // Legacy support
        quantity,
        stage,
      });
    },
    onSuccess: () => {
      toast.success("Embryo quantity updated successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Unable to update embryo quantity"
      );
    },
  });

  const handleSubmit = async () => {
    if (!embryoQuantity || !cycle?.patientId) {
      toast.error("Please enter embryo quantity");
      return;
    }

    const quantity = parseInt(embryoQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Embryo quantity must be a positive number");
      return;
    }

    if (existingEmbryos && existingEmbryos.length > 0) {
      // Update existing embryo
      const embryo = existingEmbryos[0];
      updateEmbryoMutation.mutate({
        embryoId: embryo.id,
        quantity,
        stage: stage || undefined,
        quality: quality || undefined,
        notes: notes || undefined,
      });
    } else {
      // Create new embryo record
      // Try to find oocyte and sperm samples from the cycle
      // If not found, we'll need to handle this case
      try {
        // Fetch samples for this cycle to find oocyte and sperm
        const oocyteResponse = await api.sample.getAllDetailSamples({
          SampleType: "Oocyte",
          PatientId: cycle.patientId,
          Size: 1,
        });
        const spermResponse = await api.sample.getAllDetailSamples({
          SampleType: "Sperm",
          PatientId: cycle.patientId,
          Size: 1,
        });
        
        const oocyteSample = oocyteResponse.data?.find(
          (s) => s.treatmentCycleId === cycleId || !s.treatmentCycleId
        );
        const spermSample = spermResponse.data?.find(
          (s) => s.treatmentCycleId === cycleId || !s.treatmentCycleId
        );

        if (oocyteSample && spermSample) {
          // Use new API with required fields
          createEmbryoMutation.mutate({
            PatientId: cycle.patientId,
            LabSampleOocyteId: oocyteSample.id,
            LabSampleSpermId: spermSample.id,
            DayOfDevelopment: stage ? parseInt(stage.replace(/\D/g, ""), 10) : undefined,
            Grade: quality || undefined,
            CellCount: quantity,
            Notes: notes || undefined,
            Quality: quality || undefined,
            IsAvailable: true,
            IsQualityCheck: false,
          });
        } else {
          // Fallback: use legacy format (may need backend support)
          createEmbryoMutation.mutate({
            patientId: cycle.patientId,
            treatmentCycleId: cycleId,
            creationDate: new Date(creationDate).toISOString(),
            quantity,
            stage: stage || undefined,
            status: "Processing",
            notes: notes || undefined,
            // New API format with empty IDs (may fail, but try)
            PatientId: cycle.patientId,
            LabSampleOocyteId: oocyteSample?.id || "",
            LabSampleSpermId: spermSample?.id || "",
            DayOfDevelopment: stage ? parseInt(stage.replace(/\D/g, ""), 10) : undefined,
            Grade: quality || undefined,
            CellCount: quantity,
            Quality: quality || undefined,
            IsAvailable: true,
            IsQualityCheck: false,
          });
        }
      } catch (error) {
        // If fetch fails, use legacy format
        createEmbryoMutation.mutate({
          patientId: cycle.patientId,
          treatmentCycleId: cycleId,
          creationDate: new Date(creationDate).toISOString(),
          quantity,
          stage: stage || undefined,
          status: "Processing",
          notes: notes || undefined,
        });
      }
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

  const totalExistingQuantity = existingEmbryos?.reduce(
    (sum, e) => sum + (e.embryo?.quantity || 0),
    0
  ) || 0;

  return (
    <Modal
      title="Embryo Culture Confirmation"
      description="Confirm the number of embryos in culture"
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
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
                  <p className="mt-1 text-sm">
                    {cycle.treatmentType ||
                      treatmentData?.treatmentType ||
                      "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Embryos Info */}
          {totalExistingQuantity > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Embryos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg">
                    {totalExistingQuantity} embryos
                  </Badge>
                  <span className="text-sm text-gray-600">
                    in culture
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Embryo Culture Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Confirm Embryo Quantity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Embryo Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={embryoQuantity}
                    onChange={(e) => setEmbryoQuantity(e.target.value)}
                    placeholder="Enter embryo quantity"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="creationDate">Creation Date</Label>
                  <Input
                    id="creationDate"
                    type="date"
                    value={creationDate}
                    onChange={(e) => setCreationDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Input
                    id="stage"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    placeholder="VD: Day 3, Day 5"
                  />
                </div>
                <div>
                  <Label htmlFor="quality">Quality</Label>
                  <Input
                    id="quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    placeholder="VD: Good, Fair"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes (optional)"
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
            <Button onClick={handleSubmit} disabled={isLoading || !embryoQuantity}>
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

