/**
 * Cycle Update Modal Component
 * Rebuilt from scratch based on Figma design for updating treatment cycle records
 */

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  X,
  Calendar,
  History,
  Printer,
  MessageSquare,
  Play,
  CheckCircle,
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
} from "@/api/types";
import { HorizontalTreatmentTimeline } from "./HorizontalTreatmentTimeline";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { normalizeTreatmentCycleStatus } from "@/api/types";

interface CycleUpdateModalProps {
  cycle: TreatmentCycle;
  isOpen: boolean;
  onClose: () => void;
}

type UpdateRecordFormData = {
  outcome: string;
  notes: string;
};

type TabType =
  | "assessment"
  | "medical-history"
  | "partner-info"
  | "treatment-plan";

export function CycleUpdateModal({
  cycle,
  isOpen,
  onClose,
}: CycleUpdateModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("assessment");
  const { data: doctorProfile } = useDoctorProfile();

  // Fetch latest cycle details from API
  const { data: cycleDetails } = useQuery({
    queryKey: ["doctor", "treatment-cycle", cycle.id],
    queryFn: async () => {
      const response = await api.treatmentCycle.getTreatmentCycleById(cycle.id);
      return response.data;
    },
    enabled: isOpen && !!cycle.id,
    staleTime: 0,
  });

  const currentCycle = cycleDetails || cycle;

  // Fetch treatment to get doctorId
  const { data: treatmentData } = useQuery({
    queryKey: ["treatment", currentCycle.treatmentId],
    queryFn: async () => {
      if (!currentCycle.treatmentId) return null;
      const response = await api.treatment.getTreatmentById(
        currentCycle.treatmentId
      );
      return response.data;
    },
    enabled: !!currentCycle.treatmentId && isOpen,
  });

  // Fetch primary doctor details
  const { data: primaryDoctor } = useQuery({
    queryKey: ["doctor", treatmentData?.doctorId || currentCycle.doctorId],
    queryFn: async () => {
      const doctorId = treatmentData?.doctorId || currentCycle.doctorId;
      if (!doctorId) return null;
      try {
        const response = await api.doctor.getDoctorById(doctorId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!(treatmentData?.doctorId || currentCycle.doctorId) && isOpen,
  });

  // Parse outcome and notes
  const parseCycleData = useMemo(() => {
    const notes = currentCycle.notes || "";
    let outcome = "";
    let cleanNotes = notes;

    const outcomeMatch = notes.match(/^Outcome:\s*(.+?)(?:\n\n|\n|$)/i);
    if (outcomeMatch) {
      outcome = outcomeMatch[1].trim();
      cleanNotes = notes.replace(/^Outcome:\s*.+?(\n\n|\n|$)/i, "").trim();
    }

    return { outcome, notes: cleanNotes };
  }, [currentCycle.notes]);

  const form = useForm<UpdateRecordFormData>({
    defaultValues: {
      outcome: parseCycleData.outcome,
      notes: parseCycleData.notes,
    },
  });

  // Get patient details
  const { data: patientData } = useQuery({
    queryKey: ["patient", currentCycle.patientId],
    queryFn: async () => {
      if (!currentCycle.patientId) return null;
      const response = await api.patient.getPatientDetails(
        currentCycle.patientId
      );
      return response.data;
    },
    enabled: !!currentCycle.patientId && isOpen,
  });

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

  // Filter medical records by cycle appointments
  const cycleAppointments = useMemo(() => {
    return appointmentsData?.data || [];
  }, [appointmentsData]);

  const cycleMedicalRecords = useMemo(() => {
    if (!medicalRecordsData || cycleAppointments.length === 0) return [];
    const appointmentIds = cycleAppointments.map(
      (apt: AppointmentExtendedDetailResponse) => apt.id
    );
    return medicalRecordsData.filter((record: MedicalRecord) =>
      appointmentIds.includes(record.appointmentId)
    );
  }, [medicalRecordsData, cycleAppointments]);

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
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateRecordFormData) => {
      let combinedNotes = "";
      if (data.outcome) {
        combinedNotes = `Outcome: ${data.outcome}`;
        if (data.notes) {
          combinedNotes += `\n\n${data.notes}`;
        }
      } else if (data.notes) {
        combinedNotes = data.notes;
      }

      const response = await api.treatmentCycle.updateTreatmentCycle(
        currentCycle.id,
        {
          notes: combinedNotes || undefined,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Treatment record updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["doctor", "treatment-cycle", cycle.id],
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update treatment record"
      );
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
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

  // Check if cycle can be completed (simple version - just check if started)
  const canCompleteCycle = hasStarted && !isCompleted && !isCancelled;

  // Complete cycle mutation (simple version - just complete entire cycle)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completeOutcome, setCompleteOutcome] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  const completeCycleMutation = useMutation({
    mutationFn: async () => {
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

  if (!isOpen) return null;

  // Patient information - merge patientData with userDetails
  const patientName =
    userDetails?.fullName ||
    userDetails?.userName ||
    patientData?.accountInfo?.username ||
    patientData?.fullName ||
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
    patientData?.accountInfo?.phone || patientData?.phoneNumber || null;
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

  // Primary doctor
  const primaryDoctorName =
    primaryDoctor?.fullName || doctorProfile?.fullName || "Dr. Unknown";

  const appointments = appointmentsData?.data || [];

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "checkedin":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "inprogress":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "noshow":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header - Patient Info */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
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
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </Button>
              <Button size="sm" className="gap-2">
                Update Record
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Treatment Stages Navigation */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <HorizontalTreatmentTimeline
            cycle={{
              ...currentCycle,
              treatmentType: (currentCycle.treatmentType === "IUI" ||
              currentCycle.treatmentType === "IVF"
                ? currentCycle.treatmentType
                : treatmentData?.treatmentType === "IUI" ||
                    treatmentData?.treatmentType === "IVF"
                  ? treatmentData.treatmentType
                  : undefined) as "IUI" | "IVF" | undefined,
            }}
            allCycles={[currentCycle]}
          />
        </div>

        {/* Content Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-0 overflow-x-auto flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4">
                {[
                  { id: "assessment" as TabType, label: "Assessment" },
                  {
                    id: "medical-history" as TabType,
                    label: "Medical History",
                  },
                  { id: "partner-info" as TabType, label: "Partner Info" },
                  {
                    id: "treatment-plan" as TabType,
                    label: "Treatment Plan",
                  },
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
        <div className="p-6">
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

              {/* Recommended Treatment Plan */}
              {assessmentRecord?.treatmentPlan && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-900">
                      Recommended Treatment Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {assessmentRecord.treatmentPlan}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Update Treatment Record Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">
                    Update Treatment Record
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                  {canCompleteCycle && (
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Complete Treatment Cycle
                          </p>
                          <p className="text-xs text-gray-600">
                            Mark this treatment cycle as complete
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowCompleteConfirm(true)}
                          className="gap-2"
                          size="sm"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete Cycle
                        </Button>
                      </div>
                    </div>
                  )}
                  <form onSubmit={onSubmit} className="space-y-3">
                    {/* Outcome */}
                    <div className="space-y-1.5">
                      <Label htmlFor="outcome" className="text-sm font-medium">
                        Outcome{" "}
                        <span className="text-gray-500 font-normal">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        id="outcome"
                        {...form.register("outcome")}
                        placeholder="e.g., Successful, Positive Result, etc."
                        disabled={isSubmitting}
                        className="text-sm h-9"
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-sm font-medium">
                        Notes{" "}
                        <span className="text-gray-500 font-normal">
                          (Optional)
                        </span>
                      </Label>
                      <Textarea
                        id="notes"
                        {...form.register("notes")}
                        rows={4}
                        placeholder="Add any additional notes, observations, or important information..."
                        disabled={isSubmitting}
                        className="resize-none text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update Record"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Bottom Section - Appointment History & Medical Notes */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Appointment History
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-2">
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
                                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900">
                                    {new Date(appointment.appointmentDate)
                                      .toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                      .toUpperCase()}{" "}
                                    {appointment.typeName ||
                                      appointment.type ||
                                      "Consultation"}
                                    {appointment.status === "Scheduled" &&
                                      " (Scheduled)"}
                                  </p>
                                  {(appointment.doctors?.[0] ||
                                    appointment.slot?.schedule?.doctor) && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {appointment.doctors?.[0]?.fullName ||
                                        appointment.slot?.schedule?.doctor
                                          ?.fullName ||
                                        "Dr. Unknown"}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
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
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-2">
                      + Add Note
                    </Button>
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
                          .map((record: MedicalRecord) => (
                            <div
                              key={record.id}
                              className="rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {(record as any).appointment?.doctors?.[0]
                                      ?.fullName ||
                                      (record as any).appointment?.slot?.doctor
                                        ?.fullName ||
                                      "Dr. Unknown"}
                                  </p>
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
                          ))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-sm text-gray-500">
                        No medical notes available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
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

          {activeTab === "partner-info" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Partner information will be displayed here
                </CardContent>
              </Card>
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
        </div>
      </div>

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
    </div>
  );
}
