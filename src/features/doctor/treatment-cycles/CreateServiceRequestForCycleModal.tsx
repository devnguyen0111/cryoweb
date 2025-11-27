/**
 * Create Service Request Modal for Treatment Cycle
 * Allows doctor to create service requests for a specific treatment cycle
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api/client";
import type {
  ServiceRequestCreateRequestModel,
  TreatmentCycle,
} from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface ServiceDetail {
  serviceId: string;
  quantity: number;
  price?: number;
}

interface CreateServiceRequestForCycleModalProps {
  cycle: TreatmentCycle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateServiceRequestForCycleModal({
  cycle,
  isOpen,
  onClose,
  onSuccess,
}: CreateServiceRequestForCycleModalProps) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [serviceQuantity, setServiceQuantity] = useState<number>(1);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetail[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string>("");

  // Fetch active service categories
  const { data: categoriesData } = useQuery({
    queryKey: ["service-categories", "active"],
    queryFn: () => api.serviceCategory.getActiveServiceCategories(),
    enabled: isOpen,
  });

  const categories = categoriesData?.data ?? [];

  // Fetch services by category
  const { data: servicesData } = useQuery({
    queryKey: ["services", "category", selectedCategory],
    enabled: isOpen && !!selectedCategory,
    queryFn: () =>
      api.service.getServicesByCategory(selectedCategory, { isActive: true }),
  });

  const services = servicesData?.data ?? [];

  // Fetch appointments for this patient
  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments", "patient", cycle.patientId],
    enabled: isOpen && !!cycle.patientId,
    queryFn: async () => {
      if (!cycle.patientId) return [];
      try {
        const response = await api.appointment.getAppointments({
          patientId: cycle.patientId,
          pageNumber: 1,
          pageSize: 100,
        });
        return response.data || [];
      } catch {
        return [];
      }
    },
  });

  const appointments = appointmentsData || [];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setServiceDetails([]);
      setSelectedCategory("");
      setSelectedService("");
      setServiceQuantity(1);
      setNotes("");
      setSelectedAppointmentId("");
    }
  }, [isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: ServiceRequestCreateRequestModel) => {
      return api.serviceRequest.createServiceRequest(data);
    },
    onSuccess: () => {
      toast.success("Service request created successfully");
      queryClient.invalidateQueries({
        queryKey: ["doctor", "service-requests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["service-requests", "patient", cycle.patientId],
      });
      onSuccess();
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

  const handleSubmit = () => {
    if (serviceDetails.length === 0) {
      toast.error("Please add at least one service");
      return;
    }

    if (!cycle.patientId) {
      toast.error("Patient ID is required");
      return;
    }

    const requestData: ServiceRequestCreateRequestModel = {
      appointmentId: selectedAppointmentId || null,
      patientId: cycle.patientId,
      requestDate: new Date().toISOString(),
      requestedDate: new Date().toISOString().split("T")[0],
      notes:
        notes ||
        `Service request for treatment cycle: ${cycle.cycleName || cycle.id}`,
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

  const totalAmount = serviceDetails.reduce(
    (sum, detail) => sum + (detail.price ?? 0) * detail.quantity,
    0
  );

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  return (
    <Modal
      title="Create Service Request"
      description={`Request services for treatment cycle: ${cycle.cycleName || `Cycle ${cycle.cycleNumber}`}`}
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <div className="space-y-6">
        {/* Patient and Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input
                  value={cycle.patientId || "N/A"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentId">Appointment (Optional)</Label>
                <select
                  id="appointmentId"
                  value={selectedAppointmentId}
                  onChange={(e) => setSelectedAppointmentId(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">No appointment</option>
                  {appointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {new Date(apt.appointmentDate || "").toLocaleDateString()}{" "}
                      - {apt.appointmentCode || apt.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedService("");
                  }}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName || cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <select
                  id="service"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.serviceName || service.name} -{" "}
                      {formatCurrency(service.price)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={serviceQuantity}
                  onChange={(e) =>
                    setServiceQuantity(parseInt(e.target.value) || 1)
                  }
                  className="w-full"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddService}
              disabled={!selectedService}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </CardContent>
        </Card>

        {/* Selected Services */}
        {serviceDetails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceDetails.map((detail, index) => {
                  const service = services.find(
                    (s) => s.id === detail.serviceId
                  );
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {service?.serviceName ||
                            service?.name ||
                            "Unknown Service"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {detail.quantity} ×{" "}
                          {formatCurrency(detail.price)} ={" "}
                          {formatCurrency(
                            (detail.price ?? 0) * detail.quantity
                          )}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveService(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Total Amount:</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes for this service request..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending || serviceDetails.length === 0}
          >
            {createMutation.isPending
              ? "Creating..."
              : "Create Service Request"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
