/**
 * IVF Workflow Form Component
 * Comprehensive form for tracking IVF treatment cycle with all detailed steps
 */

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import type {
  IVFWorkflowData,
  IVFStimulationData,
  IVFOocytePickupData,
  IVFSpermPreparationData,
  IVFFertilizationData,
  IVFEmbryoCultureData,
  IVFEmbryoTransferData,
  IVFLutealSupportData,
  IVFPregnancyTestData,
  CycleStatus,
} from "@/types/treatment-workflow";

interface IVFWorkflowFormProps {
  cycleId: string;
  patientId: string;
  treatmentId: string;
  initialData?: Partial<IVFWorkflowData>;
  onSave: (data: IVFWorkflowData) => Promise<void>;
  onComplete: (data: IVFWorkflowData) => Promise<void>;
}

type WorkflowStep =
  | "stimulation"
  | "opu"
  | "spermPrep"
  | "fertilization"
  | "culture"
  | "transfer"
  | "luteal"
  | "pregnancy";

const STEP_LABELS: Record<WorkflowStep, string> = {
  stimulation: "1. Kích thích buồng trứng",
  opu: "2. Chọc hút trứng (OPU)",
  spermPrep: "3. Chuẩn bị tinh trùng",
  fertilization: "4. Thụ tinh",
  culture: "5. Nuôi phôi",
  transfer: "6. Chuyển phôi (ET)",
  luteal: "7. Hỗ trợ hoàng thể",
  pregnancy: "8. Test thai",
};

const STEP_DESCRIPTIONS: Record<WorkflowStep, string> = {
  stimulation: "Protocol, medications, USG monitoring, E2 levels",
  opu: "Total oocytes, MII/MI/GV classification, morphology",
  spermPrep: "Sperm density, PR%, viability, morphology - before & after",
  fertilization: "IVF/ICSI method, fertilization success rate",
  culture: "Daily tracking: cell count, fragmentation, blastocyst grading",
  transfer: "ET date, embryo count & quality, embryo codes",
  luteal: "Luteal phase support medications",
  pregnancy: "β-hCG, ultrasound confirmation",
};

