import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import type {
  LabSampleSperm,
  Patient,
  PatientDetailResponse,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { cn } from "@/utils/cn";
import { getLast4Chars } from "@/utils/id-helpers";

interface SpermSampleDetailModalProps {
  sampleId: string;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value?: number | null, unit?: string) => {
  if (value === null || value === undefined) return "—";
  return unit ? `${value} ${unit}` : String(value);
};

const getStatusBadgeClass = (status: string) => {
  const statusClasses: Record<string, string> = {
    Collected: "bg-blue-100 text-blue-800 border-blue-200",
    Processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Stored: "bg-green-100 text-green-800 border-green-200",
    Used: "bg-purple-100 text-purple-800 border-purple-200",
    Discarded: "bg-red-100 text-red-800 border-red-200",
  };
  return statusClasses[status] || "bg-gray-100 text-gray-800 border-gray-200";
};

export function SpermSampleDetailModal({
  sampleId,
  isOpen,
  onClose,
}: SpermSampleDetailModalProps) {
  const { data: sample, isLoading: sampleLoading } =
    useQuery<LabSampleSperm | null>({
      enabled: isOpen && Boolean(sampleId),
      queryKey: ["sperm-sample", "detail", sampleId],
      retry: false,
      queryFn: async () => {
        if (!sampleId) return null;
        try {
          const response = await api.sample.getSampleById(sampleId);
          const sampleData = response.data;
          // Type guard to ensure it's a sperm sample
          if (sampleData && sampleData.sampleType === "Sperm") {
            return sampleData as LabSampleSperm;
          }
          return null;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
    });

  // Fetch patient information
  const { data: patient, isLoading: patientLoading } = useQuery<
    Patient | PatientDetailResponse | null
  >({
    enabled: isOpen && Boolean(sample?.patientId),
    queryKey: ["patient", sample?.patientId, "sperm-sample-detail"],
    retry: false,
    queryFn: async () => {
      if (!sample?.patientId) return null;
      try {
        const response = await api.patient.getPatientById(sample.patientId);
        return response.data ?? null;
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response?.status === 403) {
            try {
              const fallback = await api.patient.getPatientDetails(
                sample.patientId
              );
              return fallback.data ?? null;
            } catch {
              return null;
            }
          }
          if (err.response?.status === 404) {
            return null;
          }
        }
        return null;
      }
    },
  });

  const isLoading = sampleLoading || patientLoading;

  // Check if sample has quality assessment data
  const hasQualityData =
    sample &&
    (sample.volume !== undefined ||
      sample.concentration !== undefined ||
      sample.motility !== undefined ||
      sample.morphology !== undefined);

  const patientName = patient
    ? getFullNameFromObject(patient) ||
      (patient as PatientDetailResponse)?.accountInfo?.username ||
      (patient as Patient)?.patientCode ||
      "—"
    : "—";

  return (
    <Modal
      title="Sperm Sample Details"
      description="Information about the assessed sperm sample"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {isLoading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading sample information...
        </div>
      ) : !sample ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Sample not found.</p>
          <p className="text-xs text-gray-500">
            The sample may have been deleted or does not exist.
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Sample Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sample Information</CardTitle>
                <Badge
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold border",
                    getStatusBadgeClass(sample.status)
                  )}
                >
                  {sample.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sample Code
                  </label>
                  <p className="text-sm font-mono text-gray-900">
                    {sample.sampleCode || getLast4Chars(sample.id)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sample ID
                  </label>
                  <p className="text-sm font-mono text-gray-900">
                    {getLast4Chars(sample.id)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Collection Date
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(sample.collectionDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </label>
                  <p className="text-sm text-gray-900">{sample.status}</p>
                </div>
                {sample.createdAt && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900">
                      {formatDate(sample.createdAt)}
                    </p>
                  </div>
                )}
                {sample.updatedAt && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-900">
                      {formatDate(sample.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Patient Name
                  </label>
                  <p className="text-sm text-gray-900">{patientName}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Patient Code
                  </label>
                  <p className="text-sm font-mono text-gray-900">
                    {(patient as PatientDetailResponse)?.patientCode ||
                      (patient as Patient)?.patientCode ||
                      getLast4Chars(sample.patientId)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Assessment */}
          {hasQualityData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Quality Assessment Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Volume (mL)
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(sample.volume, "mL")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Concentration (million/mL)
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(sample.concentration, "million/mL")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Motility (%)
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(sample.motility, "%")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Morphology (% normal forms)
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(sample.morphology, "%")}
                    </p>
                  </div>
                </div>

                {/* Quality Summary */}
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Assessment Summary
                  </h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    {sample.volume !== undefined && (
                      <p>
                        • Volume: {sample.volume} mL
                        {sample.volume >= 1.5 && sample.volume <= 5 ? (
                          <span className="ml-2 text-green-600">(Normal)</span>
                        ) : (
                          <span className="ml-2 text-yellow-600">
                            (Needs Attention)
                          </span>
                        )}
                      </p>
                    )}
                    {sample.concentration !== undefined && (
                      <p>
                        • Concentration: {sample.concentration} million/mL
                        {sample.concentration >= 15 ? (
                          <span className="ml-2 text-green-600">(Normal)</span>
                        ) : (
                          <span className="ml-2 text-yellow-600">
                            (Needs Attention)
                          </span>
                        )}
                      </p>
                    )}
                    {sample.motility !== undefined && (
                      <p>
                        • Motility: {sample.motility}%
                        {sample.motility >= 40 ? (
                          <span className="ml-2 text-green-600">(Normal)</span>
                        ) : (
                          <span className="ml-2 text-yellow-600">
                            (Needs Attention)
                          </span>
                        )}
                      </p>
                    )}
                    {sample.morphology !== undefined && (
                      <p>
                        • Morphology: {sample.morphology}% normal forms
                        {sample.morphology >= 4 ? (
                          <span className="ml-2 text-green-600">(Normal)</span>
                        ) : (
                          <span className="ml-2 text-yellow-600">
                            (Needs Attention)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {sample.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {sample.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Treatment Cycle Info */}
          {sample.treatmentCycleId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treatment Cycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Treatment Cycle ID
                  </label>
                  <p className="text-sm font-mono text-gray-900">
                    {getLast4Chars(sample.treatmentCycleId)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
}
