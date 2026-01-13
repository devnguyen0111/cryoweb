/**
 * Treatment Plan Form Component
 * Modal form for creating and managing overall treatment roadmap for IVF/IUI
 */

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { TreatmentPlanSignature } from "./TreatmentPlanSignature";
import type { TreatmentType } from "@/api/types";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

type TreatmentPhase = {
  id: string;
  phaseName: string;
  phaseType: "IUI" | "IVF" | "Consultation" | "Monitoring" | "Other";
  startDate: string;
  endDate: string;
  description: string;
  goals: string;
  status: "Planned" | "InProgress" | "Completed" | "Cancelled";
  cycleNumber?: number;
  stepType?: string; // TreatmentStepType enum from backend (e.g., "IUI_PreCyclePreparation", "IVF_StimulationStart")
};

type TreatmentPlanFormValues = {
  planName: string;
  treatmentType: TreatmentType | "";
  patientId: string;
  startDate: string;
  estimatedDuration: string; // months
  overallGoals: string;
  phases: TreatmentPhase[];
  notes: string;
};

interface TreatmentPlanFormProps {
  treatmentId?: string;
  patientId?: string;
  treatmentType?: "IUI" | "IVF"; // Optional initial treatment type
  layout?: "page" | "modal";
  onClose?: () => void;
  onSaved?: (treatmentId: string, agreementId?: string) => void;
  showNextStep?: boolean; // Show "Next Step" button instead of/in addition to "Create Plan"
}

// IUI Step definitions (4 steps matching backend TreatmentStepType enum)
const IUI_STEP_PLAN = [
  {
    cycleNumber: 1,
    cycleName: "Initial Medical Examination",
    stepType: "IUI_PreCyclePreparation",
    expectedDurationDays: 3,
    notes: "Baseline visit, counseling, and protocol confirmation.",
  },
  {
    cycleNumber: 2,
    cycleName: "Ovarian Stimulation",
    stepType: "IUI_Day7_10_FollicleMonitoring",
    expectedDurationDays: 10,
    notes: "Stimulation with ultrasound/hormone monitoring.",
  },
  {
    cycleNumber: 3,
    cycleName: "Sperm Collection and Intrauterine Insemination",
    stepType: "IUI_Procedure",
    expectedDurationDays: 1,
    notes: "Collect sample and perform insemination.",
  },
  {
    cycleNumber: 4,
    cycleName: "Post-Insemination Follow-Up",
    stepType: "IUI_PostIUI",
    expectedDurationDays: 14,
    notes: "Luteal support and monitoring until pregnancy test.",
  },
];

// IVF Step definitions (6 steps matching backend TreatmentStepType enum)
const IVF_STEP_PLAN = [
  {
    cycleNumber: 1,
    cycleName: "Initial Medical Examination",
    stepType: "IVF_PreCyclePreparation",
    expectedDurationDays: 3,
    notes: "Baseline evaluation, counseling, and protocol setup.",
  },
  {
    cycleNumber: 2,
    cycleName: "Ovarian Stimulation",
    stepType: "IVF_StimulationStart",
    expectedDurationDays: 10,
    notes: "Controlled ovarian stimulation with monitoring.",
  },
  {
    cycleNumber: 3,
    cycleName: "Oocyte Retrieval and Sperm Collection",
    stepType: "IVF_OPU",
    expectedDurationDays: 1,
    notes: "OPU and partner sperm collection.",
  },
  {
    cycleNumber: 4,
    cycleName: "In Vitro Fertilization",
    stepType: "IVF_Fertilization",
    expectedDurationDays: 1,
    notes: "Fertilization/ICSI in the lab.",
  },
  {
    cycleNumber: 5,
    cycleName: "Embryo Transfer",
    stepType: "IVF_EmbryoTransfer",
    expectedDurationDays: 1,
    notes: "Transfer planned per protocol.",
  },
  {
    cycleNumber: 6,
    cycleName: "Post-Transfer Follow-Up",
    stepType: "IVF_BetaHCGTest",
    expectedDurationDays: 14,
    notes: "Monitoring and pregnancy test after transfer.",
  },
];

