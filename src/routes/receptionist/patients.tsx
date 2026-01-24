import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Filter, X, Search, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { z } from "zod";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/api/client";
import type { PatientDetailResponse } from "@/api/types";
import {
  isPatientDetailResponse,
  getPatientProperty,
} from "@/utils/patient-helpers";
import { getLast4Chars } from "@/utils/id-helpers";
import { getStatusBadgeClass } from "@/utils/status-colors";
import { usePatientDetails } from "@/hooks/usePatientDetails";
import { StructuredNote } from "@/components/StructuredNote";
import { cn } from "@/utils/cn";

export const Route = createFileRoute("/receptionist/patients")({
  validateSearch: z.object({
    viewId: z.string().optional(),
  }),
  component: ReceptionistPatientsComponent,
});

interface DetailFieldProps {
  label: string;
  value?: string | number | null;
  placeholder?: string;
  multiline?: boolean;
}

function DetailField({
  label,
  value,
  placeholder = "—",
  multiline,
}: DetailFieldProps) {
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
}

function ReceptionistPatientsComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force refetch all queries
    await queryClient.refetchQueries({ queryKey: ["receptionist", "patients"] });
    await queryClient.invalidateQueries({ queryKey: ["receptionist", "patient"] });
    setIsRefreshing(false);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setIsActiveFilter("all");
    setGenderFilter("all");
    setSortBy("patientCode");
    setSortOrder("asc");
    setPage(1);
  };

  const handleFilterChange = () => {
    console.log("Filter changed:", { isActiveFilter, genderFilter, sortBy, sortOrder });
    setPage(1); // Reset to first page when filters change
    // Force invalidate to ensure query runs with new filters
    queryClient.invalidateQueries({
      queryKey: ["receptionist", "patients"]
    });
  };
  const { viewId } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Debounce search term
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsSearchDebouncing(true);

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when search changes
      setIsSearchDebouncing(false);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Filter states
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("patientCode");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "receptionist",
      "patients",
      {
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: debouncedSearchTerm || "",
        isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "active" ? true : false,
        gender: genderFilter === "all" ? undefined : genderFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      },
    ],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    queryFn: async () => {
      const params = {
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: debouncedSearchTerm || "",
        isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "active" ? true : false,
        gender: genderFilter === "all" ? undefined : genderFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };

      // TEMPORARY TEST: Force gender filter to test if backend supports it
      // params.gender = "Female";

      console.log("Fetching patients with params:", params);

      // Test if filters are being applied by checking API response
      console.log("Filter values being sent:", {
        isActive: params.isActive,
        gender: params.gender,
        genderFilter,
        isActiveFilter
      });

      // Debug filter states
      console.log("Current filter states:", {
        isActiveFilter,
        genderFilter,
        sortBy,
        sortOrder,
        debouncedSearchTerm
      });

      // Determine if we need client-side filtering
      // Note: Backend gender is boolean (true=Male, false=Female), not string
      const needsClientSideFilter = genderFilter !== "all";
      const backendParams = {
        ...params,
        // If filtering gender client-side, request larger dataset
        // Note: This works if total data < 100. For larger datasets, backend filter support needed
        pageSize: needsClientSideFilter ? 100 : pageSize,
        pageNumber: needsClientSideFilter ? 1 : page,
        // Remove gender filter - we'll filter client-side since backend uses boolean
        gender: undefined,
        // Keep isActive filter - let backend handle it if supported
        isActive: isActiveFilter === "all" ? undefined : isActiveFilter === "active" ? true : false,
      };

      const response = await api.patient.getPatients(backendParams);

      console.log("API Response:", response);

      if (!response?.data) {
        console.warn("No data in response, returning empty array");
        return {
          ...response,
          data: [],
        };
      }

      // Apply client-side filtering if needed
      let filteredData = response.data;

      // Client-side gender filter (backend uses boolean: true=Male, false=Female)
      if (needsClientSideFilter) {
        const genderMap: Record<string, boolean | null> = {
          "Male": true,
          "Female": false,
          "Other": null, // Handle "Other" case if needed
        };

        const targetGender = genderMap[genderFilter];
        if (targetGender !== undefined) {
          filteredData = filteredData.filter((patient: PatientDetailResponse) => {
            const patientGender = (patient.accountInfo as any)?.gender;
            return patientGender === targetGender;
          });
          console.log(`Client-side gender filter applied (${genderFilter}):`, {
            before: response.data.length,
            after: filteredData.length
          });
        }
      }

      // Note: isActive filter is handled by backend via params.isActive
      // If backend doesn't support it, we could add client-side filtering here

      // Apply client-side pagination if we filtered client-side
      let paginatedData = filteredData;
      let finalTotal = filteredData.length;
      let finalTotalPages = Math.ceil(filteredData.length / pageSize);

      if (needsClientSideFilter) {
        // Apply pagination to filtered data
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        paginatedData = filteredData.slice(startIndex, endIndex);
        finalTotal = filteredData.length;
        finalTotalPages = Math.ceil(filteredData.length / pageSize);

        console.log("Client-side pagination applied:", {
          totalFiltered: filteredData.length,
          page,
          pageSize,
          startIndex,
          endIndex,
          paginatedCount: paginatedData.length,
          totalPages: finalTotalPages
        });
      } else {
        // Use backend pagination
        const responseMeta = response.metaData as any;
        finalTotal = responseMeta?.total ?? responseMeta?.totalCount ?? filteredData.length;
        finalTotalPages = responseMeta?.totalPages ?? Math.ceil(filteredData.length / pageSize);
      }

      // Return filtered and paginated response
      const responseMeta = response.metaData as any;
      return {
        ...response,
        data: paginatedData,
        metaData: {
          ...responseMeta,
          total: finalTotal,
          totalCount: finalTotal, // Support both formats
          totalPages: finalTotalPages,
          page: page,
          pageNumber: page,
          size: pageSize,
          pageSize: pageSize,
        }
      };
    },
  });

  const patients = data?.data ?? [];

  const { total, totalPages } = useMemo(() => {
    // Use API metaData if available, otherwise fallback to local calculation
    // Handle both API response formats: {total, size} and {totalCount, pageSize}
    const metaData = data?.metaData as any;
    const apiTotal = metaData?.total ?? metaData?.totalCount;
    const apiTotalPages = metaData?.totalPages;
    const apiPageSize = metaData?.size ?? metaData?.pageSize ?? pageSize;

    const patientCount = patients ? patients.length : 0;

    // Prefer API data, fallback to local calculation
    const calculatedTotal = apiTotal !== undefined ? apiTotal : patientCount;
    const calculatedTotalPages = apiTotalPages !== undefined ? apiTotalPages : (patientCount > 0 ? Math.ceil(patientCount / apiPageSize) : 1);

    console.log("Calculated totals:", {
      patientCount,
      apiTotal,
      apiTotalPages,
      apiPageSize,
      calculatedTotal,
      calculatedTotalPages,
      metaData: data?.metaData,
      hasPatients: patients && patients.length > 0,
      dataExists: !!data
    });

    return {
      total: calculatedTotal,
      totalPages: calculatedTotalPages
    };
  }, [data, patients, pageSize]);
  const isDetailOpen = Boolean(viewId);

  useEffect(() => {
    if (!isDetailOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDetailOpen]);

  const {
    data: patientDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = usePatientDetails(viewId, isDetailOpen && !!viewId);

  const { data: patientAppointments, isLoading: isAppointmentsLoading } =
    useQuery({
      queryKey: ["receptionist", "patient", "detail", "appointments", viewId],
      enabled: isDetailOpen && Boolean(viewId),
      queryFn: async () => {
        if (!viewId) return null;
        try {
          return await api.appointment.getAppointments({
            PatientId: viewId,
            Page: 1,
            Size: 5,
            Sort: "appointmentDate",
            Order: "desc",
          } as any);
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 403) {
            return { data: [] };
          }
          throw error;
        }
      },
    });

  const statusBadgeClass = (status?: string) => {
    return getStatusBadgeClass(status, "auto");
  };

  const handleViewDetails = (patientId: string) => {
    navigate({
      to: "/receptionist/patients",
      search: (previous) => ({
        ...previous,
        viewId: patientId,
      }),
    });
  };

  const handleCloseDetails = () => {
    navigate({
      to: "/receptionist/patients",
      search: (previous) => ({
        ...previous,
        viewId: undefined,
      }),
      replace: true,
    });
  };

  const recentAppointments = patientAppointments?.data ?? [];

  const detailHeader = useMemo(() => {
    if (!patientDetail) return null;
    const isDetail = isPatientDetailResponse(patientDetail);
    const accountInfo = isDetail ? (patientDetail as any).accountInfo : null;
    const firstName = accountInfo?.firstName || patientDetail.firstName;
    const lastName = accountInfo?.lastName || patientDetail.lastName;
    const displayName =
      (firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName) ||
      accountInfo?.username ||
      patientDetail.patientCode ||
      "Patient detail";
    return {
      displayName,
      patientCode: patientDetail.patientCode || "N/A",
      email:
        (isPatientDetailResponse(patientDetail)
          ? patientDetail.accountInfo?.email
          : null) ||
        patientDetail.email ||
        "-",
      phone:
        (isPatientDetailResponse(patientDetail)
          ? patientDetail.accountInfo?.phone
          : null) ||
        patientDetail.phoneNumber ||
        "-",
      bloodType: patientDetail.bloodType || "N/A",
    };
  }, [patientDetail]);

  return (
    <ProtectedRoute allowedRoles={["Receptionist"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Patient management</h1>
              <p className="text-gray-600 mt-2">
                Search patients by patient code or email, and update patient records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={() =>
                  navigate({ to: "/receptionist/service-requests" })
                }
              >
                Link service request
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/receptionist/dashboard" })}
              >
                Dashboard
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle>Patient list</CardTitle>
                  <p className="text-sm text-gray-500">
                    Search by patient code or email • Results: {total} patients • Page {page}/{totalPages}
                  </p>
                </div>
                <div className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by patient code or email..."
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                    }}
                    className="pl-10 pr-10"
                  />
                  {(isSearchDebouncing || isLoading) && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {(isActiveFilter !== "all" || genderFilter !== "all" || sortBy !== "patientCode" || sortOrder !== "asc") && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Reset
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="status-filter" className="text-xs font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={isActiveFilter}
                        onValueChange={(value) => {
                          setIsActiveFilter(value);
                          handleFilterChange();
                        }}
                      >
                        <SelectTrigger id="status-filter">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender-filter" className="text-xs font-medium text-gray-700">
                        Gender
                      </Label>
                      <Select
                        value={genderFilter}
                        onValueChange={(value) => {
                          setGenderFilter(value);
                          handleFilterChange();
                        }}
                      >
                        <SelectTrigger id="gender-filter">
                          <SelectValue placeholder="All genders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All genders</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sort-by" className="text-xs font-medium text-gray-700">
                        Sort by
                      </Label>
                      <Select
                        value={sortBy}
                        onValueChange={(value) => {
                          setSortBy(value);
                          handleFilterChange();
                        }}
                      >
                        <SelectTrigger id="sort-by">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="firstName">First Name</SelectItem>
                          <SelectItem value="lastName">Last Name</SelectItem>
                          <SelectItem value="patientCode">Patient Code</SelectItem>
                          <SelectItem value="createdAt">Created Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sort-order" className="text-xs font-medium text-gray-700">
                        Order
                      </Label>
                      <Select
                        value={sortOrder}
                        onValueChange={(value) => {
                          setSortOrder(value as "asc" | "desc");
                          handleFilterChange();
                        }}
                      >
                        <SelectTrigger id="sort-order">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Ascending</SelectItem>
                          <SelectItem value="desc">Descending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Error loading patients. Please try again.
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.length ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Patient</th>
                              <th className="text-left p-2">Contact</th>
                              <th className="text-left p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patients.map((patient) => {
                              const isDetail = isPatientDetailResponse(patient);
                              const accountInfo = isDetail
                                ? (patient as any).accountInfo
                                : null;
                              const firstName =
                                accountInfo?.firstName || patient.firstName;
                              const lastName =
                                accountInfo?.lastName || patient.lastName;
                              const displayName =
                                (firstName && lastName
                                  ? `${firstName} ${lastName}`.trim()
                                  : firstName || lastName) ||
                                accountInfo?.username ||
                                patient.patientCode ||
                                "Unknown";
                              return (
                                <tr key={patient.id} className="border-b">
                                  <td className="p-2">
                                    <div className="font-medium text-gray-900">
                                      {displayName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Patient code:{" "}
                                      {patient.patientCode || "N/A"}
                                    </div>
                                  </td>
                                  <td className="p-2 text-sm text-gray-600">
                                    {(isDetail
                                      ? (patient as any).accountInfo?.email
                                      : null) ||
                                      patient.email ||
                                      "-"}
                                  </td>
                                  <td className="p-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      type="button"
                                      onClick={() =>
                                        handleViewDetails(patient.id)
                                      }
                                    >
                                      View details
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Showing {patients.length} / {total} patients
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() =>
                              setPage((prev) => Math.max(1, prev - 1))
                            }
                          >
                            Previous
                          </Button>
                          <span>
                            Page {page}/{totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() =>
                              setPage((prev) => Math.min(totalPages, prev + 1))
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {detailHeader?.displayName || "Patient detail"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Patient ID:{" "}
                    <span className="font-medium">{getLast4Chars(viewId)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {patientDetail?.isActive !== undefined && (
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        patientDetail.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {patientDetail.isActive ? "Active" : "Inactive"}
                    </span>
                  )}
                  <Button variant="ghost" onClick={handleCloseDetails}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {isDetailLoading ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Loading patient details...
                  </div>
                ) : detailError ? (
                  <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-600">
                    Unable to load patient details. Please try again later.
                  </div>
                ) : !patientDetail ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Patient details not available.
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Basic information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          <p>
                            <span className="font-medium text-gray-900">
                              Patient code:
                            </span>{" "}
                            {detailHeader?.patientCode}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Citizen ID Card:
                            </span>{" "}
                            {patientDetail.nationalId || "Not recorded"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Blood type:
                            </span>{" "}
                            {detailHeader?.bloodType}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Insurance:
                            </span>{" "}
                            {getPatientProperty(
                              patientDetail,
                              "insurance",
                              "No insurance info"
                            )}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Created at:
                            </span>{" "}
                            {patientDetail.createdAt || "-"}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Contact information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          <p>
                            <span className="font-medium text-gray-900">
                              Email:
                            </span>{" "}
                            {detailHeader?.email}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Phone:
                            </span>{" "}
                            {detailHeader?.phone}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Address:
                            </span>{" "}
                            {(isPatientDetailResponse(patientDetail)
                              ? patientDetail.accountInfo?.address
                              : null) ||
                              patientDetail.address ||
                              "-"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Emergency contact:
                            </span>{" "}
                            {getPatientProperty(
                              patientDetail,
                              "emergencyContact",
                              "Not provided"
                            )}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Emergency phone:
                            </span>{" "}
                            {getPatientProperty(
                              patientDetail,
                              "emergencyPhone",
                              "-"
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-6">
                      <Card>
                        <CardHeader className="flex items-center justify-between">
                          <CardTitle>Appointments history</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-gray-700">
                          {isAppointmentsLoading ? (
                            <p className="text-gray-500">
                              Loading appointments...
                            </p>
                          ) : recentAppointments.length ? (
                            recentAppointments.map((appointment, index) => (
                              <div
                                key={appointment.id}
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {appointment.appointmentCode ||
                                      `appointment #${index + 1}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {appointment.appointmentDate || "—"}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status || "scheduled"}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">
                              No appointments on record.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold text-gray-900">
                          Medical notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <DetailField
                          label="Medical history"
                          value={getPatientProperty(
                            patientDetail,
                            "medicalHistory",
                            null
                          )}
                          placeholder="Not provided"
                          multiline
                        />
                        <DetailField
                          label="Allergies"
                          value={getPatientProperty(
                            patientDetail,
                            "allergies",
                            null
                          )}
                          placeholder="Not provided"
                          multiline
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Notes
                          </p>
                          <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                            {getPatientProperty(
                              patientDetail,
                              "notes",
                              null
                            ) ? (
                              <StructuredNote
                                note={getPatientProperty(
                                  patientDetail,
                                  "notes",
                                  null
                                )}
                              />
                            ) : (
                              <p className="text-sm text-gray-500">
                                No additional notes
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
