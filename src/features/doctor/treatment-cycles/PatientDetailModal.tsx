/**
 * Patient Detail Modal Component
 * Displays comprehensive patient information including:
 * - Patient details
 * - Appointment history
 * - Treatments
 * - Treatment cycles
 * - Treatment IVF/IUI details
 * - Medical records
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/utils/cn";
import {
  normalizeTreatmentCycleStatus,
  type PatientDetailResponse,
  type Appointment,
  type Treatment,
  type TreatmentCycle,
  type TreatmentIUI,
  type TreatmentIVF,
  type MedicalRecord,
  type MedicalRecordDetailResponse,
} from "@/api/types";
import { TreatmentCycleStatusBadge } from "@/components/treatment-cycle-status-badge";
import { useNavigate } from "@tanstack/react-router";
import { getAppointmentStatusBadgeClass } from "@/utils/status-colors";

interface PatientDetailModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | "overview"
  | "appointments"
  | "treatments"
  | "cycles"
  | "medical";

export function PatientDetailModal({
  patientId,
  isOpen,
  onClose,
}: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Fetch patient details
  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", patientId],
    queryFn: async () => {
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: isOpen && !!patientId,
  });

  const { data: userDetails } = useQuery({
    queryKey: ["user-details", patientId],
    queryFn: async () => {
      try {
        const response = await api.user.getUserDetails(patientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: isOpen && !!patientId,
  });

  // Fetch appointments history
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", "patient-history", patientId],
    queryFn: async () => {
      try {
        const response = await api.appointment.getAppointments({
          patientId: patientId,
          pageNumber: 1,
          pageSize: 50,
        });
        const appointments = response.data || [];
        // Filter appointments to ensure they belong to this specific patient
        // This prevents counting appointments from other patients if API doesn't filter correctly
        const filteredAppointments = appointments.filter((apt) => {
          // Check multiple possible field names for patientId
          const aptPatientId =
            apt.patientId ||
            (apt as any).patientID ||
            (apt as any).PatientId ||
            (apt as any).PatientID ||
            (apt as any).patient?.id ||
            (apt as any).patient?.patientId ||
            (apt as any).patientAccountId ||
            (apt as any).patientAccountID;
          return aptPatientId === patientId;
        });
        return filteredAppointments.sort((a, b) => {
          const aDate = new Date(a.appointmentDate || "").getTime();
          const bDate = new Date(b.appointmentDate || "").getTime();
          return bDate - aDate;
        });
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!patientId,
  });

  // Fetch treatments
  const { data: treatmentsData, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["treatments", "patient", patientId],
    queryFn: async () => {
      try {
        const response = await api.treatment.getTreatments({
          patientId: patientId,
          pageNumber: 1,
          pageSize: 50,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!patientId,
  });

  // Fetch treatment cycles
  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ["treatment-cycles", "patient", patientId],
    queryFn: async () => {
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          patientId: patientId,
          Page: 1,
          Size: 50,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!patientId,
  });

  // Fetch IUI treatments
  const { data: iuiTreatmentsData, isLoading: iuiLoading } = useQuery({
    queryKey: ["iui-treatments", "patient", patientId],
    queryFn: async () => {
      try {
        const response = await api.treatmentIUI.getIUIByPatientId(patientId);
        if (Array.isArray(response)) {
          return response;
        }
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!patientId,
  });

  // Fetch IVF treatments
  const { data: ivfTreatmentsData, isLoading: ivfLoading } = useQuery({
    queryKey: ["ivf-treatments", "patient", patientId],
    queryFn: async () => {
      try {
        const response = await api.treatmentIVF.getIVFByPatientId(patientId);
        if (Array.isArray(response)) {
          return response;
        }
        if (response.data && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: isOpen && !!patientId,
  });

  if (!isOpen) return null;

  const patientName =
    patientDetails?.accountInfo?.username ||
    userDetails?.fullName ||
    userDetails?.userName ||
    "Unknown";

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "appointments", label: "Appointments" },
    { id: "treatments", label: "Treatments" },
    { id: "cycles", label: "Treatment Cycles" },
    { id: "medical", label: "Medical Records" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Patient Details
            </h2>
            <p className="text-sm text-gray-600">{patientName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(90vh - 140px)" }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              patientDetails={patientDetails}
              userDetails={userDetails}
              appointmentsCount={appointmentsData?.length || 0}
              treatmentsCount={treatmentsData?.length || 0}
              cyclesCount={cyclesData?.length || 0}
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointmentsData || []}
              isLoading={appointmentsLoading}
            />
          )}

          {activeTab === "treatments" && (
            <TreatmentsTab
              treatments={treatmentsData || []}
              iuiTreatments={iuiTreatmentsData || []}
              ivfTreatments={ivfTreatmentsData || []}
              isLoading={treatmentsLoading || iuiLoading || ivfLoading}
            />
          )}

          {activeTab === "cycles" && (
            <CyclesTab cycles={cyclesData || []} isLoading={cyclesLoading} />
          )}

          {activeTab === "medical" && (
            <MedicalRecordsTab patientId={patientId} />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  patientDetails,
  userDetails,
  appointmentsCount,
  treatmentsCount,
  cyclesCount,
}: {
  patientDetails: PatientDetailResponse | null | undefined;
  userDetails: any;
  appointmentsCount: number;
  treatmentsCount: number;
  cyclesCount: number;
}) {
  const patientName =
    patientDetails?.accountInfo?.username ||
    userDetails?.fullName ||
    userDetails?.userName ||
    "Unknown";
  const patientCode = patientDetails?.patientCode;
  const age = userDetails?.age;
  const gender =
    userDetails?.gender !== undefined
      ? userDetails.gender
        ? "Male"
        : "Female"
      : patientDetails?.gender || null;
  const phone =
    patientDetails?.accountInfo?.phone ||
    userDetails?.phone ||
    userDetails?.phoneNumber ||
    patientDetails?.phoneNumber ||
    null;
  const email =
    patientDetails?.accountInfo?.email || userDetails?.email || null;
  const address =
    patientDetails?.accountInfo?.address ||
    userDetails?.location ||
    patientDetails?.address ||
    null;
  const bloodType = patientDetails?.bloodType;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">{patientName}</p>
            </div>
            {patientCode && (
              <div>
                <p className="text-sm text-gray-500">Patient Code</p>
                <p className="font-semibold">{patientCode}</p>
              </div>
            )}
            {age && (
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-semibold">{age}</p>
              </div>
            )}
            {gender && (
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-semibold">{gender}</p>
              </div>
            )}
            {phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{phone}</p>
              </div>
            )}
            {email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{email}</p>
              </div>
            )}
            {address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-semibold">{address}</p>
              </div>
            )}
            {bloodType && (
              <div>
                <p className="text-sm text-gray-500">Blood Type</p>
                <p className="font-semibold">{bloodType}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {appointmentsCount}
              </p>
              <p className="text-sm text-gray-500">Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {treatmentsCount}
              </p>
              <p className="text-sm text-gray-500">Treatments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{cyclesCount}</p>
              <p className="text-sm text-gray-500">Treatment Cycles</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions to map appointment types and statuses
function getAppointmentTypeLabel(type: string | number | undefined): string {
  if (!type) return "General";

  const typeMap: Record<string | number, string> = {
    // String values
    Consultation: "Consultation",
    Treatment: "Treatment",
    FollowUp: "Follow Up",
    Ultrasound: "Ultrasound",
    BloodTest: "Blood Test",
    OPU: "OPU (Oocyte Pick Up)",
    ET: "ET (Embryo Transfer)",
    IUI: "IUI (Intrauterine Insemination)",
    Injection: "Injection",
    Booking: "Booking",
    // Numeric values from backend enum
    1: "Consultation",
    2: "Ultrasound",
    3: "Blood Test",
    4: "OPU (Oocyte Pick Up)",
    5: "ET (Embryo Transfer)",
    6: "IUI (Intrauterine Insemination)",
    7: "Follow Up",
    8: "Injection",
    9: "Booking",
  };

  return typeMap[type] || String(type);
}

function getAppointmentStatusLabel(
  status: string | number | undefined
): string {
  if (!status) return "Pending";

  const statusMap: Record<string | number, string> = {
    // String values
    Scheduled: "Scheduled",
    Confirmed: "Confirmed",
    CheckedIn: "Checked In",
    InProgress: "In Progress",
    Completed: "Completed",
    Cancelled: "Cancelled",
    NoShow: "No Show",
    Rescheduled: "Rescheduled",
    Pending: "Pending",
    // Numeric values from backend enum
    1: "Scheduled",
    2: "Confirmed",
    3: "Checked In",
    4: "In Progress",
    5: "Completed",
    6: "Cancelled",
    7: "No Show",
    8: "Rescheduled",
  };

  return statusMap[status] || String(status);
}

function getAppointmentStatusColor(
  status: string | number | undefined
): string {
  return getAppointmentStatusBadgeClass(status);
}

// Appointments Tab Component
function AppointmentsTab({
  appointments,
  isLoading,
}: {
  appointments: Appointment[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No appointments found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const typeLabel = getAppointmentTypeLabel(
          appointment.appointmentType || (appointment as any).type
        );
        const statusLabel = getAppointmentStatusLabel(
          appointment.status || (appointment as any).status
        );
        const statusColor = getAppointmentStatusColor(
          appointment.status || (appointment as any).status
        );

        return (
          <Card key={appointment.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {new Date(
                      appointment.appointmentDate || ""
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Type: {typeLabel}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                        statusColor
                      )}
                    >
                      Status: {statusLabel}
                    </span>
                  </div>
                  {appointment.notes && (
                    <div className="mt-3 rounded-md bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Notes:
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Treatments Tab Component
function TreatmentsTab({
  treatments,
  iuiTreatments,
  ivfTreatments,
  isLoading,
}: {
  treatments: Treatment[];
  iuiTreatments: TreatmentIUI[];
  ivfTreatments: TreatmentIVF[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* General Treatments */}
      {treatments.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Treatments</h3>
          <div className="space-y-4">
            {treatments.map((treatment) => (
              <Card key={treatment.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">
                        {treatment.treatmentName || treatment.treatmentType}
                      </p>
                      <p className="text-sm text-gray-500">
                        Type: {treatment.treatmentType}
                      </p>
                      {treatment.startDate && (
                        <p className="text-sm text-gray-500">
                          Start:{" "}
                          {new Date(treatment.startDate).toLocaleDateString(
                            "en-US"
                          )}
                        </p>
                      )}
                      {treatment.status && (
                        <p className="text-sm text-gray-500">
                          Status: {treatment.status}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* IUI Treatments */}
      {iuiTreatments.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">IUI Treatments</h3>
          <div className="space-y-4">
            {iuiTreatments.map((iui) => (
              <Card key={iui.id}>
                <CardContent className="pt-6">
                  <div>
                    <p className="font-semibold">IUI Treatment</p>
                    {iui.treatmentId && (
                      <p className="text-sm text-gray-500">
                        Treatment ID: {iui.treatmentId}
                      </p>
                    )}
                    {iui.inseminationDate && (
                      <p className="text-sm text-gray-500">
                        Insemination Date:{" "}
                        {new Date(iui.inseminationDate).toLocaleDateString(
                          "en-US"
                        )}
                      </p>
                    )}
                    {iui.cycleStatus && (
                      <p className="text-sm text-gray-500">
                        Status: {iui.cycleStatus}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* IVF Treatments */}
      {ivfTreatments.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">IVF Treatments</h3>
          <div className="space-y-4">
            {ivfTreatments.map((ivf) => (
              <Card key={ivf.id}>
                <CardContent className="pt-6">
                  <div>
                    <p className="font-semibold">IVF Treatment</p>
                    {ivf.treatmentId && (
                      <p className="text-sm text-gray-500">
                        Treatment ID: {ivf.treatmentId}
                      </p>
                    )}
                    {ivf.retrievalDate && (
                      <p className="text-sm text-gray-500">
                        Retrieval Date:{" "}
                        {new Date(ivf.retrievalDate).toLocaleDateString(
                          "en-US"
                        )}
                      </p>
                    )}
                    {ivf.transferDate && (
                      <p className="text-sm text-gray-500">
                        Transfer Date:{" "}
                        {new Date(ivf.transferDate).toLocaleDateString("en-US")}
                      </p>
                    )}
                    {ivf.cycleStatus && (
                      <p className="text-sm text-gray-500">
                        Status: {ivf.cycleStatus}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {treatments.length === 0 &&
        iuiTreatments.length === 0 &&
        ivfTreatments.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No treatments found
          </div>
        )}
    </div>
  );
}

// Helper function to get treatment type from cycle
function getCycleTreatmentType(cycle: TreatmentCycle): string {
  // First, try cycle.treatmentType
  if (cycle.treatmentType === "IUI" || cycle.treatmentType === "IVF") {
    return cycle.treatmentType;
  }

  // Try to infer from cycleName (e.g., "IVF Treatment Plan 2025 - Pre-Cycle Preparation")
  if (cycle.cycleName) {
    const cycleNameUpper = cycle.cycleName.toUpperCase();
    if (cycleNameUpper.includes("IVF")) {
      return "IVF";
    } else if (cycleNameUpper.includes("IUI")) {
      return "IUI";
    }
  }

  return "N/A";
}

// Cycles Tab Component
function CyclesTab({
  cycles,
  isLoading,
}: {
  cycles: TreatmentCycle[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (cycles.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No treatment cycles found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cycles.map((cycle) => (
        <Card key={cycle.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">
                  {cycle.cycleName || `Cycle ${cycle.cycleNumber}`}
                </p>
                <p className="text-sm text-gray-500">
                  Type: {getCycleTreatmentType(cycle)}
                </p>
                {cycle.startDate && (
                  <p className="text-sm text-gray-500">
                    Start:{" "}
                    {new Date(cycle.startDate).toLocaleDateString("en-US")}
                  </p>
                )}
                {cycle.status && (
                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    {normalizeTreatmentCycleStatus(cycle.status) ||
                      cycle.status}
                  </p>
                )}
              </div>
              <TreatmentCycleStatusBadge status={cycle.status} showIcon />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Medical Records Tab Component
function MedicalRecordsTab({ patientId }: { patientId: string }) {
  const navigate = useNavigate();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Fetch medical records for this patient
  const { data: medicalRecordsData, isLoading: medicalRecordsLoading } =
    useQuery({
      queryKey: ["medical-records", "patient", patientId],
      queryFn: async () => {
        try {
          const response = await api.medicalRecord.getMedicalRecords({
            PatientId: patientId,
            Page: 1,
            Size: 100,
          });
          return response.data || [];
        } catch (error) {
          console.error("Error fetching medical records:", error);
          return [];
        }
      },
      enabled: !!patientId,
    });

  // Fetch selected medical record detail
  const { data: selectedRecord, isLoading: selectedRecordLoading } =
    useQuery<MedicalRecordDetailResponse>({
      queryKey: ["medical-record", selectedRecordId],
      enabled: !!selectedRecordId,
      queryFn: async () => {
        if (!selectedRecordId) throw new Error("No record ID");
        const response =
          await api.medicalRecord.getMedicalRecordById(selectedRecordId);
        return response.data;
      },
    });

  const medicalRecords = medicalRecordsData || [];

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
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

  if (medicalRecordsLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading medical records...
      </div>
    );
  }

  if (medicalRecords.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>No medical records found for this patient.</p>
        <Button
          className="mt-4"
          size="sm"
          onClick={() => {
            navigate({
              to: "/doctor/medical-records",
              search: { patientId: patientId },
            } as any);
          }}
        >
          Create First Record
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {medicalRecords.length} record{medicalRecords.length !== 1 ? "s" : ""}{" "}
          found
        </p>
        <Button
          size="sm"
          onClick={() => {
            navigate({
              to: "/doctor/medical-records",
              search: { patientId: patientId },
            } as any);
          }}
        >
          Create Record
        </Button>
      </div>
      {medicalRecords.map((record: MedicalRecord) => (
        <Card key={record.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    Record #{record.id.slice(0, 8)}
                  </p>
                  {record.createdAt && (
                    <span className="text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {record.appointmentId && (
                    <span className="text-xs text-gray-400">
                      Appointment: {record.appointmentId.slice(0, 8)}
                    </span>
                  )}
                </div>
                {record.chiefComplaint && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Chief Complaint:
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.chiefComplaint}
                    </p>
                  </div>
                )}
                {record.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Diagnosis:
                    </p>
                    <p className="text-sm text-gray-600">{record.diagnosis}</p>
                  </div>
                )}
                {record.treatmentPlan && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Treatment Plan:
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.treatmentPlan.length > 200
                        ? `${record.treatmentPlan.substring(0, 200)}...`
                        : record.treatmentPlan}
                    </p>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes:</p>
                    <p className="text-sm text-gray-600">
                      {record.notes.length > 200
                        ? `${record.notes.substring(0, 200)}...`
                        : record.notes}
                    </p>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRecordId(record.id);
                }}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Medical Record Detail Modal */}
      <Modal
        isOpen={!!selectedRecordId}
        onClose={() => setSelectedRecordId(null)}
        title="Medical Record Details"
        size="xl"
      >
        {selectedRecordLoading ? (
          <div className="py-12 text-center text-gray-500">
            Loading medical record details...
          </div>
        ) : selectedRecord ? (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Record ID
                    </label>
                    <p className="text-sm font-mono text-gray-900">
                      {selectedRecord.id}
                    </p>
                  </div>
                  {selectedRecord.appointmentId && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Appointment ID
                      </label>
                      <p className="text-sm font-mono text-gray-900">
                        {selectedRecord.appointmentId}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900">
                      {formatDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                  {selectedRecord.updatedAt && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedRecord.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRecord.chiefComplaint && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Chief Complaint
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRecord.chiefComplaint}
                    </p>
                  </div>
                )}
                {selectedRecord.history && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      History
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRecord.history}
                    </p>
                  </div>
                )}
                {selectedRecord.physicalExamination && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Physical Examination
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRecord.physicalExamination}
                    </p>
                  </div>
                )}
                {selectedRecord.diagnosis && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Diagnosis
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRecord.diagnosis}
                    </p>
                  </div>
                )}
                {selectedRecord.treatmentPlan && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Treatment Plan
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRecord.treatmentPlan}
                    </p>
                  </div>
                )}
                {selectedRecord.followUpInstructions && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Follow-up Instructions
                    </label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedRecord.followUpInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            {(selectedRecord.vitalSigns ||
              selectedRecord.labResults ||
              selectedRecord.imagingResults ||
              selectedRecord.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRecord.vitalSigns && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Vital Signs
                      </label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedRecord.vitalSigns}
                      </p>
                    </div>
                  )}
                  {selectedRecord.labResults && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Lab Results
                      </label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedRecord.labResults}
                      </p>
                    </div>
                  )}
                  {selectedRecord.imagingResults && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Imaging Results
                      </label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedRecord.imagingResults}
                      </p>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Notes
                      </label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            Medical record not found
          </div>
        )}
      </Modal>
    </div>
  );
}
