/**
 * Create Encounter Form Component
 * Reusable form for creating encounters, can be used in modal or page
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { TreatmentPlanForm } from "@/features/doctor/treatment-cycles/TreatmentPlanForm";
import { TreatmentPlanSignature } from "@/features/doctor/treatment-cycles/TreatmentPlanSignature";
import type { TreatmentType } from "@/api/types";

// Type for pending treatment data (simplified - only treatmentType is actually used)
type PendingTreatmentValues = {
  treatmentType: TreatmentType;
  // Other fields may exist but are not currently used
  [key: string]: any;
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
  defaultAppointmentId: _defaultAppointmentId,
  initialTreatmentType,
  startWithPlan = false,
  onClose,
  onCreated,
}: CreateEncounterFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPatientId] = useState(defaultPatientId || "");
  // Step management for IUI/IVF: plan -> signature -> summary
  // If initialTreatmentType or startWithPlan is provided, start with "plan", otherwise start with "encounter"
  const [currentStep, setCurrentStep] = useState<
    "encounter" | "plan" | "signature" | "summary"
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
    values: PendingTreatmentValues;
    patientId: string;
  } | null>(null);

  // AccountId IS DoctorId - use user.id directly as doctorId
  const doctorId = user?.id ?? null;
  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();

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

  // Show step indicator if we're in summary step after signature
  // This MUST be defined before useQuery hooks that use it
  const showSummaryStepIndicator =
    createdTreatmentId && currentStep === "summary";

  // Fetch treatment data to get treatment type if we started from plan step
  // This hook MUST be called before any early returns to follow Rules of Hooks
  const { data: createdTreatmentData } = useQuery({
    queryKey: ["treatment", createdTreatmentId],
    queryFn: async () => {
      if (!createdTreatmentId) return null;
      const response = await api.treatment.getTreatmentById(createdTreatmentId);
      return response.data;
    },
    enabled: !!createdTreatmentId,
    retry: 1,
  });

  // Update planTreatmentType from createdTreatmentData when available
  useEffect(() => {
    if (
      createdTreatmentData?.treatmentType &&
      (createdTreatmentData.treatmentType === "IUI" ||
        createdTreatmentData.treatmentType === "IVF") &&
      !planTreatmentType
    ) {
      setPlanTreatmentType(createdTreatmentData.treatmentType as "IUI" | "IVF");
    }
  }, [createdTreatmentData, planTreatmentType]);

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
      !!showSummaryStepIndicator,
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
    enabled: !!encounterPatientId && !!showSummaryStepIndicator,
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
    enabled: !!encounterPatientId && !!showSummaryStepIndicator,
  });

  // Step 1: Treatment Plan Form (for IUI/IVF)
  // Show if: (1) coming from encounter form with IUI/IVF, (2) starting directly with initialTreatmentType, or (3) startWithPlan is true, or (4) has a patient selected
  if (
    currentStep === "plan" &&
    (pendingTreatmentData ||
      planTreatmentType ||
      startWithPlan ||
      planPatientId)
  ) {
    // Get patient gender for IVF validation
    const planGender =
      planUserDetails?.gender !== undefined
        ? planUserDetails.gender
          ? "Male"
          : "Female"
        : planPatientDetails?.gender || null;

    // Check if patient is male for IVF validation
    const isPlanPatientMale =
      planGender === "Male" ||
      planUserDetails?.gender === true ||
      planPatientDetails?.gender === "Male";

    // Validate: If trying to create IVF for male patient, show error and prevent
    const treatmentTypeToCheck =
      pendingTreatmentData?.values.treatmentType || planTreatmentType;
    if (treatmentTypeToCheck === "IVF" && isPlanPatientMale) {
      return (
        <div className="space-y-6">
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="h-5 w-5 text-red-600 mt-0.5"
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
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">
                  Cannot Create IVF Treatment
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  IVF treatment can only be created for female patients. This
                  patient is male and is not eligible for IVF treatment.
                </p>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentStep("encounter");
                      setPendingTreatmentData(null);
                      setPlanTreatmentType(null);
                    }}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

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
            <span className="text-sm text-gray-500">3. Summary & Complete</span>
          </div>
        </div>

        {/* Note: Patient selection and information display is now handled inside TreatmentPlanForm component */}
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
  if (currentStep === "signature" && createdTreatmentId) {
    const treatmentType =
      pendingTreatmentData?.values.treatmentType ||
      planTreatmentType ||
      (createdTreatmentData?.treatmentType as "IUI" | "IVF" | null);
    const signaturePatientId =
      pendingTreatmentData?.patientId ||
      selectedPatientId ||
      defaultPatientId ||
      createdTreatmentData?.patientId ||
      "";

    // If we don't have treatment type yet but have treatment ID, wait for data to load
    if (!treatmentType && !createdTreatmentData) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-gray-500">
              Loading treatment information...
            </p>
          </div>
        </div>
      );
    }

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
            <span className="text-sm text-gray-500">3. Summary & Complete</span>
          </div>
        </div>

        <TreatmentPlanSignature
          treatmentId={createdTreatmentId}
          patientId={signaturePatientId}
          treatmentType={treatmentType as "IUI" | "IVF"}
          agreementId={createdAgreementId || undefined}
          onSigned={() => {
            // After signature, move to summary step
            setCurrentStep("summary");
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

      {/* Step 3: Summary (for IUI/IVF) */}
      {currentStep === "summary" &&
        createdTreatmentId &&
        (() => {
          const summaryTreatmentType =
            pendingTreatmentData?.values.treatmentType ||
            planTreatmentType ||
            (createdTreatmentData?.treatmentType as "IUI" | "IVF" | null);

          // If we don't have treatment type yet but have treatment ID, wait for data to load
          if (!summaryTreatmentType && !createdTreatmentData) {
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-center p-8">
                  <p className="text-sm text-gray-500">
                    Loading treatment information...
                  </p>
                </div>
              </div>
            );
          }

          if (
            !summaryTreatmentType ||
            (summaryTreatmentType !== "IUI" && summaryTreatmentType !== "IVF")
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
                  <span className="text-sm text-gray-600">
                    1. Treatment Plan
                  </span>
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
                    3. Summary & Complete
                  </span>
                </div>
              </div>

              {/* Patient Information Card */}
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
                            "en-US"
                          )
                        : encounterPatientDetails?.dateOfBirth
                          ? new Date(
                              encounterPatientDetails.dateOfBirth
                            ).toLocaleDateString("en-US")
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
                                    ).toLocaleDateString("en-US")}
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
                                ).toLocaleDateString("en-US")}
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
                                ).toLocaleDateString("en-US")}
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

                    // Close modal if in modal layout
                    if (layout === "modal" && onClose) {
                      onClose();
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✓ Complete
                </Button>
              </div>
            </div>
          );
        })()}

      {/* Legacy encounter step (for non-IUI/IVF treatments) */}
      {(!currentStep ||
        (currentStep !== "plan" &&
          currentStep !== "signature" &&
          currentStep !== "summary")) && (
        <>
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
                3. Summary & Complete
              </span>
            </div>
          </div>

          {/* Summary Content */}
          {/* Patient Information Card */}
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
                        "en-US"
                      )
                    : encounterPatientDetails?.dateOfBirth
                      ? new Date(
                          encounterPatientDetails.dateOfBirth
                        ).toLocaleDateString("en-US")
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
                                ).toLocaleDateString("en-US")}
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
                            ).toLocaleDateString("en-US")}
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
                            ).toLocaleDateString("en-US")}
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

                // Close modal if in modal layout
                if (layout === "modal" && onClose) {
                  onClose();
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              ✓ Complete
            </Button>
          </div>
        </>
      )}

      {/* Legacy encounter step (for non-IUI/IVF treatments) */}
      {/* Show step indicator if we're in encounter step after signature */}
      {(() => {
        const showEncounterStepIndicator =
          createdTreatmentId && currentStep === "encounter";

        return (
          <div className="space-y-6">
            {!doctorProfileLoading && !doctorProfile && doctorId ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Doctor profile information is being loaded. If this message
                persists, please contact the administrator.
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
                    <span className="text-sm text-gray-600">
                      1. Treatment Plan
                    </span>
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
                      3. Summary & Complete
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
                          ? new Date(
                              encounterUserDetails.dob
                            ).toLocaleDateString("vi-VN")
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
                                <p className="text-base">
                                  {encounterNationalId}
                                </p>
                              </div>
                            )}
                            {encounterDateOfBirth && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">
                                  Date of Birth
                                </p>
                                <p className="text-base">
                                  {encounterDateOfBirth}
                                  {encounterAge &&
                                    ` (${encounterAge} years old)`}
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
                                <p className="text-base">
                                  {encounterBloodType}
                                </p>
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
                                    {createdTreatmentData.treatmentType ||
                                      "N/A"}
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
                                        {notesData.phases.length} phase(s)
                                        planned
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
                                {((createdAgreementData as any)
                                  .signedByDoctor ??
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
                                {((createdAgreementData as any)
                                  .signedByPatient ??
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

                      // Close modal if in modal layout
                      if (layout === "modal" && onClose) {
                        onClose();
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✓ Complete
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
