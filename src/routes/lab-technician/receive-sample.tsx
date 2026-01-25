import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/api/client";
import { SearchablePatientSelect } from "../../components/SearchablePatientSelect";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/lab-technician/receive-sample",
)({
  component: ReceiveSamplePage,
});

function ReceiveSamplePage() {
  const queryClient = useQueryClient();

  /* ================= STATE ================= */
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any | null>(null);

  const [newSamplePatientId, setNewSamplePatientId] = useState("");
  const [newSampleType, setNewSampleType] =
    useState<"Sperm" | "Oocyte">("Sperm");

  const keyword = searchTerm.trim().toLowerCase();

  /* ================= FETCH SAMPLES ================= */
  const { data: sampleData, isLoading } = useQuery({
    queryKey: ["samples", "collected"],
    queryFn: () =>
      api.sample.getSamples({
        status: "Collected",
      }),
  });

  /* ================= FETCH PATIENTS ================= */
  const { data: patientData } = useQuery({
    queryKey: ["patients"],
    queryFn: () =>
      api.patient.getPatients({
        pageNumber: 1,
        pageSize: 1000,
      }),
  });

  /* ================= MAP PATIENT ================= */
  const patientMap = new Map(
    patientData?.data?.map((p: any) => [String(p.id), p]) || [],
  );

  /* ================= FILTER + PAGINATION ================= */
  const filteredSamples =
    sampleData?.data?.filter((sample: any) => {
      const patient = patientMap.get(String(sample.patientId));

      const sampleMatch =
        sample.sampleCode?.toLowerCase().includes(keyword) ||
        sample.id?.toString().includes(keyword);

      const patientCodeMatch =
        patient?.patientCode?.toLowerCase().includes(keyword) ??
        false;

      const patientNameMatch = patient?.accountInfo
        ? `${patient.accountInfo.firstName} ${patient.accountInfo.lastName}`
            .toLowerCase()
            .includes(keyword)
        : false;

      return (
        sampleMatch || patientCodeMatch || patientNameMatch
      );
    }) || [];

  const totalPages = Math.ceil(filteredSamples.length / pageSize);

  const paginatedSamples = filteredSamples.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  /* ================= CREATE SAMPLE ================= */
  const createSampleMutation = useMutation({
  mutationFn: async () => {
    if (!newSamplePatientId) {
      throw new Error("Patient is required");
    }

    if (newSampleType === "Sperm") {
      return api.sample.createSpermSample({
        PatientId: newSamplePatientId,
      });
    }

    return api.sample.createOocyteSample({
      PatientId: newSamplePatientId,
    });
  },

  onSuccess: () => {
    toast.success("Sample created successfully");
    setIsReceiveOpen(false);
    setNewSamplePatientId("");
    setNewSampleType("Sperm");

    queryClient.invalidateQueries({
      queryKey: ["samples", "collected"],
    });
  },
  onError: (error: any) => {
    const message = error?.response?.data?.message || error?.message || "Failed to create sample";
    toast.error(message);
  },
});

  /* ================= HELPERS ================= */
  const formatDate = (date?: string) =>
    date ? date.split("T")[0] : "-";

  const formatTime = (date?: string) =>
    date ? date.split("T")[1] : "-";
const [showDropdown, setShowDropdown] = useState(false);
  return (
    <ProtectedRoute allowedRoles={["Lab Technician"]}>
      <DashboardLayout>
        <div className="space-y-6">

          {/* ===== HEADER ===== */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                Receive Sample
              </h1>
              <p className="text-gray-500 mt-1">
                Manage collected lab samples and view patient
                information
              </p>
            </div>

            <button
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => setIsReceiveOpen(true)}
            >
              + Receive New Sample
            </button>
          </div>

          {/* ===== CARD ===== */}
          <div className="bg-white rounded-xl border shadow-sm">

            {/* Search */}
            <div className="relative p-5 border-b">
  <input
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setPage(1);
      setShowDropdown(true);
    }}
    onFocus={() => setShowDropdown(true)}
    placeholder="Search by sample code, patient code or patient name"
    className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
  />

  {showDropdown && searchTerm && filteredSamples.length > 0 && (
    <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow max-h-60 overflow-auto">
      {filteredSamples.slice(0, 5).map((sample: any) => {
        const patient = patientMap.get(String(sample.patientId));

        return (
          <div
            key={sample.id}
            className="px-4 py-2 cursor-pointer hover:bg-blue-50"
            onClick={() => {
              setSearchTerm(sample.sampleCode || sample.id);
              setPage(1);
              setShowDropdown(false);
            }}
          >
            <div className="font-medium">
              Sample: {sample.sampleCode || sample.id}
            </div>
            <div className="text-sm text-gray-500">
              {patient?.patientCode} –{" "}
              {patient?.accountInfo?.firstName}{" "}
              {patient?.accountInfo?.lastName}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading samples...
                </div>
              ) : paginatedSamples.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600">
                      <th className="px-6 py-4 text-left">
                        Sample Code
                      </th>
                      <th className="px-6 py-4 text-left">
                        Patient Code
                      </th>
                      <th className="px-6 py-4 text-left">
                        Patient Name
                      </th>
                      <th className="px-6 py-4 text-left">
                        Sample Type
                      </th>
                      <th className="px-6 py-4 text-left">
                        Collection Time
                      </th>
                      <th className="px-6 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSamples.map((sample: any) => {
                      const patient = patientMap.get(
                        String(sample.patientId),
                      );

                      return (
                        <tr
                          key={sample.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium">
                            {sample.sampleCode || sample.id}
                          </td>
                          <td className="px-6 py-4">
                            {patient?.patientCode || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {patient?.accountInfo
                              ? `${patient.accountInfo.firstName} ${patient.accountInfo.lastName}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                              {sample.sampleType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-500">
                              {formatDate(
                                sample.collectionDate,
                              )}
                            </div>
                            <div className="font-medium">
                              {formatTime(
                                sample.collectionDate,
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="px-4 py-1.5 border rounded-lg hover:bg-blue-50"
                              onClick={() => {
                                setSelectedSample(sample);
                                setIsViewOpen(true);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No matching samples found
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Page {page} / {totalPages || 1}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== VIEW MODAL ===== */}
        {isViewOpen && selectedSample && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">

              <div className="px-6 py-4 border-b flex justify-between">
                <h3 className="font-semibold">
                  Sample Details
                </h3>
                <button onClick={() => setIsViewOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 text-sm">
                <div>
                  <p className="font-medium mb-2">
                    Sample Information
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500">
                        Sample Code
                      </span>
                      <p>
                        {selectedSample.sampleCode ||
                          selectedSample.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        Sample Type
                      </span>
                      <p>{selectedSample.sampleType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        Collection Date
                      </span>
                      <p>
                        {formatDate(
                          selectedSample.collectionDate,
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        Collection Time
                      </span>
                      <p>
                        {formatTime(
                          selectedSample.collectionDate,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-medium mb-2">
                    Patient Information
                  </p>
                  {(() => {
                    const patient = patientMap.get(
                      String(selectedSample.patientId),
                    );

                    return patient ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500">
                            Patient Code
                          </span>
                          <p>{patient.patientCode}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Patient Name
                          </span>
                          <p>
                            {patient.accountInfo
                              ? `${patient.accountInfo.firstName} ${patient.accountInfo.lastName}`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Birth Date
                          </span>
                          <p>
                            {formatDate(
                              patient.accountInfo?.birthDate,
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Gender
                          </span>
                          <p>
                            {patient.accountInfo?.gender === true
                              ? "Male"
                              : patient.accountInfo?.gender === false
                              ? "Female"
                              : "-"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Patient data not found
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="px-6 py-4 border-t text-right">
                <button
                  className="px-4 py-2 border rounded-lg"
                  onClick={() => setIsViewOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== RECEIVE MODAL ===== */}
        {isReceiveOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">

              <div className="px-6 py-4 border-b flex justify-between">
                <h3 className="font-semibold">
                  Receive New Sample
                </h3>
                <button onClick={() => setIsReceiveOpen(false)}>
                  ✕
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 text-sm">
                <SearchablePatientSelect
  patients={patientData?.data || []}
  onSelect={(p) => {
    setNewSamplePatientId(p.id);
  }}
  placeholder="Search and select patient"
/>

                <div className="flex gap-3">
                  {["Sperm", "Oocyte"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setNewSampleType(
                          type as "Sperm" | "Oocyte",
                        )
                      }
                      className={`px-4 py-2 border rounded-lg ${
                        newSampleType === type
                          ? "bg-blue-50 border-blue-600"
                          : ""
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t text-right">
                <button
                  disabled={
                    !newSamplePatientId ||
                    createSampleMutation.isPending
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  onClick={() =>
                    createSampleMutation.mutate()
                  }
                >
                  {createSampleMutation.isPending
                    ? "Creating..."
                    : "Create Sample"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}


