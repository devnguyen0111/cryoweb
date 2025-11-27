/**
 * Create Encounter Form Component
 * Reusable form for creating encounters, can be used in modal or page
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { TreatmentPlanForm } from "@/features/doctor/treatment-cycles/TreatmentPlanForm";
import { TreatmentPlanSignature } from "@/features/doctor/treatment-cycles/TreatmentPlanSignature";
import type { TreatmentType } from "@/api/types";

type EncounterFormValues = {
  visitDate: string;
  treatmentType: TreatmentType;
  chiefComplaint: string;
  history: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
  };
  physicalExam: string;
  notes: string;
  // IUI fields
  iuiProtocol?: string;
  iuiProtocolOther?: string;
  iuiMedications?: string;
  iuiMonitoring?: string;
  // IVF fields
  ivfProtocol?: string;
  ivfProtocolOther?: string;
};

interface CreateEncounterFormProps {
  layout?: "page" | "modal";
  defaultPatientId?: string;
  defaultAppointmentId?: string;
  initialTreatmentType?: "IUI" | "IVF"; // If provided, start with Treatment Plan form
  startWithPlan?: boolean; // If true, start with Treatment Plan form (for IUI/IVF)
  onClose?: () => void;
  onCreated?: (encounterId: string) => void;
}

export function CreateEncounterForm({
  layout = "modal",
  defaultPatientId,
  defaultAppointmentId,
  initialTreatmentType,
  startWithPlan = false,
  onClose,
  onCreated,
}: CreateEncounterFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(
    defaultPatientId || ""
  );
  // Step management for IUI/IVF: plan -> signature -> encounter
  // If initialTreatmentType or startWithPlan is provided, start with "plan", otherwise start with "encounter"
  const [currentStep, setCurrentStep] = useState<
    "encounter" | "plan" | "signature"
  >(initialTreatmentType || startWithPlan ? "plan" : "encounter");
  const [planTreatmentType, setPlanTreatmentType] = useState<
    "IUI" | "IVF" | null
  >(initialTreatmentType || null);
  const [createdTreatmentId, setCreatedTreatmentId] = useState<string | null>(
    null
  );
  const [createdAgreementId, setCreatedAgreementId] = useState<string | null>(
    null
  );
  const [pendingTreatmentData, setPendingTreatmentData] = useState<{
    values: EncounterFormValues;
    patientId: string;
  } | null>(null);

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

  // Search patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients", patientSearch],
    queryFn: async () => {
      if (!patientSearch || patientSearch.length < 2) return { data: [] };
      return await api.patient.getPatients({
        searchTerm: patientSearch,
        pageSize: 10,
      });
    },
    enabled: patientSearch.length >= 2,
  });

  // Fetch patient details when defaultPatientId or selectedPatientId is available
  const currentPatientId = selectedPatientId || defaultPatientId;
  const { data: selectedPatientData } = useQuery({
    queryKey: ["patient-details", currentPatientId],
    queryFn: async () => {
      if (!currentPatientId) return null;
      try {
        const response = await api.patient.getPatientDetails(currentPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!currentPatientId,
  });

  // Fetch user details for patient name
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", currentPatientId],
    queryFn: async () => {
      if (!currentPatientId) return null;
      try {
        const response = await api.user.getUserDetails(currentPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!currentPatientId,
  });

  // Get patient name from multiple sources
  const patientName =
    selectedPatientData?.accountInfo?.username ||
    userDetails?.fullName ||
    userDetails?.userName ||
    selectedPatientData?.fullName ||
    "Unknown";

  // Update patientSearch when patient data is loaded
  useEffect(() => {
    if (
      (selectedPatientData || userDetails) &&
      currentPatientId &&
      !patientSearch
    ) {
      const code = selectedPatientData?.patientCode || "";
      setPatientSearch(`${patientName} (${code})`);
    }
  }, [
    selectedPatientData,
    userDetails,
    currentPatientId,
    patientSearch,
    patientName,
  ]);

  const form = useForm<EncounterFormValues>({
    defaultValues: {
      visitDate: new Date().toISOString().split("T")[0],
      treatmentType: "Consultation",
      chiefComplaint: "",
      history: "",
      vitals: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
      },
      physicalExam: "",
      notes: "",
      iuiProtocol: "",
      iuiProtocolOther: "",
      iuiMedications: "",
      iuiMonitoring: "",
      ivfProtocol: "",
      ivfProtocolOther: "",
    },
  });

  const selectedTreatmentType = form.watch("treatmentType");

  const createTreatmentMutation = useMutation({
    mutationFn: async ({
      values,
      doctorId: targetDoctorId,
      patientId,
    }: {
      values: EncounterFormValues;
      doctorId: string;
      patientId: string;
    }) => {
      // Format dates
      const startDate = new Date(`${values.visitDate}T00:00:00`).toISOString();
      const endDate = new Date(`${values.visitDate}T23:59:59`).toISOString();

      // Build encounter payload according to API specification
      // POST /api/treatment
      const shouldAutoCreateCycle =
        values.treatmentType === "IUI" || values.treatmentType === "IVF";

      const payload: any = {
        patientId,
        doctorId: targetDoctorId,
        treatmentName: values.chiefComplaint || "Encounter",
        treatmentType: values.treatmentType,
        startDate,
        endDate,
        status: "InProgress",
        diagnosis: values.history || "", // Use history as diagnosis
        goals: "", // Can be empty for encounters
        notes: values.notes || "", // Only internal notes, not JSON string
        estimatedCost: 0,
        actualCost: 0,
        autoCreate: shouldAutoCreateCycle,
      };

      // Add IUI object if treatment type is IUI
      if (values.treatmentType === "IUI") {
        // Use iuiProtocolOther if "Other" is selected, otherwise use iuiProtocol
        const protocolValue =
          values.iuiProtocol === "Other"
            ? values.iuiProtocolOther?.trim() || ""
            : values.iuiProtocol?.trim() || "";

        if (!protocolValue) {
          throw new Error("Protocol is required for IUI treatment");
        }

        const iuiObject: any = {
          protocol: protocolValue,
          medications: values.iuiMedications?.trim() || "",
          monitoring: values.iuiMonitoring?.trim() || "",
          ovulationTriggerDate: startDate,
          inseminationDate: endDate,
          motileSpermCount: 0,
          numberOfAttempts: 0,
          outcome: "",
          notes: "",
          status: "Planned",
        };

        // Only include date fields if they have values, otherwise omit them
        // Backend will handle null/undefined dates
        payload.iui = iuiObject;
      }

      // Add IVF object if treatment type is IVF
      if (values.treatmentType === "IVF") {
        // Use ivfProtocolOther if "Other" is selected, otherwise use ivfProtocol
        const protocolValue =
          values.ivfProtocol === "Other"
            ? values.ivfProtocolOther?.trim() || ""
            : values.ivfProtocol?.trim() || "";

        // Build IVF object - exclude treatmentId (will be set by backend)
        const ivfObject: any = {
          protocol: protocolValue,
          stimulationStartDate: startDate,
          oocyteRetrievalDate: startDate,
          fertilizationDate: startDate,
          transferDate: endDate,
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
          usedICSI: false,
          status: "Planned",
        };

        // Only include date fields if they have values, otherwise omit them
        // Backend will handle null/undefined dates
        payload.ivf = ivfObject;
      }

      const response = await api.treatment.createTreatment(payload);
      const treatmentData = response.data;

      // Note: Backend automatically creates cycle when autoCreate=true is set in payload
      // No need to manually create cycle here - it's already done by backend
      if (
        shouldAutoCreateCycle &&
        treatmentData?.id &&
        (values.treatmentType === "IUI" || values.treatmentType === "IVF")
      ) {
        // Cycle is automatically created by backend with autoCreate=true
        // Just log for debugging
        console.log(
          `Treatment ${treatmentData.id} created with autoCreate=true. Cycle should be auto-created by backend.`
        );
      }

      return treatmentData;
    },
    onSuccess: (data, variables) => {
      const treatmentId = data?.id;
      const treatmentType = variables.values.treatmentType;

      let successMessage = "Treatment saved successfully!";
      if (treatmentType === "Consultation") {
        successMessage = "Encounter saved successfully!";
      } else if (treatmentType === "IUI") {
        successMessage = "IUI treatment created successfully!";
      } else if (treatmentType === "IVF") {
        successMessage = "IVF treatment created successfully!";
      }

      toast.success(successMessage);

      queryClient.invalidateQueries({
        queryKey: ["doctor-encounters"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor-treatments"],
      });

      if (treatmentType === "Consultation") {
        // For Consultation, navigate to diagnosis page
        if (onCreated && treatmentId) {
          onCreated(treatmentId);
        } else if (treatmentId && defaultPatientId) {
          navigate({
            to: "/doctor/encounters/$encounterId/diagnosis",
            params: { encounterId: treatmentId },
            search: {
              patientId: defaultPatientId,
              appointmentId: defaultAppointmentId,
              treatmentId: treatmentId,
            },
          });
        }
        if (onClose) {
          onClose();
        }
      } else {
        // For other types (non-IUI/IVF)
        if (onCreated && treatmentId) {
          onCreated(treatmentId);
        }
        if (onClose) {
          onClose();
        }
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to save encounter. Please try again.";
      toast.error(message);
    },
  });

  // Mutation to update treatment with encounter data after signature
  const updateTreatmentWithEncounterDataMutation = useMutation({
    mutationFn: async ({
      treatmentId: targetTreatmentId,
      values,
    }: {
      treatmentId: string;
      values: EncounterFormValues;
      doctorId: string;
      patientId: string;
    }) => {
      // Format dates
      const startDate = new Date(`${values.visitDate}T00:00:00`).toISOString();
      const endDate = new Date(`${values.visitDate}T23:59:59`).toISOString();

      // Update treatment with encounter data
      const payload: any = {
        treatmentName: values.chiefComplaint || "Encounter",
        startDate,
        endDate,
        status: "InProgress", // Change from Planning to InProgress
        diagnosis: values.history || "",
        // Keep existing goals and notes from plan, merge with encounter notes
        notes: values.notes || "",
      };

      // Don't update IUI/IVF objects - they are managed separately
      // The protocol and other IUI/IVF fields should remain as set in the plan

      const response = await api.treatment.updateTreatment(
        targetTreatmentId,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Encounter created successfully!");
      queryClient.invalidateQueries({
        queryKey: ["doctor-treatments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["treatment", createdTreatmentId],
      });

      if (onCreated && createdTreatmentId) {
        onCreated(createdTreatmentId);
      }

      // Navigate to treatment cycles (cycle will be auto-created after signature)
      if (pendingTreatmentData) {
        navigate({
          to: "/doctor/treatment-cycles",
          search: { patientId: pendingTreatmentData.patientId },
        });
      }

      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create encounter"
      );
    },
  });

  const onSubmit = (values: EncounterFormValues) => {
    const patientId = selectedPatientId || defaultPatientId;

    if (!patientId) {
      toast.error("Select a patient before creating an encounter.");
      return;
    }

    if (!doctorId) {
      toast.error(
        "Unable to find doctor information. Please contact the administrator."
      );
      return;
    }

    // If we have createdTreatmentId, this means we're submitting encounter form after signature
    // Update the treatment with encounter data
    if (createdTreatmentId) {
      updateTreatmentWithEncounterDataMutation.mutate({
        treatmentId: createdTreatmentId,
        values,
        doctorId,
        patientId,
      });
      return;
    }

    // For IUI/IVF, show treatment plan form first (Step 1)
    if (values.treatmentType === "IUI" || values.treatmentType === "IVF") {
      // Save form data and move to plan step
      setPendingTreatmentData({ values, patientId });
      setCurrentStep("plan");
      return;
    }

    // For Consultation and Other, create treatment directly
    createTreatmentMutation.mutate({ doctorId, values, patientId });
  };

  // Fetch patient details for plan step
  const planPatientId =
    pendingTreatmentData?.patientId ||
    selectedPatientId ||
    defaultPatientId ||
    "";
  const { data: planPatientDetails } = useQuery({
    queryKey: ["patient-details", planPatientId],
    queryFn: async () => {
      if (!planPatientId) return null;
      try {
        const response = await api.patient.getPatientDetails(planPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!planPatientId && currentStep === "plan",
  });

  const { data: planUserDetails } = useQuery({
    queryKey: ["user-details", planPatientId],
    queryFn: async () => {
      if (!planPatientId) return null;
      try {
        const response = await api.user.getUserDetails(planPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!planPatientId && currentStep === "plan",
  });

  // Show step indicator if we're in encounter step after signature
  // This MUST be defined before useQuery hooks that use it
  const showEncounterStepIndicator =
    createdTreatmentId && currentStep === "encounter";

  // Fetch treatment data to get treatment type if we started from plan step
  // This hook MUST be called before any early returns to follow Rules of Hooks
  const { data: createdTreatmentData } = useQuery({
    queryKey: ["treatment", createdTreatmentId],
    queryFn: async () => {
      if (!createdTreatmentId) return null;
      const response = await api.treatment.getTreatmentById(createdTreatmentId);
      return response.data;
    },
    enabled: !!createdTreatmentId && !pendingTreatmentData,
  });

  // Get patient ID for step 3 from treatment data
  const encounterPatientId =
    createdTreatmentData?.patientId ||
    pendingTreatmentData?.patientId ||
    selectedPatientId ||
    defaultPatientId ||
    "";

  // Fetch agreement data for step 3 summary
  // Use both TreatmentId and PatientId to ensure we get the correct agreement
  const { data: createdAgreementData } = useQuery({
    queryKey: ["agreement", createdTreatmentId, encounterPatientId],
    queryFn: async () => {
      if (!createdTreatmentId && !encounterPatientId) return null;
      try {
        const queryParams: any = {
          Size: 1,
        };
        if (createdTreatmentId) {
          queryParams.TreatmentId = createdTreatmentId;
        }
        if (encounterPatientId) {
          queryParams.PatientId = encounterPatientId;
        }
        const response = await api.agreement.getAgreements(queryParams);
        if (response.data && response.data.length > 0) {
          // If we have TreatmentId, prefer agreement with matching TreatmentId
          if (createdTreatmentId) {
            const matchingAgreement = response.data.find(
              (agreement: any) => agreement.treatmentId === createdTreatmentId
            );
            if (matchingAgreement) {
              return matchingAgreement;
            }
          }
          // Otherwise return the first one
          return response.data[0];
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled:
      (!!createdTreatmentId || !!encounterPatientId) &&
      !!showEncounterStepIndicator,
  });

  // Fetch patient details for step 3
  const { data: encounterPatientDetails } = useQuery({
    queryKey: ["patient-details", encounterPatientId],
    queryFn: async () => {
      if (!encounterPatientId) return null;
      try {
        const response =
          await api.patient.getPatientDetails(encounterPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!encounterPatientId && !!showEncounterStepIndicator,
  });

  // Fetch user details for step 3
  const { data: encounterUserDetails } = useQuery({
    queryKey: ["user-details", encounterPatientId],
    queryFn: async () => {
      if (!encounterPatientId) return null;
      try {
        const response = await api.user.getUserDetails(encounterPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!encounterPatientId && !!showEncounterStepIndicator,
  });

  // Step 1: Treatment Plan Form (for IUI/IVF)
  // Show if: (1) coming from encounter form with IUI/IVF, (2) starting directly with initialTreatmentType, or (3) startWithPlan is true
  if (
    currentStep === "plan" &&
    (pendingTreatmentData || planTreatmentType || startWithPlan)
  ) {
    // Get patient information
    const planPatientName =
      planPatientDetails?.accountInfo?.username ||
      planUserDetails?.fullName ||
      planUserDetails?.userName ||
      planPatientDetails?.fullName ||
      "Unknown";
    const planPatientCode = planPatientDetails?.patientCode || "";
    const planNationalId = planPatientDetails?.nationalId || "";
    const planDateOfBirth = planUserDetails?.dob
      ? new Date(planUserDetails.dob).toLocaleDateString("vi-VN")
      : planPatientDetails?.dateOfBirth
        ? new Date(planPatientDetails.dateOfBirth).toLocaleDateString("vi-VN")
        : null;
    const planGender =
      planUserDetails?.gender !== undefined
        ? planUserDetails.gender
          ? "Male"
          : "Female"
        : planPatientDetails?.gender || null;
    const planAge = planUserDetails?.age ?? null;
    const planPhone =
      planPatientDetails?.accountInfo?.phone ||
      planUserDetails?.phone ||
      planUserDetails?.phoneNumber ||
      planPatientDetails?.phoneNumber ||
      null;
    const planEmail =
      planPatientDetails?.accountInfo?.email ||
      planUserDetails?.email ||
      planPatientDetails?.email ||
      null;
    const planAddress =
      planPatientDetails?.accountInfo?.address ||
      planUserDetails?.location ||
      planPatientDetails?.address ||
      null;
    const planBloodType = planPatientDetails?.bloodType || null;

    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium text-primary">
              1. Treatment Plan
            </span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600 text-sm font-medium">
              2
            </div>
            <span className="text-sm text-gray-500">2. Signature</span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600 text-sm font-medium">
              3
            </div>
            <span className="text-sm text-gray-500">3. Encounter Created</span>
          </div>
        </div>

        {/* Patient Selector - show if no patientId yet */}
        {!planPatientId && (
          <Card>
            <CardHeader>
              <CardTitle>Select Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Search Patient (by name, code, or national ID)
                </label>
                <Input
                  placeholder="Enter at least 2 characters to search..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>

              {patientsData?.data && patientsData.data.length > 0 && (
                <div className="rounded-lg border">
                  <div className="max-h-64 overflow-y-auto">
                    {patientsData.data.map((patient: any) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setPatientSearch(
                            `${patient.fullName} (${patient.patientCode})`
                          );
                        }}
                        className={`w-full border-b p-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                          selectedPatientId === patient.id ? "bg-primary/5" : ""
                        }`}
                      >
                        <p className="font-medium">{patient.fullName}</p>
                        <p className="text-sm text-gray-600">
                          {patient.patientCode} • {patient.nationalId} •{" "}
                          {patient.gender}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatientId && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                  ✓ Patient selected: {patientName} (
                  {selectedPatientData?.patientCode || ""})
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Patient Information Card - show after patient is selected */}
        {planPatientId && (
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-base font-semibold">{planPatientName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    Patient Code
                  </p>
                  <p className="text-base">{planPatientCode || "N/A"}</p>
                </div>
                {planNationalId && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      National ID
                    </p>
                    <p className="text-base">{planNationalId}</p>
                  </div>
                )}
                {planDateOfBirth && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </p>
                    <p className="text-base">
                      {planDateOfBirth}
                      {planAge && ` (${planAge} years old)`}
                    </p>
                  </div>
                )}
                {planGender && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="text-base">{planGender}</p>
                  </div>
                )}
                {planPhone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base">{planPhone}</p>
                  </div>
                )}
                {planEmail && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base">{planEmail}</p>
                  </div>
                )}
                {planAddress && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-base">{planAddress}</p>
                  </div>
                )}
                {planBloodType && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">
                      Blood Type
                    </p>
                    <p className="text-base">{planBloodType}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <TreatmentPlanForm
          patientId={planPatientId || undefined}
          layout={layout}
          showNextStep={true}
          onClose={() => {
            setCurrentStep("encounter");
            setPendingTreatmentData(null);
            setPlanTreatmentType(null);
            if (onClose) {
              onClose();
            }
          }}
          onSaved={(treatmentPlanId, agreementId) => {
            // Move to signature step
            setCreatedTreatmentId(treatmentPlanId);
            if (agreementId) {
              setCreatedAgreementId(agreementId);
            }
            // Store the treatment type and patientId if we started from plan step
            // Get treatment type from TreatmentPlanForm - we'll need to track it
            // For now, use planTreatmentType or get from formState if available
            const patientId = selectedPatientId || defaultPatientId || "";
            if (patientId && !pendingTreatmentData) {
              // We need to get the treatment type from the created treatment
              // For now, use planTreatmentType or wait for treatment data
              // This will be handled in the signature step
            }
            setCurrentStep("signature");
          }}
        />
      </div>
    );
  }

  // Step 2: Signature (for IUI/IVF)
  if (
    currentStep === "signature" &&
    createdTreatmentId &&
    (pendingTreatmentData || planTreatmentType || createdTreatmentData)
  ) {
    const treatmentType =
      pendingTreatmentData?.values.treatmentType ||
      planTreatmentType ||
      (createdTreatmentData?.treatmentType as "IUI" | "IVF" | null);
    const signaturePatientId =
      pendingTreatmentData?.patientId ||
      selectedPatientId ||
      defaultPatientId ||
      "";

    if (
      !treatmentType ||
      !signaturePatientId ||
      (treatmentType !== "IUI" && treatmentType !== "IVF")
    ) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
              ✓
            </div>
            <span className="text-sm text-gray-600">1. Treatment Plan</span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
              2
            </div>
            <span className="text-sm font-medium text-primary">
              2. Signature
            </span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600 text-sm font-medium">
              3
            </div>
            <span className="text-sm text-gray-500">3. Encounter Created</span>
          </div>
        </div>

        <TreatmentPlanSignature
          treatmentId={createdTreatmentId}
          patientId={signaturePatientId}
          treatmentType={treatmentType as "IUI" | "IVF"}
          agreementId={createdAgreementId || undefined}
          onSigned={() => {
            // After signature, if we have pendingTreatmentData (from encounter form), update immediately
            // Otherwise, we need to show encounter form to collect data
            if (pendingTreatmentData && doctorId) {
              updateTreatmentWithEncounterDataMutation.mutate({
                treatmentId: createdTreatmentId,
                values: pendingTreatmentData.values,
                doctorId,
                patientId: pendingTreatmentData.patientId,
              });
            } else {
              // Started from plan step - need to collect encounter data
              // Set form values to match treatment type and move to encounter form
              form.setValue("treatmentType", treatmentType);
              form.setValue(
                "visitDate",
                new Date().toISOString().split("T")[0]
              );
              setCurrentStep("encounter");
            }
          }}
          onClose={() => {
            setCurrentStep("plan");
          }}
          layout={layout}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!doctorProfileLoading && !doctorProfile && doctorId ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Doctor profile information is being loaded. If this message persists,
          please contact the administrator.
        </div>
      ) : null}

      {/* Step Indicator for Encounter step after signature */}
      {showEncounterStepIndicator && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
                ✓
              </div>
              <span className="text-sm text-gray-600">1. Treatment Plan</span>
            </div>
            <div className="h-px flex-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
                ✓
              </div>
              <span className="text-sm text-gray-600">2. Signature</span>
            </div>
            <div className="h-px flex-1 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-medium">
                3
              </div>
              <span className="text-sm font-medium text-primary">
                3. Encounter Created
              </span>
            </div>
          </div>

          {/* Patient Information Card - same as step 1 */}
          {encounterPatientId && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const encounterPatientName =
                    encounterPatientDetails?.accountInfo?.username ||
                    encounterUserDetails?.fullName ||
                    encounterUserDetails?.userName ||
                    encounterPatientDetails?.fullName ||
                    "Unknown";
                  const encounterPatientCode =
                    encounterPatientDetails?.patientCode || "";
                  const encounterNationalId =
                    encounterPatientDetails?.nationalId || "";
                  const encounterDateOfBirth = encounterUserDetails?.dob
                    ? new Date(encounterUserDetails.dob).toLocaleDateString(
                        "vi-VN"
                      )
                    : encounterPatientDetails?.dateOfBirth
                      ? new Date(
                          encounterPatientDetails.dateOfBirth
                        ).toLocaleDateString("vi-VN")
                      : null;
                  const encounterGender =
                    encounterUserDetails?.gender !== undefined
                      ? encounterUserDetails.gender
                        ? "Male"
                        : "Female"
                      : encounterPatientDetails?.gender || null;
                  const encounterAge = encounterUserDetails?.age ?? null;
                  const encounterPhone =
                    encounterPatientDetails?.accountInfo?.phone ||
                    encounterUserDetails?.phone ||
                    encounterUserDetails?.phoneNumber ||
                    encounterPatientDetails?.phoneNumber ||
                    null;
                  const encounterEmail =
                    encounterPatientDetails?.accountInfo?.email ||
                    encounterUserDetails?.email ||
                    encounterPatientDetails?.email ||
                    null;
                  const encounterAddress =
                    encounterPatientDetails?.accountInfo?.address ||
                    encounterUserDetails?.location ||
                    encounterPatientDetails?.address ||
                    null;
                  const encounterBloodType =
                    encounterPatientDetails?.bloodType || null;

                  return (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">
                          Full Name
                        </p>
                        <p className="text-base font-semibold">
                          {encounterPatientName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">
                          Patient Code
                        </p>
                        <p className="text-base">
                          {encounterPatientCode || "N/A"}
                        </p>
                      </div>
                      {encounterNationalId && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            National ID
                          </p>
                          <p className="text-base">{encounterNationalId}</p>
                        </div>
                      )}
                      {encounterDateOfBirth && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Date of Birth
                          </p>
                          <p className="text-base">
                            {encounterDateOfBirth}
                            {encounterAge && ` (${encounterAge} years old)`}
                          </p>
                        </div>
                      )}
                      {encounterGender && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Gender
                          </p>
                          <p className="text-base">{encounterGender}</p>
                        </div>
                      )}
                      {encounterPhone && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Phone
                          </p>
                          <p className="text-base">{encounterPhone}</p>
                        </div>
                      )}
                      {encounterEmail && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Email
                          </p>
                          <p className="text-base">{encounterEmail}</p>
                        </div>
                      )}
                      {encounterAddress && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-sm font-medium text-gray-500">
                            Address
                          </p>
                          <p className="text-base">{encounterAddress}</p>
                        </div>
                      )}
                      {encounterBloodType && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">
                            Blood Type
                          </p>
                          <p className="text-base">{encounterBloodType}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Summary of Previous Steps */}
          {createdTreatmentData && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Treatment Plan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Treatment Plan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    try {
                      const notesData = createdTreatmentData.notes
                        ? JSON.parse(createdTreatmentData.notes)
                        : null;
                      return (
                        <>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Plan Name
                            </p>
                            <p className="text-base font-semibold">
                              {createdTreatmentData.treatmentName ||
                                notesData?.planName ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Treatment Type
                            </p>
                            <p className="text-base">
                              {createdTreatmentData.treatmentType || "N/A"}
                            </p>
                          </div>
                          {createdTreatmentData.startDate && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Start Date
                              </p>
                              <p className="text-base">
                                {new Date(
                                  createdTreatmentData.startDate
                                ).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          )}
                          {notesData?.estimatedDuration && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Estimated Duration
                              </p>
                              <p className="text-base">
                                {notesData.estimatedDuration} months
                              </p>
                            </div>
                          )}
                          {notesData?.phases &&
                            Array.isArray(notesData.phases) && (
                              <div>
                                <p className="text-sm font-medium text-gray-500">
                                  Phases
                                </p>
                                <p className="text-base">
                                  {notesData.phases.length} phase(s) planned
                                </p>
                              </div>
                            )}
                          {createdTreatmentData.goals && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">
                                Overall Goals
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {createdTreatmentData.goals}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    } catch {
                      return (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Treatment Name
                          </p>
                          <p className="text-base">
                            {createdTreatmentData.treatmentName || "N/A"}
                          </p>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>

              {/* Signature Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Signature Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {createdAgreementData ? (
                    <>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Agreement Status
                        </p>
                        <p className="text-base">
                          {(createdAgreementData as any).statusName ||
                            (createdAgreementData as any).status ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Doctor Signature
                        </p>
                        <div className="flex items-center gap-2">
                          {((createdAgreementData as any).signedByDoctor ??
                            (createdAgreementData as any).doctorSigned) ? (
                            <>
                              <svg
                                className="h-5 w-5 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-base font-medium text-green-700">
                                Signed
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-5 w-5 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-base text-amber-700">
                                Pending
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Patient Signature
                        </p>
                        <div className="flex items-center gap-2">
                          {((createdAgreementData as any).signedByPatient ??
                            (createdAgreementData as any).patientSigned) ? (
                            <>
                              <svg
                                className="h-5 w-5 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-base font-medium text-green-700">
                                Signed
                              </span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="h-5 w-5 text-amber-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-base text-amber-700">
                                Pending
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {(createdAgreementData as any).startDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Agreement Start Date
                          </p>
                          <p className="text-base">
                            {new Date(
                              (createdAgreementData as any).startDate
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      )}
                      {(createdAgreementData as any).endDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Agreement End Date
                          </p>
                          <p className="text-base">
                            {new Date(
                              (createdAgreementData as any).endDate
                            ).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      )}
                      {(createdAgreementData as any).agreementCode && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Agreement Code
                          </p>
                          <p className="text-base text-sm">
                            {(createdAgreementData as any).agreementCode}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Loading agreement information...
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Complete Button for Step 3 */}
          {showEncounterStepIndicator && (
            <div className="flex flex-wrap justify-end gap-2 pt-4">
              {layout === "modal" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    }
                  }}
                >
                  Close
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigate({ to: "/doctor/encounters" });
                  }}
                >
                  Back to Encounters
                </Button>
              )}
              <Button
                type="button"
                onClick={() => {
                  // Navigate to treatment cycles if treatment is IUI/IVF
                  if (
                    createdTreatmentData?.treatmentType === "IUI" ||
                    createdTreatmentData?.treatmentType === "IVF"
                  ) {
                    navigate({ to: "/doctor/treatment-cycles" });
                  } else {
                    // Otherwise go to encounters
                    navigate({ to: "/doctor/encounters" });
                  }

                  // Call onCreated callback if provided
                  if (onCreated && createdTreatmentId) {
                    onCreated(createdTreatmentId);
                  }

                  // Call onClose if provided (for modal)
                  if (onClose) {
                    onClose();
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                ✓ Complete
              </Button>
            </div>
          )}
        </>
      )}

      {layout === "page" && !showEncounterStepIndicator && (
        <section className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">Create encounter</h1>
          <p className="text-gray-600">
            Patient:{" "}
            <span className="font-semibold">
              {selectedPatientId || defaultPatientId || "Not selected"}
            </span>
            {defaultAppointmentId && (
              <span className="ml-3 text-sm text-gray-500">
                - Linked appointment {defaultAppointmentId}
              </span>
            )}
          </p>
        </section>
      )}

      {!defaultPatientId && !showEncounterStepIndicator && (
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Search Patient (by name, code, or national ID)
              </label>
              <Input
                placeholder="Enter at least 2 characters to search..."
                value={
                  (selectedPatientData || userDetails) &&
                  currentPatientId &&
                  !patientSearch
                    ? `${patientName} (${selectedPatientData?.patientCode || ""})`
                    : patientSearch
                }
                onChange={(e) => setPatientSearch(e.target.value)}
                disabled={!!defaultPatientId}
              />
            </div>

            {patientsData?.data && patientsData.data.length > 0 && (
              <div className="rounded-lg border">
                <div className="max-h-64 overflow-y-auto">
                  {patientsData.data.map((patient: any) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setPatientSearch(
                          `${patient.fullName} (${patient.patientCode})`
                        );
                      }}
                      className={`w-full border-b p-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                        selectedPatientId === patient.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <p className="font-medium">{patient.fullName}</p>
                      <p className="text-sm text-gray-600">
                        {patient.patientCode} • {patient.nationalId} •{" "}
                        {patient.gender}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedPatientId || defaultPatientId) && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                ✓ Patient selected: {patientName} (
                {selectedPatientData?.patientCode || ""})
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!showEncounterStepIndicator && (
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={
            layout === "modal" ? "space-y-6 overflow-y-auto pr-1" : "space-y-6"
          }
          style={layout === "modal" ? { maxHeight: "70vh" } : undefined}
        >
          <Card>
            <CardHeader>
              <CardTitle>Visit information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Visit date
                </label>
                <Input
                  type="date"
                  {...form.register("visitDate", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Treatment Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  {...form.register("treatmentType", { required: true })}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="IUI">IUI (Intrauterine Insemination)</option>
                  <option value="IVF">IVF (In Vitro Fertilization)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Chief complaint / Treatment name
                </label>
                <Input
                  placeholder="Example: Post-IVF follow-up or IUI Cycle 1"
                  {...form.register("chiefComplaint", { required: true })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Medical history / Diagnosis
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Summarize obstetric history, underlying conditions, prior treatments..."
                  {...form.register("history")}
                />
              </div>
            </CardContent>
          </Card>

          {/* IUI Specific Fields */}
          {selectedTreatmentType === "IUI" && (
            <Card>
              <CardHeader>
                <CardTitle>IUI Treatment Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Protocol <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...form.register("iuiProtocol", {
                      required: "Protocol is required for IUI treatment",
                      validate: (value) => {
                        if (
                          selectedTreatmentType === "IUI" &&
                          (!value || value.trim() === "")
                        ) {
                          return "Protocol is required";
                        }
                        if (
                          value === "Other" &&
                          !form.watch("iuiProtocolOther")?.trim()
                        ) {
                          return true; // Validation for "Other" is handled by iuiProtocolOther field
                        }
                        return true;
                      },
                    })}
                  >
                    <option value="">Select protocol...</option>
                    <option value="Natural cycle">Natural cycle</option>
                    <option value="Clomid (Clomiphene)">
                      Clomid (Clomiphene)
                    </option>
                    <option value="Letrozole">Letrozole</option>
                    <option value="FSH injections">FSH injections</option>
                    <option value="Gonadotropins">Gonadotropins</option>
                    <option value="Combination (Clomid + FSH)">
                      Combination (Clomid + FSH)
                    </option>
                    <option value="Other">Other</option>
                  </select>
                  {form.watch("iuiProtocol") === "Other" && (
                    <div className="mt-2">
                      <Input
                        placeholder="Specify protocol..."
                        {...form.register("iuiProtocolOther", {
                          required: "Please specify the protocol",
                          validate: (value) => {
                            if (
                              form.watch("iuiProtocol") === "Other" &&
                              (!value || value.trim() === "")
                            ) {
                              return "Please specify the protocol";
                            }
                            return true;
                          },
                        })}
                      />
                      {form.formState.errors.iuiProtocolOther && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.iuiProtocolOther.message}
                        </p>
                      )}
                    </div>
                  )}
                  {form.formState.errors.iuiProtocol && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.iuiProtocol.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medications
                  </label>
                  <Input
                    placeholder="e.g., Clomiphene 50mg, FSH injections"
                    {...form.register("iuiMedications")}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Monitoring Plan
                  </label>
                  <textarea
                    className="min-h-[80px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ultrasound monitoring schedule, hormone levels tracking..."
                    {...form.register("iuiMonitoring")}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* IVF Specific Fields */}
          {selectedTreatmentType === "IVF" && (
            <Card>
              <CardHeader>
                <CardTitle>IVF Treatment Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Protocol
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...form.register("ivfProtocol")}
                  >
                    <option value="">Select protocol...</option>
                    <option value="Long Protocol">Long Protocol</option>
                    <option value="Short Protocol">Short Protocol</option>
                    <option value="Antagonist Protocol">
                      Antagonist Protocol
                    </option>
                    <option value="Mini IVF">Mini IVF</option>
                    <option value="Natural Cycle">Natural Cycle</option>
                    <option value="Other">Other</option>
                  </select>
                  {form.watch("ivfProtocol") === "Other" && (
                    <div className="mt-2">
                      <Input
                        placeholder="Specify protocol..."
                        {...form.register("ivfProtocolOther", {
                          validate: (value) => {
                            if (
                              form.watch("ivfProtocol") === "Other" &&
                              (!value || value.trim() === "")
                            ) {
                              return "Please specify the protocol";
                            }
                            return true;
                          },
                        })}
                      />
                      {form.formState.errors.ivfProtocolOther && (
                        <p className="text-sm text-red-500 mt-1">
                          {form.formState.errors.ivfProtocolOther.message}
                        </p>
                      )}
                    </div>
                  )}
                  {form.formState.errors.ivfProtocol && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.ivfProtocol.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Vital signs</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Blood pressure
                </label>
                <Input
                  placeholder="120/80 mmHg"
                  {...form.register("vitals.bloodPressure")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Heart rate
                </label>
                <Input
                  placeholder="80 bpm"
                  {...form.register("vitals.heartRate")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Temperature
                </label>
                <Input
                  placeholder="36.5 C"
                  {...form.register("vitals.temperature")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Weight
                </label>
                <Input
                  placeholder="58 kg"
                  {...form.register("vitals.weight")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Physical exam &amp; notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Physical examination
                </label>
                <textarea
                  className="min-h-[160px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Document clinical assessments, ultrasound findings, clinic lab results..."
                  {...form.register("physicalExam")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Internal notes
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Information for the clinical team only; hidden from patients."
                  {...form.register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            {layout === "modal" ? (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/doctor/encounters" })}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                createTreatmentMutation.isPending ||
                (!selectedPatientId && !defaultPatientId)
              }
            >
              {createTreatmentMutation.isPending
                ? "Saving..."
                : selectedTreatmentType === "Consultation"
                  ? "Save encounter"
                  : selectedTreatmentType === "IUI"
                    ? "Create IUI treatment"
                    : selectedTreatmentType === "IVF"
                      ? "Create IVF treatment"
                      : "Save treatment"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
