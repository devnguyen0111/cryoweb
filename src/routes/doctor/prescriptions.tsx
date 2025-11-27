import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { DynamicResponse, Service, ServiceRequest, ServiceRequestCreateRequestModel } from "@/api/types";

type PrescriptionMedication = {
  serviceId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
};

type PrescriptionFormValues = {
  patientId: string;
  diagnosis: string;
  medications: PrescriptionMedication[];
  instructions: string;
};

type PrescriptionSearchState = {
  patientId?: string;
  appointmentId?: string;
};

const createEmptyResponse = <T,>(): DynamicResponse<T> => ({
  code: 200,
  message: "Success",
  data: [],
  metaData: {
    totalCount: 0,
    pageNumber: 1,
    pageSize: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  },
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const Route = createFileRoute("/doctor/prescriptions")({
  component: DoctorPrescriptionComponent,
  validateSearch: (search: { patientId?: string } = {}) => search,
});

function DoctorPrescriptionComponent() {
  const navigate = useNavigate();
  const search = Route.useSearch() as PrescriptionSearchState;
  const [isPreviewing, setIsPreviewing] = useState(false);

  const form = useForm<PrescriptionFormValues>({
    defaultValues: {
      patientId: search.patientId || "",
      diagnosis: "",
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
      instructions: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const { data: serviceList, isFetching: servicesLoading } = useQuery<
    DynamicResponse<Service>
  >({
    queryKey: ["services", "doctor-prescriptions"],
    retry: false,
    queryFn: async (): Promise<DynamicResponse<Service>> => {
      try {
        const response = await api.service.getServices({
          pageNumber: 1,
          pageSize: 100,
        });
        const raw = response as unknown as {
          data?: DynamicResponse<Service> | Service[];
        };
        const payload = raw.data;

        if (Array.isArray(payload)) {
          return {
            code: 200,
            message: "Success",
            data: payload,
            metaData: {
              totalCount: payload.length,
              pageNumber: 1,
              pageSize: payload.length,
              totalPages: 1,
              hasPrevious: false,
              hasNext: false,
            },
          } as DynamicResponse<Service>;
        }

        return (payload ??
          createEmptyResponse<Service>()) as DynamicResponse<Service>;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyResponse<Service>();
        }
        const message =
          error?.response?.data?.message || "Unable to load services.";
        toast.error(message);
        return createEmptyResponse<Service>();
      }
    },
  });

  const serviceOptions = serviceList?.data ?? [];
  const serviceMap = useMemo(() => {
    const map = new Map<string, Service>();
    serviceOptions.forEach((service) => {
      if (service.id) {
        map.set(service.id, service);
      }
    });
    return map;
  }, [serviceOptions]);
  const createServiceRequestMutation = useMutation({
    mutationFn: (payload: ServiceRequestCreateRequestModel) =>
      api.serviceRequest.createServiceRequest(payload),
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Unable to create e-prescription. Please try again.";
      toast.error(message);
    },
  });

  const pendingRequestsQuery = useQuery<DynamicResponse<ServiceRequest>>({
    queryKey: [
      "service-requests",
      "doctor-prescriptions",
      search.patientId,
      search.appointmentId,
    ],
    retry: false,
    queryFn: async (): Promise<DynamicResponse<ServiceRequest>> => {
      try {
        const response = await api.serviceRequest.getServiceRequests({
          pageNumber: 1,
          pageSize: 25,
          status: "Pending",
          patientId: search.patientId,
        });

        const raw = response.data as
          | DynamicResponse<ServiceRequest>
          | ServiceRequest[]
          | undefined;
        const items = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const base: DynamicResponse<ServiceRequest> = {
          code: 200,
          message: "Success",
          data: items,
          metaData: {
            totalCount: items.length,
            pageNumber: 1,
            pageSize: items.length,
            totalPages: 1,
            hasPrevious: false,
            hasNext: false,
          },
        };

        if (search.appointmentId) {
          const filtered = items.filter(
            (item) => item.appointmentId === search.appointmentId
          );
          return {
            ...base,
            data: filtered,
            metaData: {
              ...base.metaData,
              totalCount: filtered.length,
              pageSize: filtered.length,
            },
          };
        }

        return base;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return createEmptyResponse<ServiceRequest>();
        }
        const message =
          error?.response?.data?.message ||
          "Unable to load pending prescriptions.";
        toast.error(message);
        return createEmptyResponse<ServiceRequest>();
      }
    },
  });

  const pendingRequests = pendingRequestsQuery.data;
  const pendingRequestsLoading = pendingRequestsQuery.isFetching;
  const pendingRequestRows = pendingRequests?.data ?? [];

  const onSubmit = (values: PrescriptionFormValues) => {
    const details = values.medications
      .filter((item) => item.serviceId)
      .map((item) => {
        const serviceInfo = serviceOptions.find(
          (service) => service.id === item.serviceId
        );

        const noteParts = [
          item.name,
          item.dosage,
          item.frequency,
          item.duration,
          item.notes,
        ]
          .filter(Boolean)
          .join(" | ");

        return {
          serviceId: item.serviceId,
          quantity: 1,
          unitPrice: serviceInfo?.price ?? 0,
          notes: noteParts || undefined,
        };
      });

    if (!details.length) {
      toast.error("Select a catalog service for at least one medication.");
      return;
    }

    const payload = {
      appointmentId: search.appointmentId,
      patientId: values.patientId || search.patientId,
      requestDate: new Date().toISOString(),
      notes: values.instructions || values.diagnosis,
      serviceDetails: details,
    };

    createServiceRequestMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("E-prescription created.");
        form.reset({
          patientId: values.patientId,
          diagnosis: "",
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
          instructions: "",
        });
        setIsPreviewing(false);
        if (values.patientId) {
          navigate({
            to: "/doctor/patients/$patientId",
            params: { patientId: values.patientId },
          });
        }
      },
    });
  };

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Prescription management</h1>
            <p className="text-gray-600">
              Draft, sign, and deliver e-prescriptions to patients. PDF export
              and SMS notifications are supported.
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent prescriptions</CardTitle>
                <p className="text-sm text-gray-500">
                  Track prescriptions that are still pending signature or
                  fulfillment.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Advanced filtering will be added soon.")
                }
              >
                Advanced filters
              </Button>
            </CardHeader>
            <CardContent>
              {pendingRequestsLoading ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  Loading data...
                </div>
              ) : pendingRequestRows.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">Request ID</th>
                        <th className="px-4 py-3 font-medium">Patient</th>
                        <th className="px-4 py-3 font-medium">Requested on</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pendingRequestRows.map((item: ServiceRequest) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.id}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {item.patientId || "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.requestedDate
                              ? new Date(item.requestedDate).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.status || "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  No pending prescriptions.
                </div>
              )}
            </CardContent>
          </Card>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create new prescription</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Patient ID
                  </label>
                  <Input
                    placeholder="Enter the patient identifier"
                    {...form.register("patientId", { required: true })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <textarea
                    className="min-h-[100px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Describe the diagnosis and treatment status"
                    {...form.register("diagnosis")}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medications &amp; dosing</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      serviceId: "",
                      name: "",
                      dosage: "",
                      frequency: "",
                      duration: "",
                      notes: "",
                    })
                  }
                >
                  Add medication
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-4 rounded-lg border border-gray-100 p-4 md:grid-cols-2"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Medication/service (catalog)
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        {...form.register(
                          `medications.${index}.serviceId` as const,
                          {
                            required: true,
                          }
                        )}
                      >
                        <option value="">
                          {servicesLoading ? "Loading..." : "Select service"}
                        </option>
                        {serviceOptions.map((service: Service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                            {service.price
                              ? ` - ${usdFormatter.format(service.price)}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Medication name
                      </label>
                      <Input
                        placeholder="Ex: Utrogestan 200mg"
                        {...form.register(
                          `medications.${index}.name` as const,
                          {
                            required: true,
                          }
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Dose per administration
                      </label>
                      <Input
                        placeholder="2 capsules"
                        {...form.register(
                          `medications.${index}.dosage` as const
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Frequency
                      </label>
                      <Input
                        placeholder="Twice daily"
                        {...form.register(
                          `medications.${index}.frequency` as const
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Duration
                      </label>
                      <Input
                        placeholder="14 days"
                        {...form.register(
                          `medications.${index}.duration` as const
                        )}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        className="min-h-[80px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Administration guidance, interactions, timing..."
                        {...form.register(
                          `medications.${index}.notes` as const
                        )}
                      />
                    </div>
                    {fields.length > 1 && (
                      <div className="md:col-span-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => remove(index)}
                        >
                          Remove this medication
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medication instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Remind patient about timing, lifestyle considerations, and follow-ups..."
                  {...form.register("instructions")}
                />
              </CardContent>
            </Card>

            {isPreviewing && (
              <Card>
                <CardHeader>
                  <CardTitle>Prescription preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-700">
                  <p>Patient: {form.watch("patientId") || "Not provided"}</p>
                  <p>Diagnosis: {form.watch("diagnosis") || "Not provided"}</p>
                  <div>
                    <p className="font-semibold">Medications:</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {form.watch("medications").map((med, index) => (
                        <li key={`preview-${index}`}>
                          {serviceMap.get(med.serviceId)?.name ||
                            "(No service selected)"}{" "}
                          {med.name ? `- ${med.name}` : ""} -{" "}
                          {med.dosage || "Dose"}, {med.frequency || "Frequency"}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p>
                    Instructions: {form.watch("instructions") || "Not provided"}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewing((prev) => !prev)}
              >
                {isPreviewing ? "Hide preview" : "Show preview"}
              </Button>
              <Button
                type="submit"
                disabled={createServiceRequestMutation.isPending}
              >
                {createServiceRequestMutation.isPending
                  ? "Saving..."
                  : "Save prescription"}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
