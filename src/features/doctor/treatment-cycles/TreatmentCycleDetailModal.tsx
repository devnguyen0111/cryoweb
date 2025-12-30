/**
 * Treatment Cycle Detail Modal Component
 * Displays comprehensive treatment cycle information including:
 * - Overview
 * - Medical Records
 * - Oocytes samples
 * - Sperm samples
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { isAxiosError } from "axios";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import {
  type TreatmentCycle,
  type MedicalRecord,
  type LabSampleDetailResponse,
  type Relationship,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";
import { getSampleStatusBadgeClass } from "@/utils/status-colors";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { FlaskConical } from "lucide-react";
import { TreatmentTimeline } from "./TreatmentTimeline";
import { CycleUpdateForm } from "./CycleUpdateForm";
import { useQueryClient } from "@tanstack/react-query";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

interface TreatmentCycleDetailModalProps {
  cycle: TreatmentCycle;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "overview" | "medical-records" | "oocytes" | "sperm" | "partner";

export function TreatmentCycleDetailModal({
  cycle,
  isOpen,
  onClose,
}: TreatmentCycleDetailModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

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

  const currentCycle = cycleDetails || cycle;

  // Fetch treatment to get treatmentType
  const { data: treatmentData } = useQuery({
    queryKey: ["treatment", currentCycle.treatmentId],
    queryFn: async () => {
      if (!currentCycle.treatmentId) return null;
      try {
        const response = await api.treatment.getTreatmentById(
          currentCycle.treatmentId
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!currentCycle.treatmentId && isOpen,
  });

  // Fetch patient details
  const { data: patientDetails } = usePatientDetails(
    currentCycle.patientId,
    !!currentCycle.patientId && isOpen
  );

  // Fetch user details for patient name
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", currentCycle.patientId],
    queryFn: async () => {
      if (!currentCycle.patientId) return null;
      try {
        const response = await api.user.getUserDetails(currentCycle.patientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!currentCycle.patientId && isOpen,
  });

  // Get patient name and code
  const patientName =
    getFullNameFromObject(userDetails) ||
    getFullNameFromObject(patientDetails) ||
    userDetails?.userName ||
    (isPatientDetailResponse(patientDetails)
      ? patientDetails.accountInfo?.username
      : null) ||
    "Unknown";
  const patientCode = patientDetails?.patientCode;

  // Function to get treatment type with fallback logic
  const getTreatmentType = (): string => {
    // First, try cycle.treatmentType
    if (
      currentCycle.treatmentType === "IUI" ||
      currentCycle.treatmentType === "IVF"
    ) {
      return currentCycle.treatmentType;
    }

    // Try to get from treatment data
    if (treatmentData?.treatmentType) {
      const treatmentType = treatmentData.treatmentType;
      if (treatmentType === "IUI" || treatmentType === "IVF") {
        return treatmentType;
      }
    }

    // Try to infer from stepType (e.g., "IUI_PreCyclePreparation", "IVF_StimulationStart")
    if (currentCycle.stepType) {
      const stepTypeStr = String(currentCycle.stepType).toUpperCase();
      if (stepTypeStr.startsWith("IUI_")) {
        return "IUI";
      } else if (stepTypeStr.startsWith("IVF_")) {
        return "IVF";
      }
    }

    // Try to infer from cycleName (e.g., "IVF Treatment Plan - Pre-Cycle Preparation")
    if (currentCycle.cycleName) {
      const cycleNameUpper = currentCycle.cycleName.toUpperCase();
      if (cycleNameUpper.includes("IVF")) {
        return "IVF";
      } else if (cycleNameUpper.includes("IUI")) {
        return "IUI";
      }
    }

    return "N/A";
  };

  const treatmentType = getTreatmentType();

  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Fetch medical records for this cycle
  const { data: medicalRecordsData, isLoading: medicalRecordsLoading } =
    useQuery({
      queryKey: ["medical-records", "cycle", cycle.id],
      queryFn: async () => {
        try {
          const response = await api.medicalRecord.getMedicalRecords({
            PatientId: currentCycle.patientId,
            Page: 1,
            Size: 100,
          });
          return response.data || [];
        } catch (error) {
          console.error("Error fetching medical records:", error);
          return [];
        }
      },
      enabled: !!currentCycle.patientId && !!cycle.id && isOpen,
    });

  const medicalRecords = medicalRecordsData || [];

  // Fetch oocyte samples for this patient and cycle
  const { data: oocyteSamplesData, isLoading: oocyteSamplesLoading } = useQuery(
    {
      queryKey: ["oocyte-samples", "cycle", cycle.id, currentCycle.patientId],
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
                !sample.treatmentCycleId || sample.treatmentCycleId === cycle.id
            ),
          };
        } catch (error) {
          console.error("Error fetching oocyte samples:", error);
          return { data: [] };
        }
      },
      enabled: !!currentCycle.patientId && activeTab === "oocytes" && isOpen,
    }
  );

  // Fetch sperm samples for this patient and cycle
  const { data: spermSamplesData, isLoading: spermSamplesLoading } = useQuery({
    queryKey: ["cycle-samples", "sperm", cycle.id],
    queryFn: async () => {
      if (!cycle.id) return { data: [] };
      try {
        const response = await api.treatmentCycle.getCycleSamples(cycle.id);
        const allSamples = response.data || [];
        // Filter to only sperm samples
        const spermSamples = allSamples.filter(
          (sample) => sample.sampleType === "Sperm"
        );
        return { data: spermSamples };
      } catch (error) {
        console.error("Error fetching sperm samples:", error);
        return { data: [] };
      }
    },
    enabled: !!cycle.id && activeTab === "sperm" && isOpen,
  });

  const oocyteSamples = oocyteSamplesData?.data || [];
  const spermSamples = spermSamplesData?.data || [];

  // Fetch relationships for partner information
  const { data: relationshipsResponse, isLoading: relationshipsLoading } =
    useQuery({
      enabled: !!currentCycle.patientId && isOpen,
      queryKey: [
        "doctor",
        "patient",
        currentCycle.patientId,
        "relationships",
        "cycle-detail",
      ],
      retry: false,
      queryFn: async () => {
        if (!currentCycle.patientId) return [];
        try {
          const response = await api.relationship.getRelationships(
            currentCycle.patientId
          );
          return response.data ?? [];
        } catch (error) {
          if (
            isAxiosError(error) &&
            (error.response?.status === 404 || error.response?.status === 403)
          ) {
            return [];
          }
          console.warn("Failed to fetch relationships:", error);
          return [];
        }
      },
    });

  const relationships = relationshipsResponse ?? [];

  // Get active partner relationship (Married or Unmarried)
  const partnerRelationship = useMemo(() => {
    if (!relationships || relationships.length === 0) return null;
    return relationships.find(
      (rel: Relationship) =>
        (rel.relationshipType === "Married" ||
          rel.relationshipType === "Unmarried") &&
        rel.isActive !== false
    ) as Relationship | undefined;
  }, [relationships]);

  // Get partner info from relationship
  const partnerInfo = useMemo(() => {
    if (!partnerRelationship || !currentCycle.patientId) return null;
    // Determine which patient is the partner
    const isPatient1 =
      partnerRelationship.patient1Id === currentCycle.patientId;
    return isPatient1
      ? partnerRelationship.patient2Info
      : partnerRelationship.patient1Info;
  }, [partnerRelationship, currentCycle.patientId]);

  // DetailField component for displaying partner information
  interface DetailFieldProps {
    label: string;
    value?: string | number | null;
    placeholder?: string;
    multiline?: boolean;
  }

  const DetailField = ({
    label,
    value,
    placeholder = "—",
    multiline,
  }: DetailFieldProps) => {
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
  };

  // Calculate expected end date if not available
  const getExpectedEndDate = (): string | null => {
    // First, try expectedEndDate
    if (currentCycle.expectedEndDate) {
      return currentCycle.expectedEndDate;
    }

    // Try actualEndDate or endDate as fallback
    if (currentCycle.actualEndDate || currentCycle.endDate) {
      return currentCycle.actualEndDate || currentCycle.endDate || null;
    }

    // Calculate from startDate + expectedDurationDays if available
    if (currentCycle.startDate && currentCycle.expectedDurationDays) {
      try {
        const startDate = new Date(currentCycle.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + currentCycle.expectedDurationDays);
        return endDate.toISOString();
      } catch {
        return null;
      }
    }

    return null;
  };

  const expectedEndDate = getExpectedEndDate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Treatment Cycle Details
            </h2>
            <p className="text-sm text-gray-600">
              Cycle ID:{" "}
              <span className="font-semibold">{getLast4Chars(cycle.id)}</span>
            </p>
            <p className="text-xs text-gray-500">
              Type: {treatmentType} | Status:{" "}
              {currentCycle.status || "Planning"}
            </p>
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

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white px-6 flex-shrink-0">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("medical-records")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "medical-records"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Medical Records
              {medicalRecords.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {medicalRecords.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("oocytes")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "oocytes"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Oocytes
              {oocyteSamples.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {oocyteSamples.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sperm")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "sperm"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Sperm
              {spermSamples.length > 0 && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {spermSamples.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("partner")}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium",
                activeTab === "partner"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              Partner
            </button>
          </nav>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6 flex-1 min-h-0"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cycle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-500">Cycle Number</p>
                      <p className="font-semibold">
                        {currentCycle.cycleNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-semibold">
                        {currentCycle.startDate
                          ? formatDate(currentCycle.startDate)
                          : "Not started"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expected End Date</p>
                      <p className="font-semibold">
                        {expectedEndDate ? formatDate(expectedEndDate) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient Name</p>
                      <p className="font-semibold">
                        {currentCycle.patientId ? patientName : "Not linked"}
                      </p>
                    </div>
                    {patientCode && (
                      <div>
                        <p className="text-sm text-gray-500">Patient Code</p>
                        <p className="font-semibold">{patientCode}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Progress and Update Form */}
              <CycleUpdateForm
                cycle={{
                  ...currentCycle,
                  treatmentType:
                    treatmentType === "IUI" || treatmentType === "IVF"
                      ? (treatmentType as "IUI" | "IVF")
                      : currentCycle.treatmentType,
                }}
                onStepAdvanced={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["doctor", "treatment-cycle", cycle.id],
                  });
                }}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Treatment Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <TreatmentTimeline
                    cycle={{
                      ...currentCycle,
                      treatmentType:
                        treatmentType === "IUI" || treatmentType === "IVF"
                          ? (treatmentType as "IUI" | "IVF")
                          : undefined,
                    }}
                    onStepClick={() => {}}
                  />
                </CardContent>
              </Card>

              {currentCycle.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {currentCycle.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "medical-records" && (
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
              </CardHeader>
              <CardContent>
                {medicalRecordsLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading medical records...
                  </div>
                ) : medicalRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p>No medical records found for this treatment cycle.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicalRecords.map((record: MedicalRecord) => (
                      <Card key={record.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">
                                  Record #{getLast4Chars(record.id)}
                                </p>
                                {record.createdAt && (
                                  <span className="text-sm text-gray-500">
                                    {formatDate(record.createdAt)}
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
                                  <p className="text-sm text-gray-600">
                                    {record.diagnosis}
                                  </p>
                                </div>
                              )}
                              {record.treatmentPlan && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    Treatment Plan:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {record.treatmentPlan}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Oocytes Tab */}
          {activeTab === "oocytes" && (
            <Card>
              <CardHeader>
                <CardTitle>Oocyte Samples</CardTitle>
              </CardHeader>
              <CardContent>
                {oocyteSamplesLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading oocyte samples...
                  </div>
                ) : oocyteSamples.length === 0 ? (
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
                          <th className="text-left p-3">Quantity</th>
                          <th className="text-left p-3">Maturity Stage</th>
                          <th className="text-left p-3">Is Mature</th>
                          <th className="text-left p-3">Quality</th>
                          <th className="text-left p-3">Is Vitrified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {oocyteSamples.map(
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
                                {sample.oocyte?.quantity !== undefined &&
                                sample.oocyte.quantity !== null
                                  ? sample.oocyte.quantity
                                  : "—"}
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

          {/* Sperm Tab */}
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
                ) : spermSamples.length === 0 ? (
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
                        </tr>
                      </thead>
                      <tbody>
                        {spermSamples.map((sample: LabSampleDetailResponse) => (
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
                              {sample.sperm?.quality || sample.quality || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Partner Tab */}
          {activeTab === "partner" && (
            <Card>
              <CardHeader>
                <CardTitle>Partner Information</CardTitle>
              </CardHeader>
              <CardContent>
                {relationshipsLoading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading partner information...
                  </div>
                ) : !partnerInfo ? (
                  <div className="py-12 text-center text-gray-500">
                    <p>No partner information found for this patient.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailField
                      label="Partner name"
                      value={
                        getFullNameFromObject(partnerInfo) ||
                        partnerInfo?.fullName ||
                        partnerInfo?.patientCode ||
                        "—"
                      }
                    />
                    <DetailField
                      label="Relationship type"
                      value={
                        partnerRelationship?.relationshipTypeName ||
                        partnerRelationship?.relationshipType
                      }
                    />
                    <DetailField
                      label="Partner patient code"
                      value={partnerInfo.patientCode}
                    />
                    <DetailField
                      label="Partner citizen ID"
                      value={partnerInfo.nationalId}
                    />
                    <DetailField
                      label="Partner email"
                      value={partnerInfo.email}
                    />
                    <DetailField
                      label="Partner phone"
                      value={partnerInfo.phone}
                    />
                    {partnerRelationship?.establishedDate && (
                      <DetailField
                        label="Relationship established"
                        value={formatDate(partnerRelationship.establishedDate)}
                      />
                    )}
                    {partnerRelationship?.notes && (
                      <DetailField
                        label="Relationship notes"
                        value={partnerRelationship.notes}
                        multiline
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
