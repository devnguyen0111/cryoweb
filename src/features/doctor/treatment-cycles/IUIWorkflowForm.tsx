/**
 * IUI Workflow Form Component
 * Comprehensive form for tracking IUI treatment cycle
 */

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import type {
  IUIWorkflowData,
  IUIStimulationData,
  IUISpermPreparationData,
  IUIInseminationData,
  IUILutealSupportData,
  IUIPregnancyTestData,
} from "@/types/treatment-workflow";

interface IUIWorkflowFormProps {
  cycleId: string;
  patientId: string;
  treatmentId: string;
  initialData?: Partial<IUIWorkflowData>;
  onSave: (data: IUIWorkflowData) => Promise<void>;
  onComplete: (data: IUIWorkflowData) => Promise<void>;
}

type WorkflowStep =
  | "timeline"
  | "stimulation"
  | "spermPreparation"
  | "insemination"
  | "lutealSupport"
  | "pregnancyTest";

const STEP_LABELS: Record<WorkflowStep, string> = {
  timeline: "Timeline & Overview",
  stimulation: "1. Gây rụng trứng",
  spermPreparation: "2. Chuẩn bị tinh trùng",
  insemination: "3. Bơm IUI",
  lutealSupport: "4. Hỗ trợ hoàng thể",
  pregnancyTest: "5. Test thai",
};

const STEP_DESCRIPTIONS: Record<WorkflowStep, string> = {
  timeline:
    "Standard IUI timeline: D2-3 tests → D9-12 ultrasound → hCG trigger → 34-36h IUI → +14 days β-hCG test",
  stimulation:
    "Track medications, dosage, and ultrasound findings (follicles, endometrium)",
  spermPreparation:
    "Document sperm density, PR%, viability, morphology before & after processing",
  insemination:
    "Record procedure details: date/time, performer, method, complications",
  lutealSupport: "Document luteal phase support medications",
  pregnancyTest: "β-hCG results and patient notification",
};

