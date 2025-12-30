/**
 * Encounter Detail Page
 * View and edit encounter details
 */

import React, { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { getFullNameFromObject } from "@/utils/name-helpers";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

type EncounterFormValues = {
  visitDate: string;
  chiefComplaint: string;
  history: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
  };
  physicalExam: string;
  notes: string;
  status: string;
};

export const Route = createFileRoute("/doctor/encounters/$encounterId")({
  component: EncounterDetailPage,
});

function EncounterDetailPage() {
  const { encounterId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch encounter data
  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: async () => {
      const response = await api.treatment.getTreatmentById(encounterId);
      return response.data;
    },
    retry: false,
  });

  // Fetch patient details
  const { data: patientDetails } = useQuery({
    queryKey: ["patient-details", encounterData?.patientId],
    queryFn: async () => {
      if (!encounterData?.patientId) return null;
      // usePatientDetails hook handles the fallback logic
      // But we need the query structure here, so we use the same pattern
      try {
        const response = await api.patient.getPatientDetails(
          encounterData.patientId
        );
        return response.data;
      } catch {
        try {
          const fallback = await api.patient.getPatientById(
            encounterData.patientId
          );
          return fallback.data ?? null;
        } catch {
          return null;
        }
      }
    },
    enabled: !!encounterData?.patientId,
  });

  // Fetch user/account details
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", encounterData?.patientId],
    queryFn: async () => {
      if (!encounterData?.patientId) return null;
      try {
        const response = await api.user.getUserDetails(encounterData.patientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!encounterData?.patientId,
  });

  // Merge patient information
  const patientInfo = useMemo(() => {
    if (!patientDetails && !userDetails) return null;

    const isDetail = isPatientDetailResponse(patientDetails);
    const name =
      (isDetail ? patientDetails.accountInfo?.username : null) ||
      getFullNameFromObject(userDetails) ||
      userDetails?.userName ||
      "Unknown";

    const patientCode = patientDetails?.patientCode;
    const nationalId = patientDetails?.nationalId;
    const age = userDetails?.age;
    const gender =
      userDetails?.gender !== undefined
        ? userDetails.gender
          ? "Male"
          : "Female"
        : null;
    const dob = userDetails?.dob
      ? new Date(userDetails.dob).toLocaleDateString("vi-VN")
      : null;
    const email =
      (isDetail ? patientDetails.accountInfo?.email : null) ||
      userDetails?.email;
    const phone =
      (isDetail ? patientDetails.accountInfo?.phone : null) ||
      userDetails?.phone ||
      userDetails?.phoneNumber;
    const address =
      (isDetail ? patientDetails.accountInfo?.address : null) ||
      userDetails?.location;
    const bloodType = patientDetails?.bloodType;
    const emergencyContact = isDetail ? patientDetails.emergencyContact : null;
    const emergencyPhone = isDetail ? patientDetails.emergencyPhone : null;
    const insurance = isDetail ? patientDetails.insurance : null;
    const occupation = isDetail ? patientDetails.occupation : null;
    const medicalHistory = isDetail ? patientDetails.medicalHistory : null;
    const allergies = isDetail ? patientDetails.allergies : null;
    const height = isDetail ? patientDetails.height : null;
    const weight = isDetail ? patientDetails.weight : null;
    const bmi = isDetail ? patientDetails.bmi : null;
    const treatmentCount = isDetail ? patientDetails.treatmentCount : null;
    const labSampleCount = isDetail ? patientDetails.labSampleCount : null;

    return {
      name,
      patientCode,
      nationalId,
      age,
      gender,
      dob,
      email,
      phone,
      address,
      bloodType,
      emergencyContact,
      emergencyPhone,
      insurance,
      occupation,
      medicalHistory,
      allergies,
      height,
      weight,
      bmi,
      treatmentCount,
      labSampleCount,
    };
  }, [patientDetails, userDetails]);

  // Parse encounter data from notes (temporary solution)
  const parseEncounterData = (notes?: string): Partial<EncounterFormValues> => {
    if (!notes) return {};
    try {
      // Try to parse JSON from notes
      const jsonMatch = notes.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // If not JSON, try to extract structured data
      const lines = notes.split("\n");
      const data: Partial<EncounterFormValues> = {};
      let currentSection = "";
      let vitals: any = {};

      lines.forEach((line) => {
        if (line.includes("Chief Complaint:")) {
          data.chiefComplaint = line.split(":")[1]?.trim() || "";
        } else if (line.includes("History:")) {
          currentSection = "history";
          data.history = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Physical Exam:")) {
          currentSection = "physicalExam";
          data.physicalExam = line.split(":")[1]?.trim() || "";
        } else if (line.includes("BP:") || line.includes("Blood Pressure:")) {
          vitals.bloodPressure = line.split(":")[1]?.trim() || "";
        } else if (line.includes("HR:") || line.includes("Heart Rate:")) {
          vitals.heartRate = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Temp:") || line.includes("Temperature:")) {
          vitals.temperature = line.split(":")[1]?.trim() || "";
        } else if (line.includes("Weight:")) {
          vitals.weight = line.split(":")[1]?.trim() || "";
        } else if (currentSection === "history" && line.trim()) {
          data.history = (data.history || "") + "\n" + line.trim();
        } else if (currentSection === "physicalExam" && line.trim()) {
          data.physicalExam = (data.physicalExam || "") + "\n" + line.trim();
        }
      });

      if (Object.keys(vitals).length > 0) {
        data.vitals = vitals as any;
      }

      return data;
    } catch (error) {
      console.error("Error parsing encounter data:", error);
      return {};
    }
  };

  const form = useForm<EncounterFormValues>({
    defaultValues: {
      visitDate: encounterData?.startDate
        ? new Date(encounterData.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      chiefComplaint: "",
      history: "",
      vitals: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
      },
      physicalExam: "",
      notes: "",
      status: encounterData?.status || "InProgress",
    },
  });

  // Update form when encounter data loads
  React.useEffect(() => {
    if (encounterData) {
      const parsed = parseEncounterData(encounterData.notes);
      form.reset({
        visitDate: encounterData.startDate
          ? new Date(encounterData.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        chiefComplaint: parsed.chiefComplaint || "",
        history: parsed.history || "",
        vitals: parsed.vitals || {
          bloodPressure: "",
          heartRate: "",
          temperature: "",
          weight: "",
        },
        physicalExam: parsed.physicalExam || "",
        notes: encounterData.notes || "",
        status: encounterData.status || "InProgress",
      });
    }
  }, [encounterData, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: EncounterFormValues) => {
      // Combine all data into notes (temporary solution)
      const encounterData = {
        visitDate: values.visitDate,
        chiefComplaint: values.chiefComplaint,
        history: values.history,
        vitals: values.vitals,
        physicalExam: values.physicalExam,
        notes: values.notes,
      };

      const notes = `Encounter Data:\n${JSON.stringify(encounterData, null, 2)}`;

      const response = await api.treatment.updateTreatment(encounterId, {
        startDate: new Date(`${values.visitDate}T00:00:00`).toISOString(),
        status: values.status as any,
        notes,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encounter", encounterId] });
      queryClient.invalidateQueries({ queryKey: ["doctor-encounters"] });
      toast.success("Encounter updated successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to update encounter";
      toast.error(message);
    },
  });

  const onSubmit = (values: EncounterFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading encounter...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!encounterData) {
    return (
      <ProtectedRoute allowedRoles={["Doctor"]}>
        <DashboardLayout>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 mb-4">Encounter not found</p>
              <Button onClick={() => navigate({ to: "/doctor/encounters" })}>
                Back to Encounters
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Encounter Details</h1>
                <p className="text-gray-600">
                  Code:{" "}
                  <span className="font-semibold">
                    {encounterData.treatmentCode || encounterId}
                  </span>
                </p>
                {patientInfo && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Patient: </span>
                    <span className="font-semibold text-gray-900">
                      {patientInfo.name}
                    </span>
                    {patientInfo.patientCode && (
                      <span className="text-gray-500">
                        {" "}
                        ({patientInfo.patientCode})
                      </span>
                    )}
                    {patientInfo.age && (
                      <span className="text-gray-500">
                        {" "}
                        • {patientInfo.age}{" "}
                        {patientInfo.gender ? `• ${patientInfo.gender}` : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/doctor/encounters" })}
                >
                  Back
                </Button>
                {encounterData.status === "InProgress" && (
                  <Button
                    onClick={() =>
                      navigate({
                        to: "/doctor/encounters/$encounterId/diagnosis",
                        params: { encounterId },
                        search: {
                          patientId: encounterData.patientId,
                          treatmentId: encounterId,
                        },
                      })
                    }
                  >
                    Go to Diagnosis
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Patient Information Card */}
          {patientInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Full Name
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {patientInfo.name}
                    </p>
                  </div>
                  {patientInfo.patientCode && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Patient Code
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.patientCode}
                      </p>
                    </div>
                  )}
                  {patientInfo.nationalId && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Citizen ID Card
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.nationalId}
                      </p>
                    </div>
                  )}
                  {patientInfo.age && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Age
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.age}{" "}
                        {patientInfo.gender ? `(${patientInfo.gender})` : ""}
                      </p>
                    </div>
                  )}
                  {patientInfo.dob && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Date of Birth
                      </p>
                      <p className="text-sm text-gray-700">{patientInfo.dob}</p>
                    </div>
                  )}
                  {patientInfo.email && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Email
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.email}
                      </p>
                    </div>
                  )}
                  {patientInfo.phone && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.phone}
                      </p>
                    </div>
                  )}
                  {patientInfo.address && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Address
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.address}
                      </p>
                    </div>
                  )}
                  {patientInfo.bloodType && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Blood Type
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.bloodType}
                      </p>
                    </div>
                  )}
                  {patientInfo.height && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Height
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.height} cm
                      </p>
                    </div>
                  )}
                  {patientInfo.weight && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Weight
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.weight} kg
                      </p>
                    </div>
                  )}
                  {patientInfo.bmi && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        BMI
                      </p>
                      <p className="text-sm text-gray-700">{patientInfo.bmi}</p>
                    </div>
                  )}
                  {patientInfo.emergencyContact && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Emergency Contact
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.emergencyContact}
                      </p>
                      {patientInfo.emergencyPhone && (
                        <p className="text-xs text-gray-500 mt-1">
                          {patientInfo.emergencyPhone}
                        </p>
                      )}
                    </div>
                  )}
                  {patientInfo.insurance && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Insurance
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.insurance}
                      </p>
                    </div>
                  )}
                  {patientInfo.occupation && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Occupation
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.occupation}
                      </p>
                    </div>
                  )}
                  {patientInfo.medicalHistory && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Medical History
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {patientInfo.medicalHistory}
                      </p>
                    </div>
                  )}
                  {patientInfo.allergies && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Allergies
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.allergies}
                      </p>
                    </div>
                  )}
                  {patientInfo.treatmentCount !== undefined && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Total Treatments
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.treatmentCount}
                      </p>
                    </div>
                  )}
                  {patientInfo.labSampleCount !== undefined && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Lab Samples
                      </p>
                      <p className="text-sm text-gray-700">
                        {patientInfo.labSampleCount}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visit Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Visit Date
                  </label>
                  <Input
                    type="date"
                    {...form.register("visitDate", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    {...form.register("status")}
                  >
                    <option value="Planning">Planning</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Chief Complaint
                  </label>
                  <Input
                    placeholder="Example: Post-IVF follow-up"
                    {...form.register("chiefComplaint")}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Medical History
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Summarize obstetric history, underlying conditions, prior treatments..."
                    {...form.register("history")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vital Signs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Blood Pressure
                  </label>
                  <Input
                    placeholder="120/80 mmHg"
                    {...form.register("vitals.bloodPressure")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Heart Rate
                  </label>
                  <Input
                    placeholder="80 bpm"
                    {...form.register("vitals.heartRate")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Temperature
                  </label>
                  <Input
                    placeholder="36.5 C"
                    {...form.register("vitals.temperature")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Weight
                  </label>
                  <Input
                    placeholder="58 kg"
                    {...form.register("vitals.weight")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Physical Exam & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Physical Examination
                  </label>
                  <textarea
                    className="min-h-[160px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Document clinical assessments, ultrasound findings, clinic lab results..."
                    {...form.register("physicalExam")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Internal Notes
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Information for the clinical team only; hidden from patients."
                    {...form.register("notes")}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/doctor/encounters" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
