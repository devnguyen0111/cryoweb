/**
 * Cycle Update Modal Component
 * Rebuilt from scratch based on Figma design for updating treatment cycle records
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import {
  X,
  Calendar,
  History,
  Printer,
  Play,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Syringe,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/client";
import { cn } from "@/utils/cn";
import type {
  TreatmentCycle,
  AppointmentExtendedDetailResponse,
  MedicalRecord,
  CreatePrescriptionRequest,
  Medicine,
  PaginatedResponse,
  IUIStep,
  LabSampleDetailResponse,
  Relationship,
} from "@/api/types";
import { HorizontalTreatmentTimeline } from "./HorizontalTreatmentTimeline";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { normalizeTreatmentCycleStatus } from "@/api/types";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAppointmentStatusBadgeClass,
  getSampleStatusBadgeClass,
} from "@/utils/status-colors";
import { CreateMedicalRecordForm } from "@/features/doctor/medical-records/CreateMedicalRecordForm";
import { DoctorCreateAppointmentForm } from "@/features/doctor/appointments/DoctorCreateAppointmentForm";
import { CreateServiceRequestModal } from "@/features/doctor/service-requests/CreateServiceRequestModal";
import { FertilizationModal } from "@/features/doctor/fertilization/FertilizationModal";
import { Modal } from "@/components/ui/modal";
import { getLast4Chars } from "@/utils/id-helpers";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { formatDateForInput } from "@/utils/date-helpers";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

// Component to display prescription with full details
function PrescriptionCard({
  prescriptionId,
  prescription,
}: {
  prescriptionId: string;
  prescription: any;
}) {
  // Fetch full prescription details
  const { data: prescriptionDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["prescription-detail", prescriptionId],
    queryFn: async () => {
      try {
        const response =
          await api.prescription.getPrescriptionById(prescriptionId);
        return response.data;
      } catch (error) {
        console.warn(
          `Failed to fetch prescription detail ${prescriptionId}:`,
          error
        );
        return null;
      }
    },
    enabled: !!prescriptionId,
  });

  const prescriptionDetails =
    prescriptionDetail?.prescriptionDetails || prescription.medications || [];

  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-900">
            Prescription #{getLast4Chars(prescription.id)}
          </p>
          <Badge variant="outline" className="text-xs">
            {prescription.status ||
              (prescriptionDetail?.isFilled ? "Filled" : "Active")}
          </Badge>
        </div>
        {(prescriptionDetail?.diagnosis || prescription.diagnosis) && (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Diagnosis:</span>{" "}
            {prescriptionDetail?.diagnosis || prescription.diagnosis}
          </p>
        )}
        {(prescriptionDetail?.instructions || prescription.instructions) && (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Instructions:</span>{" "}
            {prescriptionDetail?.instructions || prescription.instructions}
          </p>
        )}
        {isLoadingDetail ? (
          <div className="py-2 text-xs text-gray-500">
            Loading medications...
          </div>
        ) : prescriptionDetails.length > 0 ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-gray-700">Medications:</p>
            {prescriptionDetails.map((detail: any, idx: number) => (
              <div
                key={detail.id || idx}
                className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200 space-y-1"
              >
                <p className="font-medium">
                  {detail.medicineName || detail.medicine?.name || "Unknown"}
                  {detail.form && ` (${detail.form})`}
                </p>
                <div className="grid grid-cols-2 gap-1 text-gray-600">
                  {detail.dosage && (
                    <p>
                      <span className="font-medium">Dosage:</span>{" "}
                      {detail.dosage}
                    </p>
                  )}
                  {detail.frequency && (
                    <p>
                      <span className="font-medium">Frequency:</span>{" "}
                      {detail.frequency}
                    </p>
                  )}
                  {detail.durationDays && (
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {detail.durationDays} days
                    </p>
                  )}
                  {detail.quantity && (
                    <p>
                      <span className="font-medium">Quantity:</span>{" "}
                      {detail.quantity}
                    </p>
                  )}
                </div>
                {detail.instructions && (
                  <p className="text-gray-700">
                    <span className="font-medium">Instructions:</span>{" "}
                    {detail.instructions}
                  </p>
                )}
                {detail.notes && (
                  <p className="text-gray-500">
                    <span className="font-medium">Notes:</span> {detail.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 mt-2">No medications found</p>
        )}
        {(prescriptionDetail?.prescriptionDate || prescription.createdAt) && (
          <p className="text-xs text-gray-500 mt-2">
            Prescription Date:{" "}
            {new Date(
              prescriptionDetail?.prescriptionDate || prescription.createdAt
            ).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
        {prescriptionDetail?.filledDate && (
          <p className="text-xs text-gray-500">
            Filled Date:{" "}
            {new Date(prescriptionDetail.filledDate).toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )}
          </p>
        )}
      </div>
    </Card>
  );
}

interface CycleUpdateModalProps {
  cycle: TreatmentCycle;
  isOpen: boolean;
  onClose: () => void;
}

type PrescriptionFormData = {
  medicalRecordId: string;
  diagnosis: string;
  instructions: string;
  medications: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    quantity: number;
    notes: string;
  }>;
};

type TabType =
  | "assessment"
  | "medical-history"
  | "treatment-plan"
  | "prescription"
  | "service"
  | "sperm"
  | "oocyte"
  | "iui-procedure";

export function CycleUpdateModal({
  cycle,
  isOpen,
  onClose,
}: CycleUpdateModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("assessment");
  const [prescriptionViewMode, setPrescriptionViewMode] = useState<
    "create" | "view"
  >("create");
  const [serviceViewMode, setServiceViewMode] = useState<"create" | "view">(
    "create"
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] =
    useState(false);
  const [showCreateMedicalRecordModal, setShowCreateMedicalRecordModal] =
    useState(false);
  const [showCreateServiceRequestModal, setShowCreateServiceRequestModal] =
    useState(false);
  const [selectedSpermSampleId, setSelectedSpermSampleId] = useState<
    string | null
  >(null);
  const [showFertilizationModal, setShowFertilizationModal] = useState(false);
  const { data: doctorProfile } = useDoctorProfile();

  // Reset selectedSpermSampleId when modal closes or cycle changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSpermSampleId(null);
    }
  }, [isOpen, cycle.id]);

  // Fetch latest cycle details from API
  const { data: cycleDetails } = useQuery({
    queryKey: ["doctor", "treatment-cycle", cycle.id],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycle.id);
      return response.data;
    },
    enabled: isOpen && !!cycle.id,
    staleTime: 30000, // Cache for 30 seconds to reduce unnecessary refetches
  });

  const rawCurrentCycle = cycleDetails || cycle;

  // Fetch treatment to get doctorId and treatmentType
  const { data: treatmentData } = useQuery({
    queryKey: ["treatment", rawCurrentCycle.treatmentId],
    queryFn: async () => {
      if (!rawCurrentCycle.treatmentId) return null;
      const response = await api.treatment.getTreatmentById(
        rawCurrentCycle.treatmentId
      );
      return response.data;
    },
    enabled: !!rawCurrentCycle.treatmentId && isOpen,
  });

  // Fetch all cycles for this treatment to infer treatmentType if needed
  const { data: allCyclesData } = useQuery({
    queryKey: ["treatment-cycles", "treatment", rawCurrentCycle.treatmentId],
    queryFn: async () => {
      if (!rawCurrentCycle.treatmentId) return [];
      try {
        const response = await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: rawCurrentCycle.treatmentId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!rawCurrentCycle.treatmentId && isOpen,
  });

  // Helper function to infer treatmentType for a cycle
  const inferTreatmentType = useCallback(
    (cycle: TreatmentCycle): "IUI" | "IVF" | undefined => {
      // First, try cycle.treatmentType
      if (cycle.treatmentType === "IUI" || cycle.treatmentType === "IVF") {
        return cycle.treatmentType;
      }
      // Then try treatmentData?.treatmentType
      if (treatmentData?.treatmentType) {
        const type = String(treatmentData.treatmentType).toUpperCase();
        if (type === "IUI") return "IUI";
        if (type === "IVF") return "IVF";
      }
      // Try to infer from cycleName if available
      if (cycle.cycleName) {
        const cycleNameUpper = cycle.cycleName.toUpperCase();
        if (cycleNameUpper.includes("IVF")) {
          return "IVF";
        } else if (cycleNameUpper.includes("IUI")) {
          return "IUI";
        }
      }
      return undefined;
    },
    [treatmentData]
  );

  // Ensure currentCycle has treatmentType (similar to CycleUpdateForm)
  const currentCycle = useMemo(() => {
    let treatmentType = inferTreatmentType(rawCurrentCycle);

    // Try to infer from allCyclesData if still not found
    if (!treatmentType && allCyclesData && allCyclesData.length > 0) {
      const cycleWithType = allCyclesData.find(
        (c) => c.treatmentType === "IUI" || c.treatmentType === "IVF"
      );
      if (cycleWithType) {
        if (
          cycleWithType.treatmentType === "IUI" ||
          cycleWithType.treatmentType === "IVF"
        ) {
          treatmentType = cycleWithType.treatmentType;
        }
      }
    }

    return {
      ...rawCurrentCycle,
      treatmentType: treatmentType,
    };
  }, [rawCurrentCycle, treatmentData, allCyclesData, inferTreatmentType]);

  // Enhance allCyclesData with treatmentType to prevent "Treatment type not specified" error
  const enhancedAllCyclesData = useMemo(() => {
    if (!allCyclesData || allCyclesData.length === 0) {
      return [currentCycle];
    }
    return allCyclesData.map((cycle) => {
      const treatmentType = inferTreatmentType(cycle);
      return {
        ...cycle,
        treatmentType: treatmentType || currentCycle.treatmentType,
      };
    });
  }, [allCyclesData, currentCycle, inferTreatmentType]);

  // Fetch primary doctor details
  const doctorId = treatmentData?.doctorId || currentCycle.doctorId;
  const { data: primaryDoctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      if (!doctorId) return null;
      try {
        const response = await api.doctor.getDoctorById(doctorId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!doctorId && isOpen,
  });

  // Fetch user details for primary doctor to get firstName/lastName
  const { data: primaryDoctorUserDetails } = useQuery({
    queryKey: ["user-details", doctorId, "primary-doctor"],
    queryFn: async () => {
      if (!doctorId) return null;
      try {
        const response = await api.user.getUserDetails(doctorId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!doctorId && isOpen,
  });

  // Prescription Form
  const prescriptionForm = useForm<PrescriptionFormData>({
    defaultValues: {
      medicalRecordId: "",
      diagnosis: "",
      instructions: "",
      medications: [
        {
          medicineId: "",
          dosage: "",
          frequency: "",
          durationDays: 0,
          quantity: 1,
          notes: "",
        },
      ],
    },
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control: prescriptionForm.control,
    name: "medications",
  });

  // Get patient details
  const { data: patientData } = usePatientDetails(
    currentCycle.patientId,
    !!currentCycle.patientId && isOpen
  );

  // Get user details for patient (has fullName, dob, etc.)
  const accountId = patientData?.accountId || currentCycle.patientId;
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", accountId, "cycle-update-modal"],
    queryFn: async () => {
      if (!accountId) return null;
      try {
        const response = await api.user.getUserDetails(accountId);
        return response.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!accountId && isOpen,
  });

  // Get appointment history
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", "patient-history", currentCycle.patientId],
    queryFn: async () => {
      if (!currentCycle.patientId) return { data: [] };
      const response = await api.appointment.getAppointmentHistoryByPatient(
        currentCycle.patientId,
        {
          Size: 50,
          Sort: "AppointmentDate",
          Order: "desc",
        }
      );
      return response;
    },
    enabled: !!currentCycle.patientId && isOpen,
  });

  // Get medical records
  const { data: medicalRecordsData } = useQuery({
    queryKey: [
      "medical-records",
      "patient",
      currentCycle.patientId,
      "cycle",
      currentCycle.id,
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return [];
      try {
        const response = await api.medicalRecord.getMedicalRecords({
          PatientId: currentCycle.patientId,
          Page: 1,
          Size: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!currentCycle.patientId && isOpen,
  });

  // Check if this is an IVF cycle
  const isIVFCycle = useMemo(() => {
    return (
      currentCycle.treatmentType === "IVF" ||
      treatmentData?.treatmentType === "IVF"
    );
  }, [currentCycle.treatmentType, treatmentData?.treatmentType]);

  // Fetch ALL sperm samples of patient that have been quality checked (for validation)
  // Fetch relationships to get partner patient ID for sperm samples (IVF only)
  const { data: relationshipsResponse } = useQuery({
    queryKey: [
      "doctor",
      "patient",
      currentCycle.patientId,
      "relationships",
      "cycle-update",
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return [];
      try {
        const response = await api.relationship.getRelationships(
          currentCycle.patientId
        );
        return response.data ?? [];
      } catch (error: any) {
        if (
          error?.response?.status === 404 ||
          error?.response?.status === 403
        ) {
          return [];
        }
        console.warn(
          "[CycleUpdateModal] Failed to fetch relationships:",
          error
        );
        return [];
      }
    },
    enabled: isOpen && !!currentCycle.patientId && isIVFCycle,
    retry: false,
  });

  const relationships = relationshipsResponse ?? [];

  // Get active partner relationship (Married or Unmarried) - for IVF cycles
  const partnerRelationship: Relationship | undefined = isIVFCycle
    ? relationships.find(
        (rel: Relationship) =>
          (rel.relationshipType === "Married" ||
            rel.relationshipType === "Unmarried") &&
          rel.isActive !== false
      )
    : undefined;

  // Get partner patient ID from relationship - for IVF cycles
  const partnerPatientId =
    isIVFCycle && partnerRelationship
      ? partnerRelationship.patient1Id === currentCycle.patientId
        ? partnerRelationship.patient2Id
        : partnerRelationship.patient1Id
      : null;

  // For both IVF and IUI cycles (IUI needs it for step4_iui_procedure)
  // For IVF: fetch from partner patient (male has sperm)
  // For IUI: fetch from main patient (male patient has sperm)
  const { data: spermSamplesData, isLoading: spermSamplesLoading } = useQuery({
    queryKey: [
      "sperm-samples",
      isIVFCycle ? "partner" : "patient",
      isIVFCycle ? partnerPatientId : currentCycle.patientId,
      "quality-checked",
    ],
    queryFn: async () => {
      // For IVF: use partner patient ID, for IUI: use main patient ID
      const targetPatientId = isIVFCycle
        ? partnerPatientId
        : currentCycle.patientId;

      if (!targetPatientId) return { data: [] };
      try {
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Sperm",
          PatientId: targetPatientId,
          Page: 1,
          Size: 100,
          Sort: "collectionDate",
          Order: "desc",
        });
        const samples = response.data || [];
        // Get ALL samples of patient that have been quality checked
        // Statuses considered as quality checked: QualityChecked, Fertilized, CulturedEmbryo, Stored, Used, Frozen
        const qualityCheckedStatuses = [
          "QualityChecked",
          "Fertilized",
          "CulturedEmbryo",
          "Stored",
          "Used",
          "Frozen",
        ];
        const filtered = samples.filter((sample) =>
          qualityCheckedStatuses.includes(sample.status)
        );

        // Debug log
        if (process.env.NODE_ENV === "development") {
          console.log("[CycleUpdateModal] Sperm samples fetched:", {
            targetPatientId: isIVFCycle
              ? partnerPatientId
              : currentCycle.patientId,
            isIVFCycle,
            total: samples.length,
            qualityChecked: filtered.length,
            markedForFertilization: filtered.filter(
              (s) => s.canFertilize === true
            ).length,
            samples: filtered.map((s) => ({
              id: s.id,
              status: s.status,
              canFertilize: s.canFertilize,
            })),
          });
        }

        return { data: filtered };
      } catch (error) {
        console.error("Error fetching sperm samples:", error);
        return { data: [] };
      }
    },
    enabled:
      !!currentCycle.patientId &&
      isOpen &&
      (isIVFCycle ? !!partnerPatientId : true) && // For IVF, need partner; for IUI, just need patient
      (!isIVFCycle || !!relationshipsResponse), // For IVF, wait for relationships
    staleTime: 30000, // Cache for 30 seconds to reduce unnecessary refetches
  });

  // Fetch ALL oocyte samples of patient that have been quality checked (for validation and display)
  const { data: oocyteSamplesData, isLoading: oocyteSamplesLoading } = useQuery(
    {
      queryKey: [
        "oocyte-samples",
        "patient",
        currentCycle.patientId,
        "quality-checked",
      ],
      queryFn: async () => {
        if (!currentCycle.patientId) return { data: [] };
        try {
          const response = await api.sample.getAllDetailSamples({
            SampleType: "Oocyte",
            PatientId: currentCycle.patientId,
            Page: 1,
            Size: 100,
            Sort: "collectionDate",
            Order: "desc",
          });
          const samples = response.data || [];
          // Get ALL samples of patient that have been quality checked
          // Statuses considered as quality checked: QualityChecked, Fertilized, CulturedEmbryo, Stored, Used, Frozen
          const qualityCheckedStatuses = [
            "QualityChecked",
            "Fertilized",
            "CulturedEmbryo",
            "Stored",
            "Used",
            "Frozen",
          ];
          const filtered = samples.filter((sample) =>
            qualityCheckedStatuses.includes(sample.status)
          );

          // Debug log
          if (process.env.NODE_ENV === "development") {
            console.log("[CycleUpdateModal] Oocyte samples fetched:", {
              total: samples.length,
              qualityChecked: filtered.length,
              markedForFertilization: filtered.filter(
                (s) => s.canFertilize === true
              ).length,
              samples: filtered.map((s) => ({
                id: s.id,
                status: s.status,
                canFertilize: s.canFertilize,
              })),
            });
          }

          return { data: filtered };
        } catch (error) {
          console.error("Error fetching oocyte samples:", error);
          return { data: [] };
        }
      },
      enabled: !!currentCycle.patientId && isOpen,
      staleTime: 30000, // Cache for 30 seconds to reduce unnecessary refetches
    }
  );

  // For display in tabs, also fetch samples for current cycle (not filtered by quality check)
  const { data: cycleSpermSamplesData } = useQuery({
    queryKey: ["cycle-samples", "sperm", currentCycle.id],
    queryFn: async () => {
      if (!currentCycle.id) return { data: [] };
      try {
        const response = await api.treatmentCycle.getCycleSamples(
          currentCycle.id
        );
        const allSamples = response.data || [];
        // Filter to only sperm samples
        const spermSamples = allSamples.filter(
          (sample) => sample.sampleType === "Sperm"
        );
        return { data: spermSamples };
      } catch (error) {
        console.error("Error fetching cycle sperm samples:", error);
        return { data: [] };
      }
    },
    enabled: !!currentCycle.id && isOpen && activeTab === "sperm",
  });

  const { data: cycleOocyteSamplesData } = useQuery({
    queryKey: [
      "oocyte-samples",
      "cycle",
      currentCycle.id,
      currentCycle.patientId,
    ],
    queryFn: async () => {
      if (!currentCycle.patientId) return { data: [] };
      try {
        const response = await api.sample.getAllDetailSamples({
          SampleType: "Oocyte",
          PatientId: currentCycle.patientId,
          Page: 1,
          Size: 100,
          Sort: "collectionDate",
          Order: "desc",
        });
        const samples = response.data || [];
        return {
          data: samples.filter(
            (sample) =>
              !sample.treatmentCycleId ||
              sample.treatmentCycleId === currentCycle.id
          ),
        };
      } catch (error) {
        console.error("Error fetching cycle oocyte samples:", error);
        return { data: [] };
      }
    },
    enabled: !!currentCycle.patientId && isOpen && activeTab === "oocyte",
  });

  // For validation: use all quality-checked samples of patient
  const spermSamples = spermSamplesData?.data || [];
  const oocyteSamples = oocyteSamplesData?.data || [];

  // For display in tabs: use samples for current cycle
  const cycleSpermSamples = cycleSpermSamplesData?.data || [];
  const cycleOocyteSamples = cycleOocyteSamplesData?.data || [];

  // Filter medical records by cycle appointments
  const cycleAppointments = useMemo(() => {
    return appointmentsData?.data || [];
  }, [appointmentsData]);

  const cycleMedicalRecords = useMemo(() => {
    if (!medicalRecordsData || cycleAppointments.length === 0) return [];
    const appointmentIds = cycleAppointments.map(
      (apt: AppointmentExtendedDetailResponse) => apt.id
    );
    const filtered = medicalRecordsData.filter((record: MedicalRecord) =>
      appointmentIds.includes(record.appointmentId)
    );
    // If an appointment is selected, filter to show only its medical notes
    if (selectedAppointmentId) {
      return filtered.filter(
        (record: MedicalRecord) =>
          record.appointmentId === selectedAppointmentId
      );
    }
    return filtered;
  }, [medicalRecordsData, cycleAppointments, selectedAppointmentId]);

  // Find medical record for selected appointment
  const selectedMedicalRecord = useMemo(() => {
    if (!selectedAppointmentId || !cycleMedicalRecords.length) return null;
    return cycleMedicalRecords.find(
      (record: MedicalRecord) => record.appointmentId === selectedAppointmentId
    );
  }, [selectedAppointmentId, cycleMedicalRecords]);

  // Fetch prescriptions for patient in cycle
  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useQuery(
    {
      queryKey: [
        "prescriptions",
        "patient",
        currentCycle.patientId,
        "cycle",
        currentCycle.id,
        selectedAppointmentId,
      ],
      queryFn: async () => {
        if (!currentCycle.patientId)
          return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
        try {
          // Get medical record IDs from cycle
          const medicalRecordIds = cycleMedicalRecords.map((r) => r.id);
          if (medicalRecordIds.length === 0) {
            return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
          }

          // Fetch prescriptions for all medical records in cycle
          const allPrescriptions: any[] = [];
          await Promise.all(
            medicalRecordIds.map(async (medicalRecordId) => {
              try {
                const response = await api.prescription.getPrescriptions({
                  MedicalRecordId: medicalRecordId,
                  Page: 1,
                  Size: 100,
                });
                if (response.data) {
                  allPrescriptions.push(...response.data);
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch prescriptions for medical record ${medicalRecordId}:`,
                  error
                );
              }
            })
          );

          // Filter by selected appointment if provided
          let filtered = allPrescriptions;
          if (selectedAppointmentId && selectedMedicalRecord) {
            filtered = allPrescriptions.filter(
              (p) => p.medicalRecordId === selectedMedicalRecord.id
            );
          }

          return {
            data: filtered,
            metaData: { totalCount: filtered.length, totalPages: 1 },
          };
        } catch {
          return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
        }
      },
      enabled: !!currentCycle.patientId && !!currentCycle.id && isOpen,
    }
  );

  const prescriptions = prescriptionsData?.data || [];

  // Fetch service requests for patient in cycle
  const { data: serviceRequestsData, isLoading: serviceRequestsLoading } =
    useQuery({
      queryKey: [
        "service-requests",
        "patient",
        currentCycle.patientId,
        "cycle",
        currentCycle.id,
        selectedAppointmentId,
      ],
      queryFn: async () => {
        if (!currentCycle.patientId)
          return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
        try {
          const response = await api.serviceRequest.getServiceRequests({
            patientId: currentCycle.patientId,
            pageNumber: 1,
            pageSize: 100,
          });
          const allRequests = response.data || [];

          // Filter by cycle appointments
          const cycleAppointmentIds = cycleAppointments.map((apt) => apt.id);
          let filtered = allRequests.filter((request) => {
            return (
              request.appointmentId &&
              cycleAppointmentIds.includes(request.appointmentId)
            );
          });

          // Filter by selected appointment if provided
          if (selectedAppointmentId) {
            filtered = filtered.filter(
              (request) => request.appointmentId === selectedAppointmentId
            );
          }

          return {
            data: filtered,
            metaData: { totalCount: filtered.length, totalPages: 1 },
          };
        } catch {
          return { data: [], metaData: { totalCount: 0, totalPages: 0 } };
        }
      },
      enabled: !!currentCycle.patientId && !!currentCycle.id && isOpen,
    });

  const serviceRequests = serviceRequestsData?.data || [];

  // Auto-select medical record ID when appointment is selected
  useEffect(() => {
    if (selectedMedicalRecord?.id) {
      prescriptionForm.setValue("medicalRecordId", selectedMedicalRecord.id);
      // Also auto-fill diagnosis if available
      if (
        selectedMedicalRecord.diagnosis &&
        !prescriptionForm.getValues("diagnosis")
      ) {
        prescriptionForm.setValue("diagnosis", selectedMedicalRecord.diagnosis);
      }
    } else if (!selectedAppointmentId) {
      // Clear medical record ID when no appointment is selected
      prescriptionForm.setValue("medicalRecordId", "");
    }
  }, [selectedMedicalRecord, selectedAppointmentId, prescriptionForm]);

  // Get most recent assessment record
  const assessmentRecord = useMemo(() => {
    if (!cycleMedicalRecords.length) return null;
    const sorted = [...cycleMedicalRecords].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
    return sorted[0];
  }, [cycleMedicalRecords]);

  // Parse assessment data from labResults
  const assessmentData = useMemo(() => {
    if (!assessmentRecord?.labResults) return null;

    const labResults = assessmentRecord.labResults;
    const data: Record<string, { value: string; description?: string }> = {};

    const amhMatch = labResults.match(/AMH[:\s]+([\d.]+)\s*(ng\/mL|ng\/ml)/i);
    if (amhMatch) {
      data.amh = {
        value: `${amhMatch[1]} ng/mL`,
        description:
          "Trong giới hạn bình thường so với độ tuổi. Cho thấy dự trữ buồng trứng tốt, dự kiến sẽ có đáp ứng thuận lợi với kích thích.",
      };
    }

    const fshMatch = labResults.match(/FSH[:\s]+([\d.]+)\s*(mIU\/mL|mIU\/ml)/i);
    if (fshMatch) {
      data.fsh = {
        value: `${fshMatch[1]} mIU/mL`,
        description:
          "Trong giới hạn bình thường (3.5-12.5). Không có lo ngại về chức năng buồng trứng hoặc suy giảm dự trữ.",
      };
    }

    const lhMatch = labResults.match(/LH[:\s]+([\d.]+)\s*(mIU\/mL|mIU\/ml)/i);
    if (lhMatch) {
      data.lh = {
        value: `${lhMatch[1]} mIU/mL`,
        description:
          "Trong giới hạn bình thường (2.4-12.6). Tỷ lệ FSH:LH bình thường, không có dấu hiệu của PCOS.",
      };
    }

    const afcMatch = labResults.match(
      /(?:Antral Follicle Count|AFC)[:\s]+(\d+)/i
    );
    if (afcMatch) {
      data.afc = {
        value: afcMatch[1],
        description:
          "Là chỉ dấu tốt cho khả năng đáp ứng với kích thích. Phù hợp với kết quả AMH.",
      };
    }

    if (labResults.match(/Semen Analysis/i) || labResults.match(/Sperm/i)) {
      data.semen = {
        value: "Normal",
        description:
          "Thế tích: 3.2 mL, Nồng độ: 52 triệu/mL, Độ di động: 58%, Hình thái: 5% dạng bình thường.",
      };
    }

    if (labResults.match(/Uterine|Endometrial/i)) {
      data.uterine = {
        value: "Normal",
        description:
          "Không phát hiện u xơ, polyp hoặc bất thường trên siêu âm. Độ dày nội mạc tử cung 8mm.",
      };
    }

    return Object.keys(data).length > 0 ? data : null;
  }, [assessmentRecord]);

  // Update mutation
  // const updateMutation = useMutation({
  //   mutationFn: async (data: UpdateRecordFormData) => {
  //     let combinedNotes = "";
  //     if (data.outcome) {
  //       combinedNotes = `Outcome: ${data.outcome}`;
  //       if (data.notes) {
  //         combinedNotes += `\n\n${data.notes}`;
  //       }
  //     } else if (data.notes) {
  //       combinedNotes = data.notes;
  //     }

  //     const response = await api.treatmentCycle.updateTreatmentCycle(
  //       currentCycle.id,
  //       {
  //         notes: combinedNotes || undefined,
  //       }
  //     );
  //     return response.data;
  //   },
  //   onSuccess: () => {
  //     toast.success("Treatment record updated successfully");
  //     queryClient.invalidateQueries({
  //       queryKey: ["doctor", "treatment-cycles"],
  //     });
  //     queryClient.invalidateQueries({
  //       queryKey: ["doctor", "treatment-cycle", cycle.id],
  //     });
  //     onClose();
  //   },
  //   onError: (error: any) => {
  //     toast.error(
  //       error?.response?.data?.message || "Failed to update treatment record"
  //     );
  //   },
  // });

  // Fetch medicines for prescription
  const { data: medicinesData } = useQuery<PaginatedResponse<Medicine>>({
    queryKey: ["medicines", "for-prescription"],
    queryFn: async () => {
      try {
        return await api.medicine.getMedicines({
          pageNumber: 1,
          pageSize: 100,
        });
      } catch {
        return {
          code: 200,
          message: "Success",
          data: [],
          metaData: {
            pageNumber: 1,
            pageSize: 100,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
          },
        };
      }
    },
    enabled: isOpen && activeTab === "prescription",
  });

  const medicineOptions = useMemo(() => {
    return (medicinesData?.data ?? []).filter(
      (medicine: Medicine) => medicine.isActive !== false
    );
  }, [medicinesData?.data]);

  // Prescription Mutation
  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      if (!data.medicalRecordId) {
        throw new Error("Medical Record ID is required");
      }

      const prescriptionDetails = data.medications
        .filter((item) => item.medicineId)
        .map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity || 1,
          dosage: item.dosage || undefined,
          frequency: item.frequency || undefined,
          durationDays: item.durationDays || undefined,
          instructions: item.notes || undefined,
          notes: item.notes || undefined,
        }));

      if (!prescriptionDetails.length) {
        throw new Error("Select at least one medicine");
      }

      const payload: CreatePrescriptionRequest = {
        medicalRecordId: data.medicalRecordId,
        prescriptionDate: new Date().toISOString(),
        diagnosis: data.diagnosis || undefined,
        instructions: data.instructions || undefined,
        notes: data.instructions || data.diagnosis || undefined,
        prescriptionDetails,
      };

      return api.prescription.createPrescription(payload);
    },
    onSuccess: () => {
      toast.success("Prescription created successfully");
      prescriptionForm.reset({
        medicalRecordId: prescriptionForm.getValues("medicalRecordId"),
        diagnosis: "",
        instructions: "",
        medications: [
          {
            medicineId: "",
            dosage: "",
            frequency: "",
            durationDays: 0,
            quantity: 1,
            notes: "",
          },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["prescriptions"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create prescription"
      );
    },
  });

  // Check cycle status
  const cycleStatus = normalizeTreatmentCycleStatus(currentCycle.status);
  const isCompleted = cycleStatus === "Completed";
  const isCancelled = cycleStatus === "Cancelled";

  // Check if cycle has started
  // Cycle is considered started ONLY if status is InProgress
  // Having a startDate doesn't mean the cycle has started - it might still be Scheduled/Planned
  // The start action is what transitions the cycle from Scheduled/Planned to InProgress
  const hasStarted = cycleStatus === "InProgress";

  // Check if cycle can be started (only if NOT started yet)
  // Allow starting if cycle hasn't started, isn't completed, and isn't cancelled
  // For new cycles, we allow starting regardless of status (except Completed/Cancelled)
  const canStartCycle = !hasStarted && !isCompleted && !isCancelled;

  // Debug log (can be removed later)
  if (process.env.NODE_ENV === "development") {
    console.log("Cycle Debug:", {
      cycleId: currentCycle.id,
      startDate: currentCycle.startDate,
      currentStep: currentCycle.currentStep,
      status: currentCycle.status,
      cycleStatus,
      hasStarted,
      isCompleted,
      isCancelled,
      canStartCycle,
    });
  }

  // Start cycle mutation (simple version - just start, no step setting)
  const startCycleMutation = useMutation({
    mutationFn: async () => {
      // Use POST /api/treatment-cycles/{id}/start
      const response = await api.treatmentCycle.startTreatmentCycle(
        currentCycle.id,
        {
          startDate: new Date().toISOString(),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Treatment cycle started successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", currentCycle.id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to start treatment cycle"
      );
    },
  });

  // Check if this is IVF cycle 3 (Oocyte Retrieval and Sperm Collection)
  const isIVFCycle3 = useMemo(() => {
    if (currentCycle.treatmentType !== "IVF") return false;

    // Check by cycleNumber
    if (currentCycle.cycleNumber === 3) return true;

    // Check by stepType
    const stepTypeStr = currentCycle.stepType
      ? String(currentCycle.stepType).toUpperCase()
      : "";
    if (stepTypeStr === "IVF_OPU") return true;

    // Check by currentStep
    const currentStep = currentCycle.currentStep as string | undefined;
    if (currentStep === "step4_opu") return true;

    // Check by cycleName
    const cycleNameLower = currentCycle.cycleName?.toLowerCase() || "";
    if (
      cycleNameLower.includes("oocyte retrieval") ||
      cycleNameLower.includes("sperm collection") ||
      (cycleNameLower.includes("opu") && cycleNameLower.includes("cycle"))
    ) {
      return true;
    }

    return false;
  }, [currentCycle]);

  // Validate that cycle 3 has quality-checked samples if any samples exist
  // Only validate if there are samples - if no samples exist, allow completion
  const canCompleteCycle3 = useMemo(() => {
    if (!isIVFCycle3) return true; // Not cycle 3, no validation needed

    // If no samples exist at all, allow completion (samples might not be collected yet)
    const hasAnySpermSamples = spermSamples.length > 0;
    const hasAnyOocyteSamples = oocyteSamples.length > 0;

    // If no samples exist, allow completion
    if (!hasAnySpermSamples && !hasAnyOocyteSamples) {
      return true;
    }

    // If we have samples, check that we have quality-checked samples for both types
    // We already filtered for quality-checked samples in the query, so if they exist, they're quality-checked
    if (hasAnySpermSamples && hasAnyOocyteSamples) {
      return true; // Both types exist and are quality-checked
    }

    // If only one type exists, we still need both for cycle 3
    return false;
  }, [isIVFCycle3, spermSamples, oocyteSamples]);

  // Check if cycle can be completed (simple version - just check if started)
  // For IVF cycle 3, also check that samples are processed
  const canCompleteCycle =
    hasStarted && !isCompleted && !isCancelled && canCompleteCycle3;

  // Check if cycle can be cancelled (not completed and not already cancelled)
  const canCancelCycle = !isCompleted && !isCancelled;

  // Complete cycle mutation (simple version - just complete entire cycle)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completeOutcome, setCompleteOutcome] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showIUIConfirm, setShowIUIConfirm] = useState(false);

  const completeCycleMutation = useMutation({
    mutationFn: async () => {
      // Validate IVF cycle 3 before completing
      if (isIVFCycle3 && !canCompleteCycle3) {
        const missingSamples: string[] = [];
        if (spermSamples.length === 0) {
          missingSamples.push("sperm");
        } else {
          const processedStatuses = [
            "Processing",
            "QualityChecked",
            "Fertilized",
            "CulturedEmbryo",
            "Stored",
            "Used",
            "Frozen",
          ];
          const spermProcessed = spermSamples.some((sample) =>
            processedStatuses.includes(sample.status)
          );
          if (!spermProcessed) {
            missingSamples.push("sperm quality check");
          }
        }
        if (oocyteSamples.length === 0) {
          missingSamples.push("oocyte");
        } else {
          const processedStatuses = [
            "Processing",
            "QualityChecked",
            "Fertilized",
            "CulturedEmbryo",
            "Stored",
            "Used",
            "Frozen",
          ];
          const oocyteProcessed = oocyteSamples.some((sample) =>
            processedStatuses.includes(sample.status)
          );
          if (!oocyteProcessed) {
            missingSamples.push("oocyte quality check");
          }
        }

        throw new Error(
          `Cannot complete cycle: Lab has not returned ${missingSamples.join(" and ")} sample data. Please wait for lab to complete quality checks.`
        );
      }

      // Use POST /api/treatment-cycles/{id}/complete
      const completeRequest: {
        endDate: string;
        outcome?: string;
        notes?: string;
      } = {
        endDate: new Date().toISOString(),
      };

      // Only include outcome and notes if they have values
      if (completeOutcome.trim()) {
        completeRequest.outcome = completeOutcome.trim();
      }
      if (completeNotes.trim()) {
        completeRequest.notes = completeNotes.trim();
      }

      const response = await api.treatmentCycle.completeTreatmentCycle(
        currentCycle.id,
        completeRequest
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Treatment cycle completed successfully");
      setShowCompleteConfirm(false);
      setCompleteOutcome("");
      setCompleteNotes("");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", currentCycle.id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to complete treatment cycle"
      );
    },
  });

  const cancelCycleMutation = useMutation({
    mutationFn: async () => {
      // Use POST /api/treatment-cycles/{id}/cancel
      const cancelRequest: {
        reason?: string;
        notes?: string;
      } = {};

      // Only include reason and notes if they have values
      if (cancelReason.trim()) {
        cancelRequest.reason = cancelReason.trim();
      }
      if (cancelNotes.trim()) {
        cancelRequest.notes = cancelNotes.trim();
      }

      const response = await api.treatmentCycle.cancelTreatmentCycle(
        currentCycle.id,
        cancelRequest
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Treatment cycle cancelled successfully");
      setShowCancelConfirm(false);
      setCancelReason("");
      setCancelNotes("");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", currentCycle.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["treatment-cycles", "treatment", currentCycle.treatmentId],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to cancel treatment cycle"
      );
      setIsCancelling(false);
    },
  });

  // Check if we're at IUI Procedure step
  const isIUIProcedureStep = useMemo(() => {
    const treatmentType =
      currentCycle.treatmentType === "IUI" ||
      currentCycle.treatmentType === "IVF"
        ? currentCycle.treatmentType
        : treatmentData?.treatmentType === "IUI" ||
            treatmentData?.treatmentType === "IVF"
          ? treatmentData.treatmentType
          : undefined;

    if (treatmentType !== "IUI") return false;

    // Check if currentStep is step4_iui_procedure
    const currentStep = currentCycle.currentStep as IUIStep | undefined;
    const isStep4IUIProcedure = currentStep === "step4_iui_procedure";

    // Also check stepType in case currentStep is not set but stepType is
    const stepTypeStr = currentCycle.stepType
      ? String(currentCycle.stepType).toUpperCase()
      : "";
    const isStepTypeIUIProcedure =
      stepTypeStr === "IUI_PROCEDURE" || stepTypeStr.includes("PROCEDURE");

    // Also check cycleName as fallback (in case stepType/currentStep are not set correctly)
    const cycleNameLower = currentCycle.cycleName?.toLowerCase() || "";
    const isCycleNameIUIProcedure =
      (cycleNameLower.includes("iui") &&
        cycleNameLower.includes("procedure")) ||
      cycleNameLower.includes("insemination") ||
      (cycleNameLower.includes("iui") &&
        !cycleNameLower.includes("post") &&
        !cycleNameLower.includes("pre"));

    // Allow showing button if:
    // 1. Treatment type is IUI
    // 2. Either currentStep is step4_iui_procedure OR stepType indicates IUI_Procedure
    // 3. Cycle has started (InProgress) OR has a startDate (some cycles might have startDate but status not updated)
    // 4. Not completed or cancelled
    const hasStartedOrHasStartDate =
      hasStarted || (currentCycle.startDate && !isCompleted && !isCancelled);

    const result =
      (isStep4IUIProcedure ||
        isStepTypeIUIProcedure ||
        isCycleNameIUIProcedure) &&
      hasStartedOrHasStartDate &&
      !isCompleted &&
      !isCancelled;

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[IUI Procedure Check]:", {
        treatmentType,
        currentStep,
        stepType: currentCycle.stepType,
        stepTypeStr,
        cycleName: currentCycle.cycleName,
        isStep4IUIProcedure,
        isStepTypeIUIProcedure,
        isCycleNameIUIProcedure,
        hasStarted,
        hasStartedOrHasStartDate,
        startDate: currentCycle.startDate,
        isCompleted,
        isCancelled,
        result,
        cycleId: currentCycle.id,
      });
    }

    return result;
  }, [
    currentCycle.treatmentType,
    currentCycle.currentStep,
    currentCycle.stepType,
    currentCycle.cycleName,
    currentCycle.startDate,
    treatmentData?.treatmentType,
    hasStarted,
    isCompleted,
    isCancelled,
    currentCycle.id,
  ]);

  // Memoize handler to prevent unnecessary re-renders
  const handleConfirmIUIClick = useCallback(() => {
    setShowIUIConfirm(true);
  }, []);

  // Auto-select IUI Procedure tab when modal opens at IUI Procedure step
  useEffect(() => {
    if (isOpen && isIUIProcedureStep && hasStarted) {
      setActiveTab("iui-procedure");
    }
  }, [isOpen, isIUIProcedureStep, hasStarted]);

  // Note: allCyclesData is already fetched above for treatmentType inference
  // Reuse the same query result instead of creating a duplicate query

  // Confirm IUI Procedure mutation - Use complete API
  const confirmIUIProcedureMutation = useMutation({
    mutationFn: async () => {
      try {
        const inseminationDate = new Date().toISOString();

        // Update selected sperm sample with treatmentCycleId if selected
        if (selectedSpermSampleId) {
          try {
            await api.sample.updateSample(selectedSpermSampleId, {
              treatmentCycleId: currentCycle.id,
            } as any);
            console.log(
              "[Confirm IUI] Sperm sample linked to cycle:",
              selectedSpermSampleId
            );
          } catch (error: any) {
            console.warn("Could not update sperm sample with cycle ID:", error);
            // Don't throw - continue with completion
          }
        }

        // Auto-fill outcome and notes for IUI Procedure completion
        const outcome = "IUI Procedure completed successfully";
        let notes = `Intrauterine insemination (IUI) procedure performed on ${new Date(
          inseminationDate
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}. Procedure completed and ready for post-IUI monitoring.`;

        // Add sperm sample info to notes if selected
        if (selectedSpermSampleId) {
          const selectedSample = spermSamplesData?.data?.find(
            (s) => s.id === selectedSpermSampleId
          );
          if (selectedSample) {
            notes += `\nSperm Sample Used: ${selectedSample.sampleCode || getLast4Chars(selectedSample.id)}`;
          }
        }

        // Complete current cycle (step4_iui_procedure) with auto-filled outcome and notes
        const completeRequest = {
          endDate: inseminationDate,
          outcome: outcome,
          notes: notes,
        };

        console.log("[Confirm IUI] Completing cycle:", {
          cycleId: currentCycle.id,
          selectedSpermSampleId,
          completeRequest,
        });

        // Complete current cycle
        await api.treatmentCycle.completeTreatmentCycle(
          currentCycle.id,
          completeRequest
        );

        console.log("[Confirm IUI] Cycle completed successfully");

        // Find and start next cycle (step5_post_iui) if exists
        const allCycles = allCyclesData || [];
        const sortedCycles = [...allCycles].sort((a, b) => {
          const orderA = a.orderIndex ?? a.cycleNumber ?? 0;
          const orderB = b.orderIndex ?? b.cycleNumber ?? 0;
          return orderA - orderB;
        });

        const currentCycleIndex = sortedCycles.findIndex(
          (c) => c.id === currentCycle.id
        );

        // Find and start the next cycle
        if (
          currentCycleIndex >= 0 &&
          currentCycleIndex < sortedCycles.length - 1
        ) {
          const nextCycle = sortedCycles[currentCycleIndex + 1];
          const nextCycleStatus = normalizeTreatmentCycleStatus(
            nextCycle.status
          );

          // Start next cycle if it's Planned or Scheduled
          if (
            nextCycleStatus === "Planned" ||
            nextCycleStatus === "Scheduled"
          ) {
            try {
              const now = new Date().toISOString();
              await api.treatmentCycle.updateTreatmentCycle(nextCycle.id, {
                status: "InProgress",
                startDate: now,
                currentStep: "step5_post_iui" as IUIStep,
                stepDates: {
                  step5_post_iui: now,
                },
              });
              console.log(
                "[Confirm IUI] Next cycle started:",
                nextCycle.cycleName
              );
            } catch (error: any) {
              console.warn("Failed to start next cycle:", error);
              // Don't throw - cycle completion was successful
            }
          }
        }

        // Update IUI treatment inseminationDate if treatmentId exists
        if (currentCycle.treatmentId) {
          try {
            const iuiResponse = await api.treatmentIUI.getIUIByTreatmentId(
              currentCycle.treatmentId
            );
            if (iuiResponse.data?.id) {
              await api.treatmentIUI.updateIUI(iuiResponse.data.id, {
                treatmentId: currentCycle.treatmentId,
                inseminationDate: inseminationDate,
                status: "Insemination",
              });
              console.log("[Confirm IUI] IUI treatment updated");
            }
          } catch (error: any) {
            console.warn("Could not update IUI treatment:", error);
          }
        }

        return { success: true };
      } catch (error: any) {
        console.error("[Confirm IUI] Error:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      toast.success("IUI procedure confirmed successfully");
      setShowIUIConfirm(false);
      setSelectedSpermSampleId(null); // Reset selected sample

      // Invalidate and refetch queries to update UI immediately
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["doctor", "treatment-cycles"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["doctor", "treatment-cycle", currentCycle.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["treatment-iui", currentCycle.treatmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["sperm-samples"],
        }),
      ]);

      // Refetch cycle data immediately to ensure UI updates
      await queryClient.refetchQueries({
        queryKey: ["doctor", "treatment-cycle", currentCycle.id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to confirm IUI procedure"
      );
    },
  });

  if (!isOpen) return null;

  // Patient information - merge patientData with userDetails
  const patientName =
    getFullNameFromObject(userDetails) ||
    getFullNameFromObject(patientData) ||
    userDetails?.userName ||
    (isPatientDetailResponse(patientData)
      ? patientData.accountInfo?.username
      : null) ||
    "Unknown Patient";
  const patientCode = patientData?.patientCode || "";

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth: string | undefined): number | null => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const patientAge = calculateAge(userDetails?.dob || patientData?.dateOfBirth);

  const patientPhone =
    (isPatientDetailResponse(patientData)
      ? patientData.accountInfo?.phone
      : null) ||
    patientData?.phoneNumber ||
    null;
  const formattedPhone = patientPhone
    ? patientPhone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
    : null;

  // Cycle information
  const startDate = currentCycle.startDate
    ? new Date(currentCycle.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Primary doctor - use same logic as AgreementDocument
  const primaryDoctorName =
    getFullNameFromObject(primaryDoctorUserDetails) ||
    getFullNameFromObject(primaryDoctor) ||
    getFullNameFromObject(doctorProfile) ||
    getFullNameFromObject(user) ||
    primaryDoctorUserDetails?.userName ||
    user?.userName ||
    "Dr. Unknown";

  const appointments = appointmentsData?.data || [];

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    return getAppointmentStatusBadgeClass(status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Patient Info */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {patientName}
                {patientAge && `, ${patientAge}`}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                {patientCode && <span>{patientCode}</span>}
                {formattedPhone && <span>{formattedPhone}</span>}
                {startDate && <span>Started: {startDate}</span>}
                <span>Primary Doctor: {primaryDoctorName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                disabled={false}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Treatment Stages Navigation */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex-shrink-0">
          <HorizontalTreatmentTimeline
            cycle={currentCycle}
            allCycles={enhancedAllCyclesData}
          />
        </div>

        {/* Content Tabs */}
        <div className="border-b border-gray-200 bg-white flex-shrink-0">
          <div className="px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-0 overflow-x-auto flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4">
                {[
                  { id: "assessment" as TabType, label: "Assessment" },
                  {
                    id: "medical-history" as TabType,
                    label: "Medical History",
                  },
                  {
                    id: "treatment-plan" as TabType,
                    label: "Treatment Plan",
                  },
                  { id: "prescription" as TabType, label: "Prescription" },
                  { id: "service" as TabType, label: "Service" },
                  // Show IUI Procedure tab for IUI cycles at IUI Procedure step
                  ...(isIUIProcedureStep && hasStarted
                    ? [
                        {
                          id: "iui-procedure" as TabType,
                          label: "IUI Procedure",
                        },
                      ]
                    : []),
                  // Only show Sperm and Oocyte tabs for IVF cycles
                  ...(isIVFCycle
                    ? [
                        { id: "sperm" as TabType, label: "Sperm Samples" },
                        { id: "oocyte" as TabType, label: "Oocyte Samples" },
                      ]
                    : []),
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "whitespace-nowrap border-b-2 px-4 py-4 text-sm font-medium transition-colors flex-shrink-0",
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <>
            {activeTab === "assessment" && (
              <div className="space-y-6">
                {/* Assessment Data Cards */}
                {assessmentData && Object.keys(assessmentData).length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assessmentData.amh && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            AMH Level
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {assessmentData.amh.value}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assessmentData.amh.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentData.afc && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Antral Follicle Count
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {assessmentData.afc.value}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assessmentData.afc.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentData.fsh && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            FSH Level
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {assessmentData.fsh.value}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assessmentData.fsh.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentData.lh && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            LH Level
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {assessmentData.lh.value}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assessmentData.lh.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentData.semen && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Semen Analysis
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {assessmentData.semen.value}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assessmentData.semen.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentData.uterine && (
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Uterine Assessment
                          </p>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {assessmentData.uterine.value}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assessmentData.uterine.description}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* In Vitro Fertilization Section - only show for step5_fertilization */}
                {(() => {
                  // Check if we're at fertilization step
                  const currentStep = String(
                    currentCycle.currentStep || ""
                  ).toLowerCase();
                  const stepType = String(
                    currentCycle.stepType || ""
                  ).toUpperCase();
                  const cycleName = String(
                    currentCycle.cycleName || ""
                  ).toLowerCase();
                  const cycleNumber = currentCycle.cycleNumber;

                  const isFertilizationStep =
                    currentStep === "step5_fertilization" ||
                    stepType === "IVF_FERTILIZATION" ||
                    stepType.includes("FERTILIZATION") ||
                    cycleName.includes("fertilization") ||
                    cycleName.includes("in vitro") ||
                    cycleNumber === 4; // Step 4 in the timeline is fertilization

                  const shouldShow =
                    isFertilizationStep &&
                    isIVFCycle &&
                    !isCompleted &&
                    !isCancelled;

                  // Always log to debug
                  console.log("[FertilizationSection] Full Check:", {
                    currentStep,
                    stepType,
                    cycleName,
                    cycleNumber,
                    isFertilizationStep,
                    isIVFCycle,
                    isCompleted,
                    isCancelled,
                    shouldShow,
                    cycleId: currentCycle.id,
                    treatmentType: currentCycle.treatmentType,
                    status: currentCycle.status,
                  });

                  return shouldShow;
                })() && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <FlaskConical className="h-5 w-5 text-primary" />
                            In Vitro Fertilization (IVF)
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1 font-normal">
                            Select sperm and oocyte samples to send to the lab
                            for fertilization
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowFertilizationModal(true)}
                          className="bg-primary hover:bg-primary/90"
                          size="sm"
                        >
                          Select Samples for Fertilization
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Sperm Samples
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {(() => {
                              const count = Array.isArray(spermSamples)
                                ? spermSamples.filter(
                                    (s) => s.canFertilize === true
                                  ).length
                                : 0;
                              // Debug log
                              if (process.env.NODE_ENV === "development") {
                                console.log(
                                  "[CycleUpdateModal] Sperm samples count:",
                                  {
                                    total: Array.isArray(spermSamples)
                                      ? spermSamples.length
                                      : 0,
                                    marked: count,
                                    samples: Array.isArray(spermSamples)
                                      ? spermSamples.map((s) => ({
                                          id: s.id,
                                          canFertilize: s.canFertilize,
                                          status: s.status,
                                        }))
                                      : [],
                                  }
                                );
                              }
                              return count;
                            })()}
                          </p>
                          <p className="text-xs text-gray-500">
                            marked for fertilization
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Oocyte Samples
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {(() => {
                              const count = Array.isArray(oocyteSamples)
                                ? oocyteSamples.filter(
                                    (s) => s.canFertilize === true
                                  ).length
                                : 0;
                              // Debug log
                              if (process.env.NODE_ENV === "development") {
                                console.log(
                                  "[CycleUpdateModal] Oocyte samples count:",
                                  {
                                    total: Array.isArray(oocyteSamples)
                                      ? oocyteSamples.length
                                      : 0,
                                    marked: count,
                                    samples: Array.isArray(oocyteSamples)
                                      ? oocyteSamples.map((s) => ({
                                          id: s.id,
                                          canFertilize: s.canFertilize,
                                          status: s.status,
                                        }))
                                      : [],
                                  }
                                );
                              }
                              return count;
                            })()}
                          </p>
                          <p className="text-xs text-gray-500">
                            marked for fertilization
                          </p>
                        </div>
                      </div>
                      {((Array.isArray(spermSamples)
                        ? spermSamples.filter((s) => s.canFertilize === true)
                            .length
                        : 0) > 0 ||
                        (Array.isArray(oocyteSamples)
                          ? oocyteSamples.filter((s) => s.canFertilize === true)
                              .length
                          : 0) > 0) && (
                        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <p className="text-sm text-blue-900">
                            ✓ Samples have been marked and are ready for lab
                            fertilization. The lab will create embryos upon
                            receiving the samples.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Cycle Actions */}
                <Card>
                  <CardContent className="space-y-3 pt-4">
                    {/* Start Cycle Section - Show if cycle hasn't started */}
                    {canStartCycle && !isCompleted && !isCancelled && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Ready to Start
                            </p>
                            <p className="text-xs text-gray-600">
                              Start this treatment cycle to begin tracking
                              progress
                            </p>
                          </div>
                          <Button
                            onClick={() => startCycleMutation.mutate()}
                            disabled={startCycleMutation.isPending}
                            className="gap-2"
                            size="sm"
                          >
                            <Play className="h-4 w-4" />
                            {startCycleMutation.isPending
                              ? "Starting..."
                              : "Start Cycle"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Complete Cycle Section - Show if cycle has started */}
                    {hasStarted && !isCompleted && !isCancelled && (
                      <div
                        className={cn(
                          "rounded-lg border p-4",
                          canCompleteCycle
                            ? "border-green-200 bg-green-50/50"
                            : "border-amber-200 bg-amber-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Complete Treatment Cycle
                            </p>
                            <p className="text-xs text-gray-600">
                              {isIVFCycle3 && !canCompleteCycle3 ? (
                                <span className="text-amber-700">
                                  Waiting for lab to return sperm and oocyte
                                  sample data. Both samples must be quality
                                  checked before completing this cycle.
                                </span>
                              ) : (
                                "Mark this treatment cycle as complete"
                              )}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              // Validate IVF cycle 3 before showing confirmation
                              if (isIVFCycle3 && !canCompleteCycle3) {
                                const missingSamples: string[] = [];
                                const hasAnySpermSamples =
                                  spermSamples.length > 0;
                                const hasAnyOocyteSamples =
                                  oocyteSamples.length > 0;

                                // If no samples exist at all, allow completion
                                if (
                                  !hasAnySpermSamples &&
                                  !hasAnyOocyteSamples
                                ) {
                                  // Allow completion - no samples to validate
                                } else {
                                  // We have some samples, check which ones are missing
                                  if (!hasAnySpermSamples) {
                                    missingSamples.push("sperm quality check");
                                  }
                                  if (!hasAnyOocyteSamples) {
                                    missingSamples.push("oocyte quality check");
                                  }

                                  if (missingSamples.length > 0) {
                                    toast.error(
                                      `Cannot complete cycle: Lab has not returned ${missingSamples.join(" and ")} data. Please wait for lab to complete quality checks.`
                                    );
                                    return;
                                  }
                                }
                              }
                              setShowCompleteConfirm(true);
                            }}
                            className="gap-2"
                            size="sm"
                            variant="default"
                            disabled={!canCompleteCycle}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Complete Cycle
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Cancel Cycle Section - Show if cycle can be cancelled */}
                    {canCancelCycle && (
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Cancel Treatment Cycle
                            </p>
                            <p className="text-xs text-gray-600">
                              Cancel this treatment cycle and stop the process
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowCancelConfirm(true)}
                            className="gap-2"
                            size="sm"
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel Cycle
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Prescription Tab */}
            {activeTab === "prescription" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {/* Toggle between Create and View */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          prescriptionViewMode === "create"
                            ? "default"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() => setPrescriptionViewMode("create")}
                        className="text-xs"
                      >
                        Create
                      </Button>
                      <Button
                        type="button"
                        variant={
                          prescriptionViewMode === "view" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setPrescriptionViewMode("view")}
                        className="text-xs"
                      >
                        View ({prescriptions.length})
                      </Button>
                    </div>
                    {selectedAppointmentId && (
                      <p className="text-xs text-gray-500">
                        Filtered by selected appointment
                      </p>
                    )}
                  </div>

                  {/* Create Mode */}
                  {prescriptionViewMode === "create" && (
                    <form
                      onSubmit={prescriptionForm.handleSubmit((data) =>
                        createPrescriptionMutation.mutate(data)
                      )}
                      className="space-y-3"
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="medicalRecordId"
                          className="text-sm font-medium"
                        >
                          Medical Record ID *
                        </Label>
                        {selectedMedicalRecord ? (
                          <div className="space-y-1">
                            <Input
                              id="medicalRecordId"
                              {...prescriptionForm.register("medicalRecordId", {
                                required: "Medical Record ID is required",
                              })}
                              value={
                                prescriptionForm.watch("medicalRecordId") ||
                                selectedMedicalRecord.id
                              }
                              onChange={(e) => {
                                prescriptionForm.setValue(
                                  "medicalRecordId",
                                  e.target.value
                                );
                              }}
                              placeholder="Enter medical record ID"
                              className="text-sm h-9"
                            />
                            <p className="text-xs text-gray-500">
                              Auto-selected from Appointment History:{" "}
                              {getLast4Chars(selectedMedicalRecord.id)}
                            </p>
                          </div>
                        ) : selectedAppointmentId ? (
                          <div className="space-y-1">
                            <Input
                              id="medicalRecordId"
                              {...prescriptionForm.register("medicalRecordId", {
                                required: "Medical Record ID is required",
                              })}
                              placeholder="Enter medical record ID"
                              className="text-sm h-9"
                            />
                            <p className="text-xs text-amber-600">
                              No medical record found for selected appointment.
                              Please create one first or enter manually.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input
                              id="medicalRecordId"
                              {...prescriptionForm.register("medicalRecordId", {
                                required: "Medical Record ID is required",
                              })}
                              placeholder="Enter medical record ID"
                              className="text-sm h-9"
                            />
                            <p className="text-xs text-gray-500">
                              Select an appointment from Appointment History to
                              auto-fill
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="prescription-diagnosis"
                          className="text-sm font-medium"
                        >
                          Diagnosis
                        </Label>
                        <Textarea
                          id="prescription-diagnosis"
                          {...prescriptionForm.register("diagnosis")}
                          rows={2}
                          placeholder="Enter diagnosis..."
                          className="resize-none text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            Medications *
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              appendMedication({
                                medicineId: "",
                                dosage: "",
                                frequency: "",
                                durationDays: 0,
                                quantity: 1,
                                notes: "",
                              })
                            }
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Medicine
                          </Button>
                        </div>
                        {medicationFields.map((field, index) => (
                          <Card key={field.id} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                  Medicine {index + 1}
                                </Label>
                                {medicationFields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeMedication(index)}
                                    className="h-6 w-6 p-0 text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <select
                                {...prescriptionForm.register(
                                  `medications.${index}.medicineId` as const,
                                  { required: "Please select a medicine" }
                                )}
                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                              >
                                <option value="">Select medicine</option>
                                {medicineOptions.map((medicine: Medicine) => (
                                  <option key={medicine.id} value={medicine.id}>
                                    {medicine.name}{" "}
                                    {medicine.form ? `(${medicine.form})` : ""}
                                  </option>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  {...prescriptionForm.register(
                                    `medications.${index}.dosage` as const
                                  )}
                                  placeholder="Dosage"
                                  className="text-sm h-8"
                                />
                                <Input
                                  {...prescriptionForm.register(
                                    `medications.${index}.frequency` as const
                                  )}
                                  placeholder="Frequency"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  {...prescriptionForm.register(
                                    `medications.${index}.durationDays` as const,
                                    { valueAsNumber: true }
                                  )}
                                  placeholder="Duration (days)"
                                  className="text-sm h-8"
                                />
                                <Input
                                  type="number"
                                  {...prescriptionForm.register(
                                    `medications.${index}.quantity` as const,
                                    { valueAsNumber: true }
                                  )}
                                  placeholder="Quantity"
                                  className="text-sm h-8"
                                />
                              </div>
                              <Textarea
                                {...prescriptionForm.register(
                                  `medications.${index}.notes` as const
                                )}
                                placeholder="Instructions/Notes"
                                rows={2}
                                className="resize-none text-sm"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="instructions"
                          className="text-sm font-medium"
                        >
                          Instructions
                        </Label>
                        <Textarea
                          id="instructions"
                          {...prescriptionForm.register("instructions")}
                          rows={2}
                          placeholder="Enter prescription instructions..."
                          className="resize-none text-sm"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          type="submit"
                          disabled={createPrescriptionMutation.isPending}
                        >
                          {createPrescriptionMutation.isPending
                            ? "Creating..."
                            : "Create Prescription"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* View Mode */}
                  {prescriptionViewMode === "view" && (
                    <div className="space-y-3">
                      {prescriptionsLoading ? (
                        <div className="py-4 text-center text-sm text-gray-500">
                          Loading prescriptions...
                        </div>
                      ) : prescriptions.length > 0 ? (
                        <div className="space-y-2">
                          {prescriptions.map((prescription: any) => (
                            <PrescriptionCard
                              key={prescription.id}
                              prescriptionId={prescription.id}
                              prescription={prescription}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-sm text-gray-500">
                          {selectedAppointmentId
                            ? "No prescriptions found for the selected appointment"
                            : "No prescriptions found for this treatment cycle"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Tab */}
            {activeTab === "service" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {/* Toggle between Create and View */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          serviceViewMode === "create" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setServiceViewMode("create")}
                        className="text-xs"
                      >
                        Create
                      </Button>
                      <Button
                        type="button"
                        variant={
                          serviceViewMode === "view" ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => setServiceViewMode("view")}
                        className="text-xs"
                      >
                        View ({serviceRequests.length})
                      </Button>
                    </div>
                    {selectedAppointmentId && (
                      <p className="text-xs text-gray-500">
                        Filtered by selected appointment
                      </p>
                    )}
                  </div>

                  {/* Create Mode */}
                  {serviceViewMode === "create" && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Create service requests for the patient
                      </p>
                      <Button
                        onClick={() => setShowCreateServiceRequestModal(true)}
                        className="w-full"
                      >
                        Create Service Request
                      </Button>
                    </div>
                  )}

                  {/* View Mode */}
                  {serviceViewMode === "view" && (
                    <div className="space-y-3">
                      {serviceRequestsLoading ? (
                        <div className="py-4 text-center text-sm text-gray-500">
                          Loading service requests...
                        </div>
                      ) : serviceRequests.length > 0 ? (
                        <div className="space-y-2">
                          {serviceRequests.map((request: any) => (
                            <Card key={request.id} className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium text-gray-900">
                                    Service Request #{getLast4Chars(request.id)}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {request.status || "Pending"}
                                  </Badge>
                                </div>
                                {request.requestedDate && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">
                                      Requested Date:
                                    </span>{" "}
                                    {new Date(
                                      request.requestedDate
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                )}
                                {request.notes && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Notes:</span>{" "}
                                    {request.notes}
                                  </p>
                                )}
                                {request.serviceDetails &&
                                  request.serviceDetails.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs font-medium text-gray-700">
                                        Services:
                                      </p>
                                      {request.serviceDetails.map(
                                        (detail: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200"
                                          >
                                            <p className="font-medium">
                                              {detail.serviceName ||
                                                detail.service?.name ||
                                                "Unknown"}
                                            </p>
                                            {detail.quantity && (
                                              <p>Quantity: {detail.quantity}</p>
                                            )}
                                            {detail.unitPrice && (
                                              <p>
                                                Price:{" "}
                                                {new Intl.NumberFormat(
                                                  "vi-VN",
                                                  {
                                                    style: "currency",
                                                    currency: "VND",
                                                  }
                                                ).format(detail.unitPrice)}
                                              </p>
                                            )}
                                            {detail.notes && (
                                              <p className="text-gray-500">
                                                Notes: {detail.notes}
                                              </p>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                {request.totalAmount && (
                                  <p className="text-xs font-medium text-gray-900 mt-2">
                                    Total:{" "}
                                    {new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(request.totalAmount)}
                                  </p>
                                )}
                                {request.createdAt && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Created:{" "}
                                    {new Date(
                                      request.createdAt
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-sm text-gray-500">
                          {selectedAppointmentId
                            ? "No service requests found for the selected appointment"
                            : "No service requests found for this treatment cycle"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IUI Procedure Tab */}
            {activeTab === "iui-procedure" &&
              isIUIProcedureStep &&
              hasStarted && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>IUI Procedure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-white shadow-md">
                        {/* Decorative gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30" />

                        <div className="relative p-4">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 rounded-lg bg-purple-100 p-2.5">
                              <Syringe className="h-5 w-5 text-purple-600" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                                Confirm IUI Procedure
                              </h3>
                              <p className="text-xs leading-relaxed text-gray-600 mb-3">
                                Select the sperm sample used for insemination
                                and confirm that the intrauterine insemination
                                (IUI) procedure has been performed. This will
                                automatically move the treatment cycle to the
                                post-IUI monitoring step.
                              </p>

                              {/* Sperm Sample Selection */}
                              <div className="mb-3 space-y-2">
                                <Label className="text-xs font-medium text-gray-700">
                                  Sperm Sample Used for Insemination
                                </Label>
                                {spermSamplesLoading ? (
                                  <div className="text-xs text-gray-500">
                                    Loading samples...
                                  </div>
                                ) : spermSamplesData?.data &&
                                  spermSamplesData.data.length > 0 ? (
                                  <div className="space-y-2">
                                    {spermSamplesData.data.map((sample) => (
                                      <div
                                        key={sample.id}
                                        onClick={() =>
                                          setSelectedSpermSampleId(sample.id)
                                        }
                                        className={cn(
                                          "cursor-pointer rounded-lg border-2 p-3 transition-all hover:shadow-md",
                                          selectedSpermSampleId === sample.id
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-gray-200 bg-white hover:border-purple-300"
                                        )}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <FlaskConical className="h-4 w-4 text-blue-500" />
                                              <span className="font-mono text-sm font-semibold">
                                                {sample.sampleCode ||
                                                  getLast4Chars(sample.id)}
                                              </span>
                                              <Badge
                                                className={cn(
                                                  "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border",
                                                  getStatusBadgeClass(
                                                    sample.status
                                                  )
                                                )}
                                              >
                                                {sample.status}
                                              </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                              <div>
                                                <span className="text-gray-500">
                                                  Collection Date:
                                                </span>
                                                <span className="ml-1 font-medium">
                                                  {sample.collectionDate
                                                    ? new Date(
                                                        sample.collectionDate
                                                      ).toLocaleDateString(
                                                        "en-US"
                                                      )
                                                    : "N/A"}
                                                </span>
                                              </div>
                                              {sample.sperm?.volume !==
                                                undefined &&
                                                sample.sperm.volume !==
                                                  null && (
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Volume:
                                                    </span>
                                                    <span className="ml-1 font-medium">
                                                      {sample.sperm.volume} mL
                                                    </span>
                                                  </div>
                                                )}
                                              {sample.sperm?.concentration !==
                                                undefined &&
                                                sample.sperm.concentration !==
                                                  null && (
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Concentration:
                                                    </span>
                                                    <span className="ml-1 font-medium">
                                                      {
                                                        sample.sperm
                                                          .concentration
                                                      }{" "}
                                                      million/mL
                                                    </span>
                                                  </div>
                                                )}
                                              {sample.sperm?.motility !==
                                                undefined &&
                                                sample.sperm.motility !==
                                                  null && (
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Motility:
                                                    </span>
                                                    <span className="ml-1 font-medium">
                                                      {sample.sperm.motility}%
                                                    </span>
                                                  </div>
                                                )}
                                              {sample.sperm
                                                ?.progressiveMotility !==
                                                undefined &&
                                                sample.sperm
                                                  .progressiveMotility !==
                                                  null && (
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Progressive Motility:
                                                    </span>
                                                    <span className="ml-1 font-medium">
                                                      {
                                                        sample.sperm
                                                          .progressiveMotility
                                                      }
                                                      %
                                                    </span>
                                                  </div>
                                                )}
                                              {sample.sperm?.morphology !==
                                                undefined &&
                                                sample.sperm.morphology !==
                                                  null && (
                                                  <div>
                                                    <span className="text-gray-500">
                                                      Morphology:
                                                    </span>
                                                    <span className="ml-1 font-medium">
                                                      {sample.sperm.morphology}%
                                                    </span>
                                                  </div>
                                                )}
                                              {sample.sperm?.quality && (
                                                <div>
                                                  <span className="text-gray-500">
                                                    Quality:
                                                  </span>
                                                  <span className="ml-1 font-medium">
                                                    {sample.sperm.quality}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex-shrink-0 ml-2">
                                            {selectedSpermSampleId ===
                                              sample.id && (
                                              <div className="rounded-full bg-purple-500 p-1">
                                                <CheckCircle className="h-4 w-4 text-white" />
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                    No quality-checked sperm samples available.
                                    Please wait for the lab to complete quality
                                    checks before proceeding.
                                  </div>
                                )}
                              </div>

                              {/* Button */}
                              <Button
                                onClick={handleConfirmIUIClick}
                                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
                                size="sm"
                                disabled={
                                  confirmIUIProcedureMutation.isPending ||
                                  (!selectedSpermSampleId &&
                                    spermSamplesData?.data &&
                                    spermSamplesData.data.length > 0)
                                }
                              >
                                <Syringe className="h-3.5 w-3.5" />
                                {confirmIUIProcedureMutation.isPending
                                  ? "Processing..."
                                  : "Confirm IUI Procedure"}
                              </Button>
                              {!selectedSpermSampleId &&
                                spermSamplesData?.data &&
                                spermSamplesData.data.length > 0 && (
                                  <p className="text-xs text-amber-600 mt-2">
                                    Please select a sperm sample before
                                    confirming
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            {/* Sperm Samples Tab */}
            {activeTab === "sperm" && (
              <Card>
                <CardHeader>
                  <CardTitle>Sperm Samples</CardTitle>
                </CardHeader>
                <CardContent>
                  {spermSamplesLoading ? (
                    <div className="py-12 text-center text-gray-500">
                      Loading sperm samples...
                    </div>
                  ) : cycleSpermSamples.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <p>No sperm samples found for this treatment cycle.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sample Code</th>
                            <th className="text-left p-3">Collection Date</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Volume</th>
                            <th className="text-left p-3">Concentration</th>
                            <th className="text-left p-3">Motility</th>
                            <th className="text-left p-3">
                              Progressive Motility
                            </th>
                            <th className="text-left p-3">Morphology</th>
                            <th className="text-left p-3">Quality</th>
                            <th className="text-left p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycleSpermSamples.map(
                            (sample: LabSampleDetailResponse) => (
                              <tr
                                key={sample.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4 text-blue-500" />
                                    <span className="font-mono text-sm">
                                      {sample.sampleCode ||
                                        getLast4Chars(sample.id)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">
                                  {formatDate(sample.collectionDate)}
                                </td>
                                <td className="p-3">
                                  <Badge
                                    className={cn(
                                      "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                      getSampleStatusBadgeClass(sample.status)
                                    )}
                                  >
                                    {sample.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.sperm?.volume !== undefined &&
                                  sample.sperm.volume !== null
                                    ? `${sample.sperm.volume} mL`
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.sperm?.concentration !== undefined &&
                                  sample.sperm.concentration !== null
                                    ? `${sample.sperm.concentration} million/mL`
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.sperm?.motility !== undefined &&
                                  sample.sperm.motility !== null
                                    ? `${sample.sperm.motility}%`
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.sperm?.progressiveMotility !==
                                    undefined &&
                                  sample.sperm.progressiveMotility !== null
                                    ? `${sample.sperm.progressiveMotility}%`
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.sperm?.morphology !== undefined &&
                                  sample.sperm.morphology !== null
                                    ? `${sample.sperm.morphology}%`
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.sperm?.quality ||
                                    sample.quality ||
                                    "—"}
                                </td>
                                <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                                  {sample.notes || "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Oocyte Samples Tab */}
            {activeTab === "oocyte" && (
              <Card>
                <CardHeader>
                  <CardTitle>Oocyte Samples</CardTitle>
                </CardHeader>
                <CardContent>
                  {oocyteSamplesLoading ? (
                    <div className="py-12 text-center text-gray-500">
                      Loading oocyte samples...
                    </div>
                  ) : cycleOocyteSamples.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                      <p>No oocyte samples found for this treatment cycle.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sample Code</th>
                            <th className="text-left p-3">Collection Date</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Maturity Stage</th>
                            <th className="text-left p-3">Is Mature</th>
                            <th className="text-left p-3">Quality</th>
                            <th className="text-left p-3">Is Vitrified</th>
                            <th className="text-left p-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycleOocyteSamples.map(
                            (sample: LabSampleDetailResponse) => (
                              <tr
                                key={sample.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4 text-pink-500" />
                                    <span className="font-mono text-sm">
                                      {sample.sampleCode ||
                                        getLast4Chars(sample.id)}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">
                                  {formatDate(sample.collectionDate)}
                                </td>
                                <td className="p-3">
                                  <Badge
                                    className={cn(
                                      "inline-flex rounded-full px-2 py-1 text-xs font-semibold border",
                                      getSampleStatusBadgeClass(sample.status)
                                    )}
                                  >
                                    {sample.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.oocyte?.maturityStage || "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.oocyte?.isMature !== undefined &&
                                  sample.oocyte.isMature !== null
                                    ? sample.oocyte.isMature
                                      ? "Yes"
                                      : "No"
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.oocyte?.quality ||
                                    sample.quality ||
                                    "—"}
                                </td>
                                <td className="p-3 text-sm">
                                  {sample.oocyte?.isVitrified !== undefined &&
                                  sample.oocyte.isVitrified !== null
                                    ? sample.oocyte.isVitrified
                                      ? "Yes"
                                      : "No"
                                    : "—"}
                                </td>
                                <td className="p-3 text-sm text-gray-600 max-w-xs truncate">
                                  {sample.notes || "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bottom Section - Appointment History & Medical Notes */}
            {(activeTab === "assessment" ||
              activeTab === "prescription" ||
              activeTab === "service") && (
              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Appointment History
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setShowCreateAppointmentModal(true)}
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule New
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {appointmentsLoading ? (
                      <div className="py-4 text-center text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : appointments.length > 0 ? (
                      <div className="space-y-2">
                        {appointments
                          .slice(0, 5)
                          .map(
                            (
                              appointment: AppointmentExtendedDetailResponse
                            ) => (
                              <div
                                key={appointment.id}
                                onClick={() =>
                                  setSelectedAppointmentId(appointment.id)
                                }
                                className={cn(
                                  "flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors cursor-pointer",
                                  selectedAppointmentId === appointment.id
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200"
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900">
                                    Date:{" "}
                                    {new Date(appointment.appointmentDate)
                                      .toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                      .toUpperCase()}{" "}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Type:{" "}
                                    {appointment.typeName ||
                                      appointment.type ||
                                      "Consultation"}
                                    {appointment.status === "Scheduled" &&
                                      " (Scheduled)"}
                                  </p>
                                  {(appointment.doctors?.[0] ||
                                    appointment.slot?.schedule?.doctor) && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Doctor:{" "}
                                      {getFullNameFromObject(
                                        appointment.doctors?.[0]
                                      ) ||
                                        getFullNameFromObject(
                                          appointment.slot?.schedule?.doctor
                                        ) ||
                                        "Dr. Unknown"}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Time:{" "}
                                    {appointment.slot?.startTime
                                      ? new Date(
                                          `2000-01-01T${appointment.slot.startTime}`
                                        ).toLocaleTimeString("en-GB", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : new Date(
                                          appointment.appointmentDate
                                        ).toLocaleTimeString("en-GB", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs shrink-0",
                                    getStatusBadgeClass(appointment.status)
                                  )}
                                >
                                  {appointment.statusName || appointment.status}
                                </Badge>
                              </div>
                            )
                          )}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-gray-500">
                        No appointments found
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Medical Notes
                      {selectedAppointmentId && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (Filtered by selected appointment)
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {selectedAppointmentId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAppointmentId(null)}
                          className="text-xs"
                        >
                          Clear Filter
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (!selectedAppointmentId) {
                            toast.error("Please select an appointment first");
                            return;
                          }
                          setShowCreateMedicalRecordModal(true);
                        }}
                        disabled={!selectedAppointmentId}
                      >
                        + Add Note
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {cycleMedicalRecords.length > 0 ? (
                      <div className="space-y-3">
                        {cycleMedicalRecords
                          .sort((a, b) => {
                            const dateA = new Date(a.createdAt).getTime();
                            const dateB = new Date(b.createdAt).getTime();
                            return dateB - dateA;
                          })
                          .slice(0, 3)
                          .map((record: MedicalRecord) => {
                            // Find appointment from appointmentsData
                            const appointment = cycleAppointments.find(
                              (apt: AppointmentExtendedDetailResponse) =>
                                apt.id === record.appointmentId
                            );

                            // Get doctor name from appointment or fallback to current doctor
                            const doctorName =
                              getFullNameFromObject(
                                appointment?.doctors?.[0]
                              ) ||
                              getFullNameFromObject(
                                appointment?.slot?.schedule?.doctor
                              ) ||
                              getFullNameFromObject(primaryDoctor) ||
                              getFullNameFromObject(doctorProfile) ||
                              getFullNameFromObject(user) ||
                              primaryDoctorUserDetails?.userName ||
                              user?.userName ||
                              "Dr. Unknown";

                            return (
                              <div
                                key={record.id}
                                className="rounded-lg border border-gray-200 bg-white p-3"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-xs font-medium text-gray-900">
                                      Doctor: {doctorName}
                                    </p>
                                    {record.appointmentId && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Appointment:{" "}
                                        {getLast4Chars(record.appointmentId)}
                                      </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(record.createdAt)
                                        .toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })
                                        .toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                {record.notes && (
                                  <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
                                    {record.notes}
                                  </p>
                                )}
                                {!record.notes && record.treatmentPlan && (
                                  <p className="text-xs text-gray-700 mt-2 whitespace-pre-wrap line-clamp-3">
                                    {record.treatmentPlan}
                                  </p>
                                )}
                                {record.treatmentPlan && (
                                  <div className="mt-2">
                                    <a
                                      href="#"
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setActiveTab("treatment-plan");
                                      }}
                                    >
                                      Treatment Plan
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-gray-500">
                        No medical notes available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "medical-history" && (
              <div className="space-y-4">
                {assessmentRecord ? (
                  <div className="space-y-4">
                    {assessmentRecord.history && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Medical History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {assessmentRecord.history}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentRecord.chiefComplaint && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Chief Complaint
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {assessmentRecord.chiefComplaint}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentRecord.physicalExamination && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Physical Examination
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {assessmentRecord.physicalExamination}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {assessmentRecord.diagnosis && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Diagnosis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {assessmentRecord.diagnosis}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No medical history available
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "treatment-plan" && (
              <div className="space-y-4">
                {assessmentRecord?.treatmentPlan ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Treatment Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {assessmentRecord.treatmentPlan}
                        </p>
                        {assessmentRecord.followUpInstructions && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Follow-up Instructions
                            </h4>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {assessmentRecord.followUpInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No treatment plan available
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        </div>
      </div>

      {/* Cancel Cycle Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Treatment Cycle
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">
                  Reason <span className="text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter cancellation reason..."
                  disabled={isCancelling || cancelCycleMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancel-notes">
                  Notes <span className="text-gray-500">(Optional)</span>
                </Label>
                <Textarea
                  id="cancel-notes"
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={4}
                  disabled={isCancelling || cancelCycleMutation.isPending}
                />
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel this treatment cycle? This
                action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelConfirm(false);
                  setCancelReason("");
                  setCancelNotes("");
                }}
                disabled={isCancelling || cancelCycleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsCancelling(true);
                  cancelCycleMutation.mutate();
                }}
                disabled={isCancelling || cancelCycleMutation.isPending}
              >
                {isCancelling || cancelCycleMutation.isPending
                  ? "Cancelling..."
                  : "Cancel Cycle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Cycle Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Complete Treatment Cycle
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="complete-outcome">
                  Outcome <span className="text-gray-500">(Optional)</span>
                </Label>
                <Input
                  id="complete-outcome"
                  value={completeOutcome}
                  onChange={(e) => setCompleteOutcome(e.target.value)}
                  placeholder="e.g., Successful, Positive Result, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-notes">
                  Notes <span className="text-gray-500">(Optional)</span>
                </Label>
                <Textarea
                  id="complete-notes"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  rows={4}
                  placeholder="Add any final notes or observations..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompleteConfirm(false);
                  setCompleteOutcome("");
                  setCompleteNotes("");
                }}
                disabled={completeCycleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => completeCycleMutation.mutate()}
                disabled={completeCycleMutation.isPending}
              >
                {completeCycleMutation.isPending
                  ? "Completing..."
                  : "Complete Cycle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateAppointmentModal && (
        <Modal
          isOpen={showCreateAppointmentModal}
          onClose={() => setShowCreateAppointmentModal(false)}
          title="Schedule New Appointment"
          size="2xl"
        >
          <DoctorCreateAppointmentForm
            doctorId={user?.id || ""}
            doctorName={
              getFullNameFromObject(doctorProfile) ||
              getFullNameFromObject(user) ||
              user?.userName ||
              undefined
            }
            layout="modal"
            defaultPatientId={currentCycle.patientId}
            disablePatientSelection={true}
            defaultAppointmentDate={formatDateForInput(new Date())}
            defaultAppointmentType="Consultation"
            treatmentCycleId={currentCycle.id}
            onClose={() => setShowCreateAppointmentModal(false)}
            onCreated={() => {
              toast.success("Appointment created successfully");
              setShowCreateAppointmentModal(false);
              queryClient.invalidateQueries({
                queryKey: [
                  "appointments",
                  "patient-history",
                  currentCycle.patientId,
                ],
              });
              queryClient.invalidateQueries({
                queryKey: ["medical-records"],
              });
            }}
          />
        </Modal>
      )}

      {/* Fertilization Modal */}
      {showFertilizationModal && currentCycle.patientId && (
        <FertilizationModal
          cycleId={currentCycle.id}
          patientId={currentCycle.patientId}
          isOpen={showFertilizationModal}
          onClose={() => setShowFertilizationModal(false)}
          onSuccess={() => {
            // Invalidate all related queries to refresh data
            queryClient.invalidateQueries({
              queryKey: ["sperm-samples"],
            });
            queryClient.invalidateQueries({
              queryKey: ["oocyte-samples"],
            });
            queryClient.invalidateQueries({
              queryKey: ["doctor", "treatment-cycle", currentCycle.id],
            });
            // Also invalidate quality-checked samples queries
            queryClient.invalidateQueries({
              queryKey: [
                "sperm-samples",
                "patient",
                currentCycle.patientId,
                "quality-checked",
              ],
            });
            queryClient.invalidateQueries({
              queryKey: [
                "oocyte-samples",
                "patient",
                currentCycle.patientId,
                "quality-checked",
              ],
            });
            // Invalidate partner samples if IVF
            if (isIVFCycle && partnerPatientId) {
              queryClient.invalidateQueries({
                queryKey: [
                  "sperm-samples",
                  "partner",
                  partnerPatientId,
                  "quality-checked",
                ],
              });
            }
            console.log(
              "[CycleUpdateModal] Invalidated queries after fertilization"
            );
          }}
        />
      )}

      {/* Create Medical Record Modal */}
      <CreateMedicalRecordForm
        isOpen={showCreateMedicalRecordModal}
        onClose={() => {
          setShowCreateMedicalRecordModal(false);
          setSelectedAppointmentId(null);
        }}
        defaultPatientId={currentCycle.patientId}
        defaultAppointmentId={selectedAppointmentId || undefined}
        defaultTreatmentCycleId={currentCycle.id}
        onCreated={() => {
          toast.success("Medical note created successfully");
          setShowCreateMedicalRecordModal(false);
          setSelectedAppointmentId(null);
          queryClient.invalidateQueries({
            queryKey: ["medical-records"],
          });
        }}
      />

      {/* Create Service Request Modal */}
      <CreateServiceRequestModal
        isOpen={showCreateServiceRequestModal}
        onClose={() => setShowCreateServiceRequestModal(false)}
        onSuccess={() => {
          setShowCreateServiceRequestModal(false);
          queryClient.invalidateQueries({
            queryKey: ["doctor", "service-requests"],
          });
        }}
        defaultPatientId={currentCycle.patientId}
        defaultAppointmentId={selectedAppointmentId || undefined}
      />

      {/* Confirm IUI Procedure Dialog */}
      <ConfirmationDialog
        isOpen={showIUIConfirm}
        onClose={() => setShowIUIConfirm(false)}
        onConfirm={() => {
          if (
            !selectedSpermSampleId &&
            spermSamplesData?.data &&
            spermSamplesData.data.length > 0
          ) {
            toast.error("Please select a sperm sample before confirming");
            return;
          }
          confirmIUIProcedureMutation.mutate();
        }}
        title="Confirm IUI Procedure"
        message={
          selectedSpermSampleId
            ? `Are you sure you want to confirm that the intrauterine insemination (IUI) procedure has been performed?\n\nSelected sperm sample: ${spermSamplesData?.data?.find((s) => s.id === selectedSpermSampleId)?.sampleCode || getLast4Chars(selectedSpermSampleId)}\n\nThis action will move the treatment cycle to the post-IUI monitoring step.`
            : spermSamplesData?.data && spermSamplesData.data.length > 0
              ? "Please select a sperm sample before confirming."
              : "Are you sure you want to confirm that the intrauterine insemination (IUI) procedure has been performed? This action will move the treatment cycle to the post-IUI monitoring step."
        }
        confirmText="Confirm"
        cancelText="Cancel"
        variant="default"
        isLoading={confirmIUIProcedureMutation.isPending}
      />
    </div>
  );
}
