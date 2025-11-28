/**
 * Treatment View Modal Component
 * Modal to view detailed treatment information and related documents
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/api/client";
import { isAxiosError } from "axios";
import { TreatmentDetailForm } from "./TreatmentDetailForm";
import { AgreementDocument } from "@/features/doctor/treatment-cycles/AgreementDocument";
import { getLast4Chars } from "@/utils/id-helpers";

interface TreatmentViewModalProps {
  treatmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TreatmentViewModal({
  treatmentId,
  isOpen,
  onClose,
}: TreatmentViewModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "agreement">(
    "details"
  );
  const [showAgreementDocument, setShowAgreementDocument] = useState(false);

  // Fetch treatment basic info to determine type
  const { data: treatmentData } = useQuery({
    queryKey: ["treatment", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return null;
      const response = await api.treatment.getTreatmentById(treatmentId);
      return response.data;
    },
    enabled: !!treatmentId && isOpen,
    retry: false,
  });

  // Fetch agreement for IUI/IVF treatments
  const { data: agreement } = useQuery({
    queryKey: ["agreement", treatmentId],
    queryFn: async () => {
      if (
        !treatmentId ||
        (treatmentData?.treatmentType !== "IUI" &&
          treatmentData?.treatmentType !== "IVF")
      ) {
        return null;
      }
      try {
        const response = await api.agreement.getAgreements({
          TreatmentId: treatmentId,
          Size: 1,
        });
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        return null;
      }
    },
    enabled:
      !!treatmentId &&
      isOpen &&
      (treatmentData?.treatmentType === "IUI" ||
        treatmentData?.treatmentType === "IVF"),
    retry: false,
  });

  const treatmentType = treatmentData?.treatmentType;
  const isIUIOrIVF = treatmentType === "IUI" || treatmentType === "IVF";

  if (!treatmentId) {
    return null;
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Treatment Details"
        description={`View detailed information for treatment ${
          treatmentData?.treatmentCode || getLast4Chars(treatmentId)
        }`}
        size="2xl"
      >
        <div className="space-y-4">
          {/* Tab Navigation */}
          {isIUIOrIVF && (
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === "details"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  Treatment Details
                </button>
                {agreement && (
                  <button
                    onClick={() => setActiveTab("agreement")}
                    className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                      activeTab === "agreement"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    Agreement Document
                  </button>
                )}
              </nav>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "details" && (
            <div>
              <TreatmentDetailForm
                treatmentId={treatmentId}
                layout="modal"
                onClose={onClose}
              />
            </div>
          )}

          {activeTab === "agreement" && agreement && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agreement Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Agreement Code
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {(agreement as any).agreementCode || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Status
                      </p>
                      <p className="text-sm text-gray-700">
                        {(agreement as any).statusName ||
                          (agreement as any).status ||
                          "N/A"}
                      </p>
                    </div>
                    {(agreement as any).startDate && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Start Date
                        </p>
                        <p className="text-sm text-gray-700">
                          {new Date(
                            (agreement as any).startDate
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    )}
                    {(agreement as any).endDate && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          End Date
                        </p>
                        <p className="text-sm text-gray-700">
                          {new Date(
                            (agreement as any).endDate
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div
                      className={`rounded-lg border p-4 ${
                        ((agreement as any).signedByDoctor ??
                        (agreement as any).doctorSigned)
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
                            {((agreement as any).signedByDoctor ??
                            (agreement as any).doctorSigned)
                              ? "Signed"
                              : "Pending"}
                          </p>
                        </div>
                        {((agreement as any).signedByDoctor ??
                        (agreement as any).doctorSigned) ? (
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
                        ((agreement as any).signedByPatient ??
                        (agreement as any).patientSigned)
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
                            {((agreement as any).signedByPatient ??
                            (agreement as any).patientSigned)
                              ? "Signed"
                              : "Pending"}
                          </p>
                        </div>
                        {((agreement as any).signedByPatient ??
                        (agreement as any).patientSigned) ? (
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

                  <div className="pt-4">
                    <Button
                      onClick={() => setShowAgreementDocument(true)}
                      variant="outline"
                      className="w-full"
                    >
                      View & Print Agreement Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Agreement Document Modal */}
      {showAgreementDocument && agreement && treatmentData && (
        <Modal
          isOpen={showAgreementDocument}
          onClose={() => setShowAgreementDocument(false)}
          title="Agreement Document"
          description="View and print the treatment agreement document"
          size="2xl"
        >
          <AgreementDocument
            agreementId={agreement.id}
            treatmentId={treatmentId}
            patientId={treatmentData.patientId}
            treatmentType={treatmentData.treatmentType as "IUI" | "IVF"}
            onClose={() => setShowAgreementDocument(false)}
          />
        </Modal>
      )}
    </>
  );
}
