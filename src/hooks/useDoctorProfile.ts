import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Doctor } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";

export function useDoctorProfile() {
  const { user } = useAuth();

  return useQuery<Doctor | null>({
    queryKey: ["doctor", "profile", user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async (): Promise<Doctor | null> => {
      if (!user?.id) {
        return null;
      }

      try {
        const response = await api.doctor.getDoctors({
          AccountId: user.id,
          Page: 1,
          Size: 1,
        });
        const doctor = response.data?.[0] ?? null;

        if (!doctor) {
          toast.warning("No doctor profile found for the current account.");
        }

        return doctor;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          toast.warning("No doctor profile found for the current account.");
          return null;
        }

        const message =
          error?.response?.data?.message || "Unable to load doctor profile.";
        toast.error(message);
        throw error;
      }
    },
  });
}
