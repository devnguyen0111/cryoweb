/**
 * Create Treatment Form Component
 * Reusable form for creating treatments, can be used in modal or page
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { TreatmentPlanForm } from "@/features/doctor/treatment-cycles/TreatmentPlanForm";
import { TreatmentPlanSignature } from "@/features/doctor/treatment-cycles/TreatmentPlanSignature";
import { getFullNameFromObject } from "@/utils/name-helpers";
import type { TreatmentType } from "@/api/types";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

// Type for pending treatment data (simplified - only treatmentType is actually used)
type PendingTreatmentValues = {
  treatmentType: TreatmentType;
  // Other fields may exist but are not currently used
  [key: string]: any;
};

interface CreateTreatmentFormProps {
  layout?: "page" | "modal";
  defaultPatientId?: string;
  defaultAppointmentId?: string;
  initialTreatmentType?: "IUI" | "IVF"; // If provided, start with Treatment Plan form
  startWithPlan?: boolean; // If true, start with Treatment Plan form (for IUI/IVF)
  onClose?: () => void;
  onCreated?: (treatmentId: string) => void;
}

export function CreateTreatmentForm({
  layout = "modal",
  defaultPatientId,
  defaultAppointmentId: _defaultAppointmentId,
  initialTreatmentType,
  startWithPlan = false,
  onClose,
  onCreated,
}: CreateTreatmentFormProps) {
  const navigate = useNavigate();
  const [selectedPatientId] = useState(defaultPatientId || "");
  // Step management for IUI/IVF: plan -> signature -> summary
  // If initialTreatmentType or startWithPlan is provided, start with "plan", otherwise start with "treatment"
  const [currentStep, setCurrentStep] = useState<
    "treatment" | "plan" | "signature" | "summary"
  >(initialTreatmentType || startWithPlan ? "plan" : "treatment");
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

  // Fetch doctor profile for summary step
  const { data: doctorProfile } = useDoctorProfile();

  // Fetch patient details for plan step
  const planPatientId =
    pendingTreatmentData?.patientId ||
    selectedPatientId ||
    defaultPatientId ||
    "";
  const { data: planPatientDetails } = usePatientDetails(
    planPatientId,
    !!planPatientId && currentStep === "plan"
  );

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
  const treatmentPatientId =
    createdTreatmentData?.patientId ||
    pendingTreatmentData?.patientId ||
    selectedPatientId ||
    defaultPatientId ||
    "";

  // Fetch agreement data for step 3 summary
  // Use both TreatmentId and PatientId to ensure we get the correct agreement
  const { data: createdAgreementData } = useQuery({
    queryKey: ["agreement", createdTreatmentId, treatmentPatientId],
    queryFn: async () => {
      if (!createdTreatmentId && !treatmentPatientId) return null;
      try {
        const queryParams: any = {
          Size: 1,
        };
        if (createdTreatmentId) {
          queryParams.TreatmentId = createdTreatmentId;
        }
        if (treatmentPatientId) {
          queryParams.PatientId = treatmentPatientId;
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
      (!!createdTreatmentId || !!treatmentPatientId) &&
      !!showSummaryStepIndicator,
  });

  // Fetch patient details for step 3
  const { data: treatmentPatientDetails } = usePatientDetails(
    treatmentPatientId,
    !!treatmentPatientId && !!showSummaryStepIndicator
  );

  // Fetch user details for step 3
  const { data: treatmentUserDetails } = useQuery({
    queryKey: ["user-details", treatmentPatientId],
    queryFn: async () => {
      if (!treatmentPatientId) return null;
      try {
        const response = await api.user.getUserDetails(treatmentPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!treatmentPatientId && !!showSummaryStepIndicator,
  });

  // Step 1: Treatment Plan Form (for IUI/IVF)
  // Show if: (1) coming from treatment form with IUI/IVF, (2) starting directly with initialTreatmentType, or (3) startWithPlan is true, or (4) has a patient selected
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
                      setCurrentStep("treatment");
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
          treatmentType={
            (pendingTreatmentData?.values.treatmentType as "IUI" | "IVF") ||
            planTreatmentType ||
            undefined
          }
          layout={layout}
          onSaved={(treatmentId: string, agreementId?: string) => {
            setCreatedTreatmentId(treatmentId);
            setCreatedAgreementId(agreementId || null);
            setCurrentStep("signature");
          }}
          onClose={() => {
            if (pendingTreatmentData) {
              // If we came from treatment form, go back to treatment form
              setCurrentStep("treatment");
              setPendingTreatmentData(null);
            } else if (onClose) {
              // If we're in modal or page with onClose, close
              onClose();
            } else {
              // Otherwise navigate away
              navigate({ to: "/doctor/encounters" });
            }
          }}
        />
      </div>
    );
  }

  // Step 2: Treatment Plan Signature (for IUI/IVF)
  if (
    currentStep === "signature" &&
    createdTreatmentId &&
    (planTreatmentType === "IUI" || planTreatmentType === "IVF")
  ) {
    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
              <svg
                className="h-5 w-5"
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
            </div>
            <span className="text-sm text-green-700">1. Treatment Plan</span>
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

        {/* Signature Form */}
        <TreatmentPlanSignature
          treatmentId={createdTreatmentId}
          patientId={
            createdTreatmentData?.patientId ||
            pendingTreatmentData?.patientId ||
            selectedPatientId ||
            defaultPatientId ||
            ""
          }
          treatmentType={planTreatmentType}
          agreementId={createdAgreementId || undefined}
          onSigned={() => {
            setCurrentStep("summary");
          }}
          onClose={() => {
            if (onClose) {
              onClose();
            } else {
              navigate({ to: "/doctor/encounters" });
            }
          }}
          layout={layout}
        />
      </div>
    );
  }

  // Step 3: Summary & Complete (for IUI/IVF)
  if (showSummaryStepIndicator && createdTreatmentData && createdAgreementData) {
    const summaryPatientName =
      getFullNameFromObject(treatmentUserDetails) ||
      getFullNameFromObject(treatmentPatientDetails) ||
      (isPatientDetailResponse(treatmentPatientDetails)
        ? treatmentPatientDetails.accountInfo?.username
        : null) ||
      treatmentUserDetails?.userName ||
      treatmentPatientDetails?.patientCode ||
      "Unknown";
    const summaryPatientCode =
      treatmentPatientDetails?.patientCode || "";
    const summaryNationalId =
      treatmentPatientDetails?.nationalId || "";
    const summaryDateOfBirth = treatmentUserDetails?.dob
      ? new Date(treatmentUserDetails.dob).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "2-digit", day: "2-digit" }
        )
      : treatmentPatientDetails?.dateOfBirth
        ? new Date(
              treatmentPatientDetails.dateOfBirth
            ).toLocaleDateString("en-US")
        : "";
    const summaryGender =
      treatmentUserDetails?.gender !== undefined
        ? treatmentUserDetails.gender
          ? "Male"
          : "Female"
        : treatmentPatientDetails?.gender || null;
    const summaryAge = treatmentUserDetails?.age ?? null;
    const summaryPhone =
      (isPatientDetailResponse(treatmentPatientDetails)
        ? treatmentPatientDetails.accountInfo?.phone
        : null) ||
      treatmentUserDetails?.phone ||
      treatmentUserDetails?.phoneNumber ||
      treatmentPatientDetails?.phoneNumber ||
      "";
    const summaryEmail =
      (isPatientDetailResponse(treatmentPatientDetails)
        ? treatmentPatientDetails.accountInfo?.email
        : null) ||
      treatmentUserDetails?.email ||
      treatmentPatientDetails?.email ||
      "";
    const summaryAddress =
      (isPatientDetailResponse(treatmentPatientDetails)
        ? treatmentPatientDetails.accountInfo?.address
        : null) ||
      treatmentUserDetails?.location ||
      treatmentPatientDetails?.address ||
      "";
    const summaryBloodType =
      treatmentPatientDetails?.bloodType || null;

    const summaryDoctorName = getFullNameFromObject(doctorProfile) || "Unknown";
    const summaryDoctorEmail = doctorProfile?.email || "N/A";
    const summaryDoctorPhone =
      (doctorProfile as any)?.phone ||
      (doctorProfile as any)?.phoneNumber ||
      "N/A";

    // Use new field names (signedByDoctor/signedByPatient) with fallback to legacy fields
    const summaryDoctorSigned =
      createdAgreementData?.signedByDoctor ??
      (createdAgreementData as any)?.doctorSigned ??
      false;
    const summaryPatientSigned =
      createdAgreementData?.signedByPatient ??
      (createdAgreementData as any)?.patientSigned ??
      false;

    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
              <svg
                className="h-5 w-5"
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
            </div>
            <span className="text-sm text-green-700">1. Treatment Plan</span>
          </div>
          <div className="h-px flex-1 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">
              <svg
                className="h-5 w-5"
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
            </div>
            <span className="text-sm text-green-700">2. Signature</span>
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

        {/* Success Message */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
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
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                Treatment Plan Created Successfully
              </h3>
              <p className="mt-1 text-sm text-green-700">
                The {planTreatmentType} treatment plan has been created and
                signed. You can now proceed with the treatment workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Information */}
        <Card>
          <CardHeader>
            <CardTitle>Treatment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Patient Information
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {treatmentPatientId && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Full Name
                      </p>
                      <p className="text-base">
                        {summaryPatientName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Patient Code
                      </p>
                      <p className="text-base">{summaryPatientCode || "N/A"}</p>
                    </div>
                    {summaryNationalId && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Citizen ID
                        </p>
                        <p className="text-base">{summaryNationalId}</p>
                      </div>
                    )}
                    {summaryDateOfBirth && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Date of Birth
                        </p>
                        <p className="text-base">
                          {summaryDateOfBirth}
                          {summaryAge && ` (${summaryAge} years old)`}
                        </p>
                      </div>
                    )}
                    {summaryGender && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Gender
                        </p>
                        <p className="text-base">{summaryGender}</p>
                      </div>
                    )}
                    {summaryPhone && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Phone Number
                        </p>
                        <p className="text-base">{summaryPhone}</p>
                      </div>
                    )}
                    {summaryEmail && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Email
                        </p>
                        <p className="text-base">{summaryEmail}</p>
                      </div>
                    )}
                    {summaryAddress && (
                      <div className="md:col-span-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Address
                        </p>
                        <p className="text-base">{summaryAddress}</p>
                      </div>
                    )}
                    {summaryBloodType && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Blood Type
                        </p>
                        <p className="text-base">{summaryBloodType}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Doctor Information
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Full Name
                  </p>
                  <p className="text-base">{summaryDoctorName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Email
                  </p>
                  <p className="text-base">{summaryDoctorEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Phone Number
                  </p>
                  <p className="text-base">{summaryDoctorPhone}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Treatment Plan Details
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Treatment Type
                  </p>
                  <p className="text-base">{planTreatmentType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Treatment ID
                  </p>
                  <p className="text-base font-mono">
                    {createdTreatmentData.treatmentCode || createdTreatmentId}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Agreement ID
                  </p>
                  <p className="text-base font-mono">
                    {(createdAgreementData as any)?.agreementCode ||
                      createdAgreementId ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Status
                  </p>
                  <p className="text-base">{createdTreatmentData.status}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Signature Status
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={`rounded-lg border p-4 ${
                    summaryDoctorSigned
                      ? "border-green-200 bg-green-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Doctor Signature
                      </p>
                      <p className="text-sm text-gray-600">
                        {summaryDoctorSigned ? "Signed" : "Pending"}
                      </p>
                    </div>
                    {summaryDoctorSigned ? (
                      <svg
                        className="h-6 w-6 text-green-600"
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
                    ) : (
                      <svg
                        className="h-6 w-6 text-amber-600"
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
                    )}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-4 ${
                    summaryPatientSigned
                      ? "border-green-200 bg-green-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Patient Signature
                      </p>
                      <p className="text-sm text-gray-600">
                        {summaryPatientSigned ? "Signed" : "Pending"}
                      </p>
                    </div>
                    {summaryPatientSigned ? (
                      <svg
                        className="h-6 w-6 text-green-600"
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
                    ) : (
                      <svg
                        className="h-6 w-6 text-amber-600"
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              navigate({
                to: "/doctor/treatment-cycles",
                search: { patientId: treatmentPatientId || undefined },
              });
            }}
          >
            View Treatment Cycles
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (onCreated && createdTreatmentId) {
                onCreated(createdTreatmentId);
              }
              if (onClose) {
                onClose();
              } else {
                navigate({ to: "/doctor/encounters" });
              }
            }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // Default: Should not reach here
  return null;
}

