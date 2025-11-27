import { useEffect } from "react";
import { isAxiosError } from "axios";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StructuredNote } from "@/components/StructuredNote";
import { api } from "@/api/client";
import { isPatientDetailResponse } from "@/utils/patient-helpers";

export const Route = createFileRoute("/admin/patients/$patientId")({
  component: AdminPatientDetail,
});

function AdminPatientDetail() {
  const { patientId } = Route.useParams();
  const navigate = useNavigate();

  const debug = (...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[AdminPatientDetail]", ...args);
    }
  };

  useEffect(() => {
    debug("Route params change", { patientId });
  }, [patientId]);

  const { data: patientResponse, isLoading } = useQuery({
    queryKey: ["admin", "patient", patientId],
    queryFn: async () => {
      try {
        const response = await api.patient.getPatientDetails(patientId);
        return response.data;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 403) {
          const fallback = await api.patient.getPatientById(patientId);
          return fallback.data;
        }
        throw error;
      }
    },
  });

  const patient = patientResponse;
  useEffect(() => {
    debug("Patient query state", {
      isLoading,
      hasPatient: Boolean(patient),
    });
  }, [isLoading, patient]);

  const displayName =
    (isPatientDetailResponse(patient) && patient.accountInfo?.username) ||
    patient?.patientCode ||
    "Patient detail";

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Patient detail</h1>
              <p className="text-gray-600">
                Patient ID: <span className="font-semibold">{patientId}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/admin/patients" })}
            >
              Back to list
            </Button>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {isLoading ? "Loading..." : displayName}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Account ID: {patient?.accountId || "—"} · Blood type:{" "}
                  {patient?.bloodType || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  Email:{" "}
                  {(isPatientDetailResponse(patient) &&
                    patient.accountInfo?.email) ||
                    "-"}{" "}
                  · Phone:{" "}
                  {(isPatientDetailResponse(patient) &&
                    patient.accountInfo?.phone) ||
                    "-"}
                </p>
                <p className="text-sm text-gray-500">
                  Status:{" "}
                  {patient?.isActive ? (
                    <span className="font-medium text-emerald-600">Active</span>
                  ) : (
                    <span className="font-medium text-red-600">Inactive</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: "/doctor/encounters/create",
                      search: { patientId },
                    })
                  }
                >
                  Create encounter
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate({
                      to: "/doctor/patients/$patientId",
                      params: { patientId },
                    })
                  }
                >
                  Open doctor view
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-medium text-gray-900">
                    Patient code:
                  </span>{" "}
                  {patient?.patientCode || "Not assigned"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    National ID:
                  </span>{" "}
                  {patient?.nationalId || "Not recorded"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Emergency contact:
                  </span>{" "}
                  {(isPatientDetailResponse(patient) &&
                    patient.emergencyContact) ||
                    "Not provided"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Emergency phone:
                  </span>{" "}
                  {(isPatientDetailResponse(patient) &&
                    patient.emergencyPhone) ||
                    "-"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Insurance:</span>{" "}
                  {(isPatientDetailResponse(patient) && patient.insurance) ||
                    "No insurance info"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Created at:</span>{" "}
                  {patient?.createdAt || "-"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Updated at:</span>{" "}
                  {patient?.updatedAt || "-"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Relationships:
                  </span>{" "}
                  {(isPatientDetailResponse(patient) &&
                    patient.relationshipCount) ??
                    0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clinical metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-700">
                <p>
                  <span className="font-medium text-gray-900">Height:</span>{" "}
                  {(isPatientDetailResponse(patient) && patient.height) ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Weight:</span>{" "}
                  {(isPatientDetailResponse(patient) && patient.weight) ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">BMI:</span>{" "}
                  {(isPatientDetailResponse(patient) && patient.bmi) ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Medical history:
                  </span>{" "}
                  {(isPatientDetailResponse(patient) &&
                    patient.medicalHistory) ||
                    "Not recorded"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Allergies:</span>{" "}
                  {(isPatientDetailResponse(patient) && patient.allergies) ||
                    "None reported"}
                </p>
                <div>
                  <p className="font-medium text-gray-900">Notes:</p>
                  <div className="mt-1 rounded border border-gray-200 bg-white p-2 text-sm text-gray-700">
                    {isPatientDetailResponse(patient) && patient.notes ? (
                      <StructuredNote note={patient.notes} />
                    ) : (
                      "No notes"
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
