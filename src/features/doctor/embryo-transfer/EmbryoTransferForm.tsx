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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { usePatientDetails } from "@/hooks/usePatientDetails";

interface EmbryoRow {
  id: string;
  code: string;
  type: "Fresh" | "Frozen";
  grade: string;
  quantity: number;
  notes: string;
}

interface EmbryoTransferFormData {
  patientName: string;
  patientMrn: string;
  transferDate: string;
  doctor: string;
  labTech: string;
  embryos: EmbryoRow[];
  uterineRoute: string;
  ultrasound: boolean | null;
  medicalNotes: string;
  medication: string;
  transferredCount: number;
  embryoCondition: string;
  procedureNotes: string;
  doctorName: string;
  doctorSignature: string;
  labTechName: string;
  labTechSignature: string;
  completionDateTime: string;
}

interface EmbryoTransferFormProps {
  cycleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmbryoTransferForm({
  cycleId,
  onSuccess,
  onCancel,
}: EmbryoTransferFormProps) {
  const [formData, setFormData] = useState<EmbryoTransferFormData>({
    patientName: "",
    patientMrn: "",
    transferDate: new Date().toISOString().split("T")[0],
    doctor: "",
    labTech: "",
    embryos: [],
    uterineRoute: "",
    ultrasound: null,
    medicalNotes: "",
    medication: "",
    transferredCount: 0,
    embryoCondition: "",
    procedureNotes: "",
    doctorName: "",
    doctorSignature: "",
    labTechName: "",
    labTechSignature: "",
    completionDateTime: "",
  });

  const [embryoCounter, setEmbryoCounter] = useState(1);

  // Fetch treatment cycle
  const { data: cycle, isLoading: cycleLoading } =
    useQuery<TreatmentCycle | null>({
      enabled: Boolean(cycleId),
      queryKey: ["treatment-cycle", cycleId, "transfer-form"],
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

  // Fetch embryos ready for transfer
  const { data: embryos, isLoading: embryosLoading } = useQuery<
    LabSampleDetailResponse[]
  >({
    enabled: Boolean(cycleId),
    queryKey: ["embryos", "transfer-form", cycleId],
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

  // Fetch patient details
  const { data: patientDetails } = usePatientDetails(cycle?.patientId);

  // Fetch user details for patient name
  const { data: userDetails } = useQuery({
    enabled: Boolean(cycle?.patientId),
    queryKey: ["user-details", cycle?.patientId, "transfer-form"],
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

  // Initialize form data when cycle and patient data are loaded
  useEffect(() => {
    if (cycle && patientDetails) {
      const patientName =
        getFullNameFromObject(userDetails) ||
        getFullNameFromObject(patientDetails) ||
        userDetails?.userName ||
        (patientDetails as any)?.accountInfo?.username ||
        "";

      const patientMrn = (patientDetails as any)?.patientCode || "";

      setFormData((prev) => ({
        ...prev,
        patientName,
        patientMrn,
      }));
    }
  }, [cycle, patientDetails, userDetails]);

  // Initialize embryos table when embryos are loaded
  useEffect(() => {
    if (embryos && embryos.length > 0 && formData.embryos.length === 0) {
      const initialEmbryos: EmbryoRow[] = embryos.map((embryo, index) => ({
        id: embryo.id,
        code: embryo.sampleCode || `E${String(index + 1).padStart(3, "0")}`,
        type: "Frozen", // Default to frozen, can be changed
        grade: embryo.embryo?.quality || "",
        quantity: embryo.embryo?.quantity || 1,
        notes: "",
      }));
      setFormData((prev) => ({
        ...prev,
        embryos: initialEmbryos,
        transferredCount: initialEmbryos.reduce(
          (sum, e) => sum + e.quantity,
          0
        ),
      }));
      setEmbryoCounter(embryos.length + 1);
    }
  }, [embryos]);

  const addEmbryoRow = () => {
    const newEmbryo: EmbryoRow = {
      id: `new-${embryoCounter}`,
      code: `E${String(embryoCounter).padStart(3, "0")}`,
      type: "Frozen",
      grade: "",
      quantity: 1,
      notes: "",
    };
    setFormData((prev) => ({
      ...prev,
      embryos: [...prev.embryos, newEmbryo],
    }));
    setEmbryoCounter((prev) => prev + 1);
  };

  const updateEmbryoRow = (id: string, field: keyof EmbryoRow, value: any) => {
    setFormData((prev) => ({
      ...prev,
      embryos: prev.embryos.map((embryo) =>
        embryo.id === id ? { ...embryo, [field]: value } : embryo
      ),
      transferredCount:
        field === "quantity"
          ? prev.embryos.reduce((sum, e) => {
              if (e.id === id) return sum + Number(value);
              return sum + e.quantity;
            }, 0)
          : prev.transferredCount,
    }));
  };

  const removeEmbryoRow = (id: string) => {
    setFormData((prev) => {
      const removed = prev.embryos.find((e) => e.id === id);
      return {
        ...prev,
        embryos: prev.embryos.filter((e) => e.id !== id),
        transferredCount: removed
          ? prev.transferredCount - removed.quantity
          : prev.transferredCount,
      };
    });
  };

  const updateFormField = <K extends keyof EmbryoTransferFormData>(
    field: K,
    value: EmbryoTransferFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
  });

  const handleSubmit = async () => {
    // Validation
    if (!formData.patientName || !formData.patientMrn) {
      toast.error("Please enter patient information");
      return;
    }

    if (!formData.transferDate) {
      toast.error("Please select transfer date");
      return;
    }

    if (!formData.doctor) {
      toast.error("Please enter doctor name");
      return;
    }

    if (formData.embryos.length === 0) {
      toast.error("Please add at least one embryo");
      return;
    }

    if (formData.transferredCount === 0) {
      toast.error("Transferred embryo count must be greater than 0");
      return;
    }

    if (!formData.doctorName || !formData.doctorSignature) {
      toast.error("Please enter doctor name and signature");
      return;
    }

    try {
      // Update embryo statuses
      const updatePromises = formData.embryos.map((embryo) => {
        if (embryo.id.startsWith("new-")) {
          // New embryo, might need to create it or skip
          return Promise.resolve();
        }
        return updateEmbryoMutation.mutateAsync({
          embryoId: embryo.id,
          status: "Used",
          notes: embryo.notes || formData.procedureNotes || undefined,
        });
      });

      await Promise.all(updatePromises);

      toast.success("Embryo transfer confirmed successfully");
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to confirm embryo transfer"
      );
    }
  };

  const isLoading = cycleLoading || embryosLoading;

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Loading information...
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="space-y-4 py-6 text-center text-sm text-red-600">
        <p>Treatment cycle not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl border-b-2 border-primary pb-3">
            EMBRYO TRANSFER FORM – DOCTOR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Patient Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient-name">Patient</Label>
                <Input
                  id="patient-name"
                  value={formData.patientName}
                  onChange={(e) =>
                    updateFormField("patientName", e.target.value)
                  }
                  placeholder="Patient Name"
                />
              </div>
              <div>
                <Label htmlFor="patient-mrn">Medical Record Number</Label>
                <Input
                  id="patient-mrn"
                  value={formData.patientMrn}
                  onChange={(e) =>
                    updateFormField("patientMrn", e.target.value)
                  }
                  placeholder="MRN-2025-0001"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transfer-date">Transfer Date</Label>
                <Input
                  id="transfer-date"
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) =>
                    updateFormField("transferDate", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="doctor">Performing Doctor</Label>
                <Input
                  id="doctor"
                  value={formData.doctor}
                  onChange={(e) => updateFormField("doctor", e.target.value)}
                  placeholder="Dr. Name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="lab-tech">Lab Tech Preparing Embryos</Label>
              <Input
                id="lab-tech"
                value={formData.labTech}
                onChange={(e) => updateFormField("labTech", e.target.value)}
                placeholder="Lab Tech Name"
              />
            </div>
          </div>

          {/* Section 2: Embryo Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">
              1. Embryo Transfer Information
            </h4>
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
                      Embryo Type
                    </th>
                    <th className="text-left p-2 text-xs uppercase text-gray-500">
                      Quality (Grade)
                    </th>
                    <th className="text-left p-2 text-xs uppercase text-gray-500">
                      Transfer Quantity
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
                  {formData.embryos.map((embryo, index) => (
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
                        <select
                          value={embryo.type}
                          onChange={(e) =>
                            updateEmbryoRow(
                              embryo.id,
                              "type",
                              e.target.value as "Fresh" | "Frozen"
                            )
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="Fresh">Fresh</option>
                          <option value="Frozen">Frozen</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={embryo.grade}
                          onChange={(e) =>
                            updateEmbryoRow(embryo.id, "grade", e.target.value)
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
                          min="1"
                          max="3"
                          value={embryo.quantity}
                          onChange={(e) =>
                            updateEmbryoRow(
                              embryo.id,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={embryo.notes}
                          onChange={(e) =>
                            updateEmbryoRow(embryo.id, "notes", e.target.value)
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
          </div>

          {/* Section 3: Technical Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">2. Technical Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="uterine-route">Uterine Entry Route</Label>
                <Input
                  id="uterine-route"
                  value={formData.uterineRoute}
                  onChange={(e) =>
                    updateFormField("uterineRoute", e.target.value)
                  }
                  placeholder="e.g., Cervix, vagina..."
                />
              </div>
              <div>
                <Label>Ultrasound Support</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ultrasound"
                      checked={formData.ultrasound === true}
                      onChange={() => updateFormField("ultrasound", true)}
                      className="h-4 w-4"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ultrasound"
                      checked={formData.ultrasound === false}
                      onChange={() => updateFormField("ultrasound", false)}
                      className="h-4 w-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medical-notes">Medical Notes</Label>
                <Textarea
                  id="medical-notes"
                  value={formData.medicalNotes}
                  onChange={(e) =>
                    updateFormField("medicalNotes", e.target.value)
                  }
                  placeholder="Notes about patient condition, contraindications..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="medication">
                  Supporting Medication Before/After Transfer
                </Label>
                <Textarea
                  id="medication"
                  value={formData.medication}
                  onChange={(e) =>
                    updateFormField("medication", e.target.value)
                  }
                  placeholder="Medication list, dosage, timing..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Results and Notes */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">
              3. Results and Notes After Transfer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transferred-count">
                  Number of Embryos Transferred
                </Label>
                <Input
                  id="transferred-count"
                  type="number"
                  value={formData.transferredCount}
                  onChange={(e) =>
                    updateFormField(
                      "transferredCount",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="embryo-condition">
                  Embryo Condition at Transfer
                </Label>
                <select
                  id="embryo-condition"
                  value={formData.embryoCondition}
                  onChange={(e) =>
                    updateFormField("embryoCondition", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select condition</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="procedure-notes">
                Notes on Procedure and Patient Response
              </Label>
              <Textarea
                id="procedure-notes"
                value={formData.procedureNotes}
                onChange={(e) =>
                  updateFormField("procedureNotes", e.target.value)
                }
                placeholder="Detailed description of procedure, patient response..."
                rows={4}
              />
            </div>
          </div>

          {/* Section 5: Confirmation */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">4. Confirmation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center space-y-4">
                <Label>Performing Doctor</Label>
                <Input
                  value={formData.doctorName}
                  onChange={(e) =>
                    updateFormField("doctorName", e.target.value)
                  }
                  placeholder="Doctor Name"
                  className="text-center border-0 border-b rounded-none"
                />
                <Input
                  value={formData.doctorSignature}
                  onChange={(e) =>
                    updateFormField("doctorSignature", e.target.value)
                  }
                  placeholder="Signature"
                  className="text-center border-0 border-b rounded-none mt-2"
                />
              </div>
              <div className="text-center space-y-4">
                <Label>Lab Tech Confirming Embryo Transfer</Label>
                <Input
                  value={formData.labTechName}
                  onChange={(e) =>
                    updateFormField("labTechName", e.target.value)
                  }
                  placeholder="Lab Tech Name"
                  className="text-center border-0 border-b rounded-none"
                />
                <Input
                  value={formData.labTechSignature}
                  onChange={(e) =>
                    updateFormField("labTechSignature", e.target.value)
                  }
                  placeholder="Signature"
                  className="text-center border-0 border-b rounded-none mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="completion-datetime">Completion Date/Time</Label>
              <Input
                id="completion-datetime"
                type="datetime-local"
                value={formData.completionDateTime}
                onChange={(e) =>
                  updateFormField("completionDateTime", e.target.value)
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={updateEmbryoMutation.isPending}
            >
              {updateEmbryoMutation.isPending
                ? "Processing..."
                : "Confirm Transfer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