export function IUIWorkflowForm({
  cycleId,
  patientId,
  treatmentId,
  initialData,
  onSave,
  onComplete,
}: IUIWorkflowFormProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("timeline");
  const [workflowData, setWorkflowData] = useState<Partial<IUIWorkflowData>>(
    initialData || {
      cycleId,
      patientId,
      treatmentId,
      startDate: new Date().toISOString().split("T")[0],
      currentStatus: "Planned",
      timeline: {},
      stimulation: {
        medications: [],
        ultrasoundResults: [],
      },
      spermPreparation: {
        collectionDate: "",
        collectionTime: "",
        beforeProcessing: {
          volume: 0,
          concentration: 0,
          totalCount: 0,
          progressiveMotility: 0,
          totalMotility: 0,
          viability: 0,
          normalMorphology: 0,
        },
        processingMethod: "",
        afterProcessing: {
          volume: 0,
          concentration: 0,
          totalCount: 0,
          progressiveMotility: 0,
          totalMotility: 0,
          viability: 0,
          normalMorphology: 0,
        },
      },
      insemination: {
        procedureDate: "",
        procedureTime: "",
        hoursAfterTrigger: 36,
        performedBy: {
          doctorId: "",
          doctorName: "",
        },
        catheterType: "",
        placementLocation: "Intrauterine",
      },
      lutealSupport: {
        medications: [],
      },
      pregnancyTest: {
        testDate: "",
        daysPostIUI: 14,
        betaHCG: 0,
        result: "Negative",
        patientNotified: false,
        outcome: "Negative",
      },
    }
  );

  const [isSaving, setIsSaving] = useState(false);

  const steps: WorkflowStep[] = [
    "timeline",
    "stimulation",
    "spermPreparation",
    "insemination",
    "lutealSupport",
    "pregnancyTest",
  ];

  const currentStepIndex = steps.indexOf(currentStep);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(workflowData as IUIWorkflowData);
      toast.success("Workflow data saved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save workflow data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSaving(true);
      const completedData: IUIWorkflowData = {
        ...workflowData,
        completionDate: new Date().toISOString(),
        currentStatus:
          workflowData.pregnancyTest?.result === "Positive" ? "Preg+" : "Preg-",
      } as IUIWorkflowData;

      await onComplete(completedData);
      toast.success("IUI cycle completed");
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
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>IUI Workflow Progress</CardTitle>
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

      {/* Timeline Step */}
      {currentStep === "timeline" && (
        <TimelineStepForm
          data={workflowData.timeline || {}}
          onChange={(timeline) =>
            setWorkflowData({ ...workflowData, timeline })
          }
        />
      )}

      {/* Stimulation Step */}
      {currentStep === "stimulation" && (
        <StimulationStepForm
          data={workflowData.stimulation}
          onChange={(stimulation) =>
            setWorkflowData({
              ...workflowData,
              stimulation: stimulation as IUIStimulationData,
            })
          }
        />
      )}

      {/* Sperm Preparation Step */}
      {currentStep === "spermPreparation" && (
        <SpermPreparationStepForm
          data={workflowData.spermPreparation}
          onChange={(spermPreparation) =>
            setWorkflowData({
              ...workflowData,
              spermPreparation: spermPreparation as IUISpermPreparationData,
            })
          }
        />
      )}

      {/* Insemination Step */}
      {currentStep === "insemination" && (
        <InseminationStepForm
          data={workflowData.insemination}
          onChange={(insemination) =>
            setWorkflowData({
              ...workflowData,
              insemination: insemination as IUIInseminationData,
            })
          }
        />
      )}

      {/* Luteal Support Step */}
      {currentStep === "lutealSupport" && (
        <LutealSupportStepForm
          data={workflowData.lutealSupport}
          onChange={(lutealSupport) =>
            setWorkflowData({
              ...workflowData,
              lutealSupport: lutealSupport as IUILutealSupportData,
            })
          }
        />
      )}

      {/* Pregnancy Test Step */}
      {currentStep === "pregnancyTest" && (
        <PregnancyTestStepForm
          data={workflowData.pregnancyTest}
          onChange={(pregnancyTest) =>
            setWorkflowData({
              ...workflowData,
              pregnancyTest: pregnancyTest as IUIPregnancyTestData,
            })
          }
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrevious}
          disabled={currentStepIndex === 0 || isSaving}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Progress"}
          </Button>

          {currentStepIndex === steps.length - 1 ? (
            <Button onClick={handleComplete} disabled={isSaving}>
              Complete IUI Cycle
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
// Step Components
// ============================================================================

interface TimelineStepFormProps {
  data: Partial<IUIWorkflowData["timeline"]>;
  onChange: (data: any) => void;
}

function TimelineStepForm({ data, onChange }: TimelineStepFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IUI Timeline</CardTitle>
        <p className="text-sm text-gray-600">
          Standard timeline: D2-3 xét nghiệm → D9-12 siêu âm → tiêm hCG → 34-36h
          thực hiện IUI → +14 ngày β-hCG
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">D2-3 Tests Date</label>
            <Input
              type="date"
              value={data.day2to3Tests || ""}
              onChange={(e) =>
                onChange({ ...data, day2to3Tests: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">D9-12 Ultrasound Date</label>
            <Input
              type="date"
              value={data.day9to12Ultrasound || ""}
              onChange={(e) =>
                onChange({ ...data, day9to12Ultrasound: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Trigger Injection Date
            </label>
            <Input
              type="date"
              value={data.triggerInjection || ""}
              onChange={(e) =>
                onChange({ ...data, triggerInjection: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">IUI Procedure Date</label>
            <Input
              type="date"
              value={data.iuiProcedure || ""}
              onChange={(e) =>
                onChange({ ...data, iuiProcedure: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pregnancy Test Date</label>
            <Input
              type="date"
              value={data.pregnancyTest || ""}
              onChange={(e) =>
                onChange({ ...data, pregnancyTest: e.target.value })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StimulationStepFormProps {
  data?: Partial<IUIStimulationData>;
  onChange: (data: Partial<IUIStimulationData>) => void;
}

function StimulationStepForm({ data, onChange }: StimulationStepFormProps) {
  const [medications, setMedications] = useState(data?.medications || []);
  const [ultrasounds, setUltrasounds] = useState(data?.ultrasoundResults || []);

  const addMedication = () => {
    const newMed = {
      drugName: "",
      dosage: "",
      unit: "IU",
      startDate: new Date().toISOString().split("T")[0],
      route: "injection",
      notes: "",
    };
    const updated = [...medications, newMed];
    setMedications(updated);
    onChange({ ...data, medications: updated });
  };

  const addUltrasound = () => {
    const newUS = {
      date: new Date().toISOString().split("T")[0],
      day: 0,
      follicles: { right: 0, left: 0, dominantSize: 0, dominantCount: 0 },
      endometriumThickness: 0,
      endometriumPattern: "",
      notes: "",
    };
    const updated = [...ultrasounds, newUS];
    setUltrasounds(updated);
    onChange({ ...data, ultrasoundResults: updated });
  };

  return (
    <div className="space-y-6">
      {/* Medications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Thuốc kích thích / Gây rụng trứng</CardTitle>
            <p className="text-sm text-gray-600">
              Document all medications, dosages, and administration routes
            </p>
          </div>
          <Button size="sm" onClick={addMedication}>
            + Add Medication
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.length === 0 && (
            <p className="text-sm text-gray-500">
              No medications added yet. Click "Add Medication" to start.
            </p>
          )}
          {medications.map((med, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Drug Name</label>
                  <Input
                    placeholder="e.g., Letrozole, Clomiphene"
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
                    placeholder="e.g., 2.5, 50, 75"
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
                    <option value="mg">mg</option>
                    <option value="IU">IU</option>
                    <option value="ml">ml</option>
                    <option value="mcg">mcg</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
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
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Date</label>
                  <Input
                    type="date"
                    value={med.endDate || ""}
                    onChange={(e) => {
                      const updated = [...medications];
                      updated[index].endDate = e.target.value;
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
                    <option value="injection">Injection (SC/IM)</option>
                    <option value="vaginal">Vaginal</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Notes</label>
                <Input
                  placeholder="Any special instructions or observations"
                  value={med.notes || ""}
                  onChange={(e) => {
                    const updated = [...medications];
                    updated[index].notes = e.target.value;
                    setMedications(updated);
                    onChange({ ...data, medications: updated });
                  }}
                />
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

      {/* Ultrasound Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Kết quả siêu âm</CardTitle>
            <p className="text-sm text-gray-600">
              Track follicle development and endometrial thickness
            </p>
          </div>
          <Button size="sm" onClick={addUltrasound}>
            + Add Ultrasound
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {ultrasounds.length === 0 && (
            <p className="text-sm text-gray-500">
              No ultrasound results yet. Click "Add Ultrasound" to start.
            </p>
          )}
          {ultrasounds.map((us, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Date</label>
                  <Input
                    type="date"
                    value={us.date}
                    onChange={(e) => {
                      const updated = [...ultrasounds];
                      updated[index].date = e.target.value;
                      setUltrasounds(updated);
                      onChange({ ...data, ultrasoundResults: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Cycle Day</label>
                  <Input
                    type="number"
                    placeholder="e.g., D3, D10"
                    value={us.day || ""}
                    onChange={(e) => {
                      const updated = [...ultrasounds];
                      updated[index].day = parseInt(e.target.value) || 0;
                      setUltrasounds(updated);
                      onChange({ ...data, ultrasoundResults: updated });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Follicles</label>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <label className="text-xs">Right ovary</label>
                    <Input
                      type="number"
                      placeholder="Count"
                      value={us.follicles.right || ""}
                      onChange={(e) => {
                        const updated = [...ultrasounds];
                        updated[index].follicles.right =
                          parseInt(e.target.value) || 0;
                        setUltrasounds(updated);
                        onChange({ ...data, ultrasoundResults: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Left ovary</label>
                    <Input
                      type="number"
                      placeholder="Count"
                      value={us.follicles.left || ""}
                      onChange={(e) => {
                        const updated = [...ultrasounds];
                        updated[index].follicles.left =
                          parseInt(e.target.value) || 0;
                        setUltrasounds(updated);
                        onChange({ ...data, ultrasoundResults: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Dominant size (mm)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 18"
                      value={us.follicles.dominantSize || ""}
                      onChange={(e) => {
                        const updated = [...ultrasounds];
                        updated[index].follicles.dominantSize =
                          parseInt(e.target.value) || 0;
                        setUltrasounds(updated);
                        onChange({ ...data, ultrasoundResults: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Dominant count</label>
                    <Input
                      type="number"
                      placeholder="e.g., 1-2"
                      value={us.follicles.dominantCount || ""}
                      onChange={(e) => {
                        const updated = [...ultrasounds];
                        updated[index].follicles.dominantCount =
                          parseInt(e.target.value) || 0;
                        setUltrasounds(updated);
                        onChange({ ...data, ultrasoundResults: updated });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Endometrium thickness (mm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 8.5"
                    value={us.endometriumThickness || ""}
                    onChange={(e) => {
                      const updated = [...ultrasounds];
                      updated[index].endometriumThickness =
                        parseFloat(e.target.value) || 0;
                      setUltrasounds(updated);
                      onChange({ ...data, ultrasoundResults: updated });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    Endometrium pattern
                  </label>
                  <Input
                    placeholder="e.g., trilaminar, homogeneous"
                    value={us.endometriumPattern || ""}
                    onChange={(e) => {
                      const updated = [...ultrasounds];
                      updated[index].endometriumPattern = e.target.value;
                      setUltrasounds(updated);
                      onChange({ ...data, ultrasoundResults: updated });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Notes</label>
                <Input
                  placeholder="Additional findings"
                  value={us.notes || ""}
                  onChange={(e) => {
                    const updated = [...ultrasounds];
                    updated[index].notes = e.target.value;
                    setUltrasounds(updated);
                    onChange({ ...data, ultrasoundResults: updated });
                  }}
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const updated = ultrasounds.filter((_, i) => i !== index);
                  setUltrasounds(updated);
                  onChange({ ...data, ultrasoundResults: updated });
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
          <CardTitle>Trigger Shot (hCG)</CardTitle>
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
                placeholder="e.g., Ovidrel, Pregnyl, Novarel"
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

// Continuing with more step components...
// (Due to length, I'll create the remaining step components in the next part)

interface SpermPreparationStepFormProps {
  data?: Partial<IUISpermPreparationData>;
  onChange: (data: Partial<IUISpermPreparationData>) => void;
}

function SpermPreparationStepForm({
  data,
  onChange,
}: SpermPreparationStepFormProps) {
  return (
    <div className="space-y-6">
      {/* Collection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection Time</label>
              <Input
                type="time"
                value={data?.collectionTime || ""}
                onChange={(e) =>
                  onChange({ ...data, collectionTime: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before Processing */}
      <Card>
        <CardHeader>
          <CardTitle>Trước lọc (Raw Semen Analysis)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Volume (ml)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.volume || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      volume: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Concentration (M/ml)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.concentration || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      concentration: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Count (M)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.totalCount || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      totalCount: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Progressive Motility (PR%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.progressiveMotility || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      progressiveMotility: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Motility (%)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.totalMotility || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      totalMotility: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Viability (%)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.viability || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      viability: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Normal Morphology (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.beforeProcessing?.normalMorphology || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beforeProcessing: {
                      ...data?.beforeProcessing,
                      normalMorphology: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Method */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Method</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.processingMethod || ""}
              onChange={(e) =>
                onChange({ ...data, processingMethod: e.target.value })
              }
            >
              <option value="">Select method</option>
              <option value="Swim-up">Swim-up</option>
              <option value="Density Gradient">Density Gradient</option>
              <option value="Simple Wash">Simple Wash</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* After Processing */}
      <Card>
        <CardHeader>
          <CardTitle>Sau lọc (Post-Processing)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Volume (ml)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.volume || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      volume: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Concentration (M/ml)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.concentration || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      concentration: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Count (M)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.totalCount || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      totalCount: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Progressive Motility (PR%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.progressiveMotility || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      progressiveMotility: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Motility (%)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.totalMotility || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      totalMotility: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Viability (%)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.viability || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      viability: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Normal Morphology (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={data?.afterProcessing?.normalMorphology || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    afterProcessing: {
                      ...data?.afterProcessing,
                      normalMorphology: parseFloat(e.target.value) || 0,
                    } as any,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Any additional observations or comments..."
            value={data?.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// I'll create the remaining step components in a follow-up file due to length
// For now, let's create placeholder components

interface InseminationStepFormProps {
  data?: Partial<IUIInseminationData>;
  onChange: (data: Partial<IUIInseminationData>) => void;
}

function InseminationStepForm({ data, onChange }: InseminationStepFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IUI Procedure Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Catheter Type</label>
            <Input
              placeholder="e.g., Tom Cat, Rocket"
              value={data?.catheterType || ""}
              onChange={(e) =>
                onChange({ ...data, catheterType: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Placement Location</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.placementLocation || "Intrauterine"}
              onChange={(e) =>
                onChange({
                  ...data,
                  placementLocation: e.target.value as any,
                })
              }
            >
              <option value="Intrauterine">Intrauterine</option>
              <option value="Intracervical">Intracervical</option>
            </select>
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
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Procedure notes, complications, patient tolerance..."
            value={data?.notes || ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface LutealSupportStepFormProps {
  data?: Partial<IUILutealSupportData>;
  onChange: (data: Partial<IUILutealSupportData>) => void;
}

function LutealSupportStepForm({ data, onChange }: LutealSupportStepFormProps) {
  const [medications, setMedications] = useState(data?.medications || []);

  const addMedication = () => {
    const newMed = {
      drugName: "",
      dosage: "",
      unit: "mg",
      route: "oral",
      startDate: new Date().toISOString().split("T")[0],
      frequency: "once daily",
      duration: "14 days",
    };
    const updated = [...medications, newMed];
    setMedications(updated);
    onChange({ ...data, medications: updated });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Luteal Phase Support</CardTitle>
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
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Drug Name</label>
                <Input
                  placeholder="e.g., Progesterone, Utrogestan"
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
                  placeholder="e.g., 200, 400"
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
                  <option value="IM">Intramuscular (IM)</option>
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
                  placeholder="e.g., 14 days, until pregnancy test"
                  value={med.duration || ""}
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

interface PregnancyTestStepFormProps {
  data?: Partial<IUIPregnancyTestData>;
  onChange: (data: Partial<IUIPregnancyTestData>) => void;
}

function PregnancyTestStepForm({ data, onChange }: PregnancyTestStepFormProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>β-hCG Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Date</label>
              <Input
                type="date"
                value={data?.testDate || ""}
                onChange={(e) =>
                  onChange({ ...data, testDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Days post-IUI</label>
              <Input
                type="number"
                value={data?.daysPostIUI || 14}
                onChange={(e) =>
                  onChange({
                    ...data,
                    daysPostIUI: parseInt(e.target.value) || 14,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">β-hCG (mIU/ml)</label>
              <Input
                type="number"
                step="0.1"
                value={data?.betaHCG || ""}
                onChange={(e) =>
                  onChange({
                    ...data,
                    betaHCG: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
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
          <CardTitle>Patient Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="patientNotified"
                checked={data?.patientNotified || false}
                onChange={(e) =>
                  onChange({ ...data, patientNotified: e.target.checked })
                }
              />
              <label htmlFor="patientNotified" className="text-sm font-medium">
                Patient has been notified
              </label>
            </div>
            {data?.patientNotified && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notification Date
                  </label>
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
                    placeholder="e.g., Phone, In-person, Email"
                    value={data?.notificationMethod || ""}
                    onChange={(e) =>
                      onChange({ ...data, notificationMethod: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Outcome</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={data?.outcome || "Negative"}
              onChange={(e) =>
                onChange({ ...data, outcome: e.target.value as any })
              }
            >
              <option value="Clinical pregnancy">Clinical pregnancy</option>
              <option value="Biochemical pregnancy">
                Biochemical pregnancy
              </option>
              <option value="Negative">Negative</option>
              <option value="Ongoing">Ongoing</option>
            </select>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="Additional outcome notes..."
              value={data?.notes || ""}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
