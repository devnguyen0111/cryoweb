import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLast4Chars } from "@/utils/id-helpers";
import type { LabSampleDetailResponse } from "@/api/types";
import { X } from "lucide-react";

interface FertilizationModalProps {
  cycleId: string;
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function FertilizationModal({
  cycleId,
  patientId,
  isOpen,
  onClose,
  onSuccess,
}: FertilizationModalProps) {
  const queryClient = useQueryClient();
  const [selectedSpermIds, setSelectedSpermIds] = useState<string[]>([]);
  const [selectedOocyteIds, setSelectedOocyteIds] = useState<string[]>([]);

  // Fetch treatment cycle details to get treatmentId
  const { data: cycleDetails } = useQuery({
    queryKey: ["doctor", "treatment-cycle", cycleId],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycleId);
      return response.data;
    },
    enabled: isOpen && !!cycleId,
    staleTime: 0,
  });

  // Fetch all cycles in the same treatment to get related cycles
  const { data: allCyclesInTreatment } = useQuery({
    queryKey: ["treatment-cycles", "treatment", cycleDetails?.treatmentId],
    queryFn: async () => {
      if (!cycleDetails?.treatmentId) return [];
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: cycleDetails.treatmentId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!cycleDetails?.treatmentId,
  });

  // Fetch relationships to get partner patient ID for sperm samples
  const { data: relationshipsResponse } = useQuery({
    queryKey: [
      "doctor",
      "patient",
      patientId,
      "relationships",
      "fertilization",
    ],
    queryFn: async () => {
      if (!patientId) return [];
      try {
        const response = await api.relationship.getRelationships(patientId);
        return response.data ?? [];
      } catch (error: any) {
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 403
        ) {
          return [];
        }
        console.warn(
          "[FertilizationModal] Failed to fetch relationships:",
          error
        );
        return [];
      }
    },
    enabled: isOpen && !!patientId,
    retry: false,
  });

  const relationships = relationshipsResponse ?? [];

  // Get active partner relationship (Married or Unmarried)
  const partnerRelationship = relationships.find(
    (rel) =>
      (rel.relationshipType === "Married" ||
        rel.relationshipType === "Unmarried") &&
      rel.isActive !== false
  );

  // Get partner patient ID from relationship
  const partnerPatientId = partnerRelationship
    ? partnerRelationship.patient1Id === patientId
      ? partnerRelationship.patient2Id
      : partnerRelationship.patient1Id
    : null;

  // Fetch quality-checked sperm samples - fetch from PARTNER patient (relationship)
  // In IVF, patient (female) has oocytes, partner (male) has sperm
  const { data: spermSamplesData, isLoading: spermLoading } = useQuery({
    queryKey: [
      "sperm-samples",
      "partner",
      partnerPatientId,
      "cycle",
      cycleId,
      "quality-checked",
      "fertilization",
    ],
    queryFn: async () => {
      // If no partner, return empty array
      if (!partnerPatientId) {
        console.log("[FertilizationModal] No partner found for sperm samples");
        return [];
      }

      try {
        // Fetch all samples of PARTNER patient (not the main patient)
        // Don't filter Status at API level - filter client-side instead
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Sperm",
          PatientId: partnerPatientId, // Use partner patient ID, not main patient ID
          // Don't filter Status here - API might not support PatientId + Status together
          Page: 1,
          Size: 100,
          Sort: "collectionDate",
          Order: "desc",
        });
        const samples = response.data || [];

        // Filter for quality-checked samples (like CycleUpdateModal)
        // Statuses considered as quality checked: QualityChecked, Fertilized, CulturedEmbryo, Stored, Used, Frozen
        const qualityCheckedStatuses = [
          "QualityChecked",
          "Fertilized",
          "CulturedEmbryo",
          "Stored",
          "Used",
          "Frozen",
        ];

        // Get cycle IDs from the same treatment (including current cycle and previous cycles)
        const relatedCycleIds = allCyclesInTreatment
          ? allCyclesInTreatment.map((c) => c.id)
          : [cycleId];

        // Additional client-side filtering for availability and fertilization status
        const filtered = samples.filter((sample) => {
          // Must be quality-checked
          if (!qualityCheckedStatuses.includes(sample.status)) return false;

          // Must be available (allow if undefined, reject only if explicitly false)
          if (sample.isAvailable === false) return false;

          // Must not already be marked for fertilization
          if (sample.canFertilize === true) return false;

          // Filter by treatment cycle relationship:
          // - If sample has treatmentCycleId, it must belong to a cycle in the same treatment
          // - If sample has no treatmentCycleId, allow it (might be from previous treatment or not assigned yet)
          if (sample.treatmentCycleId) {
            if (!relatedCycleIds.includes(sample.treatmentCycleId)) {
              return false; // Sample belongs to a different treatment
            }
          }

          return true;
        });
        console.log("[FertilizationModal] Sperm samples:", {
          mainPatientId: patientId,
          partnerPatientId,
          hasPartner: !!partnerPatientId,
          cycleId,
          treatmentId: cycleDetails?.treatmentId,
          relatedCycleIds,
          total: samples.length,
          qualityChecked: samples.filter((s) =>
            qualityCheckedStatuses.includes(s.status)
          ).length,
          filtered: filtered.length,
          samples: samples.map((s) => ({
            id: s.id,
            status: s.status,
            isAvailable: s.isAvailable,
            canFertilize: s.canFertilize,
            patientId: s.patientId,
            treatmentCycleId: s.treatmentCycleId,
            belongsToRelatedCycle: s.treatmentCycleId
              ? relatedCycleIds.includes(s.treatmentCycleId)
              : "no cycle",
          })),
        });
        return filtered;
      } catch (error: any) {
        console.error("[FertilizationModal] Error fetching sperm samples:", {
          error,
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          mainPatientId: patientId,
          partnerPatientId,
          cycleId,
        });
        // Return empty array on error, but log for debugging
        return [];
      }
    },
    enabled: isOpen && !!partnerPatientId && !!cycleId,
  });

  // Fetch quality-checked oocyte samples - fetch all patient samples then filter client-side
  const { data: oocyteSamplesData, isLoading: oocyteLoading } = useQuery({
    queryKey: [
      "oocyte-samples",
      "patient",
      patientId,
      "cycle",
      cycleId,
      "quality-checked",
      "fertilization",
    ],
    queryFn: async () => {
      try {
        // Fetch all samples of patient (like CycleUpdateModal does)
        // Don't filter Status at API level - filter client-side instead
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Oocyte",
          PatientId: patientId,
          // Don't filter Status here - API might not support PatientId + Status together
          Page: 1,
          Size: 100,
          Sort: "collectionDate",
          Order: "desc",
        });
        const samples = response.data || [];

        // Filter for quality-checked samples (like CycleUpdateModal)
        // Statuses considered as quality checked: QualityChecked, Fertilized, CulturedEmbryo, Stored, Used, Frozen
        const qualityCheckedStatuses = [
          "QualityChecked",
          "Fertilized",
          "CulturedEmbryo",
          "Stored",
          "Used",
          "Frozen",
        ];

        // Get cycle IDs from the same treatment (including current cycle and previous cycles)
        const relatedCycleIds = allCyclesInTreatment
          ? allCyclesInTreatment.map((c) => c.id)
          : [cycleId];

        // Additional client-side filtering for availability, maturity, and fertilization status
        const filtered = samples.filter((sample) => {
          // Must be quality-checked
          if (!qualityCheckedStatuses.includes(sample.status)) {
            console.log(
              `[FertilizationModal] Sample ${sample.id} rejected: not quality-checked (status: ${sample.status})`
            );
            return false;
          }

          // Must be available (allow if undefined, reject only if explicitly false)
          if (sample.isAvailable === false) {
            console.log(
              `[FertilizationModal] Sample ${sample.id} rejected: not available`
            );
            return false;
          }

          // For oocytes, check maturityStage - prefer MII but be flexible
          // MII (Metaphase II) is the mature stage suitable for fertilization
          const maturityStage = sample.oocyte?.maturityStage;
          const isMature = sample.oocyte?.isMature;

          // If maturityStage is set, prefer MII but allow if isMature is true
          if (maturityStage) {
            const trimmedStage = String(maturityStage).trim().toUpperCase();
            // Accept MII (mature) oocytes
            if (trimmedStage === "MII") {
              // Good, continue
            } else {
              // If maturityStage is not MII, check isMature as fallback
              if (isMature === true) {
                // Allow if isMature is true even if maturityStage is not MII
                console.log(
                  `[FertilizationModal] Sample ${sample.id} allowed: maturityStage is ${trimmedStage} but isMature is true`
                );
              } else if (isMature === false) {
                // Reject if explicitly not mature
                console.log(
                  `[FertilizationModal] Sample ${sample.id} rejected: maturityStage is ${trimmedStage} and isMature is false`
                );
                return false;
              } else {
                // If isMature is undefined, reject non-MII stages
                console.log(
                  `[FertilizationModal] Sample ${sample.id} rejected: maturityStage is ${trimmedStage}, not MII, and isMature is undefined`
                );
                return false;
              }
            }
          } else {
            // If maturityStage is not set, check isMature as fallback
            if (isMature !== undefined) {
              if (!isMature) {
                console.log(
                  `[FertilizationModal] Sample ${sample.id} rejected: isMature is false`
                );
                return false;
              }
            }
            // If neither maturityStage nor isMature is set, allow it (for backward compatibility)
            console.log(
              `[FertilizationModal] Sample ${sample.id} allowed: no maturityStage/isMature info (backward compatibility)`
            );
          }

          // Must not already be marked for fertilization
          if (sample.canFertilize === true) {
            console.log(
              `[FertilizationModal] Sample ${sample.id} rejected: already marked for fertilization`
            );
            return false;
          }

          // Filter by treatment cycle relationship:
          // - If sample has treatmentCycleId, it should belong to a cycle in the same treatment
          // - But be flexible: if no treatmentCycleId, allow it (might be from previous treatment or not assigned yet)
          // - Also allow if treatmentCycleId doesn't match but sample is from same patient (might be from previous cycle)
          if (sample.treatmentCycleId) {
            if (!relatedCycleIds.includes(sample.treatmentCycleId)) {
              // Sample belongs to a different cycle, but still allow if it's from the same patient
              // This allows using samples from previous cycles in the same treatment
              console.log(
                `[FertilizationModal] Sample ${sample.id} warning: belongs to different cycle (${sample.treatmentCycleId}) but allowing (same patient)`
              );
              // Don't reject - allow samples from other cycles of the same patient
            }
          }

          console.log(`[FertilizationModal] Sample ${sample.id} accepted`);
          return true;
        });
        console.log("[FertilizationModal] Oocyte samples:", {
          cycleId,
          treatmentId: cycleDetails?.treatmentId,
          relatedCycleIds,
          total: samples.length,
          qualityChecked: samples.filter((s) =>
            qualityCheckedStatuses.includes(s.status)
          ).length,
          filtered: filtered.length,
          samples: samples.map((s) => ({
            id: s.id,
            status: s.status,
            isAvailable: s.isAvailable,
            canFertilize: s.canFertilize,
            maturityStage: s.oocyte?.maturityStage,
            isMature: s.oocyte?.isMature,
            patientId: s.patientId,
            treatmentCycleId: s.treatmentCycleId,
            belongsToRelatedCycle: s.treatmentCycleId
              ? relatedCycleIds.includes(s.treatmentCycleId)
              : "no cycle",
          })),
        });
        return filtered;
      } catch (error: any) {
        console.error("[FertilizationModal] Error fetching oocyte samples:", {
          error,
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          patientId,
          cycleId,
        });
        // Return empty array on error, but log for debugging
        return [];
      }
    },
    enabled: isOpen && !!patientId && !!cycleId,
  });

  const spermSamples = Array.isArray(spermSamplesData) ? spermSamplesData : [];
  const oocyteSamples = Array.isArray(oocyteSamplesData)
    ? oocyteSamplesData
    : [];

  // Mutation to mark samples for fertilization using PUT /api/labsample/fertilize/{id}
  const fertilizeMutation = useMutation({
    mutationFn: async ({ sampleIds }: { sampleIds: string[] }) => {
      // Mark all selected samples as canFertilize using the fertilize API
      // This sends samples to the lab for fertilization
      const promises = sampleIds.map((id) =>
        api.sample.updateFertilizeStatus(id, true)
      );

      // Wait for all requests to complete
      const results = await Promise.allSettled(promises);

      // Check if any requests failed
      const failures = results.filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        const errors = failures
          .map((f) => (f.status === "rejected" ? f.reason : null))
          .filter(Boolean);
        throw new Error(
          `Failed to mark ${failures.length} sample(s) for fertilization. ${errors.length > 0 ? errors[0]?.message || "" : ""}`
        );
      }

      return results;
    },
    onSuccess: (_, variables) => {
      const { sampleIds } = variables;
      const spermCount = sampleIds.filter((id) =>
        spermSamples.some((s) => s.id === id)
      ).length;
      const oocyteCount = sampleIds.filter((id) =>
        oocyteSamples.some((s) => s.id === id)
      ).length;

      toast.success(
        `Successfully sent ${sampleIds.length} sample(s) to lab for fertilization! ` +
          `(${spermCount} sperm, ${oocyteCount} oocyte)`
      );

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["sperm-samples"],
      });
      queryClient.invalidateQueries({
        queryKey: ["oocyte-samples"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycleId],
      });

      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      console.error(
        "[FertilizationModal] Error marking samples for fertilization:",
        {
          error,
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        }
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send samples to lab for fertilization. Please try again.";

      toast.error(errorMessage);
    },
  });

  const handleSubmit = () => {
    if (selectedSpermIds.length === 0 && selectedOocyteIds.length === 0) {
      toast.error("Please select at least one sperm or oocyte sample");
      return;
    }

    fertilizeMutation.mutate({
      sampleIds: [...selectedSpermIds, ...selectedOocyteIds],
    });
  };

  const handleSpermToggle = (id: string) => {
    setSelectedSpermIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOocyteToggle = (id: string) => {
    setSelectedOocyteIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US");
    } catch {
      return "—";
    }
  };

  const renderSampleCard = (
    sample: LabSampleDetailResponse,
    isSelected: boolean,
    onToggle: () => void,
    type: "sperm" | "oocyte"
  ) => (
    <div
      key={sample.id}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-gray-200 hover:border-primary/50"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {sample.sampleCode || getLast4Chars(sample.id)}
            </span>
            <Badge
              variant={isSelected ? "default" : "outline"}
              className="text-xs"
            >
              {sample.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Collection Date: {formatDate(sample.collectionDate)}
          </p>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </div>

      {type === "sperm" && sample.sperm && (
        <div className="text-xs text-gray-600 space-y-1 mt-2">
          {sample.sperm.volume && <p>Volume: {sample.sperm.volume} ml</p>}
          {sample.sperm.concentration && (
            <p>Concentration: {sample.sperm.concentration} million/ml</p>
          )}
          {sample.sperm.motility && <p>Motility: {sample.sperm.motility}%</p>}
          {sample.quality && <p>Quality: {sample.quality}</p>}
        </div>
      )}

      {type === "oocyte" && sample.oocyte && (
        <div className="text-xs text-gray-600 space-y-1 mt-2">
          {sample.oocyte.quantity && <p>Quantity: {sample.oocyte.quantity}</p>}
          {sample.oocyte.maturityStage && (
            <p>Maturity Stage: {sample.oocyte.maturityStage}</p>
          )}
          {sample.oocyte.isMature !== undefined && (
            <p>Mature: {sample.oocyte.isMature ? "Yes" : "No"}</p>
          )}
          {sample.quality && <p>Quality: {sample.quality}</p>}
        </div>
      )}

      {sample.notes && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          Notes: {sample.notes}
        </p>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              In Vitro Fertilization (IVF)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select sperm and oocyte samples to send to the lab for
              fertilization
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Sperm Samples Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sperm Samples</CardTitle>
                <Badge variant="outline" className="text-sm">
                  Selected: {selectedSpermIds.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {spermLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Loading...
                </p>
              ) : !partnerPatientId ? (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-center">
                  <p className="font-semibold mb-1">
                    No Partner Relationship Found
                  </p>
                  <p className="text-xs">
                    Please establish a relationship (Married/Unmarried) with the
                    partner patient to access sperm samples for fertilization.
                  </p>
                </div>
              ) : spermSamples.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No eligible sperm samples available from partner
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spermSamples.map((sample) =>
                    renderSampleCard(
                      sample,
                      selectedSpermIds.includes(sample.id),
                      () => handleSpermToggle(sample.id),
                      "sperm"
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Oocyte Samples Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Oocyte Samples</CardTitle>
                <Badge variant="outline" className="text-sm">
                  Selected: {selectedOocyteIds.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {oocyteLoading ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Loading...
                </p>
              ) : oocyteSamples.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No eligible oocyte samples available (must be quality-checked
                  and MII stage)
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {oocyteSamples.map((sample) =>
                    renderSampleCard(
                      sample,
                      selectedOocyteIds.includes(sample.id),
                      () => handleOocyteToggle(sample.id),
                      "oocyte"
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {(selectedSpermIds.length > 0 || selectedOocyteIds.length > 0) && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Selection Summary:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {selectedSpermIds.length > 0 && (
                        <li>• {selectedSpermIds.length} sperm sample(s)</li>
                      )}
                      {selectedOocyteIds.length > 0 && (
                        <li>• {selectedOocyteIds.length} oocyte sample(s)</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-200 p-6 flex justify-end gap-3 bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={fertilizeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              fertilizeMutation.isPending ||
              (selectedSpermIds.length === 0 && selectedOocyteIds.length === 0)
            }
          >
            {fertilizeMutation.isPending
              ? "Processing..."
              : "Confirm and Send to Lab"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
