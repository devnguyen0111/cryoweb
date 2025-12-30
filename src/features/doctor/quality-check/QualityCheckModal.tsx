import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { toast } from "sonner";
import type { LabSampleDetailResponse, SpecimenStatus } from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Snowflake, FlaskConical } from "lucide-react";
import { getLast4Chars } from "@/utils/id-helpers";

interface QualityCheckModalProps {
  sampleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (status: SpecimenStatus, notes?: string) => void;
  isLoading?: boolean;
  embryoAction?: "transfer" | "frozen" | null;
  viewMode?: boolean;
}

export function QualityCheckModal({
  sampleId,
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
  embryoAction = null,
  viewMode = false,
}: QualityCheckModalProps) {
  const [action, setAction] = useState<"use" | "freeze" | null>(null);
  const [notes, setNotes] = useState("");

  const { data: sample, isLoading: sampleLoading } =
    useQuery<LabSampleDetailResponse | null>({
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

  // Check if sample is embryo
  const isEmbryo = sample?.sampleType === "Embryo";

  // Get spermId and oocyteId from embryo (check both possible field names from API response)
  // API may return spermId/oocyteId or labSampleSpermId/labSampleOocyteId
  const spermId = isEmbryo
    ? sample?.embryo?.labSampleSpermId || (sample?.embryo as any)?.spermId
    : null;
  const oocyteId = isEmbryo
    ? sample?.embryo?.labSampleOocyteId || (sample?.embryo as any)?.oocyteId
    : null;

  // Fetch sperm sample if embryo has spermId
  const { data: spermSample, isLoading: spermLoading } = useQuery({
    enabled: isOpen && isEmbryo && Boolean(spermId),
    queryKey: ["sperm-sample", spermId, "for-embryo"],
    retry: false,
    queryFn: async () => {
      if (!spermId) return null;
      try {
        const response = await api.sample.getSampleById(spermId);
        const sampleData = response.data;

        // Fetch detail sample to get nested data
        const detailResponse = await api.sample.getAllDetailSamples({
          SampleType: "Sperm",
          SearchTerm: sampleData.sampleCode || spermId,
          Size: 1,
        });

        return detailResponse.data?.[0] || null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
  });

  // Fetch oocyte sample if embryo has oocyteId
  const { data: oocyteSample, isLoading: oocyteLoading } = useQuery({
    enabled: isOpen && isEmbryo && Boolean(oocyteId),
    queryKey: ["oocyte-sample", oocyteId, "for-embryo"],
    retry: false,
    queryFn: async () => {
      if (!oocyteId) return null;
      try {
        const response = await api.sample.getSampleById(oocyteId);
        const sampleData = response.data;

        // Fetch detail sample to get nested data
        const detailResponse = await api.sample.getAllDetailSamples({
          SampleType: "Oocyte",
          SearchTerm: sampleData.sampleCode || oocyteId,
          Size: 1,
        });

        return detailResponse.data?.[0] || null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
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
      // If embryo action is preset, set the action accordingly
      if (sample.sampleType === "Embryo" && embryoAction) {
        if (embryoAction === "transfer") {
          setAction("use");
        } else if (embryoAction === "frozen") {
          setAction("freeze");
        }
      }
    }
  }, [sample, embryoAction]);

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
  const isLoadingDetails = sampleLoading || spermLoading || oocyteLoading;

  return (
    <Modal
      title={viewMode ? "Sample Details" : "Confirm Sample Action"}
      description={
        viewMode
          ? `View detailed information for ${isSperm ? "sperm" : isOocyte ? "oocyte" : "embryo"} sample.`
          : `Confirm action for quality-checked ${isSperm ? "sperm" : isOocyte ? "oocyte" : "embryo"} sample. ${isEmbryo ? "Transfer for use, freeze for storage, or cancel." : "Mark for use in treatment or storage."}`
      }
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      {isLoadingDetails ? (
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
                    ) : isOocyte ? (
                      <FlaskConical className="h-4 w-4 text-pink-500" />
                    ) : (
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                    )}
                    <span className="text-sm">
                      {isSperm ? "Sperm" : isOocyte ? "Oocyte" : "Embryo"}
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
                  <p className="mt-1 text-sm">
                    {formatDate(sample.collectionDate)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">
                    Current Status
                  </Label>
                  <p></p>
                  <Badge className="mt-1">{sample.status}</Badge>
                </div>
                {treatmentCycle && (
                  <>
                    <div>
                      <Label className="text-xs font-semibold text-gray-500">
                        Treatment Cycle
                      </Label>
                      <p className="mt-1 text-sm">
                        {treatmentCycle.cycleName ||
                          `Cycle ${treatmentCycle.cycleNumber}`}
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
                  {sample.oocyte.quality && (
                    <div>
                      <Label className="text-xs font-semibold text-gray-500">
                        Quality
                      </Label>
                      <p className="mt-1 text-sm">{sample.oocyte.quality}</p>
                    </div>
                  )}
                </div>
              ) : isEmbryo && sample.embryo ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Day of Development
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.embryo.dayOfDevelopment !== undefined &&
                      sample.embryo.dayOfDevelopment !== null
                        ? `Day ${sample.embryo.dayOfDevelopment}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Grade
                    </Label>
                    <p className="mt-1 text-sm">{sample.embryo.grade || "—"}</p>
                  </div>
                  {sample.embryo.quality && (
                    <div>
                      <Label className="text-xs font-semibold text-gray-500">
                        Quality
                      </Label>
                      <p className="mt-1 text-sm">{sample.embryo.quality}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-semibold text-gray-500">
                      Cell Count
                    </Label>
                    <p className="mt-1 text-sm">
                      {sample.embryo.cellCount !== undefined &&
                      sample.embryo.cellCount !== null
                        ? `${sample.embryo.cellCount}`
                        : "—"}
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
                  disabled={viewMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Source Samples Information for Embryo */}
          {isEmbryo && (spermSample || oocyteSample) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source Samples</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Sperm and Oocyte samples used to create this embryo
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {spermSample && (
                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold text-sm">Sperm Sample</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs font-semibold text-gray-500">
                          Sample Code
                        </Label>
                        <p className="mt-1 font-mono">
                          {spermSample.sampleCode ||
                            getLast4Chars(spermSample.id)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-500">
                          Status
                        </Label>
                        <p></p>
                        <Badge className="mt-1">{spermSample.status}</Badge>
                      </div>
                      {spermSample.sperm && (
                        <>
                          <div>
                            <Label className="text-xs font-semibold text-gray-500">
                              Volume
                            </Label>
                            <p className="mt-1">
                              {spermSample.sperm.volume !== undefined &&
                              spermSample.sperm.volume !== null
                                ? `${spermSample.sperm.volume} mL`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-500">
                              Concentration
                            </Label>
                            <p className="mt-1">
                              {spermSample.sperm.concentration !== undefined &&
                              spermSample.sperm.concentration !== null
                                ? `${spermSample.sperm.concentration} million/mL`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-500">
                              Motility
                            </Label>
                            <p className="mt-1">
                              {spermSample.sperm.motility !== undefined &&
                              spermSample.sperm.motility !== null
                                ? `${spermSample.sperm.motility}%`
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-500">
                              Morphology
                            </Label>
                            <p className="mt-1">
                              {spermSample.sperm.morphology !== undefined &&
                              spermSample.sperm.morphology !== null
                                ? `${spermSample.sperm.morphology}%`
                                : "—"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {oocyteSample && (
                  <div className="border rounded-lg p-4 bg-pink-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical className="h-5 w-5 text-pink-500" />
                      <h4 className="font-semibold text-sm">Oocyte Sample</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs font-semibold text-gray-500">
                          Sample Code
                        </Label>
                        <p className="mt-1 font-mono">
                          {oocyteSample.sampleCode ||
                            getLast4Chars(oocyteSample.id)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-500">
                          Status
                        </Label>
                        <p></p>
                        <Badge className="mt-1">{oocyteSample.status}</Badge>
                      </div>
                      {oocyteSample.oocyte && oocyteSample.oocyte.quality && (
                        <div>
                          <Label className="text-xs font-semibold text-gray-500">
                            Quality
                          </Label>
                          <p className="mt-1">{oocyteSample.oocyte.quality}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!spermSample && !oocyteSample && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Source samples information not available
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Selection - Only show if not in view mode */}
          {!viewMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Action</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {isEmbryo
                    ? "Choose to transfer for use, freeze for storage, or cancel"
                    : "Choose to mark this sample for use in treatment or for freezing"}
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
                    <span>{isEmbryo ? "Transfer" : "Use for Treatment"}</span>
                    <span className="text-xs text-gray-500">
                      {isEmbryo
                        ? "Transfer embryo for use in treatment"
                        : "Mark as used in IVF/IUI cycle"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={action === "freeze" ? "default" : "outline"}
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setAction("freeze")}
                  >
                    <Snowflake className="h-6 w-6 text-blue-600" />
                    <span>{isEmbryo ? "Frozen" : "Freeze for Storage"}</span>
                    <span className="text-xs text-gray-500">
                      {isEmbryo
                        ? "Freeze embryo for storage"
                        : "Mark for freezing and storage"}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {viewMode ? "Close" : "Cancel"}
            </Button>
            {!viewMode && (
              <Button onClick={handleSubmit} disabled={!action || isLoading}>
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
