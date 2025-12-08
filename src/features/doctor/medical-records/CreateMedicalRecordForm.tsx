/**
 * Create Medical Record Form Component
 * Form for creating new medical records with patient, appointment, treatment, and prescriptions
 */

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { api } from "@/api/client";
import type {
  Patient,
  Treatment,
  TreatmentCycle,
  Service,
  CreateMedicalRecordRequest,
  DynamicResponse,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";

type MedicationForm = {
  serviceId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

type MedicalRecordFormValues = {
  patientId: string;
  appointmentId: string;
  treatmentId: string;
  treatmentCycleId: string;
  chiefComplaint: string;
  history: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpInstructions: string;
  vitalSigns: string;
  labResults: string;
  imagingResults: string;
  notes: string;
  medications: MedicationForm[];
};

interface CreateMedicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateMedicalRecordForm({
  isOpen,
  onClose,
  onCreated,
}: CreateMedicalRecordFormProps) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const form = useForm<MedicalRecordFormValues>({
    defaultValues: {
      patientId: "",
      appointmentId: "",
      treatmentId: "",
      treatmentCycleId: "",
      chiefComplaint: "",
      history: "",
      physicalExamination: "",
      diagnosis: "",
      treatmentPlan: "",
      followUpInstructions: "",
      vitalSigns: "",
      labResults: "",
      imagingResults: "",
      notes: "",
      medications: [
        {
          serviceId: "",
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const selectedPatientId = form.watch("patientId");
  const selectedTreatmentId = form.watch("treatmentId");

  // Search patients
  const { data: patientsData } = useQuery({
    queryKey: ["patients", "search", patientSearch],
    queryFn: async () => {
      if (!patientSearch || patientSearch.length < 2) return { data: [] };
      return await api.patient.getPatients({
        searchTerm: patientSearch,
        pageSize: 10,
      });
    },
    enabled: patientSearch.length >= 2 && showPatientDropdown,
  });

  const patients = patientsData?.data ?? [];

  // Get patient details
  const { data: selectedPatient } = useQuery({
    queryKey: ["patient-details", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      try {
        const response = await api.patient.getPatientDetails(selectedPatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!selectedPatientId,
  });

  // Get appointments for selected patient using history endpoint
  const { data: appointmentsData } = useQuery({
    queryKey: [
      "appointments",
      "patient-history",
      selectedPatientId,
      "for-medical-record",
    ],
    queryFn: async () => {
      if (!selectedPatientId) {
        return { data: [], metaData: { totalCount: 0 } };
      }
      try {
        const response = await api.appointment.getAppointmentHistoryByPatient(
          selectedPatientId,
          {
            Size: 100,
            Sort: "AppointmentDate",
            Order: "desc", // Most recent first
          }
        );
        return response;
      } catch (error) {
        console.error("Error fetching appointment history:", error);
        return { data: [], metaData: { totalCount: 0 } };
      }
    },
    enabled: !!selectedPatientId,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const appointments = useMemo(() => {
    if (!appointmentsData?.data) return [];
    // Ensure we have an array
    return Array.isArray(appointmentsData.data)
      ? appointmentsData.data
      : [];
  }, [appointmentsData]);

  // Get treatments for selected patient
  const { data: treatmentsData } = useQuery({
    queryKey: ["treatments", "patient", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return { data: [] };
      try {
        return await api.treatment.getTreatments({
          patientId: selectedPatientId,
        });
      } catch {
        return { data: [] };
      }
    },
    enabled: !!selectedPatientId,
  });

  const treatments = useMemo(() => {
    if (!treatmentsData?.data) return [];
    return Array.isArray(treatmentsData.data) ? treatmentsData.data : [];
  }, [treatmentsData]);

  // Get treatment cycles for selected treatment
  const { data: cyclesData } = useQuery({
    queryKey: ["treatment-cycles", "treatment", selectedTreatmentId],
    queryFn: async () => {
      if (!selectedTreatmentId) return { data: [] };
      try {
        return await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: selectedTreatmentId,
          pageSize: 100,
        });
      } catch {
        return { data: [] };
      }
    },
    enabled: !!selectedTreatmentId,
  });

  const cycles = cyclesData?.data ?? [];

  // Get services for medications
  const { data: servicesData } = useQuery<DynamicResponse<Service>>({
    queryKey: ["services", "for-prescriptions"],
    queryFn: async () => {
      try {
        return await api.service.getServices({ pageSize: 1000 });
      } catch {
        return { 
          code: 200,
          message: "Success",
          data: [],
          metaData: {
            pageNumber: 1,
            pageSize: 1000,
            totalCount: 0,
            totalPages: 0,
            hasPrevious: false,
            hasNext: false,
          }
        };
      }
    },
  });

  const services = servicesData?.data ?? [];
  
  type ServiceOption = {
    id: string;
    name: string;
    code: string;
    price: number;
  };
  
  const serviceOptions = useMemo<ServiceOption[]>(() => {
    return services.map((service: Service) => ({
      id: service.id,
      name: service.serviceName || service.name || "",
      code: service.serviceCode || "",
      price: service.price || 0,
    }));
  }, [services]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setPatientSearch("");
      setShowPatientDropdown(false);
    }
  }, [isOpen, form]);

  // Update patient search when patient is selected
  useEffect(() => {
    if (selectedPatient && selectedPatientId) {
      const patientName =
        selectedPatient.accountInfo?.username ||
        selectedPatient.fullName ||
        selectedPatient.patientCode ||
        "";
      const code = selectedPatient.patientCode || "";
      setPatientSearch(`${patientName} (${code})`);
      setShowPatientDropdown(false);
    }
  }, [selectedPatient, selectedPatientId]);

  // Reset dependent fields when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      // Reset appointment, treatment, and cycle when patient changes
      form.setValue("appointmentId", "");
      form.setValue("treatmentId", "");
      form.setValue("treatmentCycleId", "");
    } else {
      // Also reset when patient is cleared
      form.setValue("appointmentId", "");
      form.setValue("treatmentId", "");
      form.setValue("treatmentCycleId", "");
    }
  }, [selectedPatientId, form]);

  // Reset treatment cycle when treatment changes
  useEffect(() => {
    if (selectedTreatmentId) {
      form.setValue("treatmentCycleId", "");
    }
  }, [selectedTreatmentId, form]);

  const createMedicalRecordMutation = useMutation({
    mutationFn: async (data: CreateMedicalRecordRequest) => {
      return await api.medicalRecord.createMedicalRecord(data);
    },
    onSuccess: (response) => {
      toast.success("Medical record created successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "medical-records"],
      });
      return response.data;
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create medical record";
      toast.error(message);
    },
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.serviceRequest.createServiceRequest(payload);
    },
    onSuccess: () => {
      toast.success("Prescriptions created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create prescriptions";
      toast.error(message);
    },
  });

  const onSubmit = (values: MedicalRecordFormValues) => {
    if (!values.appointmentId) {
      toast.error("Please select an appointment");
      return;
    }

    if (!values.patientId) {
      toast.error("Please select a patient");
      return;
    }

    // Create medical record
    const medicalRecordData: CreateMedicalRecordRequest = {
      appointmentId: values.appointmentId,
      chiefComplaint: values.chiefComplaint || undefined,
      history: values.history || undefined,
      physicalExamination: values.physicalExamination || undefined,
      diagnosis: values.diagnosis || undefined,
      treatmentPlan: values.treatmentPlan || undefined,
      followUpInstructions: values.followUpInstructions || undefined,
      vitalSigns: values.vitalSigns || undefined,
      labResults: values.labResults || undefined,
      imagingResults: values.imagingResults || undefined,
      notes: values.notes || undefined,
    };

    createMedicalRecordMutation.mutate(medicalRecordData, {
      onSuccess: async (medicalRecord) => {
        // Send notification to patient
        if (values.patientId && medicalRecord.data?.id) {
          const { sendEncounterNotification } = await import(
            "@/utils/notifications"
          );
          await sendEncounterNotification(
            values.patientId,
            "created",
            {
              encounterId: medicalRecord.data.id,
              appointmentId: values.appointmentId,
              diagnosis: values.diagnosis,
            }
          );
        }
        
        // If there are medications, create service request (prescription)
        const medicationsWithService = values.medications.filter(
          (med) => med.serviceId
        );

        if (medicationsWithService.length > 0) {
          const serviceDetails = medicationsWithService.map((med) => {
            const serviceInfo = serviceOptions.find(
              (s: ServiceOption) => s.id === med.serviceId
            );

            const noteParts = [
              med.name,
              med.dosage,
              med.frequency,
              med.duration,
              med.notes,
            ]
              .filter(Boolean)
              .join(" | ");

            return {
              serviceId: med.serviceId,
              quantity: 1,
              unitPrice: serviceInfo?.price ?? 0,
              notes: noteParts || undefined,
            };
          });

          const serviceRequestPayload = {
            appointmentId: values.appointmentId,
            patientId: values.patientId,
            requestDate: new Date().toISOString(),
            notes:
              values.diagnosis ||
              `Prescription for medical record ${medicalRecord.data?.id || "new"}`,
            serviceDetails: serviceDetails,
          };

          createServiceRequestMutation.mutate(serviceRequestPayload, {
            onSuccess: () => {
              form.reset();
              onCreated?.();
              onClose();
            },
          });
        } else {
          form.reset();
          onCreated?.();
          onClose();
        }
      },
    });
  };

  const handleAddMedication = () => {
    append({
      serviceId: "",
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
      notes: "",
    });
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = serviceOptions.find((s: ServiceOption) => s.id === serviceId);
    if (service) {
      form.setValue(`medications.${index}.serviceId`, serviceId);
      form.setValue(`medications.${index}.name`, service.name);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Medical Record" size="xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Patient <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  placeholder="Search patient by name or code..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                    if (e.target.value.length < 2) {
                      form.setValue("patientId", "");
                    }
                  }}
                  onFocus={() => {
                    if (patientSearch.length >= 2) {
                      setShowPatientDropdown(true);
                    }
                  }}
                />
                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    {patients.map((patient: Patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                        onClick={() => {
                          form.setValue("patientId", patient.id);
                          setShowPatientDropdown(false);
                        }}
                      >
                        <div className="font-medium">
                          {patient.fullName || patient.patientCode}
                        </div>
                        <div className="text-xs text-gray-500">
                          {patient.patientCode} - {patient.email || ""}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <p className="text-xs text-gray-500">
                  Selected: {selectedPatient.patientCode} -{" "}
                  {selectedPatient.accountInfo?.username ||
                    selectedPatient.fullName}
                </p>
              )}
            </div>

            {/* Appointment Selection */}
            {selectedPatientId ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment <span className="text-red-500">*</span>
                </label>
                {appointments.length > 0 ? (
                  <select
                    key={`appointment-${selectedPatientId}`}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    {...form.register("appointmentId", { required: true })}
                  >
                    <option value="">Select an appointment</option>
                    {appointments.map((appointment) => (
                      <option key={appointment.id} value={appointment.id}>
                        {(appointment as any).appointmentCode || getLast4Chars(appointment.id)} -{" "}
                        {new Date(appointment.appointmentDate).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}{" "}
                        - {appointment.status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500 bg-gray-50">
                    No appointments found for this patient
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment <span className="text-red-500">*</span>
                </label>
                <div className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400 bg-gray-50">
                  Please select a patient first
                </div>
              </div>
            )}

            {/* Treatment Selection */}
            {selectedPatientId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Treatment
                </label>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  {...form.register("treatmentId")}
                >
                  <option value="">Select a treatment (optional)</option>
                  {treatments.map((treatment: Treatment) => (
                    <option key={treatment.id} value={treatment.id}>
                      {treatment.treatmentType || "Treatment"} -{" "}
                      {treatment.status || "Active"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Treatment Cycle Selection */}
            {selectedTreatmentId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Treatment Cycle (Step)
                </label>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  {...form.register("treatmentCycleId")}
                >
                  <option value="">Select a cycle (optional)</option>
                  {cycles.map((cycle: TreatmentCycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.treatmentType || "Cycle"} - {cycle.status} -{" "}
                      {cycle.startDate
                        ? new Date(cycle.startDate).toLocaleDateString()
                        : "No date"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Record Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Chief Complaint
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter chief complaint..."
                {...form.register("chiefComplaint")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                History
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter medical history..."
                {...form.register("history")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Physical Examination
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter physical examination findings..."
                {...form.register("physicalExamination")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Diagnosis
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter diagnosis..."
                {...form.register("diagnosis")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Treatment Plan
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter treatment plan..."
                {...form.register("treatmentPlan")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Follow-up Instructions
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter follow-up instructions..."
                {...form.register("followUpInstructions")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Vital Signs
                </label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter vital signs..."
                  {...form.register("vitalSigns")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Lab Results
                </label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter lab results..."
                  {...form.register("labResults")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Imaging Results
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter imaging results..."
                {...form.register("imagingResults")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter additional notes..."
                {...form.register("notes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions/Medications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Prescriptions</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
            >
              Add Medication
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Medication {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Service/Medication
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      {...form.register(`medications.${index}.serviceId`)}
                      onChange={(e) => handleServiceChange(index, e.target.value)}
                    >
                      <option value="">Select medication</option>
                      {serviceOptions.map((service: ServiceOption) => (
                        <option key={service.id} value={service.id}>
                          {service.name} ({service.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Dosage
                    </label>
                    <Input
                      placeholder="e.g., 500mg"
                      {...form.register(`medications.${index}.dosage`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Frequency
                    </label>
                    <Input
                      placeholder="e.g., 2 times daily"
                      {...form.register(`medications.${index}.frequency`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <Input
                      placeholder="e.g., 7 days"
                      {...form.register(`medications.${index}.duration`)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <Input
                      placeholder="Additional instructions..."
                      {...form.register(`medications.${index}.notes`)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-gray-500">
                No medications added. Click "Add Medication" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createMedicalRecordMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMedicalRecordMutation.isPending}>
            {createMedicalRecordMutation.isPending
              ? "Creating..."
              : "Create Medical Record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

