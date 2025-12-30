import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { toast } from "sonner";
import type {
  TreatmentCycle,
  LabSample,
  LabSampleEmbryo,
  SpecimenStatus,
} from "@/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useAuth } from "@/contexts/AuthContext";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

interface EmbryoRow {
  id: string;
  code: string;
  type: "Fresh" | "Frozen";
  grade: string;
  quantity: number;
  notes: string;
  action: "transfer" | "freeze" | ""; // Action for each embryo: transfer or freeze
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

  // Fetch embryos ready for transfer or freezing
  // Load all embryos from database using GET /api/labsample
  const { data: embryos, isLoading: embryosLoading } = useQuery<
    LabSample[]
  >({
    enabled: Boolean(cycleId) && Boolean(cycle?.patientId),
    queryKey: ["embryos", "transfer-form", cycleId, cycle?.patientId],
    queryFn: async () => {
      if (!cycleId || !cycle?.patientId) return [];
      try {
        // Use GET /api/labsample with PatientId filter
        const response = await api.sample.getSamples({
          SampleType: "Embryo",
          PatientId: cycle.patientId,
          Page: 1,
          Size: 100,
        });
        
        // Filter embryos for this cycle only (if treatmentCycleId is available)
        // If treatmentCycleId is not set, include all embryos for the patient
        const allEmbryos = response.data ?? [];
        const cycleEmbryos = allEmbryos.filter(
          (e) => {
            // If treatmentCycleId exists in embryo, filter by it
            // Otherwise, include all embryos for the patient (they might not have treatmentCycleId set yet)
            if (e.treatmentCycleId) {
              return e.treatmentCycleId === cycleId;
            }
            // Include embryos without treatmentCycleId (they might be newly created)
            return true;
          }
        );
        
        // Debug log
        console.log("[EmbryoTransferForm] Loaded embryos:", {
          cycleId,
          patientId: cycle.patientId,
          totalFromAPI: allEmbryos.length,
          cycleEmbryos: cycleEmbryos.length,
          embryos: cycleEmbryos.map((e) => ({
            id: e.id,
            code: e.sampleCode,
            status: e.status,
            quality: e.quality,
            cycleId: e.treatmentCycleId,
          })),
        });
        
        return cycleEmbryos;
      } catch (error) {
        console.error("[EmbryoTransferForm] Error loading embryos:", error);
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

  // Fetch doctor profile for auto-filling doctor name and signature
  const { data: doctorProfile } = useDoctorProfile();
  const { user } = useAuth();

  // Initialize form data when cycle and patient data are loaded
  useEffect(() => {
    if (cycle && patientDetails) {
      const patientName =
        getFullNameFromObject(userDetails) ||
        getFullNameFromObject(patientDetails) ||
        userDetails?.userName ||
        (isPatientDetailResponse(patientDetails)
          ? patientDetails.accountInfo?.username
          : null) ||
        "";

      // Get patient code (Medical Record Number) - available in both Patient and PatientDetailResponse
      const patientMrn = patientDetails.patientCode || "";

      setFormData((prev) => ({
        ...prev,
        patientName,
        patientMrn,
      }));
    }
  }, [cycle, patientDetails, userDetails]);

  // Auto-fill doctor name and signature when doctor profile is loaded
  useEffect(() => {
    if (doctorProfile || user) {
      const doctorName =
        getFullNameFromObject(doctorProfile) ||
        getFullNameFromObject(user) ||
        user?.userName ||
        "";

      // Use doctor name as signature (or can be customized)
      const doctorSignature = doctorName;

      // Also auto-fill the "Performing Doctor" field in section 1
      setFormData((prev) => ({
        ...prev,
        doctor: doctorName,
        doctorName,
        doctorSignature,
      }));
    }
  }, [doctorProfile, user]);

  // Initialize embryos table when embryos are loaded from database
  // Use a ref to track if we've already loaded embryos to avoid re-loading
  const embryosLoadedRef = useRef(false);
  
  // Reset ref when cycleId changes
  useEffect(() => {
    embryosLoadedRef.current = false;
  }, [cycleId]);
  
  useEffect(() => {
    console.log("[EmbryoTransferForm] useEffect embryos:", {
      embryosLength: embryos?.length || 0,
      embryosLoaded: embryosLoadedRef.current,
      formDataEmbryosLength: formData.embryos.length,
    });
    
    if (embryos && embryos.length > 0 && !embryosLoadedRef.current) {
      console.log("[EmbryoTransferForm] Loading embryos into form:", embryos.length);
      
      const initialEmbryos: EmbryoRow[] = embryos.map((embryo, index) => {
        // Cast to LabSampleEmbryo to access embryo-specific fields
        const embryoSample = embryo as LabSampleEmbryo;
        
        return {
          id: embryo.id,
          code: embryo.sampleCode || `E${String(index + 1).padStart(3, "0")}`,
          // Determine type based on embryo status or default to Frozen
          type: embryo.status === "Frozen" || embryo.status === "Stored" ? "Frozen" : "Fresh",
          grade: embryoSample.grade || embryoSample.quality || embryo.quality || "",
          quantity: embryoSample.quantity || 1,
          notes: embryo.notes || "",
          action: "", // Default to empty, user must choose transfer or freeze
        };
      });
      
      console.log("[EmbryoTransferForm] Mapped embryos:", initialEmbryos);
      
      setFormData((prev) => {
        // Only update if form is empty or if we have new embryos
        if (prev.embryos.length === 0 || prev.embryos.every((e) => e.id.startsWith("new-"))) {
          return {
            ...prev,
            embryos: initialEmbryos,
            transferredCount: initialEmbryos
              .filter((e) => e.action === "transfer")
              .reduce((sum, e) => sum + e.quantity, 0),
          };
        }
        return prev;
      });
      
      setEmbryoCounter(embryos.length + 1);
      embryosLoadedRef.current = true;
    } else if (embryos && embryos.length === 0) {
      // Reset flag if embryos list becomes empty
      embryosLoadedRef.current = false;
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
      action: "",
    };
    setFormData((prev) => ({
      ...prev,
      embryos: [...prev.embryos, newEmbryo],
    }));
    setEmbryoCounter((prev) => prev + 1);
  };

  const updateEmbryoRow = (id: string, field: keyof EmbryoRow, value: any) => {
    setFormData((prev) => {
      const updatedEmbryos = prev.embryos.map((embryo) =>
        embryo.id === id ? { ...embryo, [field]: value } : embryo
      );
      
      // Recalculate transferredCount based on action
      const transferredCount = updatedEmbryos
        .filter((e) => e.action === "transfer")
        .reduce((sum, e) => sum + e.quantity, 0);
      
      return {
        ...prev,
        embryos: updatedEmbryos,
        transferredCount,
      };
    });
  };

  const removeEmbryoRow = (id: string) => {
    setFormData((prev) => {
      const updatedEmbryos = prev.embryos.filter((e) => e.id !== id);
      const transferredCount = updatedEmbryos
        .filter((e) => e.action === "transfer")
        .reduce((sum, e) => sum + e.quantity, 0);
      
      return {
        ...prev,
        embryos: updatedEmbryos,
        transferredCount,
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
      isFreeze = false,
    }: {
      embryoId: string;
      status: SpecimenStatus;
      notes?: string;
      isFreeze?: boolean;
    }) => {
      // If freezing, use the frozen API endpoint: PUT /api/labsample/frozen/{id}
      if (isFreeze) {
        // Call the frozen API endpoint with canFrozen: true
        const frozenResponse = await api.sample.updateFrozenStatus(embryoId, true);
        
        // If notes are provided, update them separately using updateEmbryoSample
        if (notes) {
          await api.sample.updateEmbryoSample(embryoId, {
            notes,
          });
        }
        
        return frozenResponse;
      }
      
      // For transfer (Used status), use the embryo update endpoint
      return api.sample.updateEmbryoSample(embryoId, {
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

    // Check if all embryos have an action selected
    const embryosWithoutAction = formData.embryos.filter(
      (e) => !e.action
    );
    if (embryosWithoutAction.length > 0) {
      toast.error("Please select an action (Transfer or Freeze) for all embryos");
      return;
    }

    // Check if at least one embryo is being transferred
    const transferEmbryos = formData.embryos.filter((e) => e.action === "transfer");
    if (transferEmbryos.length === 0) {
      toast.error("Please select at least one embryo to transfer");
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
      // Update embryo statuses based on action
      const updatePromises = formData.embryos.map((embryo) => {
        if (embryo.id.startsWith("new-")) {
          // New embryo, might need to create it or skip
          return Promise.resolve();
        }
        
        if (embryo.action === "transfer") {
          // Transfer: set status to "Used"
          return updateEmbryoMutation.mutateAsync({
            embryoId: embryo.id,
            status: "Used",
            notes: embryo.notes || formData.procedureNotes || undefined,
            isFreeze: false,
          });
        } else if (embryo.action === "freeze") {
          // Freeze: set status to "Stored"
          return updateEmbryoMutation.mutateAsync({
            embryoId: embryo.id,
            status: "Stored",
            notes: embryo.notes || formData.procedureNotes || undefined,
            isFreeze: true,
          });
        }
        
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      const transferCount = transferEmbryos.length;
      const freezeCount = formData.embryos.filter((e) => e.action === "freeze").length;
      
      toast.success(
        `Successfully confirmed: ${transferCount} embryos transferred, ${freezeCount} embryos frozen`
      );
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
              1. Embryo Information and Action Selection
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Please select an action for each embryo: <strong>Transfer</strong> or <strong>Freeze</strong>
            </p>
            {embryosLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading embryos from database...
              </div>
            ) : formData.embryos.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {embryos && embryos.length === 0
                  ? "No embryos found for this treatment cycle. Please add embryos manually or ensure embryos are created for this cycle."
                  : "No embryos loaded. Please wait..."}
              </div>
            ) : (
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
                        Action
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
                        <select
                          value={embryo.action}
                          onChange={(e) =>
                            updateEmbryoRow(
                              embryo.id,
                              "action",
                              e.target.value as "transfer" | "freeze" | ""
                            )
                          }
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          <option value="">Select action</option>
                          <option value="transfer">Transfer</option>
                          <option value="freeze">Freeze</option>
                        </select>
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
            )}
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
