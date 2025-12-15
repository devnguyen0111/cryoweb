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
  Medicine,
  CreateMedicalRecordRequest,
  CreatePrescriptionRequest,
  DynamicResponse,
  PaginatedResponse,
} from "@/api/types";
import { getLast4Chars } from "@/utils/id-helpers";
import { getFullNameFromObject } from "@/utils/name-helpers";

type MedicationForm = {
  medicineId: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string;
  notes: string;
};

type ServiceForm = {
  serviceId: string;
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
  services: ServiceForm[];
};

interface CreateMedicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultPatientId?: string;
  defaultAppointmentId?: string;
  defaultTreatmentCycleId?: string;
}

export function CreateMedicalRecordForm({
  isOpen,
  onClose,
  onCreated,
  defaultPatientId,
  defaultAppointmentId,
  defaultTreatmentCycleId,
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
      medications: [],
      services: [],
    },
  });

  const {
    fields: medicationFields,
    append: appendMedication,
    remove: removeMedication,
  } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const selectedPatientId = form.watch("patientId");
  const selectedTreatmentId = form.watch("treatmentId");

  // Use defaultPatientId if provided, otherwise use selectedPatientId
  const effectivePatientId = selectedPatientId || defaultPatientId || "";

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

  // Get patient details - also fetch if defaultPatientId is provided
  const { data: selectedPatient } = useQuery({
    queryKey: ["patient-details", effectivePatientId],
    queryFn: async () => {
      if (!effectivePatientId) return null;
      try {
        const response =
          await api.patient.getPatientDetails(effectivePatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!effectivePatientId,
  });

  // Fetch user details for patient (same as AgreementDocument)
  const { data: userDetails } = useQuery({
    queryKey: ["user-details", effectivePatientId],
    queryFn: async () => {
      if (!effectivePatientId) return null;
      try {
        const response = await api.user.getUserDetails(effectivePatientId);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!effectivePatientId,
  });

  // Get patient name using same logic as AgreementDocument
  const getPatientDisplayName = useMemo(() => {
    if (!selectedPatient && !userDetails) return "N/A";
    return (
      getFullNameFromObject(userDetails) ||
      getFullNameFromObject(selectedPatient) ||
      userDetails?.userName ||
      selectedPatient?.accountInfo?.username ||
      selectedPatient?.patientCode ||
      "N/A"
    );
  }, [selectedPatient, userDetails]);

  // Get appointments for selected patient using history endpoint
  // Also fetch if defaultAppointmentId is provided to show appointment info
  const { data: appointmentsData } = useQuery({
    queryKey: [
      "appointments",
      "patient-history",
      effectivePatientId,
      "for-medical-record",
    ],
    queryFn: async () => {
      if (!effectivePatientId) {
        return { data: [], metaData: { totalCount: 0 } };
      }
      try {
        const response = await api.appointment.getAppointmentHistoryByPatient(
          effectivePatientId,
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
    return Array.isArray(appointmentsData.data) ? appointmentsData.data : [];
  }, [appointmentsData]);

  // Get treatments for selected patient - also fetch if defaultTreatmentId is provided
  const effectiveTreatmentPatientId = effectivePatientId || selectedPatientId;
  const { data: treatmentsData } = useQuery({
    queryKey: ["treatments", "patient", effectiveTreatmentPatientId],
    queryFn: async () => {
      if (!effectiveTreatmentPatientId) return { data: [] };
      try {
        return await api.treatment.getTreatments({
          patientId: effectiveTreatmentPatientId,
        });
      } catch {
        return { data: [] };
      }
    },
    enabled: !!effectiveTreatmentPatientId,
  });

  const treatments = useMemo(() => {
    if (!treatmentsData?.data) return [];
    return Array.isArray(treatmentsData.data) ? treatmentsData.data : [];
  }, [treatmentsData]);

  // Fetch treatment cycle details if defaultTreatmentCycleId is provided
  // This needs to be done early to get defaultTreatmentId
  const { data: defaultCycleData } = useQuery({
    queryKey: ["treatment-cycle", defaultTreatmentCycleId],
    queryFn: async () => {
      if (!defaultTreatmentCycleId) return null;
      try {
        const response = await api.treatmentCycle.getTreatmentCycleById(
          defaultTreatmentCycleId
        );
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!defaultTreatmentCycleId && isOpen,
  });

  // Get treatmentId from default cycle
  const defaultTreatmentId = defaultCycleData?.treatmentId;

  // Get treatment cycles for selected treatment - also fetch if defaultTreatmentId is provided
  const effectiveTreatmentId = selectedTreatmentId || defaultTreatmentId;
  const { data: cyclesData } = useQuery({
    queryKey: ["treatment-cycles", "treatment", effectiveTreatmentId],
    queryFn: async () => {
      if (!effectiveTreatmentId) return { data: [] };
      try {
        return await api.treatmentCycle.getTreatmentCycles({
          TreatmentId: effectiveTreatmentId,
          pageSize: 100,
        });
      } catch {
        return { data: [] };
      }
    },
    enabled: !!effectiveTreatmentId,
  });

  const cycles = cyclesData?.data ?? [];

  // Get medicines for medications
  const { data: medicinesData, isLoading: medicinesLoading } = useQuery<
    PaginatedResponse<Medicine>
  >({
    queryKey: ["medicines", "for-prescriptions"],
    queryFn: async () => {
      try {
        const response = await api.medicine.getMedicines({
          pageNumber: 1,
          pageSize: 1000,
        });
        return response;
      } catch (error) {
        console.error("Error fetching medicines:", error);
        return {
          code: 200,
          message: "Success",
          data: [],
          metaData: {
            pageNumber: 1,
            pageSize: 1000,
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }
    },
  });

  const medicines = useMemo(() => {
    if (!medicinesData?.data) return [];
    // Ensure data is an array
    const medicinesArray = Array.isArray(medicinesData.data)
      ? medicinesData.data
      : [];
    // Filter active medicines only
    return medicinesArray.filter(
      (medicine: Medicine) => medicine.isActive !== false
    );
  }, [medicinesData]);

  // Get services for services section
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
          },
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

  // Reset form when modal closes or set default values when opens
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setPatientSearch("");
      setShowPatientDropdown(false);
    } else if (
      isOpen &&
      (defaultPatientId || defaultAppointmentId || defaultTreatmentCycleId)
    ) {
      // Set default values when modal opens
      form.reset({
        patientId: defaultPatientId || "",
        appointmentId: defaultAppointmentId || "",
        treatmentCycleId: defaultTreatmentCycleId || "",
        treatmentId: defaultTreatmentId || "",
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
        medications: [],
        services: [],
      });
      if (defaultPatientId) {
        setPatientSearch("");
        setShowPatientDropdown(false);
      }
    }
  }, [
    isOpen,
    form,
    defaultPatientId,
    defaultAppointmentId,
    defaultTreatmentCycleId,
    defaultTreatmentId,
  ]);

  // Update patient search when patient is selected
  useEffect(() => {
    if ((selectedPatient || userDetails) && effectivePatientId) {
      const patientName = getPatientDisplayName;
      const code = selectedPatient?.patientCode || "";
      setPatientSearch(`${patientName}${code ? ` (${code})` : ""}`);
      setShowPatientDropdown(false);
    }
  }, [selectedPatient, userDetails, effectivePatientId, getPatientDisplayName]);

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

  const createPrescriptionMutation = useMutation({
    mutationFn: async (payload: CreatePrescriptionRequest) => {
      return await api.prescription.createPrescription(payload);
    },
    onSuccess: () => {
      toast.success("Prescription created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create prescription";
      toast.error(message);
    },
  });

  const createServiceRequestMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.serviceRequest.createServiceRequest(payload);
    },
    onSuccess: () => {
      toast.success("Service request created successfully");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create service request";
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
          await sendEncounterNotification(values.patientId, "created", {
            encounterId: medicalRecord.data.id,
            appointmentId: values.appointmentId,
            diagnosis: values.diagnosis,
          });
        }

        // If there are medications, create prescription
        if (values.medications.length > 0) {
          const prescriptionDetails = values.medications
            .filter((med) => med.medicineId)
            .map((med) => ({
              medicineId: med.medicineId,
              quantity: med.quantity || 1,
              dosage: med.dosage || undefined,
              frequency: med.frequency || undefined,
              durationDays: med.durationDays || undefined,
              instructions: med.instructions || undefined,
              notes: med.notes || undefined,
            }));

          if (prescriptionDetails.length > 0) {
            const prescriptionPayload: CreatePrescriptionRequest = {
              medicalRecordId: medicalRecord.data?.id || "",
              prescriptionDate: new Date().toISOString(),
              diagnosis: values.diagnosis || undefined,
              instructions: undefined,
              notes: undefined,
              prescriptionDetails: prescriptionDetails,
            };

            createPrescriptionMutation.mutate(prescriptionPayload, {
              onSuccess: () => {
                // If there are services, create service request
                if (values.services.length > 0) {
                  const serviceDetails = values.services.map((service) => {
                    const serviceInfo = serviceOptions.find(
                      (s: ServiceOption) => s.id === service.serviceId
                    );

                    return {
                      serviceId: service.serviceId,
                      quantity: 1,
                      unitPrice: serviceInfo?.price ?? 0,
                      notes: service.notes || undefined,
                    };
                  });

                  const serviceRequestPayload = {
                    appointmentId: values.appointmentId,
                    patientId: values.patientId,
                    requestDate: new Date().toISOString(),
                    notes:
                      values.diagnosis ||
                      `Service request for medical record ${medicalRecord.data?.id || "new"}`,
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
          } else {
            // No valid medications, proceed with services if any
            if (values.services.length > 0) {
              const serviceDetails = values.services.map((service) => {
                const serviceInfo = serviceOptions.find(
                  (s: ServiceOption) => s.id === service.serviceId
                );

                return {
                  serviceId: service.serviceId,
                  quantity: 1,
                  unitPrice: serviceInfo?.price ?? 0,
                  notes: service.notes || undefined,
                };
              });

              const serviceRequestPayload = {
                appointmentId: values.appointmentId,
                patientId: values.patientId,
                requestDate: new Date().toISOString(),
                notes:
                  values.diagnosis ||
                  `Service request for medical record ${medicalRecord.data?.id || "new"}`,
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
          }
        } else {
          // No medications, proceed with services if any
          if (values.services.length > 0) {
            const serviceDetails = values.services.map((service) => {
              const serviceInfo = serviceOptions.find(
                (s: ServiceOption) => s.id === service.serviceId
              );

              return {
                serviceId: service.serviceId,
                quantity: 1,
                unitPrice: serviceInfo?.price ?? 0,
                notes: service.notes || undefined,
              };
            });

            const serviceRequestPayload = {
              appointmentId: values.appointmentId,
              patientId: values.patientId,
              requestDate: new Date().toISOString(),
              notes:
                values.diagnosis ||
                `Service request for medical record ${medicalRecord.data?.id || "new"}`,
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
        }
      },
    });
  };

  const handleAddMedication = () => {
    appendMedication({
      medicineId: "",
      dosage: "",
      frequency: "",
      durationDays: 0,
      quantity: 1,
      instructions: "",
      notes: "",
    });
  };

  const handleAddService = () => {
    appendService({
      serviceId: "",
      notes: "",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Medical Record"
      size="xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* If defaultPatientId is provided, show read-only patient info */}
            {defaultPatientId ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Patient <span className="text-gray-500"></span>
                </label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  {selectedPatient || userDetails ? (
                    <div>
                      <p className="font-medium text-gray-900">
                        {getPatientDisplayName}
                      </p>
                      {selectedPatient?.patientCode && (
                        <p className="text-xs text-gray-500 mt-1">
                          Patient Code: {selectedPatient.patientCode}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Loading patient information...
                    </p>
                  )}
                </div>
              </div>
            ) : (
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
                            {getFullNameFromObject(patient) ||
                              patient.patientCode}
                          </div>
                          <div className="text-xs text-gray-500">
                            {patient.patientCode} - {patient.email || ""}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {(selectedPatient || userDetails) && (
                  <p className="text-xs text-gray-500">
                    Selected: {selectedPatient?.patientCode || "—"} -{" "}
                    {getPatientDisplayName}
                  </p>
                )}
              </div>
            )}

            {/* Appointment Selection */}
            {defaultAppointmentId ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Appointment <span className="text-gray-500"></span>
                </label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  {appointments.find(
                    (apt) => apt.id === defaultAppointmentId
                  ) ? (
                    <div>
                      {(() => {
                        const appointment = appointments.find(
                          (apt) => apt.id === defaultAppointmentId
                        );
                        return appointment ? (
                          <div>
                            <p className="font-medium text-gray-900">
                              {(appointment as any).appointmentCode ||
                                getLast4Chars(appointment.id)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(
                                appointment.appointmentDate
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}{" "}
                              - {appointment.status}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            Loading appointment...
                          </p>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Loading appointment information...
                    </p>
                  )}
                </div>
              </div>
            ) : selectedPatientId ? (
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
                        {(appointment as any).appointmentCode ||
                          getLast4Chars(appointment.id)}{" "}
                        -{" "}
                        {new Date(
                          appointment.appointmentDate
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}{" "}
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
            {effectivePatientId && (
              <>
                {defaultTreatmentId ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Treatment <span className="text-gray-500"></span>
                    </label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      {treatments.find((t) => t.id === defaultTreatmentId) ? (
                        <div>
                          {(() => {
                            const treatment = treatments.find(
                              (t) => t.id === defaultTreatmentId
                            );
                            return treatment ? (
                              <div>
                                <p className="font-medium text-gray-900">
                                  {treatment.treatmentType || "Treatment"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Status: {treatment.status || "Active"}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-500">
                                Loading treatment...
                              </p>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          Loading treatment information...
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
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
              </>
            )}

            {/* Treatment Cycle Selection */}
            {defaultTreatmentCycleId ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Treatment Cycle (Step) <span className="text-gray-500"></span>
                </label>
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  {defaultCycleData ? (
                    <div>
                      <p className="font-medium text-gray-900">
                        {defaultCycleData.cycleName ||
                          defaultCycleData.stepType ||
                          "Treatment Cycle"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {defaultCycleData.treatmentType || "Cycle"} -{" "}
                        {defaultCycleData.status || "Active"}
                        {defaultCycleData.startDate && (
                          <>
                            {" "}
                            -{" "}
                            {new Date(
                              defaultCycleData.startDate
                            ).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Loading treatment cycle information...
                    </p>
                  )}
                </div>
              </div>
            ) : effectiveTreatmentId ? (
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
            ) : null}
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

        {/* Medications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Medications</CardTitle>
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
            {medicationFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Medication {index + 1}
                  </h4>
                  {medicationFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Medicine <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      {...form.register(`medications.${index}.medicineId`, {
                        required: true,
                      })}
                      disabled={medicinesLoading}
                    >
                      <option value="">
                        {medicinesLoading
                          ? "Loading medicines..."
                          : "Select medicine"}
                      </option>
                      {medicines.length > 0
                        ? medicines.map((medicine: Medicine) => (
                            <option key={medicine.id} value={medicine.id}>
                              {medicine.name || "Unnamed Medicine"}
                              {medicine.genericName &&
                                ` (${medicine.genericName})`}
                              {medicine.form && ` - ${medicine.form}`}
                            </option>
                          ))
                        : !medicinesLoading && (
                            <option value="" disabled>
                              No medicines available
                            </option>
                          )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g., 1"
                      {...form.register(`medications.${index}.quantity`, {
                        valueAsNumber: true,
                        min: 1,
                      })}
                    />
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
                      Duration (days)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g., 7"
                      {...form.register(`medications.${index}.durationDays`, {
                        valueAsNumber: true,
                        min: 1,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Instructions
                    </label>
                    <Input
                      placeholder="e.g., Take with food"
                      {...form.register(`medications.${index}.instructions`)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <Input
                      placeholder="Additional notes..."
                      {...form.register(`medications.${index}.notes`)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {medicationFields.length === 0 && (
              <p className="text-sm text-gray-500">
                No medications added. Click "Add Medication" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Services</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddService}
            >
              Add Service
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Service {index + 1}
                  </h4>
                  {serviceFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Service
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      {...form.register(`services.${index}.serviceId`)}
                    >
                      <option value="">Select service</option>
                      {serviceOptions.map((service: ServiceOption) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <Input
                      placeholder="Additional instructions..."
                      {...form.register(`services.${index}.notes`)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {serviceFields.length === 0 && (
              <p className="text-sm text-gray-500">
                No services added. Click "Add Service" to add one.
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
          <Button
            type="submit"
            disabled={createMedicalRecordMutation.isPending}
          >
            {createMedicalRecordMutation.isPending
              ? "Creating..."
              : "Create Medical Record"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
