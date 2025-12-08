import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import type {
  Patient,
  PatientDetailResponse,
  UserDetailResponse,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { StructuredNote } from "@/components/StructuredNote";
import { getLast4Chars } from "@/utils/id-helpers";

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
  } = useQuery<Patient | PatientDetailResponse | null>({
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

  const patientDetail = useMemo(() => {
    return patient && "accountInfo" in patient
      ? (patient as PatientDetailResponse)
      : null;
  }, [patient]);

  // Fetch user/account details to get dob, gender, and fullName
  const accountId = patient?.accountId || patientId;
  const {
    data: userDetails,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useQuery<UserDetailResponse | null>({
    enabled: isOpen && Boolean(accountId),
    queryKey: ["doctor", "user-details", accountId, "patient-detail-modal"],
    retry: false,
    queryFn: async () => {
      if (!accountId) return null;
      try {
        const response = await api.user.getUserDetails(accountId);
        return response.data ?? null;
      } catch (error) {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 || error.response?.status === 403)
        ) {
          return null;
        }
        console.warn("Failed to fetch user details:", error);
        return null;
      }
    },
  });

  // Merge patient data with user details
  const mergedPatient = useMemo(() => {
    if (!patient) return null;

    // Get full name from user details or patient
    const fullName =
      userDetails?.fullName ||
      userDetails?.userName ||
      patientDetail?.accountInfo?.username ||
      patient.fullName ||
      patient.patientCode ||
      "Patient";

    // Get date of birth from user details or patient
    const dateOfBirth = userDetails?.dob
      ? userDetails.dob
      : patient.dateOfBirth || null;

    // Get gender from user details (boolean: true = Male, false = Female) or patient
    const gender =
      userDetails?.gender !== undefined
        ? userDetails.gender
          ? "Male"
          : "Female"
        : patient.gender || null;

    return {
      ...patient,
      fullName,
      dateOfBirth,
      gender,
    };
  }, [patient, patientDetail, userDetails]);

  const accountStatus = useMemo(() => {
    if (!patient) {
      return null;
    }
    const isActive =
      patient.isActive ?? patientDetail?.accountInfo?.isActive ?? false;
    return {
      label: isActive ? "Active" : "Inactive",
      tone: isActive
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-gray-200 bg-gray-100 text-gray-600",
    };
  }, [patient, patientDetail]);

  const verificationStatus = useMemo(() => {
    if (!patientDetail) {
      return null;
    }
    const isVerified = patientDetail.accountInfo?.isVerified ?? false;
    return {
      label: isVerified ? "Verified" : "Not verified",
      tone: isVerified
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700",
    };
  }, [patientDetail]);

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
      {isLoading || isFetching || userLoading || userFetching ? (
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
      ) : !mergedPatient ? (
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
                  {mergedPatient.fullName}
                </h3>
                <p className="text-sm text-gray-500">
                  Patient code: {mergedPatient.patientCode ?? "—"}
                </p>
                <p className="text-sm text-gray-500">
                  Account ID: {getLast4Chars(mergedPatient.accountId)}
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
                {mergedPatient.bloodType ? (
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-50 text-purple-700"
                  >
                    Blood type: {mergedPatient.bloodType}
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
              <DetailField label="Full name" value={mergedPatient.fullName} />
              <DetailField
                label="Date of birth"
                value={formatDate(mergedPatient.dateOfBirth)}
              />
              <DetailField label="Gender" value={mergedPatient.gender} />
              <DetailField
                label="National ID"
                value={mergedPatient.nationalId}
              />
              <DetailField
                label="Occupation"
                value={patientDetail?.occupation}
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
                value={patientDetail?.accountInfo?.email ?? mergedPatient.email}
                placeholder="Not provided"
              />
              <DetailField
                label="Phone number"
                value={
                  patientDetail?.accountInfo?.phone ?? mergedPatient.phoneNumber
                }
                placeholder="Not provided"
              />
              <DetailField
                label="Address"
                value={
                  patientDetail?.accountInfo?.address ?? mergedPatient.address
                }
                placeholder="Not provided"
                multiline
              />
              <DetailField
                label="Insurance"
                value={patientDetail?.insurance}
                placeholder="Not provided"
              />
              <DetailField
                label="Emergency contact"
                value={patientDetail?.emergencyContact}
                placeholder="Not provided"
              />
              <DetailField
                label="Emergency phone"
                value={patientDetail?.emergencyPhone}
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
                  patientDetail?.height !== null &&
                  patientDetail?.height !== undefined
                    ? `${patientDetail.height} cm`
                    : null
                }
                placeholder="Not recorded"
              />
              <DetailField
                label="Weight"
                value={
                  patientDetail?.weight !== null &&
                  patientDetail?.weight !== undefined
                    ? `${patientDetail.weight} kg`
                    : null
                }
                placeholder="Not recorded"
              />
              <DetailField
                label="BMI"
                value={
                  patientDetail?.bmi !== null &&
                  patientDetail?.bmi !== undefined
                    ? patientDetail.bmi.toFixed(1)
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
                value={patientDetail?.medicalHistory}
                placeholder="Not provided"
                multiline
              />
              <DetailField
                label="Allergies"
                value={patientDetail?.allergies}
                placeholder="Not provided"
                multiline
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Notes
                </p>
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                  {patientDetail?.notes ? (
                    <StructuredNote note={patientDetail.notes} />
                  ) : (
                    <p className="text-sm text-gray-500">No additional notes</p>
                  )}
                </div>
              </div>
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
                value={patientDetail?.treatmentCount}
                placeholder="0"
              />
              <DetailField
                label="Lab samples"
                value={patientDetail?.labSampleCount}
                placeholder="0"
              />
              <DetailField
                label="Relationships on file"
                value={patientDetail?.relationshipCount}
                placeholder="0"
              />
              <DetailField
                label="Created at"
                value={formatDateTime(mergedPatient.createdAt)}
              />
              <DetailField
                label="Last updated"
                value={formatDateTime(mergedPatient.updatedAt)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </Modal>
  );
}