export function TreatmentPlanForm({
  treatmentId,
  patientId,
  treatmentType: initialTreatmentType,
  layout = "modal",
  onClose,
  onSaved,
  showNextStep = false,
}: TreatmentPlanFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const doctorId = user?.id ?? null;

  const [formState, setFormState] = useState<TreatmentPlanFormValues>({
    planName: "",
    treatmentType: initialTreatmentType || "",
    patientId: patientId || "",
    startDate: new Date().toISOString().split("T")[0],
    estimatedDuration: "6",
    overallGoals: "",
    phases: [],
    notes: "",
  });

  // Patient search state
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientSelector, setShowPatientSelector] = useState(
    !formState.patientId
  );

  // Sync patientId from props to formState when it changes
  useEffect(() => {
    if (patientId && patientId !== formState.patientId) {
      setFormState((prev) => ({
        ...prev,
        patientId: patientId,
      }));
      setShowPatientSelector(false);
    }
  }, [patientId, formState.patientId]);

  // Pre-load all patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: async () => {
      return await api.patient.getPatients({
        pageSize: 100, // Load up to 100 patients initially
      });
    },
    enabled: showPatientSelector,
  });

  // Filter patients by patientCode search (client-side filtering)
  const filteredPatients = useMemo(() => {
    if (!patientsData?.data) return [];
    if (!patientSearch.trim()) return patientsData.data;

    const searchLower = patientSearch.toLowerCase().trim();
    return patientsData.data.filter((patient: any) => {
      const patientCode = patient.patientCode?.toLowerCase() || "";
      const fullName = getFullNameFromObject(patient)?.toLowerCase() || "";
      return (
        patientCode.includes(searchLower) || fullName.includes(searchLower)
      );
    });
  }, [patientsData?.data, patientSearch]);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [createdTreatmentId, setCreatedTreatmentId] = useState<string | null>(
    null
  );
  const [createdAgreementId, setCreatedAgreementId] = useState<string | null>(
    null
  );

  // Fetch patient details to check gender for IVF validation
  const { data: patientDetails } = usePatientDetails(formState.patientId);

  const { data: userDetails } = useQuery({
    queryKey: ["user-details", formState.patientId],
    queryFn: async () => {
      if (!formState.patientId) return null;
      try {
        const response = await api.user.getUserDetails(formState.patientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!formState.patientId,
  });

  // Helper function to check if patient is male
  const isPatientMale = (): boolean => {
    const patientGender =
      patientDetails?.gender ||
      (userDetails?.gender !== undefined
        ? userDetails.gender
          ? "Male"
          : "Female"
        : null);

    return patientGender === "Male";
  };

  // Load existing treatment if treatmentId provided
  const { data: existingTreatment } = useQuery({
    queryKey: ["treatment", treatmentId],
    enabled: !!treatmentId,
    queryFn: async () => {
      if (!treatmentId) return null;
      const response = await api.treatment.getTreatmentById(treatmentId);
      return response.data;
    },
  });

  // Initialize form with existing treatment data
  useMemo(() => {
    if (existingTreatment) {
      setFormState((prev) => ({
        ...prev,
        planName: existingTreatment.treatmentCode || "",
        treatmentType: existingTreatment.treatmentType || "",
        patientId: existingTreatment.patientId || patientId || "",
        startDate: existingTreatment.startDate
          ? new Date(existingTreatment.startDate).toISOString().split("T")[0]
          : prev.startDate,
        overallGoals: "",
        notes: existingTreatment.notes || "",
      }));
    }
  }, [existingTreatment, patientId]);

  const addPhase = () => {
    const newPhase: TreatmentPhase = {
      id: `phase-${Date.now()}`,
      phaseName: "",
      phaseType: formState.treatmentType === "IUI" ? "IUI" : "IVF",
      startDate: formState.startDate,
      endDate: "",
      description: "",
      goals: "",
      status: "Planned",
      cycleNumber: formState.phases.length + 1,
    };
    setFormState((prev) => ({
      ...prev,
      phases: [...prev.phases, newPhase],
    }));
  };

  const removePhase = (phaseId: string) => {
    setFormState((prev) => ({
      ...prev,
      phases: prev.phases.filter((p) => p.id !== phaseId),
    }));
  };

  const updatePhase = (phaseId: string, updates: Partial<TreatmentPhase>) => {
    setFormState((prev) => ({
      ...prev,
      phases: prev.phases.map((p) =>
        p.id === phaseId ? { ...p, ...updates } : p
      ),
    }));
  };

  const createTreatmentMutation = useMutation({
    mutationFn: async (data: TreatmentPlanFormValues) => {
      if (!doctorId || !data.patientId) {
        throw new Error("Doctor ID and Patient ID are required");
      }

      // Validate: IVF treatment can only be created for female patients
      if (data.treatmentType === "IVF") {
        // Fetch patient details to verify gender
        try {
          const patientResponse = await api.patient.getPatientDetails(
            data.patientId
          );
          const patientData = patientResponse.data;
          const userResponse = await api.user.getUserDetails(data.patientId);
          const userData = userResponse.data;

          const patientGender =
            patientData?.gender ||
            (userData?.gender !== undefined
              ? userData.gender
                ? "Male"
                : "Female"
              : null);

          if (patientGender === "Male") {
            throw new Error(
              "IVF treatment can only be created for female patients. Male patients are not eligible for IVF treatment."
            );
          }
        } catch (error: any) {
          // If it's our validation error, re-throw it
          if (error?.message?.includes("IVF treatment can only be created")) {
            throw error;
          }
          // Otherwise, log and continue (patient data might not be available, but frontend validation should catch it)
          console.warn("Could not verify patient gender:", error);
        }
      }

      // Create main treatment record
      // POST /api/treatment
      const startDate = new Date(`${data.startDate}T00:00:00`).toISOString();
      const endDate = data.estimatedDuration
        ? new Date(
            new Date(startDate).setDate(
              new Date(startDate).getDate() + parseInt(data.estimatedDuration)
            )
          ).toISOString()
        : undefined;

      // Prepare notes with signature data
      // For IUI/IVF, automatically pre-sign as doctor when creating the plan
      // Truncate additionalNotes if too long to prevent issues
      const maxNoteLength = 5000; // Maximum length for additional notes
      const maxDescriptionLength = 200; // Maximum length for phase description (1-2 lines)
      const maxGoalsLength = 200; // Maximum length for phase goals (1-2 lines)
      const truncatedNotes =
        data.notes && data.notes.length > maxNoteLength
          ? data.notes.substring(0, maxNoteLength) + "..."
          : data.notes;

      // Truncate phases description and goals to keep notes concise
      const optimizedPhases = data.phases.map((phase: any) => ({
        ...phase,
        description:
          phase.description && phase.description.length > maxDescriptionLength
            ? phase.description.substring(0, maxDescriptionLength) + "..."
            : phase.description,
        goals:
          phase.goals && phase.goals.length > maxGoalsLength
            ? phase.goals.substring(0, maxGoalsLength) + "..."
            : phase.goals,
      }));

      const notesData: any = {
        estimatedDuration: data.estimatedDuration,
        phases: optimizedPhases,
        additionalNotes: truncatedNotes,
      };

      // Automatically pre-sign doctor's signature for IUI/IVF treatment plans
      if (data.treatmentType === "IUI" || data.treatmentType === "IVF") {
        notesData.doctorSigned = true;
        notesData.doctorSignedDate = new Date().toISOString();
        notesData.doctorSignedBy = doctorId;
        notesData.patientSigned = false; // Patient needs to sign separately
      }

      const shouldAutoCreateCycle =
        data.treatmentType === "IUI" || data.treatmentType === "IVF";

      const treatmentPayload: any = {
        patientId: data.patientId,
        doctorId: doctorId,
        treatmentName:
          data.planName || `Treatment Plan - ${data.treatmentType}`,
        treatmentType: data.treatmentType,
        startDate,
        endDate,
        status: "Planned", // Changed from "Planning" to "Planned" to match API enum
        diagnosis: data.overallGoals,
        goals: data.overallGoals,
        notes: JSON.stringify(notesData, null, 2), // Format with 2-space indentation for readability
        estimatedCost: 0,
        actualCost: 0,
        autoCreate: shouldAutoCreateCycle,
      };

      // Add IUI object if treatment type is IUI
      if (data.treatmentType === "IUI") {
        // Don't include treatmentId - it will be set by backend after creation
        // Protocol is required by backend, so we provide a default value
        treatmentPayload.iui = {
          protocol: "Standard IUI Protocol", // Required field - default value
          medications: "",
          monitoring: "",
          ovulationTriggerDate: startDate,
          inseminationDate: endDate || startDate,
          motileSpermCount: 0,
          numberOfAttempts: 0,
          outcome: "",
          notes: "",
          status: "Planned",
        };
      }

      // Add IVF object if treatment type is IVF
      if (data.treatmentType === "IVF") {
        // Don't include treatmentId - it will be set by backend after creation
        // Protocol is required by backend, so we provide a default value
        treatmentPayload.ivf = {
          protocol: "Standard IVF Protocol", // Required field - default value
          stimulationStartDate: startDate,
          oocyteRetrievalDate: startDate,
          fertilizationDate: startDate,
          transferDate: endDate || startDate,
          oocytesRetrieved: 0,
          oocytesMature: 0,
          oocytesFertilized: 0,
          embryosCultured: 0,
          embryosTransferred: 0,
          embryosCryopreserved: 0,
          embryosFrozen: 0,
          notes: "",
          outcome: "",
          complications: "",
          status: "Planned",
        };
      }

      const treatmentResponse =
        await api.treatment.createTreatment(treatmentPayload);
      const treatmentData = treatmentResponse.data;

      // Note: Backend automatically creates cycle when autoCreate=true is set in treatment payload
      // No need to manually create cycle here - it's already done by backend
      if (
        shouldAutoCreateCycle &&
        treatmentData?.id &&
        (data.treatmentType === "IUI" || data.treatmentType === "IVF")
      ) {
        // Cycle is automatically created by backend with autoCreate=true
        // Just log for debugging
        console.log(
          `Treatment ${treatmentData.id} created with autoCreate=true. Cycle should be auto-created by backend.`
        );
      }

      // For IUI/IVF treatments, create Agreement and auto-sign as doctor
      if (
        treatmentData?.id &&
        (data.treatmentType === "IUI" || data.treatmentType === "IVF")
      ) {
        // Create agreement with new API format
        const agreementResponse = await api.agreement.createAgreement({
          treatmentId: treatmentData.id,
          patientId: data.patientId,
          startDate: startDate,
          endDate: endDate,
          totalAmount: 0,
        });

        const agreementData = agreementResponse.data;

        // Auto-sign as doctor (only if not already signed)
        let finalAgreementData = agreementData;
        if (agreementData?.id && doctorId) {
          try {
            // Check if already signed before attempting to sign
            const isAlreadySigned =
              agreementData.signedByDoctor ??
              agreementData.doctorSigned ??
              false;

            if (!isAlreadySigned) {
              const signResponse = await api.agreement.signAgreement(
                agreementData.id,
                {
                  signedByDoctor: true,
                  signedByPatient: false,
                }
              );
              // Use the signed agreement data
              finalAgreementData = signResponse.data || agreementData;
            }
          } catch (error: any) {
            // If agreement is already signed, treat it as success
            if (
              error?.response?.data?.systemCode === "ALREADY_SIGNED" ||
              error?.response?.data?.message
                ?.toLowerCase()
                .includes("already signed")
            ) {
              // Agreement already signed, which is fine - continue normally
              console.log(
                "Agreement already signed by doctor, skipping auto-sign"
              );
              // Try to refetch to get the latest state
              try {
                const refetchResponse = await api.agreement.getAgreementById(
                  agreementData.id
                );
                finalAgreementData = refetchResponse.data || agreementData;
              } catch {
                // If refetch fails, use original data
                finalAgreementData = agreementData;
              }
            } else {
              // Re-throw other errors
              throw error;
            }
          }
        }

        return {
          treatment: treatmentData,
          agreement: finalAgreementData,
        };
      }

      return {
        treatment: treatmentData,
        agreement: null,
      };
    },
    onSuccess: (result) => {
      toast.success("Treatment plan created successfully!");
      queryClient.invalidateQueries({
        queryKey: ["doctor-treatments"],
      });

      // Invalidate agreement queries to ensure fresh data
      if (result.agreement?.id) {
        queryClient.invalidateQueries({
          queryKey: ["agreement", result.agreement.id],
        });
      }
      if (result.treatment?.id) {
        queryClient.invalidateQueries({
          queryKey: ["agreement", result.treatment.id],
        });
      }

      // If treatmentId was provided (updating existing), don't show signature step
      // Signature will be handled by parent component (CreateTreatmentForm)
      if (
        result.treatment?.id &&
        result.agreement?.id &&
        (result.treatment.treatmentType === "IUI" ||
          result.treatment.treatmentType === "IVF")
      ) {
        setCreatedTreatmentId(result.treatment.id);
        setCreatedAgreementId(result.agreement.id);

        // When showNextStep is true, let parent component handle navigation
        // Don't show signature step in this component
        if (showNextStep && onSaved && result.treatment.id) {
          onSaved(result.treatment.id, result.agreement?.id);
        } else if (!showNextStep && !treatmentId) {
          // Only show signature step if not in multi-step flow
          setShowSignatureStep(true);
        } else if (treatmentId) {
          // Updating existing treatment - return to parent
          if (onSaved && result.treatment.id) {
            onSaved(result.treatment.id, result.agreement?.id);
          }
        }
      } else {
        // For non-IUI/IVF treatments, proceed normally
        if (onSaved && result.treatment?.id) {
          onSaved(result.treatment.id);
        }
        if (onClose && !showNextStep) {
          onClose();
        }
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create treatment plan"
      );
    },
  });

  const updateTreatmentMutation = useMutation({
    mutationFn: async (data: TreatmentPlanFormValues) => {
      if (!treatmentId) {
        throw new Error("Treatment ID is required for update");
      }

      const startDate = new Date(`${data.startDate}T00:00:00`).toISOString();
      const endDate = data.estimatedDuration
        ? new Date(
            new Date(startDate).setDate(
              new Date(startDate).getDate() + parseInt(data.estimatedDuration)
            )
          ).toISOString()
        : undefined;

      // Truncate additionalNotes if too long to prevent issues
      const maxNoteLength = 5000; // Maximum length for additional notes
      const maxDescriptionLength = 200; // Maximum length for phase description (1-2 lines)
      const maxGoalsLength = 200; // Maximum length for phase goals (1-2 lines)
      const truncatedNotes =
        data.notes && data.notes.length > maxNoteLength
          ? data.notes.substring(0, maxNoteLength) + "..."
          : data.notes;

      // Truncate phases description and goals to keep notes concise
      const optimizedPhases = data.phases.map((phase: any) => ({
        ...phase,
        description:
          phase.description && phase.description.length > maxDescriptionLength
            ? phase.description.substring(0, maxDescriptionLength) + "..."
            : phase.description,
        goals:
          phase.goals && phase.goals.length > maxGoalsLength
            ? phase.goals.substring(0, maxGoalsLength) + "..."
            : phase.goals,
      }));

      const treatmentPayload: any = {
        treatmentName: data.planName,
        treatmentType: data.treatmentType,
        startDate,
        endDate,
        diagnosis: data.overallGoals,
        goals: data.overallGoals,
        notes: JSON.stringify(
          {
            estimatedDuration: data.estimatedDuration,
            phases: optimizedPhases,
            additionalNotes: truncatedNotes,
          },
          null,
          2
        ), // Format with 2-space indentation for readability
        // estimatedCost and actualCost can be updated separately if needed
      };

      // When updating treatment plan, we don't need to update IUI/IVF objects
      // The IUI/IVF objects are managed separately and should not be updated
      // through the treatment update endpoint unless specifically needed
      // Only update the main treatment fields (name, dates, notes, etc.)
      // IUI/IVF protocol and other fields should be updated via their specific endpoints

      const response = await api.treatment.updateTreatment(
        treatmentId,
        treatmentPayload
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Treatment plan updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["treatment", treatmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor-treatments"],
      });
      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update treatment plan"
      );
    },
  });

  // Check if form is valid and complete
  // Use useMemo to ensure validation is recalculated when formState changes
  const isFormValid = useMemo(() => {
    const hasPatientId = !!(
      formState.patientId && formState.patientId.trim() !== ""
    );
    const hasTreatmentType = !!(
      formState.treatmentType && formState.treatmentType.trim() !== ""
    );
    const hasPlanName = !!(
      formState.planName && formState.planName.trim() !== ""
    );
    const hasStartDate = !!(
      formState.startDate && formState.startDate.trim() !== ""
    );

    return hasPatientId && hasTreatmentType && hasPlanName && hasStartDate;
  }, [
    formState.patientId,
    formState.treatmentType,
    formState.planName,
    formState.startDate,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.patientId) {
      toast.error("Please select a patient");
      return;
    }

    if (!formState.treatmentType) {
      toast.error("Please select treatment type");
      return;
    }

    // Validate: IVF treatment can only be created for female patients
    if (formState.treatmentType === "IVF" && isPatientMale()) {
      toast.error(
        "IVF treatment can only be created for female patients. Male patients are not eligible for IVF treatment."
      );
      return;
    }

    if (treatmentId) {
      updateTreatmentMutation.mutate(formState);
    } else {
      createTreatmentMutation.mutate(formState);
    }
  };

  const handleNextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();

    // Validate form first
    if (!isFormValid) {
      if (!formState.patientId || formState.patientId.trim() === "") {
        toast.error("Please select a patient");
        return;
      }
      if (!formState.treatmentType || formState.treatmentType.trim() === "") {
        toast.error("Please select treatment type");
        return;
      }
      if (!formState.planName || formState.planName.trim() === "") {
        toast.error("Please enter a plan name");
        return;
      }
      if (!formState.startDate || formState.startDate.trim() === "") {
        toast.error("Please select a start date");
        return;
      }
      return;
    }

    // Validate: IVF treatment can only be created for female patients
    if (formState.treatmentType === "IVF" && isPatientMale()) {
      toast.error(
        "IVF treatment can only be created for female patients. Male patients are not eligible for IVF treatment."
      );
      return;
    }

    // If form is valid, submit it normally
    // The onSuccess callback in mutation will handle calling onSaved
    // which will trigger navigation to next step in parent component
    if (treatmentId) {
      updateTreatmentMutation.mutate(formState);
    } else {
      createTreatmentMutation.mutate(formState);
    }
  };

  // Generate plan name based on treatment type
  const generatePlanName = (treatmentType: string): string => {
    if (treatmentType === "IUI") {
      return `IUI Treatment Plan`;
    } else if (treatmentType === "IVF") {
      return `IVF Treatment Plan`;
    } else if (treatmentType === "Consultation") {
      return `Consultation Plan`;
    } else {
      return `Treatment Plan`;
    }
  };

  // Generate suggested overall goals based on treatment type
  const generateOverallGoals = (treatmentType: string): string => {
    if (treatmentType === "IUI") {
      return `Intrauterine Insemination (IUI) Treatment Goals:
- Achieve successful ovulation induction and timing
- Optimize sperm quality and motility for insemination
- Maximize chances of successful fertilization and implantation
- Monitor cycle progression and adjust protocol as needed
- Support patient through treatment cycles with appropriate care`;
    } else if (treatmentType === "IVF") {
      return `In Vitro Fertilization (IVF) Treatment Goals:
- Stimulate optimal ovarian response for egg retrieval
- Achieve successful fertilization through IVF
- Cultivate high-quality embryos for transfer
- Maximize implantation and pregnancy success rates
- Provide comprehensive monitoring and support throughout the process
- Consider cryopreservation for future cycles if applicable`;
    } else if (treatmentType === "Consultation") {
      return `Consultation and Assessment Goals:
- Comprehensive evaluation of patient's reproductive health
- Review medical history and previous treatments
- Assess fertility factors and potential challenges
- Develop personalized treatment recommendations
- Provide patient education and counseling`;
    } else {
      return `Treatment Goals:
- Assess patient condition and develop appropriate treatment plan
- Monitor progress and adjust approach as needed
- Provide comprehensive care and support`;
    }
  };

  const handleFieldChange = (
    field: keyof TreatmentPlanFormValues,
    value: any
  ) => {
    setFormState((prev) => {
      const newState = { ...prev, [field]: value };

      // Auto-generate plan name and overall goals when treatment type changes
      if (field === "treatmentType" && value) {
        // Only auto-generate if planName is empty or was previously auto-generated
        const wasAutoGenerated =
          !prev.planName ||
          prev.planName === generatePlanName(prev.treatmentType) ||
          prev.planName.startsWith("IUI Treatment Plan") ||
          prev.planName.startsWith("IVF Treatment Plan") ||
          prev.planName.startsWith("Consultation Plan") ||
          prev.planName.startsWith("Treatment Plan");

        if (wasAutoGenerated) {
          newState.planName = generatePlanName(value);
        }

        // Only auto-generate overall goals if it's empty or was previously auto-generated
        const wasGoalsAutoGenerated =
          !prev.overallGoals ||
          prev.overallGoals.includes("Treatment Goals:") ||
          prev.overallGoals.includes("IUI Treatment Goals:") ||
          prev.overallGoals.includes("IVF Treatment Goals:") ||
          prev.overallGoals.includes("Consultation and Assessment Goals:");

        if (wasGoalsAutoGenerated) {
          newState.overallGoals = generateOverallGoals(value);
        }
      }

      return newState;
    });
  };

  // Generate suggested phases based on treatment type
  const generateSuggestedPhases = () => {
    if (!formState.treatmentType) {
      toast.error("Please select treatment type first");
      return;
    }

    // Ensure planName and overallGoals are set if not already present
    const updatedPlanName =
      formState.planName && formState.planName.trim() !== ""
        ? formState.planName
        : generatePlanName(formState.treatmentType);

    const updatedOverallGoals =
      formState.overallGoals && formState.overallGoals.trim() !== ""
        ? formState.overallGoals
        : generateOverallGoals(formState.treatmentType);

    const startDate = new Date(formState.startDate);
    const suggestedPhases: TreatmentPhase[] = [];

    if (formState.treatmentType === "IUI") {
      // IUI: 4 phases (1 step = 1 phase) following standard protocol from backend
      let currentDate = new Date(startDate);

      IUI_STEP_PLAN.forEach((step, stepIndex) => {
        const phaseStart = new Date(currentDate);
        const phaseEnd = new Date(phaseStart);
        phaseEnd.setDate(phaseEnd.getDate() + step.expectedDurationDays);

        suggestedPhases.push({
          id: `phase-${Date.now()}-${stepIndex}`,
          phaseName: step.cycleName,
          phaseType: "IUI",
          startDate: phaseStart.toISOString().split("T")[0],
          endDate: phaseEnd.toISOString().split("T")[0],
          description: step.notes, // Short note from backend (1-2 lines)
          goals: step.notes, // Use same short note for goals
          status: "Planned",
          cycleNumber: step.cycleNumber, // Use cycleNumber from step plan (1-7)
          stepType: step.stepType, // Link to backend TreatmentStepType enum
        });

        // Next phase starts the day after current phase ends
        currentDate = new Date(phaseEnd);
        currentDate.setDate(currentDate.getDate() + 1);
      });
    } else if (formState.treatmentType === "IVF") {
      // IVF phases following standard 6-step protocol from backend
      let currentDate = new Date(startDate);

      IVF_STEP_PLAN.forEach((step, stepIndex) => {
        const phaseStart = new Date(currentDate);
        const phaseEnd = new Date(phaseStart);
        phaseEnd.setDate(phaseEnd.getDate() + step.expectedDurationDays);

        suggestedPhases.push({
          id: `phase-${Date.now()}-${stepIndex}`,
          phaseName: step.cycleName,
          phaseType: "IVF",
          startDate: phaseStart.toISOString().split("T")[0],
          endDate: phaseEnd.toISOString().split("T")[0],
          description: step.notes, // Short note from backend (1-2 lines)
          goals: step.notes, // Use same short note for goals
          status: "Planned",
          cycleNumber: step.cycleNumber,
          stepType: step.stepType, // Link to backend TreatmentStepType enum
        });

        // Next phase starts the day after current phase ends
        currentDate = new Date(phaseEnd);
        currentDate.setDate(currentDate.getDate() + 1);
      });
    }

    // Update form state with planName, overallGoals, and phases all at once
    setFormState((prev) => ({
      ...prev,
      planName: updatedPlanName,
      overallGoals: updatedOverallGoals,
      phases: suggestedPhases,
    }));
    toast.success("Suggested phases generated successfully!");
  };

  // If signature step is shown, render signature component
  if (showSignatureStep && createdTreatmentId && formState.treatmentType) {
    return (
      <TreatmentPlanSignature
        treatmentId={createdTreatmentId}
        patientId={formState.patientId}
        treatmentType={formState.treatmentType as "IUI" | "IVF"}
        agreementId={createdAgreementId || undefined}
        onSigned={() => {
          setShowSignatureStep(false);
          if (onSaved && createdTreatmentId) {
            onSaved(createdTreatmentId);
          }
          if (onClose) {
            onClose();
          }
        }}
        onClose={() => {
          setShowSignatureStep(false);
          if (onClose) {
            onClose();
          }
        }}
        layout={layout}
      />
    );
  }

  // Get patient name for display
  const patientName =
    getFullNameFromObject(userDetails) ||
    userDetails?.userName ||
    (isPatientDetailResponse(patientDetails)
      ? patientDetails.accountInfo?.username
      : null) ||
    getFullNameFromObject(patientDetails) ||
    "Unknown";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      {showPatientSelector ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Search Patient (by patient code or name)
              </label>
              <Input
                placeholder="Search by patient code or name..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formState.patientId}
                onChange={(e) => {
                  handleFieldChange("patientId", e.target.value);
                  if (e.target.value) {
                    const selectedPatient = filteredPatients.find(
                      (p: any) => p.id === e.target.value
                    );
                    if (selectedPatient) {
                      setShowPatientSelector(false);
                      // Reset treatment type if it was IVF and new patient is male
                      if (formState.treatmentType === "IVF") {
                        const newPatientGender =
                          selectedPatient.gender ||
                          (selectedPatient.gender === true ? "Male" : "Female");
                        if (newPatientGender === "Male") {
                          handleFieldChange("treatmentType", "");
                          toast.error(
                            "IVF treatment is not available for male patients. Please select a different treatment type."
                          );
                        }
                      }
                    }
                  }
                }}
                required
              >
                <option value="">Select a patient</option>
                {filteredPatients.map((patient: any) => {
                  // Get patient name with priority: accountInfo > patient object (like other dashboards)
                  const patientName = (() => {
                    if (!patient) return "";
                    // Try to get name from accountInfo first (if PatientDetailResponse)
                    if (
                      isPatientDetailResponse(patient) &&
                      patient.accountInfo
                    ) {
                      // accountInfo has username, not firstName/lastName, so use username directly
                      if (patient.accountInfo.username) {
                        return patient.accountInfo.username;
                      }
                    }
                    // Fallback to patient object directly
                    return getFullNameFromObject(patient);
                  })();
                  const patientCode = patient.patientCode || "";

                  // Format: "FirstName LastName (patientCode)" or just "patientCode" if no name
                  const displayText = patientName
                    ? `${patientName}${patientCode ? ` (${patientCode})` : ""}`
                    : patientCode || patient.id;

                  return (
                    <option key={patient.id} value={patient.id}>
                      {displayText}
                    </option>
                  );
                })}
              </select>
              {filteredPatients.length === 0 &&
                patientsData?.data &&
                patientsData.data.length > 0 && (
                  <p className="text-sm text-gray-500">
                    No patients found matching your search.
                  </p>
                )}
              {!patientsData?.data && (
                <p className="text-sm text-gray-500">Loading patients...</p>
              )}
            </div>

            {formState.patientId && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                ✓ Patient selected: {patientName} (
                {patientDetails?.patientCode || ""})
              </div>
            )}
          </CardContent>
        </Card>
      ) : formState.patientId ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Patient Information</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPatientSelector(true);
                setPatientSearch("");
              }}
            >
              Change Patient
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-base font-semibold">{patientName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">
                  Patient Code
                </p>
                <p className="text-base">
                  {patientDetails?.patientCode || "N/A"}
                </p>
              </div>
              {patientDetails?.nationalId && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Citizen ID Card
                  </p>
                  <p className="text-base">{patientDetails.nationalId}</p>
                </div>
              )}
              {(() => {
                const patientGender =
                  patientDetails?.gender ||
                  (userDetails?.gender !== undefined
                    ? userDetails.gender
                      ? "Male"
                      : "Female"
                    : null);
                return patientGender ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="text-base">{patientGender}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const dateOfBirth = userDetails?.dob
                  ? new Date(userDetails.dob).toLocaleDateString("vi-VN")
                  : patientDetails?.dateOfBirth
                    ? new Date(patientDetails.dateOfBirth).toLocaleDateString(
                        "vi-VN"
                      )
                    : null;
                const age = userDetails?.age ?? null;
                return dateOfBirth ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </p>
                    <p className="text-base">
                      {dateOfBirth}
                      {age && ` (${age} years old)`}
                    </p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const phone =
                  (isPatientDetailResponse(patientDetails)
                    ? patientDetails.accountInfo?.phone
                    : null) ||
                  userDetails?.phone ||
                  userDetails?.phoneNumber ||
                  patientDetails?.phoneNumber ||
                  null;
                return phone ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base">{phone}</p>
                  </div>
                ) : null;
              })()}
              {(() => {
                const email =
                  (isPatientDetailResponse(patientDetails)
                    ? patientDetails.accountInfo?.email
                    : null) ||
                  userDetails?.email ||
                  patientDetails?.email ||
                  null;
                return email ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{email}</p>
                  </div>
                ) : null;
              })()}
              {patientDetails?.bloodType && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Blood Type
                  </p>
                  <p className="text-base">{patientDetails.bloodType}</p>
                </div>
              )}
              {(() => {
                const address =
                  (isPatientDetailResponse(patientDetails)
                    ? patientDetails.accountInfo?.address
                    : null) ||
                  userDetails?.location ||
                  patientDetails?.address ||
                  null;
                return address ? (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-base">{address}</p>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Search Patient (by patient code or name)
              </label>
              <Input
                placeholder="Search by patient code or name..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Patient <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formState.patientId}
                onChange={(e) => {
                  handleFieldChange("patientId", e.target.value);
                  if (e.target.value) {
                    setShowPatientSelector(false);
                  }
                }}
                required
              >
                <option value="">Select a patient</option>
                {filteredPatients.map((patient: any) => {
                  // Get patient name with priority: accountInfo > patient object (like other dashboards)
                  const patientName = (() => {
                    if (!patient) return "";
                    // Try to get name from accountInfo first (if PatientDetailResponse)
                    if (
                      isPatientDetailResponse(patient) &&
                      patient.accountInfo
                    ) {
                      // accountInfo has username, not firstName/lastName, so use username directly
                      if (patient.accountInfo.username) {
                        return patient.accountInfo.username;
                      }
                    }
                    // Fallback to patient object directly
                    return getFullNameFromObject(patient);
                  })();
                  const patientCode = patient.patientCode || "";

                  // Format: "FirstName LastName (patientCode)" or just "patientCode" if no name
                  const displayText = patientName
                    ? `${patientName}${patientCode ? ` (${patientCode})` : ""}`
                    : patientCode || patient.id;

                  return (
                    <option key={patient.id} value={patient.id}>
                      {displayText}
                    </option>
                  );
                })}
              </select>
              {filteredPatients.length === 0 &&
                patientsData?.data &&
                patientsData.data.length > 0 && (
                  <p className="text-sm text-gray-500">
                    No patients found matching your search.
                  </p>
                )}
              {!patientsData?.data && (
                <p className="text-sm text-gray-500">Loading patients...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment Plan Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Plan Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., IVF Treatment Plan"
                value={formState.planName}
                onChange={(e) => handleFieldChange("planName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Treatment Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={formState.treatmentType}
                onChange={(e) =>
                  handleFieldChange("treatmentType", e.target.value)
                }
                required
                disabled={
                  !!(
                    formState.patientId &&
                    isPatientMale() &&
                    formState.treatmentType === "IVF"
                  )
                }
              >
                <option value="">Select type</option>
                <option
                  value="IVF"
                  disabled={!!(formState.patientId && isPatientMale())}
                >
                  IVF (In Vitro Fertilization)
                  {formState.patientId &&
                    isPatientMale() &&
                    " (Not available for male patients)"}
                </option>
                <option value="IUI">IUI (Intrauterine Insemination)</option>
                <option value="Other">Other</option>
              </select>
              {formState.patientId &&
                isPatientMale() &&
                formState.treatmentType === "IVF" && (
                  <p className="text-sm text-red-500 mt-1">
                    IVF treatment is only available for female patients.
                  </p>
                )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={formState.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Estimated Duration (months)
              </label>
              <Input
                type="number"
                min="1"
                value={formState.estimatedDuration}
                onChange={(e) =>
                  handleFieldChange("estimatedDuration", e.target.value)
                }
                placeholder="e.g., 6"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Overall Goals</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Describe the overall treatment goals and expected outcomes..."
              value={formState.overallGoals}
              onChange={(e) =>
                handleFieldChange("overallGoals", e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Treatment Phases */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Treatment Phases</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateSuggestedPhases}
              disabled={!formState.treatmentType}
            >
              Generate Suggested Phases
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPhase}
            >
              + Add Phase
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formState.phases.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No phases added yet.</p>
              <p className="text-sm mt-2">
                Click "Generate Suggested Phases" to auto-generate based on
                treatment type, or "Add Phase" to create manually.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formState.phases.map((phase, index) => (
                <Card key={phase.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Phase {index + 1}: {phase.phaseName || "Unnamed Phase"}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePhase(phase.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Phase Name
                        </label>
                        <Input
                          placeholder="e.g., IUI Cycle 1"
                          value={phase.phaseName}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              phaseName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Phase Type
                        </label>
                        <select
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={phase.phaseType}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              phaseType: e.target.value as any,
                            })
                          }
                        >
                          <option value="IUI">IUI</option>
                          <option value="IVF">IVF</option>
                          <option value="Consultation">Consultation</option>
                          <option value="Monitoring">Monitoring</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={phase.startDate}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">End Date</label>
                        <Input
                          type="date"
                          value={phase.endDate}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-medium">
                          Description
                        </label>
                        <Input
                          placeholder="Brief description of this phase..."
                          value={phase.description}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-medium">Goals</label>
                        <textarea
                          className="min-h-[60px] w-full rounded-md border px-2 py-1 text-sm"
                          placeholder="Specific goals for this phase..."
                          value={phase.goals}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              goals: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Status</label>
                        <select
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={phase.status}
                          onChange={(e) =>
                            updatePhase(phase.id, {
                              status: e.target.value as any,
                            })
                          }
                        >
                          <option value="Planned">Planned</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Any additional notes, considerations, or special instructions..."
            value={formState.notes}
            onChange={(e) => handleFieldChange("notes", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {layout === "modal" && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        {showNextStep ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit}
              disabled={
                createTreatmentMutation.isPending ||
                updateTreatmentMutation.isPending ||
                !isFormValid
              }
            >
              {createTreatmentMutation.isPending ||
              updateTreatmentMutation.isPending
                ? "Saving..."
                : treatmentId
                  ? "Save Plan"
                  : "Save Plan"}
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={
                createTreatmentMutation.isPending ||
                updateTreatmentMutation.isPending ||
                !isFormValid
              }
            >
              {createTreatmentMutation.isPending ||
              updateTreatmentMutation.isPending
                ? "Processing..."
                : "Next Step"}
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            disabled={
              createTreatmentMutation.isPending ||
              updateTreatmentMutation.isPending ||
              !formState.patientId ||
              !formState.treatmentType
            }
          >
            {createTreatmentMutation.isPending ||
            updateTreatmentMutation.isPending
              ? "Saving..."
              : treatmentId
                ? "Update Plan"
                : "Create Plan"}
          </Button>
        )}
      </div>
    </form>
  );
}
