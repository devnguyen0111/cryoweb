import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/api/client";
import type {
  ServiceRequestCreateRequestModel,
  Appointment,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { getFullNameFromObject } from "@/utils/name-helpers";

const serviceRequestSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().min(1, "Patient is required"),
  requestedDate: z.string().optional(),
  notes: z.string().optional(),
  serviceDetails: z
    .array(
      z.object({
        serviceId: z.string().min(1, "Service is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        price: z.number().optional(),
      })
    )
    .min(1, "At least one service is required"),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface ServiceDetail {
  serviceId: string;
  quantity: number;
  price?: number;
}

interface CreateServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export function CreateServiceRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateServiceRequestModalProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [patientSearch, setPatientSearch] = useState<string>("");

  const form = useForm<ServiceRequestFormData>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      appointmentId: "",
      patientId: "",
      requestedDate: new Date().toISOString().split("T")[0],
      notes: "",
      serviceDetails: [],
    },
  });

  // Watch selected patient
  const selectedPatientId = form.watch("patientId");

  // Update form serviceDetails when serviceDetails state changes
  useEffect(() => {
    form.setValue("serviceDetails", serviceDetails);
  }, [serviceDetails, form]);

  // Fetch active service categories - only when modal is open
  const { data: categoriesData } = useQuery({
    queryKey: ["service-categories", "active"],
    queryFn: () => api.serviceCategory.getActiveServiceCategories(),
    enabled: isOpen,
  });

  const categories = categoriesData?.data ?? [];

  // Fetch all active services when modal opens - load once for faster selection
  const { data: allServicesData } = useQuery({
    queryKey: ["services", "active", "all"],
    queryFn: () => api.service.getActiveServices(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const allServices = allServicesData?.data ?? [];

  // Filter services by selected category from pre-loaded list
  const services = useMemo(() => {
    if (!selectedCategory) return [];
    return allServices.filter(
      (service) =>
        service.serviceCategoryId === selectedCategory ||
        service.categoryId === selectedCategory
    );
  }, [allServices, selectedCategory]);

  // Fetch patients list for selection
  const { data: patientsData } = useQuery({
    queryKey: [
      "doctor",
      "patients",
      { searchTerm: patientSearch.trim() || undefined },
    ],
    queryFn: () =>
      api.patient.getPatients({
        pageNumber: 1,
        pageSize: 50,
        searchTerm: patientSearch.trim() || undefined,
      }),
    enabled: isOpen,
  });

  const patients = patientsData?.data ?? [];

  // Helper function to extract patientId from appointment (handles multiple field name variations)
  const getAppointmentPatientId = (apt: Appointment): string | null => {
    const raw = apt as unknown as Record<string, any>;
    return (
      apt.patientId ??
      raw.patientID ??
      raw.PatientId ??
      raw.PatientID ??
      raw.patient?.id ??
      raw.patient?.patientId ??
      raw.patient?.accountId ??
      raw.patientAccountId ??
      raw.patientAccountID ??
      raw.PatientAccountId ??
      raw.PatientAccountID ??
      null
    );
  };

  // Fetch appointments for selected patient - only when modal is open and patient is selected
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", "for-service-request", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];

      // Fetch appointments with multiple statuses that can have service requests
      const statuses: Array<
        "Scheduled" | "Confirmed" | "CheckedIn" | "InProgress"
      > = ["Scheduled", "Confirmed", "CheckedIn", "InProgress"];

      const allAppointments: Appointment[] = [];

      // Fetch appointments for each status filtered by patient
      await Promise.all(
        statuses.map(async (status) => {
          try {
            const response = await api.appointment.getAppointments({
              pageNumber: 1,
              pageSize: 100,
              status,
              patientId: selectedPatientId,
            });
            if (response.data) {
              // Filter by patientId on client side (check multiple field name variations)
              const filteredByPatient = response.data.filter((apt) => {
                const aptPatientId = getAppointmentPatientId(apt);
                return aptPatientId === selectedPatientId;
              });
              allAppointments.push(...filteredByPatient);
            }
          } catch (error) {
            // Ignore errors for individual status fetches
            console.warn(
              `Failed to fetch appointments with status ${status}:`,
              error
            );
          }
        })
      );

      // Remove duplicates by id
      const uniqueAppointments = Array.from(
        new Map(allAppointments.map((apt) => [apt.id, apt])).values()
      );

      // Final filter: ensure all appointments belong to selected patient
      const patientAppointments = uniqueAppointments.filter((apt) => {
        const aptPatientId = getAppointmentPatientId(apt);
        return aptPatientId === selectedPatientId;
      });

      // Sort by appointment date (most recent first)
      patientAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
        return dateB - dateA;
      });

      return patientAppointments;
    },
    enabled: isOpen && !!selectedPatientId,
  });

  // Filter appointments to ensure only selected patient's appointments are shown
  const appointments = useMemo(() => {
    if (!selectedPatientId || !appointmentsData) return [];
    // Additional client-side filter for safety (check multiple field name variations)
    return appointmentsData.filter((apt) => {
      const aptPatientId = getAppointmentPatientId(apt);
      return aptPatientId === selectedPatientId;
    });
  }, [appointmentsData, selectedPatientId]);

  // Get selected appointment
  const selectedAppointmentId = form.watch("appointmentId");
  const selectedAppointment = appointments.find(
    (apt) => apt.id === selectedAppointmentId
  );

  // Get patient from the patients list (already fetched, faster display)
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Fetch selected patient details to ensure we have the latest info
  // Always fetch when patient is selected to ensure we have complete info
  const { data: patientDetails } = useQuery({
    queryKey: ["patient", selectedPatientId],
    enabled: isOpen && !!selectedPatientId,
    queryFn: async () => {
      if (!selectedPatientId) return null;
      try {
        const response = await api.patient.getPatientById(selectedPatientId);
        return response.data ?? null;
      } catch (error) {
        // Try patient details as fallback
        try {
          const fallback =
            await api.patient.getPatientDetails(selectedPatientId);
          return fallback.data ?? null;
        } catch {
          return null;
        }
      }
    },
  });

  // Reset appointment when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      form.setValue("appointmentId", "");
    }
  }, [selectedPatientId, form]);

  // Update requestedDate when appointment changes
  useEffect(() => {
    if (selectedAppointment) {
      // Update requestedDate to match appointment date
      if (selectedAppointment.appointmentDate) {
        // Handle both DateOnly (YYYY-MM-DD) and ISO datetime formats
        let dateString: string;
        if (selectedAppointment.appointmentDate.includes("T")) {
          // ISO datetime format
          dateString = selectedAppointment.appointmentDate.split("T")[0];
        } else {
          // DateOnly format (YYYY-MM-DD)
          dateString = selectedAppointment.appointmentDate;
        }
        form.setValue("requestedDate", dateString);
      }
    }
  }, [selectedAppointment, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ServiceRequestCreateRequestModel) => {
      return api.serviceRequest.createServiceRequest(data);
    },
    onSuccess: async (response) => {
      toast.success("Service request created successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "service-requests"],
      });

      // Send notification to patient
      if (response.data?.patientId && response.data?.id) {
        const { sendServiceRequestNotification } = await import(
          "@/utils/notifications"
        );
        const serviceName = serviceDetails
          .map((detail) => {
            // Find service from allServices to ensure we can find services from all categories
            const service = allServices.find((s) => s.id === detail.serviceId);
            return service?.name ?? service?.serviceName;
          })
          .filter(Boolean)
          .join(", ");

        await sendServiceRequestNotification(
          response.data.patientId,
          "created",
          {
            serviceRequestId: response.data.id,
            serviceName: serviceName || undefined,
          }
        );
      }

      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create service request";
      toast.error(message);
    },
  });

  const handleAddService = () => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }

    // Find service from allServices to ensure consistency
    const service = allServices.find((s) => s.id === selectedService);
    if (!service) {
      toast.error("Service not found");
      return;
    }

    const existingIndex = serviceDetails.findIndex(
      (detail) => detail.serviceId === selectedService
    );

    if (existingIndex >= 0) {
      // Update quantity if service already exists
      const updated = [...serviceDetails];
      updated[existingIndex].quantity += serviceQuantity;
      setServiceDetails(updated);
    } else {
      // Add new service
      setServiceDetails([
        ...serviceDetails,
        {
          serviceId: selectedService,
          quantity: serviceQuantity,
          price: service.price,
        },
      ]);
    }

    // Reset selection
    setSelectedService("");
    setServiceQuantity(1);
  };

  const handleRemoveService = (index: number) => {
    setServiceDetails(serviceDetails.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: ServiceRequestFormData) => {
    if (serviceDetails.length === 0) {
      toast.error("Please add at least one service");
      return;
    }

    const requestData: ServiceRequestCreateRequestModel = {
      appointmentId: data.appointmentId || null,
      patientId: data.patientId,
      requestDate: data.requestedDate
        ? new Date(data.requestedDate).toISOString()
        : new Date().toISOString(),
      requestedDate:
        data.requestedDate || new Date().toISOString().split("T")[0],
      notes: data.notes || null,
      serviceDetails: serviceDetails.map((detail) => ({
        serviceId: detail.serviceId,
        quantity: detail.quantity,
        unitPrice: detail.price,
        price: detail.price, // Legacy compatibility
        notes: null,
      })),
    };

    createMutation.mutate(requestData);
  };

  const handleClose = () => {
    form.reset();
    setServiceDetails([]);
    setSelectedCategory("");
    setSelectedService("");
    setServiceQuantity(1);
    setPatientSearch("");
    onClose();
  };

  const totalAmount = serviceDetails.reduce(
    (sum, detail) => sum + (detail.price ?? 0) * detail.quantity,
    0
  );

  return (
    <Modal
      title="Create Service Request"
      description="Request services for a patient appointment."
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="patientId">
            Patient <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2">
            <Input
              placeholder="Search by name, code, or email..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <select
              id="patientId"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...form.register("patientId", { required: true })}
            >
              <option value="">Select patient</option>
              {patients.map((p) => {
                const patientName =
                  getFullNameFromObject(p) || p.patientCode || p.id;
                return (
                  <option key={p.id} value={p.id}>
                    {patientName} {p.patientCode ? `(${p.patientCode})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          {form.formState.errors.patientId && (
            <p className="text-sm text-red-500">
              {form.formState.errors.patientId.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="appointmentId">Appointment (Optional)</Label>
            <select
              id="appointmentId"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              {...form.register("appointmentId")}
              disabled={appointmentsLoading || !selectedPatientId}
            >
              <option value="">
                {!selectedPatientId
                  ? "Select patient first"
                  : appointmentsLoading
                    ? "Loading appointments..."
                    : appointments.length === 0
                      ? "No appointments found"
                      : "Select appointment (optional)"}
              </option>
              {appointments.map((apt) => {
                const aptCode = apt.appointmentCode
                  ? apt.appointmentCode.slice(-8)
                  : apt.id.slice(-8);
                const aptDate = formatDate(apt.appointmentDate);
                return (
                  <option key={apt.id} value={apt.id}>
                    {aptCode} - {aptDate} ({apt.status})
                  </option>
                );
              })}
            </select>
            {form.formState.errors.appointmentId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.appointmentId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedDate">Requested Date</Label>
            <Input
              id="requestedDate"
              type="date"
              {...form.register("requestedDate")}
              disabled={!!selectedAppointment}
              title={
                selectedAppointment
                  ? "Requested date is set to match appointment date"
                  : ""
              }
            />
            {selectedAppointment && (
              <p className="text-xs text-gray-500">
                Automatically set to appointment date
              </p>
            )}
            {form.formState.errors.requestedDate && (
              <p className="text-sm text-red-500">
                {form.formState.errors.requestedDate.message}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Add Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name ?? cat.categoryName}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name ?? service.serviceName} -{" "}
                    {formatCurrency(service.price)}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={serviceQuantity}
                  onChange={(e) =>
                    setServiceQuantity(parseInt(e.target.value) || 1)
                  }
                  placeholder="Quantity"
                  className="w-24"
                />
                <Button
                  type="button"
                  onClick={handleAddService}
                  disabled={!selectedService}
                >
                  Add
                </Button>
              </div>
            </div>

            {serviceDetails.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Services:</p>
                <div className="space-y-2">
                  {serviceDetails.map((detail, index) => {
                    // Find service from allServices, not filtered services, so it works across categories
                    const service = allServices.find(
                      (s) => s.id === detail.serviceId
                    );
                    const total = (detail.price ?? 0) * detail.quantity;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {service?.name ?? service?.serviceName ?? "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Quantity: {detail.quantity} ×{" "}
                            {formatCurrency(detail.price)} ={" "}
                            {formatCurrency(total)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveService(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end border-t pt-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-500">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Additional notes..."
            rows={3}
          />
          {form.formState.errors.notes && (
            <p className="text-sm text-red-500">
              {form.formState.errors.notes.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || serviceDetails.length === 0}
          >
            {createMutation.isPending ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
