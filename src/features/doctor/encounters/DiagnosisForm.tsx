/**
 * Diagnosis Form Component
 * Form for diagnosing patients and recommending appropriate treatment (IVF or IUI)
 */

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { Treatment, TreatmentType } from "@/api/types";

type DiagnosisFormValues = {
  // Patient factors
  patientAge: string;
  partnerAge: string;
  infertilityDuration: string; // months
  previousIUIAttempts: string;
  previousIVFAttempts: string;

  // Female factors
  tubalStatus: "normal" | "blocked" | "unknown";
  ovulationStatus: "regular" | "irregular" | "anovulatory" | "unknown";
  amhLevel: string; // ng/mL
  fshLevel: string; // mIU/mL
  afcCount: string; // Antral follicle count

  // Male factors
  spermCount: string; // million/mL
  spermMotility: string; // percentage
  spermMorphology: string; // percentage

  // Diagnosis
  diagnosisCodes: string;
  clinicalNotes: string;
  recommendedTreatment: TreatmentType | "NotRecommended" | "";

  // Orders
  labOrders: string;
  imagingOrders: string;
};

interface DiagnosisFormProps {
  treatmentId: string;
  patientId?: string;
  layout?: "page" | "modal";
  onClose?: () => void;
  onSaved?: () => void;
}

