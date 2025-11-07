import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import type { DynamicResponse, DoctorSchedule, TimeSlot } from "@/api/types";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { cn } from "@/utils/cn";

type DoctorSchedulePayload = Partial<DoctorSchedule> & {
  DoctorId?: string;
  AccountId?: string;
  SlotId?: string;
  WorkDate?: string;
  StartTime?: string;
  EndTime?: string;
  Location?: string;
  Notes?: string;
  IsAvailable?: boolean;
};

const DEFAULT_SLOTS: TimeSlot[] = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    startTime: "08:00:00",
    endTime: "10:00:00",
    notes: "Morning Slot 1",
    isBooked: false,
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    startTime: "10:00:00",
    endTime: "12:00:00",
    notes: "Morning Slot 2",
    isBooked: false,
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    startTime: "13:00:00",
    endTime: "15:00:00",
    notes: "Afternoon Slot 1",
    isBooked: false,
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    startTime: "15:00:00",
    endTime: "17:00:00",
    notes: "Afternoon Slot 2",
    isBooked: false,
  },
];

export const Route = createFileRoute("/doctor/schedule")({
  component: DoctorScheduleComponent,
});

function DoctorScheduleComponent() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [location, setLocation] = useState("Clinic A");
  const [notes, setNotes] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isCopying, setIsCopying] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const humanDateLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${formattedWeekday} - ${selectedDate
      .split("-")
      .reverse()
      .join("/")}`;
  }, [selectedDate]);

  const { data: doctorProfile, isLoading: doctorProfileLoading } =
    useDoctorProfile();
  const doctorId = doctorProfile?.id;

  const emptySchedules: DynamicResponse<DoctorSchedule> = useMemo(
    () => ({
      data: [],
      metaData: { total: 0, page: 1, size: 0, totalPages: 0 },
    }),
    []
  );

  const slotsQuery = useQuery<DynamicResponse<TimeSlot>>({
    queryKey: ["doctor", "schedule", "slots", doctorId],
    enabled: !!doctorId,
    retry: false,
    queryFn: async (): Promise<DynamicResponse<TimeSlot>> => {
      try {
        const response = await api.slot.getSlots({
          DoctorId: doctorId,
          Page: 1,
          Size: 10,
        });
        return (
          response ?? {
            data: [],
            metaData: { total: 0, page: 1, size: 0, totalPages: 0 },
          }
        );
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return {
            data: [],
            metaData: { total: 0, page: 1, size: 0, totalPages: 0 },
          };
        }
        const message =
          error?.response?.data?.message || "Unable to load time slots.";
        toast.error(message);
        return {
          data: [],
          metaData: { total: 0, page: 1, size: 0, totalPages: 0 },
        };
      }
    },
  });

  const { data, isFetching } = useQuery<DynamicResponse<DoctorSchedule>>({
    queryKey: ["doctor", "schedule", doctorId, selectedDate],
    enabled: !!doctorId,
    retry: false,
    queryFn: async (): Promise<DynamicResponse<DoctorSchedule>> => {
      if (!doctorId) {
        return emptySchedules;
      }

      try {
        const response = await api.doctorSchedule.getSchedulesByDoctor(
          doctorId,
          {
            WorkDate: selectedDate,
            Page: 1,
            Size: 25,
          }
        );
        return response ?? emptySchedules;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return emptySchedules;
        }
        const message =
          error?.response?.data?.message || "Unable to load work schedule.";
        toast.error(message);
        return emptySchedules;
      }
    },
  });

  const slots = (
    slotsQuery.data?.data?.length ? slotsQuery.data.data : DEFAULT_SLOTS
  ) as TimeSlot[];

  const handleShiftDay = (offset: number) => {
    const base = new Date(`${selectedDate}T00:00:00`);
    base.setDate(base.getDate() + offset);
    setSelectedDate(base.toISOString().split("T")[0]);
  };

  const handleResetToday = () => {
    if (selectedDate !== today) {
      setSelectedDate(today);
    }
  };

  const handleSelectAllSlots = () => {
    setSelectedSlots(slots.map((slot) => slot.id));
  };

  const handleClearSlots = () => {
    setSelectedSlots([]);
  };

  const handleRefresh = () => {
    if (!doctorId) {
      return;
    }
    queryClient.invalidateQueries({
      queryKey: ["doctor", "schedule", doctorId, selectedDate],
    });
    queryClient.invalidateQueries({
      queryKey: ["doctor", "schedule", "slots", doctorId],
    });
  };

  const schedulesForDay = useMemo(() => {
    const normalizeDate = (value?: string) => value?.split("T")[0] ?? value;
    return (data?.data ?? []).filter(
      (schedule) => normalizeDate(schedule.workDate) === selectedDate
    );
  }, [data?.data, selectedDate]);

  const resolveSlotMatch = (schedule: DoctorSchedule) => {
    if (schedule.slotId) {
      return schedule.slotId;
    }
    const scheduleStart = (schedule.startTime ?? "").slice(0, 5);
    const scheduleEnd = (schedule.endTime ?? "").slice(0, 5);
    const matchedSlot = slots.find((slot) => {
      const slotStart = (slot.startTime ?? "").slice(0, 5);
      const slotEnd = (slot.endTime ?? "").slice(0, 5);
      return slotStart === scheduleStart && slotEnd === scheduleEnd;
    });
    return matchedSlot?.id;
  };

  const schedulesBySlot = useMemo(() => {
    const map = new Map<string, DoctorSchedule>();
    schedulesForDay.forEach((schedule) => {
      const slotKey = resolveSlotMatch(schedule);
      if (slotKey) {
        map.set(slotKey, schedule);
      }
    });
    return map;
  }, [schedulesForDay, slots]);

  const handleCopyPreviousDay = async () => {
    if (!doctorId) {
      toast.error("Unable to find doctor information.");
      return;
    }

    setIsCopying(true);
    try {
      const base = new Date(`${selectedDate}T00:00:00`);
      base.setDate(base.getDate() - 1);
      const previousDate = base.toISOString().split("T")[0];

      const response = await api.doctorSchedule.getSchedulesByDoctor(doctorId, {
        WorkDate: previousDate,
        Page: 1,
        Size: 25,
      });

      const previousSchedules = response?.data ?? [];
      if (!previousSchedules.length) {
        toast.info("No schedule from the previous day to copy.");
        return;
      }

      const slotIdSet = new Set<string>();
      previousSchedules.forEach((schedule) => {
        const slotKey = schedule.slotId || resolveSlotMatch(schedule);
        if (slotKey) {
          slotIdSet.add(slotKey);
        }
      });

      if (!slotIdSet.size) {
        toast.warning("No matching time slots to copy.");
        return;
      }

      const orderedSelection = slots
        .filter((slot) => slotIdSet.has(slot.id))
        .map((slot) => slot.id);

      setSelectedSlots(orderedSelection);
      setLocation(previousSchedules[0]?.location || "Clinic A");
      setNotes(previousSchedules[0]?.notes || "");
      toast.success(
        `Copied ${orderedSelection.length} time slots from ${previousDate
          .split("-")
          .reverse()
          .join("/")}.`
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to copy the previous day's schedule.";
      toast.error(message);
    } finally {
      setIsCopying(false);
    }
  };

  const activeSlotIds = useMemo(() => {
    return schedulesForDay
      .filter((schedule) => schedule.isAvailable !== false)
      .map((schedule) => resolveSlotMatch(schedule))
      .filter((id): id is string => Boolean(id));
  }, [schedulesForDay, slots]);

  const selectedSlotDetails = useMemo(() => {
    return slots
      .filter((slot) => selectedSlots.includes(slot.id))
      .map((slot) => ({
        id: slot.id,
        label: `${(slot.startTime ?? "").slice(0, 5)} - ${(slot.endTime ?? "").slice(0, 5)}`,
        notes: slot.notes,
      }));
  }, [slots, selectedSlots]);

  const savedLocation = schedulesForDay[0]?.location || "";
  const savedNotes = schedulesForDay[0]?.notes || "";
  const hasSavedSchedules = schedulesForDay.length > 0;

  const unsavedChanges = useMemo(() => {
    const currentSet = new Set(selectedSlots);
    const activeSet = new Set(activeSlotIds);
    const slotsChanged =
      currentSet.size !== activeSet.size ||
      activeSlotIds.some((id) => !currentSet.has(id));

    const locationChanged = hasSavedSchedules
      ? (location || "") !== (savedLocation || "")
      : (location || "") !== "Clinic A";

    const notesChanged = hasSavedSchedules
      ? (notes || "") !== (savedNotes || "")
      : Boolean(notes);

    return slotsChanged || locationChanged || notesChanged;
  }, [
    selectedSlots,
    activeSlotIds,
    location,
    notes,
    savedLocation,
    savedNotes,
    hasSavedSchedules,
  ]);

  useEffect(() => {
    setSelectedSlots((prev) => {
      if (
        prev.length === activeSlotIds.length &&
        prev.every((id, index) => id === activeSlotIds[index])
      ) {
        return prev;
      }
      return activeSlotIds;
    });

    if (schedulesForDay.length) {
      const nextLocation = schedulesForDay[0]?.location || "Clinic A";
      const nextNotes = schedulesForDay[0]?.notes || "";

      setLocation((current) =>
        current === nextLocation ? current : nextLocation
      );
      setNotes((current) => (current === nextNotes ? current : nextNotes));
    } else {
      setLocation((current) => (current === "Clinic A" ? current : "Clinic A"));
      setNotes((current) => (current === "" ? current : ""));
    }
  }, [schedulesForDay, slots]);

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const saveSlotsMutation = useMutation({
    mutationFn: async () => {
      if (!doctorId) {
        throw new Error("Unable to find doctor information.");
      }

      const workDateValue = selectedDate;
      const selectedSet = new Set(selectedSlots);

      const deletePromises = schedulesForDay.map((schedule) =>
        api.doctorSchedule
          .deleteDoctorSchedule(schedule.id)
          .catch((error: any) => {
            if (isAxiosError(error) && error.response?.status === 404) {
              return Promise.resolve();
            }
            throw error;
          })
      );

      await Promise.all(deletePromises);

      if (!selectedSet.size) {
        return { created: 0, failed: 0 };
      }

      let createdCount = 0;
      let failedCount = 0;
      const errors: Array<{ slotId: string; message: string }> = [];

      for (const slot of slots) {
        if (!selectedSet.has(slot.id)) {
          continue;
        }

        try {
          await api.doctorSchedule.createDoctorSchedule({
            doctorId,
            DoctorId: doctorId,
            AccountId: doctorProfile?.accountId,
            slotId: slot.id,
            SlotId: slot.id,
            workDate: workDateValue,
            WorkDate: workDateValue,
            startTime: slot.startTime,
            endTime: slot.endTime,
            StartTime: slot.startTime,
            EndTime: slot.endTime,
            location: location || undefined,
            Location: location || undefined,
            notes: notes || undefined,
            Notes: notes || undefined,
            isAvailable: true,
            IsAvailable: true,
          } as DoctorSchedulePayload);
          createdCount += 1;
        } catch (error: any) {
          failedCount += 1;
          errors.push({
            slotId: slot.id,
            message:
              error?.response?.data?.message ||
              error?.message ||
              "Unable to create this time slot.",
          });
        }
      }

      return { created: createdCount, failed: failedCount, errors };
    },
    onSuccess: ({ created, failed, errors }) => {
      if (created && !failed) {
        toast.success(
          `Saved ${created} shifts for ${selectedDate.split("-").reverse().join("/")}.`
        );
      } else if (!created && !failed) {
        toast.success("Deleted the schedule for this day.");
      } else {
        toast.warning(
          `Saved ${created} time slots, ${failed} time slots failed.`
        );
        if (errors?.length) {
          errors.slice(0, 3).forEach((err) => {
            toast.error(`Slot ${err.slotId}: ${err.message}`);
          });
        }
      }
      queryClient.invalidateQueries({
        queryKey: ["doctor", "schedule", doctorId, selectedDate],
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to update the work schedule.";
      toast.error(message);
    },
  });

  const scheduleEntries = useMemo(
    () =>
      schedulesForDay.map((slot) => ({
        ...slot,
        startDisplay: (slot.startTime ?? "").slice(0, 5),
        endDisplay: (slot.endTime ?? "").slice(0, 5),
      })),
    [schedulesForDay]
  );

  return (
    <ProtectedRoute allowedRoles={["Doctor"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {!doctorProfileLoading && !doctorId ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No doctor profile found for this account. Please contact the
              administrator for access.
            </div>
          ) : null}

          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">My schedule</h1>
            <p className="text-gray-600">
              Manage consultations, procedures, and availability. The schedule
              syncs with the Appointments module.
            </p>
          </section>

          <Card>
            <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <CardTitle>Select date</CardTitle>
                <p className="text-sm text-gray-500">{humanDateLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShiftDay(-1)}
                >
                  Previous day
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShiftDay(1)}
                >
                  Next day
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetToday}
                  disabled={selectedDate === today}
                >
                  Today
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                  }}
                  className="w-[160px]"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              {isFetching ? (
                <div className="py-6 text-center text-gray-500">
                  Loading schedule...
                </div>
              ) : scheduleEntries.length ? (
                scheduleEntries.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col gap-1 rounded-lg border border-gray-100 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {slot.startDisplay} - {slot.endDisplay}
                      </p>
                      <p className="text-gray-500">
                        {slot.location || "Clinic"}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Notes: {slot.notes || "(None)"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-500">
                  You don't have a schedule for this day.
                </div>
              )}
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Select working time slots</CardTitle>
                  <p className="text-sm text-gray-500">
                    The system provides four default slots. Pick the ones you
                    will accept on {selectedDate.split("-").reverse().join("/")}
                    .
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllSlots}
                    disabled={!slots.length}
                  >
                    Select all
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSlots}
                    disabled={!selectedSlots.length}
                  >
                    Clear selection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPreviousDay}
                    disabled={isCopying || !doctorId}
                  >
                    {isCopying ? "Copying..." : "Copy yesterday"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {slotsQuery.isFetching ? (
                  <div className="py-6 text-center text-gray-500">
                    Loading default time slots...
                  </div>
                ) : slots.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {slots.map((slot) => {
                      const checked = selectedSlots.includes(slot.id);
                      const linkedSchedule = schedulesBySlot.get(slot.id);
                      const slotLabelStart = (slot.startTime ?? "").slice(0, 5);
                      const slotLabelEnd = (slot.endTime ?? "").slice(0, 5);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleSlotSelection(slot.id)}
                          className={cn(
                            "rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary/40",
                            checked
                              ? "border-primary bg-primary/10 shadow"
                              : "border-gray-200 bg-white hover:border-primary"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-base font-semibold text-gray-900">
                              {slotLabelStart} - {slotLabelEnd}
                            </p>
                            {checked ? (
                              <span className="text-xs font-medium text-primary">
                                Selected
                              </span>
                            ) : linkedSchedule ? (
                              <span className="text-xs text-gray-500">
                                Saved
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {linkedSchedule?.isAvailable === false
                              ? "Disabled"
                              : slot.notes || "Default time slot"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    Default time slot configuration not found. Please contact
                    the administrator.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <Input
                      placeholder="Clinic A"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      className="min-h-[100px] w-full rounded-md border border-gray-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Additional information for the team, e.g. procedures requiring preparation."
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily overview</CardTitle>
                  <p
                    className={cn(
                      "text-sm",
                      unsavedChanges ? "text-amber-600" : "text-gray-500"
                    )}
                  >
                    {unsavedChanges
                      ? "You have unsaved changes for this day."
                      : "The schedule is in sync with the saved data."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-5 text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900">
                      Selected time slots
                    </p>
                    {selectedSlotDetails.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {selectedSlotDetails.map((slot) => (
                          <li
                            key={slot.id}
                            className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                          >
                            <span className="font-medium text-gray-900">
                              {slot.label}
                            </span>
                            {slot.notes && (
                              <span className="text-[11px] text-gray-500">
                                {slot.notes}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        No time slots selected.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">Saved schedule</p>
                    {scheduleEntries.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {scheduleEntries.map((entry) => (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                          >
                            <span className="font-medium text-gray-900">
                              {entry.startDisplay} - {entry.endDisplay}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {entry.location || "Clinic"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">
                        No schedule has been saved for this day.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gray-500">
                    <p>
                      Current location:{" "}
                      <span className="font-medium text-gray-900">
                        {location || "Clinic A"}
                      </span>
                    </p>
                    <p>
                      Notes:{" "}
                      <span className="font-medium text-gray-900">
                        {notes ? notes : "None yet"}
                      </span>
                    </p>
                    {hasSavedSchedules ? (
                      <p className="text-[11px] text-gray-400">
                        Previously saved at{" "}
                        <span className="font-medium text-gray-700">
                          {savedLocation || "Clinic A"}
                        </span>
                        .
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400">
                        No schedule has been saved previously.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={cn(
                "text-sm",
                unsavedChanges ? "text-amber-600" : "text-gray-500"
              )}
            >
              {unsavedChanges
                ? "Unsaved changes detected. Click 'Save schedule' to update the system."
                : "No changes compared with the saved data."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={saveSlotsMutation.isPending}
              >
                Reload data
              </Button>
              <Button
                type="button"
                disabled={saveSlotsMutation.isPending || !doctorId}
                onClick={() => {
                  if (!selectedSlots.length) {
                    toast.info(
                      "You haven't selected any time slots. Active slots will be turned off."
                    );
                  }
                  saveSlotsMutation.mutate();
                }}
              >
                {saveSlotsMutation.isPending ? "Saving..." : "Save schedule"}
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
