import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { CheckCircle2, XCircle, Snowflake } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

interface EmbryoQualityCheckModalProps {
  embryoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmbryoQualityCheckModal({
  embryoId,
  isOpen,
  onClose,
  onSuccess,
}: EmbryoQualityCheckModalProps) {
  const [action, setAction] = useState<"use" | "cancel" | "freeze" | null>(null);
  const [notes, setNotes] = useState("");
  const [qualityData, setQualityData] = useState({
    quantity: "",
    stage: "",
    quality: "",
  });

  const { data: embryo, isLoading: embryoLoading } = useQuery<
    LabSampleDetailResponse | null
  >({
    enabled: isOpen && Boolean(embryoId),
    queryKey: ["embryo-quality-check", embryoId],
    retry: false,
    queryFn: async () => {
      if (!embryoId) return null;
      try {
        const response = await api.sample.getSampleById(embryoId);
        const sampleData = response.data;
        
        // Fetch detail sample to get nested data
        const detailResponse = await api.sample.getAllDetailSamples({
          SampleType: "Embryo",
          SearchTerm: sampleData.sampleCode || embryoId,
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

  useEffect(() => {
    if (embryo && embryo.embryo) {
      setQualityData({
        quantity: embryo.embryo.cellCount?.toString() || embryo.embryo.quantity?.toString() || "",
        stage: embryo.embryo.dayOfDevelopment ? `Day ${embryo.embryo.dayOfDevelopment}` : embryo.embryo.stage || "",
        quality: embryo.embryo.grade || embryo.quality || "",
      });
      setNotes(embryo.embryo.notes || embryo.notes || "");
    }
  }, [embryo]);

  const updateEmbryoMutation = useMutation({
    mutationFn: async ({
      embryoId,
      status,
      quantity,
      stage,
      quality,
      notes,
      dayOfDevelopment,
    }: {
      embryoId: string;
      status: SpecimenStatus;
      quantity?: number;
      stage?: string;
      quality?: string;
      notes?: string;
      dayOfDevelopment?: number;
    }) => {
      return api.sample.updateEmbryoSample(embryoId, {
        status,
        notes,
        quality,
        dayOfDevelopment,
        grade: quality,
        cellCount: quantity,
        // Legacy support
        quantity,
        stage,
      });
    },
    onSuccess: () => {
      toast.success("Embryo updated successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Unable to update embryo");
    },
  });

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
      case "cancel":
        status = "Discarded";
        break;
      case "freeze":
        status = "Stored";
        break;
      default:
        return;
    }

    const quantity = qualityData.quantity
      ? parseInt(qualityData.quantity, 10)
      : undefined;

    // Extract day of development from stage (e.g., "Day 5" -> 5)
    const dayMatch = qualityData.stage?.match(/Day\s*(\d+)/i);
    const dayOfDevelopment = dayMatch ? parseInt(dayMatch[1], 10) : undefined;

    updateEmbryoMutation.mutate({
      embryoId,
      status,
      quantity: quantity && !isNaN(quantity) ? quantity : undefined,
      stage: qualityData.stage || undefined,
      quality: qualityData.quality || undefined,
      notes: notes || undefined,
      dayOfDevelopment: dayOfDevelopment && !isNaN(dayOfDevelopment) ? dayOfDevelopment : undefined,
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

  const isLoading = embryoLoading || updateEmbryoMutation.isPending;

  return (
    <Modal
      title="Embryo Quality Check"
      description="Check embryo quality and select action for embryos"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {isLoading && !embryo ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading embryo information...
        </div>
      ) : !embryo ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Embryo not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Embryo Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Embryo Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Embryo Code
                  </Label>
                  <p className="mt-1 text-sm font-mono">
                    {embryo.sampleCode || getLast4Chars(embryo.id)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Fertilization Date
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDate(
                      embryo.embryo?.fertilizationDate || embryo.collectionDate
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Current Status
                  </Label>
                  <Badge className="mt-1">{embryo.status}</Badge>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Treatment Cycle
                  </Label>
                  <div className="mt-1">
                    {embryo.treatmentCycleId ? (
                      <p className="text-sm font-mono">
                        {getLast4Chars(embryo.treatmentCycleId)}
                      </p>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300">
                        Not Available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Assessment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Embryo Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={qualityData.quantity}
                    onChange={(e) =>
                      setQualityData({ ...qualityData, quantity: e.target.value })
                    }
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Input
                    id="stage"
                    value={qualityData.stage}
                    onChange={(e) =>
                      setQualityData({ ...qualityData, stage: e.target.value })
                    }
                    placeholder="VD: Day 3, Day 5"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Input
                    id="quality"
                    value={qualityData.quality}
                    onChange={(e) =>
                      setQualityData({ ...qualityData, quality: e.target.value })
                    }
                    placeholder="VD: Excellent, Good, Fair, Poor"
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

          {/* Action Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  type="button"
                  variant={action === "use" ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setAction("use")}
                >
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span>Use</span>
                  <span className="text-xs text-gray-500">
                    Mark as used
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={action === "freeze" ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setAction("freeze")}
                >
                  <Snowflake className="h-6 w-6 text-blue-600" />
                  <span>Freeze</span>
                  <span className="text-xs text-gray-500">
                    Mark for freezing
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={action === "cancel" ? "destructive" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setAction("cancel")}
                >
                  <XCircle className="h-6 w-6" />
                  <span>Cancel</span>
                  <span className="text-xs text-gray-500">
                    Mark as discarded
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
            <Button onClick={handleSubmit} disabled={!action || isLoading}>
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

