/**
 * Agreement Document Component
 * Displays a printable agreement document for treatment plans
 */

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

interface AgreementDocumentProps {
  treatmentId: string;
  patientId: string;
  agreementId?: string;
  treatmentType: "IUI" | "IVF";
  onClose?: () => void;
}

export function AgreementDocument({
  treatmentId,
  patientId,
  agreementId,
  treatmentType,
  onClose,
}: AgreementDocumentProps) {
  const { user } = useAuth();
  const { data: doctorProfile } = useDoctorProfile();

  // Fetch agreement
  const { data: agreement } = useQuery({
    queryKey: ["agreement", agreementId || treatmentId],
    queryFn: async () => {
      if (agreementId) {
        const response = await api.agreement.getAgreementById(agreementId);
        return response.data;
      }
      const response = await api.agreement.getAgreements({
        TreatmentId: treatmentId,
        Size: 1,
      });
      return response.data && response.data.length > 0
        ? response.data[0]
        : null;
    },
    enabled: !!treatmentId,
  });

  // Fetch treatment
  const { data: treatment } = useQuery({
    queryKey: ["treatment", treatmentId],
    queryFn: async () => {
      const response = await api.treatment.getTreatmentById(treatmentId);
      return response.data;
    },
    enabled: !!treatmentId,
  });

  // Fetch patient details
  const { data: patientDetails } = usePatientDetails(patientId);

  // Fetch user details for patient
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", patientId],
    queryFn: async () => {
      const response = await api.user.getUserDetails(patientId);
      return response.data;
    },
    enabled: !!patientId,
  });

  // Get patient information
  const patientName =
    getFullNameFromObject(userDetails) ||
    getFullNameFromObject(patientDetails) ||
    userDetails?.userName ||
    (isPatientDetailResponse(patientDetails)
      ? patientDetails.accountInfo?.username
      : null) ||
    "N/A";
  const patientCode = patientDetails?.patientCode || "N/A";
  const nationalId = patientDetails?.nationalId || "N/A";
  const dateOfBirth = userDetails?.dob
    ? new Date(userDetails.dob).toLocaleDateString("en-US")
    : patientDetails?.dateOfBirth
      ? new Date(patientDetails.dateOfBirth).toLocaleDateString("en-US")
      : "N/A";
  const age = userDetails?.age ? `${userDetails.age} years old` : null;
  const gender =
    patientDetails?.gender ||
    (userDetails?.gender !== undefined
      ? userDetails.gender
        ? "Male"
        : "Female"
      : "N/A");
  const phone =
    (isPatientDetailResponse(patientDetails)
      ? patientDetails.accountInfo?.phone
      : null) ||
    userDetails?.phone ||
    userDetails?.phoneNumber ||
    patientDetails?.phoneNumber ||
    "N/A";
  const email =
    (isPatientDetailResponse(patientDetails)
      ? patientDetails.accountInfo?.email
      : null) ||
    userDetails?.email ||
    patientDetails?.email ||
    "N/A";
  const address =
    (isPatientDetailResponse(patientDetails)
      ? patientDetails.accountInfo?.address
      : null) ||
    userDetails?.location ||
    patientDetails?.address ||
    "N/A";

  // Get doctor information
  const doctorName =
    getFullNameFromObject(doctorProfile) ||
    getFullNameFromObject(user) ||
    user?.userName ||
    "N/A";
  const doctorCode = doctorProfile?.badgeId || "N/A";
  const doctorSpecialty = doctorProfile?.specialty || "N/A";
  const doctorLicense = doctorProfile?.badgeId || "N/A"; // Using badgeId as license number

  // Get treatment information
  const treatmentName = treatment?.treatmentName || "N/A";
  const treatmentCode = (() => {
    const code = treatment?.treatmentCode || treatment?.id;
    if (!code) return "N/A";
    // Get last 4 characters
    return code.length >= 4 ? code.slice(-4) : code;
  })();
  const startDate = treatment?.startDate
    ? new Date(treatment.startDate).toLocaleDateString("en-US")
    : "N/A";
  const endDate = treatment?.endDate
    ? new Date(treatment.endDate).toLocaleDateString("en-US")
    : "N/A";
  const goals = treatment?.goals || "N/A";

  // Get agreement information
  const agreementCode = agreement?.agreementCode || "N/A";
  const agreementStartDate = agreement?.startDate
    ? new Date(agreement.startDate).toLocaleDateString("en-US")
    : "N/A";
  const agreementEndDate = agreement?.endDate
    ? new Date(agreement.endDate).toLocaleDateString("en-US")
    : "N/A";
  const doctorSigned =
    agreement?.signedByDoctor ?? agreement?.doctorSigned ?? false;
  const patientSigned =
    agreement?.signedByPatient ?? agreement?.patientSigned ?? false;
  const doctorSignedDate = agreement?.doctorSignedDate
    ? new Date(agreement.doctorSignedDate).toLocaleDateString("en-US")
    : null;
  const patientSignedDate = agreement?.patientSignedDate
    ? new Date(agreement.patientSignedDate).toLocaleDateString("en-US")
    : null;

  const currentDate = new Date().toLocaleDateString("en-US");

  // Parse phases from treatment notes
  interface StructuredPhase {
    id?: string;
    phaseName?: string;
    phaseType?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    goals?: string;
    status?: string;
    cycleNumber?: number;
  }


  const parsePhases = (): StructuredPhase[] => {
    if (!treatment?.notes) return [];
    try {
      const parsed = JSON.parse(treatment.notes);
      if (parsed && Array.isArray(parsed.phases)) {
        return parsed.phases;
      }
    } catch {
      // If parsing fails, return empty array
    }
    return [];
  };

  const phases = parsePhases();

  // Check if data is still loading
  const isLoading = !treatment || !patientDetails || !agreement;

  // If data is loading, show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <div className="bg-white p-8 space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading agreement document...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="agreement-document">
      {/* Document content */}
      <div className="bg-white p-8 space-y-6">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold uppercase mb-2">
            Treatment Agreement Confirmation
          </h1>
          <p className="text-lg font-semibold">
            {treatmentType === "IVF"
              ? "In Vitro Fertilization (IVF)"
              : "Intrauterine Insemination (IUI)"}
          </p>
        </div>

        {/* Patient Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            I. PATIENT INFORMATION
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold">Full Name: </span>
              <span>{patientName}</span>
            </div>
            <div>
              <span className="font-semibold">Patient Code: </span>
              <span>{patientCode}</span>
            </div>
            <div>
              <span className="font-semibold">Citizen ID Card: </span>
              <span>{nationalId}</span>
            </div>
            <div>
              <span className="font-semibold">Date of Birth: </span>
              <span>
                {dateOfBirth}
                {age && ` (${age})`}
              </span>
            </div>
            <div>
              <span className="font-semibold">Gender: </span>
              <span>{gender}</span>
            </div>
            <div>
              <span className="font-semibold">Phone Number: </span>
              <span>{phone}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Email: </span>
              <span>{email}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Address: </span>
              <span>{address}</span>
            </div>
          </div>
        </section>

        {/* Doctor Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            II. TREATING PHYSICIAN INFORMATION
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold">Full Name: </span>
              <span>{doctorName}</span>
            </div>
            <div>
              <span className="font-semibold">Doctor Code: </span>
              <span>{doctorCode}</span>
            </div>
            <div>
              <span className="font-semibold">Specialty: </span>
              <span>{doctorSpecialty}</span>
            </div>
            <div>
              <span className="font-semibold">License Number: </span>
              <span>{doctorLicense}</span>
            </div>
          </div>
        </section>

        {/* Treatment Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            III. TREATMENT PLAN INFORMATION
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold">Treatment Plan Code: </span>
              <span>{treatmentCode}</span>
            </div>
            <div>
              <span className="font-semibold">Treatment Plan Name: </span>
              <span>{treatmentName}</span>
            </div>
            <div>
              <span className="font-semibold">Treatment Type: </span>
              <span>
                {treatmentType === "IVF"
                  ? "In Vitro Fertilization (IVF)"
                  : "Intrauterine Insemination (IUI)"}
              </span>
            </div>
            <div>
              <span className="font-semibold">Agreement Code: </span>
              <span>{agreementCode}</span>
            </div>
            <div>
              <span className="font-semibold">Start Date: </span>
              <span>{startDate}</span>
            </div>
            <div>
              <span className="font-semibold">Expected End Date: </span>
              <span>{endDate}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Treatment Goals: </span>
              <div className="mt-1 whitespace-pre-wrap">{goals}</div>
            </div>
          </div>
        </section>

        {/* Treatment Phases */}
        {phases.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
              IV. TREATMENT PHASES
            </h2>
            <div className="space-y-3">
              {phases.map((phase, index) => {
                const phaseStartDate = phase.startDate
                  ? new Date(phase.startDate).toLocaleDateString("en-US")
                  : "N/A";
                const phaseEndDate = phase.endDate
                  ? new Date(phase.endDate).toLocaleDateString("en-US")
                  : "N/A";
                return (
                  <div
                    key={phase.id || index}
                    className="border border-gray-200 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">
                          Phase {index + 1}: {phase.phaseName || "Unnamed Phase"}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {phase.phaseType || "Treatment phase"}
                          {phase.cycleNumber !== undefined
                            ? ` • Cycle #${phase.cycleNumber}`
                            : ""}
                          {phase.status && ` • Status: ${phase.status}`}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div>
                        <span className="font-semibold">Start Date: </span>
                        <span>{phaseStartDate}</span>
                      </div>
                      <div>
                        <span className="font-semibold">End Date: </span>
                        <span>{phaseEndDate}</span>
                      </div>
                    </div>
                    {phase.description && (
                      <div className="mt-2">
                        <span className="font-semibold text-sm">Description: </span>
                        <p className="text-sm text-gray-700 mt-1">
                          {phase.description}
                        </p>
                      </div>
                    )}
                    {phase.goals && (
                      <div className="mt-2">
                        <span className="font-semibold text-sm">Goals: </span>
                        <p className="text-sm text-gray-700 mt-1">
                          {phase.goals}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Agreement Terms */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            {phases.length > 0 ? "V. TERMS AND CONDITIONS" : "IV. TERMS AND CONDITIONS"}
          </h2>
          <div className="text-sm space-y-2">
            <p>
              <span className="font-semibold">1. </span>
              The patient has been fully informed about the treatment procedure,
              potential risks, and complications that may occur.
            </p>
            <p>
              <span className="font-semibold">2. </span>
              The patient agrees to undergo tests and procedures as prescribed
              by the physician.
            </p>
            <p>
              <span className="font-semibold">3. </span>
              The patient commits to strictly follow the appointment schedule
              and treatment instructions.
            </p>
            <p>
              <span className="font-semibold">4. </span>
              The patient understands that treatment outcomes depend on many
              factors and cannot guarantee 100% success.
            </p>
            <p>
              <span className="font-semibold">5. </span>
              Agreement validity period: From {agreementStartDate} to{" "}
              {agreementEndDate}.
            </p>
          </div>
        </section>

        {/* Signatures */}
        <section className="space-y-4 mt-8">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">
            {phases.length > 0 ? "VI. ACKNOWLEDGMENT" : "V. ACKNOWLEDGMENT"}
          </h2>
          <div className="grid grid-cols-2 gap-8 mt-6">
            {/* Doctor Signature */}
            <div className="text-center space-y-2">
              <div className="h-20 border-b-2 border-gray-400 mb-2"></div>
              <p className="font-semibold text-sm">{doctorName}</p>
              <p className="text-xs text-gray-600">Treating Physician</p>
              {doctorSigned && doctorSignedDate && (
                <p className="text-xs text-gray-500">
                  Signed on: {doctorSignedDate}
                </p>
              )}
              {!doctorSigned && (
                <p className="text-xs text-red-500">Not signed</p>
              )}
            </div>

            {/* Patient Signature */}
            <div className="text-center space-y-2">
              <div className="h-20 border-b-2 border-gray-400 mb-2"></div>
              <p className="font-semibold text-sm">{patientName}</p>
              <p className="text-xs text-gray-600">Patient</p>
              {patientSigned && patientSignedDate && (
                <p className="text-xs text-gray-500">
                  Signed on: {patientSignedDate}
                </p>
              )}
              {!patientSigned && (
                <p className="text-xs text-red-500">Not signed</p>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
          <p>Document Date: {currentDate}</p>
          <p className="mt-1">
            This agreement document has legal validity and is stored in the
            electronic medical records system.
          </p>
        </div>
      </div>
    </div>
  );
}
