import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { toast } from "sonner";
import type { LabSampleDetailResponse, SpecimenStatus } from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Snowflake, FlaskConical } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

interface QualityCheckModalProps {
  sampleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (status: SpecimenStatus, notes?: string) => void;
  isLoading?: boolean;
}

export function QualityCheckModal({
  sampleId,
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
}: QualityCheckModalProps) {
  const [action, setAction] = useState<"use" | "freeze" | null>(null);
  const [notes, setNotes] = useState("");

  const { data: sample, isLoading: sampleLoading } = useQuery<LabSampleDetailResponse | null>({
    enabled: isOpen && Boolean(sampleId),
    queryKey: ["quality-check-sample", sampleId],
    retry: false,
    queryFn: async () => {
      if (!sampleId) return null;
      try {
        const response = await api.sample.getSampleById(sampleId);
        const sampleData = response.data;
        
        // Fetch detail sample to get nested data
        const detailResponse = await api.sample.getAllDetailSamples({
          SampleType: sampleData.sampleType,
          SearchTerm: sampleData.sampleCode || sampleId,
          Size: 1,
        });
        
        return detailResponse.data?.[0] || null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
  });

  // Fetch treatment cycle info if sample has treatmentCycleId
  const { data: treatmentCycle } = useQuery({
    enabled: isOpen && Boolean(sample?.treatmentCycleId),
    queryKey: ["treatment-cycle", sample?.treatmentCycleId],
    queryFn: async () => {
      if (!sample?.treatmentCycleId) return null;
      try {
        const response = await api.treatmentCycle.getTreatmentCycleById(
          sample.treatmentCycleId
        );
        return response.data;
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (sample) {
      setNotes(sample.notes || "");
    }
  }, [sample]);

  const handleSubmit = () => {
    if (!action) {
      toast.error("Please select an action");
      return;
    }

    let status: SpecimenStatus;
    switch (action) {
      case "use":
        status = "Used";
        break;
      case "freeze":
        status = "Stored";
        break;
      default:
        return;
    }

    onSuccess(status, notes || undefined);
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

  const isSperm = sample?.sampleType === "Sperm";
  const isOocyte = sample?.sampleType === "Oocyte";

  return (
    <Modal
      title="Confirm Sample Action"
      description={`Confirm action for quality-checked ${isSperm ? "sperm" : "oocyte"} sample. Mark for use in treatment or storage.`}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      {sampleLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading sample information...
        </div>
      ) : !sample ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Sample not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sample Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Sample Type
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    {isSperm ? (
                      <FlaskConical className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FlaskConical className="h-4 w-4 text-pink-500" />
                    )}
                    <span className="text-sm">
                      {isSperm ? "Sperm" : "Oocyte"}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Sample Code
                  </Label>
                  <p className="mt-1 text-sm font-mono">
                    {sample.sampleCode || getLast4Chars(sample.id)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Collection Date
                  </Label>
                  <p className="mt-1 text-sm">{formatDate(sample.collectionDate)}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Current Status
                  </Label>
                  <Badge className="mt-1">{sample.status}</Badge>
                </div>
                {treatmentCycle && (
                  <>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500">
                        Treatment Cycle
                      </Label>
                      <p className="mt-1 text-sm">
                        {treatmentCycle.cycleName || `Cycle ${treatmentCycle.cycleNumber}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500">
                        Treatment Type
                      </Label>
                      <Badge className="mt-1" variant="outline">
                        {treatmentCycle.treatmentType || "—"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quality Information Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSperm && sample.sperm ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Volume (mL)
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.sperm.volume !== undefined &&
                      sample.sperm.volume !== null
                        ? `${sample.sperm.volume} mL`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Concentration (million/mL)
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.sperm.concentration !== undefined &&
                      sample.sperm.concentration !== null
                        ? `${sample.sperm.concentration} million/mL`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Motility (%)
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.sperm.motility !== undefined &&
                      sample.sperm.motility !== null
                        ? `${sample.sperm.motility}%`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Morphology (%)
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.sperm.morphology !== undefined &&
                      sample.sperm.morphology !== null
                        ? `${sample.sperm.morphology}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              ) : isOocyte && sample.oocyte ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Quantity
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.oocyte.quantity !== undefined &&
                      sample.oocyte.quantity !== null
                        ? `${sample.oocyte.quantity}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Maturity
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.oocyte.maturity || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold text-gray-500">
                      Quality
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.oocyte.quality || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No quality information available
                </p>
              )}

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

          {/* Action Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Action</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Choose to mark this sample for use in treatment or for freezing
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={action === "use" ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setAction("use")}
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span>Use for Treatment</span>
                  <span className="text-xs text-gray-500">
                    Mark as used in IVF/IUI cycle
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={action === "freeze" ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setAction("freeze")}
                >
                  <Snowflake className="h-6 w-6 text-blue-600" />
                  <span>Freeze for Storage</span>
                  <span className="text-xs text-gray-500">
                    Mark for freezing and storage
                  </span>
                </Button>
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
              disabled={!action || isLoading}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

