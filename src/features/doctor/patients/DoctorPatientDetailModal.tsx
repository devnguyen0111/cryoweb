import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import type { Patient } from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface DoctorPatientDetailModalProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFullProfile?: (patientId: string) => void;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
  placeholder?: string;
  multiline?: boolean;
}

function DetailField({
  label,
  value,
  placeholder = "—",
  multiline,
}: DetailFieldProps) {
  const displayValue =
    value === null || value === undefined || value === ""
      ? placeholder
      : String(value);

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div
        className={cn(
          "rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
          multiline ? "whitespace-pre-wrap leading-relaxed" : ""
        )}
      >
        {displayValue}
      </div>
    </div>
  );
}

export function DoctorPatientDetailModal({
  patientId,
  isOpen,
  onClose,
  onOpenFullProfile,
}: DoctorPatientDetailModalProps) {
  const {
    data: patient,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery<Patient | null>({
    enabled: isOpen && Boolean(patientId),
    queryKey: ["doctor", "patient", patientId, "detail-modal"],
    retry: false,
    queryFn: async () => {
      if (!patientId) {
        return null;
      }
      try {
        const response = await api.patient.getPatientById(patientId);
        return response.data ?? null;
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response?.status === 403) {
            const fallback = await api.patient.getPatientDetails(patientId);
            return fallback.data ?? null;
          }
          if (err.response?.status === 404) {
            return null;
          }
        }
        throw err;
      }
    },
  });

  const accountStatus = useMemo(() => {
    if (!patient) {
      return null;
    }
    const isActive = patient.isActive ?? patient.accountInfo?.isActive ?? false;
    return {
      label: isActive ? "Active" : "Inactive",
      tone: isActive
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-gray-200 bg-gray-100 text-gray-600",
    };
  }, [patient]);

  const verificationStatus = useMemo(() => {
    if (!patient) {
      return null;
    }
    const isVerified = patient.accountInfo?.isVerified ?? false;
    return {
      label: isVerified ? "Verified" : "Not verified",
      tone: isVerified
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700",
    };
  }, [patient]);

  const handleOpenFullProfile = useCallback(() => {
    if (!patientId) {
      return;
    }
    onClose();
    onOpenFullProfile?.(patientId);
  }, [onClose, onOpenFullProfile, patientId]);

  return (
    <Modal
      title="Patient quick view"
      description="Review essential information before opening the full record."
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      {isLoading || isFetching ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading patient information...
        </div>
      ) : isError ? (
        <div className="space-y-4 py-6 text-center text-sm text-red-600">
          <p>Unable to load patient information. Please try again later.</p>
          <p className="text-xs text-gray-500">
            {(error as Error)?.message ?? "An unexpected error occurred."}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : !patient ? (
        <div className="space-y-4 py-6 text-center text-sm text-gray-500">
          <p>Patient information is not available.</p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {patient.fullName ||
                    patient.accountInfo?.username ||
                    patient.patientCode ||
                    "Patient"}
                </h3>
                <p className="text-sm text-gray-500">
                  Patient code: {patient.patientCode ?? "—"}
                </p>
                <p className="text-sm text-gray-500">
                  Account ID: {patient.accountId ?? "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {accountStatus ? (
                  <Badge variant="outline" className={accountStatus.tone}>
                    {accountStatus.label}
                  </Badge>
                ) : null}
                {verificationStatus ? (
                  <Badge variant="outline" className={verificationStatus.tone}>
                    {verificationStatus.label}
                  </Badge>
                ) : null}
                {patient.bloodType ? (
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-50 text-purple-700"
                  >
                    Blood type: {patient.bloodType}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleOpenFullProfile}>
                Open full patient record
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close preview
              </Button>
            </div>
          </section>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailField label="Full name" value={patient.fullName} />
              <DetailField
                label="Date of birth"
                value={formatDate(patient.dateOfBirth)}
              />
              <DetailField label="Gender" value={patient.gender} />
              <DetailField label="Age" value={patient.age} />
              <DetailField label="National ID" value={patient.nationalId} />
              <DetailField
                label="Occupation"
                value={patient.occupation}
                placeholder="Not provided"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Contact & coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailField
                label="Email"
                value={patient.accountInfo?.email ?? patient.email}
                placeholder="Not provided"
              />
              <DetailField
                label="Phone number"
                value={patient.accountInfo?.phone ?? patient.phoneNumber}
                placeholder="Not provided"
              />
              <DetailField
                label="Address"
                value={patient.accountInfo?.address ?? patient.address}
                placeholder="Not provided"
                multiline
              />
              <DetailField
                label="Insurance"
                value={patient.insurance}
                placeholder="Not provided"
              />
              <DetailField
                label="Emergency contact"
                value={patient.emergencyContact}
                placeholder="Not provided"
              />
              <DetailField
                label="Emergency phone"
                value={patient.emergencyPhone}
                placeholder="Not provided"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Vital stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <DetailField
                label="Height"
                value={
                  patient.height !== null && patient.height !== undefined
                    ? `${patient.height} cm`
                    : null
                }
                placeholder="Not recorded"
              />
              <DetailField
                label="Weight"
                value={
                  patient.weight !== null && patient.weight !== undefined
                    ? `${patient.weight} kg`
                    : null
                }
                placeholder="Not recorded"
              />
              <DetailField
                label="BMI"
                value={
                  patient.bmi !== null && patient.bmi !== undefined
                    ? patient.bmi.toFixed(1)
                    : null
                }
                placeholder="Not recorded"
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                Medical notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailField
                label="Medical history"
                value={patient.medicalHistory}
                placeholder="Not provided"
                multiline
              />
              <DetailField
                label="Allergies"
                value={patient.allergies}
                placeholder="Not provided"
                multiline
              />
              <DetailField
                label="Notes"
                value={patient.notes}
                placeholder="No additional notes"
                multiline
              />
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-gray-900">
                System insights
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailField
                label="Treatment cycles"
                value={patient.treatmentCount}
                placeholder="0"
              />
              <DetailField
                label="Lab samples"
                value={patient.labSampleCount}
                placeholder="0"
              />
              <DetailField
                label="Relationships on file"
                value={patient.relationshipCount}
                placeholder="0"
              />
              <DetailField
                label="Created at"
                value={formatDateTime(patient.createdAt)}
              />
              <DetailField
                label="Last updated"
                value={formatDateTime(patient.updatedAt)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </Modal>
  );
}
