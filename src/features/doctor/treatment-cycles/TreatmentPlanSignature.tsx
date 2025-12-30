/**
 * Treatment Plan Signature Component
 * Handles doctor and patient signature confirmation for treatment plans
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { isAxiosError } from "axios";
import { AgreementDocument } from "./AgreementDocument";
import { getFullNameFromObject } from "@/utils/name-helpers";

interface TreatmentPlanSignatureProps {
  treatmentId: string;
  patientId: string;
  treatmentType: "IUI" | "IVF";
  agreementId?: string; // Optional: if agreement already exists
  onSigned?: () => void;
  onClose?: () => void;
  layout?: "modal" | "page";
}

export function TreatmentPlanSignature({
  treatmentId,
  patientId,
  treatmentType,
  agreementId,
  onSigned,
  onClose,
  layout: _layout = "modal",
}: TreatmentPlanSignatureProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSigning, setIsSigning] = useState(false);
  const [showAgreementDocument, setShowAgreementDocument] = useState(false);

  // Fetch agreement by treatmentId or agreementId
  const {
    data: agreement,
    isLoading: agreementLoading,
    isFetching: agreementFetching,
    refetch: refetchAgreement,
  } = useQuery({
    queryKey: ["agreement", agreementId || treatmentId],
    queryFn: async () => {
      // If agreementId is provided, fetch by ID
      if (agreementId) {
        try {
          const response = await api.agreement.getAgreementById(agreementId);
          return response.data;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            // If not found by ID, try to find by treatmentId
            console.log(
              `Agreement ${agreementId} not found, trying to find by treatmentId ${treatmentId}`
            );
          } else {
            throw error;
          }
        }
      }
      // Otherwise, try to find agreement by treatmentId
      try {
        const response = await api.agreement.getAgreements({
          TreatmentId: treatmentId,
          Size: 1,
        });
        // Return first agreement if found
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!treatmentId,
    retry: 1, // Retry once in case of network issues
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Use new field names (signedByDoctor/signedByPatient) with fallback to legacy fields
  const doctorSigned =
    agreement?.signedByDoctor ?? agreement?.doctorSigned ?? false;
  const patientSigned =
    agreement?.signedByPatient ?? agreement?.patientSigned ?? false;
  const bothSigned = doctorSigned && patientSigned;

  const signAgreementMutation = useMutation({
    mutationFn: async ({ signedBy }: { signedBy: "doctor" | "patient" }) => {
      if (!agreement?.id) {
        throw new Error("Agreement not found");
      }

      // Check if already signed before attempting to sign
      const currentDoctorSigned =
        agreement.signedByDoctor ?? agreement.doctorSigned ?? false;
      const currentPatientSigned =
        agreement.signedByPatient ?? agreement.patientSigned ?? false;

      // If trying to sign as doctor and already signed, skip
      if (signedBy === "doctor" && currentDoctorSigned) {
        // Return current agreement data as if signing was successful
        return agreement;
      }

      // If trying to sign for patient and patient already signed, skip
      if (signedBy === "patient" && currentPatientSigned) {
        // Return current agreement data as if signing was successful
        return agreement;
      }

      // Sign agreement using Agreement API
      // Backend requires signedByDoctor or signedByPatient to be true
      // If signing on behalf of patient, also set doctor signature (doctor signs for both)
      // If doctor already signed and wants to sign for patient, allow it
      try {
        const response = await api.agreement.signAgreement(agreement.id, {
          signedByDoctor: signedBy === "doctor" || signedBy === "patient", // If signing for patient, also sign as doctor
          signedByPatient: signedBy === "patient", // Only set patient signature if signing for patient
        });

        return response.data;
      } catch (error: any) {
        // If agreement is already signed, treat it as success by returning current agreement
        if (
          error?.response?.data?.systemCode === "ALREADY_SIGNED" ||
          error?.response?.data?.message
            ?.toLowerCase()
            .includes("already signed")
        ) {
          // Refetch agreement to get latest state
          const refetchResult = await refetchAgreement();
          return refetchResult.data || agreement;
        }
        // Re-throw other errors
        throw error;
      }
    },
    onSuccess: async (data) => {
      toast.success("Signature recorded successfully!");

      // Invalidate all agreement queries to refresh UI everywhere
      queryClient.invalidateQueries({
        queryKey: ["agreement"],
      });
      // Also invalidate specific queries by ID
      if (agreementId) {
        queryClient.invalidateQueries({
          queryKey: ["agreement", agreementId],
        });
      }
      if (treatmentId) {
        queryClient.invalidateQueries({
          queryKey: ["agreement", treatmentId],
        });
      }

      // Refetch agreement to get latest state
      await refetchAgreement();

      // Check if both signed
      const bothSigned =
        (data.signedByDoctor ?? data.doctorSigned) &&
        (data.signedByPatient ?? data.patientSigned);

      // If both signed, cycle should already be created by backend when treatment was created with autoCreate=true
      // Just invalidate queries to refresh cycle list
      if (bothSigned) {
        // Invalidate cycles query to show the cycle that was auto-created by backend
        queryClient.invalidateQueries({
          queryKey: ["doctor", "treatment-cycles"],
        });
        queryClient.invalidateQueries({
          queryKey: ["treatment-cycle"],
        });
        queryClient.invalidateQueries({
          queryKey: ["treatment", treatmentId],
        });

        console.log(
          `Treatment ${treatmentId} confirmed. Cycle should already exist (created by backend with autoCreate=true).`
        );
      }
    },
    onError: (error: any) => {
      // Don't show error if it's just that the agreement is already signed
      if (
        error?.response?.data?.systemCode === "ALREADY_SIGNED" ||
        error?.response?.data?.message?.toLowerCase().includes("already signed")
      ) {
        // This should be handled in mutationFn, but just in case
        toast.info("Agreement is already signed");
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({
          queryKey: ["agreement", agreementId || treatmentId],
        });
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to record signature"
        );
      }
    },
  });

  const handleDoctorSign = () => {
    if (!agreement?.id) {
      toast.error("Agreement not found. Please create agreement first.");
      return;
    }
    setIsSigning(true);
    signAgreementMutation.mutate(
      { signedBy: "doctor" },
      {
        onSettled: () => {
          setIsSigning(false);
        },
      }
    );
  };

  // Call onSigned after cycle is created
  // This hook MUST be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (bothSigned && onSigned) {
      // Small delay to ensure UI updates
      const timer = setTimeout(() => {
        onSigned();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bothSigned, onSigned]);

  if (agreementLoading || agreementFetching) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-center text-gray-500">Loading agreement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agreement) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-amber-600 mt-0.5"
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
                  <h3 className="text-sm font-semibold text-amber-800">
                    Agreement Not Found
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">
                    The agreement for this treatment plan could not be found.
                    This may happen if the agreement hasn't been created yet or
                    there was an error during creation.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => refetchAgreement()}
                disabled={agreementLoading || agreementFetching}
              >
                {agreementFetching ? "Retrying..." : "Retry"}
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Treatment Plan Signature Confirmation</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAgreementDocument(true)}
          >
            📄 View Agreement
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAgreement()}
            disabled={agreementLoading || agreementFetching}
          >
            {agreementFetching ? "Refreshing..." : "Refresh status"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            This {treatmentType} treatment plan requires patient confirmation
            before treatment cycles can be created. The doctor's signature has
            been automatically recorded when the plan was created. Please have
            the patient review and sign the treatment plan below.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Doctor Signature */}
          <Card className={doctorSigned ? "border-green-200 bg-green-50" : ""}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Doctor Signature
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getFullNameFromObject(user) || "Doctor"}
                  </p>
                </div>
                {doctorSigned ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700">
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
                      <span className="font-medium">
                        Pre-signed Automatically
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      The doctor's signature was automatically recorded when the
                      treatment plan was created.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleDoctorSign}
                    disabled={isSigning || patientSigned}
                    className="w-full"
                    title={
                      patientSigned
                        ? "Cannot sign as doctor when already signed on behalf of patient"
                        : ""
                    }
                  >
                    {isSigning ? "Signing..." : "Sign as Doctor"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient Signature */}
          <Card className={patientSigned ? "border-green-200 bg-green-50" : ""}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Patient Signature
                  </h3>
                  <p className="text-sm text-gray-600">
                    Patient confirmation required
                  </p>
                </div>
                {patientSigned ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700">
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
                      <span className="font-medium">Signed</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Patient has confirmed and signed the treatment plan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-600 font-medium">
                      ⚠️ Patient signature required
                    </p>
                    <p className="text-xs text-gray-500">
                      Patient needs to sign through their portal or in person.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {bothSigned && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">
                Treatment plan confirmed and approved! Default {treatmentType}{" "}
                cycle was created automatically when the treatment plan was
                saved.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              {bothSigned ? "Close" : "Cancel"}
            </Button>
          )}
          {bothSigned && onSigned && (
            <Button
              onClick={onSigned}
              className="bg-primary hover:bg-primary/90"
            >
              Next Step
            </Button>
          )}
        </div>
      </CardContent>

      {/* Agreement Document Modal */}
      <Modal
        isOpen={showAgreementDocument}
        onClose={() => setShowAgreementDocument(false)}
        title="Treatment Agreement Document"
        size="xl"
      >
        <AgreementDocument
          treatmentId={treatmentId}
          patientId={patientId}
          agreementId={agreementId}
          treatmentType={treatmentType}
          onClose={() => setShowAgreementDocument(false)}
        />
      </Modal>
    </Card>
  );
}