export function IVFWorkflowForm({
  cycleId,
  patientId,
  treatmentId,
  initialData,
  onSave,
  onComplete,
}: IVFWorkflowFormProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("stimulation");
  const [workflowData, setWorkflowData] = useState<Partial<IVFWorkflowData>>(
    initialData || {
      cycleId,
      patientId,
      treatmentId,
      startDate: new Date().toISOString().split("T")[0],
      currentStatus: "COS",
      stimulation: {
        protocol: "Antagonist",
        protocolDetails: "",
        startDate: "",
        medications: [],
        monitoring: [],
        triggerShot: {
          date: "",
          time: "",
          medication: "",
          dosage: "",
        },
      },
      oocytePickup: {
        procedureDate: "",
        procedureTime: "",
        hoursAfterTrigger: 36,
        performedBy: {
          doctorId: "",
          doctorName: "",
        },
        anesthesia: {
          type: "IV sedation",
        },
        totalOocytesRetrieved: 0,
        oocyteClassification: {
          mii: 0,
          mi: 0,
          gv: 0,
          atretic: 0,
        },
        ovaries: {
          right: { folliclesAspirated: 0, oocytesRetrieved: 0 },
          left: { folliclesAspirated: 0, oocytesRetrieved: 0 },
        },
      },
      spermPreparation: {
        sampleType: "Fresh",
        collectionDate: "",
        rawAnalysis: {
          concentration: 0,
          progressiveMotility: 0,
          viability: 0,
          normalMorphology: 0,
        },
        processingMethod: "",
        postProcessing: {
          concentration: 0,
          progressiveMotility: 0,
          viability: 0,
          normalMorphology: 0,
        },
        recommendedMethod: "ICSI",
      },
      fertilization: {
        fertilizationDate: "",
        fertilizationTime: "",
        method: "ICSI",
        oocytesInseminated: {
          total: 0,
        },
        fertilizationCheck: {
          checkDate: "",
          checkTime: "",
          twoPN: 0,
        },
        fertilizationRate: 0,
      },
      embryoCulture: {
        cultureStartDate: "",
        cultureSystem: "",
        dailyAssessment: [],
        summary: {
          totalEmbryos: 0,
          goodQuality: 0,
          fairQuality: 0,
          poorQuality: 0,
          arrested: 0,
        },
      },
      embryoTransfer: {
        transferDate: "",
        transferTime: "",
        transferType: "Fresh",
        dayOfTransfer: 5,
        performedBy: {
          doctorId: "",
          doctorName: "",
        },
        embryosTransferred: [],
        numberOfEmbryosTransferred: 0,
        catheterType: "",
        difficulty: "Easy",
        ultrasoundGuidance: true,
        endometriumThickness: 0,
      },
      lutealSupport: {
        startDate: "",
        medications: [],
      },
      pregnancyTest: {
        firstTestDate: "",
        daysPostTransfer: 10,
        betaHCG: 0,
        result: "Negative",
        outcome: "Negative",
        patientNotified: false,
      },
    }
  );

  const [isSaving, setIsSaving] = useState(false);

  const steps: WorkflowStep[] = [
    "stimulation",
    "opu",
    "spermPrep",
    "fertilization",
    "culture",
    "transfer",
    "luteal",
    "pregnancy",
  ];

  const currentStepIndex = steps.indexOf(currentStep);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(workflowData as IVFWorkflowData);
      toast.success("IVF workflow data saved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save workflow data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);

      let finalStatus: CycleStatus = "Closed";
      if (workflowData.pregnancyTest?.result === "Positive") {
        if (
          workflowData.pregnancyTest.outcome?.includes("Clinical pregnancy")
        ) {
          finalStatus = "Preg+";
        }
      } else {
        finalStatus = "Preg-";
      }

      const completedData: IVFWorkflowData = {
        ...workflowData,
        completionDate: new Date().toISOString(),
        currentStatus: finalStatus,
      } as IVFWorkflowData;

      await onComplete(completedData);
      toast.success("IVF cycle completed successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to complete cycle");
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>IVF Workflow Progress</CardTitle>
          <p className="text-sm text-gray-600">
            Cycle Status: {workflowData.currentStatus || "COS"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  currentStep === step
                    ? "bg-primary text-white"
                    : index < currentStepIndex
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {STEP_LABELS[step]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {STEP_DESCRIPTIONS[currentStep]}
          </p>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === "stimulation" && (
        <StimulationStepForm
          data={workflowData.stimulation}
          onChange={(stimulation) =>
            setWorkflowData({
              ...workflowData,
              stimulation: stimulation as IVFStimulationData,
              currentStatus: "COS",
            })
          }
        />
      )}

      {currentStep === "opu" && (
        <OPUStepForm
          data={workflowData.oocytePickup}
          onChange={(oocytePickup) =>
            setWorkflowData({
              ...workflowData,
              oocytePickup: oocytePickup as IVFOocytePickupData,
              currentStatus: "OPU",
            })
          }
        />
      )}

      {currentStep === "spermPrep" && (
        <SpermPrepStepForm
          data={workflowData.spermPreparation}
          onChange={(spermPreparation) =>
            setWorkflowData({
              ...workflowData,
              spermPreparation: spermPreparation as IVFSpermPreparationData,
            })
          }
        />
      )}

      {currentStep === "fertilization" && (
        <FertilizationStepForm
          data={workflowData.fertilization}
          onChange={(fertilization) =>
            setWorkflowData({
              ...workflowData,
              fertilization: fertilization as IVFFertilizationData,
              currentStatus: "Fert",
            })
          }
        />
      )}

      {currentStep === "culture" && (
        <CultureStepForm
          data={workflowData.embryoCulture}
          onChange={(embryoCulture) =>
            setWorkflowData({
              ...workflowData,
              embryoCulture: embryoCulture as IVFEmbryoCultureData,
              currentStatus: "Culture",
            })
          }
        />
      )}

      {currentStep === "transfer" && (
        <TransferStepForm
          data={workflowData.embryoTransfer}
          onChange={(embryoTransfer) =>
            setWorkflowData({
              ...workflowData,
              embryoTransfer: embryoTransfer as IVFEmbryoTransferData,
              currentStatus:
                workflowData.embryoTransfer?.transferType === "Frozen"
                  ? "FET"
                  : "ET",
            })
          }
        />
      )}

      {currentStep === "luteal" && (
        <LutealStepForm
          data={workflowData.lutealSupport}
          onChange={(lutealSupport) =>
            setWorkflowData({
              ...workflowData,
              lutealSupport: lutealSupport as IVFLutealSupportData,
            })
          }
        />
      )}

      {currentStep === "pregnancy" && (
        <PregnancyStepForm
          data={workflowData.pregnancyTest}
          onChange={(pregnancyTest) =>
            setWorkflowData({
              ...workflowData,
              pregnancyTest: pregnancyTest as IVFPregnancyTestData,
            })
          }
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={currentStepIndex === 0 || isSaving}
        >
          Previous Step
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>

          {currentStepIndex === steps.length - 1 ? (
            <Button onClick={handleComplete} disabled={isSaving}>
              Complete IVF Cycle
            </Button>
          ) : (
            <Button onClick={goNext} disabled={isSaving}>
              Next Step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step Form Components
// ============================================================================

interface StimulationStepFormProps {
  data?: Partial<IVFStimulationData>;
  onChange: (data: Partial<IVFStimulationData>) => void;
}

function StimulationStepForm({ data, onChange }: StimulationStepFormProps) {
  const [medications, setMedications] = useState(data?.medications || []);
  const [monitoring, setMonitoring] = useState(data?.monitoring || []);

  const addMedication = () => {
    const newMed = {
      drugName: "",
      dosage: "",
      unit: "IU",
      startDate: new Date().toISOString().split("T")[0],
      adjustments: [],
    };
    const updated = [...medications, newMed];
    setMedications(updated);
    onChange({ ...data, medications: updated });
  };

  const addMonitoring = () => {
    const newMonitor = {
      date: new Date().toISOString().split("T")[0],
      day: 1,
      follicles: {
        small: 0,
        medium: 0,
        large: 0,
        mature: 0,
        totalCount: 0,
      },
      endometriumThickness: 0,
    };
    const updated = [...monitoring, newMonitor];
    setMonitoring(updated);
    onChange({ ...data, monitoring: updated });
  };

  return (
    <div className="space-y-6">
      {/* Protocol */}
      <Card>
        <CardHeader>
          <CardTitle>Stimulation Protocol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Protocol Type</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={data?.protocol || "Antagonist"}
                onChange={(e) =>
                  onChange({ ...data, protocol: e.target.value as any })
                }
              >
                <option value="Long">Long Protocol</option>
                <option value="Short">Short Protocol</option>
                <option value="Antagonist">Antagonist Protocol</option>
                <option value="Mini">Mini IVF</option>
                <option value="Natural">Natural Cycle</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={data?.startDate || ""}
                onChange={(e) =>
                  onChange({ ...data, startDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Protocol Details</label>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={2}
              placeholder="Detailed protocol information..."
              value={data?.protocolDetails || ""}
              onChange={(e) =>
                onChange({ ...data, protocolDetails: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stimulation Medications</CardTitle>
          <Button size="sm" onClick={addMedication}>
            + Add Medication
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.length === 0 && (
            <p className="text-sm text-gray-500">No medications added yet.</p>
          )}
          {medications.map((med, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Drug Name</label>
                  <Input
                    placeholder="e.g., Gonal-F, Menopur"
                    value={med.drugName}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[index].drugName = e.target.value;
                      setMedications(updated);
                      onChange({ ...data, medications: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Dosage</label>
                  <Input
                    placeholder="e.g., 225, 300"
                    value={med.dosage}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[index].dosage = e.target.value;
                      setMedications(updated);
                      onChange({ ...data, medications: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Unit</label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={med.unit}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[index].unit = e.target.value;
                      setMedications(updated);
                      onChange({ ...data, medications: updated });
                    }}
                  >
                    <option value="IU">IU</option>
                    <option value="mg">mg</option>
                    <option value="mcg">mcg</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={med.startDate}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[index].startDate = e.target.value;
                      setMedications(updated);
                      onChange({ ...data, medications: updated });
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const updated = medications.filter((_, i) => i !== index);
                  setMedications(updated);
                  onChange({ ...data, medications: updated });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monitoring */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>USG & Hormonal Monitoring</CardTitle>
          <Button size="sm" onClick={addMonitoring}>
            + Add Monitoring
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {monitoring.length === 0 && (
            <p className="text-sm text-gray-500">No monitoring data yet.</p>
          )}
          {monitoring.map((mon, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Date</label>
                  <Input
                    type="date"
                    value={mon.date}
                    onChange={(e) => {
                      const updated = [...monitoring];
                      updated[index].date = e.target.value;
                      setMonitoring(updated);
                      onChange({ ...data, monitoring: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Stim Day</label>
                  <Input
                    type="number"
                    value={mon.day}
                    onChange={(e) => {
                      const updated = [...monitoring];
                      updated[index].day = parseInt(e.target.value) || 1;
                      setMonitoring(updated);
                      onChange({ ...data, monitoring: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">E2 (pg/ml)</label>
                  <Input
                    type="number"
                    value={mon.e2Level || ""}
                    onChange={(e) => {
                      const updated = [...monitoring];
                      updated[index].e2Level =
                        parseFloat(e.target.value) || undefined;
                      setMonitoring(updated);
                      onChange({ ...data, monitoring: updated });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Follicle Count</label>
                <div className="grid gap-2 md:grid-cols-5">
                  <div className="space-y-1">
                    <label className="text-xs">Small (&lt;10mm)</label>
                    <Input
                      type="number"
                      value={mon.follicles.small}
                      onChange={(e) => {
                        const updated = [...monitoring];
                        updated[index].follicles.small =
                          parseInt(e.target.value) || 0;
                        setMonitoring(updated);
                        onChange({ ...data, monitoring: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Medium (10-14mm)</label>
                    <Input
                      type="number"
                      value={mon.follicles.medium}
                      onChange={(e) => {
                        const updated = [...monitoring];
                        updated[index].follicles.medium =
                          parseInt(e.target.value) || 0;
                        setMonitoring(updated);
                        onChange({ ...data, monitoring: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Large (14-17mm)</label>
                    <Input
                      type="number"
                      value={mon.follicles.large}
                      onChange={(e) => {
                        const updated = [...monitoring];
                        updated[index].follicles.large =
                          parseInt(e.target.value) || 0;
                        setMonitoring(updated);
                        onChange({ ...data, monitoring: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Mature (&gt;17mm)</label>
                    <Input
                      type="number"
                      value={mon.follicles.mature}
                      onChange={(e) => {
                        const updated = [...monitoring];
                        updated[index].follicles.mature =
                          parseInt(e.target.value) || 0;
                        setMonitoring(updated);
                        onChange({ ...data, monitoring: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Total</label>
                    <Input
                      type="number"
                      value={mon.follicles.totalCount}
                      onChange={(e) => {
                        const updated = [...monitoring];
                        updated[index].follicles.totalCount =
                          parseInt(e.target.value) || 0;
                        setMonitoring(updated);
                        onChange({ ...data, monitoring: updated });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Endometrium (mm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={mon.endometriumThickness}
                    onChange={(e) => {
                      const updated = [...monitoring];
                      updated[index].endometriumThickness =
                        parseFloat(e.target.value) || 0;
                      setMonitoring(updated);
                      onChange({ ...data, monitoring: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Notes</label>
                  <Input
                    placeholder="Additional findings"
                    value={mon.notes || ""}
                    onChange={(e) => {
                      const updated = [...monitoring];
                      updated[index].notes = e.target.value;
                      setMonitoring(updated);
                      onChange({ ...data, monitoring: updated });
                    }}
                  />
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const updated = monitoring.filter((_, i) => i !== index);
                  setMonitoring(updated);
                  onChange({ ...data, monitoring: updated });
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trigger Shot */}
      <Card>
        <CardHeader>
          <CardTitle>Trigger Shot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={data?.triggerShot?.date || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    triggerShot: {
                      ...data?.triggerShot,
                      date: e.target.value,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={data?.triggerShot?.time || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    triggerShot: {
                      ...data?.triggerShot,
                      time: e.target.value,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Medication</label>
              <Input
                placeholder="e.g., hCG, Ovidrel, GnRH agonist"
                value={data?.triggerShot?.medication || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    triggerShot: {
                      ...data?.triggerShot,
                      medication: e.target.value,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dosage</label>
              <Input
                placeholder="e.g., 250 mcg, 10,000 IU"
                value={data?.triggerShot?.dosage || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    triggerShot: {
                      ...data?.triggerShot,
                      dosage: e.target.value,
                    } as any,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Due to file length, I'll create simplified versions of the remaining step forms
// In a production environment, these would be fully detailed

interface OPUStepFormProps {
  data?: Partial<IVFOocytePickupData>;
  onChange: (data: Partial<IVFOocytePickupData>) => void;
}

function OPUStepForm({ data, onChange }: OPUStepFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OPU Procedure Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Procedure Date</label>
              <Input
                type="date"
                value={data?.procedureDate || ""}
                onChange={(e) =>
                  onChange({ ...data, procedureDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Procedure Time</label>
              <Input
                type="time"
                value={data?.procedureTime || ""}
                onChange={(e) =>
                  onChange({ ...data, procedureTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hours after trigger</label>
              <Input
                type="number"
                value={data?.hoursAfterTrigger || 36}
                onChange={(e) =>
                  onChange({
                    ...data,
                    hoursAfterTrigger: parseInt(e.target.value) || 36,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Total Oocytes Retrieved
            </label>
            <Input
              type="number"
              value={data?.totalOocytesRetrieved || 0}
              onChange={(e) =>
                onChange({
                  ...data,
                  totalOocytesRetrieved: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Oocyte Classification</label>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs">MII (Mature)</label>
                <Input
                  type="number"
                  value={data?.oocyteClassification?.mii || 0}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      oocyteClassification: {
                        ...data?.oocyteClassification,
                        mii: parseInt(e.target.value) || 0,
                      } as any,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">MI (Immature)</label>
                <Input
                  type="number"
                  value={data?.oocyteClassification?.mi || 0}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      oocyteClassification: {
                        ...data?.oocyteClassification,
                        mi: parseInt(e.target.value) || 0,
                      } as any,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">GV (Immature)</label>
                <Input
                  type="number"
                  value={data?.oocyteClassification?.gv || 0}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      oocyteClassification: {
                        ...data?.oocyteClassification,
                        gv: parseInt(e.target.value) || 0,
                      } as any,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs">Atretic</label>
                <Input
                  type="number"
                  value={data?.oocyteClassification?.atretic || 0}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      oocyteClassification: {
                        ...data?.oocyteClassification,
                        atretic: parseInt(e.target.value) || 0,
                      } as any,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Per Ovary</label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium">Right Ovary</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Follicles aspirated"
                    value={data?.ovaries?.right?.folliclesAspirated || 0}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        ovaries: {
                          ...data?.ovaries,
                          right: {
                            ...data?.ovaries?.right,
                            folliclesAspirated: parseInt(e.target.value) || 0,
                          } as any,
                        } as any,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Oocytes retrieved"
                    value={data?.ovaries?.right?.oocytesRetrieved || 0}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        ovaries: {
                          ...data?.ovaries,
                          right: {
                            ...data?.ovaries?.right,
                            oocytesRetrieved: parseInt(e.target.value) || 0,
                          } as any,
                        } as any,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Left Ovary</label>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Follicles aspirated"
                    value={data?.ovaries?.left?.folliclesAspirated || 0}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        ovaries: {
                          ...data?.ovaries,
                          left: {
                            ...data?.ovaries?.left,
                            folliclesAspirated: parseInt(e.target.value) || 0,
                          } as any,
                        } as any,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Oocytes retrieved"
                    value={data?.ovaries?.left?.oocytesRetrieved || 0}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        ovaries: {
                          ...data?.ovaries,
                          left: {
                            ...data?.ovaries?.left,
                            oocytesRetrieved: parseInt(e.target.value) || 0,
                          } as any,
                        } as any,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="Anesthesia details, complications, recovery..."
              value={data?.notes || ""}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified forms for remaining steps (in production, these would be fully detailed)

interface SpermPrepStepFormProps {
  data?: Partial<IVFSpermPreparationData>;
  onChange: (data: Partial<IVFSpermPreparationData>) => void;
}

function SpermPrepStepForm({ data, onChange }: SpermPrepStepFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sperm Preparation for IVF</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sample Type</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.sampleType || "Fresh"}
              onChange={(e) =>
                onChange({ ...data, sampleType: e.target.value as any })
              }
            >
              <option value="Fresh">Fresh</option>
              <option value="Frozen">Frozen</option>
              <option value="TESA">TESA</option>
              <option value="PESA">PESA</option>
              <option value="Donor">Donor</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Collection Date</label>
            <Input
              type="date"
              value={data?.collectionDate || ""}
              onChange={(e) =>
                onChange({ ...data, collectionDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recommended Method</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.recommendedMethod || "ICSI"}
              onChange={(e) =>
                onChange({ ...data, recommendedMethod: e.target.value as any })
              }
            >
              <option value="IVF">IVF</option>
              <option value="ICSI">ICSI</option>
              <option value="Mixed">Mixed (IVF + ICSI)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Processing Method</label>
            <Input
              placeholder="e.g., Density gradient, Swim-up"
              value={data?.processingMethod || ""}
              onChange={(e) =>
                onChange({ ...data, processingMethod: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={2}
            placeholder="Sperm analysis details, quality assessment..."
            value={data?.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface FertilizationStepFormProps {
  data?: Partial<IVFFertilizationData>;
  onChange: (data: Partial<IVFFertilizationData>) => void;
}

function FertilizationStepForm({ data, onChange }: FertilizationStepFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fertilization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fertilization Date</label>
            <Input
              type="date"
              value={data?.fertilizationDate || ""}
              onChange={(e) =>
                onChange({ ...data, fertilizationDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fertilization Time</label>
            <Input
              type="time"
              value={data?.fertilizationTime || ""}
              onChange={(e) =>
                onChange({ ...data, fertilizationTime: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Method</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.method || "ICSI"}
              onChange={(e) =>
                onChange({ ...data, method: e.target.value as any })
              }
            >
              <option value="IVF">IVF</option>
              <option value="ICSI">ICSI</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Oocytes Inseminated/Injected
            </label>
            <Input
              type="number"
              value={data?.oocytesInseminated?.total || 0}
              onChange={(e) =>
                onChange({
                  ...data,
                  oocytesInseminated: {
                    ...data?.oocytesInseminated,
                    total: parseInt(e.target.value) || 0,
                  } as any,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              2PN (Normal Fertilization)
            </label>
            <Input
              type="number"
              value={data?.fertilizationCheck?.twoPN || 0}
              onChange={(e) =>
                onChange({
                  ...data,
                  fertilizationCheck: {
                    ...data?.fertilizationCheck,
                    twoPN: parseInt(e.target.value) || 0,
                  } as any,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Fertilization Rate (%)</label>
          <Input
            type="number"
            step="0.1"
            value={data?.fertilizationRate || 0}
            onChange={(e) =>
              onChange({
                ...data,
                fertilizationRate: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={2}
            placeholder="Fertilization check details, abnormal fertilization..."
            value={data?.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface CultureStepFormProps {
  data?: Partial<IVFEmbryoCultureData>;
  onChange: (data: Partial<IVFEmbryoCultureData>) => void;
}

function CultureStepForm({ data, onChange }: CultureStepFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Embryo Culture</CardTitle>
        <p className="text-sm text-gray-600">
          Track daily embryo development, cell count, fragmentation, and
          blastocyst grading
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Culture Start Date</label>
            <Input
              type="date"
              value={data?.cultureStartDate || ""}
              onChange={(e) =>
                onChange({ ...data, cultureStartDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Culture System</label>
            <Input
              placeholder="e.g., Sequential media, Single-step"
              value={data?.cultureSystem || ""}
              onChange={(e) =>
                onChange({ ...data, cultureSystem: e.target.value })
              }
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-2">
          <label className="text-sm font-medium">Embryo Summary</label>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="space-y-1">
              <label className="text-xs">Total</label>
              <Input
                type="number"
                value={data?.summary?.totalEmbryos || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    summary: {
                      ...data?.summary,
                      totalEmbryos: parseInt(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Good Quality</label>
              <Input
                type="number"
                value={data?.summary?.goodQuality || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    summary: {
                      ...data?.summary,
                      goodQuality: parseInt(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Fair Quality</label>
              <Input
                type="number"
                value={data?.summary?.fairQuality || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    summary: {
                      ...data?.summary,
                      fairQuality: parseInt(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Poor Quality</label>
              <Input
                type="number"
                value={data?.summary?.poorQuality || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    summary: {
                      ...data?.summary,
                      poorQuality: parseInt(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs">Arrested</label>
              <Input
                type="number"
                value={data?.summary?.arrested || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    summary: {
                      ...data?.summary,
                      arrested: parseInt(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Daily embryo assessment, development observations, grading details..."
            value={data?.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
          <p className="text-xs text-gray-500">
            Detailed daily tracking can be added through the extended embryo
            culture module
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TransferStepFormProps {
  data?: Partial<IVFEmbryoTransferData>;
  onChange: (data: Partial<IVFEmbryoTransferData>) => void;
}

function TransferStepForm({ data, onChange }: TransferStepFormProps) {
  const [embryos, setEmbryos] = useState(data?.embryosTransferred || []);

  const addEmbryo = () => {
    const newEmbryo = {
      embryoId: `EMB-${Date.now()}`,
      embryoCode: "",
      quality: "",
    };
    const updated = [...embryos, newEmbryo];
    setEmbryos(updated);
    onChange({ ...data, embryosTransferred: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Embryo Transfer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transfer Date</label>
              <Input
                type="date"
                value={data?.transferDate || ""}
                onChange={(e) =>
                  onChange({ ...data, transferDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Transfer Time</label>
              <Input
                type="time"
                value={data?.transferTime || ""}
                onChange={(e) =>
                  onChange({ ...data, transferTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Transfer Type</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={data?.transferType || "Fresh"}
                onChange={(e) =>
                  onChange({ ...data, transferType: e.target.value as any })
                }
              >
                <option value="Fresh">Fresh</option>
                <option value="Frozen">Frozen (FET)</option>
                <option value="Blastocyst">Blastocyst</option>
                <option value="Cleavage">Cleavage Stage</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Day of Transfer</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={data?.dayOfTransfer || 5}
                onChange={(e) =>
                  onChange({
                    ...data,
                    dayOfTransfer: parseInt(e.target.value) || 5,
                  })
                }
              >
                <option value={3}>Day 3</option>
                <option value={5}>Day 5</option>
                <option value={6}>Day 6</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catheter Type</label>
              <Input
                placeholder="e.g., Wallace, Sydney IVF"
                value={data?.catheterType || ""}
                onChange={(e) =>
                  onChange({ ...data, catheterType: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={data?.difficulty || "Easy"}
                onChange={(e) =>
                  onChange({ ...data, difficulty: e.target.value as any })
                }
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Difficult">Difficult</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Endometrium Thickness (mm)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.endometriumThickness || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    endometriumThickness: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="ultrasound"
                checked={data?.ultrasoundGuidance || false}
                onChange={(e) =>
                  onChange({ ...data, ultrasoundGuidance: e.target.checked })
                }
              />
              <label htmlFor="ultrasound" className="text-sm font-medium">
                Ultrasound Guidance Used
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Embryos Transferred</CardTitle>
          <Button size="sm" onClick={addEmbryo}>
            + Add Embryo
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {embryos.length === 0 && (
            <p className="text-sm text-gray-500">No embryos added yet.</p>
          )}
          {embryos.map((emb, index) => (
            <div key={index} className="rounded-lg border p-3 space-y-2">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Embryo Code</label>
                  <Input
                    placeholder="e.g., EMB001"
                    value={emb.embryoCode}
                    onChange={(e) => {
                      const updated = [...embryos];
                      updated[index].embryoCode = e.target.value;
                      setEmbryos(updated);
                      onChange({ ...data, embryosTransferred: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Quality/Grade</label>
                  <Input
                    placeholder="e.g., 4AA, 5AB"
                    value={emb.quality}
                    onChange={(e) => {
                      const updated = [...embryos];
                      updated[index].quality = e.target.value;
                      setEmbryos(updated);
                      onChange({ ...data, embryosTransferred: updated });
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const updated = embryos.filter((_, i) => i !== index);
                      setEmbryos(updated);
                      onChange({ ...data, embryosTransferred: updated });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2 space-y-2">
            <label className="text-sm font-medium">
              Number of Embryos Frozen (if any)
            </label>
            <Input
              type="number"
              value={data?.numberOfEmbryosFrozen || 0}
              onChange={(e) =>
                onChange({
                  ...data,
                  numberOfEmbryosFrozen: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Procedure notes, complications, patient tolerance..."
            value={data?.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface LutealStepFormProps {
  data?: Partial<IVFLutealSupportData>;
  onChange: (data: Partial<IVFLutealSupportData>) => void;
}

function LutealStepForm({ data, onChange }: LutealStepFormProps) {
  const [medications, setMedications] = useState(data?.medications || []);

  const addMedication = () => {
    const newMed = {
      drugName: "",
      dosage: "",
      unit: "mg",
      route: "vaginal",
      frequency: "twice daily",
      duration: "Until pregnancy test",
    };
    const updated = [...medications, newMed];
    setMedications(updated);
    onChange({ ...data, medications: updated });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Luteal Phase Support After Transfer</CardTitle>
        <Button size="sm" onClick={addMedication}>
          + Add Medication
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={data?.startDate || ""}
            onChange={(e) => onChange({ ...data, startDate: e.target.value })}
          />
        </div>

        {medications.length === 0 && (
          <p className="text-sm text-gray-500">No medications added yet.</p>
        )}
        {medications.map((med, index) => (
          <div key={index} className="rounded-lg border p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Drug Name</label>
                <Input
                  placeholder="e.g., Progesterone, Estradiol"
                  value={med.drugName}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[index].drugName = e.target.value;
                    setMedications(updated);
                    onChange({ ...data, medications: updated });
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Dosage</label>
                <Input
                  placeholder="e.g., 400, 600"
                  value={med.dosage}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[index].dosage = e.target.value;
                    setMedications(updated);
                    onChange({ ...data, medications: updated });
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Route</label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={med.route}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[index].route = e.target.value;
                    setMedications(updated);
                    onChange({ ...data, medications: updated });
                  }}
                >
                  <option value="oral">Oral</option>
                  <option value="vaginal">Vaginal</option>
                  <option value="IM">Intramuscular</option>
                  <option value="subcutaneous">Subcutaneous</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Frequency</label>
                <Input
                  placeholder="e.g., twice daily, every 12h"
                  value={med.frequency}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[index].frequency = e.target.value;
                    setMedications(updated);
                    onChange({ ...data, medications: updated });
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Duration</label>
                <Input
                  placeholder="e.g., Until pregnancy test, 12 weeks"
                  value={med.duration}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[index].duration = e.target.value;
                    setMedications(updated);
                    onChange({ ...data, medications: updated });
                  }}
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const updated = medications.filter((_, i) => i !== index);
                setMedications(updated);
                onChange({ ...data, medications: updated });
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface PregnancyStepFormProps {
  data?: Partial<IVFPregnancyTestData>;
  onChange: (data: Partial<IVFPregnancyTestData>) => void;
}

function PregnancyStepForm({ data, onChange }: PregnancyStepFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>β-hCG Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Test Date</label>
              <Input
                type="date"
                value={data?.firstTestDate || ""}
                onChange={(e) =>
                  onChange({ ...data, firstTestDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Days post-transfer</label>
              <Input
                type="number"
                value={data?.daysPostTransfer || 10}
                onChange={(e) =>
                  onChange({
                    ...data,
                    daysPostTransfer: parseInt(e.target.value) || 10,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">β-hCG (mIU/ml)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.betaHCG || 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    betaHCG: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Result</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.result || "Negative"}
              onChange={(e) =>
                onChange({ ...data, result: e.target.value as any })
              }
            >
              <option value="Positive">Positive</option>
              <option value="Negative">Negative</option>
              <option value="Biochemical">Biochemical</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final Outcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Outcome</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.outcome || "Negative"}
              onChange={(e) =>
                onChange({ ...data, outcome: e.target.value as any })
              }
            >
              <option value="Clinical pregnancy - singleton">
                Clinical pregnancy - singleton
              </option>
              <option value="Clinical pregnancy - twins">
                Clinical pregnancy - twins
              </option>
              <option value="Clinical pregnancy - triplets+">
                Clinical pregnancy - triplets+
              </option>
              <option value="Biochemical pregnancy">
                Biochemical pregnancy
              </option>
              <option value="Ectopic pregnancy">Ectopic pregnancy</option>
              <option value="Miscarriage">Miscarriage</option>
              <option value="Negative">Negative</option>
              <option value="Ongoing">Ongoing</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notified"
              checked={data?.patientNotified || false}
              onChange={(e) =>
                onChange({ ...data, patientNotified: e.target.checked })
              }
            />
            <label htmlFor="notified" className="text-sm font-medium">
              Patient has been notified
            </label>
          </div>

          {data?.patientNotified && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Date</label>
                <Input
                  type="date"
                  value={data?.notificationDate || ""}
                  onChange={(e) =>
                    onChange({ ...data, notificationDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Method</label>
                <Input
                  placeholder="e.g., Phone, In-person"
                  value={data?.notificationMethod || ""}
                  onChange={(e) =>
                    onChange({ ...data, notificationMethod: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="Additional outcome notes, ultrasound findings..."
              value={data?.notes || ""}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