export function DiagnosisForm({
  treatmentId,
  patientId: _patientId,
  layout = "modal",
  onClose,
  onSaved,
}: DiagnosisFormProps) {
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<DiagnosisFormValues>({
    patientAge: "",
    partnerAge: "",
    infertilityDuration: "",
    previousIUIAttempts: "0",
    previousIVFAttempts: "0",
    tubalStatus: "unknown",
    ovulationStatus: "unknown" as const,
    amhLevel: "",
    fshLevel: "",
    afcCount: "",
    spermCount: "",
    spermMotility: "",
    spermMorphology: "",
    diagnosisCodes: "",
    clinicalNotes: "",
    recommendedTreatment: "",
    labOrders: "",
    imagingOrders: "",
  });

  // Calculate recommended treatment based on clinical criteria
  const recommendation = useMemo(() => {
    const age = parseInt(formState.patientAge) || 0;
    const duration = parseInt(formState.infertilityDuration) || 0;
    const previousIUI = parseInt(formState.previousIUIAttempts) || 0;
    const amh = parseFloat(formState.amhLevel) || 0;
    const fsh = parseFloat(formState.fshLevel) || 0;
    const afc = parseInt(formState.afcCount) || 0;
    const spermCount = parseFloat(formState.spermCount) || 0;
    const spermMotility = parseFloat(formState.spermMotility) || 0;
    const spermMorphology = parseFloat(formState.spermMorphology) || 0;

    let score = 0;
    let reasons: string[] = [];

    // Age factors (younger = better for IUI)
    if (age < 35) {
      score += 2;
      reasons.push("Patient age < 35 years");
    } else if (age >= 40) {
      score -= 3;
      reasons.push("Patient age ≥ 40 years (IVF recommended)");
    }

    // Infertility duration
    if (duration < 12) {
      score += 1;
      reasons.push("Infertility duration < 12 months");
    } else if (duration >= 36) {
      score -= 2;
      reasons.push("Infertility duration ≥ 36 months");
    }

    // Previous IUI attempts
    if (previousIUI >= 3) {
      score -= 3;
      reasons.push("≥ 3 previous IUI attempts (IVF recommended)");
    }

    // Tubal status
    if (formState.tubalStatus === "blocked") {
      score -= 5;
      reasons.push("Blocked fallopian tubes (IVF required)");
    } else if (formState.tubalStatus === "normal") {
      score += 1;
      reasons.push("Normal fallopian tubes");
    }

    // Ovulation status
    if (formState.ovulationStatus === "anovulatory") {
      score -= 1;
      reasons.push("Anovulatory cycles");
    } else if (formState.ovulationStatus === "regular") {
      score += 1;
      reasons.push("Regular ovulation");
    }

    // Ovarian reserve (AMH, FSH, AFC)
    if (amh > 0) {
      if (amh < 1.0) {
        score -= 2;
        reasons.push("Low AMH (< 1.0 ng/mL)");
      } else if (amh >= 1.0 && amh <= 4.0) {
        score += 1;
        reasons.push("Normal AMH (1.0-4.0 ng/mL)");
      }
    }

    if (fsh > 0) {
      if (fsh > 10) {
        score -= 2;
        reasons.push("Elevated FSH (> 10 mIU/mL)");
      } else if (fsh <= 10) {
        score += 1;
        reasons.push("Normal FSH (≤ 10 mIU/mL)");
      }
    }

    if (afc > 0) {
      if (afc < 5) {
        score -= 2;
        reasons.push("Low AFC (< 5)");
      } else if (afc >= 5 && afc <= 15) {
        score += 1;
        reasons.push("Normal AFC (5-15)");
      }
    }

    // Male factors
    if (spermCount > 0 && spermMotility > 0 && spermMorphology > 0) {
      if (spermCount >= 15 && spermMotility >= 40 && spermMorphology >= 4) {
        score += 2;
        reasons.push("Normal semen parameters");
      } else if (spermCount < 5 || spermMotility < 20 || spermMorphology < 1) {
        score -= 3;
        reasons.push("Severe male factor (IVF recommended)");
      } else {
        score -= 1;
        reasons.push("Mild-moderate male factor");
      }
    }

    // Determine recommendation
    if (formState.tubalStatus === "blocked") {
      return {
        treatment: "IVF" as TreatmentType,
        confidence: "high",
        reasons: ["Blocked fallopian tubes require IVF"],
      };
    }

    if (score >= 3) {
      return {
        treatment: "IUI" as TreatmentType,
        confidence: "moderate",
        reasons: reasons.slice(0, 3),
      };
    } else if (score <= -2) {
      return {
        treatment: "IVF" as TreatmentType,
        confidence: "high",
        reasons: reasons.filter(
          (r) => r.includes("IVF") || r.includes("required")
        ),
      };
    } else {
      return {
        treatment: "IUI" as TreatmentType,
        confidence: "low",
        reasons: [
          "Consider IUI as first-line treatment, but may need IVF if unsuccessful",
        ],
      };
    }
  }, [formState]);

  const updateTreatmentMutation = useMutation({
    mutationFn: async (data: Partial<Treatment>) => {
      const response = await api.treatment.updateTreatment(treatmentId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Diagnosis saved successfully!");
      queryClient.invalidateQueries({
        queryKey: ["treatment", treatmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor-treatments"],
      });
      if (onSaved) {
        onSaved();
      }
      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to save diagnosis. Please try again.";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recommended =
      formState.recommendedTreatment || recommendation.treatment;

    const diagnosisText = [
      formState.diagnosisCodes,
      `Recommended Treatment: ${recommended}`,
      `Confidence: ${recommendation.confidence}`,
      `Clinical Notes: ${formState.clinicalNotes}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const ordersText = [formState.labOrders, formState.imagingOrders]
      .filter(Boolean)
      .join("\n\n");

    updateTreatmentMutation.mutate({
      diagnosis: diagnosisText,
      notes: ordersText,
      goals: `Recommended: ${recommended}. ${recommendation.reasons.join("; ")}`,
    });
  };

  const handleFieldChange = (
    field: keyof DiagnosisFormValues,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const applyRecommendation = () => {
    setFormState((prev) => ({
      ...prev,
      recommendedTreatment: recommendation.treatment,
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        layout === "modal" ? "space-y-6 overflow-y-auto pr-1" : "space-y-6"
      }
      style={layout === "modal" ? { maxHeight: "70vh" } : undefined}
    >
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Patient Age (years)</label>
            <Input
              type="number"
              min="18"
              max="50"
              value={formState.patientAge}
              onChange={(e) => handleFieldChange("patientAge", e.target.value)}
              placeholder="e.g., 32"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Partner Age (years)</label>
            <Input
              type="number"
              min="18"
              max="70"
              value={formState.partnerAge}
              onChange={(e) => handleFieldChange("partnerAge", e.target.value)}
              placeholder="e.g., 35"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Infertility Duration (months)
            </label>
            <Input
              type="number"
              min="0"
              value={formState.infertilityDuration}
              onChange={(e) =>
                handleFieldChange("infertilityDuration", e.target.value)
              }
              placeholder="e.g., 24"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Previous IUI Attempts</label>
            <Input
              type="number"
              min="0"
              value={formState.previousIUIAttempts}
              onChange={(e) =>
                handleFieldChange("previousIUIAttempts", e.target.value)
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Previous IVF Attempts</label>
            <Input
              type="number"
              min="0"
              value={formState.previousIVFAttempts}
              onChange={(e) =>
                handleFieldChange("previousIVFAttempts", e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Female Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Female Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tubal Status</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={formState.tubalStatus}
                onChange={(e) =>
                  handleFieldChange("tubalStatus", e.target.value)
                }
              >
                <option value="unknown">Unknown</option>
                <option value="normal">Normal</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ovulation Status</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={formState.ovulationStatus}
                onChange={(e) =>
                  handleFieldChange("ovulationStatus", e.target.value)
                }
              >
                <option value="unknown">Unknown</option>
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
                <option value="anovulatory">Anovulatory</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">AMH (ng/mL)</label>
              <Input
                type="number"
                step="0.1"
                value={formState.amhLevel}
                onChange={(e) => handleFieldChange("amhLevel", e.target.value)}
                placeholder="e.g., 2.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">FSH (mIU/mL)</label>
              <Input
                type="number"
                step="0.1"
                value={formState.fshLevel}
                onChange={(e) => handleFieldChange("fshLevel", e.target.value)}
                placeholder="e.g., 8.5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                AFC (Antral Follicle Count)
              </label>
              <Input
                type="number"
                value={formState.afcCount}
                onChange={(e) => handleFieldChange("afcCount", e.target.value)}
                placeholder="e.g., 12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Male Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Male Factors</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Sperm Count (million/mL)
            </label>
            <Input
              type="number"
              step="0.1"
              value={formState.spermCount}
              onChange={(e) => handleFieldChange("spermCount", e.target.value)}
              placeholder="e.g., 45"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sperm Motility (%)</label>
            <Input
              type="number"
              step="0.1"
              value={formState.spermMotility}
              onChange={(e) =>
                handleFieldChange("spermMotility", e.target.value)
              }
              placeholder="e.g., 55"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sperm Morphology (%)</label>
            <Input
              type="number"
              step="0.1"
              value={formState.spermMorphology}
              onChange={(e) =>
                handleFieldChange("spermMorphology", e.target.value)
              }
              placeholder="e.g., 4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Treatment Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">
                  Recommended: {recommendation.treatment}
                </h3>
                <p className="text-sm text-gray-600">
                  Confidence: {recommendation.confidence}
                </p>
              </div>
              <Button type="button" size="sm" onClick={applyRecommendation}>
                Apply Recommendation
              </Button>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Clinical Reasoning:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {recommendation.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Selected Treatment Type
            </label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={formState.recommendedTreatment}
              onChange={(e) =>
                handleFieldChange("recommendedTreatment", e.target.value)
              }
            >
              <option value="">Select treatment type</option>
              <option value="IUI">IUI (Intrauterine Insemination)</option>
              <option value="IVF">IVF (In Vitro Fertilization)</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnosis Codes (ICD)</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Ex: N97.0 - Female infertility due to ovulatory disorder"
            value={formState.diagnosisCodes}
            onChange={(e) =>
              handleFieldChange("diagnosisCodes", e.target.value)
            }
          />
        </CardContent>
      </Card>

      {/* Clinical Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Additional clinical observations and notes..."
            value={formState.clinicalNotes}
            onChange={(e) => handleFieldChange("clinicalNotes", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Lab & Imaging Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Lab Orders</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ex: Day-10 follicle scan, AMH, FSH, hormonal panel..."
              value={formState.labOrders}
              onChange={(e) => handleFieldChange("labOrders", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Imaging Orders</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ex: Pelvic ultrasound, HSG..."
              value={formState.imagingOrders}
              onChange={(e) =>
                handleFieldChange("imagingOrders", e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {layout === "modal" && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={updateTreatmentMutation.isPending}>
          {updateTreatmentMutation.isPending ? "Saving..." : "Save Diagnosis"}
        </Button>
      </div>
    </form>
  );
}
