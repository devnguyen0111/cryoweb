import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { getLast4Chars } from "@/utils/id-helpers";

interface PrescriptionDetailModalProps {
  prescriptionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PrescriptionDetailModal({
  prescriptionId,
  isOpen,
  onClose,
}: PrescriptionDetailModalProps) {
  const { data: prescriptionDetail, isLoading } = useQuery({
    queryKey: ["prescription-detail", prescriptionId],
    queryFn: async () => {
      if (!prescriptionId) throw new Error("No prescription ID");
      const response = await api.prescription.getPrescriptionById(
        prescriptionId
      );
      return response.data;
    },
    enabled: !!prescriptionId && isOpen,
    retry: false,
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prescription Details"
      description="View complete prescription information and medications"
      size="xl"
    >
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">
          Loading prescription details...
        </div>
      ) : prescriptionDetail ? (
        <div className="space-y-6">
          {/* Prescription Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prescription Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Prescription ID
                  </label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono">
                    {getLast4Chars(prescriptionDetail.id)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        prescriptionDetail.isFilled
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {prescriptionDetail.isFilled ? "Filled" : "Pending"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Prescription Date
                  </label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {formatDate(prescriptionDetail.prescriptionDate)}
                  </div>
                </div>
                {prescriptionDetail.filledDate && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Filled Date
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      {formatDate(prescriptionDetail.filledDate)}
                    </div>
                  </div>
                )}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medical Record ID
                  </label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono">
                    {getLast4Chars(prescriptionDetail.medicalRecordId)}
                  </div>
                </div>
                {prescriptionDetail.diagnosis && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Diagnosis
                    </label>
                    <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-sm">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {prescriptionDetail.diagnosis}
                      </p>
                    </div>
                  </div>
                )}
                {prescriptionDetail.instructions && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Instructions
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {prescriptionDetail.instructions}
                      </p>
                    </div>
                  </div>
                )}
                {prescriptionDetail.notes && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {prescriptionDetail.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medications</CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptionDetail.prescriptionDetails &&
              prescriptionDetail.prescriptionDetails.length > 0 ? (
                <div className="space-y-4">
                  {prescriptionDetail.prescriptionDetails.map(
                    (detail, index) => (
                      <div
                        key={detail.id || index}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {detail.medicineName || "Unknown Medicine"}
                              {detail.form && ` (${detail.form})`}
                            </h4>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 text-sm">
                            {detail.dosage && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Dosage:{" "}
                                </span>
                                <span className="text-gray-600">
                                  {detail.dosage}
                                </span>
                              </div>
                            )}
                            {detail.frequency && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Frequency:{" "}
                                </span>
                                <span className="text-gray-600">
                                  {detail.frequency}
                                </span>
                              </div>
                            )}
                            {detail.durationDays && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Duration:{" "}
                                </span>
                                <span className="text-gray-600">
                                  {detail.durationDays} days
                                </span>
                              </div>
                            )}
                            {detail.quantity && (
                              <div>
                                <span className="font-medium text-gray-700">
                                  Quantity:{" "}
                                </span>
                                <span className="text-gray-600">
                                  {detail.quantity}
                                </span>
                              </div>
                            )}
                          </div>
                          {detail.instructions && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">
                                Instructions:{" "}
                              </span>
                              <span className="text-gray-600">
                                {detail.instructions}
                              </span>
                            </div>
                          )}
                          {detail.notes && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">
                                Notes:{" "}
                              </span>
                              <span className="text-gray-600">{detail.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-gray-500">
                  No medications found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          Prescription not found
        </div>
      )}
    </Modal>
  );
}

