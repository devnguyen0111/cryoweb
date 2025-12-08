import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/api/client";
import type {
  ServiceRequestCreateRequestModel,
  Appointment,
  PatientDetailResponse,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

const serviceRequestSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
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

  // Update form serviceDetails when serviceDetails state changes
  useEffect(() => {
    form.setValue("serviceDetails", serviceDetails);
  }, [serviceDetails, form]);

  // Fetch active service categories
  const { data: categoriesData } = useQuery({
    queryKey: ["service-categories", "active"],
    queryFn: () => api.serviceCategory.getActiveServiceCategories(),
  });

  const categories = categoriesData?.data ?? [];

  // Fetch services by category
  const { data: servicesData } = useQuery({
    queryKey: ["services", "category", selectedCategory],
    enabled: !!selectedCategory,
    queryFn: () =>
      api.service.getServicesByCategory(selectedCategory, { isActive: true }),
  });

  const services = servicesData?.data ?? [];

  // Fetch appointments for selection - include multiple statuses
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", "for-service-request"],
    queryFn: async () => {
      // Fetch appointments with multiple statuses that can have service requests
      const statuses: Array<
        "Scheduled" | "Confirmed" | "CheckedIn" | "InProgress"
      > = ["Scheduled", "Confirmed", "CheckedIn", "InProgress"];

      const allAppointments: Appointment[] = [];

      // Fetch appointments for each status
      await Promise.all(
        statuses.map(async (status) => {
          try {
            const response = await api.appointment.getAppointments({
              pageNumber: 1,
              pageSize: 100,
              status,
            });
            if (response.data) {
              allAppointments.push(...response.data);
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

      // Sort by appointment date (most recent first)
      uniqueAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate).getTime();
        const dateB = new Date(b.appointmentDate).getTime();
        return dateB - dateA;
      });

      return uniqueAppointments;
    },
  });

  const appointments = appointmentsData ?? [];

  // Get selected appointment
  const selectedAppointmentId = form.watch("appointmentId");
  const selectedAppointment = appointments.find(
    (apt) => apt.id === selectedAppointmentId
  );

  // Fetch patient when appointment is selected
  const { data: patient } = useQuery({
    queryKey: ["patient", selectedAppointment?.patientId],
    enabled: !!selectedAppointment?.patientId,
    queryFn: async () => {
      if (!selectedAppointment?.patientId) return null;
      try {
        const response = await api.patient.getPatientById(
          selectedAppointment.patientId
        );
        return response.data ?? null;
      } catch (error) {
        // Try patient details as fallback
        try {
          const fallback = await api.patient.getPatientDetails(
            selectedAppointment.patientId
          );
          return fallback.data ?? null;
        } catch {
          return null;
        }
      }
    },
  });

  // Update patientId and requestedDate when appointment changes
  useEffect(() => {
    if (selectedAppointment) {
      // Update patientId
      if (selectedAppointment.patientId) {
        form.setValue("patientId", selectedAppointment.patientId);
      }

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
            const service = services.find((s) => s.id === detail.serviceId);
            return service?.name;
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

    const service = services.find((s) => s.id === selectedService);
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="appointmentId">
              Appointment <span className="text-red-500">*</span>
            </Label>
            <select
              id="appointmentId"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              {...form.register("appointmentId", { required: true })}
              disabled={appointmentsLoading}
            >
              <option value="">
                {appointmentsLoading
                  ? "Loading appointments..."
                  : "Select appointment"}
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

        {selectedAppointment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Appointment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">Patient</p>
                  <p className="mt-1">
                    {(patient as PatientDetailResponse)?.fullName ??
                      (patient as any)?.data?.fullName ??
                      "Loading..."}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-500">Date</p>
                  <p className="mt-1">
                    {formatDate(selectedAppointment.appointmentDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                    const service = services.find(
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
